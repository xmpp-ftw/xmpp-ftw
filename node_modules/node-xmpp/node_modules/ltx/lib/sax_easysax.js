var util = require('util');
var events = require('events');
var Easysax = require('easysax');

/**
 * FIXME: This SAX parser cannot be pushed to!
 */
var SaxEasysax = module.exports = function SaxEasysax() {
    events.EventEmitter.call(this);
    this.parser = new Easysax();
    var that = this;
    this.parser.on('startNode', function(name, attr, uq, str, tagend) {
	attr = attr();
	for(var k in attr)
	    if (attr.hasOwnProperty(k)) {
		attr[k] = uq(attr[k]);
	    }
        that.emit('startElement', name, attr);
    });
    this.parser.on('endNode', function(name, uq, str, tagstart) {
        that.emit('endElement', name);
    });
    this.parser.on('textNode', function(str, uq) {
        that.emit('text', uq(str));
    });
    this.parser.on('cdata', function(str) {
        that.emit('text', str);
    });
    this.parser.on('error', function(e) {
	that.emit('error', e);
    });
    // TODO: other events, esp. entityDecl (billion laughs!)
};
util.inherits(SaxEasysax, events.EventEmitter);

SaxEasysax.prototype.write = function(data) {
    if (typeof data !== 'string')
	data = data.toString();
    this.parser.parse(data);
};

SaxEasysax.prototype.end = function(data) {
    if (data)
	this.write(data);
};
