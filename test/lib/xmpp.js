'use strict'
/* eslint-env mocha */

const Xmpp = require('../../index').Xmpp
const should = require('should')
const ltx = require('ltx')
const helper = require('../helper')

/* jshint -W030 */
describe('FTW', function () {
  let ftw = null
  let socket = null
  let xmpp = null

  beforeEach(function () {
    socket = new helper.SocketEventer()
    xmpp = new helper.XmppEventer()
    ftw = new Xmpp(socket)
    ftw.client = xmpp
    xmpp.end = () => this.emit('end')
    ftw.fullJid = {
      domain: 'dreams.org',
      user: 'bottom',
      local: 'bottom',
      resource: 'spell'
    }
  })

  describe('Returns JID parts', function () {
    beforeEach(function () {
      ftw.fullJid = {
        user: 'marty',
        domain: 'mcf.ly',
        resource: 'thefuture'
      }
    })

    it('Returns full JID', function () {
      ftw.getJidType('full').should.equal(
        ftw.fullJid.user + '@' +
        ftw.fullJid.domain + '/' +
        ftw.fullJid.resource
      )
    })

    it('Returns bare JID', function () {
      ftw.getJidType('bare').should.equal(
        ftw.fullJid.user + '@' +
        ftw.fullJid.domain
      )
    })

    it('Returns domain', function () {
      ftw.getJidType('domain').should.equal(
        ftw.fullJid.domain
      )
    })

    it('Returns undefined for unknown JID part type', function () {
      should.not.exist(ftw.getJidType('all'))
    })
  })

  describe('Tracking IDs', function () {
    it('Should error if no ID provided', function (done) {
      try {
        ftw.trackId()
        done('Expected exception')
      } catch (e) {
        e.message.should.equal(ftw.MISSING_STANZA_ID)
        done()
      }
    })

    it('Should accept an ID and capture', function (done) {
      const stanza = ltx.parse('<iq id="1" />')
      ftw.trackId('1', (payload) => {
        payload.should.eql(stanza)
        done()
      })
      ftw.catchTracked(stanza).should.be.true
    })

    it('Should return false if untracked ID', function () {
      const stanza = ltx.parse('<iq id="2" />')
      ftw.trackId('1', () => {})
      ftw.catchTracked(stanza).should.be.false
    })

    it('Should return false if no ID attribute', function () {
      const stanza = ltx.parse('<iq />')
      ftw.trackId('1', () => {})
      ftw.catchTracked(stanza).should.be.false
    })

    it('Should error if no callback provided', function (done) {
      try {
        ftw.trackId('1')
        done('Expected exception')
      } catch (e) {
        e.message.should.equal(ftw.MISSING_CALLBACK)
        done()
      }
    })

    it('Should error if non-function callback provided', function (done) {
      try {
        ftw.trackId('3', true)
        done('Expected exception')
      } catch (e) {
        e.message.should.equal(ftw.INVALID_CALLBACK)
        done()
      }
    })

    it('Should accept a stanza and capture', function (done) {
      const incomingStanza = ltx.parse('<iq id="4" />')
      const outGoingStanza = incomingStanza
      incomingStanza.attrs.from = ftw.fullJid.domain
      ftw.trackId(outGoingStanza, (payload) => {
        payload.should.eql(incomingStanza)
        done()
      })
      ftw.catchTracked(incomingStanza).should.be.true
    })

    it('Errors if stanza has no ID attribute', function (done) {
      try {
        const outgoingStanza = ltx.parse('<iq />')
        ftw.trackId(outgoingStanza, () => {})
        done('Expected exception')
      } catch (e) {
        e.message.should.equal(ftw.MISSING_STANZA_ID)
        done()
      }
    })

    it('Reduces tracked queue after making callback', function (done) {
      const incomingStanza = ltx.parse('<iq id="4" />')
      const outGoingStanza = incomingStanza
      incomingStanza.attrs.from = ftw.fullJid.domain
      Object.keys(ftw.tracking).length.should.equal(0)
      ftw.trackId(outGoingStanza, (payload) => {
        payload.should.eql(incomingStanza)
        Object.keys(ftw.tracking).length.should.equal(0)
        done()
      })
      Object.keys(ftw.tracking).length.should.equal(1)
      ftw.catchTracked(incomingStanza).should.be.true
    })
  })

  describe('Stanza ID spoofing protection', function () {
    beforeEach(function () {
      ftw.fullJid = {
        user: 'marty',
        domain: 'mcf.ly',
        resource: 'thefuture'
      }
    })

    it('Should track a stanza from the same full JID', function (done) {
      const jid = 'you@example.com/resource'
      const id = '10'
      const outgoingStanza = ltx.parse(
        `<iq to="${jid}" id="${id}" />`
      )
      ftw.trackId(outgoingStanza, (stanza) => {
        stanza.attr('id').should.equal(id)
        stanza.attr('from').should.equal(jid)
        done()
      })
      const incomingStanza = outgoingStanza.clone()
      incomingStanza.attrs.from = incomingStanza.attrs.to
      delete incomingStanza.attrs.to
      ftw.catchTracked(incomingStanza).should.be.true
    })

    it('Shouldn\'t track a stanza from a different JID', function (done) {
      const jid = 'you@example.com/resource'
      const wrongJid = 'me@example.com/place'
      const id = '10'
      const outgoingStanza = ltx.parse(
        `<iq to="${jid}" id="${id}" />`
      )
      ftw.trackId(outgoingStanza, () => done('Should not have tracked stanza'))
      const incomingStanza = outgoingStanza.clone()
      incomingStanza.attrs.from = wrongJid
      delete incomingStanza.attrs.to
      /* True as we have captured stanza, but it an
       * ID spoof so we don't want to do any more processing
       */
      ftw.catchTracked(incomingStanza).should.be.true
      done()
    })

    it('Shouldn\'t track a stanza from the bare JID', function (done) {
      const jid = 'you@example.com/resource'
      const wrongJid = jid.split('/')[0]
      const id = '10'
      const outgoingStanza = ltx.parse(
        `<iq to="${jid}" id="${id}" />`
      )
      ftw.trackId(outgoingStanza, () => done('Should not have tracked stanza'))
      const incomingStanza = outgoingStanza.clone()
      incomingStanza.attrs.from = wrongJid
      delete incomingStanza.attrs.to
      /* True as we have captured stanza, but it an
       * ID spoof so we don't want to do any more processing
       */
      ftw.catchTracked(incomingStanza).should.be.true
      done()
    })

    describe('No \'to\' address', function () {
      it('Accepts server JID response', function (done) {
        const id = '10'
        const outgoingStanza = ltx.parse(
          `<iq id="${id}" />`
        )
        ftw.trackId(outgoingStanza, (stanza) => {
          stanza.attrs.from.should.equal(ftw.getJidType('domain'))
          stanza.attrs.id.should.equal(id)
          done()
        })
        const incomingStanza = outgoingStanza.clone()
        incomingStanza.attrs.from = ftw.getJidType('domain')
        delete incomingStanza.attrs.to
        ftw.catchTracked(incomingStanza).should.be.true
      })

      it('Accepts bare JID response', function (done) {
        const id = '10'
        const outgoingStanza = ltx.parse(
          `<iq id="${id}" />`
        )
        ftw.trackId(outgoingStanza, (stanza) => {
          stanza.attrs.from.should.equal(ftw.getJidType('bare'))
          stanza.attrs.id.should.equal(id)
          done()
        })
        const incomingStanza = outgoingStanza.clone()
        incomingStanza.attrs.from = ftw.getJidType('bare')
        delete incomingStanza.attrs.to
        ftw.catchTracked(incomingStanza).should.be.true
      })
    })

    describe('No response \'from\' address', function () {
      it('Accepts server JID response', function (done) {
        const id = '10'
        const outgoingStanza = ltx.parse(
          `<iq id="${id}" />`
        )
        ftw.trackId(outgoingStanza, (stanza) => {
          should.not.exist(stanza.attrs.from)
          stanza.attrs.id.should.equal(id)
          done()
        })
        const incomingStanza = outgoingStanza.clone()
        delete incomingStanza.attrs.from
        delete incomingStanza.attrs.to
        ftw.catchTracked(incomingStanza).should.be.true
      })
    })
  })

  describe('Login', function () {
    it.skip('Tries to logout before login', function (done) {
      ftw.client.once('end', () => done())
      socket.send('xmpp.login', {})
    })

    it.skip('Tries to logout before anonymous login', function (done) {
      ftw.client.once('end', () => done())
      socket.send('xmpp.login.anonymous', {})
    })

    it('Handles login failure as expected', function (done) {
      socket.once('xmpp.error', (error) => {
        error.description.should.equal(ftw.error.message.AUTHENTICATION_FAIL)
        error.type.should.equal(ftw.error.type.AUTH)
        error.condition.should.equal(ftw.error.condition.LOGIN_FAIL)
        done()
      })
      ftw.handleError('XMPP authentication failure')
    })

    it('Emits online event once online', function (done) {
      const jid = {
        local: 'test',
        domain: 'exmaple.com',
        resource: 'mobile'
      }
      ftw.on('client:online', (data) => {
        data.jid.should.equal(jid)
        done()
      })
      ftw.fullJid = jid
      ftw.online()
    })
  })

  describe('Errors', function () {
    const errorMessages = require('../../lib/utils/errors')

    it('Sends expected registration fail message', function (done) {
      socket.once('xmpp.error', (error) => {
        error.type.should.equal(errorMessages.type.AUTH)
        error.condition
          .should.equal(errorMessages.condition.REGISTRATION_FAIL)
        error.description.should.equal(ftw.REGISTRATION_ERROR)
        done()
      })
      ftw.handleError({ message: ftw.REGISTRATION_ERROR })
    })

    it('Sends expected authentication fail message', function (done) {
      socket.once('xmpp.error', (error) => {
        error.type.should.equal(errorMessages.type.AUTH)
        error.condition.should.equal(errorMessages.condition.LOGIN_FAIL)
        error.description
          .should.equal(errorMessages.message.AUTHENTICATION_FAIL)
        done()
      })
      ftw.handleError(ftw.AUTHENTICATION_ERROR)
    })

    it('Sends expected disconnection fail message', function (done) {
      socket.once('xmpp.error', (error) => {
        error.type.should.equal(errorMessages.type.CONNECTION)
        error.condition.should.equal(errorMessages.condition.DISCONNECTED)
        error.description
          .should.equal(errorMessages.message.DISCONNECTED)
        done()
      })
      ftw.handleError(errorMessages.condition.DISCONNECTED)
    })

    it('Sends expected not connected message', function (done) {
      socket.once('xmpp.error', (error) => {
        error.type.should.equal(errorMessages.type.CONNECTION)
        error.condition
          .should.equal(errorMessages.condition.NOT_CONNECTED)
        error.description
          .should.equal(errorMessages.message.NOT_CONNECTED)
        done()
      })
      ftw.handleError(errorMessages.condition.NOT_CONNECTED)
    })

    it('Handles unknown error', function (done) {
      socket.once('xmpp.error', (error) => {
        error.type.should.equal(errorMessages.type.CANCEL)
        error.condition
          .should.equal(errorMessages.condition.UNKNOWN)
        should.not.exist(error.description)
        done()
      })
      ftw.handleError()
    })
  })
})
