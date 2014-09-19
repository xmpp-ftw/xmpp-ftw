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
    
    describe('Error parsing', function() {
        
        it('Parses a basic error', function() {
            var stanza = helper.getStanza('error-stanzas/basic')
            var error = base._parseError(stanza)
            error.type.should.equal('modify')
            error.condition.should.equal('bad-request')
            should.not.exist(error.description)
            should.not.exist(error.application)
        })
      
        it('Parses an extended error', function() {
            var stanza = helper.getStanza('error-stanzas/extended')
            var error = base._parseError(stanza)
            error.type.should.equal('cancel')
            error.condition.should.equal('feature-not-implemented')
            should.not.exist(error.description)
          
            error.application.should.exist
            error.application.condition.should.equal('unsupported')
            error.application.xmlns.should.equal('http://jabber.org/protocol/pubsub#errors')
            error.application.description.should.equal('\'retrive-subscriptions\' not supported')
        })
      
        it('Parses an extended error with text description', function() {
            var stanza = helper.getStanza('error-stanzas/extended-text')
            var error = base._parseError(stanza)
            
            error.type.should.equal('cancel')
            error.condition.should.equal('gone')
            error.description.should.equal('xmpp:romeo@afterlife.example.net')
            error.by.should.equal('example.net')
        })

    })
    
    describe('JID parsing', function() {
  
        it('Parses a domain', function() {
            var jid = base._getJid('mcfly.org')
            jid.should.eql({ domain: 'mcfly.org' })
        })
        
        it('Parses a bare JID', function() {
            var jid = base._getJid('marty@mcfly.org')
            jid.should.eql({ user: 'marty', domain: 'mcfly.org' })
        })
        
        it('Parses a full JID', function() {
            var jid = base._getJid('marty@mcfly.org/delorean')
            jid.should.eql({ user: 'marty', domain: 'mcfly.org', resource: 'delorean' })
        })
    })
    
    describe('Cache', function() {

        it('When setting cache \'this\' is returned', function() {
            base.setCache({}).should.equal(base)
        })
        
        it('Returns cache when it has been set', function() {
            var cache = { caching: { is: 'fun' } }
            base.setCache(cache)._getCache().should.equal(cache)
        })
        
        it('Returns null when a cache hasn\'t been set', function() {
            base._getCache().should.be.null
        })
        
    })

})