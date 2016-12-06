'use strict'
/* eslint-env mocha */

const rsm = require('../../../index').utils['xep-0059']
const ltx = require('ltx')

/* jshint -W030 */
describe('XEP-0059', function () {
  it('Should export the RSM namespace', function () {
    rsm.NS.should.equal('http://jabber.org/protocol/rsm')
  })

  describe('Build an RSM element', function () {
    let stanza = null

    beforeEach(function () {
      stanza = new ltx.Element('iq')
    })

    it('Doesn\'t add element if there\'s no RSM data', function () {
      rsm.build(stanza, null)
      stanza.toString().should.equal('<iq/>')
    })

    it('Ignores invalid RSM data', function () {
      rsm.build(stanza, true)
      stanza.toString().should.equal('<iq/>')
    })

    it('Adds <max> element if provided', function () {
      const max = 666
      rsm.build(stanza, { max })
      const rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('max').should.equal('' + max)
    })

    it('Adds <after> element if provided', function () {
      const after = 'item-id-1234'
      rsm.build(stanza, { after })
      const rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('after').should.equal(after)
    })

    it('Adds <before> element if provided', function () {
      const before = 'item-id-1234'
      rsm.build(stanza, { before })
      const rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('before').should.equal(before)
    })

    it('Adds empty <before> element if provided', function () {
      const before = true
      rsm.build(stanza, { before })
      const rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChild('before').toString().should.equal('<before/>')
    })

    it('Adds <index> element if provided', function () {
      const index = '1234'
      rsm.build(stanza, { index })
      const rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('index').should.equal(index)
    })

    it('Can request 0 results', function () {
      const max = 0
      rsm.build(stanza, { max: 0 })
      const rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('max').should.equal('' + max)
    })
  })

  describe('Parse an RSM element', function () {
    let stanza = null

    beforeEach(function () {
      stanza = ltx.parse('<iq><set xmlns="' + rsm.NS + '"/></iq>')
    })

    it('Returns empty object if no RSM element', function () {
      const data = rsm.parse(ltx.parse('<iq/>'))
      data.should.eql({})
    })

    it('Should add \'count\'', function () {
      stanza.getChild('set').c('count').t('200').root()
      const data = rsm.parse(stanza)
      data.should.eql({ count: 200 })
    })

    it('Should add \'first\'', function () {
      stanza.getChild('set').c('first').t('1234')
      const data = rsm.parse(stanza)
      data.should.eql({ first: '1234' })
    })

    it('Should add \'first-index\'', function () {
      stanza.getChild('set').c('first', { index: '1234' }).t('abc').root()
      const data = rsm.parse(stanza)
      data.should.eql({ first: 'abc', 'first-index': '1234' })
    })

    it('Should add \'last\'', function () {
      stanza.getChild('set').c('last').t('4321').root()
      const data = rsm.parse(stanza)
      data.should.eql({ last: '4321' })
    })
  })
})
