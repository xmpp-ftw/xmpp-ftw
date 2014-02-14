'use strict';

var Base    = require('./base'),
    xhtmlIm = require('./utils/xep-0071'),
    state   = require('./utils/xep-0085'),
    delay   = require('./utils/xep-0203')

var Chat = function() {}

Chat.prototype = new Base()

Chat.prototype.XHTML = 'xhtml'
Chat.prototype.PLAIN = 'plain'

Chat.prototype.NS_RECEIPT = 'urn:xmpp:receipts'

Chat.prototype._events = {
    'xmpp.chat.message': 'sendMessage'
}

Chat.prototype.handles = function(stanza) {
    if (!stanza.is('message')) return false
    if (!stanza.attrs.type || ('chat' === stanza.attrs.type)) return true
    if (stanza.getChild('received', this.NS_RECEIPT)) return true
    return false
}

Chat.prototype.handle = function(stanza) {
    var chat = { from: this._getJid(stanza.attrs.from) }
    if (stanza.getChild('received', this.NS_RECEIPT))
        return this._returnDeliveryReceipt(chat, stanza)
    this._getMessageContent(stanza, chat)
    delay.parse(stanza, chat)
    state.parse(stanza, chat)
    var self = this
    stanza.getChildren('archived').forEach(function(archived) {
        if (!chat.archived) chat.archived = []
        chat.archived.push({
            by: self._getJid(archived.attrs.by),
            id: archived.attrs.id
        })
    })
    if (stanza.attrs.id) chat.id = stanza.attrs.id
    this.socket.send('xmpp.chat.message', chat)
    return true
}

Chat.prototype._returnDeliveryReceipt = function(data, stanza) {
    data.id = stanza.getChild('received').attrs.id
    this.socket.send('xmpp.chat.receipt', data)
    return true
}

Chat.prototype._getMessageContent = function(stanza, chat) {
    if (!stanza.getChild('body') &&
        !stanza.getChild('html', xhtmlIm.NS_XHTML_IM)
    ) return

    var format  = this.PLAIN
    var content = stanza.getChild('body').getText()
    var message
    if (!!(message = stanza.getChild('html', xhtmlIm.NS_XHTML_IM))) {
        content = message.getChild('body', xhtmlIm.NS_XHTML)
            .children
            .join('')
            .toString()
            .trim()
        format  = this.XHTML
    }
    chat.content = content
    chat.format = format
}

Chat.prototype._messageReceipt = function(stanza, callback) {
    if ('error' === stanza.attrs.type) {
        return callback(this._parseError(stanza))
    }
    callback(null, true)
}

Chat.prototype._addState = function(stanza, chatState) {
    if (!chatState) return
    stanza.root().c(chatState, { xmlns: state.NS })
}

Chat.prototype._addReceiptRequest = function(stanza, data, hasValidCallback) {
    if (!data.receipt) return true

    if (false === hasValidCallback) {
        this._clientError('Callback required', data)
        return false
    }
    stanza.root().c('request', { xmlns: this.NS_RECEIPT })
}

Chat.prototype.sendMessage = function(data, callback) {
    if (!data.to) return this._clientError('Missing \'to\' key', data)
    data.type = 'chat'
    if (!data.content && !data.state) {
        return this._clientError(
            'Message content or chat state not provided', data
        )
    }
    var stanza
    if (!(stanza = xhtmlIm.builder(data, { to: data.to, type: 'chat' }, this)))
        return
    var hasValidCallback = false

    if (callback) {
        if (false === this._hasValidCallback(callback, data)) return
        hasValidCallback = true
        stanza.root().attrs.id = this._getId()
    }
    this._addState(stanza, data.state)
    if (false === this._addReceiptRequest(stanza, data, hasValidCallback)) {
        return
    }
    this.client.send(stanza)
    if (false === hasValidCallback) return
    callback(null, { id: stanza.root().attrs.id })
}

module.exports = Chat