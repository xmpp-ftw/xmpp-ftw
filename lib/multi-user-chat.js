var jQuery = require('jQuery'),
    builder = require('node-xmpp'),
    Base    = require('./base');
    
var MultiUserChat = function() {}

MultiUserChat.prototype = new Base()

MultiUserChat.prototype.rooms    = []
MultiUserChat.prototype.NS_USER  = "http://jabber.org/protocol/muc#user"
MultiUserChat.prototype.NS_ADMIN = "http://jabber.org/protocol/muc#admin"

MultiUserChat.prototype.roles = [
    'outcast', 'visitor', 'participant', 
    'member', 'moderator', 'admin', 'owner'
]
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
    this.socket.on('xmpp.muc.role', function(data, callback) {
    	self.setRole(data, callback)
    })
}

MultiUserChat.prototype.handles = function(stanza) {
	return (this.rooms.indexOf(stanza.attrs.from.split('/')[0]) != -1)
}

MultiUserChat.prototype.handle = function(stanza) {
    if (stanza.is('message')) {
    	if ('error' == stanza.type) return this.handleErrorMessage(stanza)
    	return this.handleMessage(stanza)
    }
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

MultiUserChat.prototype.handleErrorMessage = function(stanza) {
    this.socket.emit('xmpp.muc.error', { type: 'message', error: this._parseError(stanza) })
    return true
}

MultiUserChat.prototype.handlePresence = function(stanza) {
	var presence = {
		room: stanza.attrs.from.split('/')[0],
		nick: stanza.attrs.from.split('/')[1]
	}
	var item = jQuery(stanza.toString()).find('item')
    if (1 == item.length) {
    	if (item.attr('affiliation'))
    	    presence.affiliation = item.attr('affiliation')
    	if (item.attr('role'))
    	    presence.role = item.attr('role')
    }
	this.socket.emit('xmpp.muc.roster', presence)
	return true
}

MultiUserChat.prototype.sendMessage = function(data) {
    if (!data.room 
        || (this.rooms.indexOf(data.room) == -1)
        || !data.content
    ) return;
    var to   = data.room
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

MultiUserChat.prototype.setRole = function(data, callback) {
	if (!data.room 
	    || !data.nick
	    || !data.role
	    || (this.roles.indexOf(data.role) == -1)
	) return
	var self   = this
    var stanza = new builder.Element(
		'iq',
		{type: 'set', id: this._getId(), to: data.room }
	)
	    .c('query', { xmlns: this.NS_ADMIN })
	    .c('item', { nick: data.nick, role: data.role})
	this.manager.trackId(stanza.root().attr('id'), function(stanza) {
		if (typeof(callback) != 'function') return console.error('No callback provided')
		if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
		callback(null, null)
	})
	this.client.send(stanza)
}

module.exports = new MultiUserChat