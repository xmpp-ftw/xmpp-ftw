'use strict';

var uuid = require('node-uuid')

var Base = function() {
    this.manager = false
    this.socket  = false
    this.client  = false
}

Base.prototype.init = function(manager, ignoreEvents) {
    this.manager = manager
    this.socket  = manager.socket
    this.client  = manager.client
    if (!ignoreEvents) this.registerEvents()
}

Base.prototype.registerEvents = function() {
    if (!this._events) return
    var self = this
    Object.keys(this._events).forEach(function(event) {
        self.socket.removeAllListeners(event)
        self.socket.on(event, function(data, callback) {
            self[self._events[event]](data, callback)
        })
    })
}

Base.prototype.unregisterEvents = function() {
    if (!this._events) return
    var self = this
    Object.keys(this._events).forEach(function(event) {
        self.socket.removeAllListeners(event)
    })
}

Base.prototype.handles = function() {}
Base.prototype.handle  = function() {}

/* Namespaces */
Base.prototype.NS_REGISTER = 'jabber:iq:register'
Base.prototype.NS_DATA     = 'jabber:x:data'

Base.prototype.NS_ERROR    = 'urn:ietf:params:xml:ns:xmpp-stanzas'

Base.prototype._getJid = function(jid) {
    var node   = jid.split('@')[0]
    var domain = jid.split('/')[0]
    if (domain.indexOf('@' !== -1)) {
        domain = domain.split('@')[1]
    }
    var resource = jid.split('/')[1]
    var result = { domain: domain }
    if (node) {
        result.user = node
    }
    if (resource) {
        result.resource = resource
    }
    return result
}

Base.prototype._getId = function() {
        if (!Base.prototype.id) {
            Base.prototype.id = {
                counter: 0
            }
        }
        ++Base.prototype.id.counter
        return uuid.v4()
    }

Base.prototype._parseError = function(stanza) {
    var error  = { type: stanza.getChild('error').attrs.type }
    var errorMessage = stanza.getChild('error').children
    if (errorMessage)
        error.condition = errorMessage[0].getName().toLowerCase()
    errorMessage.forEach(function(message) {
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
    this.socket.send('xmpp.error.client', error)
    return false
}

Base.prototype._hasValidCallback = function(callback, data) {
    if (typeof callback !== 'function') {
        return this._clientError(
            'Missing callback', data
        )
    }
}

module.exports = Base
