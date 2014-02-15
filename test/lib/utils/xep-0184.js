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

        it('Doesn\'t add element if there\'s no receipt data', function() {
            receipt.build(stanza, null)
            stanza.toString().should.equal('<message/>')
        })

    })

    describe('Parse an incoming message with receipt request', function() {

    })

})
