# xmpp-websockets-json

The goal of this project is to make XMPP really simple to use for developers. This module takes away all of the XML and works by hooking to events hich are passed between client and server using socket.io in JSON.

* npm i easy-xmpp
* require('easy-xmpp')
* Create your socket.io connection manually and then pass this socket into the constructor
* All events are prefixed with 'xmpp.'

For an example of usage and a breakdown of commands simply install the development dependencies and run the index.js file the examples directory.

* git clone https://github.com/lloydwatkin/xmpp-websockets-json
* npm i .
* node server
* Go to http://localhost:3000
* See instructions on the page
