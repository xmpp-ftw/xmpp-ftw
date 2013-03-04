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
    this.socket.on('xmpp.muc.message', function(data) {
    	self.sendMessage(data)
    })
    this.socket.on('xmpp.muc.leave', function(data) {
    	self.leave(data)
    })
}

MultiUserChat.prototype.handles = function(stanza) {
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
	return true
}

MultiUserChat.prototype.sendMessage = function(data) {
    if (!data.room 
        || (this.rooms.indexOf(data.room) == -1)
        || !data.content
    ) return;
    var to = data.room
    var type = 'groupchat'
    if (data.to) {
    	to   = to + '/' + data.to
    	type = 'chat'
    }
    this.client.send(new builder.Element(
        'message',
        { to: to, type: type }
    ).c('body').t(data.content))
}

MultiUserChat.prototype.join = function(data) {
	if (!data.room || !data.nick) return
	this.rooms.push(data.room)
	this.client.send(new builder.Element(
        'presence',
        { to: data.room + '/' + data.nick }
    ))
}

MultiUserChat.prototype.leave = function(data) {
	if (!data.room || (this.rooms.indexOf(data.room) == -1)) return
	delete this.rooms[this.rooms.indexOf(data.room)]
	this.client.send(new builder.Element(
        'presence',
        { to: data.room, type: 'unavailable' }
    ))
}

module.exports = new MultiUserChat