/* @flow */
'use strict'

const NS = exports.NS = 'urn:xmpp:delay'

exports.parse = function (stanza, data) {
  const element = stanza.getChild('delay', NS)
  if (!element) {
    return
  }
  const reason = element.getText()
  const delay = { when: element.attrs.stamp }
  if (element.attrs.from) {
    delay.from = element.attrs.from
  }
  if (reason) {
    delay.reason = reason
  }
  data.delay = delay
}

exports.build = (stanza, data) => {
  if (!data || (typeof data !== 'object')) {
    return
  }
  const attrs = { xmlns: NS }
  if (data.when) {
    attrs.stamp = data.when
  }
  if (data.from) {
    attrs.from = data.from
  }
  const delay = stanza.c('delay', attrs)
  if (data.reason) {
    delay.t(data.reason)
  }
}
