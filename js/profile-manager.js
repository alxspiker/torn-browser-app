// profile-manager.js - Manages user profile (single-profile only)
class ProfileManager {
  constructor() {
    this.profile = null;
    this.initialized = false;
    this.lastWebviewUrl = null; // Store previous webview URL for API key automation
    
    // UI elements will be initialized in init()
    this.elements = {};
  }

  // Call this before navigating to the API key creation page
  storeCurrentWebviewUrl() {
    const webview = window.BrowserControls && window.BrowserControls.webview;
    if (webview) {
      this.lastWebviewUrl = webview.getURL();
    }
  }

  // Call this after detecting the API key in the webview
  async handleDetectedApiKey(apiKey) {
    if (!apiKey) return;
    if (!this.profile) this.profile = {};
    this.profile.apiKey = apiKey;
    await this.saveProfile(true);
    this.updateProfileDisplay();
    if (window.Utils) window.Utils.showNotification('API key detected and saved!');
    // Return to previous page if available
    const webview = window.BrowserControls && window.BrowserControls.webview;
    if (webview && this.lastWebviewUrl) {
      webview.src = this.lastWebviewUrl;
      this.lastWebviewUrl = null;
    }
  }
  
  async init() {
    try {
      
      // Find UI elements after they're loaded by UI Manager
      this.elements = {
        // Profile edit elements
        profileNameInput: document.getElementById('profile-edit-name'),
        profileApiKeyInput: document.getElementById('profile-api-key'),
        darkModeCheckbox: document.getElementById('setting-dark-mode'),
        notificationsCheckbox: document.getElementById('setting-notifications'),
        autoRefreshCheckbox: document.getElementById('setting-auto-refresh'),
        refreshIntervalInput: document.getElementById('setting-refresh-interval'),
        refreshIntervalGroup: document.getElementById('refresh-interval-group'),
        saveProfileButton: document.getElementById('save-profile'),
        
        // Sidebar profile elements
        profileButton: document.getElementById('profile-button'),
        userNotes: document.getElementById('user-notes'),
        saveNotesButton: document.getElementById('save-notes'),
        profileAvatar: document.getElementById('profile-avatar'),
        profileName: document.getElementById('profile-name'),
        profileStatus: document.getElementById('profile-status')
      };
      
      // Verify if profile modal elements are available
      if (!this.elements.profileNameInput || !this.elements.profileApiKeyInput) {
        console.warn('Profile modal elements not found, they might not be loaded yet');
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load profile
      await this.loadProfile();
      
      this.initialized = true;
      
      return this;
    } catch (error) {
      console.error('Error initializing Profile Manager:', error);
      this.initializeDefaultProfile();
      return this;
    }
  }
  
  setupEventListeners() {
    // Only set up listeners for elements that exist

    if (this.elements.saveProfileButton) {
      this.elements.saveProfileButton.addEventListener('click', () => this.saveProfile());
    }
    
    if (this.elements.autoRefreshCheckbox && this.elements.refreshIntervalGroup) {
      this.elements.autoRefreshCheckbox.addEventListener('change', () => {
        this.elements.refreshIntervalGroup.style.display =
          this.elements.autoRefreshCheckbox.checked ? 'block' : 'none';
      });
    }
    
    if (this.elements.saveNotesButton) {
      this.elements.saveNotesButton.addEventListener('click', () => this.saveNotes());
    }
    
    // Listen for show profiles event
    if (window.tornAPI && window.tornAPI.onShowProfiles) {
      window.tornAPI.onShowProfiles(() => {
        if (window.UI) {
          window.UI.openModal('profile-modal');
        }
      });
    }

    // Make API key status clickable if API key is missing
    const profileStatus = this.elements.profileStatus;
    if (profileStatus) {
      profileStatus.addEventListener('click', () => {
        if (!this.profile || !this.profile.apiKey) {
          if (window.UI) window.UI.openModal('profile-modal');
        }
      });
    }
    // API key creation UI logic
    const accessSelect = document.getElementById('api-key-access');
    const customScopes = document.getElementById('api-key-custom-scopes');
    if (accessSelect && customScopes) {
      accessSelect.addEventListener('change', () => {
        if (accessSelect.value === 'custom') {
          customScopes.style.display = '';
        } else {
          customScopes.style.display = 'none';
        }
      });
    }
    const createApiKeyBtn = document.getElementById('create-api-key-btn');
    if (createApiKeyBtn && accessSelect && customScopes) {
      createApiKeyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.storeCurrentWebviewUrl();
        let url = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=Torn%20Browser%20Key';
        if (accessSelect.value === 'public') url += '&type=1';
        else if (accessSelect.value === 'minimal') url += '&type=2';
        else if (accessSelect.value === 'limited') url += '&type=3';
        else if (accessSelect.value === 'full') url += '&type=4';
        else if (accessSelect.value === 'custom') {
          // Collect all selected custom scopes
          const selected = Array.from(customScopes.selectedOptions).map(opt => opt.value);
          if (selected.length > 0) {
            // Group by user, faction, torn
            const user = selected.filter(s => s.startsWith('user:')).map(s => s.replace('user:', ''));
            const faction = selected.filter(s => s.startsWith('faction:')).map(s => s.replace('faction:', ''));
            const torn = selected.filter(s => s.startsWith('torn:')).map(s => s.replace('torn:', ''));
            if (user.length) url += `&user=${user.join(',')}`;
            if (faction.length) url += `&faction=${faction.join(',')}`;
            if (torn.length) url += `&torn=${torn.join(',')}`;
          }
        }
        // Navigate the webview instead of opening a new window
        const webview = window.BrowserControls && window.BrowserControls.webview;
        if (webview) {
          webview.src = url;
        }
      });
    }

