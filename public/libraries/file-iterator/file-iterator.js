/**
 * FileIterator
 */
function FileIterator(file) {
  this.file = file;
  this.currentPosition = 0;
  this.blobSize = (3 * 10240);
}

FileIterator.prototype.read = function(callback) {
  var that = this;

  if (this.currentPosition >= (this.file.size - 1)) {
    callback(null, { done: true });
  } else {
    var endPosition = (this.currentPosition + this.blobSize);
    if (this.file.size < endPosition) {
      endPosition = this.file.size;
    }

    var blob = null;
    if (this.file.mozSlice) {
      blob = this.file.mozSlice(this.currentPosition, endPosition, 'application/octet-stream')
    } else if (this.file.webkitSlice) {
      blob = this.file.webkitSlice(this.currentPosition, endPosition, 'application/octet-stream');
    }
    if (blob === null) {
      callback('slice method is not available');
    } else {
      var fileReader = new FileReader();
      fileReader.onloadend = function(event) {
        if (event.target.readyState == FileReader.DONE) {
          that.currentPosition += that.blobSize;
          callback(null, { data: event.target.result, done: false })
        }
      };
      fileReader.readAsBinaryString(blob);
    }
  }
};
