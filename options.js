document.addEventListener('DOMContentLoaded', () => {
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
        removeButton.innerHTML = `<span class="icon-display icon-trash"></span>`;
        removeButton.onclick = () => {
          const updatedSites = siteList.filter(s => s !== site);
          chrome.storage.sync.set({ siteList: updatedSites });
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
    siteListTitle.textContent = isWhitelist ? 'List of enabled sites' : 'List of disabled sites';
  }

  function renderPage(data) {
    renderSites(data.siteList || []);
    updateFontToggleUI(data.fontType || 'sans');
    updateListModeUI(data.listMode || 'blacklist');
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