'use strict';

var NS = exports.NS = 'urn:xmpp:message-correct:0'

exports.parse = function(stanza, data) {
    if (!stanza.getChild('replace', NS)) return
    data.replace = stanza.getChild('replace', NS).attrs.id
    return
}

exports.build = function(stanza, data) {
    if (!data.replace) return
    var attrs = { xmlns: NS, id: data.replace }
    stanza.c('replace', attrs)
}