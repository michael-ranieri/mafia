
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

var players = [];

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Mafia'
  });
});

app.post('/postUser', function(req, res) {
  console.log(req);
  res.send("<message><content>Hello</content></message>");
});

app.post('/playerJoin', function(req, res){
  console.log(req.body);
  setPlayer(req.body.name);
  res.send();
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// Socket.IO

io.sockets.on('connection', function (socket) {
  socket.on('ready', function (data) {
    socket.emit('state', { state: "this is the state"});
    for(var i in players) {
      socket.emit('setName', { player: parseInt(i)+1, name: players[i]});
    }
  });
});


// Setters

function setPlayer(name) {
  if (players.length < 10) {
    players.push(name);
    io.sockets.emit('setName', { player: players.length, name: players[players.length-1]});
  }
}




