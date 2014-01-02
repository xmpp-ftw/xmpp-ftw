'use strict';

var ltx = require('ltx')
  , fs = require('fs')
  , Event = require('events').EventEmitter

exports.getStanza = function(file) {
    var stanza = fs.readFileSync(__dirname + '/resources/' + file)
    var stanzaStr = stanza.toString()
        .replace(/[\n\r]/g, '')
        .replace(/>\s{1,}/g, '>')
    return ltx.parse(stanzaStr)
}

var XmppEventer = function() {}
XmppEventer.prototype = new Event()
XmppEventer.prototype.send = function(stanza) {
    this.emit('stanza', stanza.root())
}
exports.XmppEventer = XmppEventer

var SocketEventer = function() {}
SocketEventer.prototype = new Event()
SocketEventer.prototype.send = function(event, data, callback) {
    this.emit(event, data, callback)
}
exports.SocketEventer = SocketEventer

exports.failingItemParser = function() {
    throw new Error('FAIL!')
}
