var Base    = require('./base'),
    xhtmlIm = require('./utils/xep-0071'),
    state   = require('./utils/xep-0085'),
    delay   = require('./utils/xep-0203')

var Chat = function() {}

Chat.prototype = new Base()

Chat.prototype.XHTML = 'xhtml'
Chat.prototype.PLAIN = 'plain'

Chat.prototype._events = {
    'xmpp.chat.message': 'sendMessage'    
}

Chat.prototype.handles = function(stanza) {
    return (stanza.is('message') &&
            (!stanza.attrs.type || ('chat' === stanza.attrs.type)))
}

Chat.prototype.handle = function(stanza) {
    var chat = { from: this._getJid(stanza.attrs.from) }
    this._getMessageContent(stanza, chat)    
    delay.parse(stanza, chat)
    state.parse(stanza, chat)
    var self = this
    stanza.getChildren('archived').forEach(function(archived) {
        if (!chat.archived) chat.archived = []
        chat.archived.push({
            by: self._getJid(archived.attrs.by), id: archived.attrs.id
        })
    })
    this.socket.emit('xmpp.chat.message', chat)
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

Chat.prototype.sendMessage = function(data) {
    if (!data.to) return this._clientError("Missing 'to' key", data)
    data.type = 'chat'
    if (!data.content && !data.state)
        return this._clientError(
            'Message content or chat state not provided', data
        )
     var stanza
     if (!(stanza = xhtmlIm.builder(data, { to: data.to, type: 'chat' }, this)))
         return
     if (data.state)
         stanza.root().c(data.state, { xmlns: state.NS })
     this.client.send(stanza)
}

module.exports = Chat
