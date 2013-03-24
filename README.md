# XMPP-FTW (For The Web/Win)

The goal of this project is to make XMPP really simple to use for developers. This module takes away all of the XML 
and works by hooking to events which are passed between client and server using a transport in JSON. In the example 
code we use socket.io, but there is no reason this can not be replaced with engine.io, or implement your own transport 
and pass in as a connection.

# Try it out...

The code is now up and running at https://xmpp-ftw.jit.su so you can try it out. Be aware that this setup is only 
for trying xmpp-ftw out an may be slow as we need to go client->nodejitsu->your XMPP server and back each time.

* https://xmpp-ftw.jit.su/manual -- XMPP-FTW manual
* https://xmpp-ftw.jit.su/demo -- Awesome new demo, generated from manual
* <del>https://xmpp-ftw.jit.su/chat</del> -- Old chat client, no longer updated

The version running on the website matches 'master' branch here and auto-deploys with commits.

# Blog posts

* http://www.evilprofessor.co.uk/562-new-demo-system-for-xmpp-ftw/
 * How the demo client works

# Build status

[![Build Status](https://secure.travis-ci.org/lloydwatkin/xmpp-ftw.png)](http://travis-ci.org/lloydwatkin/xmpp-ftw)

* npm i xmpp-ftw
* Create your socket.io connection manually and then pass this socket into the constructor
** new require('xmpp-ftw').xmpp(socket)

```javascript
io.sockets.on('connection', function(socket) {
     new xmpp.Xmpp(socket);       
});
```
* All events are prefixed with 'xmpp.'

For an example of usage and a breakdown of commands simply install the development dependencies and run the index.js file the examples directory.

* git clone https://github.com/lloydwatkin/xmpp-ftw
* npm i .
* npm run-script develop
* Go to http://localhost:3000
* See instructions on the page

Alternatively have a look at the demo client:

* ```npm run-script develop```
* Go to ```http://localhost:3000/demo```

To work on the code in 'development mode' (where process restarts as files change) run `npm run-script develop`.

# License

License is Apache 2.0, please let me know if this doesn't suit.
