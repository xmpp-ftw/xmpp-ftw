/* @flow */
'use strict'

const NS = exports.NS = 'urn:xmpp:message-correct:0'

exports.parse = (stanza, data) => {
  if (!stanza.getChild('replace', NS)) {
    return
  }
  data.replace = stanza.getChild('replace', NS).attrs.id
  return
}

exports.build = (stanza, data) => {
  if (!data.replace) {
    return
  }
  const attrs = { xmlns: NS, id: data.replace }
  stanza.c('replace', attrs)
}
