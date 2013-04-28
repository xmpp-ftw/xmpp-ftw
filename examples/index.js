var   xmpp        = require('../index')
    , express     = require('express')
    , app         = express()
    , engine      = require('ejs-locals')
    , cloneextend = require('cloneextend')  
    
var server = require('http').createServer(app)
server.listen(3000)
var io = require('socket.io').listen(server)

version = require('../package.json').version

io.configure(function(){
    io.set('transports', [
        'websocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
    ])
})

var muc = require('../lib/multi-user-chat')
var disco = require('../lib/disco')
var pubsub = require('../lib/pubsub')

io.sockets.on('connection', function(socket) {
     var xmppFtw = new xmpp.Xmpp(socket);
     xmppFtw.addListener(new muc())
     xmppFtw.addListener(new disco())
     xmppFtw.addListener(new pubsub())
})

var readme = require('express-middleware-readme.md')
readme.setOptions({
    htmlWrap: {
        meta: [
            { charset: 'utf-8' }
        ],
        title: 'XMPP-FTW Github README.md'
    }
})

app.configure(function(){
    app.use(express.static(__dirname + '/public'))
    app.set('views', __dirname + '/views')
    app.set('view engine', 'ejs')
    app.use(express.bodyParser())
    app.use(express.methodOverride())
    app.use(readme.run)
    app.use(app.router)
    app.use(express.logger);
    app.use(express.errorHandler({
        dumpExceptions: true, showStack: true
    }))
})

app.engine('ejs', engine);

var configuration = { 
    ga: process.env['GOOGLE_ANALYTICS_ID'] || null,
        webmasterTools: process.env['GOOGLE_WEBMASTER_TOOLS'] || null,
    username: process.env['NODE_XMPP_USERNAME'] || null,
    password: process.env['NODE_XMPP_PASSWORD'] || null,
    body:     {},
    title:    "XMPP-FTW ⟫ ",
    version:  version
}

app.get('/', function(req, res) {
    var options = cloneextend.clone(configuration)
    res.render('index', options)
})

app.get('/manual', function(req, res) {
    var options = cloneextend.clone(configuration)
    res.render('manual', options)
})

app.get('/demo', function(req, res) {
    var options = cloneextend.clone(configuration)
    res.render('demo', options)
})

app.get('/chat', function(req, res) {
    var options = cloneextend.clone(configuration)
    res.render('chat', options)
})

app.get('/data-forms', function(req, res) {
    var options = cloneextend.clone(configuration)
    res.render('data-forms', options)
})

app.get('/*', function(req, res) {
    res.send(404)
})
