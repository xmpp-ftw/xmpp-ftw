var builder  = require('node-xmpp'),
    Base     = require('./base'),
    dataForm = require('./utils/xep-0004'),
    xhtmlIm  = require('./utils/xep-0071')

var MultiUserChat = function() {
    this.rooms = []
}

MultiUserChat.prototype = new Base()

MultiUserChat.prototype.NS_USER     = "http://jabber.org/protocol/muc#user"
MultiUserChat.prototype.NS_ADMIN    = "http://jabber.org/protocol/muc#admin"
MultiUserChat.prototype.NS_OWNER    = 'http://jabber.org/protocol/muc#owner'
MultiUserChat.prototype.NS_CONFIG   = 'http://jabber.org/protocol/muc#roomconfig'

MultiUserChat.prototype.roles = [
    'outcast', 'visitor', 'participant', 
    'member', 'moderator', 'admin', 'owner'
]

MultiUserChat.prototype.PLAIN = 'plain'
MultiUserChat.prototype.XHTML = 'xhtml'

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
    this.socket.on('xmpp.muc.affiliation', function(data, callback) {
        self.setAffiliation(data, callback)
    })
    this.socket.on('xmpp.muc.register.info', function(data, callback) {
        self.registrationInformation(data, callback)
    })
    this.socket.on('xmpp.muc.register', function(data, callback) {
        self.register(data, callback)
    })
    this.socket.on('xmpp.muc.room.config.get', function(data, callback) {
        self.getRoomInformation(data, callback)
    })
    this.socket.on('xmpp.muc.room.config.set', function(data, callback) {
        self.setRoomInformation(data, callback)
    })
}

MultiUserChat.prototype.handles = function(stanza) {
    return (stanza.attrs.from 
        && this.rooms.indexOf(stanza.attrs.from.split('/')[0]) != -1)
}

MultiUserChat.prototype.handle = function(stanza) {
    if (stanza.is('message')) {
        if ('error' == stanza.type) return this.handleErrorMessage(stanza)
        return this.handleMessage(stanza)
    }
    return this.handlePresence(stanza)
}

MultiUserChat.prototype.handleMessage = function(stanza) {

    if (stanza.getChild('status')) return this._handleRoomStatusUpdate(stanza)
    
    var isPrivate = false
    if (stanza.attrs.type == 'chat') isPrivate = true
    
    var message = {
        room:    stanza.attrs.from.split('/')[0],
        nick:    stanza.attrs.from.split('/')[1],
        private: isPrivate
    }
    if (stanza.getChild('delay'))
        message.delay = stanza.getChild('delay').attrs.stamp
    if (html = stanza.getChild('html')) {
       message.format  = this.XHTML
       message.content = html.getChild('body').children.join().toString()
    } else if (body = stanza.getChild('body')) {
        message.content = body.getText()
        message.format  = this.PLAIN
    }
    if (message.content) this.socket.emit('xmpp.muc.message', message)
    return true
}

MultiUserChat.prototype._handleRoomStatusUpdate = function(stanza) {
     var updates = { room: stanza.attrs.from, status: [] }
     stanza.getChildren('status').forEach(function(status) {
         updates.status.push(parseInt(status.attrs.code))
     })
     this.socket.emit('xmpp.muc.room.config', updates)    
}

MultiUserChat.prototype.handleErrorMessage = function(stanza) {
    var error = {
        type: 'message',
        error: this._parseError(stanza),
        room: stanza.attrs.from.split('/')[0]
    }
    var body = stanza.getChildren('body')
    if (body) error.content = body.getText()
    this.socket.emit('xmpp.muc.error', error)
    return true
}

MultiUserChat.prototype.handlePresence = function(stanza) {
    var presence = {
        room: stanza.attrs.from.split('/')[0],
        nick: stanza.attrs.from.split('/')[1],
        status: stanza.attrs.type
    }
    var item = stanza.getChild('item')
    if (item) {
        if (item.attrs.affiliation)
            presence.affiliation = item.attrs.affiliation
        if (item.attrs.role)
            presence.role = item.attrs.role
    }
    this.socket.emit('xmpp.muc.roster', presence)
    return true
}

