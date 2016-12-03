'use strict'
/* eslint-env mocha */

var correction = require('../../../index').utils['xep-0308'],
  ltx = require('ltx')

/* jshint -W030 */
describe('XEP-0308', function () {
  it('Should export the correction namespace', function () {
    correction.NS.should.equal('urn:xmpp:message-correct:0')
  })

  describe('Build a replace element', function () {
    var stanza

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
    var stanza = ltx.parse('<message><replace xmlns="' + correction.NS + '" id="5" /></message>')

    it('Adds correction data', function () {
      var data = {}
      correction.parse(stanza, data)
      data.replace.should.equal('5')
    })
  })
})
