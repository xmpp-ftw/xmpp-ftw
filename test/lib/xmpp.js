'use strict';

var Xmpp   = require('../../index').Xmpp
  , should = require('should')
  , events = require('events')
  , ltx    = require('ltx')

/* jshint -W030 */
describe('FTW', function() {

    var ftw, socket

    before(function() {
        socket = new events.EventEmitter()
        ftw = new Xmpp(socket)
    })

    describe('Returns JID parts', function() {

        beforeEach(function() {
            ftw.fullJid = {
                user: 'marty',
                domain: 'mcfly',
                resource: 'thefuture'
            }
        })

        it('Returns full JID', function() {
            ftw.getJidType('full').should.equal(
                ftw.fullJid.user + '@' +
                ftw.fullJid.domain + '/' +
                ftw.fullJid.resource
            )
        })

        it('Returns bare JID', function() {
            ftw.getJidType('bare').should.equal(
                ftw.fullJid.user + '@' +
                ftw.fullJid.domain
            )
        })

        it('Returns domain', function() {
            ftw.getJidType('domain').should.equal(
                ftw.fullJid.domain
            )
        })

        it('Returns undefined for unknown JID part type', function() {
            should.not.exist(ftw.getJidType('all'))
        })

    })
    
    describe.only('Tracking IDs', function() {
        
        it('Should error if no ID provided', function(done) {
            try {
                ftw.trackId()
                done('Expected exception')
            } catch (e) {
                e.message.should.equal(ftw.MISSING_STANZA_ID)
                done()
            }
        })
        
        it('Should accept an ID and capture', function(done) {
            var stanza = ltx.parse('<iq id="1" />')
            ftw.trackId('1', function(payload) {
                payload.should.eql(stanza)
                done()
            })
            ftw.catchTracked(stanza).should.be.true
        })
        
        it('Should return false if untracked ID', function() {
            var stanza = ltx.parse('<iq id="2" />')
            ftw.trackId('1', function() {})
            ftw.catchTracked(stanza).should.be.false
        })
        
        it('Should return false if no ID attribute', function() {
            var stanza = ltx.parse('<iq />')
            ftw.trackId('1', function() {})
            ftw.catchTracked(stanza).should.be.false
        })
        
        it('Should error if no callback provided', function(done) {
            try {
                ftw.trackId('1')
                done('Expected exception')
            } catch (e) {
                e.message.should.equal(ftw.MISSING_CALLBACK)
                done()
            }
        })
        
        it('Should error if non-function callback provided', function(done) {
            try {
                ftw.trackId('1', true)
                done('Expected exception')
            } catch (e) {
                e.message.should.equal(ftw.INVALID_CALLBACK)
                done()
            }
        })
        
        it.skip('Should accept a stanza and capture', function() {
            
        })
        
        it.skip('Should append an ID if none provided', function() {
            // REALLY ?
            // No! This is added in the base class
            // What do I do if no ID attribute? Throw exception?
        })
        
    })

})
