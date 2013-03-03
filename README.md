# xmpp-websockets-json

## Current progress

```Note:``` I've started a rewrite to get the code closer to my idea of how it should work. 
I'll attempt to keep this readme up to date as I progress. Currently....

- <del>login works</del>
- <del>chat send/receive is working</del> -- to revisit later
- <del>Updating the example chat client to work for basic chat and 'status'</del>
- <del>Get basic presence working again</del>
- <del>Roster</del>
- <del>Hosted for people to experiment</del>
- Add MUC (xep-0045)   *** Currently adding, not stable ***
- Logout
- Better chat implementation
- Rich chat messages (xep-0071)
- Chat status notifications (xep-0085)
- Implement pubsub (xep-0060+ )

## ...and back to main readme

The goal of this project is to make XMPP really simple to use for developers. This module takes away all of the XML and works by hooking to events hich are passed between client and server using socket.io in JSON.

# Try it out...

The code is now up and running at https://xmpp-websocket-json.jit.su so you can try it out. Be aware that this setup is only for trying xmpp-websockets-json out
 an may be slow as we need to go client->nodejitsu->your XMPP server and back each time.

The site root is a short manual which I will add to as new code is added, navigate to /chat to see an in progress chat client.

The version running on the website matches 'master' branch here and auto-deploys with commits.

# Build status

[![Build Status](https://secure.travis-ci.org/lloydwatkin/xmpp-websockets-json.png)](http://travis-ci.org/lloydwatkin/xmpp-websockets-json)

``` Note package doesn't exist yet! ```

* npm i easy-xmpp
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

* git clone https://github.com/lloydwatkin/xmpp-websockets-json
* npm i .
* node index
* Go to http://localhost:3000
* See instructions on the page

Alternatively have a look at the example chat client:

* ```node index```
* Go to ```http://localhost:3000/chat```
