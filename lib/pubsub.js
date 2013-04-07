var jQuery   = require('jQuery'),
    builder  = require('node-xmpp'),
    Base     = require('./base'),
    dataForm = require('./utils/xep-0004')
    
var PubSub = function() {}

PubSub.prototype = new Base()

PubSub.prototype.NS = 'http://jabber.org/protocol/pubsub'

PubSub.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.pubsub.create', function(data, callback) {
        self.createNode(data, callback)
    })
    this.socket.on('xmpp.pubsub.subscribe', function(data, callback) {
    	self.subscribe(data, callback)
    })
    this.socket.on('xmpp.pubsub.unsubscribe', function(data, callback) {
    	self.unsubscribe(data, callback)
    })
    this.socket.on('xmpp.pubsub.subscription.config.get', function(data, callback) {
    	self.subscriptionConfigurationGet(data, callback)
    })
    this.socket.on('xmpp.pubsub.subscription.config.set', function(data, callback) {
    	self.subscriptionConfigurationSet(data, callback)
    })
}

PubSub.prototype.handles = function(stanza) {
    return false
}

PubSub.prototype.handle = function(stanza) {
    return true
}

PubSub.prototype.createNode = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
    var self   = this
    var stanza = new builder.Element(
        'iq',
        { to: data.to, type: 'set', id: this._getId() }
    ).c('pubsub', {xmlns: this.NS})
     .c('create', {node: data.node})

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)   
}

PubSub.prototype.subscribe = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	if (!data.jid) data.jid = this.manager.jid
    var self   = this
    var stanza = this._getStanza(data, 'set', 'subscribe')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        var parsed  = jQuery(stanza.toString())
        var details = {subscription: parsed.find('subscription').attr('subscription')}
        if (parsed.find('subscribe-options').length > 0)
            details.configuration = 'required'
        callback(null, details)
    })
    this.client.send(stanza) 
}

PubSub.prototype.unsubscribe = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	if (!data.jid) data.jid = this.manager.jid
    var self   = this
    var stanza = this._getStanza(data, 'set', 'unsubscribe')
    
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza) 
}

PubSub.prototype.subscriptionConfigurationGet = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	if (!data.jid) data.jid = this.manager.jid
    var self   = this
    var stanza = this._getStanza(data, 'get', 'options')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza) 
}

PubSub.prototype.subscriptionConfigurationSet = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	if (!data.jid) data.jid = this.manager.jid
	if (!data.form) return
    var self   = this
    var stanza = this._getStanza(data, 'get', 'options')
    dataForm.addForm(stanza, data.form, this.NS)
    
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza) 
}

PubSub.prototype._getStanza = function(data, type, element) {
	return new builder.Element(
        'iq',
        { to: data.to, type: type, id: this._getId() }
    ).c('pubsub', {xmlns: this.NS})
     .c(element, {node: data.node, jid: data.jid})
}

module.exports = new PubSub