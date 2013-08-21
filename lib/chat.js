var Base    = require('./base'),
    xhtmlIm = require('./utils/xep-0071'),
    state   = require('./utils/xep-0085')

var Chat = function() {}

Chat.prototype = new Base()

Chat.prototype.XHTML = 'xhtml'
Chat.prototype.PLAIN = 'plain'

Chat.prototype.NS_DELAY = 'urn:xmpp:delay'

Chat.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.chat.message', function(data) {
        self.sendMessage(data)
    })
}

Chat.prototype.handles = function(stanza) {
    return (stanza.is('message') && ('chat' === stanza.attrs.type))
}

Chat.prototype.handle = function(stanza) {
    var chat = { from: this._getJid(stanza.attrs.from) }
    
    if (stanza.getChild('body') ||
        stanza.getChild('html', xhtmlIm.NS_XHTML_IM)
    ) {
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
    var delay
    if (!!(delay = stanza.getChild('delay', this.NS_DELAY))) {
        chat.delay = { when: delay.attrs.stamp }
        if (delay.attrs.from) chat.delay.from = delay.attrs.from
        if (delay.getText()) chat.delay.reason = delay.getText().trim()
    }
    state.parse(stanza, chat)
    this.socket.emit('xmpp.chat.message', chat)
    return true
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
