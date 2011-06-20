var filesToSend = [];
var socket = null;
var url = null;
var blobCurrentPosition = 0;
var BLOB_SIZE = (3 * 10240) - 1;
var file = null;
var test = '';
var totalFile = '';
var readyToDraw = false;
var fileSizeLimit = 10000000;

$(document).ready(function() {
  var dropArea = document.getElementById('dropArea');
  dropArea.addEventListener('dragover', handleDragOver, false);
  dropArea.addEventListener('drop', handleDrop, false);
  dropArea.addEventListener('dragend', handleDragEnd, false);

  $('#dropAreaText').text('Drop File Here!');

  $('#progressBar').progressbar({ value: 0 });
  $('#progressBar').hide();

  setUpWebSocket();
});

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  return false;
}

function handleDrop(e) {
  //console.log('handleDrop');

  if (e.stopPropagation) {
    e.stopPropagation();
  }

  //console.log('handleDragEnd');

  //console.log(e);

  filesToSend = e.dataTransfer.files;
  if (filesToSend[0].size > fileSizeLimit) {
    alert('Please try with file < 10MB');
  } else {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'urlRequest'
      }));
    }
  }

  return false;
}

function handleDragEnd(e) {
  //console.log('handleDragEnd');

  filesToSend = e.target.files;

  if (socket) {
    socket.send(JSON.stringify({
      type: 'urlRequest'
    }));
  }
}

function readFile(file) {
  //console.log(file);

  if (socket) {
    socket.send(JSON.stringify({
      type: 'transferStarted',
      content: {
        url: url,
        contentType: file.type,
        contentSize: file.size
      }
    }));
  }

  blobCurrentPosition = 0;
  readyToDraw = true;
  readBlob(null, file);
}

function readBlob(reader, file) {
  if (readyToDraw) {
    readyToDraw = false;

    progress = (blobCurrentPosition / file.size) * 100;
    //console.log(progress);

    window.setTimeout(function() {
      $('#progressBar').progressbar('value', progress);
      readyToDraw = true;
    }, 500);
  }

  if (blobCurrentPosition >= (file.size - 1)) {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'transferEnded',
        content: {
          url: url
        }
      }));
    }

    $('#progressBar').hide();
    $('#dropArea').show();
    $('#dropAreaText').text('Done!');

    return;
  }

  var end = (blobCurrentPosition + BLOB_SIZE + 1);
  if (file.size < end) {
    end = file.size;
  }
  //console.log('s: '+blobCurrentPosition+', e: '+end);
  //var length = (end - blobCurrentPosition) + 1;
  var blob = file.webkitSlice(blobCurrentPosition, end, 'application/octet-stream');
  //reader.readAsDataURL(blob);
  
  var reader2 = new FileReader();
  reader2.onloadend = function(event) {
    //console.log('here');
    if (event.target.readyState == FileReader.DONE) {
      //console.log('reading: '+blobCurrentPosition+'/'+file.size);
      //console.log('mod: '+(event.target.result.length % 3));
      //console.log(event);

      var base64 = window.btoa(event.target.result);
      if (socket) {
        socket.send(JSON.stringify({
          type: 'transferringData',
          content: {
            url: url,
            data: base64
          }
        }));
      }

      test += base64;


      blobCurrentPosition += BLOB_SIZE + 1;
    }
  };
  reader2.readAsBinaryString(blob);
}

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
    //console.log('url: ' + message.content.url);
    url = message.content.url;

    $('#dropAreaText').text(url);
  } else if (message.type === 'transferRequest') {
    //console.log('oh yea, ready to send file!');
    $('#dropArea').hide();
    $('#progressBar').show();

    transferFiles();
  } else if (message.type === 'transferringData') {
    //console.log('sending more.');
    readBlob(null, file);
  }
}

function transferFiles() {
  for (var i = 0; i < filesToSend.length; i++) {
    file = filesToSend[i];
    readFile(filesToSend[i]);
  }
}

function sendBytes() {
  if (blobCurrentPosition >= totalFile.length) {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'transferEnded',
        content: {
          url: url
        }
      }));
    }
    return;
  }
  
  var end = (blobCurrentPosition + BLOB_SIZE);
  if (end >= totalFile.length) {
    end = totalFile.length;
  }

  if (socket) {
    socket.send(JSON.stringify({
      type: 'transferringData',
      content: {
        url: url,
        data: totalFile.substring(blobCurrentPosition, end)
      }
    }));

    blobCurrentPosition = end;
  }
}
