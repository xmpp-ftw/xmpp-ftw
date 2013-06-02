var builder  = require('node-xmpp')
    Base     = require('./base')
    dataForm = require('./utils/xep-0004')

var Disco = function() {}

Disco.prototype = new Base()

Disco.prototype.NS_ITEMS = "http://jabber.org/protocol/disco#items"
Disco.prototype.NS_INFO  = "http://jabber.org/protocol/disco#info"

Disco.prototype.attributes = ['type', 'name', 'category', 'var', 'jid', 'node']

Disco.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.discover.items', function(data, callback) {
        self.getItems(data, callback)
    })
    this.socket.on('xmpp.discover.info', function(data, callback) {
        self.getFeatures(data, callback)
    })
}

Disco.prototype.handles = function(stanza) {
    return stanza.is('iq') 
        && (query = stanza.getChild('query'))
        && (query.getNS() == this.NS_INFO)
}

Disco.prototype.handle = function(stanza) {
    var self = this
    this.socket.emit('xmpp.discover.info', {from: stanza.attrs.from}, function(data) {
    var reply = new builder.Element(
        'iq',
        { to: stanza.attrs.from, type: 'result', id: stanza.attrs.id }
        ).c('query', {xmlns: this.NS_INFO})
        if (data instanceof Array) {
            data.forEach(function(item) {
                if (!item.kind) return
        	var attributes = {}
       		self.attributes.forEach(function(attr) {
                    if (item[attr]) attributes[attr] = item[attr]
                })
        	reply.c(item.kind, attributes).up()
            })
        }
        self.client.send(reply)
    })
    return true
}

Disco.prototype.getItems = function(data, callback) {
    var self = this
    if (!data.of) return this._clientError("Missing 'of' key", data, callback)
    
    var attributes = {xmlns: this.NS_ITEMS}
    if (data.node) attributes.node = data.node
    
    var stanza = new builder.Element(
        'iq',
        { to: data.of, type: 'get', id: this._getId() }
    ).c('query', attributes).up()

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        self._handleDiscoItems(stanza, callback)
    })
    this.client.send(stanza)    
}

Disco.prototype._handleDiscoItems = function(stanza, callback) {
    var self = this
    if (typeof(callback) != 'function') return console.error('No callback provided')
    if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
    items = []
    stanza.getChild('query').getChildren('item').forEach(function(item) {
    	var entry = {}
    	for (var name in item.attrs) {
            var value = item.attrs[name]
            if (value.length > 0) 
                entry[name] = value
        }
        items.push(entry)
    })
    callback(null, items)
}

Disco.prototype.getFeatures = function(data, callback) {
    var self   = this
    if (!data.of) return this._clientError("Missing 'of' key", data, callback)

    var attrs = {xmlns: this.NS_INFO }
    if (data.node) attrs.node = data.node
    
    var stanza = new builder.Element(
        'iq',
        { to: data.of, type: 'get', id: this._getId() }
    ).c('query', attrs)

    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        self._handleDiscoInfo(stanza, callback)
    })
    this.client.send(stanza)
}

Disco.prototype._handleDiscoInfo = function(stanza, callback) {
    var self = this
    if (typeof(callback) != 'function') return console.error('No callback provided')
    if (stanza.attrs.type == 'error') return callback(self._parseError(stanza), null)
    var validTypes = ['identity', 'feature', 'item'] 
    var items = []
    stanza.getChild('query').children.forEach(function(item) {
        var info = { kind: item.getName().toLowerCase() }
        if ('x' == info.kind) 
            return info.form = dataForm.parseFields(item)
        if (-1 == validTypes.indexOf(info.kind)) return
        self.attributes.forEach(function(attr) {
            if ((null != (attrValue = item.attrs[attr])) && attrValue.length > 0)
                info[attr] = attrValue
        })
        items.push(info)
    })
    callback(null, items)
}

module.exports = Disco
