var jQuery = require('jQuery'),
    builder = require('node-xmpp'),
    Base    = require('./base');
    
var MultiUserChat = function() {}

MultiUserChat.prototype = new Base()

MultiUserChat.prototype.rooms = []

MultiUserChat.prototype.registerEvents = function() {
	var self = this
    this.socket.on('xmpp.muc.join', function(data) {
    	self.join(data)
    })
}

MultiUserChat.prototype.handles = function(stanza) {
	console.log(this.rooms)
	return this.rooms.indexOf(stanza.attrs.from.split('/')[0])
}

MultiUserChat.prototype.handle = function(stanza) {
    if (stanza.is('message')) return this.handleMessage(stanza)
    return this.handlePresence(stanza)
}

MultiUserChat.prototype.handleMessage = function(stanza) {
	var private = false
	if (stanza.attrs.type == 'chat') private = true
	
	var parsed = jQuery(stanza.toString())
	
	chat = { 
    	from: this.getJid(stanza.attrs.from),
    	content: 
    };
	var message = {
		room: stanza.attrs.from.split('/')[0],
		nick: stanza.attrs.from.split('/')[1],
		content: parsed.find('body').text()
	}
	if (parsed.find('delay').length > 0) message.delay = parsed.find('delay').text()
	this.socket.emit('xmpp.muc.message', message)
}

MultiUserChat.prototype.handlePresence = function(stanza) {
	this.socket.emit(
		'xmpp.muc.roster',
		{
			room: stanza.attrs.from.split('/')[0],
			nick: stanza.attrs.from.split('/')[1]
		}
	)
}

MultiUserChat.prototype.join = function(data) {
	if (!data.room || !data.nick) return
	console.log('attempt to join room', data)
	this.rooms.push(data.room)
	this.client.send(new builder.Element(
        'presence',
        { to: data.room + '/' + data.nick }
    ))
}

module.exports = new MultiUserChat