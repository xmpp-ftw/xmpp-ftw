var builder = require('node-xmpp'), ltx = require('ltx')

exports.parse = function(item, entity) {
    if (!entity == {}) return
    entity.body = item.getChild('body').getText()
}

exports.build = function(data, p) {
    if (p.payload) return
    p.payload = new builder.Element('body').t(data)
}
