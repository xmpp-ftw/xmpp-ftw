var xep0071 = require('../../../lib/utils/xep-0071')
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

    it('Returns error if content property not available', function() {
         xep0071.builder({}, { to: 'romeo@example.com' }, caller)
         caller.error.should.equal('Message content not provided')
         caller.request.should.be.null
    })

    it('Can build a plain chat message', function(done) {
        xmpp.once('stanza', function(stanza) {
            stanza.is('message').should.be.true
            stanza.getChild('body').getText().should.equal(request.content)
            stanza.attrs.type.should.equal('chat')
            stanza.attrs.to.should.equal(request.to)
            done()
        })
        var request = { content: 'Hello world!', to: 'romeo@example.com' }
        xep0071.builder(request, { to: request.to }, caller)
        should.not.exist(caller.error)
        should.not.exist(caller.request)
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

        xmpp.on('stanza', function(stanza) {
            stanza.is('message').should.be.true
            stanza.attrs.type.should.equal(data.type)
            stanza.getChild('body').getText().should.equal('XMPP-FTW ROCKS!')
            stanza.getChild('html', xep0071.NS_XHTML_IM)
                .getChild('body', xep0071.NS_XHTML)
                .children.join()
                .should.equal(request.content)
            done()
        })
        xep0071.builder(request, data, caller)
        should.not.exist(caller.error)
        should.not.exist(caller.request)

    })
})
