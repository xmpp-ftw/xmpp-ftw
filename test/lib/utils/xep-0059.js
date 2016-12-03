'use strict'
/* eslint-env mocha */

var rsm = require('../../../index').utils['xep-0059'],
  ltx = require('ltx')

/* jshint -W030 */
describe('XEP-0059', function () {
  it('Should export the RSM namespace', function () {
    rsm.NS.should.equal('http://jabber.org/protocol/rsm')
  })

  describe('Build an RSM element', function () {
    var stanza

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
      var max = 666
      rsm.build(stanza, { max: max })
      var rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('max').should.equal('' + max)
    })

    it('Adds <after> element if provided', function () {
      var after = 'item-id-1234'
      rsm.build(stanza, { after: after })
      var rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('after').should.equal(after)
    })

    it('Adds <before> element if provided', function () {
      var before = 'item-id-1234'
      rsm.build(stanza, { before: before })
      var rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('before').should.equal(before)
    })

    it('Adds empty <before> element if provided', function () {
      var before = true
      rsm.build(stanza, { before: before })
      var rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChild('before').toString().should.equal('<before/>')
    })

    it('Adds <index> element if provided', function () {
      var index = '1234'
      rsm.build(stanza, { index: index })
      var rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('index').should.equal(index)
    })

    it('Can request 0 results', function () {
      var max = 0
      rsm.build(stanza, { max: 0 })
      var rsmElement = stanza.root().getChild('set', rsm.NS)
      rsmElement.should.exist
      rsmElement.getChildText('max').should.equal('' + max)
    })
  })

  describe('Parse an RSM element', function () {
    var stanza

    beforeEach(function () {
      stanza = ltx.parse('<iq><set xmlns="' + rsm.NS + '"/></iq>')
    })

    it('Returns empty object if no RSM element', function () {
      var data = rsm.parse(ltx.parse('<iq/>'))
      data.should.eql({})
    })

    it('Should add \'count\'', function () {
      stanza.getChild('set').c('count').t('200').root()
      var data = rsm.parse(stanza)
      data.should.eql({ count: 200 })
    })

    it('Should add \'first\'', function () {
      stanza.getChild('set').c('first').t('1234')
      var data = rsm.parse(stanza)
      data.should.eql({ first: '1234' })
    })

    it('Should add \'first-index\'', function () {
      stanza.getChild('set').c('first', { index: '1234' }).t('abc').root()
      var data = rsm.parse(stanza)
      data.should.eql({ first: 'abc', 'first-index': '1234' })
    })

    it('Should add \'last\'', function () {
      stanza.getChild('set').c('last').t('4321').root()
      var data = rsm.parse(stanza)
      data.should.eql({ last: '4321' })
    })
  })
})
