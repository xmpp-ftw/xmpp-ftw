var xmpp = require('../index')
    , express = require('express')
    , app = express()
    , engine = require('ejs-locals')    
    
var server = require('http').createServer(app)
server.listen(3000);
var io = xmpp.init(server);
io.sockets.on('connection', function(socket) {

     var xmppFtw = new xmpp.Xmpp(socket);
     xmppFtw.addListener(require('../lib/multi-user-chat'))
          
});

app.configure(function(){
	app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.logger);
	app.use(express.errorHandler({
		dumpExceptions: true, showStack: true
	}));
});

app.engine('ejs', engine);

var options = { 
	ga: process.env['GOOGLE_ANALYTICS_ID'] || null,
	username: process.env['NODE_XMPP_USERNAME'] || null,
	password: process.env['NODE_XMPP_PASSWORD'] || null
}

app.get('/', function(req, res) {
    res.render('index', options);
});

app.get('/chat', function(req, res) {
    res.render('chat', options);
}); 
