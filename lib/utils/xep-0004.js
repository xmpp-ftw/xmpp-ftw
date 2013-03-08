exports.parseForm = function(stanza) {
	var data   = {}
	var parsed = jQuery(stanza)
	var title  = parsed.find('title')
    if (0 != title.length) data.title = title[0].text()
    var instructions = parsed.find('query > instructions')
	if (0 != instructions.length) data.instructions = instructions[0].text()
	data.form = this._parseFields(parsed.find('x[xmlns=' + this.NS_DATA + ']'))
	return data
}

exports.parseFields = function(stanza) {
	var fields = { fields: [] }
	var title  = stanza.find('title')
	if (0 != title.length) fields.title = title[0].text()
	var instructions = stanza.find('instructions')
	if (0 != instructions.length) fields.instructions = instructions[0].text()
	stanza.find('field').forEach(function(element) {
		var field = {
			var:      element.attr('var'),
			type:     element.attr('type'),
			required: (1 == element.find('required').length) ? true : false,
			value:    element.find('value').text(),
		}
		if (element.attr('label')) field.label = element.attr('label')
		fields.fields.push(field)
	})
	return fields
}