'use strict';

var delay = require('../../../index').utils['xep-0280']
  , ltx   = require('ltx')

/* jshint -W030 */
describe('XEP-0280 Carbons', function() {

    it('Should export the carbons namespace', function() {
        delay.NS.should.equal('urn:xmpp:carbons:2')
    })

})
