
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

var players = [];
var gameStart = false;
var night = true;
var mafiaWent = false;
var sherifWent = false;
var nurseWent = false;
var citizensVoted = 0;
var isDying = "";
var isSaving = "";
var isMafia = "";
var playerVotes = [];


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
  //console.log(req.body);
  if (players.length >= 3) {
    res.send("<message><content>Sorry, the game is full.</content></message>");
  } else {
  setPlayer(req.body.username);
  if (players.length === 1) {
      isMafia = req.body.username;
      res.send('<block><set name="job">mafia</set><message><content>You are the Mafia, keep it a secret! \
      You get to kill people.</content></message></block>');
    } else if (players.length === 2) {
      res.send('<block><set name="job">sherif</set><message><content>You are the Sherif! \
      You get to find the mafia.</content></message></block>');
    } else if (players.length === 3) {
      res.send('<block><set name="job">nurse</set><message><content>You are the Nurse! \
      You get to save a person.</content></message></block>');
    } else {
      res.send('<block><set name="job">citizen</set><message><content>You are a townsperson. \
      Try to keep the mafia from killing you.</content></message></block>');
    }
  }
});

app.post('/pickUser', function(req, res) {

  var isPlayer = false;

  for(var i in players) {
    if (players[i] === req.body.username) {
      isPlayer = true;
    }
  }
  if (isPlayer !== true || req.body.username === undefined || req.body.job === undefined){
    res.send('<message><content>You are not in the game. Stop sending messages.</content></message>');
  } else {
    if (gameStart===true && night===true && req.body.job==="mafia") {
      killPlayer(req.body.temp);
    } else if (gameStart===true && night===true && req.body.job==="sherif") {
      res.send("<message><content>True if who you picked is Mafia. -  " + discoverPlayer(req.body.temp) + "</content></message>");
    } else if (gameStart===true && night===true && req.body.job==="nurse") {
      savePlayer(req.body.temp);
    } else if (gameStart===true && night===false) {
      votePlayer(req.body.temp);
    }
    if(mafiaWent === true && nurseWent === true && sherifWent === true) {
      night = false;
      io.sockets.emit('setTime', { time: "Day"});
      if (isDying === isSaving) {
      } else {
        for (var i in players) {
          if (players[i] === isDying) {
            players[i] = "DEAD";
            sendKill(i);
          }
        }
      }
    }
    try {
      res.send('<message><content>You have chosen '+req.body.temp+'.</content></message>');
    } catch(err) {}
  }
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
    for(var i in players) {
      socket.emit('setName', { player: parseInt(i)+1, name: players[i]});
    }
  });
});


// Setters

function sendKill(index) {
  io.sockets.emit('setName', { player: parseInt(index)+1, name: "DEAD" });
}

function setPlayer(name) {
  if (players.length < 3) {
    players.push(name);
    playerVotes.push(0);
    io.sockets.emit('setName', { player: players.length, name: players[players.length-1]});
  }
  if (players.length >= 3) {
    gameStart = true;
    console.log("GAME START");
  }
}

function killPlayer(name) {
  if (mafiaWent === false) {
    for(var i in players) {
      if(players[i] === name) {
        isDying = name;
      }
    }
    mafiaWent = true;
  }
}

function savePlayer(name) {
  if (nurseWent === false) {
    for(var i in players) {
      if (players[i] === name) {
          players[i] = isSaving;
      }
    }
  nurseWent = true;
  }
}

function discoverPlayer(name) {
  if (sherifWent === false) {
    sherifWent = true;
    return (isMafia === name);
  } else return "Already Guessed";
}

function votePlayer(name) {
  for( var i in players) {
    if (players[i] === name) {
      playerVotes[i]++;
    }
  }
  citizensVoted++;
  io.sockets.emit('setVotes', { votes: citizensVoted });

  if(citizensVoted >=3) {
    var most=0;
    for(var i in players) {
      if(playerVotes[i] >= playerVotes[most]){
        most = i;
      }
    }

    for(var i in playerVotes) {
      playerVotes[i] = 0;
    }
    citizensVoted = 0;
    players[most] = "DEAD";
    sendKill[most];
    night = true;
    mafiaWent = false;
    nurseWent = false;
    sherifWent = false;
    io.sockets.emit('setTime', { time: "Night" });
    io.sockets.emit('setVotes', { votes: citizensVoted });
  }
}
