var socket = null;
var url = null;
var test = '';
var totalFile = '';
var readyToDraw = false;
var fileSizeLimit = 10000000;
var fileIterator = null;

$(document).ready(function() {
  var dropArea = document.getElementById('dropArea');
  dropArea.addEventListener('dragover', handleDragOver, false);
  dropArea.addEventListener('drop', handleDrop, false);
  //dropArea.addEventListener('dragend', handleDragEnd, false);

  $('#dropAreaText').text('Drop File Here!');

  $('#progressBar').progressbar({ value: 0 });
  $('#progressBar').hide();

  setUpWebSocket();
});

function handleDragOver(e) {
  e.stopPropagation();
  e.preventDefault();
}

function handleDrop(e) {
  e.stopPropagation()
  e.preventDefault();

  var filesToSend = e.dataTransfer.files;
  if (filesToSend[0].size > fileSizeLimit) {
    alert('Please try with file < 10MB');
  } else {
    if (fileIterator) {
      alert('Reload the page to initiate new upload!');
    } else {
      fileIterator = new FileIterator(filesToSend[0]);

      if (socket) {
        socket.emit('urlRequest');
      }
    }
  }
}

function setUpWebSocket() {
  socket = new io.connect(
    webSocketHost,
    { port: webSocketPort, transports: ['websocket'] }
  );  
  socket.on('urlRequest', function(message) {
    //console.log('url: ' + message.content.url);
    url = message.url;

    $('#dropAreaText').text(url);
  });
  socket.on('transferRequest', function() {
    //console.log('oh yea, ready to send file!');
    $('#dropArea').hide();
    $('#progressBar').show();

    transferFiles();
  });
  socket.on('transferringData', function() {
    //console.log('sending more.');
    iterateFile();
  });
}

function transferFiles() {
  if (socket) {
    socket.emit('transferStarted', {
      url: url,
      contentType: fileIterator.file.type,
      fileSize: fileIterator.file.size,
      fileName: fileIterator.file.name
    });
  }

  readToDraw = true;
  iterateFile();
}

function iterateFile() {
  fileIterator.read(fileRead);
}

function fileRead(error, response) {
  if (readyToDraw) {
    readyToDraw = false;

    progress = (fileIterator.currentPosition / fileIterator.file.size) * 100;
    //console.log(progress);

    window.setTimeout(function() {
      $('#progressBar').progressbar('value', progress);
      readyToDraw = true;
    }, 500);
  }

  if (response.done) {
    if (socket) {
      socket.emit('transferEnded', { url: url });
    }

    $('#progressBar').hide();
    $('#dropArea').show();
    $('#dropAreaText').text('Done!');

    return;
  }

  var base64 = window.btoa(response.data);
  if (socket) {
    socket.emit('transferringData', { url: url, data: base64 });
  }
}
