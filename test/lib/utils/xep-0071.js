var xep = require('../../lib/utils/xep-0071')
require('mocha')
var should  = require('should')
  , helper  = require('../../helper')

describe('XEP-0071', function() {

    var caller

    before(function() {
    })

    beforeEach(function() {
        var client = new helper.Eventer()
        caller = {
            error: null,
            request: null,
            stanza: null,
            _clientError: function(error, request) {
                this.error = error
                this.request = request
            },
            client: client 
        }
    })

    it('Exports the XHTML namespace', function() {
        xep.NS_XHTML.should.equal('http://www.w3.org/1999/xhtml')
    })

    it('Returns error if content property not available', function() {
         xep.builder({}, {}, caller)
         caller.error.should.equal('client.error')
    })
})
