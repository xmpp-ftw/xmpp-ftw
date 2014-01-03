'use strict';

var should   = require('should')
  , Presence = require('../../index').Presence
  , ltx      = require('ltx')
  , helper   = require('../helper')

/* jshint -W030 */
describe('Presence', function() {

    var presence, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            jid: 'bottom@dreams.org'
        }
        presence = new Presence()
        presence.init(manager)
    })

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
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

        it('Can handle error stanza with no \'from\'', function(done) {
            socket.once('xmpp.presence.error', function(data) {
                data.error.should.eql('gone')
                should.not.exist(data.from)
                done()
            })
            var stanza = helper.getStanza('presence/error')
            delete stanza.attrs.from
            presence.handle(stanza)
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
            socket.send('xmpp.presence', {})
        })

        it('Can send offline stanza', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.type.should.equal('unavailable')
                done()
            })
            socket.send('xmpp.presence', { type: 'unavailable' })
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
            socket.send('xmpp.presence', data)
        })

        describe('Subscribe stanzas', function() {

            it('Returns error when no \'to\' value provided', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(data) {
                    data.type.should.equal('modify')
                    data.condition.should.equal('client-error')
                    data.description.should.equal('Missing \'to\' key')
                    data.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.presence.subscribe', {})
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
                    socket.send('xmpp.presence.subscribe', { to: to })
                }
            )
        })

        describe('Subscribed stanzas', function() {

            it('Returns error when no \'to\' value provided', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(data) {
                    data.type.should.equal('modify')
                    data.condition.should.equal('client-error')
                    data.description.should.equal('Missing \'to\' key')
                    data.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.presence.subscribed', {})
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
                    socket.send('xmpp.presence.subscribed', { to: to })
                }
            )
        })

        describe('Unsubscribed stanzas', function() {

            it('Returns error when no \'to\' value provided', function(done) {
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(data) {
                    data.type.should.equal('modify')
                    data.condition.should.equal('client-error')
                    data.description.should.equal('Missing \'to\' key')
                    data.request.should.eql({})
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.presence.unsubscribed', {})
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
                    socket.send('xmpp.presence.unsubscribed', { to: to })
                }
            )
        })

        it('Presence request errors when missing \'to\'', function(done) {
            xmpp.once('stazna', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(data) {
                data.type.should.equal('modify')
                data.condition.should.equal('client-error')
                data.description.should.equal('Missing \'to\' key')
                data.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.send('xmpp.presence.get', {})
        })

        it('Can request a user\'s presence', function(done) {
            var to = 'juliet@example.com/balcony'
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.from.should.equal(manager.jid)
                stanza.attrs.to.should.equal(to)
                done()
            })
            socket.send('xmpp.presence.get', { to: to })
        })

        it('Sends \'unavailable\' presence when asked', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.type.should.equal('unavailable')
                done()
            })
            socket.send('xmpp.presence.offline', {})
        })

        it('Sends \'unavailable\' when going offline', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.is('presence').should.be.true
                stanza.attrs.type.should.equal('unavailable')
                done()
            })
            socket.send('disconnect', {})
        })
    })

    describe('XEP-0115 Entity capibilities', function() {

        describe('Sending', function() {

            it('Errors if \'client\' key is not an object', function(done) {
                var request = { client: false }
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(error) {
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal('\'client\' key must be an object')
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.presence', request)
            })

            it('Errors if missing \'node\' key', function(done) {
                var request = { client: {} }
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(error) {
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal('Missing \'node\' key')
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.presence', request)
            })

            it('Errors if missing \'ver\' key', function(done) {
                var request = { client: { node: 'node-value' } }
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(error) {
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal('Missing \'ver\' key')
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.presence', request)
            })

            it('Errors if missing \'hash\' key', function(done) {
                var request = {
                    client: { node: 'node-value', ver: 'ver-value' }
                }
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(error) {
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal('Missing \'hash\' key')
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.presence', request)
            })

            it('Sends expected stanza', function(done) {
                var data = {
                    client: {
                        node: 'node-value',
                        ver: 'ver-value',
                        hash: 'hash-value'
                    }
                }
                xmpp.once('stanza', function(stanza) {
                    stanza.is('presence').should.be.true
                    var c = stanza.getChild('c', presence.NS_ENTITY_CAPABILITIES)
                    c.should.exist
                    c.attrs.node.should.equal(data.client.node)
                    c.attrs.ver.should.equal(data.client.ver)
                    c.attrs.hash.should.equal(data.client.hash)
                    done()
                })
                socket.send('xmpp.presence', data)
            })

        })

        describe('Receiving', function() {

            it('Adds entity capability data', function(done) {
                socket.once('xmpp.presence', function(data) {
                    data.client.should.exist
                    data.client.ver.should.equal('ver-value')
                    data.client.hash.should.equal('hash-value')
                    data.client.node.should.equal('node-value')
                    done()
                })
                presence.handle(helper.getStanza('presence/xep-0115'))
            })

        })

    })

})