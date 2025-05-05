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
      settingsApiCacheInput: null,
      settingsButton: null
    };
    
    this.initialized = false;
  }
  
  async init() {
    try {
      console.log('Initializing Torn Browser App...');
      
      // Load app settings
      this.loadSettings();
      
      // Initialize UI Manager first
      await window.UI.init();
      
      // Get settings button reference after UI is initialized
      this.elements.settingsButton = document.getElementById('settings-button');
      
      // Initialize Profile Manager
      await window.ProfileManager?.init();
      
      // Initialize API Client
      if (window.TornAPI) {
        window.TornAPI.init();
      }
      
      // Initialize Userscript Manager
      if (window.UserscriptManager) {
        await window.UserscriptManager.init();
      }
      
      // Initialize Browser Controls
      if (window.BrowserControls) {
        window.BrowserControls.init();
      }
      
      // Initialize settings elements references
      this.initSettingsElements();
      
      // Setup app settings event listeners
      this.setupSettingsListeners();
      
      // Apply settings
      this.applySettings();
      
      // Navigate to last URL or default page
      if (window.BrowserControls) {
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
      settingsDarkModeCheckbox: document.getElementById('setting-dark-mode'),
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
    
    // Update settings UI with current values
    this.updateSettingsUI();
  }
  
  setupSettingsListeners() {
    // Settings button
    if (this.elements.settingsButton) {
      this.elements.settingsButton.addEventListener('click', () => {
        if (window.UI) {
          window.UI.openModal('settings-modal');
        }
      });
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
    // Update settings UI with current values
    if (this.elements.settingsDarkModeCheckbox) {
      this.elements.settingsDarkModeCheckbox.checked = this.settings.darkMode;
    }
    
    if (this.elements.settingsRememberUrlCheckbox) {
      this.elements.settingsRememberUrlCheckbox.checked = this.settings.rememberLastUrl;
    }
    
    if (this.elements.settingsClearCacheCheckbox) {
      this.elements.settingsClearCacheCheckbox.checked = this.settings.clearCacheOnExit;
    }
    
    if (this.elements.settingsDefaultPageInput) {
      this.elements.settingsDefaultPageInput.value = this.settings.defaultPage;
    }
    
    if (this.elements.settingsShowSidebarCheckbox) {
      this.elements.settingsShowSidebarCheckbox.checked = this.settings.showSidebar;
    }
    
    if (this.elements.settingsFontSizeSelect) {
      this.elements.settingsFontSizeSelect.value = this.settings.fontSize;
    }
    
    if (this.elements.settingsAutoRefreshStatsCheckbox) {
      this.elements.settingsAutoRefreshStatsCheckbox.checked = this.settings.autoRefreshStats;
    }
    
    if (this.elements.settingsEventNotificationsCheckbox) {
      this.elements.settingsEventNotificationsCheckbox.checked = this.settings.eventNotifications;
    }
    
    if (this.elements.settingsEnergyNotificationsCheckbox) {
      this.elements.settingsEnergyNotificationsCheckbox.checked = this.settings.energyNotifications;
    }
    
    if (this.elements.settingsApiCacheInput) {
      this.elements.settingsApiCacheInput.value = this.settings.apiCacheDuration;
    }
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

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});