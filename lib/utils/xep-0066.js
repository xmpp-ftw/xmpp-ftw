/* @flow */
'use strict'

const NS_X = exports.NS_X = 'jabber:x:oob'
const NS_IQ = exports.NS_IQ = 'jabber:iq:oob'

const parseOob = (stanza) => {
  const data = {}
  let value = stanza.getChildText('url')

  if (value) {
    data.url = value
  }
  value = stanza.getChildText('desc')
  if (value) {
    data.description = value
  }
  return data
}

const parseX = (stanza) => parseOob(stanza)

const parseIq = (stanza) => {
  const data = parseOob(stanza)
  if (stanza.attrs.sid) {
    data.stream = stanza.attrs.sid
  }
  return data
}

exports.parse = (stanza) => {
  let oob = stanza.getChild('x', NS_X)
  if (oob) {
    return parseX(oob)
  }

  oob = stanza.getChild('query', NS_IQ)
  if (oob) {
    return parseIq(oob)
  }

  return {}
}

exports.build = () => { }
