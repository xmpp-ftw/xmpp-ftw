var NS = 'jabber:x:data'

exports.parseForm = function(stanza) {
    var data   = {}
    var title  = stanza.getChild('title')
    if (title) data.title = title.getText()
    var instructions = stanza.getChild('instructions')
    if (instructions) data.instructions = instructions.getText()
    data.form = parseFields(stanza.getChild('query').getChild('x'))
    return data
}

var parseFields = exports.parseFields = function(stanza) {
    var fields = { fields: [] }
    var title  = stanza.getChild('title')
    if (title) fields.title = title.getText()
    var instructions = stanza.getChild('instructions')
    if (instructions) fields.instructions = instructions.getText()
    stanza.getChildren('field').forEach(function(element) {
        if ('FORM_TYPE' == element.attrs.type) return
        var field = {
            var:      element.attrs.var,
            type:     element.attrs.type,
            required: (element.getChild('required')) ? true : false,
        }
        var value = element.getChild('value')
        if (value) field.value = _getValues(value, element.attrs.type)
        if (element.attrs.label) field.label = element.attrs.label
        if ((options = element.getChildren('option')).length > 0) field.options = _getOptions(options)
        if (description = element.getChild('desc')) field.description = description.getText()
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

var _getValues = function(values, type) {
    switch (type) {
        case 'boolean':
            return values.getText() == true
        case 'list-multi':
            var multi = []
            values.forEach(function(value) {
                multi.push(value.getText())
            })
            return multi
    }
    return values.getText()
}

exports.addForm = function(stanza, fields, type) {
    var s = stanza.c('x', { xmlns: NS, type: 'submit' })
        .c('field', { type: 'hidden', var: 'FORM_TYPE' })
        .c('value')
        .t(type)
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
    return stanza
}

var _parseValues = function(value) {
    var type = typeof value
    switch (type.toLowerCase()) {
        case 'boolean':
            return (true == value) ? ['true'] : ['false']
        case 'string':
            return [value]
        case 'object':
            return value
    }
    return [value]
}
