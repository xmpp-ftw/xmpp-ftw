'use strict'
/* eslint-env mocha */

const should = require('should')
const Roster = require('../../index').Roster
const ltx = require('node-xmpp-client').ltx
const helper = require('../helper')

/* jshint -W030 */
describe('Roster', function () {
  let roster = null
  let socket = null
  let xmpp = null
  let manager = null

  beforeEach(function () {
    socket = new helper.SocketEventer()
    xmpp = new helper.XmppEventer()
    manager = {
      socket: socket,
      client: xmpp,
      jid: 'bottom@dreams.org',
      trackId: (id, callback) => {
        if (typeof id !== 'object') {
          throw new Error('Stanza protection ID not added')
        }
        this.callback = callback
      },
      makeCallback: (error, data) => this.callback(error, data)
    }
    roster = new Roster()
    roster.init(manager)
  })

  describe('Can handle incoming roster IQs', function () {
    it('Shouldn\'t handle non-roster IQs', function () {
      roster.handles(ltx.parse('<iq/>')).should.be.false
    })

    it('Shouldn\'t handle non-matching query child', function () {
      roster.handles(ltx.parse('<iq><query/></iq>')).should.be.false
    })

    it('Should confirm it can handle roster IQs', function () {
      const request = ltx.parse(`<iq><query xmlns="${roster.NS}"/></iq>`)
      roster.handles(request).should.be.true
    })

    it('Should return false from \'handle\' with non-set stanza', function () {
      const request = ltx.parse(
        `<iq type="get"><query xmlns="${roster.NS}"/></iq>`
      )
      roster.handle(request).should.be.false
    })

    describe('Roster push', function () {
      it('Handles no groups', function (done) {
        socket.once('xmpp.roster.push', (data) => {
          data.jid.should.eql({
            user: 'mapbot',
            domain: 'wonderland.lit'
          })
          data.subscription.should.equal('both')
          should.not.exist(data.groups)
          data.ask.should.equal('subscribe')
          done()
        })
        roster.handle(helper.getStanza('roster/roster-push-no-groups'))
                    .should.be.true
      })

      it('Can handle roster push', function (done) {
        socket.once('xmpp.roster.push', (data) => {
          data.jid.should.eql({
            user: 'mapbot',
            domain: 'wonderland.lit'
          })
          data.groups.should.eql(['Bots', 'Local'])
          done()
        })
        roster.handle(helper.getStanza('roster/roster-push'))
                   .should.be.true
      })
    })
  })

  describe('Can send roster IQ stanzas', function () {
    describe('Add a user to roster', function () {
      it('Returns error when no jid provided', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.send('xmpp.roster.add', {}, (error, success) => {
          should.not.exist(success)
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing \'jid\' key')
          error.request.should.eql({})
          done()
        })
      })

      it('Errors when no callback provided', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.once('xmpp.error.client', (error) => {
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing callback')
          error.request.should.eql({})
          done()
        })
        socket.send('xmpp.roster.add', {})
      })

      it('Errors when non-function callback provided', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.once('xmpp.error.client', (error) => {
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing callback')
          error.request.should.eql({})
          done()
        })
        socket.send('xmpp.roster.add', {}, true)
      })

      it('Sends expected add stanza', function (done) {
        const jid = 'alice@wonderland.lit'
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('set')
          should.exist(stanza.attrs.id)
          manager.makeCallback(ltx.parse('<iq type="result" />'))
        }
                )
        const callback = (error, success) => {
          should.not.exist(error)
          success.should.be.true
          done()
        }
        socket.send('xmpp.roster.add', { jid: jid }, callback)
      })

      it('Can handle roster add with additional data', function (done) {
        const request = {
          jid: 'alice@wonderland.lit',
          groups: [ 'group1', 'group2' ],
          name: 'Alice'
        }
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('set')
          should.exist(stanza.attrs.id)
          const query = stanza.getChild('query', roster.NS)
          const item = query.getChild('item')
          item.attrs.jid.should.equal(request.jid)
          item.attrs.name.should.equal(request.name)
          item.getChildren('group').length.should.equal(2)
          item.getChildren('group')[0].getText()
            .should.equal('group1')
          item.getChildren('group')[1].getText()
            .should.equal('group2')
          manager.makeCallback(ltx.parse('<iq type="result" />'))
        }
                )
        const callback = (error, success) => {
          should.not.exist(error)
          success.should.be.true
          done()
        }
        socket.send('xmpp.roster.add', request, callback)
      })

      it('Can handle error response', function (done) {
        const jid = 'alice@wonderland.lit'
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('set')
          should.exist(stanza.attrs.id)
          const query = stanza.getChild('query', roster.NS)
          query.getChild('item').attrs.jid.should.equal(jid)
          manager.makeCallback(helper.getStanza('iq-error'))
        })
        const callback = (error, success) => {
          should.not.exist(success)
          error.should.eql({
            type: 'cancel',
            condition: 'error-condition',
            application: {
              condition: 'unknown-error',
              xmlns: 'http://jabber.org/protocol/pubsub#errors'
            }
          })
          done()
        }
        socket.send('xmpp.roster.add', { jid }, callback)
      })
    })

    describe('Roster retrieval', function () {
      it('Can get roster', function (done) {
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('get')
          should.exist(stanza.attrs.id)
          should.not.exist(stanza.attrs.to)
          stanza.attrs.from.should.containEql(manager.jid)
          should.exist(stanza.getChild('query', roster.NS))
          manager.makeCallback(helper.getStanza('roster/get'))
        }
                )
        const callback = (error, roster) => {
          should.not.exist(error)
          roster.length.should.equal(2)
          roster[0].jid.should.eql({
            domain: 'example.net',
            user: 'juliet'
          })
          roster[0].subscription.should.equal('from')
          roster[0].groups.should.eql(['colleagues', 'buddies'])
          should.not.exist(roster[0].name)
          should.not.exist(roster[0].ask)
          roster[1].jid.should.eql({
            domain: 'example.com',
            user: 'romeo'
          })
          roster[1].subscription.should.equal('none')
          roster[1].name.should.equal('Romeo')
          roster[1].ask.should.equal('subscribe')
          should.not.exist(roster[1].groups)
          done()
        }
        socket.send('xmpp.roster.get', {}, callback)
      })

      it('Errors when no callback provided', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.once('xmpp.error.client', (error) => {
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing callback')
          should.not.exist(error.request)
          xmpp.removeAllListeners('stanza')
          done()
        })
        socket.send('xmpp.roster.get', {})
      })

      it('Errors when non-function callback provided', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.once('xmpp.error.client', (error) => {
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing callback')
          should.not.exist(error.request)
          xmpp.removeAllListeners('stanza')
          done()
        })
        socket.send('xmpp.roster.get', {}, true)
      })

      it('Can handle error response', function (done) {
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('get')
          should.exist(stanza.attrs.id)
          stanza.getChild('query', roster.NS).should.exist
          manager.makeCallback(helper.getStanza('iq-error'))
        }
                    )
        const callback = (error, success) => {
          should.not.exist(success)
          error.should.eql({
            type: 'cancel',
            condition: 'error-condition',
            application: {
              condition: 'unknown-error',
              xmlns: 'http://jabber.org/protocol/pubsub#errors'
            }
          })
          done()
        }
        socket.send('xmpp.roster.get', {}, callback)
      })
    })

    describe('Edit roster', function () {
      it('Not providing \'jid\' returns error', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.send('xmpp.roster.edit', {}, (error, success) => {
          should.not.exist(success)
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing \'jid\' key')
          error.request.should.eql({})
          xmpp.removeAllListeners('stanza')
          done()
        })
      })

      it('Not providing \'groups\' return error', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        const request = { jid: 'juliet@example.com' }
        socket.send('xmpp.roster.edit', request, (error, success) => {
          should.not.exist(success)
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing \'groups\' key')
          error.request.should.eql(request)
          xmpp.removeAllListeners('stanza')
          done()
        })
      })

      it('Not passing array for \'groups\' returns error', function (done) {
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        const request = {
          jid: 'juliet@example.com',
          groups: { 0: 'group1' }
        }
        socket.send('xmpp.roster.edit', request, (error, success) => {
          should.not.exist(success)
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Groups should be an array')
          error.request.should.eql(request)
          xmpp.removeAllListeners('stanza')
          done()
        })
      })

      it('Handles error response stanza', function (done) {
        const request = {
          jid: 'alice@wonderland.lit',
          groups: [ 'group1', 'group2' ]
        }
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('set')
          should.exist(stanza.attrs.id)
          const query = stanza.getChild('query', roster.NS)
          query.getChild('item').attrs.jid.should.equal(request.jid)
          manager.makeCallback(helper.getStanza('iq-error'))
        })
        const callback = (error, success) => {
          should.not.exist(success)
          error.should.eql({
            type: 'cancel',
            condition: 'error-condition',
            application: {
              condition: 'unknown-error',
              xmlns: 'http://jabber.org/protocol/pubsub#errors'
            }
          })
          done()
        }
        socket.send('xmpp.roster.edit', request, callback)
      })

      it('Allows the setting of roster groups', function (done) {
        const request = {
          jid: 'alice@wonderland.lit',
          groups: [ 'group1', 'group2' ]
        }
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('set')
          should.exist(stanza.attrs.id)
          const item = stanza.getChild('query', roster.NS)
            .getChild('item')
          item.attrs.jid.should.equal(request.jid)
          item.getChildren('group').length.should.equal(2)
          item.getChildren('group')[0].getText().should.equal('group1')
          item.getChildren('group')[1].getText().should.equal('group2')
          manager.makeCallback(helper.getStanza('iq-result'))
        })
        const callback = (error, success) => {
          should.not.exist(error)
          success.should.be.true
          done()
        }
        socket.send('xmpp.roster.edit', request, callback)
      })

      it('Errors when no callback provided', function (done) {
        const request = {
          jid: 'alice@wonderland.lit',
          groups: [ 'group1', 'group2' ]
        }
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.once('xmpp.error.client', (error) => {
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing callback')
          error.request.should.eql(request)
          xmpp.removeAllListeners('stanza')
          done()
        })
        socket.send('xmpp.roster.edit', request)
      })

      it('Errors when non-function callback provided', function (done) {
        const request = {
          jid: 'alice@wonderland.lit',
          groups: [ 'group1', 'group2' ]
        }
        xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
        socket.once('xmpp.error.client', (error) => {
          error.type.should.equal('modify')
          error.condition.should.equal('client-error')
          error.description.should.equal('Missing callback')
          error.request.should.eql(request)
          xmpp.removeAllListeners('stanza')
          done()
        })
        socket.send('xmpp.roster.edit', request, true)
      })

      it('Can handle name field', function (done) {
        const request = {
          jid: 'alice@wonderland.lit',
          groups: [],
          name: 'Alice'
        }
        xmpp.once('stanza', (stanza) => {
          stanza.is('iq').should.be.true
          stanza.attrs.type.should.equal('set')
          should.exist(stanza.attrs.id)
          const query = stanza.getChild('query', roster.NS)
          query.getChild('item').attrs.jid.should.equal(request.jid)
          query.getChild('item').attrs.name.should.equal(request.name)
          manager.makeCallback(helper.getStanza('iq-error'))
          done()
        })
        socket.send('xmpp.roster.edit', request, () => {})
      })
    })
  })

  describe('Remove a roster item', function () {
    it('Returns error when no jid provided', function (done) {
      xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
      socket.send('xmpp.roster.remove', {}, (error, success) => {
        should.not.exist(success)
        error.type.should.equal('modify')
        error.condition.should.equal('client-error')
        error.description.should.equal('Missing \'jid\' key')
        error.request.should.eql({})
        xmpp.removeAllListeners('stanza')
        done()
      })
    })

    it('Errors when no callback provided', function (done) {
      xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
      socket.once('xmpp.error.client', (error) => {
        error.type.should.equal('modify')
        error.condition.should.equal('client-error')
        error.description.should.equal('Missing callback')
        error.request.should.eql({})
        xmpp.removeAllListeners('stanza')
        done()
      })
      socket.send('xmpp.roster.remove', {})
    })

    it('Errors when non-function callback provided', function (done) {
      xmpp.once('stanza', () => done('Unexpected outgoing stanza'))
      socket.once('xmpp.error.client', (error) => {
        error.type.should.equal('modify')
        error.condition.should.equal('client-error')
        error.description.should.equal('Missing callback')
        error.request.should.eql({})
        xmpp.removeAllListeners('stanza')
        done()
      })
      socket.send('xmpp.roster.remove', {}, true)
    })

    it('Sends expected remove stanza', function (done) {
      const jid = 'alice@wonderland.lit'
      xmpp.once('stanza', (stanza) => {
        stanza.is('iq').should.be.true
        stanza.attrs.type.should.equal('set')
        should.exist(stanza.attrs.id)
        const item = stanza.getChild('query', roster.NS).getChild('item')
        item.should.exist
        item.attrs.jid.should.equal(jid)
        item.attrs.subscription.should.equal('remove')
        manager.makeCallback(ltx.parse('<iq type="result" />'))
      })
      const callback = (error, success) => {
        should.not.exist(error)
        success.should.be.true
        done()
      }
      socket.send('xmpp.roster.remove', { jid }, callback)
    })

    it('Can handle error response', function (done) {
      const jid = 'alice@wonderland.lit'
      xmpp.once('stanza', (stanza) => {
        stanza.is('iq').should.be.true
        stanza.attrs.type.should.equal('set')
        should.exist(stanza.attrs.id)
        const query = stanza.getChild('query', roster.NS)
        query.getChild('item').attrs.jid.should.equal(jid)
        manager.makeCallback(helper.getStanza('iq-error'))
      })
      const callback = (error, success) => {
        should.not.exist(success)
        error.should.eql({
          type: 'cancel',
          condition: 'error-condition',
          application: {
            condition: 'unknown-error',
            xmlns: 'http://jabber.org/protocol/pubsub#errors'
          }
        })
        done()
      }
      socket.send('xmpp.roster.remove', { jid }, callback)
    })
  })
})
