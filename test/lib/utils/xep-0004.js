var dataForm = require('../../../lib/utils/xep-0004')
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
    })
  
})
