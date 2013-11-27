var builder = require('ltx'),
    Base    = require('./base')

var Presence = function() {}

Presence.prototype = new Base()

Presence.prototype.current = 'online';

Presence.prototype._events = {
    'xmpp.presence': 'sendPresence',
    'xmpp.presence.subscribe': 'subscribe',
    'xmpp.presence.subscribed': 'setSubscribed',
    'xmpp.presence.unsubscribed': 'setUnsubscribed',
    'xmpp.presence.get': 'get',
    'xmpp.presence.offline': 'setOffline',
    'disconnect': 'setDisconnect'
}

Presence.prototype.subscribe = function(data) {
    this.subscription(data, 'subscribe')
}

Presence.prototype.setSubscribed = function(data) {
    this.subscription(data, 'subscribed')
}

Presence.prototype.setUnsubscribed = function(data) {
    this.subscription(data, 'unsubscribed')
}

Presence.prototype.setOffline = function() {
    this.sendPresence({ type: 'unavailable' })
}

Presence.prototype.setDisconnect  = function() {
    if (this.current != 'unavailable') 
        this.sendPresence({ type: 'unavailable' })
}

Presence.prototype.handles = function(stanza) {
    return stanza.is('presence')
}

Presence.prototype.handle = function(stanza) {
    if (stanza.attrs.type == 'subscribe') return this.handleSubscription(stanza)
    if (stanza.attrs.type == 'error') return this.handleError(stanza)
    var presence = { from: this._getJid(stanza.attrs.from) }
    if ('unavailable' == stanza.attrs.type) {
      presence.show = 'offline'
    } else {
      var show, status, priority
      if (!!(show = stanza.getChild('show')))
        presence.show = show.getText()
      if (!!(status = stanza.getChild('status')))
        presence.status = status.getText()
      if (!!(priority = stanza.getChild('priority')))
        presence.priority = priority.getText()
    }
    this.socket.emit('xmpp.presence', presence)
    return true
}

Presence.prototype.sendPresence = function(data) {
    var stanza = new builder.Element('presence')
    if (data.to) stanza.attr('to', data.to)
    if (data.type && data.type == 'unavailable') stanza.attr('type', data.type)
    if (data.status) stanza.c('status').t(data.status).up()
    if (data.priority) stanza.c('priority').t(data.priority).up()
    if (data.show) stanza.c('show').t(data.show).up()
    this.client.send(stanza)
}

Presence.prototype.handleSubscription = function(stanza) {
    var request = { from: this._getJid(stanza.attrs.from ) }
    if (stanza.getChild('nick')) request.nick = stanza.getChild('nick').getText()
    this.socket.emit('xmpp.presence.subscribe', request)
}

Presence.prototype.handleError = function(stanza) {
    if (stanza.attrs.from)
        var from = this._getJid(stanza.attrs.from)
    var description = stanza.getChild('error').children[0].getName()
    this.socket.emit(
        'xmpp.presence.error',
        { error: description, from: from }
    )
}

Presence.prototype.subscription = function(data, type) {
    if (!data.to) return this._clientError("Missing 'to' key", data)
    var stanza = new builder.Element(
        'presence',
        { to: data.to, type: type, from: this.manager.jid }
    )
    this.client.send(stanza)
}

Presence.prototype.get = function(data) {
    if (!data.to) return this._clientError("Missing 'to' key", data)
    var stanza = new builder.Element(
        'presence', { to: data.to, from: this.manager.jid }
    )
    this.client.send(stanza)
}

module.exports = Presence
