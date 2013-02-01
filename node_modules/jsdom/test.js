"use strict";

var assert = require("assert");
var jsdom = require("./lib/jsdom");
var cssom = require("cssom");

console.log(cssom.parse(require("fs").readFileSync('test.css', 'utf-8')));

jsdom.env({
    html: '<html><head><style>' + require("fs").readFileSync('test.css') + '</style></head><body></body></html>',
    config: {
        ProcessExternalResources: ["script", "link"]
    },
    done: function (errors, window) {
        window.getComputedStyle(window.document.body);
    }
});
