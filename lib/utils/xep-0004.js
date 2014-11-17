'use strict';

var NS = exports.NS = 'jabber:x:data'

var _parseValues = function(value) {
    var type = typeof value
    switch (type.toLowerCase()) {
        case 'boolean':
            return (true === value) ? ['true'] : ['false']
        case 'number':
            return ['' + value ]
        case 'object':
            return value
        default:
        case 'string':
            return [value]
    }
}

var getValues = exports.getValues = function(element, type) {
    switch (type) {
        case 'boolean':
            return ((element.getChildText('value') === 'true') ||
                (1 === parseInt(element.getChildText('value'))))
        case 'list-multi':
        case 'jid-multi':
        case 'text-multi':
            var multi = []
            element.getChildren('value').forEach(function(value) {
                multi.push(value.getText())
            })
            return multi
        case 'fixed':
            return parseInt(element.getChildText('value'), 10)
        case 'xml':
            return element.getChild('value').children.toString()
    }
    return element.getChild('value').getText()
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

var parseFormField = function(element) {
    if ('FORM_TYPE' === element.attrs.var) return false
    var field = { var: element.attrs.var }
    if (element.attrs.type) field.type = element.attrs.type
    if (element.getChild('required')) {
        field.required = (element.getChild('required')) ? true : false
    }
    var options, description
    if (element.getChild('value'))
        field.value = getValues(element, element.attrs.type)
    if (element.attrs.label) field.label = element.attrs.label
    if ((options = element.getChildren('option')).length > 0)
        field.options = _getOptions(options)
    if (!!(description = element.getChild('desc')))
        field.description = description.getText()
    return field
}

var parseFormFields = function(x, fields) {
    x.getChildren('field').forEach(function(element) {
        var field = parseFormField(element)
        if (field) fields.push(field)
    })
}

exports.parseFields = function(x) {
    var fields = {}
    var title  = x.getChild('title')
    if (title) fields.title = title.getText()
    var instructions = x.getChild('instructions')
    if (instructions) fields.instructions = instructions.getText()
    if (x.getChildren('field').length > 0) {
        fields.fields = []
        parseFormFields(x, fields.fields)
    }
    if (x.getChild('reported')) {
        fields.reported = []
        parseFormFields(
            x.getChild('reported'), fields.reported
        )
    }
    if (x.getChildren('item')) {
        fields.items = []
        x.getChildren('item').forEach(function(item) {
            var itemFields = []
            parseFormFields(item, itemFields)
            fields.items.push(itemFields)
        })
    }
    return fields
}

exports.addForm = function(stanza, fields, value, type) {
    var s = stanza.c('x', { xmlns: NS, type: (type || 'submit') })
    if (value) {
        s.c('field', { type: 'hidden', var: 'FORM_TYPE' })
            .c('value')
            .t(value)
    }
    fields.forEach(function(field) {
        var attributes = { var: field.var }
        if (field.label) attributes.label = field.label
        if (field.type) attributes.type = field.type
        var f      = s.c('field', attributes)
        var values = _parseValues(field.value)
        for (var index in values) {
            f.c('value').t(values[index]).up()
        }
        s.up()
    })
}
