// profile-manager.js - Manages user profiles
class ProfileManager {
  constructor() {
    this.profiles = [];
    this.activeProfile = null;
    this.editingProfileId = null;
    
    // UI elements
    this.elements = {
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
      profileButton: document.getElementById('profile-button'),
      userNotes: document.getElementById('user-notes'),
      saveNotesButton: document.getElementById('save-notes'),
      profileAvatar: document.getElementById('profile-avatar'),
      profileName: document.getElementById('profile-name'),
      profileStatus: document.getElementById('profile-status')
    };
  }
  
  async init() {
    // Register event listeners
    this.setupEventListeners();
    
    // Load profiles
    await this.loadProfiles();
    
    return this;
  }
  
  setupEventListeners() {
    // Profile modal button
    this.elements.profileButton.addEventListener('click', () => UI.openModal('profile-modal'));
    
    // Create profile button
    this.elements.createProfileButton.addEventListener('click', () => this.createNewProfile());
    
    // Save profile button
    this.elements.saveProfileButton.addEventListener('click', () => this.saveProfile());
    
    // Delete profile button
    this.elements.deleteProfileButton.addEventListener('click', () => this.deleteProfile());
    
    // Auto refresh toggle
    this.elements.autoRefreshCheckbox.addEventListener('change', () => {
      this.elements.refreshIntervalGroup.style.display = 
        this.elements.autoRefreshCheckbox.checked ? 'block' : 'none';
    });
    
    // Save notes button
    this.elements.saveNotesButton.addEventListener('click', () => this.saveNotes());
    
    // Register for event from main process
    window.tornAPI.onProfileChanged((profileId) => {
      this.loadProfiles();
    });
  }
  
  async loadProfiles() {
    try {
      this.profiles = await window.tornAPI.getProfiles();
      this.activeProfile = await window.tornAPI.getActiveProfile();
      
      this.renderProfiles();
      this.updateProfileDisplay();
      
      // Load user notes from active profile
      if (this.activeProfile && this.activeProfile.notes) {
        this.elements.userNotes.value = this.activeProfile.notes;
      }
      
      // Apply dark mode if enabled
      if (this.activeProfile && this.activeProfile.settings && this.activeProfile.settings.darkMode) {
        UI.toggleDarkMode(true);
      } else {
        UI.toggleDarkMode(false);
      }
      
      // Set up auto-refresh if enabled
      if (this.activeProfile && this.activeProfile.settings && this.activeProfile.settings.autoRefresh) {
        window.TornAPI.startStatsRefresh(this.activeProfile.settings.refreshInterval || 60);
      }
      
      return this.activeProfile;
    } catch (err) {
      console.error('Failed to load profiles:', err);
      
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
      
      await window.tornAPI.saveProfile(defaultProfile);
      this.activeProfile = defaultProfile;
      this.profiles = [defaultProfile];
      
      this.renderProfiles();
      this.updateProfileDisplay();
      
      return this.activeProfile;
    }
  }
  
  renderProfiles() {
    if (!this.elements.profilesList) return;
    
    this.elements.profilesList.innerHTML = '';
    
    this.profiles.forEach(profile => {
      const li = document.createElement('li');
      li.className = 'profile-list-item' + (profile.id === this.activeProfile.id ? ' active' : '');
      li.innerHTML = `
        <span>${profile.name}</span>
        <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.85em;">Edit</button>
      `;
      
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
    if (!this.activeProfile) return;
    
    // Update avatar and name in sidebar
    if (this.elements.profileAvatar && this.elements.profileName) {
      this.elements.profileAvatar.textContent = this.activeProfile.name.charAt(0).toUpperCase();
      this.elements.profileName.textContent = this.activeProfile.name;
      this.elements.profileStatus.textContent = this.activeProfile.apiKey ? 'Connected' : 'API Key Required';
    }
  }
  
  editProfile(profile) {
    this.editingProfileId = profile.id;
    
    this.elements.profileNameInput.value = profile.name;
    this.elements.profileApiKeyInput.value = profile.apiKey || '';
    
    // Set profile settings
    if (profile.settings) {
      this.elements.darkModeCheckbox.checked = profile.settings.darkMode || false;
      this.elements.notificationsCheckbox.checked = profile.settings.notifications !== false;
      this.elements.autoRefreshCheckbox.checked = profile.settings.autoRefresh || false;
      this.elements.refreshIntervalInput.value = profile.settings.refreshInterval || 60;
      
      this.elements.refreshIntervalGroup.style.display = profile.settings.autoRefresh ? 'block' : 'none';
    }
    
    // Switch to edit tab and show delete button if multiple profiles exist
    const editTab = document.querySelector('.tab[data-tab="profile-edit"]');
    if (editTab) {
      editTab.click();
    }
    
    this.elements.deleteProfileButton.style.display = this.profiles.length > 1 ? 'block' : 'none';
  }
  
  createNewProfile() {
    const newId = 'profile_' + Date.now();
    this.editingProfileId = newId;
    
    this.elements.profileNameInput.value = 'New Profile';
    this.elements.profileApiKeyInput.value = '';
    
    // Default settings
    this.elements.darkModeCheckbox.checked = false;
    this.elements.notificationsCheckbox.checked = true;
    this.elements.autoRefreshCheckbox.checked = false;
    this.elements.refreshIntervalInput.value = 60;
    this.elements.refreshIntervalGroup.style.display = 'none';
    
    // Switch to edit tab
    const editTab = document.querySelector('.tab[data-tab="profile-edit"]');
    if (editTab) {
      editTab.click();
    }
    
    this.elements.deleteProfileButton.style.display = 'none';
  }
  
  async saveProfile() {
    if (!this.editingProfileId) return;
    
    // Check if creating new profile or editing existing
    let profile = this.profiles.find(p => p.id === this.editingProfileId);
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
    UI.closeModal('profile-modal');
    const listTab = document.querySelector('.tab[data-tab="profile-list"]');
    if (listTab) {
      listTab.click();
    }
  }
  
  async deleteProfile() {
    if (!this.editingProfileId) return;
    
    if (!confirm(`Are you sure you want to delete the profile "${this.elements.profileNameInput.value}"?`)) {
      return;
    }
    
    await window.tornAPI.deleteProfile(this.editingProfileId);
    await this.loadProfiles();
    
    UI.closeModal('profile-modal');
    const listTab = document.querySelector('.tab[data-tab="profile-list"]');
    if (listTab) {
      listTab.click();
    }
  }
  
  saveNotes() {
    if (!this.activeProfile) return;
    
    this.activeProfile.notes = this.elements.userNotes.value;
    this.saveActiveProfile();
    Utils.showNotification('Notes saved');
  }
  
  saveActiveProfile() {
    if (this.activeProfile) {
      window.tornAPI.saveProfile(this.activeProfile);
    }
  }
  
  getActiveProfile() {
    return this.activeProfile;
  }
}

// Create global ProfileManager instance
window.ProfileManager = new ProfileManager();