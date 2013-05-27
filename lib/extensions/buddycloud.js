var builder    = require('node-xmpp'),
    PubSub     = require('../pubsub'),
    presence   = require('../presence'),
    dataForm   = require('../utils/xep-0004'),
    disco      = require('../disco'),
    async      = require('async')

var Buddycloud = function() {
    this.itemParser
    this.channelServer
    this.disco = new disco()
    this.presence = new presence()
}

Buddycloud.prototype = new PubSub()

var init = Buddycloud.prototype.init
Buddycloud.prototype.init = function(manager) {
    init.call(this, manager)
    this.disco.init(manager)
    this.presence.init(manager)
}

Buddycloud.prototype.NS_BUDDYCLOUD = 'http://buddycloud.org/v1'

Buddycloud.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.buddycloud.discover', function(data, callback) {
    	self.discover(data, callback)
    })
    this.socket.on('xmpp.buddycloud.presence', function() {
        if (!self._checkCall({})) return
        self.presence.sendPresence({
            to: self.channelServer,
            priority: -1,
            status: 'buddycloud',
            show: 'online'
        })
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
    return (this.channelServer && (stanza.attrs.from == this.channelServer))
}

Buddycloud.prototype.handle = function(stanza) {
    var self = this
    if (stanza.hasChild('event', this.NS_EVENT)) return this._eventNotification(stanza)
    return false
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
            var discovered = false
            if (error) return callback(error)
            for (var i in results) {
                results[i].forEach(function(feature) {
                    if (('identity' == feature.kind)
                        && (feature.category && 'pubsub' == feature.category)
                        && (feature.type && 'channels' == feature.type)) {
                        self.channelServer = i
                        console.log("Found buddycloud channel server @ " + i)
                        discovered = true
                        return callback(null, i)
                    }
                })
            }
            if (false == discovered)
                return callback('No buddycloud server found')
        })
    })
}

Buddycloud.prototype._itemNotification = function(stanza, event) {
    var items = event.getChild('items')
    var data = {}
    this._getItemData(items, data)
    delete(data.from)
    this.socket.emit('xmpp.buddycloud.push.item', data)
}

module.exports = Buddycloud
