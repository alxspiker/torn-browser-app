// app.js - Main application initialization
class App {
  constructor() {
    this.settings = {
      darkMode: false,
      rememberLastUrl: true,
      clearCacheOnExit: false,
      defaultPage: 'https://www.torn.com',
      showSidebar: true,
      fontSize: 'medium',
      autoRefreshStats: true,
      eventNotifications: true,
      energyNotifications: true,
      apiCacheDuration: 5
    };
    
    // UI elements for settings
    this.elements = {
      saveSettingsButton: null,
      settingsDarkModeCheckbox: null,
      settingsRememberUrlCheckbox: null,
      settingsClearCacheCheckbox: null,
      settingsDefaultPageInput: null,
      settingsShowSidebarCheckbox: null,
      settingsFontSizeSelect: null,
      settingsAutoRefreshStatsCheckbox: null,
      settingsEventNotificationsCheckbox: null,
      settingsEnergyNotificationsCheckbox: null,
      settingsApiCacheInput: null
    };
    
    this.initialized = false;
  }
  
  async init() {
    try {
      console.log('Initializing Torn Browser App...');
      
      // Load app settings
      this.loadSettings();
      
      // Initialize components in the correct order
      
      // 1. First, initialize UI Manager - this loads templates and modals
      console.log('Step 1: Initializing UI Manager...');
      if (!window.UI) {
        console.error('UI Manager not available');
        return;
      }
      
      await window.UI.init();
      console.log('UI Manager initialized');
      
      // 2. Initialize Profile Manager
      console.log('Step 2: Initializing Profile Manager...');
      if (!window.ProfileManager) {
        console.error('Profile Manager not available');
        return;
      }
      
      await window.ProfileManager.init();
      console.log('Profile Manager initialized');
      
      // 3. Initialize API Client
      console.log('Step 3: Initializing API Client...');
      if (window.TornAPI) {
        window.TornAPI.init();
        console.log('API Client initialized');
      } else {
        console.error('API Client not available');
      }
      
      // 4. Initialize Userscript Manager
      console.log('Step 4: Initializing Userscript Manager...');
      if (window.UserscriptManager) {
        await window.UserscriptManager.init();
        console.log('Userscript Manager initialized');
      } else {
        console.error('Userscript Manager not available');
      }
      
      // 5. Initialize Browser Controls - IMPORTANT: Wait for Browser Controls reference
      console.log('Step 5: Initializing Browser Controls...');
      if (window.BrowserControls) {
        window.BrowserControls.init();
        console.log('Browser Controls initialized');
      } else {
        console.error('Browser Controls not available');
        // Initialize BrowserControls if it's not already done
        window.BrowserControls = new BrowserControls();
        if (window.BrowserControls) {
          window.BrowserControls.init();
          console.log('Browser Controls initialized after recovery');
        }
      }
      
      // Initialize settings elements references
      console.log('Step 6: Initializing settings UI...');
      this.initSettingsElements();
      
      // Setup app settings event listeners
      this.setupSettingsListeners();
      
      // Apply settings
      this.applySettings();
      
      // Navigate to last URL or default page
      if (window.BrowserControls) {
        console.log('Navigating to initial page...');
        window.BrowserControls.navigateToLastUrl();
      }
      
      // Request notification permissions if needed
      this.requestNotificationPermission();
      
      this.initialized = true;
      console.log('Torn Browser App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }
  
  initSettingsElements() {
    // Initialize settings UI elements
    this.elements = {
      ...this.elements,
      saveSettingsButton: document.getElementById('save-settings'),
      settingsDarkModeCheckbox: document.getElementById('setting-dark-mode-app'),
      settingsRememberUrlCheckbox: document.getElementById('setting-remember-last-url'),
      settingsClearCacheCheckbox: document.getElementById('setting-clear-cache-on-exit'),
      settingsDefaultPageInput: document.getElementById('setting-default-page'),
      settingsShowSidebarCheckbox: document.getElementById('setting-show-sidebar'),
      settingsFontSizeSelect: document.getElementById('setting-font-size'),
      settingsAutoRefreshStatsCheckbox: document.getElementById('setting-auto-refresh-stats'),
      settingsEventNotificationsCheckbox: document.getElementById('setting-event-notifications'),
      settingsEnergyNotificationsCheckbox: document.getElementById('setting-energy-notifications'),
      settingsApiCacheInput: document.getElementById('setting-api-cache')
    };
    
    // Check if all elements were found
    const missingElements = Object.entries(this.elements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);
    
    if (missingElements.length > 0) {
      console.warn('Some settings UI elements were not found:', missingElements.join(', '));
    }
    
    // Update settings UI with current values
    this.updateSettingsUI();
  }
  
  setupSettingsListeners() {
    // Get a fresh reference to the settings button
    const settingsButton = document.getElementById('settings-button');
    
    // Settings button
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        if (window.UI) {
          window.UI.openModal('settings-modal');
        }
      });
    } else {
      console.warn('Settings button not found');
    }
    
    // Save settings button
    if (this.elements.saveSettingsButton) {
      this.elements.saveSettingsButton.addEventListener('click', () => {
        this.saveSettings();
      });
    }
    
    // Listen for events from main process
    if (window.tornAPI && window.tornAPI.onShowSettings) {
      window.tornAPI.onShowSettings(() => {
        if (window.UI) {
          window.UI.openModal('settings-modal');
        }
      });
    }
  }
  
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsedSettings };
      }
    } catch (err) {
      console.error('Failed to load app settings:', err);
    }
  }
  
  updateSettingsUI() {
    // Skip if elements are not initialized
    if (!this.elements.settingsDarkModeCheckbox) {
      console.warn('Settings UI elements not initialized');
      return;
    }
    
    // Update settings UI with current values
    this.elements.settingsDarkModeCheckbox.checked = this.settings.darkMode;
    this.elements.settingsRememberUrlCheckbox.checked = this.settings.rememberLastUrl;
    this.elements.settingsClearCacheCheckbox.checked = this.settings.clearCacheOnExit;
    this.elements.settingsDefaultPageInput.value = this.settings.defaultPage;
    this.elements.settingsShowSidebarCheckbox.checked = this.settings.showSidebar;
    this.elements.settingsFontSizeSelect.value = this.settings.fontSize;
    this.elements.settingsAutoRefreshStatsCheckbox.checked = this.settings.autoRefreshStats;
    this.elements.settingsEventNotificationsCheckbox.checked = this.settings.eventNotifications;
    this.elements.settingsEnergyNotificationsCheckbox.checked = this.settings.energyNotifications;
    this.elements.settingsApiCacheInput.value = this.settings.apiCacheDuration;
  }
  
  saveSettings() {
    // Check if the settings UI elements are available
    if (!this.elements.settingsRememberUrlCheckbox) {
      console.error('Settings UI elements not initialized');
      return;
    }
    
    // Save general settings
    this.settings.rememberLastUrl = this.elements.settingsRememberUrlCheckbox.checked;
    this.settings.clearCacheOnExit = this.elements.settingsClearCacheCheckbox.checked;
    this.settings.defaultPage = this.elements.settingsDefaultPageInput.value;
    this.settings.showSidebar = this.elements.settingsShowSidebarCheckbox.checked;
    this.settings.fontSize = this.elements.settingsFontSizeSelect.value;
    this.settings.autoRefreshStats = this.elements.settingsAutoRefreshStatsCheckbox.checked;
    this.settings.eventNotifications = this.elements.settingsEventNotificationsCheckbox.checked;
    this.settings.energyNotifications = this.elements.settingsEnergyNotificationsCheckbox.checked;
    this.settings.apiCacheDuration = parseInt(this.elements.settingsApiCacheInput.value) || 5;
    
    // Apply dark mode if changed
    const darkModeEnabled = this.elements.settingsDarkModeCheckbox.checked;
    if (darkModeEnabled !== this.settings.darkMode) {
      if (window.UI) {
        window.UI.toggleDarkMode(darkModeEnabled);
      }
    }
    this.settings.darkMode = darkModeEnabled;
    
    // Apply sidebar visibility
    if (window.UI) {
      window.UI.showSidebar(this.settings.showSidebar);
    }
    
    // Apply font size
    if (window.UI) {
      window.UI.setFontSize(this.settings.fontSize);
    }
    
    // Apply auto-refresh settings for stats
    if (window.TornAPI) {
      if (this.settings.autoRefreshStats) {
        window.TornAPI.startStatsRefresh(this.settings.apiCacheDuration * 60);
      } else {
        window.TornAPI.stopStatsRefresh();
      }
    }
    
    // Store settings in local storage
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
    
    // Close modal
    if (window.UI) {
      window.UI.closeModal('settings-modal');
    }
    
    if (window.Utils) {
      window.Utils.showNotification('Settings saved');
    }
  }
  
  applySettings() {
    if (!window.UI) {
      console.error('UI Manager not initialized, cannot apply settings');
      return;
    }
    
    // Apply font size
    window.UI.setFontSize(this.settings.fontSize);
    
    // Apply dark mode
    window.UI.toggleDarkMode(this.settings.darkMode);
    
    // Apply sidebar visibility
    window.UI.showSidebar(this.settings.showSidebar);
    
    // Apply auto-refresh settings
    if (window.TornAPI && this.settings.autoRefreshStats) {
      window.TornAPI.startStatsRefresh(this.settings.apiCacheDuration * 60);
    }
  }
  
  requestNotificationPermission() {
    if (this.settings.eventNotifications || this.settings.energyNotifications) {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }
  
  getSettings() {
    return this.settings;
  }
}

