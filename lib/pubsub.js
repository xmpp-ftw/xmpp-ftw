var builder    = require('node-xmpp'),
    Base       = require('./base'),
    dataForm   = require('./utils/xep-0004')
    
var PubSub = function() {
    this.itemParser
}

PubSub.prototype = new Base()

PubSub.prototype.NS_PUBSUB      = 'http://jabber.org/protocol/pubsub'
PubSub.prototype.NS_SUB_OPTIONS = 'http://jabber.org/protocol/pubsub#subscribe_options'

PubSub.prototype.NS_OWNER       = 'http://jabber.org/protocol/pubsub#owner'
PubSub.prototype.NS_CONFIG      = 'http://jabber.org/protocol/pubsub#node_config'
PubSub.prototype.NS_EVENT       = 'http://jabber.org/protocol/pubsub#event'
PubSub.prototype.NS_HEADERS     = 'http://jabber.org/protocol/shim'

PubSub.prototype.NS_PUBLISH_OPTIONS = 'http://jabber.org/protocol/pubsub#publish-options'

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
    this.socket.on('xmpp.pubsub.subscription.config.default', function(data, callback) { 
        self.subscriptionDefaultConfigurationGet(data, callback)
    })
    this.socket.on('xmpp.pubsub.subscription.config.set', function(data, callback) {
    	self.subscriptionConfigurationSet(data, callback)
    })
    this.socket.on('xmpp.pubsub.publish', function(data, callback) {
    	self.publish(data, callback)
    })
    this.socket.on('xmpp.pubsub.item.delete', function(data, callback) {
    	self.deleteItem(data, callback)
    })
    this.socket.on('xmpp.pubsub.config.get', function(data, callback) {
    	self.getNodeConfiguration(data, callback)
    })
    this.socket.on('xmpp.pubsub.config.set', function(data, callback) {
        self.setNodeConfiguration(data, callback)
    })
    this.socket.on('xmpp.pubsub.retrieve', function(data, callback) {
    	self.getItems(data, callback)
    })
    this.socket.on('xmpp.pubsub.affiliations', function(data, callback) {
    	self.getAffiliations(data, callback)
    })
    this.socket.on('xmpp.pubsub.affiliation', function(data, callback) {
    	self.setAffiliation(data, callback)
    })
    this.socket.on('xmpp.pubsub.subscriptions', function(data, callback) {
        self.getSubscriptions(data, callback)
    })
    this.socket.on('xmpp.pubsub.purge', function(data, callback) {
        self.purgeNode(data, callback)
    })
}

PubSub.prototype.handles = function(stanza) {
    return (stanza.is('message') 
        && (null != stanza.getChild('event', this.NS_EVENT)))
}

PubSub.prototype.handle = function(stanza) {
    return this._eventNotification(stanza)
}

PubSub.prototype.createNode = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)

    var self   = this
    var stanza = this._getStanza(data, 'set', 'create')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error')
            callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)   
}

PubSub.prototype.deleteNode = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)

    var self = this
    var stanza = this._getStanza(data, 'set', 'delete')
    if (data.redirect)
        stanza.c('redirect', { uri: data.redirect })
	
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza) 
}

PubSub.prototype.subscribe = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)
    if (!data.jid) data.jid = this.manager.jid

    var self   = this
    var stanza = this._getStanza(data, 'set', 'subscribe')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error')
            return callback(self._parseError(stanza), null)
        var subscription = stanza.getChild('pubsub').getChild('subscription')
        var details = { subscription: subscription.attrs.subscription }
        if (options = subscription.getChild('subscribe-options'))
            details.configuration = { required: (true == options.getChild('required')) }
        if (subscription.attrs.subid) details.id = subscription.attrs.subid
        callback(null, details)
    })
    this.client.send(stanza) 
}

PubSub.prototype.unsubscribe = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)
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
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)
    if (!data.jid) data.jid = this.manager.jid

    var self   = this
    var stanza = this._getStanza(data, 'get', 'options')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, dataForm.parseForm(stanza))
    })
    this.client.send(stanza) 
}

PubSub.prototype.subscriptionDefaultConfigurationGet = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)

    var self   = this
    var stanza = this._getStanza(data, 'get', 'default')

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, dataForm.parseForm(stanza))
    })
    this.client.send(stanza)
}

