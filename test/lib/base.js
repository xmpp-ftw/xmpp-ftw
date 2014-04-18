'use strict';

var Base   = require('../../index').Base
  , helper = require('../helper')
  , should = require('should')

/* jshint -W030 */
describe('Base', function() {

    var base, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            jid: 'test@example.com'
        }
        base = new Base()
        base.init(manager)
    })

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
        base.init(manager)
    })

    describe('Stanza ID', function() {

        it('Sets a UUID as stanza ID', function() {
            var id = base._getId()
            var regex = /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/
            id.should.match(regex)
        })

        it('Increments counter on prototype', function() {
            delete Base.prototype.id
            base._getId()
            Base.prototype.id.counter.should.exist
            Base.prototype.id.counter.should.equal(1)
            base._getId()
            Base.prototype.id.counter.should.equal(2)
            base._getId()
            Base.prototype.id.counter.should.equal(3)
        })
        
        it('Should generate different IDs', function() {
            var ids = []
            var max = 100
            for (var i = 0; i < max + 1; i++) {
                ids.push(base._getId())
            }
            for (var j = 0; j < max; j++) {
                ids[j].should.not.equal(ids[j+1])
            }
        })

    })

})
