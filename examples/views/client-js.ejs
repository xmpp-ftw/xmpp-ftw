window.onload = function() {
    socket = io.connect('//' + window.document.location.host);

    socket.on('error', function(error) { console.log(error); } );

    socket.on('connect', function(data) {
        console.log('connected');
    });

    socket.on('connect.fail', function(reason) {
        console.log("Connection failed: " + reason);
    });

    socket.on('xmpp.connection', function(status) {
        console.log("Connection status is: " + status);
    });

    socket.on('xmpp.message.chat', function(data) {
        console.log("Received a chat from: " + data.from);
        console.log("Content was: " + data.content);
    });

    socket.on('xmpp.presence', function(data) {
        console.log("Presence update from: " + data.from);
        console.log("Availability: " + data.status);
        console.log(data.message);
    });
}
