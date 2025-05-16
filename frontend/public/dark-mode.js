// Global dark mode handler
window.darkMode = {
  // Check if dark mode is currently active
  isDark: function() {
    return document.documentElement.classList.contains('dark');
  },

  // Enable dark mode
  enable: function(forceRefresh = false) {
    console.log('Enabling dark mode');
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
    console.log('Dark mode enabled');
    
    if (forceRefresh) {
      console.log('Force refreshing page');
      window.location.reload();
    }
  },

  // Disable dark mode  
  disable: function(forceRefresh = false) {
    console.log('Disabling dark mode');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
    console.log('Dark mode disabled');
    
    if (forceRefresh) {
      console.log('Force refreshing page');
      window.location.reload();
    }
  },

  // Toggle dark mode
  toggle: function(forceRefresh = false) {
    console.log('Toggling dark mode, current state:', this.isDark());
    if (this.isDark()) {
      this.disable(forceRefresh);
    } else {
      this.enable(forceRefresh);
    }
    return this.isDark();
  },

  // Initialize dark mode from localStorage
  initialize: function() {
    console.log('Initializing dark mode');
    const savedMode = localStorage.getItem('darkMode');
    console.log('Saved mode:', savedMode);
    
    if (savedMode === 'true') {
      this.enable();
    } else {
      this.disable();
    }
    
    console.log('Dark mode initialized, current state:', this.isDark());
  }
};

// Initialize dark mode on page load
window.darkMode.initialize(); 