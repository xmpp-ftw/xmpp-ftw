/* @flow */
'use strict'

const builder = require('node-xmpp-client').ltx
const Base = require('./base')

class Roster extends Base {

  get _events () {
    return {
      'xmpp.roster.add': 'add',
      'xmpp.roster.get': 'get',
      'xmpp.roster.edit': 'edit',
      'xmpp.roster.group': 'edit', /* Deprecated */
      'xmpp.roster.remove': 'remove'
    }
  }

  get NS () {
    return 'jabber:iq:roster'
  }

  handles (stanza) {
    return !!(stanza.is('iq') &&
        (stanza.getChild('query', this.NS)))
  }

  handle (stanza) {
    if (stanza.attr('type') === 'set') {
      return this.handleRemoteAdd(stanza)
    }
    return false
  }

  get (data, callback) {
    if (typeof callback !== 'function') {
      return this._clientError('Missing callback')
    }
    const stanza = new builder.Element(
      'iq',
      { from: this.manager.jid.split('/')[0], type: 'get', id: this._getId() }
    ).c('query', { xmlns: this.NS }).up()

    this.manager.trackId(stanza, (stanza) => this.handleRoster(stanza, callback))
    this.client.send(stanza)
  }

  add (data, callback) {
    if (typeof callback !== 'function') {
      return this._clientError('Missing callback', data)
    }
    if (!data.jid) {
      return this._clientError('Missing \'jid\' key', data, callback)
    }
    const item = { jid: data.jid }
    if (data.name) {
      item.name = data.name
    }

    const stanza = new builder.Element(
      'iq',
      { type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', item)
    if (data.groups) {
      data.groups.forEach((group) => stanza.c('group').t(group).up())
    }
    this.manager.trackId(stanza, (stanza) => {
      if (stanza.attrs.type === 'error') {
        return callback(this._parseError(stanza), null)
      }
      callback(null, true)
    })
    this.client.send(stanza)
  }

  remove (data, callback) {
    if (typeof callback !== 'function') {
      return this._clientError('Missing callback', data)
    }
    if (!data.jid) {
      return this._clientError('Missing \'jid\' key', data, callback)
    }
    const item = { jid: data.jid, subscription: 'remove' }

    const stanza = new builder.Element(
      'iq',
      { type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', item)

    this.manager.trackId(stanza, (stanza) => {
      if (stanza.attrs.type === 'error') {
        return callback(this._parseError(stanza), null)
      }
      callback(null, true)
    })
    this.client.send(stanza)
  }

  edit (data, callback) {
    if (!data.jid) {
      return this._clientError('Missing \'jid\' key', data, callback)
    }
    if (!data.groups) {
      return this._clientError('Missing \'groups\' key', data, callback)
    }
    if (typeof callback !== 'function') {
      return this._clientError('Missing callback', data)
    }
    if ((data.groups instanceof Array) === false) {
      return this._clientError('Groups should be an array', data, callback)
    }

    const itemAttrs = { jid: data.jid }
    if (data.name) {
      itemAttrs.name = data.name
    }

    const stanza = new builder.Element(
        'iq',
        { type: 'set', id: this._getId() }
    ).c('query', { xmlns: this.NS }).c('item', itemAttrs)
    data.groups.forEach((group) => stanza.c('group').t(group).up())

    this.manager.trackId(stanza, (stanza) => {
      if (stanza.attrs.type === 'error') {
        return callback(this._parseError(stanza))
      }
      callback(null, true)
    })
    this.client.send(stanza)
  }

  handleRoster (stanza, callback) {
    const items = []
    if (stanza.attrs.type === 'error') {
      return callback(this._parseError(stanza), null)
    }
    stanza.getChild('query').getChildren('item').forEach((item) => {
      const entry = {
        jid: this._getJid(item.attrs.jid),
        subscription: item.attrs.subscription
      }
      if (item.attrs.name) {
        entry.name = item.attrs.name
      }
      if (item.attrs.ask) {
        entry.ask = item.attrs.ask
      }
      let groups = null
      if ((groups = item.getChildren('group')).length !== 0) {
        entry.groups = []
        groups.forEach((group) => entry.groups.push(group.getText()))
      }
      items.push(entry)
    })
    callback(null, items)
  }

  handleRemoteAdd (stanza) {
    const data = stanza.getChild('query').getChild('item')
    const rosterItem = {
      jid: this._getJid(data.attrs.jid),
      subscription: data.attrs.subscription
    }
    let groups = null
    if (data.attrs.name) {
      rosterItem.name = data.attrs.name
    }
    if (data.attrs.ask) {
      rosterItem.ask = data.attrs.ask
    }
    if ((groups = data.getChildren('group')).length !== 0) {
      rosterItem.groups = []
      groups.forEach((group) => rosterItem.groups.push(group.getText()))
    }
    this.socket.send('xmpp.roster.push', rosterItem)
    return true
  }

}

module.exports = Roster
