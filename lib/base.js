var jQuery  = require('jQuery'),
    builder = require('node-xmpp'),
    base    = require('./base'),
    md5     = require('MD5'); 

var Base = function() {
    this.manager = false
    this.socket  = false
    this.client  = false
}

Base.prototype.init = function(manager) {
    this.manager = manager;
    this.socket  = manager.socket
    this.client  = manager.client
    this.registerEvents()
}

Base.prototype.registerEvents = function() {}
Base.prototype.handles        = function(stanza) {}
Base.prototype.handle         = function(stanza) {}

/* Namespaces */
Base.prototype.NS_REGISTER = 'jabber:iq:register'
Base.prototype.NS_DATA     = 'jabber:x:data'

Base.prototype.NS_ERROR    = 'urn:ietf:params:xml:ns:xmpp-stanzas'

Base.prototype._getJid = function(jid) {
    var node = jid.split('@')[0];
    var domain = jid.split('/')[0];
    if (domain.indexOf('@' != -1)) domain = domain.split('@')[1];
    var resource = jid.split('/')[1];
    return { user: node, domain: domain, resource: resource }
}

Base.prototype._getId = function() {
     if (!Base.prototype.id) {
         Base.prototype.id = { 
             identifier: md5(this.jid + new Date()).substring(23, 28), 
             counter: 1
         };
     } else {
         ++Base.prototype.id.counter;
     }
     return Base.prototype.id.identifier + ':' + Base.prototype.id.counter;
}

Base.prototype._parseError = function(stanza) {
    var parsed       = jQuery(stanza.toString())
    var error = { type: parsed.find('error').attr('type') }
    var errorMessage = parsed.find('error').children()
    var errorString  = null
    if (errorMessage.length > 0)
        error.condition = errorMessage[0].nodeName.toLowerCase()
    if (parsed.find('text').length > 0)
        error.description = parsed.find('text').text()
    return error
}

module.exports = Base