// Create and initialize global App instance
window.App = new App();

// Make sure BrowserControls constructor is globally available
if (typeof BrowserControls === 'undefined') {
  // This is a fallback BrowserControls class if it's not defined elsewhere
  class BrowserControls {
    constructor() {
      this.webview = null;
      this.elements = {};
      this.defaultUrl = 'https://www.torn.com';
      this.initialized = false;
    }
    
    init() {
      try {
        console.log('Initializing Browser Controls (fallback)...');
        
        // Get webview reference
        this.webview = document.getElementById('browser-view');
        
        if (!this.webview) {
          console.error('Browser webview element not found');
          return this;
        }
        
        // Basic UI elements
        this.elements = {
          urlInput: document.getElementById('url-input'),
          goButton: document.getElementById('go-button'),
          backButton: document.getElementById('back-button'),
          forwardButton: document.getElementById('forward-button'),
          reloadButton: document.getElementById('reload-button')
        };
        
        this.initialized = true;
        console.log('Browser controls initialized (fallback)');
        
        return this;
      } catch (error) {
        console.error('Error initializing browser controls:', error);
        return this;
      }
    }
    
    navigateToLastUrl() {
      try {
        // Simple fallback navigation
        this.webview.src = 'https://www.torn.com';
      } catch (error) {
        console.error('Error navigating to default URL:', error);
      }
    }
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Wait a short time to ensure all scripts are loaded
  setTimeout(async () => {
    await window.App.init();
  }, 100);
});