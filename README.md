# XMPP-FTW (For The Web/Win)

The goal of this project is to make XMPP really simple to use for developers. This module takes away all of the XML 
and works by hooking to events which are passed between client and server using a transport in JSON. In the example 
code we use socket.io, but there is no reason this can not be replaced with engine.io, or implement your own transport 
and pass in as a connection.

# Try it out...

The code is now up and running at https://xmpp-ftw.jit.su so you can try it out. Be aware that this 
setup is only for trying xmpp-ftw out and may be slow as we need to go client ↔ nodejitsu (east coast US) ↔  your XMPP server and back each time.

* https://xmpp-ftw.jit.su/manual -- XMPP-FTW manual
* https://xmpp-ftw.jit.su/demo -- Awesome demo tool, generated from manual
* <del>https://xmpp-ftw.jit.su/chat</del> -- Old chat client, no longer updated

The version running on the website matches 'master' branch here and auto-deploys with commits.

Also check out the [xmpp-ftw-demo](https://github.com/xmpp-ftw/xmpp-ftw-demo) repository which is what https://xmpp-ftw.jit.su is running.

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

# Build status

[![Build Status](https://secure.travis-ci.org/xmpp-ftw/xmpp-ftw.png)](http://travis-ci.org/xmpp-ftw/xmpp-ftw)

# Dependency status

[![Dependency Status](https://david-dm.org/xmpp-ftw/xmpp-ftw.png)](https://david-dm.org/xmpp-ftw/xmpp-ftw)

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

```
var xmppFtw = require('xmpp-ftw')
  , Emitter = require('events').EventEmitter

var socket = new Emitter()
socket.send = socket.emit

var client = new xmppFtw.Xmpp(socket)
socket.on('xmpp.connection', function(data) {
    console.log('Conected', data)
})
socket.on('xmpp.error', function(error) {
    console.log('error', error)
})
socket.on('xmpp.error.client', function(error) {
    console.log('client error', error)
})
socket.send('xmpp.login', { login: details, here: true })
```

# License

License is Apache 2.0, please let me know if this doesn't suit.

# See also...

* Strophe http://strophe.im/
* Stanza.io https://github.com/legastero/stanza.io


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/xmpp-ftw/xmpp-ftw/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