PubSub.prototype.subscriptionConfigurationSet = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)
    if (!data.jid) data.jid = this.manager.jid
    if (!data.form)
        return this._clientError("Missing 'form' key", data, callbac)

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
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)
    if (!data.content || (0 == data.content.toString().length))
        return this._clientError("Missing message content", data, callback)
    if (!data.jid) data.jid = this.manager.jid

    var self    = this
    var stanza  = this._getStanza(data, 'set', 'publish')
    var details = data.id ? { id: data.id } : {}
    try {
        stanza.c('item', details).children = [ this._getItemParser().build(data.content) ]
    } catch (e) {
        console.error('Could not build pubsub payload', e)
        return callback(e, null)
    }
    if (data.options) {
        stanza.root().getChild('pubsub').c('publish-options')
        dataForm.addForm(stanza, data.options, this.NS_PUBLISH_OPTIONS)
    }
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        callback(null, {id: stanza.getChild('pubsub').getChild('publish').getChild('item').attrs.id})
    })
    this.client.send(stanza)
}

PubSub.prototype.deleteItem = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)    
    if (!data.id) return

    var self    = this
    var stanza  = this._getStanza(data, 'set', 'retract')
	stanza.c('item', { id: data.id })
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)
}

PubSub.prototype.purgeNode = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)

    var self    = this
    var stanza  = this._getStanza(data, 'set', 'purge')
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)
}

PubSub.prototype.getNodeConfiguration = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)

    var self = this
    var stanza = this._getStanza(data, 'get', 'configure', this.NS_OWNER)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, dataForm.parseForm(stanza))
    })
    this.client.send(stanza)
}

PubSub.prototype.setNodeConfiguration = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)
    if (!data.form) 
        return this._clientError("Missing 'form' key", data, callback)

    var self = this
    var stanza = this._getStanza(data, 'set', 'configure', this.NS_OWNER)
	dataForm.addForm(stanza, data.form, this.NS_CONFIG)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)	
}

PubSub.prototype.getItems = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)

    var self = this
    var stanza = this._getStanza(data, 'get', 'items', this.NS_PUBSUB)
    if (data.id) {
   	if (false == (data.id instanceof Array)) data.id = [ data.id ]
        data.id.forEach(function(id) { stanza.c('item', {id: id}).up() }) 
    }
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
        var items = { items: [] }
        stanza.getChild('pubsub').getChild('items').getChildren('item').forEach(function(entry) {
            items.items.push(self._getItemParser().parse(entry))
        })
        callback(null, items)
    })
    this.client.send(stanza)
}

PubSub.prototype.getAffiliations = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (data.owner && !data.node) return this._clientError("Can only do 'owner' for a node", data, callback)
    var owner = (data.owner) ? this.NS_OWNER : null
    var self = this
    var stanza = this._getStanza(data, 'get', 'affiliations', owner)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        var affiliations = []
        stanza.getChild('pubsub').getChild('affiliation').forEach(function(affiliation) {
            affiliations.push({
                jid: self._getJid(affiliation.attrs.jid),
                affiliation: affiliation.attrs.affiliation
            })
        })
        callback(null, affiliations)
    })
    this.client.send(stanza)	
}

PubSub.prototype.setAffiliation = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (!data.node)
        return this._clientError("Missing 'node' key", data, callback)
    if (!data.jid) return this._client("Missing 'jid' jey", data, callback)

    var self = this
    var stanza = this._getStanza(data, 'set', 'affiliations', this.NS_OWNER)
    var detail = { jid: data.jid }
    if (data.affiliation) detail.affiliation = data.affiliation
    stanza.c('affiliation', detail)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
    if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        callback(null, true)
    })
    this.client.send(stanza)
}

PubSub.prototype.getSubscriptions = function(data, callback) {
    if (!data.to) return this._clientError("Missing 'to' key", data, callback)
    if (data.owner && !data.node) return this._clientError("Can only do 'owner' for a node", data, callback)
    var owner = (data.owner) ? this.NS_OWNER : null
    var self = this
    var stanza = this._getStanza(data, 'get', 'subscriptions', owner)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if (stanza.attrs.type == 'error') callback(self._parseError(stanza), null)
        var subscriptions = []
        stanza.getChild('pubsub').getChild('subscriptions').getChildren().forEach(function(subscription) {
            var sub = {
                jid: self._getJid(subscription.attrs.jid),
                subscription: subscription.attrs.subscription,
            }
            if (subscription.attrs.node) sub.node = subscription.attrs.node
            if (subscription.attrs.subid) sub.id = subscription.attrs.subid
            subscriptions.push(sub)
        })
        callback(null, subscriptions)
    })
    this.client.send(stanza)
}

