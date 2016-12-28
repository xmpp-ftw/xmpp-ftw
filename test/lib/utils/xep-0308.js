'use strict'
/* eslint-env mocha */

const correction = require('../../../index').utils['xep-0308']
const ltx = require('node-xmpp-client').ltx

/* jshint -W030 */
describe('XEP-0308', function () {
  it('Should export the correction namespace', function () {
    correction.NS.should.equal('urn:xmpp:message-correct:0')
  })

  describe('Build a replace element', function () {
    let stanza = null

    beforeEach(function () {
      stanza = new ltx.Element('message')
    })

    it('Adds replace element', function () {
      correction.build(stanza, { replace: '1234' })
      stanza.root().getChild('replace', correction.NS)
        .should.exist
      stanza.root().getChild('replace').attrs.id
        .should.equal('1234')
    })
  })

  describe('Parse an incoming message with correction request', function () {
    const stanza = ltx.parse(
      `<message><replace xmlns="${correction.NS}" id="5" /></message>`
    )

    it('Adds correction data', function () {
      const data = {}
      correction.parse(stanza, data)
      data.replace.should.equal('5')
    })
  })
})
