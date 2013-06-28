var NS = exports.NS = 'http://jabber.org/protocol/rsm'

exports.parse = function(stanza) {
    var data = {}
    var rsm = stanza.getChild('set', NS)
    if (null == rsm) return data
    var elm
    var elements = ['count', 'first', 'last']
    elements.forEach(function(element) {
        if (null == (elm = rsm.getChild(element))) return
        data[element] = elm.getText()
        if (('first' == element) && (null != elm.attrs.index))
            data['first-index'] = elm.attrs.index
    })
    return data
}

exports.build = function(stanza, rsm) {
    if (!rsm || (typeof rsm != 'object')) return 
    var set = stanza.c('set', { xmlns: NS })
    var elements = ['max', 'after', 'before', 'index']
    elements.forEach(function(element) {
        if (typeof rsm[element] === 'undefined') return
        var elm = set.c(element)
        if (typeof rsm[element] != 'boolean') elm.t(rsm[element])
        set.up()
    })
}
