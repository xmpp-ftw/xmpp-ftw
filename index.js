var nodeXmpp = require('node-xmpp')
    , events = require('events')
    , $ = require('jQuery')

var Xmpp = function(socket) {
    this.prototype = new events.EventEmitter;
    this.socket    = socket;
    this.registerSocketEvents();
    
    this.listeners = [
       // require('./lib/presence'),
       require('./lib/chat')
    ]
}

Xmpp.prototype.clearListeners = function() {
	this.listeners = [];
}

Xmpp.prototype.addListener = function(listener) {
	if (this.client) listener.init(this.socket, this.client, nodeXmpp, $)
	this.listeners.unshift(listener)
}

Xmpp.prototype.registerXmppEvents = function() {
    var self = this;
    this.client.on('error', function(error) { self.error(error); });
    this.client.on('online', function() { self.online(); });
    this.client.on('stanza', function(stanza) { self.handleStanza(stanza); });
}

Xmpp.prototype.registerSocketEvents = function() {
    var self = this;

    this.socket.on('xmpp.login', function(data) { 
        self.login(data.jid, data.password);
    });
    /*
    this.socket.on('xmpp.presence', function(data) {
        self.setPresence(data);
    });
    */
}
/*
Xmpp.prototype.setPresence = function(data) {
    if (!this.client) return this.socket.emit('xmpp.error', 'You are not connected');
    this.client.send(new nodeXmpp.Element('presence', { }).
		    c('show').t(data.status || "online").up().
		    c('status').t(data.message || ""));
}
*/
Xmpp.prototype.login = function(jid, password) {
   console.log("Attempting to connect to " + jid);
   var self = this
   this.client = new nodeXmpp.Client({jid: jid, password: password});
   this.listeners.forEach(function(listener) {
	   listener.init(self.socket, self.client, nodeXmpp, $)
   })
   this.registerXmppEvents();
}

Xmpp.prototype.online = function(status) {
     console.log("Connection status is online");
     this.socket.emit('xmpp.connection', 'online');
}

Xmpp.prototype.error = function(error) {
     this.socket.emit('xmpp.error', error);
}

Xmpp.prototype.handleStanza = function(stanza) {
    console.log("Stanza received: " + stanza);
    var handled = false
    this.listeners.forEach(function(listener) {
    	if (listener.handles(stanza)) {
    		listener.handle(stanza)
    		handled = true
    		return 
    	}
    })
    /*
    if (stanza.is('presence')) return this.handlePresence(stanza);
    */
    if (!handled) console.log('No listeners for: ' + stanza);
}
/*
Xmpp.prototype.handlePresence = function(presence) {
    this.socket.emit('xmpp.presence', {from: presence.attrs.from, status: $(presence.toString()).find('show').text(), message: $(presence.toString()).find('status').text()});
}
*/
var init = function(server) {
    return require('socket.io').listen(server);
}

exports.Xmpp = Xmpp;
exports.init = init;
