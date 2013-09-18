var NS = exports.NS = 'jabber:x:data'

exports.parseFields = function(x) {
    var fields = { fields: [] }
    var title  = x.getChild('title')
    if (title) fields.title = title.getText()
    var instructions = x.getChild('instructions')
    if (instructions) fields.instructions = instructions.getText()
    x.getChildren('field').forEach(function(element) {
        if ('FORM_TYPE' == element.attrs.var) return
        var field = {
            var:      element.attrs.var,
            type:     element.attrs.type,
            required: (element.getChild('required')) ? true : false,
        }
        var options, description
        if (element.getChild('value'))
            field.value = getValues(element, element.attrs.type)
        if (element.attrs.label) field.label = element.attrs.label
        if ((options = element.getChildren('option')).length > 0)
            field.options = _getOptions(options)
        if (!!(description = element.getChild('desc')))
            field.description = description.getText()
        fields.fields.push(field)
    })
    return fields
}

var _getOptions = function(element) {
    var options = []
    element.forEach(function(value) {
        var option = { value: value.getChild('value').getText() }
        var label  = value.attrs.label
        if (label) option.label = label
        options.push(option)
    })
    return options
}

var getValues = exports.getValues = function(element, type) {
    switch (type) {
        case 'boolean':
            return ((element.getChildText('value') == 'true') ||
                (1 === element.getChildText('value')))
        case 'list-multi':
        case 'jid-multi':
        case 'text-multi':
            var multi = []
            element.getChildren('value').forEach(function(value) {
                multi.push(value.getText())
            })
            return multi
        case 'fixed':
            return parseInt(element.getChildText('value'))
        case 'xml':
            return element.getChild('value').children.toString()
    }
    return element.getChild('value').getText()
}

exports.addForm = function(stanza, fields, value, type) {
    var s = stanza.c('x', { xmlns: NS, type: (type || 'submit') })
        .c('field', { type: 'hidden', var: 'FORM_TYPE' })
        .c('value')
        .t(value)
        .up()
        .up()

    fields.forEach(function(field) {
        var f      = s.c('field', { var: field.var })
        var values = _parseValues(field.value)
        for (var index in values) {
            f.c('value').t(values[index]).up()
        }
        s.up()
    })
}

var _parseValues = function(value) {
    var type = typeof value
    switch (type.toLowerCase()) {
        case 'boolean':
            return (true === value) ? ['true'] : ['false']
        case 'string':
            return [value]
        case 'number':
            return ['' + value ]
        case 'object':
            return value
    }
    return [value]
}
