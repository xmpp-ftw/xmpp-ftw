var jQuery = require('jQuery'),
    builder = require('node-xmpp')
    Base    = require('./base');

var Roster = function() {}

Roster.prototype = new Base();

Roster.prototype.NS = "jabber:iq:roster";

Roster.prototype.registerEvents = function() {
	var self = this
	this.socket.on('xmpp.roster.get', function(data, callback) {
		self.get(callback);
	});

}

Roster.prototype.handles = function(stanza) {
    return stanza.is('iq') &&
        (jQuery(stanza.toString()).find('query').attr('xmlns') == this.NS);
}

Roster.prototype.handle = function(stanza) {

}

Roster.prototype.get = function(callback) {
	var self   = this;
	var stanza = new builder.Element(
        'iq',
        { to: this.manager.jid.split('/')[0], type: 'get', id: this.getId() }
    ).c('query', {xmlns: this.NS}).up();
    
	console.log("Sending: " + stanza.toString());
	this.manager.trackId(stanza.attr('id'), function(stanza) {
		self.handleRoster(stanza, callback);
	})
    this.client.send(stanza)	
}

Roster.prototype.handleRoster = function(stanza, callback) {
	var self = this;
	var items = new Array();
	jQuery(stanza.toString()).find('item').each(function(index, item) {
		items.push({
			jid: self.getJid(item.getAttribute('jid')),
			name: item.getAttribute('name'),
			ask: item.getAttribute('ask'),
			subscription: item.getAttribute('subscription'),
			group: jQuery(item).find('group').text()
		});
	})
	callback(items);
}

module.exports = new Roster