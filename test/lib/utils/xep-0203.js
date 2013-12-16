var delay = require('../../../index').utils['xep-0203']
  , ltx   = require('ltx')

describe('XEP-0203', function() {

    it('Should export the delay namespace', function() {
        delay.NS.should.equal('urn:xmpp:delay')
    })

    describe('Build a chat state element', function() {

        var stanza

        beforeEach(function() {
            stanza = new ltx.Element('message')
        })

        it('Doesn\'t add element if there\'s delay data', function() {
            delay.build(stanza, null)
            stanza.toString().should.equal('<message/>')
        })

        it('Ignores invalid delay data', function() {
            delay.build(stanza, true)
            stanza.toString().should.equal('<message/>')
        })

        it('Adds basic delay data', function() {
            var stamp = '2015-10-21T16:29:00Z'
            delay.build(stanza, { when: stamp })
            var element = stanza.getChild('delay', delay.NS)
            element.should.exist
            element.attrs.stamp.should.equal(stamp)
        })

        it('Adds detailed delay data', function() {
            var request = {
                when: '2015-10-21T16:29:00Z',
                from: 'shakespeare.lit',
                reason: 'Offline storage'
            }
            delay.build(stanza, request)
            var element = stanza.getChild('delay', delay.NS)
            element.should.exist
            element.attrs.stamp.should.equal(request.when)
            element.attrs.from.should.equal(request.from)
            element.getText().should.equal(request.reason)
        })

    })

    describe('Parse a delay element', function() {

        var stanza

        beforeEach(function() {
            stanza = ltx.parse('<message>' +
                '<delay xmlns="' + delay.NS + '" ' +
                    'stamp="2015-10-21T16:29:00Z" from="shakespeare.lit">' +
                    'Offline storage' +
                '</delay>' +
                '</message>')
        })

        it('Returns empty object if no delay element', function() {
            var data = {}
            delay.parse(ltx.parse('<message/>'), data)
            data.should.eql({})
        })

        it('Should add basic delay data if available', function() {
            var data = {}
            stanza = ltx.parse('<message>' +
                '<delay xmlns="' + delay.NS + '" stamp="2015-10-21T16:29:00Z" />' +
                '</message>')
            delay.parse(stanza, data)
            data.should.eql({ delay: { when: '2015-10-21T16:29:00Z' }})
        })

        it('Should add full delay data if available', function() {
            var data = {}
            delay.parse(stanza, data)
            data.should.eql({ delay: {
                when: '2015-10-21T16:29:00Z',
                from: 'shakespeare.lit',
                reason: 'Offline storage'
            }})
        })

    })

})
