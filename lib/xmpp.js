/* @flow */
'use strict'

const Client = require('node-xmpp-client')
const EventEmitter = require('events').EventEmitter
const JID = require('node-xmpp-client').JID
const Chat = require('./chat')
const Presence = require('./presence')
const Roster = require('./roster')
const errors = require('./utils/errors')
const debounce = require('debounce')

class Xmpp extends EventEmitter {

  get MISSING_STANZA_ID () {
    return 'Missing stanza ID'
  }

  get MISSING_CALLBACK () {
    return 'Missing callback'
  }

  get INVALID_CALLBACK () {
    return 'Invalid callback'
  }

  get REGISTRATION_ERROR () {
    return 'Registration error'
  }

  get AUTHENTICATION_ERROR () {
    return 'XMPP authentication failure'
  }

  constructor (socket) {
    super()
    this.socket = socket
    this.tracking = []
    this.logger = null

    this.error = errors

    this.listeners = [
      new Roster(),
      new Presence(),
      new Chat()
    ]
    this.client = false
    this.registerSocketEvents()
  }

  clearListeners () {
    this.listeners = []
  }

  addListener (listener) {
    if (this.client) {
      listener.init(this)
    }
    this.listeners.unshift(listener)
  }

  registerXmppEvents () {
    this.client.on('error', (error) => this.handleError(error))
    this.client.on('online', (data) => {
      this.jid = data.jid.user + '@' +
              data.jid.domain + '/' + data.jid.resource
      this.fullJid = new JID(this.jid)
      this.online()
    })
    this.client.on('stanza', (stanza) => this.handleStanza(stanza))
    this.client.once('offline', () => {
      this.handleError(this.error.condition.DISCONNECTED)
      this.logout(() => {})
    })
  }

  registerSocketEvents () {
    this.socket.on('xmpp.login', debounce((data) => {
      this.logout(() => {})
      this.login(data)
    }, 750, true))
    this.socket.on('xmpp.login.anonymous', debounce((data) => {
      this.logout(() => {})
      this.anonymousLogin(data)
    }, 750, true))
    this.socket.on('xmpp.logout', (data, callback) => this.logout(callback))
    this.socket.on('end', () => this.logout())
    this.socket.on('disconnect', () => this.logout())
  }

  unRegisterSocketEvents () {
    if (!this.listeners) {
      return
    }
    this.listeners.forEach((listener) => listener.unregisterEvents())
  }

  _initialiseListeners () {
    this.listeners.forEach((listener) => listener.init(this))
  }

  logout (callback) {
    if (!this.client) {
      return
    }
    this.client.removeAllListeners()
    this.client.end()
    delete this.client
    if (callback) {
      return callback(null, true)
    }
    if (this.socket) {
      this.socket.end()
    }
  }

  anonymousLogin (data) {
    if (!data.jid) {
      return
    }
    this._getLogger().info(`Attempting anonymous connection ${data.jid}`)
    if (data.jid.indexOf('@') !== -1) {
      data.jid = data.jid.split('@')[1]
    }
    if (data.jid.indexOf('/') !== -1) {
      data.resource = data.jid.split('/')[1]
      data.jid = data.jid.split('/')[0]
    }
    this.jid = data.jid
    const credentials = data
    credentials.jid = '@' + data.jid
    credentials.preferredSaslMechanism = 'ANONYMOUS'
    if (data.resource) {
      credentials.jid += '/' + data.resource
    }
    if (data.host) {
      credentials.host = data.host
    }
    this._connect(credentials)
  }

  login (data) {
    this._getLogger().info(`Attempting to connect to ${data.jid}`)
    if (!data.jid || !data.password) {
      return this.socket.send(
        'xmpp.error',
        {
          type: 'auth',
          condition: 'client-error',
          description: 'Missing jid and/or password',
          request: data
        }
      )
    }

    let jid = data.jid
    const password = data.password
    if (data.jid.indexOf('@') === -1) {
      jid += '@' + data.host
    }
    if (jid.indexOf('/') !== -1) {
      data.resource = jid.split('/')[1]
      jid = jid.split('/')[0]
    }
    if (data.resource) {
      jid += '/' + data.resource
      delete data.resource
    }
    let credentials = data
    credentials.jid = jid
    credentials.password = password
    this._connect(credentials)
  }

