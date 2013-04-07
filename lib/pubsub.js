var jQuery = require('jQuery'),
    builder = require('node-xmpp'),
    Base    = require('./base')
    
var PubSub = function() {}

PubSub.prototype = new Base()

PubSub.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.pubsub.message', function(data) {
        self.sendMessage(data)
    })
}

PubSub.prototype.handles = function(stanza) {
    return false
}

PubSub.prototype.handle = function(stanza) {
    return true
}

module.exports = new PubSub