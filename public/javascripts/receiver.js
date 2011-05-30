var socket = null;
var transferredData = '';
var contentType = '';

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
  //console.log(data);

  var message = JSON.parse(data);
  if (message.type === 'urlRequest') {
    console.log('url: ' + message.content.url);
  } else if (message.type === 'transferStarted') {
    console.log('transferStarted');

    contentType = message.content.contentType;
  } else if (message.type === 'transferringData') {
    console.log('transferringData');

    //console.log(message.content.data);

    transferredData = transferredData + '' + message.content.data;

    console.log('give me more!');
    if (socket) {
      socket.send(JSON.stringify({
        type: 'transferringDataOk',
        content: {
          url: requestUrl
        }
      }));
    }
  } else if (message.type === 'transferEnded') {
    console.log('transferEnded');

    console.log(contentType);

    var binary = window.atob(transferredData);
    var buffer = new ArrayBuffer(binary.length);
    var view = new Uint8Array(buffer);
    for (var i = 0, len = binary.length; i < len; ++i) {
      view[i] = binary.charCodeAt(i);
    }
    

    var blobBuilder = new WebKitBlobBuilder();
    blobBuilder.append(buffer);
    var blobUrl = window.webkitURL.createObjectURL(blobBuilder.getBlob());
    console.log('url: '+blobUrl);

    //console.log(transferredData);

    //var pairs = transferredData.split(',');
    //console.log(transferredData);
    //console.log('eeeeeeeeeeeeeeeeeee');

    $image = $(document.createElement('a'));
    $image.text('click');
    $image.attr('href', blobUrl);
    //$image.text('link');
    //$image.click(function() {
    //  console.log('aaaa');
    //  location.href = 'data:application/octet-stream;base64,'+transferredData;
    //});
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
