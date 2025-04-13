// Initialize default state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['enabled', 'fontType'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.local.set({ enabled: true });
    }
    if (result.fontType === undefined) {
      chrome.storage.local.set({ fontType: 'sans' });
    }
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getExtensionStatus") {
    chrome.storage.local.get(['enabled'], (result) => {
      sendResponse({ enabled: result.enabled !== false });
    });
    return true; // Keep the message channel open for async response
  } 
  else if (request.action === "setExtensionStatus") {
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
    chrome.storage.local.get(['fontType'], (result) => {
      sendResponse({ fontType: result.fontType || 'sans' });
    });
    return true; // Keep the message channel open for async response
  }
  else if (request.action === "setFont") {
    chrome.storage.local.set({ fontType: request.fontType }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
}); 