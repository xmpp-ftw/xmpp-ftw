var builder = require('node-xmpp'),
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
    var node   = jid.split('@')[0];
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
    var error  = { type: stanza.getChild('error').attrs.type }
    var errorMessage = stanza.getChild('error').getChildren()
    var errorString  = null
    if (errorMessage.length > 0)
        error.condition = errorMessage[0].getName().toLowerCase()
    errorMessage.each(function(message) {
        if (message.getChild('text')) 
            error.description = message.getChild('text').getText()
    })
    return error
}

Base.prototype._clientError = function(message, original, callback) {
    var error = {
        type:        'modify',
        condition:   'client-error',
        description: message,
        request:     original
    }
    if (callback) return callback(error)
    this.socket.emit('xmpp.error.client', error)
    return true
}

module.exports = Base
