'use strict';

var Chat      = require('../../index').Chat
  , ltx       = require('ltx')
  , helper    = require('../helper')
  , should    = require('should')
  , chatState = require('../../index').utils['xep-0085']

/* jshint -W030 */
describe('Chat', function() {

    var chat, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            jid: 'test@example.com',
            trackId: function(id, callback) {
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            }
        }
        chat = new Chat()
        chat.init(manager)
    })

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
        chat.init(manager)
    })

    describe('Can handle incoming messages', function() {

        it('Shouldn\'t handle non-message stanzas', function() {
            chat.handles(ltx.parse('<iq/>')).should.be.false
        })

        it('Should handle messages without a type', function() {
            chat.handles(ltx.parse('<message />')).should.be.true
        })

        it('Should confirm it can handle chat messages', function() {
            var item = ltx.parse('<message type="headline" />')
            chat.handles(item).should.be.false
        })

        it('Should handle chat type messages', function() {
            var item = ltx.parse('<message type="chat" />')
            chat.handles(item).should.be.true
        })

        it('Can handle simple plain text messages', function(done) {
            socket.once('xmpp.chat.message', function(data) {
                data.from.should.eql({
                    user: 'user',
                    domain: 'domain',
                    resource: 'resource'
                })
                data.content.should.equal('message')
                data.format.should.equal(chat.PLAIN)
                done()
            })
            chat.handle(helper.getStanza('chat/plain')).should.be.true
        })

        it('Can handle XHTML type messages', function(done) {
            socket.once('xmpp.chat.message', function(data) {
                data.from.should.eql({
                    user: 'user',
                    domain: 'domain',
                    resource: 'resource'
                })
                data.content
                    .should.equal('<p>Hello to <strong>you!</strong></p>')
                data.format.should.equal(chat.XHTML)
                done()
            })
            chat.handle(helper.getStanza('chat/xhtml')).should.be.true
        })

        it('Can handle <delay> element', function(done) {
            socket.once('xmpp.chat.message', function(data) {
                data.delay.when.should.equal('2002-09-10T23:08:25Z')
                data.delay.reason.should.equal('Offline Storage')
                data.delay.from.should.equal('capulet.com')
                done()
            })
            chat.handle(helper.getStanza('chat/plain-with-delay'))
                .should.be.true
        })

        it('Handles messages with a chat state notification', function(done) {
            socket.once('xmpp.chat.message', function(data) {
                data.from.should.eql({
                    user: 'user',
                    domain: 'domain',
                    resource: 'resource'
                })
                data.content
                    .should.equal('<p>Hello to <strong>you!</strong></p>')
                data.state.should.equal('composing')
                data.format.should.equal(chat.XHTML)
                done()
            })
            chat.handle(helper.getStanza('chat/xhtml-with-state')).should.be.true
        })

        it('Can handle just chat state notifications', function(done) {
            socket.once('xmpp.chat.message', function(data) {
                data.from.should.eql({
                    user: 'user',
                    domain: 'domain',
                    resource: 'resource'
                })
                should.not.exist(data.content)
                should.not.exist(data.format)
                data.state.should.equal('composing')
                done()
            })
            chat.handle(helper.getStanza('chat/chat-state')).should.be.true
        })

        it('Can handle archived messages', function(done) {
            socket.once('xmpp.chat.message', function(data) {
                data.archived.length.should.equal(1)
                data.archived[0].by.should.eql({
                    domain: 'shakespeare.lit',
                    user: 'juliet'
                })
                data.archived[0].id.should.equal('archive:1')
                done()
            })
            chat.handle(helper.getStanza('chat/chat-archived'))
                .should.be.true
        })

        it('https://github.com/lloydwatkin/xmpp-ftw/issues/40', function(done) {
            socket.once('xmpp.chat.message', function(data) {
                data.should.eql({
                    from: { domain: 'buddycloud.org', user: 'lloyd', resource: '...' },
                    content: 'hey',
                    format: 'plain',
                    state: 'active'
                })
                done()
            })
            chat.handle(helper.getStanza('issues/40')).should.be.true
        })

    })

    describe('Can send messages', function() {

        it('Sends error message if \'to\' parameter missing', function(done) {
            socket.once('xmpp.error.client', function(data) {
                data.description.should.equal('Missing \'to\' key')
                data.type.should.equal('modify')
                data.condition.should.equal('client-error')
                data.request.should.eql({})
                done()
            })
            chat.sendMessage({})
        })

        it('Errors if \'content\' & chat state not provided', function(done) {
            socket.once('xmpp.error.client', function(data) {
                data.description
                    .should.equal('Message content or chat state not provided')
                data.type.should.equal('modify')
                data.condition.should.equal('client-error')
                data.request.to.should.equal('romeo@montague.net/orchard')
                data.request.type.should.equal('chat')
                done()
            })
            chat.sendMessage({ to: 'romeo@montague.net/orchard' })

        })

        it('Can send simple plain text messages', function(done) {
            var to = 'user@domain/resource'
            var content = 'message'
            xmpp.once('stanza', function(stanza) {
                stanza.attrs.to.should.equal(to)
                stanza.attrs.type.should.equal('chat')
                stanza.getChild('body').getText().should.equal(content)
                done()
            })
            chat.sendMessage({ to: to, content: content })
        })

        it('Returns error if invalid XHTML provided', function(done) {
            var to = 'romeo@montague.net/orchard'
            var content = 'This will <strong>fail'
            socket.once('xmpp.error.client', function(data) {
                data.description.should.equal('Can not parse XHTML message')
                data.type.should.equal('modify')
                data.condition.should.equal('client-error')
                data.request.to.should.equal(to)
                data.request.type.should.equal('chat'),
                data.request.content.should.equal(content)
                done()
            })
            chat.sendMessage({
                to: to,
                content: content,
                format: chat.XHTML
            })
        })

        it('Returns expected XHTML message stanza', function(done) {
            var to = 'romeo@montague.net/orchard'
            var content = '<p>This will <strong>pass</strong></p>'
            xmpp.once('stanza', function(stanza) {
                stanza.getChild('body').getText()
                    .should.equal('This will pass')
                stanza.attrs.to.should.equal(to)
                stanza.getChild('html', 'http://jabber.org/protocol/xhtml-im')
                    .should.exist
                stanza.getChild('html')
                    .getChild('body', 'http://www.w3.org/1999/xhtml')
                    .should.exist
                stanza.getChild('html')
                    .getChild('body')
                    .children.join('')
                    .should.equal(content)
                done()
            })
            chat.sendMessage({
                to: to,
                content: content,
                format: chat.XHTML
            })
        })

        it('Should build stanza with chat state notification', function(done) {
            var to = 'romeo@montague.net/orchard'
            var content = '<p>This will <strong>pass</strong></p>'
            xmpp.once('stanza', function(stanza) {
                stanza.getChild('body').getText()
                    .should.equal('This will pass')
                stanza.attrs.to.should.equal(to)
                stanza.getChild('html', 'http://jabber.org/protocol/xhtml-im')
                    .should.exist
                stanza.getChild('html')
                    .getChild('body', 'http://www.w3.org/1999/xhtml')
                    .should.exist
                stanza.getChild('html')
                    .getChild('body')
                    .children.join('')
                    .should.equal(content)
                done()
            })
            chat.sendMessage({
                to: to,
                content: content,
                format: chat.XHTML
            })
        })

        it('Should build stanza with just chat state', function(done) {
            var to = 'romeo@montague.net/orchard'
            var state = 'composing'
            xmpp.once('stanza', function(stanza) {
                stanza.attrs.to.should.equal(to)
                stanza.getChild('composing', chatState.NS).should.exist
                done()
            })
            chat.sendMessage({
                to: to,
                state: state
            })
        })

    })

    it('Returns message ID if callback provided', function(done) {

        var request = {
            to: 'user@example.com',
            content: 'hello'
        }
        socket.send('xmpp.chat.message', request, function(error, data) {
            data.id.should.exist
            should.not.exist(error)
            done()
        })
    })

    describe('Receipts XEP-0184', function() {

        describe('Incoming', function() {

            it('Handles delivery receipts', function() {
                chat.handles(helper.getStanza('chat/receipt'))
                    .should.be.true
            })

            it('Sends expected delivery receipt', function(done) {
                socket.once('xmpp.chat.receipt', function(data) {
                    data.from.should.eql({
                        domain: 'royalty.england.lit',
                        user: 'kingrichard',
                        resource: 'throne'
                    })
                    data.id.should.equal('richard2-4.1.247')
                    done()
                })
                chat.handle(helper.getStanza('chat/receipt'))
                    .should.be.true
            })

        })

        describe('Outgoing', function() {

            it('Errors if receipt requested but no callback provided', function(done) {
                var request = {
                    to: 'user@example.com',
                    content: 'hello',
                    receipt: true
                }
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(error) {
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal('Callback required')
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.chat.message', request)
            })

            it('Errors if non-function callback provided', function(done) {
                var request = {
                    to: 'user@example.com',
                    content: 'hello',
                    receipt: true
                }
                xmpp.once('stanza', function() {
                    done('Unexpected outgoing stanza')
                })
                socket.once('xmpp.error.client', function(error) {
                    error.type.should.equal('modify')
                    error.condition.should.equal('client-error')
                    error.description.should.equal('Missing callback')
                    error.request.should.eql(request)
                    xmpp.removeAllListeners('stanza')
                    done()
                })
                socket.send('xmpp.chat.message', request, true)
            })

            it('Sends expected stanza with receipt request', function(done) {
                var to = 'user@domain/resource'
                var content = 'message'
                xmpp.once('stanza', function(stanza) {
                    stanza.attrs.to.should.equal(to)
                    stanza.attrs.type.should.equal('chat')
                    stanza.getChild('body').getText().should.equal(content)
                    stanza.getChild('request', chat.NS_RECEIPT).should.exist
                    stanza.attrs.id.should.exist
                    done()
                })
                chat.sendMessage({ to: to, content: content, receipt: true }, function() {})
            })

            it('Retuns message ID', function(done) {
                var to = 'user@domain/resource'
                var content = 'message'
                var callback = function(error, success) {
                    should.not.exist(error)
                    success.id.should.exist
                    done()
                }
                chat.sendMessage({ to: to, content: content, receipt: true }, callback)
            })

        })

    })

})
