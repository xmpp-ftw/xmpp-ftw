var jQuery = require('jQuery'),
    builder = require('node-xmpp')
    Base    = require('./base')

var Disco = function() {}

Disco.prototype = new Base()

Disco.prototype.NS_ITEMS = "http://jabber.org/protocol/disco#items"
Disco.prototype.NS_INFO  = "http://jabber.org/protocol/disco#info"

Disco.prototype.registerEvents = function() {
	var self = this
	this.socket.on('xmpp.discover.items', function(data, callback) {
		self.getItems(data, callback)
	})
	this.socket.on('xmpp.discover.info', function(data, callback) {
		self.getInfo(callback)
	})
}

Disco.prototype.handles = function(stanza) {
    return false
}

Disco.prototype.handle = function(stanza) {
    return true
}

Disco.prototype.getItems = function(data, callback) {
	var self   = this
	if (!data.of) return
	
	var stanza = new builder.Element(
        'iq',
        { to: data.of, type: 'get', id: this._getId() }
    ).c('query', {xmlns: this.NS_ITEMS}).up()

	this.manager.trackId(stanza.root().attr('id'), function(stanza) {
		self._handleDiscoItems(stanza, callback)
	})
    this.client.send(stanza)	
}

Disco.prototype._handleDiscoItems = function(stanza, callback) {
	var self = this
	if (typeof(callback) != 'function') return console.error('No callback provided')
    if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
    items = []
    jQuery(stanza.toString()).find('item').each(function(index, item) {
    	items.push(item.getAttribute('jid'))
    })
    callback(null, items)
}

Disco.prototype.getInfo = function(data, callback) {
}

module.exports = new Disco