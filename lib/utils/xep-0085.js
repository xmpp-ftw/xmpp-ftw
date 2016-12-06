/* @flow */
'use strict'

const NS = exports.NS = 'http://jabber.org/protocol/chatstates'

exports.parse = (stanza, data) => {
  const state = stanza.getChildByAttr('xmlns', NS)
  if (!state) {
    return
  }
  data.state = state.getName()
}

exports.build = (stanza, state) => {
  if (!state || (typeof state !== 'string')) {
    return
  }
  stanza.c(state, { xmlns: NS })
}
