var ltx = require('ltx')
  , fs = require('fs')
  , Event = require('events').EventEmitter

exports.getStanza = function(file) {
    var stanza = fs.readFileSync(__dirname + '/resources/' + file)
    return ltx.parse(stanza.toString().replace(/>(.)</g, ''))
}

var Eventer = function() {}
Eventer.prototype = new Event()
Eventer.prototype.send = function(stanza) {
    this.emit('stanza', stanza)
}
exports.Eventer = Eventer
