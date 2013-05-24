var builder    = require('node-xmpp'),
    Base       = require('../base'),
    dataForm   = require('../utils/xep-0004'),
    disco      = require('../disco'),
    async      = require('async')

var Buddycloud = function() {
    this.itemParser
    this.channelServer
    this.disco = new disco()
}

Buddycloud.prototype = new Base()

var init = Buddycloud.prototype.init
Buddycloud.prototype.init = function(manager) {
    init.call(this, manager)
    this.disco.init(manager)
}

Buddycloud.prototype.NS_PUBSUB     = 'http://jabber.org/protocol/pubsub'
Buddycloud.prototype.NS_EVENT      = 'http://jabber.org/protocol/pubsub#event'

Buddycloud.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.buddycloud.discover', function(data, callback) {
    	self.discover(data, callback)
    })
}

Buddycloud.prototype.handles = function(stanza) {
    return (this.channelServer && (stanza.attrs.to == this.channelServer))
}

Buddycloud.prototype.handle = function(stanza) {
    var self = this
    return true
}

Buddycloud.prototype.discover = function(stanza, callback) {
    var self = this
    this.disco.getItems({of: this.manager.jid.split('@')[1]}, function(error, items) {
        if (error) return callback(error)
        jobs = {}
        items.forEach(function(item) {
            jobs[item.jid] = function(infoCallback) {
                self.disco.getFeatures({of:item.jid}, function(error, features) {
                    if (error) features = []
                    infoCallback(null, features)
                })
            }
        })
        async.parallel(jobs, function(error, results) {
            if (error) return callback(error)
            for (var i in results) {
                results[i].forEach(function(feature) {
                    if (('identity' == feature.kind)
                        && (feature.category && 'pubsub' == feature.category)
                        && (feature.type && 'channels' == feature.type)) {
                        self.channelServer = i
                        console.log("Found buddycloud channel server @ " + i)
                        return callback(null, i)
                    }
                })
            }
        })
    })
}

Buddycloud.prototype._getItemParser = function() {
    if (!this.itemParser)
        this.itemParser = require('xmpp-ftw-item-parser')
    return this.itemParser
}

Buddycloud.prototype.setItemParser = function(parser) {
    this.itemParser = parser
    return this
}

module.exports = Buddycloud
