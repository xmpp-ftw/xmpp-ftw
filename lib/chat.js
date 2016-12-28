/* @flow */
'use strict'

const Base = require('./base')
const xhtmlIm = require('./utils/xep-0071')
const state = require('./utils/xep-0085')
const delay = require('./utils/xep-0203')
const receipt = require('./utils/xep-0184')
const correction = require('./utils/xep-0308')
const builder = require('node-xmpp-client').ltx

class Chat extends Base {

  get _events () {
    return {
      'xmpp.chat.message': 'sendMessage',
      'xmpp.chat.receipt': 'sendReceipt'
    }
  }

  get XHTML () {
    return 'xhtml'
  }

  get PLAIN () {
    return 'plain'
  }

  handles (stanza) {
    if (!stanza.is('message')) {
      return false
    }
    if (!stanza.attrs.type || (stanza.attrs.type === 'chat')) {
      return true
    }
    if (stanza.getChild('received', receipt.NS)) {
      return true
    }
    return false
  }

  handle (stanza) {
    const chat = { from: this._getJid(stanza.attrs.from) }
    if (stanza.getChild('received', receipt.NS)) {
      return this._returnDeliveryReceipt(chat, stanza)
    }
    this._getMessageContent(stanza, chat)
    delay.parse(stanza, chat)
    state.parse(stanza, chat)
    if (stanza.getChild('request', receipt.NS)) {
      chat.receipt = true
    }
    correction.parse(stanza, chat)
    stanza.getChildren('archived').forEach((archived) => {
      if (!chat.archived) chat.archived = []
      chat.archived.push({
        by: this._getJid(archived.attrs.by),
        id: archived.attrs.id
      }
    })
    if (stanza.attrs.id) {
      chat.id = stanza.attrs.id
    }
    this.socket.send('xmpp.chat.message', chat)
    return true
  }

  _returnDeliveryReceipt (data, stanza) {
    receipt.parse(stanza, data)
    this.socket.send('xmpp.chat.receipt', data)
    return true
  }

  _getMessageContent (stanza, chat) {
    if (!stanza.getChild('body') &&
        !stanza.getChild('html', xhtmlIm.NS_XHTML_IM)
    ) {
      return
    }

    let format = this.PLAIN
    let content = stanza.getChild('body').getText()
    const message = stanza.getChild('html', xhtmlIm.NS_XHTML_IM)
    if (message) {
      content = message.getChild('body', xhtmlIm.NS_XHTML)
        .children
        .join('')
        .toString()
        .trim()
      format = this.XHTML
    }
    chat.content = content
    chat.format = format
  }

  sendReceipt (data) {
    if (!data.to) {
      return this._clientError('Missing \'to\' key', data)
    }
    if (!data.id) {
      return this._clientError('Missing \'id\' key', data)
    }
    const stanza = new builder.Element('message', { id: this._getId(), to: data.to })
    receipt.build(stanza, 'received', data)
    this.client.send(stanza)
  }

  _addState (stanza, chatState) {
    if (!chatState) {
      return
    }
    stanza.root().c(chatState, { xmlns: state.NS })
  }

  _addReceiptRequest (stanza, data, hasValidCallback) {
    if (!data.receipt) {
      return true
    }

    if (hasValidCallback === false) {
      this._clientError('Callback required', data)
      return false
    }
    receipt.build(stanza)
  }

  sendMessage (data, callback) {
    if (!data.to) {
      return this._clientError('Missing \'to\' key', data)
    }
    if (data.replace && !data.content) {
      return this._clientError(
        'Missing \'content\' key', data, callback
      )
    }
    data.type = 'chat'
    if (!data.content && !data.state) {
      return this._clientError(
        'Message content or chat state not provided', data, callback
      )
    }
    let stanza = null
    if (!(stanza = xhtmlIm.builder(data, { to: data.to, type: 'chat' }, this))) {
      return
    }
    let hasValidCallback = false
    correction.build(stanza, data)
    if (callback) {
      if (this._hasValidCallback(callback, data) === false) {
        return
      }
      hasValidCallback = true
      stanza.root().attrs.id = this._getId()
    }
    this._addState(stanza, data.state)
    if (this._addReceiptRequest(stanza, data, hasValidCallback) === false) {
      return
    }
    this.client.send(stanza)
    if (hasValidCallback === false) {
      return
    }
    callback(null, { id: stanza.root().attrs.id })
  }

}

module.exports = Chat
