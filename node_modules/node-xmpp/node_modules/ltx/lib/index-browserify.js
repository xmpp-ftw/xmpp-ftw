/* Cause browserify to bundle SAX parsers: */
//require('./sax_easysax');
//require('./sax_saxjs');
require('./sax_ltx');

/* SHIM */
module.exports = require('./index');