'use strict';

var NS = exports.NS = 'http://jabber.org/protocol/chatstates'

exports.parse = function(stanza, data) {
    var state
    if (!(state = stanza.getChildByAttr('xmlns', NS)))
        return
    data.state = state.getName()
}

exports.build = function(stanza, state) {
    if (!state || (typeof state !== 'string')) return
    stanza.c(state, { xmlns: NS })
}