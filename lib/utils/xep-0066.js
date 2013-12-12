"use strict";

var NS_X  = exports.NS_X  = 'jabber:x:oob'
var NS_IQ = exports.NS_IQ = 'jabber:iq:oob'

exports.parse = function(stanza) {
    var oob

    if (!!(oob = stanza.getChild('x', NS_X)))
      return parseX(oob)

    if (!!(oob = stanza.getChild('query', NS_IQ)))
      return parseIq(oob)

    return {}
}

exports.build = function() { }

var parseX = function(stanza) {
  return parseOob(stanza)
}

var parseIq = function(stanza) {
  var data = parseOob(stanza)
  if (stanza.attrs.sid) data.stream = stanza.attrs.sid
  return data
}


var parseOob = function(stanza) {
  var data = {}
    , value

  if (!!(value = stanza.getChildText('url')))
    data.url = value
  if (!!(value = stanza.getChildText('desc')))
    data.description = value
  return data
}