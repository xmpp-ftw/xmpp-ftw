/* @flow */
'use strict'

const NS = exports.NS = 'jabber:x:data'

const _parseValues = (value) => {
  const type = typeof value
  switch (type.toLowerCase()) {
    case 'boolean':
      return (value === true) ? [ 'true' ] : [ 'false' ]
    case 'number':
      return [ '' + value ]
    case 'object':
      return value
    default:
    case 'string':
      return [ value ]
  }
}

const getValues = exports.getValues = (element, type) => {
  switch (type) {
    case 'boolean':
      return ((element.getChildText('value') === 'true') ||
                (parseInt(element.getChildText('value'), 10) === 1))
    case 'list-multi':
    case 'jid-multi':
    case 'text-multi':
      const multi = []
      element.getChildren('value').forEach((value) => multi.push(value.getText()))
      return multi
    case 'fixed':
      return parseInt(element.getChildText('value'), 10)
    case 'xml':
      return element.getChild('value').children.toString()
  }
  return element.getChild('value').getText()
}

const _getOptions = (element) => {
  const options = []
  element.forEach(function (value) {
    const option = { value: value.getChild('value').getText() }
    const label = value.attrs.label
    if (label) {
      option.label = label
    }
    options.push(option)
  })
  return options
}

const parseFormField = (element) => {
  if (element.attrs.var === 'FORM_TYPE') {
    return false
  }
  const field = { var: element.attrs.var }
  if (element.attrs.type) {
    field.type = element.attrs.type
  }
  if (element.getChild('required')) {
    field.required = Boolean(element.getChild('required'))
  }
  const options = element.getChildren('option')
  const description = element.getChild('desc')
  if (element.getChild('value')) {
    field.value = getValues(element, element.attrs.type)
  }
  if (element.attrs.label) field.label = element.attrs.label
  if ((options).length > 0) {
    field.options = _getOptions(options)
  }
  if (description) {
    field.description = description.getText()
  }
  return field
}

const parseFormFields = (x, fields) => {
  x.getChildren('field').forEach((element) => {
    const field = parseFormField(element)
    if (field) {
      fields.push(field)
    }
  })
}

exports.parseFields = (x) => {
  const fields = {}
  const title = x.getChild('title')
  if (title) {
    fields.title = title.getText()
  }
  const instructions = x.getChild('instructions')
  if (instructions) {
    fields.instructions = instructions.getText()
  }
  if (x.getChildren('field').length > 0) {
    fields.fields = []
    parseFormFields(x, fields.fields)
  }
  if (x.getChild('reported')) {
    fields.reported = []
    parseFormFields(x.getChild('reported'), fields.reported)
  }
  if (x.getChildren('item')) {
    fields.items = []
    x.getChildren('item').forEach((item) => {
      const itemFields = []
      parseFormFields(item, itemFields)
      fields.items.push(itemFields)
    })
  }
  return fields
}

exports.addForm = (stanza, fields, value, type) => {
  const s = stanza.c('x', { xmlns: NS, type: (type || 'submit') })
  if (value) {
    s.c('field', { type: 'hidden', var: 'FORM_TYPE' })
      .c('value')
      .t(value)
  }
  fields.forEach((field) => {
    const attributes = { var: field.var }
    if (field.label) attributes.label = field.label
    if (field.type) attributes.type = field.type
    const f = s.c('field', attributes)
    const values = _parseValues(field.value)
    values.forEach(function (value) {
      f.c('value').t(value).up()
    })
    s.up()
  })
}
