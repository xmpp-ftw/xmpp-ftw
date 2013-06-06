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
            var item = ltx.parse('<iq><query xmlns="'+roster.NS+'"/></iq>')
            roster.handles(item).should.be.true
        })

    })
})
