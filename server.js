var xmpp = require('./src/xmpp')
    , express = require('express')
    , app = express()
    , engine = require('ejs-locals')    
    
var server = require('http').createServer(app)
server.listen(3000);
var io = xmpp.init(server);
io.sockets.on('connection', function(socket) {

     new xmpp.Xmpp(socket);
          
});

app.configure(function(){
	app.use(express.static(__dirname + '/../public'));
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

app.get('/', function(req, res) {
    res.render('index');
});
app.get('/client.js', function(req, res) {
    res.render('client');
}); 
