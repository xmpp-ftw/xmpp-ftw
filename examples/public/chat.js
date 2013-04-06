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
        var resource = $('.resource').val();
        me = jid;
        socket.emit('xmpp.login', {jid: jid, password: password, resource: resource});
    });

    socket.on('connect.fail', function(reason) {
        console.log("Connection failed: " + reason);
    });

    socket.on('xmpp.connection', function(status) {
        console.log("Connection status is: " + status);
        $('.connection').addClass(status).find('span.status').text(status);
        if (status == 'online') {
            socket.emit('xmpp.presence', {status: 'online', priority: 1});
            socket.emit('xmpp.roster.get', {}, handleRoster);
            $('div.presence select').val('online');
        }
    });
    
    socket.on('xmpp.error', function(error) {
        console.log('ERROR: ' + error)
    })
    socket.on('xmpp.presence.error', function(error) {
        console.log('PRESENCE ERROR: ' + error)
    })
    
    window.onunload = function() {
        socket.emit('xmpp.logout')
    }

    /*---------------- CHAT ----------------*/

    $('.send-message').click(function() {
        var to = $('.to').val();
        var message = $('.message').val();
        if (!to || !message) return alert("Missing some info dude, fix and try again!");
        socket.emit('xmpp.chat.message', {to: to, message: message});
        addChatEntry(to, message, 'out');
    });

    socket.on('xmpp.chat.message', function(data) {
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
    
    /*---------------- ROSTER ----------------*/
   
   $('.roster-add').on('click', function() {
       var jid   = $('.roster-add-jid');
       var group = $('.roster-add-group');
       var name  = $('.roster-add-name');
       if (jid.val().length == 0) return alert("Please enter a JID");
       var data = { jid: jid.val() };
       if (group.length > 0) data.group = group.val();
       if (name.val().length > 0) data.name = name.val();
       socket.emit('xmpp.roster.add', data, function(reply) {
           if (reply && reply.error) return alert(reply.error);
           group.val('');
           jid.val('');
           name.val('');
           console.log("Roster add successful");
       });
   });
   
   $('.get-roster').on('click', function() {
       socket.emit('xmpp.roster.get', {}, handleRoster);
   });
   
   var handleRoster = function(error, roster) {
          if (error != null) return alert('Error getting roster: ' + error)
          $('.roster-items').find('*').remove()
       $(roster).each(function(index, item) {
           addRosterItem(item);
       });
   }
   
   addRosterItem = function(item) {
       var rosterItem = $(document.createElement('div')).attr('class', 'roster-item');
       if (item.name) {
           rosterItem.append(
               $(document.createElement('p')).text('Name: ' + item.name)
           );
       }
       rosterItem.append(
           $(document.createElement('p')).text('JID: ' + item.jid.node + '@' + item.jid.domain)
       );
       rosterItem.append(
           $(document.createElement('p')).text('Subscription: ' + item.subscription)
       );
       if (item.group) {
           rosterItem.append(
               $(document.createElement('p')).text('Group: ' + item.group)
           );
       }
       if (item.ask && (item.ask == 'subscribe')) {
              var request = $(document.createElement('div'));
              request.append(
                  $(document.createElement('button')).attr(
                      'onclick',
                      "subscribeAndAdd(this, '" + item.jid.node + '@' + item.jid.domain + "');"
                  ).text('Allow and add')
              );
           request.append(
               $(document.createElement('button')).attr(
                   'onclick',
                   "subscribe(this, '" + item.jid.node + '@' + item.jid.domain + "');"
               ).text('Allow subscription?')
           );
           request.append(
               $(document.createElement('button')).attr(
                   'onclick',
                   "unsubscribe(this, '" + item.jid.node + '@' + item.jid.domain + "');"
               ).text('Ignore request')
           );
           rosterItem.append(request);
       }
       rosterItem.appendTo($('.roster-items'));
   }
   subscribeAndAdd = function(element, jid) {
          socket.emit('xmpp.presence.subscribe', {to: jid });
       subscribe(element, jid);    
   }
   subscribe = function(element, jid) {
          console.log("Allowing subscription from " + jid);
       socket.emit("xmpp.presence.subscribed", { to: jid });
       $(element).parent().remove();
   }
   unsubscribe = function(element, jid) {
          console.log("Ignoring subscription from " + jid);
       socket.emit("xmpp.presence.unsubscribed", { to: jid });
       $(element).parent().remove();
   }

   socket.on('xmpp.roster.add', addRosterItem);
}