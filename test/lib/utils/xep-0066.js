'use strict'
/* eslint-env mocha */

var oob = require('../../../index').utils['xep-0066'],
  ltx = require('ltx')

/* jshint -W030 */
describe('XEP-0066', function () {
  it('Should export the jabber:iq:oob namespace', function () {
    oob.NS_IQ.should.equal('jabber:iq:oob')
  })

  it('Should export the jabber:x:oob namesapce', function () {
    oob.NS_X.should.equal('jabber:x:oob')
  })

  describe('Parse an OOB element', function () {
    var stanza

    it('Should return empty object if no OOB element', function () {
      stanza = ltx.parse('<iq/>')
      oob.parse(stanza).should.eql({})
    })

    describe('OOB X element', function () {
      it('Returns empty object if no OOB X element', function () {
        var data = oob.parse(
                    ltx.parse('<iq><x xmlns="jabber:x:not-oob"/></iq>')
                )
        data.should.eql({})
      })

      it('Should add URL and DESC properties', function () {
        var url = 'http://www.shakepeare.lit',
          description = 'Plays and sonnets'
        var stanza = ltx.parse(
                 '<iq>' +
                     '<x xmlns="jabber:x:oob">' +
                     '<url>' + url + '</url>' +
                     '<desc>' + description + '</desc>' +
                     '</x>' +
                 '</iq>'
                )
        var data = oob.parse(stanza)
        data.url.should.equal(url)
        data.description.should.equal(description)
      })

      it('Shouldn\'t error if fields missing', function () {
        var stanza = ltx.parse(
                 '<iq>' +
                     '<x xmlns="jabber:x:oob"/>' +
                 '</iq>'
                )
        oob.parse(stanza).should.eql({})
      })
    })

    describe('OOB IQ element', function () {
      it('Should add URL and DESC properties', function () {
        var url = 'http://www.shakepeare.lit',
          description = 'Plays and sonnets'
        var stanza = ltx.parse(
                  '<iq>' +
                     '<query xmlns="jabber:iq:oob">' +
                     '<url>' + url + '</url>' +
                     '<desc>' + description + '</desc>' +
                     '</query>' +
                  '</iq>'
                )
        var data = oob.parse(stanza)
        data.url.should.equal(url)
        data.description.should.equal(description)
      })

      it('Shouldn\'t error if fields missing', function () {
        var stanza = ltx.parse(
                 '<iq>' +
                     '<query xmlns="jabber:iq:oob"/>' +
                 '</iq>'
                )
        oob.parse(stanza).should.eql({})
      })

      it('Should add stream ID if present', function () {
        var stream = '0123456'

        var stanza = ltx.parse(
                 '<iq>' +
                   '<query xmlns="jabber:iq:oob" sid="' + stream + '"/>' +
                   '</iq>'
                )
        oob.parse(stanza).stream.should.equal(stream)
      })
    })
  })
})
