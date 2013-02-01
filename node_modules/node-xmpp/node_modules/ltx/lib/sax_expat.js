var util = require('util');
var events = require('events');
var expat = require('node-expat');

var SaxExpat = module.exports = function SaxExpat() {
    events.EventEmitter.call(this);
    this.parser = new expat.Parser('UTF-8');

    var that = this;
    this.parser.on('startElement', function(name, attrs) {
        that.emit('startElement', name, attrs);
    });
    this.parser.on('endElement', function(name) {
        that.emit('endElement', name);
    });
    this.parser.on('text', function(str) {
        that.emit('text', str);
    });
    // TODO: other events, esp. entityDecl (billion laughs!)
};
util.inherits(SaxExpat, events.EventEmitter);

SaxExpat.prototype.write = function(data) {
    if (!this.parser.parse(data, false)) {
        this.emit('error', new Error(this.parser.getError()));

        // Premature error thrown,
        // disable all functionality:
        this.write = function() { };
        this.end = function() { };
    }
};

SaxExpat.prototype.end = function(data) {
    if (!this.parser.parse('', true))
        this.emit('error', new Error(this.parser.getError()));
    else
        this.emit('end');
};
