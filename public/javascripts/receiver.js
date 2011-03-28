var socket = null;

$(document).ready(function() {
  setUpWebSocket();
  notifySender();
});

function setUpWebSocket() {
  socket = new io.Socket(
    webSocketHost,
    { port: webSocketPort, transports: ['websocket'] }
  ); 
  socket.on('connect', handleWebSocketConnect); 
  socket.on('message', handleWebSocketMessage); 
  socket.connect();
}

function handleWebSocketConnect() {
}

function handleWebSocketMessage(data) {
  var message = JSON.parse(data);
  if (message.type === 'urlRequest') {
    console.log('url: ' + message.content.url);
  }
}

function notifySender() {
  if (socket) {
    socket.send(JSON.stringify({
      type: 'receiverConnected',
      content: {
        url: requestUrl
      }
    }));
  }
}
