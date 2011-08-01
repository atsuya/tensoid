function isSupported() {
  return $.browser.webkit && (navigator.userAgent.indexOf('Chrome') !== -1);
}

function handleBrowserMessage() {
  if (isSupported()) {
    $('#browserMessage').hide();
  }
}

$(function() {
  handleBrowserMessage();
});
