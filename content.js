// This function will be a wrapper for all logic
function run() {
  chrome.storage.local.get(['enabled'], (localData) => {
    const isGloballyEnabled = localData.enabled !== false;
    
    chrome.storage.sync.get(['disabledSites'], (syncData) => {
      const disabledSites = syncData.disabledSites || [];
    const currentHost = window.location.hostname;

    if (!isGloballyEnabled || disabledSites.includes(currentHost)) {
      // If extension is disabled or site is in the list, do nothing.
      // Make sure classes are removed in case they were added before the check.
      document.documentElement.classList.remove('adhd-reader-enabled');
      document.body.classList.remove('use-serif');
      return;
    }

    // If everything is okay, run the main logic
    init();
    });
  });
}

// All previous logic is now inside the init() function
function init() {
  applyExtensionStatus(true); // If we got here, it means the extension is enabled

  // Listen for messages for dynamic updates
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "setFont") {
      setFontType(request.fontType);
      sendResponse({ success: true });
    } else if (request.action === "updateExtensionStatus") {
      // Just reload the page for reliable application/removal of styles
      window.location.reload();
    }
    // Other handlers can be returned if needed.
    return true;
  });
}

function applyExtensionStatus(enabled) {
  if (enabled) {
    document.documentElement.classList.add('adhd-reader-enabled');
    chrome.storage.sync.get(['fontType'], (result) => {
       setFontType(result.fontType);
    });
  } else {
    document.documentElement.classList.remove('adhd-reader-enabled');
    document.body.classList.remove('use-serif');
  }
}

function setFontType(fontType) {
  if (fontType === 'serif') {
    document.body.classList.add('use-serif');
  } else {
    document.body.classList.remove('use-serif');
  }
}

// Run the check
run(); 