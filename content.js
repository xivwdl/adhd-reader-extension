// Apply saved font preference
function applySavedFontPreference() {
  chrome.storage.local.get(['fontType'], (result) => {
    if (result.fontType === 'serif') {
      document.body.classList.add('use-serif');
    }
  });
}

// Set font type
function setFontType(fontType) {
  if (fontType === 'serif') {
    document.body.classList.add('use-serif');
  } else {
    document.body.classList.remove('use-serif');
  }
  // No need to save to storage here, background.js handles that
}

// Get current font preference
function getFontPreference() {
  return localStorage.getItem('adhd-reader-font') === 'serif' ? 'serif' : 'sans';
}

// Get extension enabled status
function getExtensionStatus() {
  // Default to enabled if not set
  return localStorage.getItem('adhd-reader-enabled') !== 'false';
}

// Set extension enabled status
function setExtensionStatus(enabled) {
  localStorage.setItem('adhd-reader-enabled', enabled.toString());
  applyExtensionStatus(enabled);
}

// Apply extension status
function applyExtensionStatus(enabled) {
  if (enabled) {
    // Enable the extension by applying the font
    document.documentElement.classList.add('adhd-reader-enabled');
    applySavedFontPreference();
  } else {
    // Disable the extension by removing the classes
    document.documentElement.classList.remove('adhd-reader-enabled');
    document.body.classList.remove('use-serif');
  }
}

// Initialize
function init() {
  chrome.runtime.sendMessage({action: "getExtensionStatus"}, (response) => {
    if (response && response.hasOwnProperty('enabled')) {
      applyExtensionStatus(response.enabled);
    }
  });
}

// Listen for messages from the popup or background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "setFont") {
    setFontType(request.fontType);
    sendResponse({success: true});
  } else if (request.action === "getFontPreference") {
    chrome.storage.local.get(['fontType'], (result) => {
      sendResponse({fontType: result.fontType || 'sans'});
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === "setExtensionStatus" || request.action === "updateExtensionStatus") {
    applyExtensionStatus(request.enabled);
    sendResponse({success: true});
  } else if (request.action === "getExtensionStatus") {
    chrome.runtime.sendMessage({action: "getExtensionStatus"}, (response) => {
      sendResponse(response);
    });
    return true; // Keep the message channel open for async response
  }
  return true;
});

// Run when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 