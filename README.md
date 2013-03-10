# XMPP-FTW (For The Web/Win)

## Current progress

```Note:``` I've started a rewrite to get the code closer to my idea of how it should work. 
I'll attempt to keep this readme up to date as I progress. Currently....

- <del>login works</del>
- <del>chat send/receive is working</del> -- to revisit later
- <del>Updating the example chat client to work for basic chat and 'status'</del>
- <del>Get basic presence working again</del>
- <del>Roster</del>
- <del>Hosted for people to experiment</del>
- <del>Add MUC (xep-0045)</del>
- <del>New demo system (chat client to be retired)</del>
- <del>More advanced xep-0004 support (e.g. multi-select, etc)</del>
- Document xep-0004 
- Client errors
- Logout
- Better chat implementation
- Rich chat messages (xep-0071)
- Chat status notifications (xep-0085)
- Implement pubsub (xep-0060+ )
- ```Write unit tests, start TDD``` -- all this code is crap without tests!

## ...and back to main readme

The goal of this project is to make XMPP really simple to use for developers. This module takes away all of the XML and works by hooking to events which are passed between client and server using socket.io in JSON.

# Try it out...

The code is now up and running at https://xmpp-ftw.jit.su so you can try it out. Be aware that this setup is only for trying xmpp-ftw out
 an may be slow as we need to go client->nodejitsu->your XMPP server and back each time.

* https://xmpp-ftw.jit.su/manual -- XMPP-FTW manual
* https://xmpp-ftw.jit.su/demo -- Awesome new demo, generated from manual
* https://xmpp-ftw.jit.su/chat -- Old chat client, no longer updated

The version running on the website matches 'master' branch here and auto-deploys with commits.

# Blog posts

* http://www.evilprofessor.co.uk/562-new-demo-system-for-xmpp-ftw/
 * How the demo client works

# Build status

[![Build Status](https://secure.travis-ci.org/lloydwatkin/xmpp-ftw.png)](http://travis-ci.org/lloydwatkin/xmpp-ftw)

``` Note package doesn't exist yet! ```

* npm i xmpp-ftw
* require('xmpp-ftw')
* Create your socket.io connection manually and then pass this socket into the constructor

```javascript
var io = xmpp.init(server); /* express-type server */
io.sockets.on('connection', function(socket) {
     new xmpp.Xmpp(socket);       
});
```
* All events are prefixed with 'xmpp.'

For an example of usage and a breakdown of commands simply install the development dependencies and run the index.js file the examples directory.

* git clone https://github.com/lloydwatkin/xmpp-ftw
* npm i .
* node index
* Go to http://localhost:3000
* See instructions on the page

Alternatively have a look at the example chat client:

* ```node index```
* Go to ```http://localhost:3000/chat```

To work on the code in 'development mode' (where process restarts as files change) run `npm run-script develop`.
