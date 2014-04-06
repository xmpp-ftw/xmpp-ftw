'use strict';

var Client = require('node-xmpp-client')
  , events = require('events')
  , JID    = require('node-xmpp-core').JID

var Xmpp = function(socket) {
    this.prototype = new events.EventEmitter()
    this.socket    = socket
    this.tracking  = []
    this.logger    = null
    
    this.listeners = [
        new require('../index').Roster(),
        new require('../index').Presence(),
        new require('../index').Chat()
    ]
    this.client = false
    this.registerSocketEvents()
}

Xmpp.prototype.MISSING_STANZA_ID = 'Missing stanza ID'
Xmpp.prototype.MISSING_CALLBACK = 'Missing callback'
Xmpp.prototype.INVALID_CALLBACK = 'Invalid callback'

Xmpp.prototype.clearListeners = function() {
    this.listeners = []
}

Xmpp.prototype.addListener = function(listener) {
    if (this.client) listener.init(this)
    this.listeners.unshift(listener)
}

Xmpp.prototype.registerXmppEvents = function() {
    var self = this
    this.client.on('error', function(error) { self.error(error) })
    this.client.on('online', function(data) {
        self.jid = data.jid.user + '@' +
            data.jid.domain + '/' + data.jid.resource
        self.fullJid = new JID(self.jid)
        self.online()
    })
    this.client.on('stanza', function(stanza) { self.handleStanza(stanza) })
}

Xmpp.prototype.registerSocketEvents = function() {
    var self = this
    this.socket.on('xmpp.login', function(data) {
        self.logout(function() {})
        self.login(data)
    })
    this.socket.on('xmpp.login.anonymous', function(data) {
        self.logout(function() {})
        self.anonymousLogin(data)
    })
    this.socket.on('xmpp.logout', function(data, callback) {
        self.logout(callback)
    })
}

Xmpp.prototype.unRegisterSocketEvents = function() {
    if (!this.listeners) return
    this.listeners.forEach(function(listener) {
        listener.unregisterEvents()
    })
}

Xmpp.prototype._initialiseListeners = function() {
    var self = this
    this.listeners.forEach(function(listener) {
        listener.init(self)
    })
}

Xmpp.prototype.logout = function(callback) {
    if (!this.client) return
    this.client.end()
    delete this.client
    if (callback) return callback(null, true)
    this.socket.end()
}

Xmpp.prototype.anonymousLogin = function(data) {
    if (!data.jid) return
    this._getLogger().info('Attempting anonymous connection ' + data.jid)
    if (-1 !== data.jid.indexOf('@'))
        data.jid = data.jid.split('@')[1]
    if (-1 !== data.jid.indexOf('/')) {
        data.resource = data.jid.split('/')[1]
        data.jid      = data.jid.split('/')[0]
    }
    this.jid = data.jid
    this.domain = data.jid.split('@')[1]
    var credentials = data
    credentials.jid =  '@' + data.jid
    credentials.preferredSaslMechanism = 'ANONYMOUS'
    if (data.resource) credentials.jid += '/' + data.resource
    if (data.host) credentials.host = data.host
    this._connect(credentials)
}

Xmpp.prototype.login = function(data) {
    this._getLogger().info('Attempting to connect to ' + data.jid)
    if (!data.jid || !data.password)
        return this.socket.send('xmpp.error', {
            type: 'auth',
            condition: 'client-error',
            description: 'Missing jid and/or password',
            request: data
        })

    var jid = data.jid
    var password = data.password
    if (-1 === data.jid.indexOf('@'))
        jid += '@' + data.host
    if (-1 !== jid.indexOf('/')) {
        data.resource = jid.split('/')[1]
        jid           = jid.split('/')[0]
    }
    this.domain = jid.split('@')[1]
    if (data.resource) {
        jid += '/' + data.resource
        delete data.resource
    }
    var credentials      = data
    credentials.jid      =  jid
    credentials.password =  password
    this._connect(credentials)
}

Xmpp.prototype._connect = function(options) {
    this.jid    = options.jid
    this.client = new Client(options)

    this.client.connection.socket.setTimeout(0)
    this.client.connection.socket.setKeepAlive(true, 10000)

    this.registerXmppEvents()
}

Xmpp.prototype.online = function() {
    this._initialiseListeners()
    this.socket.send(
        'xmpp.connection',
        { status: 'online', jid: this.fullJid }
    )
}

Xmpp.prototype.error = function(error) {
    this._getLogger().error(error)
    var message, type, condition
    if ('Registration error' === error.message) {
        message = error.message
        type = 'auth'
        condition = 'cancel'
    } else {
        message = JSON.stringify(error, function(key, value) {
            if ('parent' === key) {
                if (!value) return value
                return value.id
            }
            return value
        })
    }
    this.socket.send('xmpp.error', {
        type: type || 'cancel',
        condition: condition || 'unknown',
        description: message
    })
}

Xmpp.prototype.trackId = function(id, callback) {
    if (!id)
        throw new Error(this.MISSING_STANZA_ID)
    var jid
    if (typeof id === 'object') {
        if (!id.root().attr('id'))
            throw new Error(this.MISSING_STANZA_ID)
        jid = id.root().attrs.to
        id = id.root().attrs.id
        if (!jid) jid = this.getJidType('domain')
    }
    if (!callback)
        throw new Error(this.MISSING_CALLBACK)
    if (typeof callback !== 'function')
        throw new Error(this.INVALID_CALLBACK)
    this.tracking[id] = { callback: callback, jid: jid }
}

Xmpp.prototype.catchTracked = function(stanza) {
    var id = stanza.root().attr('id')
    if (!id || !this.tracking[id]) return false
    if ((this.tracking[id].jid) &&
        (stanza.attr('from') !== this.tracking[id].jid)) {
        // Ignore stanza its an ID spoof!
        return true
    }
    this.tracking[id].callback(stanza)
    return true
}

Xmpp.prototype.handleStanza = function(stanza) {
    this._getLogger().info('Stanza received: ' + stanza)
    if (this.catchTracked(stanza)) return
    var handled = false
    this.listeners.some(function(listener) {
        if (true === listener.handles(stanza)) {
            handled = true
            if (true === listener.handle(stanza)) return true
        }
    })
    if (!handled) this._getLogger().info('No listeners for: ' + stanza)
}

Xmpp.prototype.getJidType = function(type) {
    switch (type) {
        case 'full':
            return this.fullJid.user + '@' +
                this.fullJid.domain + '/' +
                this.fullJid.resource
        case 'bare':
            return this.fullJid.user + '@' + this.fullJid.domain
        case 'domain':
            return this.fullJid.domain
    }
}

Xmpp.prototype.setLogger = function(logger) {
    this.logger = logger
    return logger
}

Xmpp.prototype._getLogger = function() {
    if (!this.logger) {
        this.logger = {
            log: function() {},
            info: function() {},
            warn: function() {},
            error: function() {}
        }
    }
    return this.logger
}

module.exports = Xmpp