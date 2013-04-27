var builder = require('node-xmpp')
    Base    = require('./base')

var Roster = function() {}

Roster.prototype = new Base()

Roster.prototype.NS = "jabber:iq:roster"

Roster.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.roster.add', function(data, callback) {
        self.add(data, callback)
    })
    this.socket.on('xmpp.roster.get', function(data, callback) {
        self.get(callback)
    })
    this.socket.on('xmpp.roster.group', function(data) {
        self.group(data)
    })
}

Roster.prototype.handles = function(stanza) {
    return stanza.is('iq') 
        && stanza.getChild('query')
        && (stanza.getChild('query').getNS() == this.NS)
}

Roster.prototype.handle = function(stanza) {
    if ('set' == stanza.attr('type'))
        this.handleRemoteAdd(stanza)
    return true
}

Roster.prototype.get = function(callback) {
    var self   = this
    var stanza = new builder.Element(
        'iq',
        { to: this.manager.jid.split('/')[0], type: 'get', id: this._getId() }
    ).c('query', {xmlns: this.NS}).up()

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        self.handleRoster(stanza, callback)
    })
    this.client.send(stanza)    
}

Roster.prototype.add = function(data, callback) {
    var self = this
    var item = {jid: data.jid}
    if (data.name) item.name = data.name
    
    var stanza = new builder.Element(
        'iq',
        {type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', item)
    if (data.group) stanza.c('group').t(data.group)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        callback(null, true)
    });
    this.client.send(stanza)
};

Roster.prototype.group = function(data) {
    var self = this
    if (!data.jid) return
    var stanza = new builder.Element(
        'iq',
        {type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', {jid: data.jid})
    stanza.c('group').t(data.group)
    this.client.send(stanza)
}

Roster.prototype.handleRoster = function(stanza, callback) {
    if (!'function' == typeof(callback)) return console.error('No callback provided')
    var self  = this
    var items = new Array()
    if ('error' == stanza.attrs.type)
        return callback(this._parseError(stanza), null)
    stanza.getChild('query').getChildren('item').forEach(function(item) {
        var entry = {
            jid: self._getJid(item.attrs.jid),
            name: item.attrs.name,
            ask: item.attrs.ask,
            subscription: item.attrs.subscription,
        }
        if (group = item.getChild('group')) entry.group = group.getText()
        items.push(entry)
    });
    callback(null, items)
}

Roster.prototype.handleRemoteAdd = function(stanza) {
    var data = stanza.getChild('query').getChildren('item')
    var rosterItem = {
        jid: this._getJid(data.attrs.jid),
        subscription:  data.attrs.subscription
    }
    if (data.attrs.name) rosterItem.name = data.attrs.name
    if (data.attrs.ask) rosterItem.ask = data.attrs.ask
    if (data.getChild('group')) rosterItem.group = data.getChild('group').getText()
    this.socket.emit('xmpp.roster.add', rosterItem)
}

module.exports = Roster
