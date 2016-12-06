'use strict'
/* eslint-env mocha */

const state = require('../../../index').utils['xep-0085']
const ltx = require('ltx')

/* jshint -W030 */
describe('XEP-0085', function () {
  it('Should export the chatstate namespace', function () {
    state.NS.should.equal('http://jabber.org/protocol/chatstates')
  })

  describe('Build a chat state element', function () {
    let stanza = null

    beforeEach(function () {
      stanza = new ltx.Element('message')
    })

    it('Doesn\'t add element if there\'s no chat state data', function () {
      state.build(stanza, null)
      stanza.toString().should.equal('<message/>')
    })

    it('Ignores invalid chat state data', function () {
      state.build(stanza, true)
      stanza.toString().should.equal('<message/>')
    })

    it('Adds chat state element if requested', function () {
      state.build(stanza, 'active')
      stanza.getChild('active', state.NS).should.exist
    })
  })

  describe('Parse an state element', function () {
    let stanza = null

    beforeEach(function () {
      stanza = ltx.parse('<message><active xmlns="' + state.NS + '"/></message>')
    })

    it('Returns empty object if no state element', function () {
      const data = {}
      state.parse(ltx.parse('<message/>'), data)
      data.should.eql({})
    })

    it('Should add chat state data if available', function () {
      const data = {}
      state.parse(stanza, data)
      data.should.eql({ state: 'active' })
    })
  })
})
