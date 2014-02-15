'use strict';

var NS = exports.NS = 'urn:xmpp:receipts'

exports.parse = function(stanza, data) {
    var state
    if (!(state = stanza.getChildByAttr('xmlns', NS)))
        return
    data.state = state.getName()
}

exports.build = function(stanza, data, type) {
    stanza.c(type || 'received', { xmlns: NS, id: data.id })
}