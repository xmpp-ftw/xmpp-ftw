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
			value:    getValues(element.find('value'), element.attr('type'))
		}
		if (element.attr('label')) field.label = element.attr('label')
		fields.fields.push(field)
	})
	return fields
}

var getValues = function(values, type) {
	switch (type) {
		case 'boolean':
		    return values.text() == true
		case 'list-single':
		case 'list-multi':
		case 'jid-multi':
		    var options = [] 
		    $(values).each(function(i, value) {
		    	options.push($(value).text())
		    })
		    return options
		    
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
		var values = parseValues(field.value)
		for (var index in values) {
			f.c('value').t(values[index]).up()
		}
        s.up()
	})
	return stanza
}

var parseValues = function(value) {
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