    const viewApiKeysBtn = document.getElementById('view-api-keys-btn');
    if (viewApiKeysBtn) {
      viewApiKeysBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.UI) window.UI.closeModal('profile-modal');
        const webview = window.BrowserControls && window.BrowserControls.webview;
        if (webview) {
          webview.src = 'https://www.torn.com/preferences.php#tab=api';
        }
      });
    }
  }
  
  async loadProfile() {
    try {
      // Load profile
      this.profile = await window.tornAPI.getProfile();
      
      // If no profile exists, create a default one
      if (!this.profile) {
        this.profile = await this.initializeDefaultProfile();
      }
      
      // Update profile display
      this.updateProfileDisplay();
      
      // Load user notes from profile
      if (this.profile && this.profile.notes && this.elements.userNotes) {
        this.elements.userNotes.value = this.profile.notes;
      }
      
      // Apply dark mode if enabled
      if (this.profile && this.profile.settings && this.profile.settings.darkMode) {
        if (window.UI) {
          window.UI.toggleDarkMode(true);
        } else {
          // Fallback for direct DOM manipulation if UI manager is not available
          document.body.classList.add('dark-theme');
          document.body.classList.remove('light-theme');
        }
      } else {
        if (window.UI) {
          window.UI.toggleDarkMode(false);
        } else {
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
        }
      }
      
      // Set up auto-refresh if enabled
      if (this.profile && this.profile.settings && this.profile.settings.autoRefresh) {
        if (window.TornAPI) {
          window.TornAPI.startStatsRefresh(this.profile.settings.refreshInterval || 60);
        }
      }
      
      // Fetch Torn stats if API key is available
      if (this.profile && this.profile.apiKey && window.TornAPI) {
        window.TornAPI.fetchTornStats();
      }
      
      // Also update app settings with dark mode preference
      this.updateAppSettings();
      
      return this.profile;
    } catch (err) {
      console.error('Failed to load profile:', err);
      await this.initializeDefaultProfile();
      return this.profile;
    }
  }
  
  updateAppSettings() {
    // Make sure dark mode setting is consistent with profile
    if (!this.profile || !this.profile.settings) return;
    
    try {
      const appSettings = localStorage.getItem('appSettings');
      if (appSettings) {
        const settings = JSON.parse(appSettings);
        if (settings.darkMode !== this.profile.settings.darkMode) {
          settings.darkMode = this.profile.settings.darkMode;
          localStorage.setItem('appSettings', JSON.stringify(settings));
        }
      }
    } catch (error) {
      console.error('Error updating app settings:', error);
    }
  }
  
  async initializeDefaultProfile() {
    // Create a default profile if none exists
    const defaultProfile = {
      id: 'default',
      name: 'Torn Player',
      apiKey: '',
      userscripts: [],
      settings: {
        darkMode: true, // Set dark mode to true by default
        notifications: true,
        autoRefresh: false,
        refreshInterval: 60
      },
      notes: ''
    };
    
    try {
      await window.tornAPI.saveProfile(defaultProfile);
      this.profile = defaultProfile;
      this.updateProfileDisplay();
      
      // Apply dark mode
      if (window.UI) {
        window.UI.toggleDarkMode(true);
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      }
      
      return defaultProfile;
    } catch (error) {
      console.error('Failed to create default profile:', error);
      return null;
    }
  }
  
  updateProfileDisplay() {
    if (!this.profile) return;
    // Update avatar and name in sidebar
    if (this.elements.profileAvatar && this.elements.profileName && this.elements.profileStatus) {
      // Always clear the avatar element first
      this.elements.profileAvatar.innerHTML = '';
      if (this.profile.avatar) {
        this.elements.profileAvatar.innerHTML = `<img src="${this.profile.avatar}" alt="avatar" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;">`;
      } else {
        this.elements.profileAvatar.textContent = this.profile.name.charAt(0).toUpperCase();
      }
      this.elements.profileName.textContent = this.profile.name;
      this.elements.profileStatus.textContent = this.profile.apiKey ? 'Connected' : 'API Key Required';
    }
    // Profile modal avatar (if present)
    const modalAvatar = document.getElementById('profile-modal-avatar');
    if (modalAvatar && this.profile.avatar) {
      modalAvatar.src = this.profile.avatar;
      modalAvatar.style.display = '';
    } else if (modalAvatar) {
      modalAvatar.style.display = 'none';
    }
    // Fill modal fields if available
    if (this.elements.profileNameInput) {
      this.elements.profileNameInput.value = this.profile.name;
    }
    
    if (this.elements.profileApiKeyInput) {
      this.elements.profileApiKeyInput.value = this.profile.apiKey || '';
    }
    
    // Set profile settings if available
    if (this.profile.settings) {
      if (this.elements.darkModeCheckbox) {
        this.elements.darkModeCheckbox.checked = this.profile.settings.darkMode || false;
      }
      
      if (this.elements.notificationsCheckbox) {
        this.elements.notificationsCheckbox.checked = this.profile.settings.notifications !== false;
      }
      
      if (this.elements.autoRefreshCheckbox) {
        this.elements.autoRefreshCheckbox.checked = this.profile.settings.autoRefresh || false;
      }
      
      if (this.elements.refreshIntervalInput) {
        this.elements.refreshIntervalInput.value = this.profile.settings.refreshInterval || 60;
      }
      
      if (this.elements.refreshIntervalGroup) {
        this.elements.refreshIntervalGroup.style.display = this.profile.settings.autoRefresh ? 'block' : 'none';
      }
    }
  }
  
  async saveProfile(skipModalFields = false) {
    if (!this.profile) return;
    if (!skipModalFields) {
      // Update profile data from modal fields
      this.profile.name = this.elements.profileNameInput.value.trim() || 'Torn Player';
      this.profile.apiKey = this.elements.profileApiKeyInput.value.trim();
      // Update settings
      this.profile.settings = {
        darkMode: this.elements.darkModeCheckbox.checked,
        notifications: this.elements.notificationsCheckbox.checked,
        autoRefresh: this.elements.autoRefreshCheckbox.checked,
        refreshInterval: parseInt(this.elements.refreshIntervalInput.value, 10) || 60
      };
    }
    // Save to store
    await window.tornAPI.saveProfile(this.profile);
    // Reload profile
    await this.loadProfile();
    // Close modal
    if (window.UI && !skipModalFields) {
      window.UI.closeModal('profile-modal');
    }
    if (window.Utils && !skipModalFields) {
      window.Utils.showNotification('Profile saved');
    }
  }
  
  saveNotes() {
    if (!this.profile || !this.elements.userNotes) return;
    
    this.profile.notes = this.elements.userNotes.value;
    this.saveProfile();
    
    if (window.Utils) {
      window.Utils.showNotification('Notes saved');
    }
  }
  
  async extractTornUserInfoFromWebview() {
    try {
      const webview = window.BrowserControls && window.BrowserControls.webview;
      if (!webview) return;
      // Execute JS in the webview to get the torn-user input value
      const userInfoJson = await webview.executeJavaScript(`
        (function() {
          var el = document.getElementById('torn-user');
          return el ? el.value : null;
        })();
      `);
      if (!userInfoJson) return;
      const userInfo = JSON.parse(userInfoJson);
      if (!userInfo || !userInfo.id) return;
      // Update profile fields
      if (!this.profile) this.profile = {};
      this.profile.tornId = userInfo.id;
      this.profile.name = userInfo.playername;
      this.profile.avatar = userInfo.avatar;
      this.profile.role = userInfo.role;
      await this.saveProfile(true);
      this.updateProfileDisplay();
      // No notification or console log
    } catch (e) {
      console.error('Failed to extract Torn user info:', e);
    }
  }
  
  getActiveProfile() {
    return this.profile;
  }
}

// Create global ProfileManager instance
window.ProfileManager = new ProfileManager();