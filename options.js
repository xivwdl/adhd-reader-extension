document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const sitesList = document.getElementById('disabled-sites-list');
  const emptyMessage = document.getElementById('empty-message');
  const fontToggle = document.getElementById('font-type-toggle');
  const sansLabel = document.getElementById('font-sans-label');
  const serifLabel = document.getElementById('font-serif-label');

  // --- Functions ---
  function renderSites(disabledSites) {
    sitesList.innerHTML = '';
    if (disabledSites && disabledSites.length > 0) {
      emptyMessage.style.display = 'none';
      disabledSites.forEach(site => {
        const listItem = document.createElement('li');
        // Create a link
        const link = document.createElement('a');
        link.href = site.startsWith('http') ? site : 'https://' + site;
        link.textContent = site;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.flex = '1 1 auto';
        link.style.overflowWrap = 'anywhere';
        link.style.color = 'inherit';
        link.style.textDecoration = 'underline';
        // Remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.innerHTML = `<span class="icon-display icon-trash"></span>`;
        removeButton.onclick = () => {
          const updatedSites = disabledSites.filter(s => s !== site);
          chrome.storage.sync.set({ disabledSites: updatedSites });
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

  // --- Initial Load ---
  chrome.storage.sync.get(['disabledSites', 'fontType'], (data) => {
    renderSites(data.disabledSites || []);
    updateFontToggleUI(data.fontType || 'sans');
  });

  // --- Event Listeners ---
  fontToggle.addEventListener('change', (event) => {
    const newFontType = event.target.checked ? 'serif' : 'sans';
    chrome.storage.sync.set({ fontType: newFontType });
  });

  // --- Storage Change Listener ---
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.disabledSites) {
        renderSites(changes.disabledSites.newValue || []);
      }
      if (changes.fontType) {
        updateFontToggleUI(changes.fontType.newValue);
      }
    }
  });
}); 