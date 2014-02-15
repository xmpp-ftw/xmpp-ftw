'use strict';

var NS = exports.NS = 'urn:xmpp:receipts'

exports.parse = function(stanza, data) {
    var state
    if (!(state = stanza.getChildByAttr('xmlns', NS)))
        return
    data.state = state.getName()
}

exports.build = function(stanza, type, data) {
    var attrs = { xmlns: NS }
    if (data && data.id) attrs.id = data.id
    stanza.c(type || 'request', attrs)
}