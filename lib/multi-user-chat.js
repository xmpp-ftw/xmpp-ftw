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
	console.log(this.rooms, stanza.attrs.from.split('/')[0], (this.rooms.indexOf(stanza.attrs.from.split('/')[0]) != -1))
	return (this.rooms.indexOf(stanza.attrs.from.split('/')[0]) != -1)
}

MultiUserChat.prototype.handle = function(stanza) {
    if (stanza.is('message')) return this.handleMessage(stanza)
    return this.handlePresence(stanza)
}

MultiUserChat.prototype.handleMessage = function(stanza) {
	var isPrivate = false
	if (stanza.attrs.type == 'chat') isPrivate = true
	
	var parsed = jQuery(stanza.toString())

	var message = {
		room: stanza.attrs.from.split('/')[0],
		nick: stanza.attrs.from.split('/')[1],
		content: parsed.find('body').text(),
		'private': isPrivate
	}
	if (parsed.find('delay').length > 0) message.delay = parsed.find('delay').text()
	this.socket.emit('xmpp.muc.message', message)
	return true
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