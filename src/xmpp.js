var nodeXmpp = require('node-xmpp')
    , events = require('events')
    , $ = require('jQuery')

var Xmpp = function(socket) {
    this.prototype = new events.EventEmitter;
    this.socket = socket;
    this.registerSocketEvents();
    
}

Xmpp.prototype.registerXmppEvents = function() {
    var self = this;
    this.client.on('error', function(error) { self.error(error); });
    this.client.on('online', function() { self.online(); });
    this.client.on('stanza', function(stanza) { self.handleStanza(stanza); });
}

Xmpp.prototype.registerSocketEvents = function() {
    var self = this;
    this.socket.on('xmpp.presence', function(data) {
        self.setPresence(data);
    });
    this.socket.on('xmpp.login', function(data) { 
        self.login(data.jid, data.password);
    });
    this.socket.on('xmpp.message.send', function(data) {
        self.sendMessage(data);
    });
}

Xmpp.prototype.setPresence = function(data) {
    if (!this.client) return this.socket.emit('xmpp.error', 'You are not connected');
    this.client.send(new nodeXmpp.Element('presence', { }).
		    c('show').t(data.status || "online").up().
		    c('status').t(data.message || ""));
}

Xmpp.prototype.sendMessage = function(data) {
    this.client.send(new nodeXmpp.Element(
        'message',
        { to: data.to, type: 'chat'}
    ).c('body').t(data.message));
}

Xmpp.prototype.login = function(jid, password) {
   console.log("Attempting to connect to " + jid);
   this.client = new nodeXmpp.Client({jid: jid, password: password});
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
    if (stanza.is('message')) return this.handleMessage(stanza);
    if (stanza.is('presence')) return this.handlePresence(stanza);
    console.log('I don\'t handle this: ' + stanza);
}

Xmpp.prototype.handlePresence = function(presence) {
    this.socket.emit('xmpp.presence', {from: presence.attrs.from, status: $(presence.toString()).find('show').text(), message: $(presence.toString()).find('status').text()});
}

Xmpp.prototype.handleMessage = function(message) {
    if (message.attrs.type == 'chat') return this.handleChat(message);
}

Xmpp.prototype.handleChat = function(message) {
    chat = { from: message.attrs.from, content: $(message.toString()).find('body').text() };
    this.socket.emit('xmpp.message.chat', chat);
}

var init = function(server) {
    return require('socket.io').listen(server);
}

exports.Xmpp = Xmpp;
exports.init = init;
