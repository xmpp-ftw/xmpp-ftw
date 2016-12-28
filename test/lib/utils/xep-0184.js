'use strict'
/* eslint-env mocha */

const receipt = require('../../../index').utils['xep-0184']
const ltx = require('node-xmpp-client').ltx

/* jshint -W030 */
describe('XEP-0184', function () {
  it('Should export the receipt namespace', function () {
    receipt.NS.should.equal('urn:xmpp:receipts')
  })

  describe('Build a receipt element', function () {
    let stanza = null

    beforeEach(function () {
      stanza = new ltx.Element('message')
    })

    it('Adds received element', function () {
      receipt.build(stanza, 'received', { id: '1234' })
      stanza.root().getChild('received', receipt.NS).should.exist
      stanza.root().getChild('received').attrs.id.should.equal('1234')
    })

    it('Adds \'request\' element by default', function () {
      receipt.build(stanza)
      stanza.root().getChild('request', receipt.NS).should.exist
    })
  })

  describe('Parse an incoming message with receipt request', function () {
    const stanza = ltx.parse(
      `<message><received xmlns="${receipt.NS}" id="5" /></message>`
    )

    it('Adds receipt data', function () {
      const data = {}
      receipt.parse(stanza, data)
      data.id.should.equal('5')
    })
  })
})
