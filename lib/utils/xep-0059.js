/* @flow */
'use strict'

const NS = exports.NS = 'http://jabber.org/protocol/rsm'

exports.parse = (stanza) => {
  const data = {}
  const rsm = stanza.getChild('set', NS)
  if (!rsm) {
    return data
  }
  const elements = ['count', 'first', 'last']
  elements.forEach(function (element) {
    const elm = rsm.getChild(element)
    if (!elm) {
      return
    }
    data[element] = elm.getText()
    if (element === 'count') {
      data[element] = parseInt(data[element], 10)
    }
    if ((element === 'first') && elm.attrs.index) {
      data['first-index'] = elm.attrs.index
    }
  })
  return data
}

exports.build = (stanza, rsm) => {
  if (!rsm || (typeof rsm !== 'object')) {
    return
  }
  const set = stanza.c('set', { xmlns: NS })
  const elements = [ 'max', 'after', 'before', 'index' ]
  elements.forEach((element) => {
    if (typeof rsm[element] === 'undefined') {
      return
    }
    const elm = set.c(element)
    if (typeof rsm[element] !== 'boolean') {
      elm.t(rsm[element])
    }
    set.up()
  })
}
