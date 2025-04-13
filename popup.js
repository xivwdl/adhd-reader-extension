document.addEventListener('DOMContentLoaded', function() {
  const dropdown = document.getElementById('font-dropdown');
  const dropdownTrigger = document.getElementById('dropdown-trigger');
  const selectedFontText = document.getElementById('selected-font');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const toggleButton = document.getElementById('toggle-extension');
  
  // Toggle dropdown
  dropdownTrigger.addEventListener('click', function() {
    dropdown.classList.toggle('open');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove('open');
    }
  });
  
  // Get the current font preference and extension status
  chrome.runtime.sendMessage({action: "getFontPreference"}, function(response) {
    if (response && response.fontType) {
      updateSelectedFont(response.fontType);
    }
  });
  
  // Get extension enabled status
  chrome.runtime.sendMessage({action: "getExtensionStatus"}, function(response) {
    if (response && response.hasOwnProperty('enabled')) {
      updateToggleButton(response.enabled);
    }
  });
  
  // Handle dropdown item selection
  dropdownItems.forEach(function(item) {
    item.addEventListener('click', function() {
      const fontType = this.getAttribute('data-value');
      updateSelectedFont(fontType);
      
      // Send message to background script
      chrome.runtime.sendMessage({action: "setFont", fontType: fontType}, function(response) {
        // Also update current tab immediately
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            try {
              chrome.tabs.sendMessage(tabs[0].id, {action: "setFont", fontType: fontType});
            } catch (error) {
              // Ignore errors for tabs that don't have content scripts
            }
          }
        });
      });
      
      // Close dropdown
      dropdown.classList.remove('open');
    });
  });
  
  // Handle toggle button click
  toggleButton.addEventListener('click', function() {
    // Get current state from button text
    const isCurrentlyEnabled = toggleButton.textContent === 'Disable Extension';
    const newState = !isCurrentlyEnabled;
    
    // Update button UI
    updateToggleButton(newState);
    
    // Send message to background script to update all tabs
    chrome.runtime.sendMessage({
      action: "setExtensionStatus", 
      enabled: newState
    });
  });
  
  // Update the toggle button UI
  function updateToggleButton(enabled) {
    if (enabled) {
      toggleButton.textContent = 'Disable Extension';
    } else {
      toggleButton.textContent = 'Enable Extension';
    }
  }
  
  // Update the selected font in the UI
  function updateSelectedFont(fontType) {
    // Update the selected text
    selectedFontText.textContent = fontType === 'serif' ? 'Serif' : 'Sans Serif';
    
    // Update active state on dropdown items
    dropdownItems.forEach(function(item) {
      if (item.getAttribute('data-value') === fontType) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}); 