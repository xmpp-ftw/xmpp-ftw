var should  = require('should')
  , Roster  = require('../../lib/roster')
  , ltx     = require('ltx')
  , helper  = require('../helper')

describe('Roster', function() {

    var roster, socket, xmpp, manager

    before(function() {
        socket = new helper.Eventer()
        xmpp = new helper.Eventer()
        manager = {
            socket: socket,
            client: xmpp,
            jid: 'bottom@dreams.org',
            trackId: function(id, callback) {
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            }
        }
        roster = new Roster()
        roster.init(manager)
    })

    describe('Can handle incoming roster IQs', function() {
    
        it('Shouldn\'t handle non-roster IQs', function() {
            roster.handles(ltx.parse('<iq/>')).should.be.false
        })

        it('Shouldn\'t handle non-matching query child', function() {
            roster.handles(ltx.parse('<iq><query/></iq>')).should.be.false
        })

        it('Should confirm it can handle roster IQs', function() {
            var request = ltx.parse(
                '<iq><query xmlns="' + roster.NS + '"/></iq>'
            )
            roster.handles(request).should.be.true
        })

        it('Should return false from \'handle\' with non-set stanza', function() {
            var request = ltx.parse(
                '<iq type="get"><query xmlns="' + roster.NS + '"/></iq>'
            )
            roster.handle(request).should.be.false
        })
 
        describe('Roster push', function() {

            it('Handles no groups', function(done) {
                socket.once('xmpp.roster.push', function(data) {
                    data.jid.should.eql({
                        user: 'mapbot',
                        domain: 'wonderland.lit'
                    })
                    data.subscription.should.equal('both')
                    should.not.exist(data.groups)
                    done()
                })
                roster.handle(helper.getStanza('roster/roster-push-no-groups'))
                    .should.be.true
            })

            it('Can handle roster push', function(done) {
                socket.once('xmpp.roster.push', function(data) {
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

    describe('Can send roster IQ stanzas', function() {

       describe('Add a user to roster', function() {

           it('Returns error when no jid provided', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.emit('xmpp.roster.add', {}, function(error, success) {
                    should.not.exist(success)
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal("Missing 'jid' key")
                    error.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
           })
 
           it('Sends expected add stanza', function(done) {
                var jid = 'alice@wonderland.lit'
                xmpp.once('stanza', function(stanza) {
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('set')
                     should.exist(stanza.attrs.id)
                     manager.makeCallback(ltx.parse('<iq type="result" />'))
                })
                var callback = function(error, success) {
                    should.not.exist(error)
                    success.should.be.true
                    done()
                }
                socket.emit('xmpp.roster.add', { jid: jid }, callback)
           })

           it('Can handle roster add with additional data', function(done) {
                var request = {
                    jid: 'alice@wonderland.lit',
                    groups: [ 'group1', 'group2' ],
                    name: 'Alice'
                }
                xmpp.once('stanza', function(stanza) {
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('set')
                     should.exist(stanza.attrs.id)
                     var query = stanza.getChild('query', roster.NS)
                     var item  = query.getChild('item')
                     item.attrs.jid.should.equal(request.jid)
                     item.attrs.name.should.equal(request.name)
                     item.getChildren('group').length.should.equal(2)
                     item.getChildren('group')[0].getText().should.equal('group1')
                     item.getChildren('group')[1].getText().should.equal('group2')                     
                     manager.makeCallback(ltx.parse('<iq type="result" />'))
                })
                var callback = function(error, success) {
                    should.not.exist(error)
                    success.should.be.true
                    done()
                }
                socket.emit('xmpp.roster.add', request, callback)
            })
 
            it('Can handle error response', function(done) {
                var jid = 'alice@wonderland.lit'
                xmpp.once('stanza', function(stanza) {
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('set')
                     should.exist(stanza.attrs.id)
                     var query = stanza.getChild('query', roster.NS)
                     query.getChild('item').attrs.jid.should.equal(jid)
                     manager.makeCallback(helper.getStanza('iq-error'))
                })
                var callback = function(error, success) {
                    should.not.exist(success)
                    error.should.eql({
                        type: 'cancel',
                        condition: 'error-condition'
                    })
                    done()
                }
                socket.emit('xmpp.roster.add', { jid: jid }, callback)
            })

        })

        describe('Roster retrieval', function() {
 
            it('Can get roster', function(done) {
                xmpp.once('stanza', function(stanza) {
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('get')
                     should.exist(stanza.attrs.id)
                     should.exist(stanza.getChild('query', roster.NS))
                     manager.makeCallback(helper.getStanza('roster/get'))
                })
                var callback = function(error, roster) {
                    should.not.exist(error)
                    roster.length.should.equal(2)
                    roster[0].jid.should.eql({
                        domain: 'example.net', user: 'juliet'
                    })
                    roster[0].subscription.should.equal('from')
                    roster[0].groups.should.eql(['colleagues', 'buddies'])
                    should.not.exist(roster[0].name)
                    should.not.exist(roster[0].ask)
                    roster[1].jid.should.eql({
                        domain: 'example.com', user: 'romeo'
                    })
                    roster[1].subscription.should.equal('none')
                    roster[1].name.should.equal('Romeo')
                    roster[1].ask.should.equal('subscribe')
                    should.not.exist(roster[1].groups)
                    done()
                }
                socket.emit('xmpp.roster.get', {}, callback)
            })

            it('Can handle error response', function(done) {
                xmpp.once('stanza', function(stanza) {
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('get')
                     should.exist(stanza.attrs.id)
                     var query = stanza.getChild('query', roster.NS)
                     manager.makeCallback(helper.getStanza('iq-error'))
                })
                var callback = function(error, success) {
                    should.not.exist(success)
                    error.should.eql({
                        type: 'cancel',
                        condition: 'error-condition'
                    })
                    done()
                }
                socket.emit('xmpp.roster.get', {}, callback)
            })
  
        })

        describe('Set roster groups', function() {

           it('Not providing \'jid\' returns error', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.emit('xmpp.roster.group', {}, function(error, success) {
                    should.not.exist(success)
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal("Missing 'jid' key")
                    error.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
           })

           it('Not providing \'groups\' return error', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                var request = { jid: 'juliet@example.com' }
                socket.emit('xmpp.roster.group', request, function(error, success) {
                    should.not.exist(success)
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal("Missing 'groups' key")
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
           })

           it('Not passing array for \'groups\' returns error', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                var request = { jid: 'juliet@example.com', groups: { 0: 'group1' }}
                socket.emit('xmpp.roster.group', request, function(error, success) {
                    should.not.exist(success)
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal("Groups should be an array")
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
           })

           it('Handles error response stanza', function(done) {
                var request = {
                    jid: 'alice@wonderland.lit',
                    groups: [ 'group1', 'group2' ]
                }
                xmpp.once('stanza', function(stanza) {
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('set')
                     should.exist(stanza.attrs.id)
                     var query = stanza.getChild('query', roster.NS)
                     query.getChild('item').attrs.jid.should.equal(request.jid)
                     manager.makeCallback(helper.getStanza('iq-error'))
                })
                var callback = function(error, success) {
                    should.not.exist(success)
                    error.should.eql({
                        type: 'cancel',
                        condition: 'error-condition'
                    })
                    done()
                }
                socket.emit('xmpp.roster.group', request, callback) 
           })
 
           it('Allows the setting of roster groups', function(done) {
                var request = {
                    jid: 'alice@wonderland.lit',
                    groups: [ 'group1', 'group2' ]
                }
                xmpp.once('stanza', function(stanza) {
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('set')
                     should.exist(stanza.attrs.id)
                     var item = stanza.getChild('query', roster.NS)
                         .getChild('item')
                     item.attrs.jid.should.equal(request.jid)
                     item.getChildren('group').length.should.equal(2)
                     item.getChildren('group')[0].getText().should.equal('group1')
                     item.getChildren('group')[1].getText().should.equal('group2')
                     manager.makeCallback(helper.getStanza('iq-result'))
                })
                var callback = function(error, success) {
                    should.not.exist(error)
                    success.should.be.true
                    done()
                }
                socket.emit('xmpp.roster.group', request, callback)
           })

        })

    })
})
