'use strict';

var NS = exports.NS = 'urn:xmpp:delay'

exports.parse = function(stanza, data) {
    var element, reason
    if (!(element = stanza.getChild('delay', NS)))
        return
    var delay = { when: element.attrs.stamp }
    if (element.attrs.from) delay.from = element.attrs.from
    if (!!(reason = element.getText()))
        delay.reason = reason
    data.delay = delay
}

exports.build = function(stanza, data) {
    if (!data || (typeof data !== 'object')) return
    var attrs = { xmlns: NS }
    if (data.when) attrs.stamp = data.when
    if (data.from) attrs.from = data.from
    var delay = stanza.c('delay', attrs)
    if (data.reason) delay.t(data.reason)
}