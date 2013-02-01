var vows = require('vows'),
assert = require('assert'),
ltx = require('./../lib/index');

vows.describe('ltx').addBatch({
    'serialization': {
        'serialize an element': function() {
            var e = new ltx.Element('e');
            assert.equal(e.toString(), '<e/>');
        },
        'serialize an element with attributes': function() {
            var e = new ltx.Element('e',
                  { a1: 'foo' });
            assert.equal(e.toString(), '<e a1="foo"/>');
        },
        'serialize an element with attributes to entities': function() {
            var e = new ltx.Element('e',
                  { a1: '"well"' });
            assert.equal(e.toString(), '<e a1="&quot;well&quot;"/>');
        },
        'serialize an element with text': function() {
            var e = new ltx.Element('e').t('bar').root();
            assert.equal(e.toString(), '<e>bar</e>');
        },
        'serialize an element with text to entities': function() {
            var e = new ltx.Element('e').t('1 < 2').root();
            assert.equal(e.toString(), '<e>1 &lt; 2</e>');
        },
        'serialize an element with a number attribute': function() {
            var e = new ltx.Element('e', { a: 23 });
            assert.equal(e.toString(), '<e a="23"/>');
        },
        'serialize an element with number contents': function() {
            var e = new ltx.Element('e');
            e.c('foo').t(23);
            e.c('bar').t(0);
            assert.equal(e.toString(), '<e><foo>23</foo><bar>0</bar></e>');
        },
        'serialize with undefined attribute': function() {
            var e = new ltx.Element('e', { foo: undefined });
            assert.equal(e.toString(), '<e/>');
        },
        'serialize with null attribute': function() {
            var e = new ltx.Element('e', { foo: null });
            assert.equal(e.toString(), '<e/>');
        },
        'serialize with number attribute': function() {
            var e = new ltx.Element('e', { foo: 23, bar: 0 });
            var s = e.toString();
            assert.ok(s.match(/foo="23"/));
            assert.ok(s.match(/bar="0"/));
        },
        'serialize with undefined child': function() {
            var e = new ltx.Element('e');
            e.children = [undefined];
            assert.equal(e.toString(), '<e></e>');
        },
        'serialize with null child': function() {
            var e = new ltx.Element('e');
            e.children = [null];
            assert.equal(e.toString(), '<e></e>');
        }
    },

    'remove': {
        'by element': function() {
            var el = new ltx.Element('e').
                c('c').c('x').up().up().
                c('c2').up().
                c('c').up();
            el.remove(el.getChild('c'));
            assert.equal(el.getChildren('c').length, 1);
            assert.equal(el.getChildren('c2').length, 1);
        },
        'by name': function() {
            var el = new ltx.Element('e').
                c('c').up().
                c('c2').up().
                c('c').up();
            el.remove('c');
            assert.equal(el.getChildren('c').length, 0);
            assert.equal(el.getChildren('c2').length, 1);
        }
    },

  'clone': {
      'clones': function() {
          var orig = new ltx.Element('msg', { type: 'get' }).
              c('content').t('foo').root();
          var clone = orig.clone();
          assert.equal(clone.name, orig.name);
          assert.equal(clone.attrs.type, orig.attrs.type);
          assert.equal(clone.attrs.to, orig.attrs.to);
          assert.equal(clone.children.length, orig.children.length);
          assert.equal(clone.getChildText('content'), orig.getChildText('content'));

          assert.equal(orig.getChild('content').up(), orig);
          assert.equal(clone.getChild('content').up(), clone);
    },
    'mod attr': function() {
        var orig = new ltx.Element('msg', { type: 'get' });
        var clone = orig.clone();
        clone.attrs.type += '-result';

        assert.equal(orig.attrs.type, 'get');
        assert.equal(clone.attrs.type, 'get-result');
    },
    'rm attr': function() {
        var orig = new ltx.Element('msg', { from: 'me' });
        var clone = orig.clone();
        delete clone.attrs.from;
        clone.attrs.to = 'you';

        assert.equal(orig.attrs.from, 'me');
        assert.equal(orig.attrs.to, undefined);
        assert.equal(clone.attrs.from, undefined);
        assert.equal(clone.attrs.to, 'you');
    },
    'mod child': function() {
        var orig = new ltx.Element('msg', { type: 'get' }).
            c('content').t('foo').root();
        var clone = orig.clone();
        clone.getChild('content').t('bar').name = 'description';

        assert.equal(orig.children[0].name, 'content');
        assert.equal(orig.getChildText('content'), 'foo');
        assert.equal(clone.children[0].name, 'description');
        assert.equal(clone.getChildText('description'), 'foobar');
    }
  },

  'recursive': {
      'getChildrenByAttr': function() {
        var el = new ltx.Element('a')
            .c('b')
            .c('c', {myProperty:'x'}).t('bar').up().up().up()
            .c('d', {id: 'x'})
            .c('e', {myProperty:'x'}).root();

        var results = el.getChildrenByAttr('myProperty', 'x', null, true);
        assert.equal( results[0].toString(), '<c myProperty="x">bar</c>');
        assert.equal( results[1].toString(), '<e myProperty="x"/>');
      },
      'getChildByAttr': function() {
        var el = new ltx.Element('a')
            .c('b')
            .c('c', {id:'x'})
            .t('bar').root();
        assert.equal(el.getChildByAttr('id', 'x', null, true).toString(), '<c id="x">bar</c>');
      }
  },

  "issue #15: Inconsistency with prefixed elements": {
      topic: function() {
	  return ltx.parse('<root><x:foo>bar</x:foo></root>');
      },
      "getChildText prefixed": function(el) {
	  assert.equal(el.getChildText('x:foo'), null);
      },
      "getChildText unprefixed": function(el) {
	  assert.equal(el.getChildText('foo'), 'bar');
      },
      "getChild prefixed": function(el) {
	  assert.equal(el.getChild('x:foo'), null);
      },
      "getChild unprefixed": function(el) {
	  assert.equal(el.getChild('foo').getText(), 'bar');
      }
  }
}).export(module);
