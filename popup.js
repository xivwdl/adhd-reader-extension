document.addEventListener('DOMContentLoaded', function() {
  // UI Elements
  const globalToggleBtn = document.getElementById('global-toggle-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const mainControls = document.getElementById('main-controls');
  const siteActiveToggle = document.getElementById('site-active-toggle');
  const globalToggleIcon = document.getElementById('global-toggle-icon');
  const siteBlock = document.getElementById('current-site');
  const siteStatusLabel = document.getElementById('site-status-label');

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

  // --- Site-specific Blacklist Logic (Inverted) ---
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
      const currentHost = new URL(tabs[0].url).hostname;
      
      chrome.storage.sync.get('disabledSites', (data) => {
        const sites = data.disabledSites || [];
        const isSiteDisabled = sites.includes(currentHost);
        
        siteActiveToggle.checked = !isSiteDisabled;
        updateSiteStatusLabel(!isSiteDisabled);
      });

      siteActiveToggle.addEventListener('change', function() {
        chrome.storage.sync.get('disabledSites', (data) => {
          let sites = data.disabledSites || [];
          
          if (!this.checked) {
            if (!sites.includes(currentHost)) sites.push(currentHost);
          } else {
            sites = sites.filter(host => host !== currentHost);
          }
          
          chrome.storage.sync.set({ disabledSites: sites }, () => {
            chrome.tabs.reload(tabs[0].id);
            updateSiteStatusLabel(!sites.includes(currentHost));
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