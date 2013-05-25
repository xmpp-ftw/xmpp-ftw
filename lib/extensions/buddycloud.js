var builder    = require('node-xmpp'),
    PubSub     = require('../pubsub'),
    dataForm   = require('../utils/xep-0004'),
    disco      = require('../disco'),
    async      = require('async')

var Buddycloud = function() {
    this.itemParser
    this.channelServer
    this.disco = new disco()
}

Buddycloud.prototype = new PubSub()

var init = Buddycloud.prototype.init
Buddycloud.prototype.init = function(manager) {
    init.call(this, manager)
    this.disco.init(manager)
}

Buddycloud.prototype.NS_BUDDYCLOUD = 'http://buddycloud.org/v1'

Buddycloud.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.buddycloud.discover', function(data, callback) {
    	self.discover(data, callback)
    })
    this.socket.on('xmpp.buddycloud.retrieve', function(data, callback) {
        if (!self._checkCall(data, callback)) return
        delete(data.id)
        self.getItems(data, callback)
    })
    this.socket.on('xmpp.buddycloud.subscribe', function(data, callback) {
        if (!self._checkCall(data, callback)) return
        delete(data.jid) 
        self.subscribe(data, callback)
    })
    this.socket.on('xmpp.buddycloud.unsubscribe', function(data, callback) {
        if (!self._checkCall(data, callback)) return
        delete(data.jid)
        self.unsubscribe(data, callback)
    })
    this.socket.on('xmpp.buddycloud.item.delete', function(data, callback) {
        if (!self._checkCall(data, callback)) return
        self.deleteItem(data, callback)
    })
}

Buddycloud.prototype.handles = function(stanza) {
    return (this.channelServer && (stanza.attrs.to == this.channelServer))
}

Buddycloud.prototype.handle = function(stanza) {
    var self = this
    return true
}

Buddycloud.prototype._checkCall = function(data, callback) {
    if (!this.channelServer) {
        this._clientError(
            'You must perform discovery first!', data, callback
        )
        return false
    }
    data.to = this.channelServer
    return true
}

Buddycloud.prototype.discover = function(data, callback) {
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
