var ltx     = require('ltx'),
    builder = require('node-xmpp')

var NS_XHTML    = 'http://www.w3.org/1999/xhtml',
    NS_XHTML_IM = 'http://jabber.org/protocol/xhtml-im'

var XHTML = 'xhtml',
    PLAIN = 'plain'

var buildStanza = function(request, data, caller) {
    if (!data.to) {
        caller._clientError('Missing \'to\' key', request)
        return false
    }
    if (!data.type) data.type = 'chat'
    var stanza = new builder.Element(
        'message',
        { to: data.to, type: data.type }
    )
            
    if (request.content) {
        var format = (request.format && (XHTML == request.format)) ?
            XHTML : PLAIN
        var plainMessage = request.content
        var richMessage, attrs
        if (XHTML == format) {
            try {
                attrs        = { xmlns: NS_XHTML }
                richMessage  = ltx.parse(request.content)
                plainMessage = request.content.replace(/(<([^>]+)>)/ig, '')
            } catch (e) {
                stanza.attrs.type = 'chat'
                caller._clientError('Can not parse XHTML message', request)
                return false
            }
        }
        stanza.c('body').t(plainMessage).up()
        if (richMessage)
            stanza.c('html', {xmlns: NS_XHTML_IM})
                .c('body', attrs)
                .children = [ richMessage ]
    }
    return stanza
}

module.exports = {
    builder: buildStanza,
    NS_XHTML_IM: NS_XHTML_IM,
    NS_XHTML: NS_XHTML
}
