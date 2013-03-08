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
