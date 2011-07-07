var socket = null;
var transferredData = '';
var contentType = '';
var contentSize = 0;
var readyToDraw = false;

$(document).ready(function() {
  $('#dropArea').hide();
  
  $('#progressBar').progressbar({ value: 0 });
  $('#progressBar').hide();

  setUpWebSocket();
  notifySender();
});

function setUpWebSocket() {
  socket = new io.connect(
    webSocketHost,
    { port: webSocketPort, transports: ['websocket'] }
  );
  socket.on('transferStarted', function(message) {
    contentType = message.contentType;
    contentSize = message.contentSize;

    readyToDraw = true;
    $('#progressBar').show();
    $('#progressBar').progressbar('value', 0);
  });
  socket.on('transferringData', function(message) {
    //console.log('transferringData');

    //console.log(message.content.data);

    transferredData = transferredData + '' + message.data;

    if (readyToDraw) {
      readyToDraw = false;

      progress = (transferredData.length / contentSize) * 100;
      //console.log(progress);

      window.setTimeout(function() {
        $('#progressBar').progressbar('value', progress);
        readyToDraw = true;
      }, 500);
    }

    //console.log('give me more!');
    if (socket) {
      socket.emit('transferringDataOk', { url: requestUrl });
    }
  });
  socket.on('transferEnded', function(message) {
    //console.log('transferEnded');

    //console.log(contentType);

    var binary = window.atob(transferredData);
    var buffer = new ArrayBuffer(binary.length);
    var view = new Uint8Array(buffer);
    for (var i = 0, len = binary.length; i < len; ++i) {
      view[i] = binary.charCodeAt(i);
    }
    

    var blobBuilder = new WebKitBlobBuilder();
    blobBuilder.append(buffer);
    var blobUrl = window.webkitURL.createObjectURL(blobBuilder.getBlob());
    //console.log('url: '+blobUrl);

    $image = $(document.createElement('a'));
    $image.text('File is Here!');
    $image.attr('href', blobUrl);

    $('#progressBar').hide();
    $('#dropArea').show();
    $('#dropAreaText').append($image);
  });
}

function notifySender() {
  if (socket) {
    socket.emit('receiverConnected', { url: requestUrl });
  }
}
