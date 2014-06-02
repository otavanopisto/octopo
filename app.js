(function() {
  
  var http = require('http');
  var fs = require('fs');
  var express = require('express');
  var passport = require('passport');
  var GitHubStrategy = require('passport-github').Strategy;
  var views = require('./views');
  var _ = require('underscore');
  var config = require('./config.json');
  
  var app = express();
  var httpServer = http.createServer(app);
  httpServer.listen(config.http.port);
  var io = require('socket.io').listen(httpServer);
  var clients = {};
  var estimatingStory = {};
  
  function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  }
  
  function loggedIn (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    
    res.redirect('/auth/github?redirectUrl=' + req.path);
  }
  
  function addRoomData(req, res, next){
	  req.rooms = io.sockets.manager.rooms;
	  return next();
  }
  
  app.configure(function () {
    passport.use(new GitHubStrategy({
      clientID : config.github.clientId,
      clientSecret : config.github.clientSecret,
      callbackURL : "/auth/github/callback"
    }, function(accessToken, refreshToken, profile, done) {
      done(null, {
        accessToken: accessToken,
        refreshToken: refreshToken
      });
    }));

    passport.serializeUser(function(user, done) {
      done(null, user.accessToken);
    });
    
    passport.deserializeUser(function(id, done) {
      done(null, {
        accessToken: id
      });
    });
    
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser({limit: '50mb'}));
    app.use(express.methodOverride());
    app.use(express.session({secret: config.session.secret}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    
    app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
    
    /**
	 * Views
	 */
    
    app.get('/', [loggedIn], views.index);
    app.get('/selectrole', [loggedIn], views.selectRole);
    app.get('/selectroom', [loggedIn], views.selectRoom);
    app.get('/_estimation', [loggedIn], views._estimation);
    app.get('/_save-estimation', [loggedIn], views._saveEstimation);
    app.get('/_rooms', [loggedIn, addRoomData], views._rooms);

    // GitHub
    
    app.get('/auth/github', passport.authenticate('github', { scope: ['user:email', "repo", ] } ));
    app.get('/auth/github/callback', passport.authenticate('github'), function(req, res) {
      res.redirect('/');
    });
    
    // Logout
    
    app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/roleselect');
    });
  });
  
  io.sockets.on('connection', function (socket) {
    socket.on('issue.select', function (data) {
      estimatingStory[socket.room] = data.number;
      io.sockets.in(socket.room).emit('issue.select', { number: estimatingStory[socket.room] });
    });
    
    socket.on('issue.estimate', function (data) {
      io.sockets.in(socket.room).emit('issue.estimate', { userId: data.userId, number: data.number, estimationName: data.estimationName, estimationColor: data.estimationColor });
    });
    
    socket.on('issue.estimate-saved', function (data) {
      delete estimatingStory[socket.room];
      io.sockets.in(socket.room).emit('issue.estimate-saved', { number: data.number, estimate: data.estimate });
    });
    
    socket.on('estimations.reveal', function (data) {
      io.sockets.in(socket.room).emit('estimations.reveal', { });
    });
    
    socket.on('estimations.reset', function (data) {
      io.sockets.in(socket.room).emit('estimations.reset', { });
    });
    
    socket.on('join', function (data) {
      socket.room = data.currentRoom;
      if(!clients[socket.room]){
    	  clients[socket.room] = {};
      }
      clients[socket.room][this.id] = data;
      socket.join(data.currentRoom);
      console.log("joined to room: "+data.currentRoom);
      io.sockets.in(socket.room).emit('clients', {clients: _.values(clients[socket.room])});
      
      if (estimatingStory[socket.room]) {
        this.emit('issue.select', { number: estimatingStory });
      }
    });
    
    socket.on('disconnect', function() {
      delete clients[socket.room][this.id];
      if(_.isEmpty(clients[socket.room])){
    	  delete clients[socket.room];
    	  delete estimatingStory[socket.room]; //In case all users disconnect while estimating
      } 
    });
  });
  
}).call(this);
