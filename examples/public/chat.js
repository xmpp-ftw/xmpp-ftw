window.onload = function() {
	
	var chats = new Array();
	var me;
	var presence = new Array();
	
	getJid = function(jid) {
	    if (typeof jid != 'string') return jid;
	    var resource = jid.split('/')[1];
	    if (jid.indexOf('@') == -1) {
	    	var domain = jid.split('/')[0];
	    	var node = null;
	    } else {
	    	var node = jid.split('/')[0].split('@')[0];
	    	var domain = jid.split('/')[0].split('@')[1];
	    }
	    return { node: node, domain: domain, resource: resource }
	}
	
    socket = io.connect('//' + window.document.location.host);

    socket.on('error', function(error) { console.log(error); } );

    socket.on('connect', function(data) {
        console.log('Connected to server...');
    });

    $('.login').click(function() {
        var jid = $('.jid').val();
        var password = $('.password').val();
        me = jid;
        socket.emit('xmpp.login', {jid: jid, password: password});
    });

    socket.on('connect.fail', function(reason) {
        console.log("Connection failed: " + reason);
    });

    socket.on('xmpp.connection', function(status) {
        console.log("Connection status is: " + status);
        $('.connection').addClass(status).find('span.status').text(status);
    });

    /*---------------- CHAT ----------------*/

    $('.send-message').click(function() {
        var to = $('.to').val();
        var message = $('.message').val();
        if (!to || !message) return alert("Missing some info dude, fix and try again!");
        socket.emit('xmpp.message.chat', {to: to, message: message});
        addChatEntry(to, message, 'out');
    });

    socket.on('xmpp.message.chat', function(data) {
        console.log("Received a chat from: " + data.from.node + '@' + data.from.domain);
        console.log("Content was: " + data.content);
        addChatEntry(data.from, data.content, 'in');
    });

    var createChatEntry = function(jid) {
    	var jidId = jid.node + '-at-' + jid.domain;
        if (chats[jidId]) return;
        chats[jidId] = $(document.createElement('div'))
            .attr('id', jidId)
            .attr('class', 'presence-status-' + (presence[jidId] || { show: 'undefined'}).show)
            .text(jid.node + '@' + jid.domain)
        console.log('presence',presence, presence[jidId],jid);
        $('.with').append(chats[jidId]);
    }

    var addChatEntry = function(to, message, direction) {
    	var jid = getJid(to);
        createChatEntry(jid);
        var toId = jid.node + '-at-' + jid.domain;
        $(chats[toId]).append(
            $(document.createElement('div'))
                .attr('class', direction)
                .text(new Date() + ': ' + message)
        );
    }
    
    /*---------------- PRESENCE ----------------*/
   
    socket.on('xmpp.presence', function(data) {
        console.log("Presence update from: " + data.from.node + '@' + data.from.domain);
        console.log("Availability", data);
        var jid = data.from.node + '-at-' + data.from.domain;
        if (!presence[jid]) 
            presence[jid] = {};
        if (data.show) presence[jid].show = data.show;
        if (data.status) presence[jid].status = data.status;
        if (data.priority) presence[jid].priority = data.priority;
    });
    
    $('.set-presence').on('click', function() {
    	var presence      = {}
    	presence.show = $('.presence select').val();
    	if ($('.presence input').val() != '') presence.status = $('.presence input').val();
    	console.log("Setting presence", presence);
        socket.emit('xmpp.presence', presence)
    });
    
    socket.on('xmpp.presence.subscribe', function(data) {
    	var jid = data.from.node + '@' + data.from.domain;
    	var msg = jid + ' ';
    	if (data.nick) {
    		msg = msg + '(' + data.nick + ') ';
    	}
    	msg = msg + 'would like to subscribe to your presence. Allow?';
    	if (window.confirm(msg)) {
    		socket.emit('xmpp.presence.subscribed', { to: jid });
    	}
    });
}
