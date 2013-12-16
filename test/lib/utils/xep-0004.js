var dataForm = require('../../../index').utils['xep-0004']
  , should   = require('should')
  , helper   = require('../../helper')
  , ltx      = require('ltx')

describe('XEP-0004', function() {

    it('Should export the data form namespace', function() {
        dataForm.NS.should.equal('jabber:x:data')
    })

    describe('Add a data form to a stanza', function() {

        var stanza

        beforeEach(function() {
            stanza = new ltx.Element('iq')
        })

        it('Can add an empty data form', function() {
            dataForm.addForm(stanza, [], 'some-data-form')
            var x = stanza.getChild('x', dataForm.NS)
            x.attrs.type.should.equal('submit')
            var field = x.getChild('field')
            field.attrs.var.should.equal('FORM_TYPE')
            field.attrs.type.should.equal('hidden')
            field.getChild('value').getText().should.equal('some-data-form')
            x.getChildren('field').length.should.equal(1)
        })

        it('Can add field with boolean value', function() {
            dataForm.addForm(stanza, [{ var: 'field1', value: true }], 'df')
            var field = stanza.getChild('x').getChildren('field')[1]
            field.attrs.var.should.equal('field1')
            field.getChild('value').getText().should.equal('true')
        })

        it('Can add a string value', function() {
            dataForm.addForm(stanza, [{ var: 'field2', value: 'hello' }], 'df')
            var field = stanza.getChild('x').getChildren('field')[1]
            field.attrs.var.should.equal('field2')
            field.getChild('value').getText().should.equal('hello')
        })

        it('Can add a number value', function() {
            dataForm.addForm(stanza, [{ var: 'field3', value: 222 }], 'df')
            var field = stanza.getChild('x').getChildren('field')[1]
            field.attrs.var.should.equal('field3')
            field.getChild('value').getText().should.equal('222')
        })

        it('Can add an array of values', function() {
            dataForm.addForm(
                stanza,
                [{ var: 'field4', value: [ 'hello', 'world' ] }],
                'df'
            )
            var field = stanza.getChild('x').getChildren('field')[1]
            field.attrs.var.should.equal('field4')
            field.getChildren('value').length.should.equal(2)
            var values = field.getChildren('value')
            values[0].getText().should.equal('hello')
            values[1].getText().should.equal('world')
        })

        it('Can change form type', function() {
            dataForm.addForm(
                stanza,
                [{ var: 'field4', value: [ 'hello', 'world' ] }],
                'df',
                'form'
            )
            stanza.getChild('x').attrs.type.should.equal('form')
        })

        it('Can add a field with additional attributes', function() {
            dataForm.addForm(
                stanza,
                [{
                    var: 'muc#role',
                    value: 'participant',
                    label: 'Requested role',
                    type: 'text-single'
                }],
                'df'
            )
            var field = stanza.getChild('x').getChildren('field')[1]
            field.attrs.type.should.equal('text-single')
            field.attrs.label.should.equal('Requested role')
        })
    })

    describe('Can parse data form from details', function() {

        var stanza

        beforeEach(function() {
            stanza = helper.getStanza('xep-0004/empty-form')
        })

        it('Can parse empty data form', function() {
            var form = dataForm.parseFields(stanza)
            form.title.should.equal('form-title')
            form.instructions.should.equal('form-instructions')
            should.exist(form.fields)
        })

        it('Does not add \'FORM_TYPE\' fields', function() {
            stanza.c('field', { var: 'FORM_TYPE' })
            var form = dataForm.parseFields(stanza)
            form.fields.length.should.equal(0)
        })

        it('Can parse a very basic form field', function() {
            stanza.c('field', { type: 'text-single', var: 'field1' })
            var form = dataForm.parseFields(stanza)
            form.fields.length.should.equal(1)
            form.fields[0].var.should.equal('field1')
            form.fields[0].type.should.equal('text-single')
            form.fields[0].required.should.equal.false
        })

        it('Can parse basic form field', function() {
            var stanza = helper.getStanza('xep-0004/single-basic-field')
            var form = dataForm.parseFields(stanza)
            form.fields.length.should.equal(1)
            form.fields[0].var.should.equal('field1')
            form.fields[0].type.should.equal('text-single')
            form.fields[0].required.should.equal.true
            form.fields[0].description.should.equal('field1-description')
            form.fields[0].value.should.equal('value1')
            form.fields[0].label.should.equal('label1')
        })

        it('Can parse multi-select field', function() {
            var stanza = helper.getStanza('xep-0004/multi-select-field')
            var form = dataForm.parseFields(stanza)
            form.fields.length.should.equal(1)
            form.fields[0].var.should.equal('field1')
            form.fields[0].type.should.equal('list-multi')
            form.fields[0].required.should.equal.true
            form.fields[0].description.should.equal('field1-description')
            form.fields[0].label.should.equal('label1')
            form.fields[0].options.length.should.equal(3)
            form.fields[0].options[0].should.eql(
               { label: 'label3', value: 'value3' }
            )
            form.fields[0].value.length.should.equal(2)
            form.fields[0].value[0].should.equal('value1')
            form.fields[0].value[1].should.equal('value2')
        })

        it('Can parse a boolean field', function() {
            stanza.c('field', { type: 'boolean', var: 'field1' })
                .c('value').t('true')
            var form = dataForm.parseFields(stanza)
            form.fields.length.should.equal(1)
            form.fields[0].var.should.equal('field1')
            form.fields[0].type.should.equal('boolean')
            form.fields[0].required.should.equal.true
        })

        it('Can handle \'fixed\' field', function() {
            var number = 555
            var stanza = ltx.parse('<field type="fixed" var="field1">' +
                '<value>' + number + '</value>' +
                '</field>')
            var value = dataForm.getValues(stanza, 'fixed')
            value.should.equal(number)
        })

        it('Can handle XML field - NOTE: non-standard', function() {
            var xml = '<entry><item><content>Some content</content></item></entry>'
            var stanza = ltx.parse('<field type="xml" var="field1">' +
                '<value>' + xml + '</value>' +
                '</field>')
            var value = dataForm.getValues(stanza, 'xml')
            value.should.equal(xml)
        })
    })
})
