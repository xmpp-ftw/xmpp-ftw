'use strict';

var NS = exports.NS = 'urn:xmpp:receipts'

exports.parse = function(stanza, data) {
    var state
    if (!(state = stanza.getChildByAttr('xmlns', NS)))
        return
    data.state = state.getName()
}

exports.build = function(stanza, receipt) {
    if (!receipt || (typeof receipt !== 'string')) return
    stanza.c('request', { xmlns: NS })
}