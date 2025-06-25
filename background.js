// Initialize default state
chrome.runtime.onInstalled.addListener(() => {
  // 'enabled' state is stored LOCALLY
  chrome.storage.local.get(['enabled'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.local.set({ enabled: true });
    }
  });
  
  // 'fontType' state remains SYNCED
  chrome.storage.sync.get(['fontType'], (result) => {
    if (result.fontType === undefined) {
      chrome.storage.sync.set({ fontType: 'sans' });
    }
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getExtensionStatus") {
    // Get 'enabled' from LOCAL storage
    chrome.storage.local.get(['enabled'], (result) => {
      sendResponse({ enabled: result.enabled !== false });
    });
    return true; // Keep the message channel open for async response
  } 
  else if (request.action === "setExtensionStatus") {
    // Set 'enabled' in LOCAL storage
    chrome.storage.local.set({ enabled: request.enabled }, () => {
      // Notify all tabs about the status change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          try {
            chrome.tabs.sendMessage(tab.id, {
              action: "updateExtensionStatus",
              enabled: request.enabled
            }).catch(() => {
              // Ignore errors for tabs that don't have content scripts
            });
          } catch (error) {
            // Ignore errors for tabs that don't have content scripts
          }
        });
      });
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
  else if (request.action === "getFontPreference") {
    // Font preference remains in SYNC storage
    chrome.storage.sync.get(['fontType'], (result) => {
      sendResponse({ fontType: result.fontType || 'sans' });
    });
    return true; // Keep the message channel open for async response
  }
  else if (request.action === "setFont") {
    // Font preference remains in SYNC storage
    chrome.storage.sync.set({ fontType: request.fontType }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
});

// Listen for storage changes to broadcast font updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.fontType) {
    const newFontType = changes.fontType.newValue;
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: "setFont",
            fontType: newFontType
          }).catch(() => {});
        } catch (error) {}
      });
    });
  }
}); 