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
            jid: 'bottom@dreams.org'
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
})
