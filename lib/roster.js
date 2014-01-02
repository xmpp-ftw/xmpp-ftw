'use strict';

var builder = require('ltx'),
    Base    = require('./base')

var Roster = function() {}

Roster.prototype = new Base()

Roster.prototype.NS = 'jabber:iq:roster'

Roster.prototype._events = {
    'xmpp.roster.add': 'add',
    'xmpp.roster.get': 'get',
    'xmpp.roster.edit': 'edit',
    'xmpp.roster.group': 'edit', /* Deprecated */
    'xmpp.roster.remove': 'remove'
}

Roster.prototype.handles = function(stanza) {
    return !!(stanza.is('iq') &&
        (stanza.getChild('query', this.NS)))
}

Roster.prototype.handle = function(stanza) {
    if ('set' === stanza.attr('type'))
        return this.handleRemoteAdd(stanza)
    return false
}

Roster.prototype.get = function(data, callback) {
    if (typeof callback !== 'function')
        return this._clientError('Missing callback')
    var self   = this
    var stanza = new builder.Element(
        'iq',
        { from: this.manager.jid.split('/')[0], type: 'get', id: this._getId() }
    ).c('query', {xmlns: this.NS}).up()

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        self.handleRoster(stanza, callback)
    })
    this.client.send(stanza)
}

Roster.prototype.add = function(data, callback) {
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
    if (!data.jid)
        return this._clientError('Missing \'jid\' key', data, callback)
    var self = this
    var item = {jid: data.jid}
    if (data.name) item.name = data.name

    var stanza = new builder.Element(
        'iq',
        {type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', item)
    if (data.groups)
        data.groups.forEach(function(group) {
            stanza.c('group').t(group).up()
        })
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type === 'error') return callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)
}

Roster.prototype.remove = function(data, callback) {
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
    if (!data.jid)
        return this._clientError('Missing \'jid\' key', data, callback)
    var self = this
    var item = { jid: data.jid, subscription: 'remove' }

    var stanza = new builder.Element(
        'iq',
        {type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', item)

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type === 'error') return callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)
}

Roster.prototype.edit = function(data, callback) {
    var self = this
    if (!data.jid)
        return this._clientError('Missing \'jid\' key', data, callback)
    if (!data.groups)
        return this._clientError('Missing \'groups\' key', data, callback)
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
    if (false === (data.groups instanceof Array))
        return this._clientError('Groups should be an array', data, callback)

    var itemAttrs = { jid: data.jid }
    if (data.name) itemAttrs.name = data.name

    var stanza = new builder.Element(
        'iq',
        {type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', itemAttrs)
    data.groups.forEach(function(group) {
        stanza.c('group').t(group).up()
    })
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if ('error' === stanza.attrs.type) return callback(self._parseError(stanza))
        callback(null, true)
    })
    this.client.send(stanza)
}

Roster.prototype.handleRoster = function(stanza, callback) {
    if (typeof callback !== 'function')
        return this._clientError('Missing callback')
    var self  = this
    var items = []
    if ('error' === stanza.attrs.type)
        return callback(this._parseError(stanza), null)
    stanza.getChild('query').getChildren('item').forEach(function(item) {
        var entry = {
            jid: self._getJid(item.attrs.jid),
            subscription: item.attrs.subscription,
        }
        if (item.attrs.name) entry.name = item.attrs.name
        if (item.attrs.ask) entry.ask = item.attrs.ask
        var groups
        if (0 !== (groups = item.getChildren('group')).length) {
            entry.groups = []
            groups.forEach(function(group) {
                entry.groups.push(group.getText())
            })
        }
        items.push(entry)
    })
    callback(null, items)
}

Roster.prototype.handleRemoteAdd = function(stanza) {
    var data = stanza.getChild('query').getChild('item')
    var rosterItem = {
        jid: this._getJid(data.attrs.jid),
        subscription:  data.attrs.subscription
    }
    var groups
    if (data.attrs.name) rosterItem.name = data.attrs.name
    if (data.attrs.ask) rosterItem.ask = data.attrs.ask
    if (0 !== (groups = data.getChildren('group')).length) {
        rosterItem.groups = []
        groups.forEach(function(group) {
            rosterItem.groups.push(group.getText())
        })
    }
    this.socket.send('xmpp.roster.push', rosterItem)
    return true
}

module.exports = Roster
