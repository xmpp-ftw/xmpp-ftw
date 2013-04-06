var jQuery = require('jQuery'),
    builder = require('node-xmpp')
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
    return stanza.is('iq') &&
        (jQuery(stanza.toString()).find('query').attr('xmlns') == this.NS)
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
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, null)
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
    jQuery(stanza.toString()).find('item').each(function(index, item) {
        items.push({
            jid: self._getJid(item.getAttribute('jid')),
            name: item.getAttribute('name'),
            ask: item.getAttribute('ask'),
            subscription: item.getAttribute('subscription'),
            group: jQuery(item).find('group').text()
        })
    });
    callback(null, items)
}

Roster.prototype.handleRemoteAdd = function(stanza) {
    var data = jQuery(stanza.toString()).find('item')
    var rosterItem = {
        jid: this._getJid(data.attr('jid')),
        subscription:  data.attr('subscription')
    }
    if (data.attr('name')) rosterItem.name = data.attr('name')
    if (data.attr('ask')) rosterItem.ask = data.attr('ask')
    if (data.find('group')) rosterItem.group = data.find('group').text()
    this.socket.emit('xmpp.roster.add', rosterItem)
}

module.exports = new Roster