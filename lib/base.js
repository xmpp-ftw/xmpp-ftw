var jQuery  = require('jQuery'),
    builder = require('node-xmpp'),
    base    = require('./base'),
    md5     = require('MD5'); 

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

Base.prototype.getId = function() {
     if (!Base.prototype.id) {
     	Base.prototype.id = { 
     		identifier: md5(this.jid + new Date()).substring(23, 28), 
     		counter: 1
     	};
     } else {
     	Base.prototype.id.counter++;
     }
     return Base.prototype.id.identifier + ':' + Base.prototype.id.counter;
}

Base.prototype._parseError = function(stanza) {
    var parsed       = jQuery(stanza.toString())
    var errorString  = parsed.find('error').attr('type')
    var errorMessage = parsed.find("[xmlns='urn:ietf:params:xml:ns:xmpp-stanzas']")
    if (errorMessage.length > 0)
        errorString = errorMessage[0].nodeName
    return errorString
}

module.exports = Base