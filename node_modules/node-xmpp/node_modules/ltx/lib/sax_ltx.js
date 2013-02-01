var util = require('util');
var events = require('events');

const STATE_TEXT = 0,
    STATE_IGNORE_TAG = 1,
    STATE_TAG_NAME = 2,
    STATE_TAG = 3,
    STATE_ATTR_NAME = 4,
    STATE_ATTR_EQ = 5,
    STATE_ATTR_QUOT = 6,
    STATE_ATTR_VALUE = 7;

var RE_TAG_NAME = /^[^\s\/>]+$/,
    RE_ATTR_NAME = /^[^\s=]+$/;

var SaxLtx = module.exports = function SaxLtx() {
    events.EventEmitter.call(this);

    var state = STATE_TEXT, remainder;
    var tagName, attrs, endTag, selfClosing, attrQuote;
    var recordStart = 0;

    this.write = function(data) {
	if (typeof data !== 'string')
	    data = data.toString();
	var pos = 0;

	/* Anything from previous write()? */
	if (remainder) {
	    data = remainder + data;
	    pos += remainder.length;
	    delete remainder;
	}

	function endRecording() {
	    if (typeof recordStart === 'number') {
		var recorded = data.slice(recordStart, pos);
		recordStart = undefined;
		return recorded;
	    }
	}

	for(; pos < data.length; pos++) {
	    var c = data.charCodeAt(pos);
	    //console.log("state", state, "c", c, data[pos]);
	    switch(state) {
	    case STATE_TEXT:
		if (c === 60 /* < */) {
		    var text = endRecording();
		    if (text)
			this.emit('text', unescapeXml(text));
		    state = STATE_TAG_NAME;
		    recordStart = pos + 1;
		    attrs = {};
		}
		break;
	    case STATE_TAG_NAME:
		if (c === 47 /* / */ && recordStart === pos) {
		    recordStart = pos + 1;
		    endTag = true;
		} else if (c === 33 /* ! */ || c === 63 /* ? */) {
		    recordStart = undefined;
		    state = STATE_IGNORE_TAG;
		} else if (c <= 32 || c === 47 /* / */ || c === 62 /* > */) {
		    tagName = endRecording();
		    pos--;
		    state = STATE_TAG;
		}
		break;
	    case STATE_IGNORE_TAG:
		if (c === 62 /* > */) {
		    state = STATE_TEXT;
		}
		break;
	    case STATE_TAG:
		if (c === 62 /* > */) {
		    if (!endTag) {
			this.emit('startElement', tagName, attrs);
			if (selfClosing)
			    this.emit('endElement', tagName);
		    } else
			this.emit('endElement', tagName);
		    tagName = undefined;
		    attrs = undefined;
		    endTag = undefined;
		    selfClosing = undefined;
		    state = STATE_TEXT;
		    recordStart = pos + 1;
		} else if (c === 47 /* / */) {
		    selfClosing = true;
		} else if (c > 32) {
		    recordStart = pos;
		    state = STATE_ATTR_NAME;
		}
		break;
	    case STATE_ATTR_NAME:
		if (c <= 32 || c === 61 /* = */) {
		    attrName = endRecording();
		    pos--;
		    state = STATE_ATTR_EQ;
		}
		break;
	    case STATE_ATTR_EQ:
		if (c === 61 /* = */) {
		    state = STATE_ATTR_QUOT;
		}
		break;
	    case STATE_ATTR_QUOT:
		if (c === 34 /* " */ || c === 39 /* ' */) {
		    attrQuote = c;
		    state = STATE_ATTR_VALUE;
		    recordStart = pos + 1;
		}
		break;
	    case STATE_ATTR_VALUE:
		if (c === attrQuote) {
		    var value = unescapeXml(endRecording());
		    attrs[attrName] = value;
		    attrName = undefined;
		    state = STATE_TAG;
		}
		break;
	    }
	}

	if (typeof recordStart === 'number' &&
	    recordStart <= data.length) {

	    remainder = data.slice(recordStart);
	    recordStart = 0;
	}
    };

    /*var origEmit = this.emit;
    this.emit = function() {
	console.log('ltx', arguments);
	origEmit.apply(this, arguments);
    };*/
};
util.inherits(SaxLtx, events.EventEmitter);


SaxLtx.prototype.end = function(data) {
    if (data)
	this.write(data);

    /* Uh, yeah */
    this.write = function() {
    };
};

function unescapeXml(s) {
    return s.
        replace(/\&amp;/g, '&').
        replace(/\&lt;/g, '<').
        replace(/\&gt;/g, '>').
        replace(/\&quot;/g, '"').
        replace(/\&apos;/g, '\'');
}