PubSub.prototype._getStanza = function(data, type, element, namespace) {
    var attributes = {}
    if (data.node) attributes.node = data.node
    if (data.jid) attributes.jid = data.jid
    if (data.id) attributes.subid = data.id
    return new builder.Element(
        'iq',
        { to: data.to, type: type, id: this._getId() }
    ).c('pubsub', {xmlns: namespace || this.NS_PUBSUB})
     .c(element, attributes)
}

PubSub.prototype._getItemParser = function() {
    if (!this.itemParser)
        this.itemParser = require('xmpp-ftw-item-parser')
    return this.itemParser
}

PubSub.prototype.setItemParser = function(parser) {
    this.itemParser = itemParser
    return this
}

PubSub.prototype._eventNotification = function(stanza) {
    var event = stanza.getChild('event', this.NS_EVENT)
    if (items = event.getChild('items')) {
        if (items.getChild('item'))
            return this._itemNotification(stanza, items)
        if (items.getChild('retract')) 
            return this._itemDeleteNotification(stanza, items)
    }
    if (configuration = event.getChild('configuration'))
        return this._configurationUpdate(stanza, configuration)
    if (del = event.getChild('delete'))
        return this._deleteNodeNotification(stanza, del)
    if (purge = event.getChild('purge'))
        return this._purgeNodeNotification(stanza, purge)
    return false
}

PubSub.prototype._configurationUpdate = function(stanza, configuration) {
    var data = { from: stanza.attrs.from }
    this._getConfigurationChanges(configuration, data)
    this.socket.emit('xmpp.pubsub.push.configuration', data)
    return true
}

PubSub.prototype._getConfigurationChanges = function(configuration, data) {
    data.node = configuration.attrs.node
    if (x = configuration.getChild('x', dataForm.NS))
        data.configuration = dataForm.parseFields(x) 
}

PubSub.prototype._deleteNodeNotification = function(stanza, del) {
    var data = { from: stanza.attrs.from }
    this._getDeleteNodeNotification(del, data)
    this.socket.emit('xmpp.pubsub.push.delete', data)
    return true
}

PubSub.prototype._getDeleteNodeNotification = function(del, data) {
    data.node = del.attrs.node
    if (redirect = del.getChild('redirect'))
        data.redirect = redirect.attrs.uri
}

PubSub.prototype._itemDeleteNotification = function(stanza, items) {
    var data = { from: stanza.attrs.from }
    this._getItemData(items, data)
    this._getHeaderData(stanza, data)
    this.socket.emit('xmpp.pubsub.push.retract', data)
    return true
}

PubSub.prototype._itemNotification = function(stanza, items) {
    var data = { from: stanza.attrs.from }
    this._getItemData(items, data)
    if (stanza.getChild('headers'))
       this._getHeaderData(stanza, data)
    if (stanza.getChild('delay') data.delay = stanza.getChild('delay').attrs.stamp
    this.socket.emit('xmpp.pubsub.push.item', data)
    return true
}

PubSub.prototype._purgeNodeNotification = function(stanza, purge) {
    var data = { from: stanza.attrs.from, node: purge.attrs.node }
    this.socket.emit('xmpp.pubsub.push.purge', data)
    return true
}

PubSub.prototype._getHeaderData = function(stanza, data) {
    if (!(headers = stanza.getChild('headers', this.NS_HEADERS))) return
    data.headers = []
    headers.getChildren().forEach(function(header) {
        data.headers.push({name: header.attrs.name, value: header.getText() })
    })
}

PubSub.prototype._getItemData = function(items, data) {
    data.node = items.attrs.node
    if (!(item = items.getChild('item'))) return false
    data.id = item.attrs.id
    if (item.children.length > 0)
        data.item = this._getItemParser().parse(item)
}

module.exports = PubSub
