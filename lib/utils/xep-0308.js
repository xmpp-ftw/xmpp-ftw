'use strict';

var NS = exports.NS = 'urn:xmpp:message-correct:0'

exports.parse = function(stanza, data) {
    data.replace = stanza.getChild('replace', NS).attrs.id
    return
}

exports.build = function(stanza, data) {
    var attrs = { xmlns: NS, id: data.id }
    stanza.c('replace', attrs)
}