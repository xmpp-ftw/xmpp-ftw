require('mocha')
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
                var id 
                xmpp.once('stanza', function(stanza) {
                     
                     stanza.is('iq').should.be.true
                     stanza.attrs.type.should.equal('set')
                     should.exist(stanza.attrs.id)
                     id = stanza.attrs.id
                     manager.makeCallback(ltx.parse('<iq type="result" />'))
                })
                socket.emit(
                    'xmpp.roster.add', 
                    { jid: jid }, 
                    function(error, success) {
                        should.not.exist(error)
                        success.should.be.true
                        done()
                    }
                )
           })

       })
    })
})