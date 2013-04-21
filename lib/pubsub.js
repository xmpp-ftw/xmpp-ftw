var jQuery   = require('jQuery'),
    builder  = require('node-xmpp'),
    Base     = require('./base'),
    dataForm = require('./utils/xep-0004')
    
var PubSub = function() {}

PubSub.prototype = new Base()

PubSub.prototype.NS_PUBSUB      = 'http://jabber.org/protocol/pubsub'
PubSub.prototype.NS_SUB_OPTIONS = 'http://jabber.org/protocol/pubsub#subscribe_options'

PubSub.prototype.NS_OWNER       = 'http://jabber.org/protocol/pubsub#owner'
PubSub.prototype.NS_CONFIG      = 'http://jabber.org/protocol/pubsub#node_config'

PubSub.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.pubsub.create', function(data, callback) {
        self.createNode(data, callback)
    })
    this.socket.on('xmpp.pubsub.delete', function(data, callback) {
    	self.deleteNode(data, callback)
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
    this.socket.on('xmpp.pubsub.publish', function(data, callback) {
    	self.publish(data, callback)
    })
    this.socket.on('xmpp.pubsub.config.get', function(data, callback) {
    	self.getNodeConfiguration(data, callback)
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
    var stanza = this._getStanza(data, 'set', 'create')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)   
}

PubSub.prototype.deleteNode = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	var self = this
	var stanza = this._getStanza(data, 'set', 'delete')
	
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
        var details = { subscription: parsed.find('subscription').attr('subscription') }
        if ((options = parsed.find('subscribe-options')).length > 0)
            details.configuration = { required: (options.find('required').length > 0) }
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
        callback(null, dataForm.parseForm(stanza))
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
    dataForm.addForm(stanza, data.form, this.NS_SUB_OPTIONS)
    
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza) 
}

PubSub.prototype.publish = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	if (!data.body || (0 == data.body.toString().length)) return
	if (!data.jid) data.jid = this.manager.jid
	var self   = this
	var stanza = this._getStanza(data, 'set', 'publish')
	stanza.c('item').c('body').t(data.body)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, {id: jQuery(stanza.toString()).find('item').attr('id')})
    })
    this.client.send(stanza)
}

PubSub.prototype.getNodeConfiguration = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	var self = this
	var stanza = this._getStanza(data, 'get', 'configure', this.NS_OWNER)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, dataForm.parseForm(stanza))
    })
    this.client.send(stanza)
}

PubSub.prototype.setNodeConfiguration = function(data, callback) {
	if (!data.to) return
	if (!data.node) return
	if (!data.form) return
	var self = this
	var stanza = this._getStanza(data, 'set', 'configure', this.NS_OWNER)
	dataForm.addForm(stanza, data.form, this.NS_CONFIG)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)	
}

PubSub.prototype._getStanza = function(data, type, element, namespace) {
	var attributes = { node: data.node }
	if (data.jid) attributes.jid = data.jid
	return new builder.Element(
        'iq',
        { to: data.to, type: type, id: this._getId() }
    ).c('pubsub', {xmlns: namespace || this.NS_PUBSUB})
     .c(element, attributes)
}

module.exports = PubSub
