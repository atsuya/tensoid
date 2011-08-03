var socket = null;
var transferredData = '';
var contentType = '';
var fileSize = '';
var fileName = '';
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
    fileSize = message.fileSize;
    fileName = message.fileName;

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

      progress = (transferredData.length / fileSize) * 100;
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
    
    var blobBuilder = window.WebKitBlobBuilder ? new WebKitBlobBuilder() : new MozBlobBuilder();
    blobBuilder.append(buffer);
    var blobUrl = window.webkitURL ? window.webkitURL.createObjectURL(blobBuilder.getBlob()) : window.URL.createObjectURL(blobBuilder.getBlob());

    $link = $(document.createElement('a'));
    $link.attr('id', 'receivedFile');
    //$link.text('Download!');
    $link.attr('data-downloadurl', contentType + ':' + fileName + ':' + blobUrl);
    $link.attr('href', blobUrl);

    $image = $(document.createElement('img'));
    $image.attr('src', '/images/file.png');
    $link.append($image);

    $('#progressBar').hide();
    $('#dropArea').show();
    $('#dropAreaText').append($link);

    // drag out sutff
    var dragOutElement = document.getElementById('receivedFile');
    dragOutElement.addEventListener('dragstart', function(event) {
        console.log(this.dataset);
        event.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
      },
      false
    );
  });
}

function notifySender() {
  if (socket) {
    socket.emit('receiverConnected', { url: requestUrl });
  }
}
