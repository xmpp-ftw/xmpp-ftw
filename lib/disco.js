var jQuery = require('jQuery'),
    builder = require('node-xmpp')
    Base    = require('./base')

var Disco = function() {}

Disco.prototype = new Base()

Disco.prototype.NS = "jabber:iq:disco"

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
	var stanza = new builder.Element(
        'iq',
        { to: this.manager.jid.split('/')[0], type: 'get', id: this._getId() }
    ).c('query', {xmlns: this.NS}).up()

	this.manager.trackId(stanza.root().attr('id'), function(stanza) {
		self.handleDisco(stanza, callback)
	})
    this.client.send(stanza)	
}

Disco.prototype.getInfo = function(data, callback) {
}

module.exports = new Disco