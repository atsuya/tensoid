var filesToSend = [];
var socket = null;
var url = null;

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
  var reader = new FileReader();
  reader.onload = function(event) {
    //console.log(event.target.result);
    var pairs = event.target.result.split(',');
    var types = pairs[0].split(';');
    var contentType = types[0].split(':')[1];

    uploadFile(contentType, pairs[1]);
  };

  reader.readAsDataURL(file);
}

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
  }
}

function transferFiles() {
  for (var i = 0; i < filesToSend.length; i++) {
    readFile(filesToSend[i]);
  }
}
