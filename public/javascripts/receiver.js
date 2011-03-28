var socket = null;
var transferredData = '';

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
  } else if (message.type === 'transferStarted') {
    console.log('transferStarted');
  } else if (message.type === 'transferringData') {
    console.log('transferringData');
    transferredData += message.content.data;
  } else if (message.type === 'transferEnded') {
    console.log('transferEnded');

    $image = $(document.createElement('button'));
    $image.text('click');
    //$image.attr('href', 'data:image/jpeg;base64,'+transferredData);
    //$image.text('link');
    $image.click(function() {
      console.log('aaaa');
      location.href = 'data:application/octet-stream;base64,'+transferredData;
    });
    $('#displayArea').append($image);
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
