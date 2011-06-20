
/**
 * Module dependencies.
 */

var fs = require('fs');
var express = require('express');
var socketio = require('socket.io');
var Log = require('log');
var config = require('./config');

var log = new Log(Log.DEBUG, fs.createWriteStream('./logs/transferrings.log'));
var app = module.exports = express.createServer();

// Configuration

app.configure(function() {
  app.redirect('send', '/send');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: config.server.secret }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

app.dynamicHelpers({
  message: function(req, res) {
    var message = req.flash('error')[0] || '';
    return message;
  },
  resources: function(req, res) {
    var resources = req.session.resources || [];
    delete req.session.resources;
    return resources;
  },
  variables: function(req, res) {
    var variables = req.session.variables || [];
    delete req.session.variables;
    return variables;
  }
});

// Routes

app.get('/', function(req, res) {
  res.redirect('send');
});

app.get('/send', function(req, res) {
  req.session.resources = [
    { type: 'javascript', uri: '/socket.io/socket.io.js' },
    { type: 'css', uri: '/stylesheets/sender.css' },
    { type: 'javascript', uri: '/javascripts/sender.js' }
  ];
  req.session.variables = [
    { name: 'webSocketHost', value: "'" + config.client.webSocket.host + "'" },
    { name: 'webSocketPort', value: config.client.webSocket.port }
  ];
  res.render('sender');
});

app.get('/receive/:id', function(req, res) {
  req.session.resources = [
    { type: 'javascript', uri: '/socket.io/socket.io.js' },
    { type: 'css', uri: '/stylesheets/receiver.css' },
    { type: 'javascript', uri: '/javascripts/receiver.js' }
  ];
  req.session.variables = [
    { name: 'requestUrl', value: "'http://" + config.server.host + ':' + config.server.port + req.url + "'" },
    { name: 'webSocketHost', value: "'" + config.client.webSocket.host + "'" },
    { name: 'webSocketPort', value: config.client.webSocket.port }
  ];
  res.render('receiver');
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(config.server.port, config.server.host);
  console.log('tensoid is rocking on ' + config.server.host + ':' + config.server.port + '!');
}

var connections = {};
var listener = socketio.listen(app, { transports: ['websocket'] }); 
listener.on('connection', function(client) {
  client.on('message', function(data) {
    var message = JSON.parse(data);
    if (message.type === 'urlRequest') {
      var url = generateUrl();
      client.send(JSON.stringify({
        type: 'urlRequest',
        content: {
          url: url
        }
      }));

      addSender(url, client);

      log.debug(
        '[%s]: action=urlRequest, from=%s',
        url,
        client.connection.remoteAddress
      );
    } else if (message.type === 'receiverConnected') {
      addReceiver(message.content.url, client);
      requestTransferring(message.content.url);

      log.debug(
        '[%s]: action=receiverConnected, from=%s',
        message.content.url,
        client.connection.remoteAddress
      );
    } else if (message.type === 'transferStarted') {
      startTransferring(message.content.url, message.content);

      log.debug(
        '[%s]: action=transferStarted, from=%s',
        message.content.url,
        client.connection.remoteAddress
      );
    } else if (message.type === 'transferringData') {
      transferData(message.content.url, message.content);
    } else if (message.type === 'transferEnded') {
      endTransferring(message.content.url, message.content);
      delete connections[message.content.url];

      log.debug(
        '[%s]: action=transferEnded, from=%s',
        message.content.url,
        client.connection.remoteAddress
      );
    } else if (message.type === 'transferringDataOk') {
      var session = connections[message.content.url].sender;
      var sender = listener.clients[session];
      sender.send(JSON.stringify({
        type: 'transferringData'
      }));
    }
  });
  client.on('disconnect', function() {
  });
});

function generateUrl() {
  id = Math.floor(Math.random() * 10000000000);
  return 'http://' + config.server.host + ':' + config.server.port + '/receive/' + id;
}

function addSender(url, client) {
  if (!(url in connections)) {
    connections[url] = {
      sender: client.sessionId,
      receivers: []
    };
  }
}

function addReceiver(url, client) {
  if (url in connections) {
    connections[url].receivers.push(client.sessionId);
  }
}

function requestTransferring(url) {
  if (url in connections) {
    var sessionId = connections[url].sender;
    var sender = listener.clients[sessionId];
    sender.send(JSON.stringify({
      type: 'transferRequest'
    }));
  }
}

function startTransferring(url, content) {
  if (url in connections) {
    var sessionId = connections[url].receivers[0];
    var receiver = listener.clients[sessionId];
    receiver.send(JSON.stringify({
      type: 'transferStarted',
      content: {
        contentType: content.contentType,
        contentSize: content.contentSize
      }
    }));
  }
}

function transferData(url, content) {
  if (url in connections) {
    var sessionId = connections[url].receivers[0];
    var receiver = listener.clients[sessionId];
    receiver.send(JSON.stringify({
      type: 'transferringData',
      content: {
        data: content.data
      }
    }));
  }
}

function endTransferring(url, content) {
  if (url in connections) {
    var sessionId = connections[url].receivers[0];
    var receiver = listener.clients[sessionId];
    receiver.send(JSON.stringify({
      type: 'transferEnded'
    }));
  }
}

process.on('SIGINT', function () {
    console.log('shutting down!');
    shutdown();
});

function shutdown() {
  process.exit(0);
}
