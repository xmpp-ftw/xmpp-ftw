'use strict';

var Ftw        = require('../index').Xmpp
  , should     = require('should')
  , events     = require('events')

/* jshint -W030 */
describe('FTW', function() {

    var ftw, socket

    before(function() {
        socket = new events.EventEmitter()
        ftw = new Ftw(socket)
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

})
