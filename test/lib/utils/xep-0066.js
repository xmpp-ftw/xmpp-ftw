'use strict'
/* eslint-env mocha */

const oob = require('../../../index').utils['xep-0066']
const ltx = require('node-xmpp-client').ltx

/* jshint -W030 */
describe('XEP-0066', function () {
  it('Should export the jabber:iq:oob namespace', function () {
    oob.NS_IQ.should.equal('jabber:iq:oob')
  })

  it('Should export the jabber:x:oob namesapce', function () {
    oob.NS_X.should.equal('jabber:x:oob')
  })

  describe('Parse an OOB element', function () {
    let stanza = null

    it('Should return empty object if no OOB element', function () {
      stanza = ltx.parse('<iq/>')
      oob.parse(stanza).should.eql({})
    })

    describe('OOB X element', function () {
      it('Returns empty object if no OOB X element', function () {
        const data = oob.parse(
          ltx.parse('<iq><x xmlns="jabber:x:not-oob"/></iq>')
        )
        data.should.eql({})
      })

      it('Should add URL and DESC properties', function () {
        const url = 'http://www.shakepeare.lit'
        const description = 'Plays and sonnets'
        const stanza = ltx.parse(
         '<iq>' +
             '<x xmlns="jabber:x:oob">' +
             `<url>${url}</url>` +
             `<desc>${description}</desc>` +
             '</x>' +
         '</iq>'
        )
        const data = oob.parse(stanza)
        data.url.should.equal(url)
        data.description.should.equal(description)
      })

      it('Shouldn\'t error if fields missing', function () {
        const stanza = ltx.parse(
         '<iq>' +
             '<x xmlns="jabber:x:oob"/>' +
         '</iq>'
        )
        oob.parse(stanza).should.eql({})
      })
    })

    describe('OOB IQ element', function () {
      it('Should add URL and DESC properties', function () {
        const url = 'http://www.shakepeare.lit'
        const description = 'Plays and sonnets'
        const stanza = ltx.parse(
          '<iq>' +
             '<query xmlns="jabber:iq:oob">' +
             `<url>${url}</url>` +
             `<desc>${description}</desc>` +
             '</query>' +
          '</iq>'
        )
        const data = oob.parse(stanza)
        data.url.should.equal(url)
        data.description.should.equal(description)
      })

      it('Shouldn\'t error if fields missing', function () {
        const stanza = ltx.parse(
         '<iq>' +
             '<query xmlns="jabber:iq:oob"/>' +
         '</iq>'
        )
        oob.parse(stanza).should.eql({})
      })

      it('Should add stream ID if present', function () {
        const stream = '0123456'

        const stanza = ltx.parse(
         '<iq>' +
           `<query xmlns="jabber:iq:oob" sid="${stream}"/>` +
           '</iq>'
        )
        oob.parse(stanza).stream.should.equal(stream)
      })
    })
  })
})
