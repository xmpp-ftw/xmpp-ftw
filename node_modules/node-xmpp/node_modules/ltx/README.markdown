# Less-Than XML

* *Element:* any XML Element
* Text nodes are Strings
* Runs on node.js and browserify


## Parsing

### DOM

Parse a little document at once:

    el = ltx.parse("<document/>")

Push parser:

	p = new ltx.Parser();
	p.on('tree', function(tree) {
		proceed(null, tree);
	});
	p.on('error', function(error) {
		proceed(error);
	});

### SAX

ltx implements multiple SAX backends:

* *node-expat*: libexpat binding
* *ltx*: fast native-JavaScript parser without error handling
* *saxjs*: native-JavaScript parser

If present, they are available through
`ltx.availableSaxParsers`. Mostly, you'll want to do:

    parser = new ltx.bestSaxParser();

Refer to `lib/parse.js` for the interface.


## Element traversal

* `is(name, xmlns?)`: check
* `getName()`: name without ns prefix
* `getNS()`: element's xmlns, respects prefixes and searches upwards
* `findNS(prefix?)`: search for xmlns of a prefix upwards
* `getChild(name, xmlns?)`: find first child
* `getChildren(name, xmlns?)`: find all children
* `getChildByAttr(attr, value, xmlns?, recursive?)`: find first child by a specific attribute
* `getChildrenByAttr(attr, value, xmlns?, recursive?)`: find all children by a specific attribute
* `getText()`: appends all text nodes recursively
* `getChildText(name)`: a child's text contents
* `root()`: uppermost parent in the tree
* `up()`: parent or self


## Element attributes

* `attrs` is an object of the Element's attributes
* `name` contains optional prefix, colon, name
* `parent` points to its parent, this should always be consistent with
  children
* `children` is an Array of Strings and Elements

## Modifying XML Elements

* `new Element(name, attrs?)`: constructor
* `remove(child)`: remove child by reference
* `remove(name, xmlns)`: remove child by tag name and xmlns
* `attr(attrName, value?)`: modify or get an attribute's value
* `text(value?)`: modify or get the inner text
* `clone()`: clones an element that is detached from the document

## Building XML Elements

    el = new ltx.Element('root').
		c('children');
	el.c('child', { age: 5 }).t('Hello').up()
	  .c('child', { age: 7 }).t('Hello').up()
	  .c('child', { age: 99 }).t('Hello').up()
	console.log("Serialized document:", el.root().toString());

This resembles Strophejs a bit.

strophejs' XML Builder is very convenient for producing XMPP
stanzas. node-xmpp includes it in a much more primitive way: the
`c()`, `cnode()` and `t()` methods can be called on any *Element*
object, returning the child element.

This can be confusing: in the end, you will hold the last-added child
until you use `up()`, a getter for the parent. `Connection.send()`
first invokes `tree()` to retrieve the uppermost parent, the XMPP
stanza, before sending it out the wire.


## Destructive manipulation

Please always make sure `parent` and `children` are consistent. Don't
append children of other parents to your own element. We're not
adoption-safe!


## TODO

* More documentation
* More tests (Using [Vows](http://vowsjs.org/))

