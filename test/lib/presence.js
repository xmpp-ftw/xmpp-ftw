require('mocha')
var should   = require('should')
  , Presence = require('../../lib/presence')
  , ltx      = require('ltx')
  , helper   = require('../helper')

describe('Presence', function() {

    var presence
    var socket
    var xmpp

    before(function() {
        socket = new helper.Eventer()
        xmpp = new helper.Eventer()
        var manager = {
            socket: socket,
            client: xmpp
        }
        presence = new Presence()
        presence.init({ socket: socket, client: xmpp })
    })

    describe('Can handle incoming messages', function() {
    
        it('Shouldn\'t handle non-presence stanzas', function() {
            presence.handles(ltx.parse('<iq/>')).should.be.false
        })

        it('Should confirm it can handle presence messages', function() {
            var item = ltx.parse('<presence />')
            presence.handles(item).should.be.true
        })

    })
})
