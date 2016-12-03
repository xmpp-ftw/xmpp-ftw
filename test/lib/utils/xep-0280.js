'use strict'
/* eslint-env mocha */

const carbons = require('../../../index').utils['xep-0280']

/* jshint -W030 */
describe('XEP-0280 Carbons', function () {
  it('Should export the carbons namespace', function () {
    carbons.NS.should.equal('urn:xmpp:carbons:2')
  })
})
