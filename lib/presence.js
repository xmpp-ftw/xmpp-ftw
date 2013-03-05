var jQuery = require('jQuery'),
    builder = require('node-xmpp')
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
	var stanzaStr = stanza.toString();
	if (stanza.attr('type') == 'subscribe') return this.handleSubscription(stanza)
	if (stanza.attr('type') == 'error') return this.handleError(stanza)
    presence = { 
    	from: this._getJid(stanza.attrs.from),
    	show: jQuery(stanzaStr).find('show').text(),
    	status: jQuery(stanzaStr).find('status').text(),
    	priority: jQuery(stanzaStr).find('priority').text()
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
    var stanzaStr = stanza.toString()
    if (jQuery(stanzaStr).find('nick')) request.nick = jQuery(stanzaStr).find('nick').text()
    this.socket.emit('xmpp.presence.subscribe', request)
}

Presence.prototype.handleError = function(stanza) {
	var parsed = jQuery(stanza.toString())
	var description = parsed.find('text').text()
	var from = parsed.attr('from')
	if (0 == description.length)
	    description = jQuery(stanza.toString()).find('error').children(':first').prop('tagName')
	this.socket.emit(
		'xmpp.presence.error',
		{ error: description, from: from }
	);
}

Presence.prototype.subscription = function(jid, type) {
	console.log("Sending " + type + " to " + jid)
	stanza = new builder.Element('presence', { to: jid, type: type, from: this.manager.jid })
	console.log(stanza.root().toString())
    this.client.send(stanza)
}

Presence.prototype.get = function(jid) {
	stanza = new builder.Element('presence', { to: jid, from: this.manager.jid })
	console.log(stanza.toString())
	this.client.send(stanza)
}

module.exports = new Presence
