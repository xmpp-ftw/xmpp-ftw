'use strict'
/* eslint-env mocha */

const forwarding = require('../../../index').utils['xep-0297']

/* jshint -W030 */
describe('XEP-0297 Stanza Forwarding', function () {
  it('Should export the forwarding namespace', function () {
    forwarding.NS.should.equal('urn:xmpp:forward:0')
  })
})
