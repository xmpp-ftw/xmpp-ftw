/* @flow */
'use strict';

var uuid = require('node-uuid')

var Base = function() {
    this.manager = false
    this.socket  = false
    this.client  = false
    this.cache   = null
}

Base.prototype.init = function(manager, ignoreEvents) {
    this.manager = manager
    this.socket  = manager.socket
    this.client  = manager.client
    if (!ignoreEvents) this.registerEvents()
}

Base.prototype.handles = function() {
    return false
}

Base.prototype.handle = function() {
    return false
}

Base.prototype.setCache = function(cache) {
    this.cache = cache
    return this
}

Base.prototype._getCache = function() {
    return this.cache
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

/* Namespaces */
Base.prototype.NS_REGISTER = 'jabber:iq:register'
Base.prototype.NS_DATA     = 'jabber:x:data'

Base.prototype.NS_ERROR    = 'urn:ietf:params:xml:ns:xmpp-stanzas'

Base.prototype._getJid = function(jid) {
    var node   = jid.split('@')[0]
    var domain = jid.split('/')[0]
    if (-1 === jid.indexOf('@')) {
        return { domain: jid }
    }
    if (-1 !== domain.indexOf('@')) {
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
    var errorElement = stanza.getChild('error')
    var error  = { type: errorElement.attrs.type }
    if (errorElement.attr('by'))  error.by = errorElement.attr('by')
    var errorMessages = stanza.getChild('error').children
    var name
    if (errorMessages) {
        errorMessages.forEach(function(errorMessage) {
            if (errorMessage.getNS() === this.NS_ERROR) {
                name = errorMessage.getName().toLowerCase()
                if ('text' === name) {
                    error.description = errorMessage.getText()
                } else {
                    error.condition = name
                }
            } else {
                error.application = { condition: errorMessage.getName().toLowerCase() }
                if (errorMessage.getNS()) error.application.xmlns = errorMessage.getNS()
                if (errorMessage.getText()) error.application.description = errorMessage.getText()
            }
        }, this)
    }
    return error
}

Base.prototype._clientError = function(message, original, callback) {
    var error = {
        type:        'modify',
        condition:   'client-error',
        description: message,
        request:     original
    }
    if (callback && (typeof callback === 'function'))
        return callback(error)
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