  _connect (options) {
    this.jid = options.jid
    this.client = new Client(options)

    this.client.connection.socket.setTimeout(0)
    this.client.connection.socket.setKeepAlive(true, 10000)

    this.registerXmppEvents()
  }

  online () {
    this._initialiseListeners()
    this.socket.send(
      'xmpp.connection',
      { status: 'online', jid: this.fullJid }
    )
    this.emit('client:online', { jid: this.fullJid })
  }

  handleError (error) {
    this._getLogger().error(error)
    let message = null
    let type = null
    let condition = null
    if (this.REGISTRATION_ERROR === (error || {}).message) {
      message = this.REGISTRATION_ERROR
      type = this.error.type.AUTH
      condition = this.error.condition.REGISTRATION_FAIL
    } else if (error === this.AUTHENTICATION_ERROR) {
      message = this.error.message.AUTHENTICATION_FAIL
      type = this.error.type.AUTH
      condition = this.error.condition.LOGIN_FAIL
    } else if (error === this.error.condition.DISCONNECTED) {
      message = this.error.message.DISCONNECTED
      type = this.error.type.CONNECTION
      condition = this.error.condition.DISCONNECTED
    } else if (error === this.error.condition.NOT_CONNECTED) {
      message = this.error.message.NOT_CONNECTED
      type = this.error.type.CONNECTION
      condition = this.error.condition.NOT_CONNECTED
    } else {
      message = JSON.stringify(error, function (key, value) {
        if (key === 'parent') {
          return (!value) ? value : value.id
        }
        return value
      })
    }
    this.socket.send(
      'xmpp.error',
      {
        type: type || this.error.type.CANCEL,
        condition: condition || this.error.condition.UNKNOWN,
        description: message
      }
    )
  }

  trackId (id, callback) {
    if (!id) {
      throw new Error(this.MISSING_STANZA_ID)
    }
    let jid = null
    if (typeof id === 'object') {
      if (!id.root().attrs.id) {
        throw new Error(this.MISSING_STANZA_ID)
      }
      jid = id.root().attrs.to
      id = id.root().attrs.id
      if (!jid) {
        jid = [
          this.getJidType('domain'),
          this.getJidType('bare')
        ]
      } else {
        jid = [ jid ]
      }
    }
    if (!callback) {
      throw new Error(this.MISSING_CALLBACK)
    }
    if (typeof callback !== 'function') {
      throw new Error(this.INVALID_CALLBACK)
    }
    if (!this.client) {
      return this.handleError(this.error.condition.NOT_CONNECTED)
    }
    this.tracking[id] = { callback, jid }
  }

  catchTracked (stanza) {
    const id = stanza.root().attr('id')
    if (!id || !this.tracking[id]) return false
    if (this.tracking[id].jid &&
          stanza.attr('from') &&
          (this.tracking[id].jid.indexOf(stanza.attr('from')) === -1)) {
          // Ignore stanza its an ID spoof!
      return true
    }
    const callback = this.tracking[id].callback
    delete this.tracking[id]
    callback(stanza)
    return true
  }

  handleStanza (stanza) {
    this._getLogger().info('Stanza received: ' + stanza)
    if (this.catchTracked(stanza)) {
      return
    }
    let handled = false
    this.listeners.some((listener) => {
      if (listener.handles(stanza) === true) {
        handled = true
        if (listener.handle(stanza) === true) {
          return true
        }
      }
    })
    if (!handled) {
      this._getLogger().info('No listeners for: ' + stanza)
    }
  }

  getJidType (type) {
    switch (type) {
      case 'full':
        return this.fullJid.user + '@' +
                  this.fullJid.domain + '/' +
                  this.fullJid.resource
      case 'bare':
        return this.fullJid.user + '@' + this.fullJid.domain
      case 'domain':
        return this.fullJid.domain
    }
  }

  setLogger (logger) {
    this.logger = logger
    return logger
  }

  _getLogger () {
    if (!this.logger) {
      this.logger = {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      }
    }
    return this.logger
  }
}

module.exports = Xmpp
