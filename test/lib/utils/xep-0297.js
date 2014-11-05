'use strict';

var delay = require('../../../index').utils['xep-0297']
  , ltx   = require('ltx')

/* jshint -W030 */
describe('XEP-0297 Stanza Forwarding', function() {

    it('Should export the forwarding namespace', function() {
        delay.NS.should.equal('urn:xmpp:forward:0')
    })
    
})