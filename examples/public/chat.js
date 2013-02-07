window.onload = function() {
    socket = io.connect('//' + window.document.location.host);

    socket.on('error', function(error) { console.log(error); } );

    socket.on('connect', function(data) {
        console.log('Connected to server...');
    });

    $('.login').click(function() {
        var jid = $('.jid').val();
        var password = $('.password').val();
        socket.emit('xmpp.login', {jid: jid, password: password});
    });

    $('.send-message').click(function() {
        var to = $('.to').val();
        var message = $('.message').val();
        console.log(to, message);
        if (!to || !message) return alert("Missing some info dude, fix and try again!");
        socket.emit('xmpp.message.chat', {to: to, message: message});
        addChatEntry(to, message);
    });
    socket.on('connect.fail', function(reason) {
        console.log("Connection failed: " + reason);
    });

    socket.on('xmpp.connection', function(status) {
        console.log("Connection status is: " + status);
        $('.connection').addClass(status).find('span.status').text(status);
    });

    socket.on('xmpp.message.chat', function(data) {
        console.log("Received a chat from: " + data.from);
        console.log("Content was: " + data.content);
        addChatEntry(data.from, data.content);
    });

    socket.on('xmpp.presence', function(data) {
        console.log("Presence update from: " + data.from);
        console.log("Availability: " + data.status);
        console.log(data.message);
    });

    var createChatEntry = function(jid) {
        if ($('.with').find('#' + jid.replace('@', '-at-')).length != 0) return;
        $('.with').append(
            $(document.createElement('div')).attr('id', jid.replace('@', '-at-')).text(jid)
        );
    }

    var addChatEntry = function(to, message) {
        createChatEntry(to);
        $('.with').find('#' + to.replace('@', '-at-')).append(
            $(document.createElement('div')).attr('class', 'out').text(message)
        );
    }
}
