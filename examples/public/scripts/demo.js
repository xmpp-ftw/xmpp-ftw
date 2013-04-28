var messageCount = 1;

var parsePage = function(data) {

    var data             = $(data.replace(/^\n/, ""))
    var outgoingMessages = []
    
    data.each(function(i, ele) {

        if (!'container' == $(ele).attr('id')) return
        
        $(ele).find('pre.in').each(function(i, message) {
            incoming.push($(message).attr('message'))
        })
            
        $(ele).find('pre.out').each(function(i, message) {
            var example = $(message).text().split($(message).attr('message') + "',")[1]
            if (example) {
                example = example.split('function(error, data) { console.log(error, data) }')[0].trim().slice(0, -1)
            }
            var out = {
                value: $(message).attr('message'),
                label: $(message).attr('message'),
                callback: $(message).hasClass('callback'),
                example: (example || "{}").replace(/\n/g, "<br/>")
            }
            outgoing.push(out)
            outgoingMessages.push(out.value)
        })
    })
    console.log('Listening for the following messages', incoming)
    console.log('Logged the following outgoing messages', outgoingMessages)
    setupListener()
    setupAutocomplete()
}

var setupAutocomplete = function() {
    $("#message").autocomplete({
      minLength: 0,
      source: outgoing,
      select: function(event, ui) {
          $('.send .callback').removeClass('callback-yes').removeClass('callback-no')
          $('.send .data').html(ui.item.example)
          $('.send .callback').attr('callback', ui.item.callback)
          $('.send .callback').addClass((true == ui.item.callback) ? 'callback-yes' : 'callback-no')
          $('.send .callback').html((true == ui.item.callback) ? 'Yes' : 'No')
        return false;
      },
      focus: function(event, ui) {
        $("#message").val(ui.item.label);
        return false;
      }
    })
}

var setupListener = function() {
    incoming.forEach(function(message) {
        socket.on(message, function(data, callback) {
            addMessage(message, 'in', data, callback)
        })    
    })
}

var addMessage = function(message, direction, data, callback) {
    console.log('IN: ', message, direction, data, callback)
    if (callback)
        var html = $('<div class="message-container payload callback-yes">'
            + '<div class="message"></div>'
            + '<div class="data"></div>'
            + '<div class="callback"></div>'
            + '</div>')
    else 
        var html = $('<div class="message-container payload callback-no">'
            + '<div class="message"></div>'
            + '<div class="data"></div>'
            + '</div>')
    html.addClass(direction)
    html.find('.data').html(JSON.stringify(data, undefined, 2).replace(/\n/g, "<br/>"))
    html.find('.message').html(message)
    
    var id = messageCount
    html.attr('id', id)
    ++messageCount
    console.log(direction, callback)
    if ('in' == direction && callback) {
    	
    	var callbackDiv = html.find('.callback')
    	callbackDiv.attr('contenteditable', 'true')
    	    .text('{...Write JSON callback data here...}')
    	callbackDiv.addClass("out")
    	var callbackButtonDiv = $('<div class="in-callback-submit"></div>')
    	var callbackButton = $('<button>Send callback</button>')
    	callbackButtonDiv.append(callbackButton)
    	html.append(callbackButtonDiv)
    	setTimeout(function() {
    		$(callbackButtonDiv).css('height', $(callbackDiv).css('height'))
        }, 100)
    	callbackButton.click(function() {
		    try {
		        var parsed = JSON.parse(callbackDiv.text())
		    } catch (e) {
		        console.error(e)
		        return alert("You must enter valid JSON:\n\n" + e.toString())
		    }
		    callback(parsed)
		    callbackButtonDiv.remove()
    	})
    	callbackDiv.append()
    }
    $('#messages').append(html)
    return id
}
    
var getMessages = function() {
    $.ajax({
        url: '/manual',
        type: 'get',
        dataType: 'html',
        success: parsePage,
        error: function(error) {
            alert('Failed to start: ' + error)
        }
    })
}

$('#send').on('click', function() {
    var message = $('#message').val()
    var payload = $('#data').text()
    var callback = $('#callback').hasClass('callback-yes')
    
    if (message.length < 6) return alert('You must enter a valid message')
    if (payload.length < 2) return alert("You must enter a valid payload, at least empty JSON object...\n\n{}")
    
    try {
        var parsed = JSON.parse(payload)
    } catch (e) {
        console.error(e)
        return alert("You must enter valid JSON:\n\n" + e.toString())
    } 
    var id = addMessage(message, 'out', parsed, callback)
    console.debug('OUT: ', message, parsed)
    if (true == callback) {
        socket.emit(message, parsed, function(error, data) {
            var callback = $('#' + id).find('.callback')
            if (error) {
                callback.addClass('error')
                callback.html(JSON.stringify(error, null, 2).replace(/\n/g, '<br/>'))
            } else {
                callback.addClass('success')
                callback.html(JSON.stringify(data, null, 2).replace(/\n/g, '<br/>'))
            }
            console.log(error, data)
        })
    } else {
        socket.emit(message, parsed)
    }
    clearForm()
})

var clearForm = function() {
    $("#demo .send .message, #message, #data, #callback").effect('highlight', 'slow');
    $('#message').val('')
    $('#data').html('')
    $('#callback').removeClass('callback-yes').removeClass('callback-no').html('')
}

var incoming = []
var outgoing = []

$(document).ready(function() {
    console.log("Page loaded...")
    socket = io.connect('//' + window.document.location.host);
    socket.on('error', function(error) { console.log(error); })

    socket.on('connect', function(data) {
        console.log('Connected')
        getMessages()
    })
    
    socket.on('connect.fail', function(reason) {
        console.log("Connection failed: " + reason)
    })
  
    socket.on('disconnect', function() {
        addMessage('exit(0)', 'in', 'SOCKET CONNECTION CLOSED', false)
        socket = null
    })
})
