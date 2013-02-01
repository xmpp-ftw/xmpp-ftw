var vows = require('vows'),
assert = require('assert'),
ltx = require('./../lib/index');

ltx.availableSaxParsers.forEach(function(saxParser) {
    var parse = function(s) {
        return ltx.parse(s, saxParser);
    };
    vows.describe('ltx with ' + saxParser.name).addBatch({
        'DOM parsing': {
            'simple document': function() {
                var el = parse('<root/>');
                assert.equal(el.name, 'root');
                assert.equal(0, el.children.length);
            },
            'text with commas': function() {
                var el = parse("<body>sa'sa'1'sasa</body>");
                assert.equal("sa'sa'1'sasa", el.getText());
            },
            'text with entities': function() {
                var el = parse("<body>&lt;&gt;&amp;&quot;&apos;</body>");
                assert.equal("<>&\"'", el.getText());
            },
            'attribute with entities': function() {
		var el = parse("<body title='&lt;&gt;&amp;&quot;&apos;'/>");
		assert.equal("<>&\"'", el.attrs.title);
            },
            'erroneous document raises error': function() {
                assert.throws(function() {
                    parse('<root></toor>');
                });
            },
            'incomplete document raises error': function() {
                assert.throws(function() {
                    parse('<root>');
                });
            },
            'namespace declaration': function() {
                var el = parse("<root xmlns='https://github.com/astro/ltx'/>");
                assert.equal(el.name, 'root');
                assert.equal(el.attrs.xmlns, 'https://github.com/astro/ltx');
                assert.ok(el.is('root', 'https://github.com/astro/ltx'));
            },
            'namespace declaration with prefix': function() {
                var el = parse("<x:root xmlns:x='https://github.com/astro/ltx'/>");
                assert.equal(el.name, 'x:root');
                assert.equal(el.getName(), 'root');
                assert.ok(el.is('root', 'https://github.com/astro/ltx'));
            },
	    'buffer': function() {
		var buf = new Buffer('<root/>');
		var el = parse(buf);
                assert.equal(el.name, 'root');
                assert.equal(0, el.children.length);
	    },
	    'utf-8 text': function() {
		var el = parse('<?xml version="1.0" encoding="utf-8"?><text>Möwe</text>');
                assert.equal(el.name, 'text');
                assert.equal(el.getText(), "Möwe");
	    },
	    'iso8859-1 text': function() {
		var el = parse('<?xml version="1.0" encoding="iso-8859-1"?><text>M\xF6we</text>');
                assert.equal(el.name, 'text');
                assert.equal(el.getText(), "Möwe");
	    }
        },
	'SAX parsing': {
	    'XMPP stream': function() {
		var parser = new saxParser();
		var events = [];
		parser.on('startElement', function(name) {
		    events.push({ start: name });
		});
		parser.on('endElement', function(name) {
		    events.push({ end: name });
		});
		parser.on('text', function(s) {
		    events.push({ text: s });
		});
		parser.write("<?xml version='1.0'?><stream:stream xmlns='jabber:client'");
		parser.write(" xmlns:stream='http://etherx.jabber.org/streams' id='5568");
		assert.equal(events.length, 0);
		parser.write("90365' from='jabber.ccc.de' version='1.0' xml:lang='en'><");
		assert.equal(events.length, 1);
		parser.write("stream:features><starttls xmlns='urn:ietf:params:xml:ns:x");
		assert.equal(events.length, 2);
		parser.write("mpp-tls'/><mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-");
		assert.equal(events.length, 4);
		parser.write("sasl'><mechanism>PLAIN</mechanism><mechanism>DIGEST-MD5</");
		assert.ok(events.length >= 9);
		parser.write("mechanism><mechanism>SCRAM-SHA-1</mechanism></mechanisms>");
		assert.equal(events.length, 15);
		parser.write("<register xmlns='http://jabber.org/features/iq-register'/");
		assert.equal(events.length, 15);
		parser.write("></stream:features>");
		assert.equal(events.length, 18);
	    }
	}
    }).export(module);
});
