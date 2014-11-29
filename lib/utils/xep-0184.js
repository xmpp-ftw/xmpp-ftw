/* @flow */
'use strict';

var NS = exports.NS = 'urn:xmpp:receipts'

exports.parse = function(stanza, data) {
    data.id = stanza.getChild('received', NS).attrs.id
    return
}

exports.build = function(stanza, type, data) {
    var attrs = { xmlns: NS }
    if (data && data.id) attrs.id = data.id
    stanza.c(type || 'request', attrs)
}