MultiUserChat.prototype.sendMessage = function(data) {
    if (!data.room) return this._clientError("Missing 'room' key", data)
    if (this.rooms.indexOf(data.room) == -1)
        return this._clientError("Not registered with this room", data)
    var format = (data.format && (this.XHTML == data.format)) ? 
        this.XHTML : this.PLAIN
    var to     = data.room
    var type   = 'groupchat'

    if (data.to) {
        to   = to + '/' + data.to
        type = 'chat'
    }
    return xhtmlIm(data, {to: to, type: type}, this)
}

MultiUserChat.prototype.join = function(data) {
    if (!data.room) return this._clientError("Missing 'room' key", data)
    if (!data.nick) return this._clientError("Missing 'nick' key", data)
    this.rooms.push(data.room)
    this.client.send(new builder.Element(
        'presence',
        { to: data.room + '/' + data.nick }
    ))
}

MultiUserChat.prototype.leave = function(data) {
    if (!data.room) return this._clientError("Missing 'room' key", data)
    if (this.rooms.indexOf(data.room) == -1)
        return this._clientError("Not registered with this room", data)
    delete this.rooms[this.rooms.indexOf(data.room)]
    this.client.send(new builder.Element(
        'presence',
        { to: data.room, type: 'unavailable' }
    ))
}

MultiUserChat.prototype.setRole = function(data, callback) {
    if (!data.room)
        return this._clientError("Missing 'room' key", data, callback) 
    if (!data.nick)
        return this._clientError("Missing 'nick' key", data, callback)
    if (!data.role) 
        return this._clientError("Missing 'role' key", data, callback)
    if (this.roles.indexOf(data.role) == -1)
        return this._clientError("Invalid 'role' passed", data, callback)

    this._sendMembershipUpdate(new builder.Element(
        'iq',
        {type: 'set', id: this._getId(), to: data.room }
        )
        .c('query', { xmlns: this.NS_ADMIN })
        .c('item', { nick: data.nick, role: data.role}),
        callback
    )
}

MultiUserChat.prototype.setAffiliation = function(data, callback) {
    if (!data.room)
        return this._clientError("Missing 'room' key", data, callback)
    if (!data.jid)
        return this._clientError("Missing 'jid' key", data, callback)
    if (!data.affiliation)
        return this._clientError("Missing 'affiliation' key", data, callback)
    if (this.roles.indexOf(data.role) == -1)
        return this._clientError("Invalid 'role' passed", data, callback)

    this._sendMembershipUpdate(new builder.Element(
        'iq',
        {type: 'set', id: this._getId(), to: data.room }
        )
        .c('query', { xmlns: this.NS_ADMIN })
        .c('item', { jid: data.jid, affiliation: data.affiliation}),
        callback
    )
}

MultiUserChat.prototype._sendMembershipUpdate = function(stanza, callback) {
    var self = this
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (!callback) return console.error('No callback provided')
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)
}

MultiUserChat.prototype.registrationInformation = function(data, callback) {
    if (!data.room) 
        return this._clientError("Missing 'room' key", data, callback)

    var self   = this
    var stanza = new builder.Element(
        'iq',
        {type: 'get', id: this._getId(), to: data.room }
    ).c('query', { xmlns: this.NS_REGISTER }).up()
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (typeof(callback) != 'function') return console.error('No callback provided')
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        callback(null, dataForm.parseForm(stanza))
    })
    this.client.send(stanza)
}

MultiUserChat.prototype.getRoomInformation = function(data, callback) {
    if (!data.room) 
        return this._clientError("Missing 'room' key", data, callback)

    var self   = this
    var stanza = new builder.Element(
        'iq',
        {type: 'get', id: this._getId(), to: data.room }
    ).c('query', { xmlns: this.NS_OWNER }).up()
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (typeof(callback) != 'function') return console.error('No callback provided')
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        callback(null, dataForm.parseForm(stanza))
    })
    this.client.send(stanza)
}

MultiUserChat.prototype.setRoomInformation = function(data, callback) {
    if (!data.room)
        return this._clientError("Missing 'room' key", data, callback)
    if (!data.form)
        return this._clientError("Missing 'form' key", data, callback)

    var self   = this
    var stanza = new builder.Element(
        'iq',
        {type: 'set', id: this._getId(), to: data.room }
    ).c('query', { xmlns: this.NS_OWNER })
    dataForm.addForm(stanza, data.form, this.NS_CONFIG)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (typeof(callback) != 'function') return console.error('No callback provided')
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)
}

module.exports = MultiUserChat
