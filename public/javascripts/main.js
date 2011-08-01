function isSupported() {
  supported = false;

  if ($.browser.webkit) {
    supported = (navigator.userAgent.indexOf('Chrome') !== -1);
  } else if ($.browser.mozilla) {
    supported = ($.browser.version.charAt(0) >= 6);
  }

  return supported;
}

function handleBrowserMessage() {
  if (isSupported()) {
    $('#browserMessage').hide();
  }
}

$(function() {
  handleBrowserMessage();
});
