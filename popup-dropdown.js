// Dropdown functionality for font selection
document.addEventListener('DOMContentLoaded', function() {
  const dropdownTrigger = document.getElementById('font-dropdown-trigger');
  const dropdownContent = document.getElementById('font-dropdown-content');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const fontToggle = document.getElementById('font-toggle');
  const fontType = document.getElementById('font-type');
  
  // Toggle dropdown visibility
  dropdownTrigger.addEventListener('click', function() {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', !expanded);
    dropdownContent.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!dropdownTrigger.contains(event.target) && !dropdownContent.contains(event.target)) {
      dropdownTrigger.setAttribute('aria-expanded', 'false');
      dropdownContent.classList.remove('show');
    }
  });
  
  // Handle dropdown item selection
  dropdownItems.forEach(item => {
    item.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      fontType.textContent = value === 'serif' ? 'Serif' : 'Sans';
      
      // Update the hidden checkbox to maintain compatibility with existing JS
      fontToggle.checked = value === 'serif';
      
      // Trigger the change event on the checkbox
      const event = new Event('change');
      fontToggle.dispatchEvent(event);
      
      // Close the dropdown
      dropdownTrigger.setAttribute('aria-expanded', 'false');
      dropdownContent.classList.remove('show');
      
      // Update selected state
      dropdownItems.forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  
  // Set initial selected state based on font-toggle
  function updateSelectedState() {
    const value = fontToggle.checked ? 'serif' : 'sans';
    dropdownItems.forEach(item => {
      if (item.getAttribute('data-value') === value) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  // Update selected state when font-toggle changes
  fontToggle.addEventListener('change', updateSelectedState);
  
  // Set initial state
  setTimeout(updateSelectedState, 100);
}); 