var nodeXmpp = require('node-xmpp'),
    events = require('events')

var Xmpp = function(socket) {
    this.prototype = new events.EventEmitter
    this.socket    = socket
    this.tracking  = new Array()
    this.listeners = [
       require('./lib/roster'),
       require('./lib/presence'),
       require('./lib/chat')
    ]
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
        self.login(data.jid, data.password, data.resource)
    })
}

Xmpp.prototype.login = function(jid, password, resource) {
   console.log("Attempting to connect to " + jid)
   var self = this
   self.jid = jid
   var credentials = {jid: jid, password: password}
   if (resource) credentials.jid += '/' + resource
   this.client = new nodeXmpp.Client(credentials)
   this.listeners.forEach(function(listener) {
	   listener.init(self)
   })
   this.registerXmppEvents()
}

Xmpp.prototype.online = function() {
    console.log("Connection status is online")
    this.socket.emit('xmpp.connection', 'online')
}

Xmpp.prototype.error = function(error) {
	var message = JSON.stringify(error, function(key, value) {
		console.log(key, value)
        if (key == 'parent') {
        	if (!value) return value
        	return value.id
        }
        return value
    })
    this.socket.emit('xmpp.error', message)
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
    if (this.catchTracked(stanza)) return;
    var handled = false
    this.listeners.some(function(listener) {
    	if (true == listener.handles(stanza)) {
    		handled = true
    		if (true == listener.handle(stanza)) return true
    	}
    })
    if (!handled) console.log('No listeners for: ' + stanza)
}

var init = function(server) {
    return require('socket.io').listen(server)
}

exports.Xmpp = Xmpp
exports.init = init