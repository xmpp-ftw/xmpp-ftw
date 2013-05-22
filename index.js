var nodeXmpp = require('node-xmpp'),
    events = require('events')

var chat = require('./lib/chat')
var presence = require('./lib/presence')
var roster = require('./lib/roster')
    
var Xmpp = function(socket) {
    this.prototype = new events.EventEmitter
    this.socket    = socket
    this.tracking  = new Array()
    
    this.listeners = [
       new roster(),
       new presence(),
       new chat()
    ]
    this.client = false
    this.registerSocketEvents()
} 

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
    this.client.on('online', function() { self.online() })
    this.client.on('stanza', function(stanza) { self.handleStanza(stanza) })
}

Xmpp.prototype.registerSocketEvents = function() {
    var self = this
    this.socket.on('xmpp.login', function(data) { 
        self.login(data.jid, data.password, data.resource, data.host)
    })
    this.socket.on('xmpp.login.anonymous', function(data) {
        self.anonymousLogin(data)
    })
    this.socket.on('xmpp.logout', function(data, callback) {
        self.logout(callback)
    })
}

Xmpp.prototype.logout = function(callback) {
   if (!this.client) return
   this.client.emit('end')
   delete this.client
   if (callback) callback(null, true)
   this.socket.disconnect()
}

Xmpp.prototype.anonymousLogin = function(data) {
   if (!data.jid) return
   console.log("Attempting anonymous connection " + data.jid)
   if (-1 != data.jid.indexOf('@'))
       data.jid = data.jid.split('@')[1]
   if (-1 !== data.jid.indexOf('/')) {
       data.resource = data.jid.split('/')[1]
       data.jid      = data.jid.split('/')[0]
   }
   this.jid = data.jid
   this.domain = data.jid.split('@')[1]
   var credentials = {jid: '@' + data.jid, preferredSaslMechanism: 'ANONYMOUS'}
   if (data.resource) credentials.jid += '/' + data.resource
   if (data.host) credentials.host = data.host
   this._connect(credentials)
}

Xmpp.prototype.login = function(jid, password, resource, host) {
   console.log("Attempting to connect to " + jid)
   if (!jid || !password) return
   if (-1 === jid.indexOf('@')) 
       jid += '@' + host
   if (-1 !== jid.indexOf('/')) {
       resource = jid.split('/')[1]
       jid      = jid.split('/')[0]
   }
   this.domain = jid.split('@')[1]
   var credentials = {jid: jid, password: password}
   if (resource) credentials.jid += '/' + resource
   if (host) credentials.host = host
   this._connect(credentials)
}

Xmpp.prototype._connect = function(options) {
   var self = this
   this.jid    = options.jid
   this.client = new nodeXmpp.Client(options)
   this.listeners.forEach(function(listener) {
       listener.init(self)
   })
   this.registerXmppEvents()
}

Xmpp.prototype.online = function() {
    this.socket.emit('xmpp.connection', 'online')
}

Xmpp.prototype.error = function(error) {
    var message = JSON.stringify(error, function(key, value) {
        if (key == 'parent') {
            if (!value) return value
            return value.id
        }
        return value
    })
    this.socket.emit('xmpp.error', {
        type: 'cancel',
        condition: 'unknown',
        description: message
    })
}

Xmpp.prototype.trackId = function(id, callback) {
    this.tracking[id] = callback
}

Xmpp.prototype.catchTracked = function(stanza) {
    if (!stanza.attr('id') || !this.tracking[stanza.attr('id')]) return false;
    this.tracking[stanza.attr('id')](stanza)
    return true
}

Xmpp.prototype.handleStanza = function(stanza) {
    console.log("Stanza received: " + stanza)
    if (this.catchTracked(stanza)) return
    var handled = false
    this.listeners.some(function(listener) {
        if (true == listener.handles(stanza)) {
            handled = true
            if (true == listener.handle(stanza)) return true
        }
    })
    if (!handled) console.log('No listeners for: ' + stanza)
}

exports.Xmpp = Xmpp
