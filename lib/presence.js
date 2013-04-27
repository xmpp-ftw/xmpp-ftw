var builder = require('node-xmpp')
    Base    = require('./base')

var Presence = function() {}

Presence.prototype = new Base()

Presence.prototype.current = 'online';

Presence.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.presence', function(data) {
        self.sendPresence(data)
    });
    this.socket.on('xmpp.presence.subscribe', function(data) {
        self.subscription(data.to, 'subscribe')
    });
    this.socket.on('xmpp.presence.subscribed', function(data) {
        self.subscription(data.to, 'subscribed')
    });
    this.socket.on('xmpp.presence.unsubscribed', function(data) {
        self.subscription(data.to, 'unsubscribed')
    });
    this.socket.on('xmpp.presence.get', function(data) {
        self.get(data.to)
    });
    this.socket.on('xmpp.presence.offline', function() {
        self.sendPresence({type: 'unavailable'})
    });
    this.socket.on('disconnect', function() {
        if (self.current != 'unavailable') self.sendPresence({type: 'unavailable'})
    });
}

Presence.prototype.handles = function(stanza) {
    return stanza.is('presence')
}

Presence.prototype.handle = function(stanza) {
    if (stanza.attrs.type == 'subscribe') return this.handleSubscription(stanza)
    if (stanza.attrs.type == 'error') return this.handleError(stanza)
    presence = { from: this._getJid(stanza.attrs.from) }
    if ('unavailable' == stanza.attrs.type) {
      presence.show = 'offline'
    } else {
      if (show = stanza.getChild('show'))
        presence.show = show.getText()
      if (status = stanza.getChild('status'))
        presence.status = status.getText()
      if (priority = stanza.getChild('priority'))
        presence.priority = priority.getText()
    }
    this.socket.emit('xmpp.presence', presence)
    return true
}

Presence.prototype.sendPresence = function(data) {
    stanza = new builder.Element('presence')
    if (data.type && data.type == 'unavailable') stanza.attr('type', data.type)
    if (data.status) stanza.c('status').t(data.status).up()
    if (data.priority) stanza.c('priority').t(data.priority).up()
    if (data.show) stanza.c('show').t(data.show).up()
    this.client.send(stanza)
}

Presence.prototype.handleSubscription = function(stanza) {
    request = { from: this._getJid(stanza.attr('from')) }
    if (stanza.getChild('nick')) request.nick = stanza.getChild('nick').getText()
    this.socket.emit('xmpp.presence.subscribe', request)
}

Presence.prototype.handleError = function(stanza) {
    var description = stanza.getChild('text').getText()
    var from = stanza.attrs.from
    if (0 == description.length)
        description = stanza.getChild('error').getChild().getName()
    this.socket.emit(
        'xmpp.presence.error',
        { error: description, from: from }
    );
}

Presence.prototype.subscription = function(jid, type) {
    stanza = new builder.Element('presence', { to: jid, type: type, from: this.manager.jid })
    this.client.send(stanza)
}

Presence.prototype.get = function(jid) {
    stanza = new builder.Element('presence', { to: jid, from: this.manager.jid })
    this.client.send(stanza)
}

module.exports = Presence
