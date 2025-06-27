document.addEventListener('DOMContentLoaded', function() {
  // UI Elements
  const globalToggleBtn = document.getElementById('global-toggle-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const mainControls = document.getElementById('main-controls');
  const siteActiveToggle = document.getElementById('site-active-toggle');
  const globalToggleIcon = document.getElementById('global-toggle-icon');
  const siteBlock = document.getElementById('current-site');
  const siteStatusLabel = document.getElementById('site-status-label');
  const note = document.querySelector('.note');

  let isEnabled = true;

  function updateGlobalToggleUI(enabled) {
    if (enabled) {
      globalToggleIcon.classList.remove('icon-play');
      globalToggleIcon.classList.add('icon-pause');
      mainControls.style.opacity = '1';
      mainControls.style.pointerEvents = 'auto';
    } else {
      globalToggleIcon.classList.remove('icon-pause');
      globalToggleIcon.classList.add('icon-play');
      mainControls.style.opacity = '0.5';
      mainControls.style.pointerEvents = 'none';
    }
  }

  function setGlobalState(isEnabled) {
    if (mainControls) {
      mainControls.classList.toggle('is-disabled', !isEnabled);
    }
    if (siteBlock) {
      siteBlock.classList.toggle('is-disabled', !isEnabled);
    }
    if (note) {
      note.classList.toggle('is-disabled', !isEnabled);
    }
  }

  function updateSiteStatusLabel(isActive) {
    if (siteStatusLabel) {
      siteStatusLabel.innerHTML = `Extension is ${isActive ? 'enabled' : 'disabled'} <br> on this website`;
    }
  }

  // --- Global Toggle Logic ---
  chrome.storage.local.get('enabled', (data) => {
    isEnabled = data.enabled !== false;
    updateGlobalToggleUI(isEnabled);
    setGlobalState(isEnabled);
  });

  globalToggleBtn.addEventListener('click', function() {
    isEnabled = !isEnabled;
    chrome.storage.local.set({ enabled: isEnabled }, () => {
      updateGlobalToggleUI(isEnabled);
      setGlobalState(isEnabled);
      // Reload the current tab when the global toggle is changed
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  });
  
  // --- Settings Button Logic ---
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // --- Site-specific Blacklist/Whitelist Logic ---
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
      const currentHost = new URL(tabs[0].url).hostname;
      
      chrome.storage.sync.get(['listMode', 'siteList'], (data) => {
        const listMode = data.listMode || 'blacklist';
        const siteList = Array.isArray(data.siteList) ? data.siteList : [];
        const inList = siteList.includes(currentHost);
        let isActive;
        if (listMode === 'blacklist') {
          isActive = !inList;
        } else {
          isActive = inList;
        }
        siteActiveToggle.checked = isActive;
        updateSiteStatusLabel(isActive);
      });

      siteActiveToggle.addEventListener('change', function() {
        chrome.storage.sync.get(['listMode', 'siteList'], (data) => {
          const listMode = data.listMode || 'blacklist';
          let siteList = Array.isArray(data.siteList) ? data.siteList : [];
          const inList = siteList.includes(currentHost);
          let shouldAdd = false;
          if (listMode === 'blacklist') {
            shouldAdd = !this.checked; // If disabling, add to list
          } else {
            shouldAdd = this.checked; // If enabling, add to list
          }
          if (shouldAdd && !inList) {
            siteList.push(currentHost);
          } else if (!shouldAdd && inList) {
            siteList = siteList.filter(host => host !== currentHost);
          }
          chrome.storage.sync.set({ siteList }, () => {
            chrome.tabs.reload(tabs[0].id);
            let isActive;
            if (listMode === 'blacklist') {
              isActive = !siteList.includes(currentHost);
            } else {
              isActive = siteList.includes(currentHost);
            }
            updateSiteStatusLabel(isActive);
          });
        });
      });
    } else {
      siteActiveToggle.disabled = true;
    }
  });

  if (siteBlock) {
    try {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0] && tabs[0].url) {
          let urlString = tabs[0].url;
          let host = '';
          if (urlString.startsWith('chrome-extension://')) {
            host = 'Extension page';
          } else if (urlString.startsWith('chrome://') || urlString.startsWith('edge://')) {
            host = 'Browser page';
          } else if (urlString.startsWith('about:')) {
            host = 'New tab';
          } else {
            try {
              let url = new URL(urlString);
              host = url.hostname.replace(/^www\./, '');
            } catch (e) {
              host = '';
            }
          }
          siteBlock.textContent = host;
        }
      });
    } catch (e) {
      siteBlock.textContent = '';
    }
  }
}); 