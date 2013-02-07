
var Chat = function() {};

Chat.prototype.init = function(socket, client, builder, jQuery) {
	this.socket  = socket
	this.client  = client
	this.builder = builder
	this.jQuery  = jQuery
	this.registerEvents()
}

Chat.prototype.registerEvents = function() {
	var self = this
    this.socket.on('xmpp.message.chat', function(data) {
        self.sendMessage(data);
    });
}

Chat.prototype.handles = function(stanza) {
	return (stanza.is('message') && stanza.attrs.type == 'chat')
}

Chat.prototype.handle = function(stanza) {
    chat = { from: stanza.attrs.from, content: this.jQuery(stanza.toString()).find('body').text() };
    this.socket.emit('xmpp.message.chat', chat);
}

Chat.prototype.sendMessage = function(data) {
	this.client.send(new this.builder.Element(
        'message',
        { to: data.to, type: 'chat'}
    ).c('body').t(data.message));
	console.log("Sending: " + new this.builder.Element(
        'message',
        { to: data.to, type: 'chat'}
    ).c('body').t(data.message))
}
module.exports = new Chat