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
      settingsApiCacheInput: document.getElementById('setting-api-cache'),
      settingsButton: document.getElementById('settings-button')
    };
  }
  
  async init() {
    try {
      console.log('Initializing Torn Browser App...');
      
      // Load app settings
      this.loadSettings();
      
      // Initialize UI Manager
      await window.UI.init();
      
      // Initialize Profile Manager
      await window.ProfileManager.init();
      
      // Initialize API Client
      window.TornAPI.init();
      
      // Initialize Userscript Manager
      await window.UserscriptManager.init();
      
      // Initialize Browser Controls
      window.BrowserControls.init();
      
      // Setup app settings event listeners
      this.setupSettingsListeners();
      
      // Apply settings
      this.applySettings();
      
      // Navigate to last URL or default page
      window.BrowserControls.navigateToLastUrl();
      
      // Request notification permissions if needed
      this.requestNotificationPermission();
      
      console.log('Torn Browser App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }
  
  setupSettingsListeners() {
    // Settings button
    this.elements.settingsButton.addEventListener('click', () => {
      UI.openModal('settings-modal');
    });
    
    // Save settings button
    this.elements.saveSettingsButton.addEventListener('click', () => {
      this.saveSettings();
    });
    
    // Listen for events from main process
    window.tornAPI.onShowSettings(() => {
      UI.openModal('settings-modal');
    });
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
    
    // Initialize settings UI
    this.updateSettingsUI();
  }
  
  updateSettingsUI() {
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
      UI.toggleDarkMode(darkModeEnabled);
    }
    this.settings.darkMode = darkModeEnabled;
    
    // Apply sidebar visibility
    UI.showSidebar(this.settings.showSidebar);
    
    // Apply font size
    UI.setFontSize(this.settings.fontSize);
    
    // Store settings in local storage
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
    
    // Close modal
    UI.closeModal('settings-modal');
    Utils.showNotification('Settings saved');
  }
  
  applySettings() {
    // Apply font size
    UI.setFontSize(this.settings.fontSize);
    
    // Apply dark mode
    UI.toggleDarkMode(this.settings.darkMode);
    
    // Apply sidebar visibility
    UI.showSidebar(this.settings.showSidebar);
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