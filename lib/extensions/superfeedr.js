var builder  = require('node-xmpp'),
    Base     = require('../base'),
    dataForm = require('../utils/xep-0004')
    
var SuperFeedr = function() {}

SuperFeedr.prototype = new Base()

SuperFeedr.prototype.NS_PUBSUB     = 'http://jabber.org/protocol/pubsub'
SuperFeedr.prototype.NS_EVENT      = 'http://jabber.org/protocol/superfeedr#event'
SuperFeedr.prototype.NS_SUPERFEEDR = 'http://superfeedr.com/xmpp-pubsub-ext'

SuperFeedr.prototype.HOST          = 'firehoser.superfeedr.com'

SuperFeedr.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.superfeedr.subscribe', function(data, callback) {
    	self.subscribe(data, callback)
    })
    this.socket.on('xmpp.superfeedr.unsubscribe', function(data, callback) {
    	self.unsubscribe(data, callback)
    })
    this.socket.on('xmpp.superfeedr.retrieve', function(data, callback) {
    	self.getItems(data, callback)
    })
    this.socket.on('xmpp.superfeedr.subscriptions', function(data, callback) {
        self.getSubscriptions(data, callback)
    })
}

SuperFeedr.prototype.handles = function(stanza) {
    return (this.HOST == stanza.attrs.from) 
}

SuperFeedr.prototype.handle = function(stanza) {
    return true
}

SuperFeedr.prototype.subscribe = function(data, callback) {
    if (!data.feed)
        return this._clientError("Missing 'feed' key", data, callback)
    if (!data.jid) data.jid = this.manager.jid

    var self   = this
    var stanza = this._getStanza(data, 'set', 'subscribe')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(
            null,
            self._parseSubscriptionDetails(stanza.getChild('pubsub').getChild('subscription'))
        )
    })
    this.client.send(stanza) 
}

SuperFeedr.prototype.unsubscribe = function(data, callback) {
    if (!data.feed)
        return this._clientError("Missing 'feed' key", data, callback)
    if (!data.jid) data.jid = this.manager.jid

    var self   = this
    var stanza = this._getStanza(data, 'set', 'unsubscribe')
    
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza) 
}

SuperFeedr.prototype.getItems = function(data, callback) {
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)

    var self = this
    var stanza = this._getStanza(data, 'get', 'items', this.NS_PUBSUB)
    if (data.id) {
   	if (false == (data.id instanceof Array)) {
	    data.id = [ data.id ]
        }
        data.id.forEach(function(id) {
	    stanza.c('item', {id: id}).up()
	}) 
    }
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
    if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
    var items = { items: [] }
    stanza.getChild('pubsub').getChild('items').getChildren('item').forEach(function(entry) {
    var item = { id: entry.attrs.id, content: entry.getChild('body').getText() }
       	items.items.push(item)
    })
        callback(null, items)
    })
    this.client.send(stanza)
}

SuperFeedr.prototype.getSubscriptions = function(data, callback) {
    var self = this
    var page = parseInt(data.page || '1')
    var stanza = new builder.Element('iq', {to: this.HOST, type: 'get', id: this._getId()})
        .c('pubsub', {xmlns: this.NS_PUBSUB, 'xmlns:superfeedr': this.NS_SUPERFEEDR })
        .c('subscriptions', {jid: this.manager.jid, 'superfeedr:page': page})
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        var subscriptions = []
        stanza.getChild('pubsub').getChild('subscriptions').getChildren('subscription').forEach(function(entry) {
            subscriptions.push(self._parseSubscriptionDetails(entry))
        })
        callback(null, subscriptions)
    })
    this.client.send(stanza)
}

SuperFeedr.prototype._getStanza = function(data, type, element, namespace) {
    var attributes = { node: data.feed }
    if (data.jid) attributes.jid = data.jid
    return new builder.Element(
        'iq',
        { to: this.HOST, type: type, id: this._getId() }
    ).c('pubsub', {xmlns: namespace || this.NS_PUBSUB})
     .c(element, attributes)
}

SuperFeedr.prototype._parseSubscriptionDetails = function(entry) {
    var subscription = {
        feed: entry.attrs.node,
        jid: entry.attrs.jid,
        title: entry.getChild('status').getChild('title').getText(),
        status: {
             response: entry.getChild('status').getChild('http').attrs.code,
             fetch: {
                 next: entry.getChild('status').getChild('next_fetch').getText(),
                 last: entry.getChild('status').getChild('last_fetch').getText(),
                 period: entry.getChild('status').getChild('period').getText()
             },
             parsed: entry.getChild('status').getChild('last_parse').getText(),
             maintenance: entry.getChild('status').getChild('last_maintenance_at').getText(),
             message: entry.getChild('status').getChild('http').getText()
        }
    }
    return subscription
}

module.exports = SuperFeedr
