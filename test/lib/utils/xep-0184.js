'use strict';

var receipt = require('../../../index').utils['xep-0184']
  , ltx   = require('ltx')

/* jshint -W030 */
describe('XEP-0184', function() {

    it('Should export the receipt namespace', function() {
        receipt.NS.should.equal('urn:xmpp:receipts')
    })

    describe('Build a receipt element', function() {

        var stanza

        beforeEach(function() {
            stanza = new ltx.Element('message')
        })

        it('Adds received element', function() {
            receipt.build(stanza, 'received', { id: '1234' })
            stanza.root().getChild('received', receipt.NS).should.exist
            stanza.root().getChild('received').attrs.id.should.equal('1234')
        })

        it('Adds \'request\' element by default', function() {
            receipt.build(stanza)
            stanza.root().getChild('request', receipt.NS).should.exist
        })

    })

    describe('Parse an incoming message with receipt request', function() {

    })

})
