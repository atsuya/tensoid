var filesToSend = [];
var socket = null;
var url = null;
var blobCurrentPosition = 0;
var BLOB_SIZE = 102400;
var file = null;
var test = '';
var totalFile = '';

$(document).ready(function() {
  /*
  $(document).bind({
    dragover: handleFilesDragOver,
    drop: handleFilesDrop
  });
  */
  //$(document).addEventListener('dragover', handleFilesDragOver, false);
  //$(document).addEventListener('drop', handleFilesDrop, false);
  $('#filesInput').bind('change', handleFilesChange, false);

  setUpWebSocket();
});

/*
function handleFilesDragOver(event) {
  console.log('dragOver');
  //event.stopPropagation();
  event.preventDefault();  
}

function handleFilesDrop(event) {
  console.log('drop');
  //event.stopPropagation();
  //event.preventDefault();
}
*/

function handleFilesChange(event) {
  console.log('change');

  filesToSend = event.target.files;
  /*
  for(var i = 0; i < filesToSend.length; i++) {
    console.log('uploading ' + filesToSend[i].name);
    readFile(filesToSend[i]);
  };
  */
  if (socket) {
    socket.send(JSON.stringify({
      type: 'urlRequest'
    }));
  }
}

function readFile(file) {
  console.log(file);

  if (socket) {
    socket.send(JSON.stringify({
      type: 'transferStarted',
      content: {
        url: url,
        contentType: file.type
      }
    }));
  }

  var reader = new FileReader();
  reader.onload = function(event) {
    totalFile = event.target.result;

    /*
    $image = $(document.createElement('img'));
    $image.attr('src', totalFile);
    $('#displayArea').append($image);
    */

    sendBytes();
    /*
    //console.log(event.target.result);
    var pairs = event.target.result.split(',');
    var types = pairs[0].split(';');
    var contentType = types[0].split(':')[1];

    uploadFile(contentType, pairs[1]);
    */
  };
  reader.readAsDataURL(file);

  /*
  var reader = new FileReader();
  reader.onloadend = function(event) {
    console.log('here');
    if (event.target.readyState == FileReader.DONE) {
      console.log('reading: ');

      if (socket) {
        socket.send(JSON.stringify({
          type: 'transferringData',
          content: {
            url: url,
            data: event.target.result
          }
        }));
      }


      blobCurrentPosition += BLOB_SIZE;
      if (blobCurrentPosition < file.size) {
        console.log('vvvv');
        readBlob(reader, file);
      } else {
        console.log('fffff');
        if (socket) {
          socket.send(JSON.stringify({
            type: 'transferEnded',
            content: {
              url: url
            }
          }));
        }
      }
    }
  };
  */

  //blobCurrentPosition = 0;
  //readBlob(null, file);
}

function readBlob(reader, file) {
  if (blobCurrentPosition >= (file.size - 1)) {
    console.log(test);

    $image = $(document.createElement('img'));
    $image.attr('src', test);
    $('#displayArea').append($image);

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
  if ((file.size - 1) < end) {
    end = (file.size - 1);
  }
  var length = (end - blobCurrentPosition) + 1;
  var blob = file.slice(blobCurrentPosition, length);
  //reader.readAsDataURL(blob);
  
  var reader2 = new FileReader();
  reader2.onloadend = function(event) {
    console.log('here');
    if (event.target.readyState == FileReader.DONE) {
      console.log('reading: ');

      if (socket) {
        socket.send(JSON.stringify({
          type: 'transferringData',
          content: {
            url: url,
            data: event.target.result
          }
        }));
      }

      test += event.target.result;


      blobCurrentPosition += BLOB_SIZE;
      /*
      if (blobCurrentPosition < (file.size - 1)) {
        console.log('vvvv');
        readBlob(reader, file);
      } else {
        console.log('fffff');
        if (socket) {
          socket.send(JSON.stringify({
            type: 'transferEnded',
            content: {
              url: url
            }
          }));
        }

        console.log(test);
      }
      */
    }
  };
  reader2.readAsDataURL(blob);
}

/*
function uploadFile(contentType, data) {
  console.log('contenttype: ' + contentType);
  console.log('data: ' + data);

  if (socket) {
    socket.send(JSON.stringify({
      type: 'transferStarted',
      content: {
        url: url,
        contentType: contentType
      }
    }));
    socket.send(JSON.stringify({
      type: 'transferringData',
      content: {
        url: url,
        data: data
      }
    }));
    socket.send(JSON.stringify({
      type: 'transferEnded',
      content: {
        url: url
      }
    }));
  }
}
*/

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
    url = message.content.url;
  } else if (message.type === 'transferRequest') {
    console.log('oh yea, ready to send file!');
    transferFiles();
  } else if (message.type === 'transferringData') {
    console.log('sending more.');
    sendBytes();
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