/* @flow */
'use strict'

const ltx = require('node-xmpp-client').ltx
const NS_XHTML = 'http://www.w3.org/1999/xhtml'
const NS_XHTML_IM = 'http://jabber.org/protocol/xhtml-im'

const XHTML = 'xhtml'
const PLAIN = 'plain'

const addContent = (request, stanza, caller) => {
  const format = (request.format && (XHTML === request.format)) ? XHTML : PLAIN
  let plainMessage = request.content
  let richMessage = false
  let attrs = null
  if (XHTML === format) {
    try {
      attrs = { xmlns: NS_XHTML }
      richMessage = ltx.parse(request.content)
      plainMessage = request.content.replace(/(<([^>]+)>)/ig, '')
    } catch (e) {
      stanza.attrs.type = 'chat'
      caller._clientError('Can not parse XHTML message', request)
      return false
    }
  }
  stanza.c('body').t(plainMessage).up()
  if (richMessage) {
    stanza.c('html', {xmlns: NS_XHTML_IM})
      .c('body', attrs)
      .children = [ richMessage ]
  }
  return true
}

const buildStanza = (request, data, caller) => {
  if (!data.to) {
    caller._clientError('Missing \'to\' key', request)
    return false
  }
  if (!data.type) {
    data.type = 'chat'
  }
  const stanza = new ltx.Element(
    'message',
    { to: data.to, type: data.type }
  )

  if (request.content) {
    if (!addContent(request, stanza, caller)) {
      return false
    }
  }
  return stanza
}

module.exports = {
  builder: buildStanza,
  NS_XHTML_IM: NS_XHTML_IM,
  NS_XHTML: NS_XHTML
}
