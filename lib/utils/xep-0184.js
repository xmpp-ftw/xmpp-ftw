/* @flow */
'use strict'

const NS = exports.NS = 'urn:xmpp:receipts'

exports.parse = (stanza, data) => {
  data.id = stanza.getChild('received', NS).attrs.id
  return
}

exports.build = (stanza, type, data) => {
  const attrs = { xmlns: NS }
  if (data && data.id) {
    attrs.id = data.id
  }
  stanza.c(type || 'request', attrs)
}
