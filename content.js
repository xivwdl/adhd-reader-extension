// This function will be a wrapper for all logic
function run() {
  chrome.storage.local.get(['enabled'], (localData) => {
    const isGloballyEnabled = localData.enabled !== false;
    
    chrome.storage.sync.get(['listMode', 'siteList'], (syncData) => {
      const listMode = syncData.listMode || 'blacklist';
      const siteList = Array.isArray(syncData.siteList) ? syncData.siteList : [];
      const currentHost = window.location.hostname;
      const inList = siteList.includes(currentHost);
      let shouldEnable = false;
      if (listMode === 'blacklist') {
        shouldEnable = isGloballyEnabled && !inList;
      } else if (listMode === 'whitelist') {
        shouldEnable = isGloballyEnabled && inList;
      }
      if (!shouldEnable) {
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