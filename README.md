# XMPP-FTW (For The Web/Win)

[![Greenkeeper badge](https://badges.greenkeeper.io/xmpp-ftw/xmpp-ftw.svg)](https://greenkeeper.io/)

The goal of this project is to make XMPP really simple to use for developers. This module takes away all of the XML 
and works by hooking to events which are passed between client and server using a transport in JSON. In the example 
code we use socket.io, but there is no reason this can not be replaced with engine.io, or implement your own transport 
and pass in as a connection.

# Try it out...

The code is now up and running at http://xmpp-ftw.org so you can try it out. Be aware that this 
setup is only for trying xmpp-ftw out and may be slow as we need to go client ↔ heroku (east coast US) ↔  your XMPP server and back each time.

* http://xmpp-ftw.org/manual -- XMPP-FTW manual
* http://xmpp-ftw.org/demo -- Awesome demo tool, generated from manual
* <del>http://xmpp-ftw.org/chat</del> -- Old chat client, no longer updated

The version running on the website matches 'master' branch here and auto-deploys with commits.

Also check out the [xmpp-ftw-demo](https://github.com/xmpp-ftw/xmpp-ftw-demo) repository which is what http://xmpp-ftw.org is running.

# Blog posts/Talks

* http://blog.superfeedr.com/easy-xmpp-ftw/
 * XMPP-FTW XMPP and JSON for the Web
* http://www.evilprofessor.co.uk/615-xmpp-ftw-now-supports-superfeedr/
 * XMPP-FTW now supports [SuperFeedr](http://www.superfeedr.com)
* http://www.evilprofessor.co.uk/573-talking-at-the-first-xmppuk-event-march-2013/
 * Talking at the first XMPPUK event (March 2013) 
* http://www.evilprofessor.co.uk/562-new-demo-system-for-xmpp-ftw/
 * How the demo client works
* http://www.evilprofessor.co.uk/579-xmpp-for-the-web-xmpp-ftw/
 * Introduction to XMPP-FTW

# Badges!

[![Build Status](https://secure.travis-ci.org/xmpp-ftw/xmpp-ftw.png)](http://travis-ci.org/xmpp-ftw/xmpp-ftw)

[![Dependency Status](https://david-dm.org/xmpp-ftw/xmpp-ftw.png)](https://david-dm.org/xmpp-ftw/xmpp-ftw)

[![Coverage Status](https://coveralls.io/repos/xmpp-ftw/xmpp-ftw/badge.png?branch=master)](https://coveralls.io/r/xmpp-ftw/xmpp-ftw?branch=master)

[![Known Vulnerabilities](https://snyk.io/test/npm/xmpp-ftw/badge.svg)](https://snyk.io/test/npm/xmpp-ftw)

# Instructions

* npm i xmpp-ftw
* Create your socket.io connection manually and then pass this socket into the constructor

```javascript
io.sockets.on('connection', function(socket) {
     new require('xmpp-ftw').Xmpp(socket);       
});
```
* All events are prefixed with 'xmpp.'

# Logging

Logging is handled using a [Winston](https://github.com/flatiron/winston) like interface but by default 
does not record any logging (uses a null logger). Developers can inject any logging platform they wish 
provided it uses the same interface as Winston. In order to inject a logger simply call `setLogger` on 
the main XMPP-FTW object after instantiation.

Methods used in XMPP-FTW projects are:

* log()
* warn()
* info()
* error()

# Server-side

If you want to run xmpp-ftw server side (e.g. to write a bot) then this should be a good starting point:

```javascript
var xmppFtw = require('xmpp-ftw')
var Emitter = require('events').EventEmitter

var Socket = function() {
    this.server = new Emitter()
    this.client = new Emitter()
    var self = this
    this.server.send = function(event, data, rsm, callback) {
        self.client.emit(event, data, rsm, callback)
    }
    this.client.send = function(event, data, callback) {
        self.server.emit(event, data, callback)
    }
}
Socket.prototype.on = function(event, data, rsm) {
    this.server.on(event, data, rsm)
}
Socket.prototype.send = function(event, data, callback) {
    this.server.send(event, data, callback)
}
Socket.prototype.removeAllListeners = function(event) {
    this.server.removeAllListeners(event)
}

var socket = new Socket()
var client = new xmppFtw.Xmpp(socket)
socket.client.on('xmpp.connection', function (data) {
    console.log('Connected', data)
})
socket.client.on('xmpp.error', function (error) {
    console.log('error', error)
})
socket.client.on('xmpp.error.client', function (error) {
    console.log('client error', error)
})
socket.client.send('xmpp.login', { login: 'detiails', here: true })
socket.client.send(
    'xmpp.chat.message',
    {
        to: 'aother@user.com',
        content: 'Hello world'
    },
    function (error, data) { console.log(error, data) }
)
```

# License

License is Apache 2.0, please let me know if this doesn't suit.

# See also...

* Strophe http://strophe.im/
* Stanza.io https://github.com/legastero/stanza.io
