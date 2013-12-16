var xep0071 = require('../../../index').utils['xep-0071']
  , should  = require('should')
  , helper  = require('../../helper')

describe('XEP-0071', function() {

    var caller, xmpp

    beforeEach(function() {
        xmpp = new helper.Eventer()
        caller = {
            error: null,
            request: null,
            stanza: null,
            _clientError: function(error, request) {
                this.error = error
                this.request = request
            },
            client: xmpp
        }
    })

    it('Exports the XHTML namespace', function() {
        xep0071.NS_XHTML.should.equal('http://www.w3.org/1999/xhtml')
    })

    it('Exports the XHTML_IM namespace', function() {
        xep0071.NS_XHTML_IM.should.equal('http://jabber.org/protocol/xhtml-im')
    })

    it('Returns error if \'to\' jid not provided', function() {
        xep0071.builder({}, {}, caller)
        caller.error.should.equal('Missing \'to\' key')
        caller.request.should.be.null
    })

    it('Returns empty stanza if no content key', function() {
         var result = xep0071.builder({}, { to: 'romeo@example.com' }, caller)
         result.is('message').should.be.true
         result.attrs.to.should.equal('romeo@example.com')
         result.attrs.type.should.equal('chat')
    })

    it('Can build a plain chat message', function() {
        var request = { content: 'Hello world!', to: 'romeo@example.com' }
        var result = xep0071.builder(request, { to: request.to }, caller)
        result.should.not.be.false
        should.not.exist(caller.error)
        should.not.exist(caller.request)
        result.is('message').should.be.true
        result.attrs.to.should.equal('romeo@example.com')
        result.attrs.type.should.equal('chat')
        result.getChild('body').getText()
            .should.equal('Hello world!')
    })

    it('Returns error if unparsable XHTML provided', function() {
        xep0071.builder(
            { content: 'Invalid <strong>yes', format: 'xhtml' },
            { to: 'romeo@example.com' },
            caller
        )
        caller.error.should.equal('Can not parse XHTML message')
        caller.request.should.be.null
    })

    it('Can build an XHTML chat message', function(done) {

        var request = {
            content: '<p>XMPP-FTW <b>ROCKS!</b></p>',
            format: 'xhtml'
        }
        var data = { type: 'groupchat', to: 'room@muc.example.com' }

        var stanza = xep0071.builder(request, data, caller)
        should.not.exist(caller.error)
        should.not.exist(caller.request)
        stanza.is('message').should.be.true
        stanza.attrs.type.should.equal(data.type)
        stanza.getChild('body').getText().should.equal('XMPP-FTW ROCKS!')
        stanza.getChild('html', xep0071.NS_XHTML_IM)
            .getChild('body', xep0071.NS_XHTML)
            .children.join()
            .should.equal(request.content)
        done()
    })
})
