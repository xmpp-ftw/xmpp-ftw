var jQuery = require('jQuery'),
    builder = require('node-xmpp')
    Base    = require('./base');

var Presence = function() {}

Presence.prototype = new Base();

Presence.prototype.current = 'online';

Presence.prototype.registerEvents = function() {
	var self = this
    this.socket.on('xmpp.presence', function(data) {
        self.sendPresence(data);
    });
    this.socket.on('xmpp.presence.subscribe', function(data) {
    	self.subscription(data.to, 'subscribe');
    });
    this.socket.on('xmpp.presence.subscribed', function(data) {
    	self.subscription(data.to, 'subscribed');
    });
    this.socket.on('xmpp.presence.unsubscribe', function(data) {
    	self.subscription(data.to, 'unsubscribed');
    });
    this.socket.on('xmpp.presence.get', function(data) {
    	self.get(data.to);
    });
    this.socket.on('xmpp.presence.offline', function() {
    	self.sendPresence({type: 'unavailable'});
    });
    this.socket.on('disconnect', function() {
    	if (self.current != 'unavailable') self.sendPresence({type: 'unavailable'});
    });
}

Presence.prototype.handles = function(stanza) {
	return stanza.is('presence')
}

Presence.prototype.handle = function(stanza) {
	var stanzaStr = stanza.toString();
	if (stanza.attr('type') == 'subscribe') return this.handleSubscription(stanza);
	if (stanza.attr('type') == 'error') return this.handleError(stanza);
    presence = { 
    	from: this.getJid(stanza.attrs.from),
    	show: jQuery(stanzaStr).find('show').text(),
    	status: jQuery(stanzaStr).find('status').text(),
    	priority: jQuery(stanzaStr).find('priority').text()
    };
    this.socket.emit('xmpp.presence', presence);
}

Presence.prototype.sendPresence = function(data) {
	stanza = new builder.Element('presence');
	if (data.type && data.type == 'unavailable') stanza.attr('type', data.type);
	if (data.status) stanza.c('status').t(data.status).up();
	if (data.priority) stanza.c('priority').t(data.priority).up();
	if (data.show) stanza.c('show').t(data.show).up();
    this.client.send(stanza);
}

Presence.prototype.handleSubscription = function(stanza) {
    request = { from: this.getJid(stanza.attr('from')) };
    var stanzaStr = stanza.toString();
    if (jQuery(stanzaStr).find('nick')) request.nick = jQuery(stanzaStr).find('nick').text();
    this.socket.emit('xmpp.presence.subscribe', request);
}

Presence.prototype.handleError = function(stanza) {
	this.socket.emit(
		'xmpp.presence.error',
		{ error: jQuery(stanza.toString()).find('text').text() }
	);
}

Presence.prototype.subscription = function(jid, type) {
	stanza = new builder.Element('presence', { to: jid, type: type, from: this.manager.jid });
    this.client.send(stanza);
}

Presence.prototype.get = function(jid) {
	stanza = new builder.Element('presence', { to: jid, from: this.manager.jid });
	this.client.send(stanza);
}
module.exports = new Presence