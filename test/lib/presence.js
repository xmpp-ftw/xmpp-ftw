var should   = require('should')
  , Presence = require('../../lib/presence')
  , ltx      = require('ltx')
  , helper   = require('../helper')

describe('Presence', function() {

    var presence, socket, xmpp, manager

    before(function() {
        socket = new helper.Eventer()
        xmpp = new helper.Eventer()
        manager = {
            socket: socket,
            client: xmpp,
            jid: 'bottom@dreams.org'
        }
        presence = new Presence()
        presence.init(manager)
    })

    describe('Can handle incoming presence updates', function() {
    
        it('Shouldn\'t handle non-presence stanzas', function() {
            presence.handles(ltx.parse('<iq/>')).should.be.false
        })

        it('Should confirm it can handle presence stanzas', function() {
            var item = ltx.parse('<presence />')
            presence.handles(item).should.be.true
        })

        it('Can handle error stanzas', function(done) {
            socket.once('xmpp.presence.error', function(data) {
                data.error.should.eql('gone')
                data.from.user.should.equal('mercutio')
                data.from.domain.should.equal('example.org')
                should.not.exist(data.from.resource)
                done()
            })
            presence.handle(helper.getStanza('presence/error'))
        })

        it('Can handle subscription requests', function(done) {
            socket.once('xmpp.presence.subscribe', function(data) {
                data.from.user.should.equal('montague')
                data.from.domain.should.equal('example.net')
                should.not.exist(data.from.resource)
                done()
            })
            presence.handle(helper.getStanza('presence/subscribe'))
        })

        it('Can handle another user going offline', function(done) {
            socket.once('xmpp.presence', function(data) {
                data.show.should.equal('offline')
                data.from.user.should.equal('juliet')
                data.from.domain.should.equal('example.com')
                data.from.resource.should.equal('balcony')
                done()
            })
            presence.handle(helper.getStanza('presence/offline'))
        })

        it('Should be able to receive a blank presence stanza', function(done) {
            socket.once('xmpp.presence', function(data) {
                data.should.eql({ from : {
                    user: 'juliet',
                    domain: 'example.com',
                    resource: 'balcony'
                }})
                done()
            })
            presence.handle(helper.getStanza('presence/presence'))
        })

        it('Should handle standard presence elements', function(done) {
            socket.once('xmpp.presence', function(data) {
                data.from.should.eql({
                    user: 'juliet',
                    domain: 'example.com',
                    resource: 'balcony'
                })
                data.status.should.equal('say hello to me')
                data.priority.should.equal('10')
                data.show.should.equal('chat')
                 done()
            })
             presence.handle(helper.getStanza('presence/presence-reply'))
        })
    })

    describe('Can send presence stanzas', function() {

        it('Can send a minimal presence stanza', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.root().toString().should.equal('<presence/>')
                done()
            })
            socket.emit('xmpp.presence', {})
        })

        it('Can send offline stanza', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.type.should.equal('unavailable')
                done()
            })
            socket.emit('xmpp.presence', { type: 'unavailable' })
        })

        it('Can send full presence stanza', function(done) {
            var data = {
                type: 'should-not-exist',
                to: 'juliet@example.com/balcony',
                status: 'Looking for Romeo...',
                priority: '100',
                show: 'chat'
            }
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                should.not.exist(stanza.attrs.type)
                stanza.attrs.to.should.equal(data.to)
                stanza.getChild('status').getText()
                    .should.equal(data.status)
                stanza.getChild('priority').getText()
                    .should.equal(data.priority)
                stanza.getChild('show').getText()
                    .should.equal(data.show)
                done()
            })
            socket.emit('xmpp.presence', data)
        })

        describe('Subscribe stanzas', function() {

            it('Returns error when no \'to\' value provided', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(data) {
                    data.type.should.equal('modify')
                    data.condition.should.equal('client-error')
                    data.description.should.equal("Missing 'to' key")
                    data.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.emit('xmpp.presence.subscribe', {})
            })

            it('Can send subscribe stanza', function(done) {
                 var to = 'juliet@example.com/balcony'
                 xmpp.once('stanza', function(stanza) {
                     stanza.is('presence').should.be.true
                     stanza.attrs.to.should.equal(to)
                     stanza.attrs.type.should.equal('subscribe')
                     stanza.attrs.from.should.equal(manager.jid)
                     done()
                 })
                 socket.emit('xmpp.presence.subscribe', { to: to })
            })
        })


        describe('Subscribed stanzas', function() {

            it('Returns error when no \'to\' value provided', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(data) {
                    data.type.should.equal('modify')
                    data.condition.should.equal('client-error')
                    data.description.should.equal("Missing 'to' key")
                    data.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.emit('xmpp.presence.subscribed', {})
            })

            it('Can send subscribed stanza', function(done) {
                 var to = 'juliet@example.com/balcony'
                 xmpp.once('stanza', function(stanza) {
                     stanza.is('presence').should.be.true
                     stanza.attrs.to.should.equal(to)
                     stanza.attrs.type.should.equal('subscribed')
                     stanza.attrs.from.should.equal(manager.jid)
                     done()
                 })
                 socket.emit('xmpp.presence.subscribed', { to: to })
            })
        })


        describe('Unsubscribed stanzas', function() {

            it('Returns error when no \'to\' value provided', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(data) {
                    data.type.should.equal('modify')
                    data.condition.should.equal('client-error')
                    data.description.should.equal("Missing 'to' key")
                    data.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.emit('xmpp.presence.unsubscribed', {})
            })

            it('Can send unsubscribed stanza', function(done) {
                 var to = 'juliet@example.com/balcony'
                 xmpp.once('stanza', function(stanza) {
                     stanza.is('presence').should.be.true
                     stanza.attrs.to.should.equal(to)
                     stanza.attrs.type.should.equal('unsubscribed')
                     stanza.attrs.from.should.equal(manager.jid)
                     done()
                 })
                 socket.emit('xmpp.presence.unsubscribed', { to: to })
            })
        })

        it('Presence request errors when missing \'to\'', function(done) {
            xmpp.once('stazna', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(data) {
                data.type.should.equal('modify')
                data.condition.should.equal('client-error')
                data.description.should.equal("Missing 'to' key")
                data.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.emit('xmpp.presence.get', {})
        })
  
        it('Can request a user\'s presence', function(done) {
            var to = 'juliet@example.com/balcony'
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.from.should.equal(manager.jid)
                stanza.attrs.to.should.equal(to)
                done()
            })
            socket.emit('xmpp.presence.get', { to: to })
        })

        it('Sends \'unavailable\' presence when asked', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.type.should.equal('unavailable')
                done()
            })
            socket.emit('xmpp.presence.offline', {})
        })

        it('Sends \'unavailable\' when going offline', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.type.should.equal('unavailable')
                done()
            })
            socket.emit('disconnect', {})
        })
    })
})
