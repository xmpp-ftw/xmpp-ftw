var browserify = require('browserify');
var path = require('path');
var b = browserify({
    debug: true
});
var root = path.join(__dirname, "..");
b.require("./lib/index-browserify.js",
    { root: root, basedir: root });
b.alias("ltx", "./lib/index-browserify.js");
b.addEntry('benchmark.js');

var fs = require('fs');

fs.writeFileSync('index.js', b.bundle());
