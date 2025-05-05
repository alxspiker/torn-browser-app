// profile-manager.js - Manages user profiles
class ProfileManager {
  constructor() {
    this.profile = null;
    this.allProfiles = [];
    this.editingProfileId = null;
    this.initialized = false;
    
    // UI elements will be initialized in init()
    this.elements = {};
  }
  
  async init() {
    try {
      console.log('Initializing Profile Manager...');
      
      // Find UI elements after they're loaded by UI Manager
      this.elements = {
        // Profile edit elements
        profilesList: document.getElementById('profiles-list'),
        createProfileButton: document.getElementById('create-profile'),
        profileNameInput: document.getElementById('profile-edit-name'),
        profileApiKeyInput: document.getElementById('profile-api-key'),
        darkModeCheckbox: document.getElementById('setting-dark-mode'),
        notificationsCheckbox: document.getElementById('setting-notifications'),
        autoRefreshCheckbox: document.getElementById('setting-auto-refresh'),
        refreshIntervalInput: document.getElementById('setting-refresh-interval'),
        refreshIntervalGroup: document.getElementById('refresh-interval-group'),
        saveProfileButton: document.getElementById('save-profile'),
        deleteProfileButton: document.getElementById('delete-profile'),
        profileTabs: document.querySelectorAll('.tab[data-tab]'),
        
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
      
      // Load active profile
      await this.loadProfiles();
      
      this.initialized = true;
      console.log('Profile Manager initialized');
      
      return this;
    } catch (error) {
      console.error('Error initializing Profile Manager:', error);
      this.initializeDefaultProfile();
      return this;
    }
  }
  
  setupEventListeners() {
    // Only set up listeners for elements that exist
    if (this.elements.profileButton) {
      this.elements.profileButton.addEventListener('click', () => {
        if (window.UI) {
          window.UI.openModal('profile-modal');
        }
      });
    }
    
    if (this.elements.saveProfileButton) {
      this.elements.saveProfileButton.addEventListener('click', () => this.saveProfile());
    }
    
    if (this.elements.createProfileButton) {
      this.elements.createProfileButton.addEventListener('click', () => this.createNewProfile());
    }
    
    if (this.elements.deleteProfileButton) {
      this.elements.deleteProfileButton.addEventListener('click', () => this.deleteProfile());
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
    
    // Setup event listener for profile change from main process
    if (window.tornAPI && window.tornAPI.onProfileChanged) {
      window.tornAPI.onProfileChanged((profileId) => {
        this.loadProfiles();
      });
    }
    
    // Listen for show profiles event
    if (window.tornAPI && window.tornAPI.onShowProfiles) {
      window.tornAPI.onShowProfiles(() => {
        if (window.UI) {
          window.UI.openModal('profile-modal');
        }
      });
    }
  }
  
  async loadProfiles() {
    try {
      // Load all profiles and active profile
      this.allProfiles = await window.tornAPI.getProfiles();
      this.profile = await window.tornAPI.getActiveProfile();
      
      // Render profiles list
      this.renderProfiles();
      
      // Update profile display
      this.updateProfileDisplay();
      
      // Load user notes from active profile
      if (this.profile && this.profile.notes && this.elements.userNotes) {
        this.elements.userNotes.value = this.profile.notes;
      }
      
      // Apply dark mode if enabled
      if (this.profile && this.profile.settings && this.profile.settings.darkMode) {
        if (window.UI) {
          window.UI.toggleDarkMode(true);
        }
      } else {
        if (window.UI) {
          window.UI.toggleDarkMode(false);
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
      
      return this.profile;
    } catch (err) {
      console.error('Failed to load profiles:', err);
      await this.initializeDefaultProfile();
      return this.profile;
    }
  }
  
  async initializeDefaultProfile() {
    // Create a default profile if none exists
    const defaultProfile = {
      id: 'default',
      name: 'Default',
      apiKey: '',
      userscripts: [],
      settings: {
        darkMode: false,
        notifications: true,
        autoRefresh: false,
        refreshInterval: 60
      },
      notes: ''
    };
    
    try {
      await window.tornAPI.saveProfile(defaultProfile);
      this.profile = defaultProfile;
      this.allProfiles = [defaultProfile];
      this.updateProfileDisplay();
      return defaultProfile;
    } catch (error) {
      console.error('Failed to create default profile:', error);
      return null;
    }
  }
  
  renderProfiles() {
    if (!this.elements.profilesList || !this.allProfiles || !this.profile) return;
    
    // Clear existing profiles
    this.elements.profilesList.innerHTML = '';
    
    // Add each profile to the list
    this.allProfiles.forEach(profile => {
      const li = document.createElement('li');
      li.className = 'profile-list-item' + (profile.id === this.profile.id ? ' active' : '');
      li.innerHTML = `
        <span>${profile.name}</span>
        <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.85em;">Edit</button>
      `;
      
      // Add event listeners
      li.querySelector('span').addEventListener('click', () => {
        window.tornAPI.setActiveProfile(profile.id);
      });
      
      li.querySelector('button').addEventListener('click', () => {
        this.editProfile(profile);
      });
      
      this.elements.profilesList.appendChild(li);
    });
  }
  
  updateProfileDisplay() {
    if (!this.profile) return;
    
    // Update avatar and name in sidebar
    if (this.elements.profileAvatar && this.elements.profileName && this.elements.profileStatus) {
      this.elements.profileAvatar.textContent = this.profile.name.charAt(0).toUpperCase();
      this.elements.profileName.textContent = this.profile.name;
      this.elements.profileStatus.textContent = this.profile.apiKey ? 'Connected' : 'API Key Required';
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
  
  editProfile(profile) {
    this.editingProfileId = profile.id;
    
    if (this.elements.profileNameInput) {
      this.elements.profileNameInput.value = profile.name;
    }
    
    if (this.elements.profileApiKeyInput) {
      this.elements.profileApiKeyInput.value = profile.apiKey || '';
    }
    
    // Set profile settings
    if (profile.settings) {
      if (this.elements.darkModeCheckbox) {
        this.elements.darkModeCheckbox.checked = profile.settings.darkMode || false;
      }
      
      if (this.elements.notificationsCheckbox) {
        this.elements.notificationsCheckbox.checked = profile.settings.notifications !== false;
      }
      
      if (this.elements.autoRefreshCheckbox) {
        this.elements.autoRefreshCheckbox.checked = profile.settings.autoRefresh || false;
      }
      
      if (this.elements.refreshIntervalInput) {
        this.elements.refreshIntervalInput.value = profile.settings.refreshInterval || 60;
      }
      
      if (this.elements.refreshIntervalGroup) {
        this.elements.refreshIntervalGroup.style.display = profile.settings.autoRefresh ? 'block' : 'none';
      }
    }
    
    // Switch to edit tab and show delete button if multiple profiles exist
    const editTab = document.querySelector('.tab[data-tab="profile-edit"]');
    if (editTab && window.UI) {
      window.UI.switchTab(editTab);
    }
    
    if (this.elements.deleteProfileButton) {
      this.elements.deleteProfileButton.style.display = this.allProfiles.length > 1 ? 'block' : 'none';
    }
  }
  
  createNewProfile() {
    const newId = 'profile_' + Date.now();
    this.editingProfileId = newId;
    
    if (this.elements.profileNameInput) {
      this.elements.profileNameInput.value = 'New Profile';
    }
    
    if (this.elements.profileApiKeyInput) {
      this.elements.profileApiKeyInput.value = '';
    }
    
    // Default settings
    if (this.elements.darkModeCheckbox) {
      this.elements.darkModeCheckbox.checked = false;
    }
    
    if (this.elements.notificationsCheckbox) {
      this.elements.notificationsCheckbox.checked = true;
    }
    
    if (this.elements.autoRefreshCheckbox) {
      this.elements.autoRefreshCheckbox.checked = false;
    }
    
    if (this.elements.refreshIntervalInput) {
      this.elements.refreshIntervalInput.value = 60;
    }
    
    if (this.elements.refreshIntervalGroup) {
      this.elements.refreshIntervalGroup.style.display = 'none';
    }
    
    // Switch to edit tab
    const editTab = document.querySelector('.tab[data-tab="profile-edit"]');
    if (editTab && window.UI) {
      window.UI.switchTab(editTab);
    }
    
    if (this.elements.deleteProfileButton) {
      this.elements.deleteProfileButton.style.display = 'none';
    }
  }
  
  async saveProfile() {
    if (!this.editingProfileId) return;
    
    // Check if creating new profile or editing existing
    let profile = this.allProfiles.find(p => p.id === this.editingProfileId);
    const isNew = !profile;
    
    if (isNew) {
      profile = {
        id: this.editingProfileId,
        userscripts: [],
        notes: ''
      };
    }
    
    // Update profile data
    profile.name = this.elements.profileNameInput.value.trim() || 'Unnamed Profile';
    profile.apiKey = this.elements.profileApiKeyInput.value.trim();
    
    // Update settings
    profile.settings = {
      darkMode: this.elements.darkModeCheckbox.checked,
      notifications: this.elements.notificationsCheckbox.checked,
      autoRefresh: this.elements.autoRefreshCheckbox.checked,
      refreshInterval: parseInt(this.elements.refreshIntervalInput.value, 10) || 60
    };
    
    // Save to store
    await window.tornAPI.saveProfile(profile);
    
    // Reload profiles
    await this.loadProfiles();
    
    // If created new profile, set it as active
    if (isNew) {
      await window.tornAPI.setActiveProfile(profile.id);
    }
    
    // Close modal and switch back to list tab
    if (window.UI) {
      window.UI.closeModal('profile-modal');
    }
    
    const listTab = document.querySelector('.tab[data-tab="profile-list"]');
    if (listTab && window.UI) {
      window.UI.switchTab(listTab);
    }
  }
  
  async deleteProfile() {
    if (!this.editingProfileId) return;
    
    if (!confirm(`Are you sure you want to delete the profile "${this.elements.profileNameInput.value}"?`)) {
      return;
    }
    
    await window.tornAPI.deleteProfile(this.editingProfileId);
    this.loadProfiles();
    
    if (window.UI) {
      window.UI.closeModal('profile-modal');
    }
    
    const listTab = document.querySelector('.tab[data-tab="profile-list"]');
    if (listTab && window.UI) {
      window.UI.switchTab(listTab);
    }
  }
  
  saveNotes() {
    if (!this.profile || !this.elements.userNotes) return;
    
    this.profile.notes = this.elements.userNotes.value;
    this.saveActiveProfile();
    
    if (window.Utils) {
      window.Utils.showNotification('Notes saved');
    }
  }
  
  saveActiveProfile() {
    if (this.profile) {
      window.tornAPI.saveProfile(this.profile);
    }
  }
  
  getActiveProfile() {
    return this.profile;
  }
}

// Create global ProfileManager instance
window.ProfileManager = new ProfileManager();