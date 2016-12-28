'use strict'

const ltx = require('node-xmpp-client').ltx
const fs = require('fs')
const Event = require('events').EventEmitter

exports.getStanza = (file) => {
  const stanza = fs.readFileSync(__dirname + '/resources/' + file)
  const stanzaStr = stanza.toString()
    .replace(/[\n\r]/g, '')
    .replace(/>\s{1,}/g, '>')
  return ltx.parse(stanzaStr)
}

class XmppEventer extends Event {

  send (stanza) {
    this.emit('stanza', stanza.root())
  }

}

exports.XmppEventer = XmppEventer

class SocketEventer extends Event {

  send (event, data, callback) {
    this.emit(event, data, callback)
  }

}

exports.SocketEventer = SocketEventer

exports.failingItemParser = function () {
  throw new Error('FAIL!')
}
