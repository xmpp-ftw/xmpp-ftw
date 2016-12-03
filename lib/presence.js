/* @flow */
'use strict'

const builder = require('ltx')
const Base = require('./base')

class Presence extends Base {

  get NS_ENTITY_CAPABILITIES () {
    return 'http://jabber.org/protocol/caps'
  }

  get _events () {
    return {
      'xmpp.presence': 'sendPresence',
      'xmpp.presence.subscribe': 'subscribe',
      'xmpp.presence.subscribed': 'setSubscribed',
      'xmpp.presence.unsubscribe': 'setUnsubscribe',
      'xmpp.presence.unsubscribed': 'setUnsubscribed',
      'xmpp.presence.get': 'get',
      'xmpp.presence.offline': 'setOffline',
      'disconnect': 'setDisconnect'
    }
  }

  init (manager, ignoreEvents) {
    this.current = 'online'
    super.init(manager, ignoreEvents)
  }

  subscribe (data) {
    this.subscription(data, 'subscribe')
  }

  setSubscribed (data) {
    this.subscription(data, 'subscribed')
  }

  setUnsubscribe (data) {
    this.subscription(data, 'unsubscribe')
  }

  setUnsubscribed (data) {
    this.subscription(data, 'unsubscribed')
  }

  setOffline () {
    this.sendPresence({ type: 'unavailable' })
  }

  setDisconnect () {
    if (this.current !== 'unavailable') {
      this.sendPresence({ type: 'unavailable' })
    }
  }

  handles (stanza) {
    return stanza.is('presence')
  }

  handle (stanza) {
    if (stanza.attrs.type === 'subscribe') {
      return this.handleSubscription(stanza)
    }
    if (stanza.attrs.type === 'error') {
      return this.handleError(stanza)
    }
    const presence = { from: this._getJid(stanza.attrs.from) }
    if (stanza.attrs.type === 'unavailable') {
      presence.show = 'offline'
    } else {
      const show = stanza.getChild('show')
      const status = stanza.getChild('status')
      const priority = stanza.getChild('priority')
      if (show) {
        presence.show = show.getText()
      }
      if (status) {
        presence.status = status.getText()
      }
      if (priority) {
        presence.priority = priority.getText()
      }
    }

    const capabilities = stanza.getChild('c', this.NS_ENTITY_CAPABILITIES)
    if (capabilities) {
      presence.client = {
        node: capabilities.attrs.node,
        ver: capabilities.attrs.ver,
        hash: capabilities.attrs.hash
      }
    }
    this.socket.send('xmpp.presence', presence)
    return true
  }

  sendPresence (data) {
    if (!data) {
      data = {}
    }
    const stanza = new builder.Element('presence')
    if (data.to) {
      stanza.attr('to', data.to)
    }
    if (data.type && (data.type === 'unavailable')) {
      stanza.attr('type', data.type)
    }
    if (data.status) {
      stanza.c('status').t(data.status).up()
    }
    if (data.priority) {
      stanza.c('priority').t(data.priority).up()
    }
    if (data.show) {
      stanza.c('show').t(data.show).up()
    }
    if (this._addCapabilities(data, stanza) === false) {
      return
    }
    this.client.send(stanza)
  }

  _addCapabilities (data, stanza) {
    if (typeof data.client === 'undefined') {
      return true
    }
    if (typeof data.client !== 'object') {
      return this._clientError('\'client\' key must be an object', data)
    }
    if (!data.client.node) {
      return this._clientError('Missing \'node\' key', data)
    }
    if (!data.client.ver) {
      return this._clientError('Missing \'ver\' key', data)
    }
    if (!data.client.hash) {
      return this._clientError('Missing \'hash\' key', data)
    }
    stanza.c(
      'c',
      {
        xmlns: this.NS_ENTITY_CAPABILITIES,
        ver: data.client.ver,
        node: data.client.node,
        hash: data.client.hash
      }
    )
    return true
  }

  handleSubscription (stanza) {
    const request = { from: this._getJid(stanza.attrs.from) }
    if (stanza.getChild('nick')) {
      request.nick = stanza.getChild('nick').getText()
    }
    this.socket.send('xmpp.presence.subscribe', request)
  }

  handleError (stanza) {
    const description = stanza.getChild('error').children[0].getName()
    const attributes = { error: description }
    if (stanza.attrs.from) {
      attributes.from = this._getJid(stanza.attrs.from)
    }
    this.socket.send('xmpp.presence.error', attributes)
  }

  subscription (data, type) {
    if (!data.to) {
      return this._clientError('Missing \'to\' key', data)
    }
    const stanza = new builder.Element(
      'presence',
      { to: data.to, type, from: this.manager.jid }
    )
    this.client.send(stanza)
  }

  get (data) {
    if (!data.to) {
      return this._clientError('Missing \'to\' key', data)
    }
    const stanza = new builder.Element(
      'presence', { to: data.to, from: this.manager.jid }
    )
    this.client.send(stanza)
  }

}

module.exports = Presence
