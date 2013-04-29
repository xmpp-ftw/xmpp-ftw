var builder = require('node-xmpp'),
    Base    = require('./base'),
    xhtmlIm = require('./utils/xep-0071')

var Chat = function() {}

Chat.prototype = new Base()

Chat.prototype.XHTML = 'xhtml'
Chat.prototype.PLAIN = 'plain'

Chat.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.chat.message', function(data) {
        self.sendMessage(data)
    })
}

Chat.prototype.handles = function(stanza) {
    return (stanza.is('message') && ('chat' == stanza.attrs.type))
}

Chat.prototype.handle = function(stanza) {
    var format  = this.PLAIN
    var content = stanza.getChild('body').getText()
    if (message = stanza.getChild('html')) {
        content = message.getChild('body').children.join().toString()
        format  = this.XHTML
    }
    chat = { 
        from:    this._getJid(stanza.attrs.from),
        content: content,
        format:  format
    }
    if (stanza.getChild('delay'))
        chat.delay = stanza.getChild('delay').attrs.stamp

    this.socket.emit('xmpp.chat.message', chat)
    return true
}

Chat.prototype.sendMessage = function(data) {
    if (!data.to) return this._clientError("Missing 'to' JID", data)
    return xhtmlIm(data, {to:data.to, type:'chat'}, this)
}

module.exports = Chat
