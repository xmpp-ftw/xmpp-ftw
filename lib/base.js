var jQuery = require('jQuery'),
    builder = require('node-xmpp')
    base    = require('./base'); 

var Base = function() {};

Base.prototype.init = function(manager) {
	this.manager = manager;
	this.socket  = manager.socket
	this.client  = manager.client
	this.registerEvents()
}

Base.prototype.registerEvents = function() {}
Base.prototype.handles = function(stanza) {}
Base.prototype.handle = function(stanza) {}

Base.prototype.getJid = function(jid) {
	var node = jid.split('@')[0];
	var domain = jid.split('/')[0];
	if (domain.indexOf('@' != -1)) domain = domain.split('@')[1];
	var resource = jid.split('/')[1];
	return { node: node, domain: domain, resource: resource }
}
module.exports = Base