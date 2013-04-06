var $  = require('jQuery')
var NS = 'jabber:x:data'

exports.parseForm = function(stanza) {
    if (typeof(stanza) != 'string') stanza = stanza.toString()
    var data   = {}
    var parsed = $(stanza)
    var title  = parsed.find('title')
    if (0 != title.length) data.title = title.text()
    var instructions = parsed.find('instructions')
    if (0 != instructions.length) data.instructions = instructions.text()
    data.form = parseFields(parsed.find('x'))
    return data
}

var parseFields = function(stanza) {
    var fields = { fields: [] }
    var title  = stanza.find('title')
    if (0 != title.length) fields.title = title.text()
    var instructions = stanza.find('instructions')
    if (0 != instructions.length) fields.instructions = instructions.text()
    stanza.find('field').each(function() {
        var element = $(this)
        if ('FORM_VAR' == element.attr('type')) return
        var field = {
            var:      element.attr('var'),
            type:     element.attr('type'),
            required: (1 == element.find('required').length) ? true : false,
            value:    _getValues(element.find('> value'), element.attr('type'))
        }
        if (element.attr('label')) field.label = element.attr('label')
        if ((options = element.find('> option')).length != 0) field.options = _getOptions(options)
        if ((description = element.find('> desc')).length != 0) field.description = description
        fields.fields.push(field)
    })
    return fields
}

var _getOptions = function(element) {
    var options = [] 
    $(element).each(function(i, value) {
        var option = { value: $(value).find('value').text() }
        var label  = $(value).attr('label')
        if (label) option.label = label
        options.push(option)
    })
    return options    
}

var _getValues = function(values, type) {
    switch (type) {
        case 'boolean':
            return values.text() == true
        case 'list-multi':
            var multi = []
            values.each(function(i, value) {
                multi.push($(value).text())
            })
            return multi   
    }
    return values.text()
}

exports.addForm = function(stanza, fields, type) {
    var s = stanza.c('x', { xmlns: NS, type: 'submit' })
        .c('field', { type: 'hidden', var: 'FORM_TYPE' })
        .c('value')
        .t(type)
        .up()
        .up()

    fields.forEach(function(field) {
        var f      = s.c('field', { var: field.field })
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
