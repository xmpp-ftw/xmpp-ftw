/* @flow */
'use strict'

const uuidV4 = require('uuid/v4')

class Base {

  get _events () {
    return {}
  }

  init (manager, ignoreEvents) {
    this.manager = manager
    this.socket = manager.socket
    this.client = manager.client
    if (!ignoreEvents) {
      this.registerEvents()
    }
  }

  handles () {
    return false
  }

  handle () {
    return false
  }

  setCache (cache) {
    this.cache = cache
    return this
  }

  _getCache () {
    return this.cache
  }

  registerEvents () {
    if (!this._events) {
      return
    }
    Object.keys(this._events).forEach((event) => {
      this.socket.removeAllListeners(event)
      this.socket.on(event, (data, callback) => this[this._events[event]](data, callback))
    })
  }

  unregisterEvents () {
    if (!this._events) {
      return
    }
    Object.keys(this._events).forEach((event) => this.socket.removeAllListeners(event))
  }

  _getJid (jid) {
    const node = jid.split('@')[0]
    let domain = jid.split('/')[0]
    if (jid.indexOf('@') === -1) {
      return { domain: jid }
    }
    if (domain.indexOf('@') !== -1) {
      domain = domain.split('@')[1]
    }
    const resource = jid.split('/')[1]
    const result = { domain }
    if (node) {
      result.user = node
    }
    if (resource) {
      result.resource = resource
    }
    return result
  }

  _getId () {
    if (!Base.prototype.id) {
      Base.prototype.id = {
        counter: 0
      }
    }
    ++Base.prototype.id.counter
    return uuidV4()
  }

  _parseError (stanza) {
    const errorElement = stanza.getChild('error')
    const error = { type: errorElement.attrs.type }
    if (errorElement.attr('by')) {
      error.by = errorElement.attr('by')
    }
    const errorMessages = stanza.getChild('error').children
    let name = null
    if (errorMessages) {
      errorMessages.forEach((errorMessage) => {
        if (errorMessage.getNS() === this.NS_ERROR) {
          name = errorMessage.getName().toLowerCase()
          if (name === 'text') {
            error.description = errorMessage.getText()
          } else {
            error.condition = name
          }
        } else {
          error.application = { condition: errorMessage.getName().toLowerCase() }
          if (errorMessage.getNS()) {
            error.application.xmlns = errorMessage.getNS()
          }
          if (errorMessage.getText()) {
            error.application.description = errorMessage.getText()
          }
        }
      })
    }
    return error
  }

  _clientError (message, original, callback) {
    const error = {
      type: 'modify',
      condition: 'client-error',
      description: message,
      request: original
    }
    if (callback && (typeof callback === 'function')) {
      return callback(error)
    }
    this.socket.send('xmpp.error.client', error)
    return false
  }

  _hasValidCallback (callback, data) {
    if (typeof callback !== 'function') {
      return this._clientError('Missing callback', data)
    }
  }

  get NS_ERROR () {
    return 'urn:ietf:params:xml:ns:xmpp-stanzas'
  }

  get NS_REGISTER () {
    return 'jabber:iq:register'
  }

  get NS_DATA () {
    return 'jabber:x:data'
  }

}

module.exports = Base
