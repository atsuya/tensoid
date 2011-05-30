var filesToSend = [];
var socket = null;
var url = null;
var blobCurrentPosition = 0;
var BLOB_SIZE = (3 * 1024) - 1;
var file = null;
var test = '';
var totalFile = '';
var base64Table = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
];

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

  
  //var reader = new FileReader();
  //reader.onload = function(event) {
  //  totalFile = event.target.result;

    /*
    $image = $(document.createElement('img'));
    $image.attr('src', totalFile);
    $('#displayArea').append($image);
    */

    //sendBytes();
    /*
    //console.log(event.target.result);
    var pairs = event.target.result.split(',');
    var types = pairs[0].split(';');
    var contentType = types[0].split(':')[1];

    uploadFile(contentType, pairs[1]);
    */
  //};
  //reader.readAsDataURL(file);

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

  blobCurrentPosition = 0;
  readBlob(null, file);
}

function readBlob(reader, file) {
  if (blobCurrentPosition >= (file.size - 1)) {
    //console.log(test);

    //$image = $(document.createElement('img'));
    //$image.attr('src', 'data:image/jpeg;base64,'+test);
    //$('#displayArea').append($image);

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

  var end = (blobCurrentPosition + BLOB_SIZE + 1);
  if (file.size < end) {
    end = file.size;
  }
  console.log('s: '+blobCurrentPosition+', e: '+end);
  //var length = (end - blobCurrentPosition) + 1;
  var blob = file.webkitSlice(blobCurrentPosition, end, 'application/octet-stream');
  //reader.readAsDataURL(blob);
  
  var reader2 = new FileReader();
  /*
  reader2.onload = function(event) {
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
    blobCurrentPosition += BLOB_SIZE + 1;
  };
  */
  reader2.onloadend = function(event) {
    console.log('here');
    if (event.target.readyState == FileReader.DONE) {
      console.log('reading: '+blobCurrentPosition+'/'+file.size);
      console.log('mod: '+(event.target.result.length % 3));
      console.log(event);

      var base64 = window.btoa(event.target.result);
      /*
      for(var i = 0; i < event.target.result.length; i += 3) {
        var byte1 = ((i+0) < event.target.result.length) ? event.target.result[(i+0)].charCodeAt(0) : null;
        var byte2 = ((i+1) < event.target.result.length) ? event.target.result[(i+1)].charCodeAt(0) : null;
        var byte3 = ((i+2) < event.target.result.length) ? event.target.result[(i+2)].charCodeAt(0) : null;

        var firstFirst = byte1 & 0xfc;
        var first = base64Table[(firstFirst >>> 2)];

        var secondFirst = byte1 & 0x03;
        var secondSecond = (byte2 != null) ? (byte2 & 0xf0) : 0;
        var second = base64Table[((secondFirst << 4) | (secondSecond >>> 4))];
        var third = '';
        var fourth = '';

        if (byte2 != null) {
          var thirdFirst = byte2 & 0x0f;
          var thirdSecond = (byte3 != null) ? byte3 & 0xc0 : 0;
          third = base64Table[((thirdFirst << 2) | (thirdSecond >>> 6))];

          if (byte3 != null) {
            fourth = base64Table[(byte3 & 0x3f)];
          } else {
            fourth = '=';
          }
        } else {
          third = '=';
          fourth = '=';
        }

        base64 += first+second+third+fourth;
      }
      */

      //console.log('base64: '+base64);

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
  //reader2.readAsDataURL(blob);
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
