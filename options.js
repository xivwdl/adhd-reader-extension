document.addEventListener('DOMContentLoaded', () => {
  SettingsUI.localize();
  // --- UI Elements ---
  const sitesList = document.getElementById('disabled-sites-list');
  const emptyMessage = document.getElementById('empty-message');
  const fontToggle = document.getElementById('font-type-toggle');
  const sansLabel = document.getElementById('font-sans-label');
  const serifLabel = document.getElementById('font-serif-label');
  const listModeToggle = document.getElementById('list-mode-toggle');
  const blacklistLabel = document.getElementById('blacklist-label');
  const whitelistLabel = document.getElementById('whitelist-label');
  const siteListTitle = document.getElementById('site-list-title');

  // --- Functions ---
  function renderSites(siteList) {
    sitesList.innerHTML = '';
    if (siteList && siteList.length > 0) {
      emptyMessage.style.display = 'none';
      siteList.forEach(site => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = site.startsWith('http') ? site : 'https://' + site;
        link.textContent = site;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.flex = '1 1 auto';
        link.style.overflowWrap = 'anywhere';
        link.style.color = 'inherit';
        link.style.textDecoration = 'underline';
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.setAttribute('aria-label', SettingsUI.message('remove') + ': ' + site);
        removeButton.innerHTML = `<span class="icon-display icon-trash"></span>`;
        removeButton.onclick = () => {
          chrome.storage.sync.get(['siteList'], data => {
            if (chrome.runtime.lastError) { showError('saveError'); return; }
            const updatedSites = (Array.isArray(data.siteList) ? data.siteList : []).filter(s => s !== site);
            chrome.storage.sync.set({ siteList: updatedSites }, () => {
              if (chrome.runtime.lastError) showError('saveError');
            });
          });
        };
        listItem.appendChild(link);
        listItem.appendChild(removeButton);
        sitesList.appendChild(listItem);
      });
    } else {
      emptyMessage.style.display = 'block';
    }
  }

  function updateFontToggleUI(fontType) {
    const isSerif = fontType === 'serif';
    fontToggle.checked = isSerif;
    sansLabel.classList.toggle('is-active', !isSerif);
    serifLabel.classList.toggle('is-active', isSerif);
  }

  function updateListModeUI(listMode) {
    const isWhitelist = listMode === 'whitelist';
    listModeToggle.checked = isWhitelist;
    blacklistLabel.classList.toggle('is-active', !isWhitelist);
    whitelistLabel.classList.toggle('is-active', isWhitelist);
    siteListTitle.textContent = SettingsUI.message(isWhitelist ? 'included' : 'excluded');
  }

  function renderPage(data) {
    renderSites(data.siteList || []);
    updateFontToggleUI(data.fontType || 'sans');
    updateListModeUI(data.listMode || 'blacklist');
  }

  const form = document.getElementById('site-form');
  const input = document.getElementById('site-input');
  const status = document.getElementById('site-status');
  function showError(key) { status.textContent = SettingsUI.message(key); }
  form.addEventListener('submit', event => {
    event.preventDefault();
    let host;
    try { host = SettingsUI.hostname(input.value); }
    catch { showError('invalid'); return; }
    const button = form.querySelector('button');
    button.disabled = true;
    chrome.storage.sync.get(['siteList'], data => {
      if (chrome.runtime.lastError) { button.disabled = false; showError('saveError'); return; }
      const sites = Array.isArray(data.siteList) ? data.siteList : [];
      if (sites.includes(host)) { button.disabled = false; showError('duplicate'); return; }
      chrome.storage.sync.set({ siteList: [...sites, host] }, () => {
        button.disabled = false;
        if (chrome.runtime.lastError) { showError('saveError'); return; }
        input.value = '';
        status.textContent = '';
      });
    });
  });
  const ready = document.getElementById('ready');
  if (ready) ready.addEventListener('click', () => window.close());

  const enabledToggle = document.getElementById('extension-enabled-toggle');
  if (enabledToggle) {
    chrome.storage.local.get(['enabled'], data => {
      enabledToggle.checked = data.enabled !== false;
    });
    enabledToggle.addEventListener('change', () => {
      const enabled = enabledToggle.checked;
      enabledToggle.disabled = true;
      chrome.runtime.sendMessage({ action: 'setExtensionStatus', enabled }, response => {
        enabledToggle.disabled = false;
        if (chrome.runtime.lastError || !response || !response.success) {
          enabledToggle.checked = !enabled;
          showError('saveError');
        }
      });
    });
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.enabled) {
        enabledToggle.checked = changes.enabled.newValue !== false;
      }
    });
  }

  // --- Initial Load ---
  chrome.storage.sync.get(['siteList', 'fontType', 'listMode'], (data) => {
    renderPage(data);
  });

  // --- Event Listeners ---
  fontToggle.addEventListener('change', (event) => {
    const newFontType = event.target.checked ? 'serif' : 'sans';
    chrome.storage.sync.set({ fontType: newFontType });
  });

  listModeToggle.addEventListener('change', (event) => {
    const newMode = event.target.checked ? 'whitelist' : 'blacklist';
    chrome.storage.sync.set({ listMode: newMode });
  });

  // --- Storage Change Listener ---
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      // If any of the relevant settings changed, re-render the page with fresh data.
      if (changes.siteList || changes.fontType || changes.listMode) {
        chrome.storage.sync.get(['siteList', 'fontType', 'listMode'], (data) => {
          renderPage(data);
        });
      }
    }
  });
}); 
