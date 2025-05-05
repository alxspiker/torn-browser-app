// profile-manager.js - Manages user profiles
class ProfileManager {
  constructor() {
    this.profile = null;
    // UI elements
    this.elements = {
      profileNameInput: document.getElementById('profile-edit-name'),
      profileApiKeyInput: document.getElementById('profile-api-key'),
      darkModeCheckbox: document.getElementById('setting-dark-mode'),
      notificationsCheckbox: document.getElementById('setting-notifications'),
      autoRefreshCheckbox: document.getElementById('setting-auto-refresh'),
      refreshIntervalInput: document.getElementById('setting-refresh-interval'),
      refreshIntervalGroup: document.getElementById('refresh-interval-group'),
      saveProfileButton: document.getElementById('save-profile'),
      profileButton: document.getElementById('profile-button'),
      userNotes: document.getElementById('user-notes'),
      saveNotesButton: document.getElementById('save-notes'),
      profileAvatar: document.getElementById('profile-avatar'),
      profileName: document.getElementById('profile-name'),
      profileStatus: document.getElementById('profile-status')
    };
  }
  
  async init() {
    this.setupEventListeners();
    await this.loadProfile();
    return this;
  }
  
  setupEventListeners() {
    this.elements.profileButton.addEventListener('click', () => UI.openModal('profile-modal'));
    this.elements.saveProfileButton.addEventListener('click', () => this.saveProfile());
    this.elements.autoRefreshCheckbox.addEventListener('change', () => {
      this.elements.refreshIntervalGroup.style.display =
        this.elements.autoRefreshCheckbox.checked ? 'block' : 'none';
    });
    this.elements.saveNotesButton.addEventListener('click', () => this.saveNotes());
  }
  
  async loadProfile() {
    try {
      this.profile = await window.tornAPI.getActiveProfile();
      this.updateProfileDisplay();
      if (this.profile && this.profile.notes) {
        this.elements.userNotes.value = this.profile.notes;
      }
      if (this.profile && this.profile.settings && this.profile.settings.darkMode) {
        UI.toggleDarkMode(true);
      } else {
        UI.toggleDarkMode(false);
      }
      if (this.profile && this.profile.settings && this.profile.settings.autoRefresh) {
        window.TornAPI.startStatsRefresh(this.profile.settings.refreshInterval || 60);
      }
      return this.profile;
    } catch (err) {
      console.error('Failed to load profile:', err);
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
      this.profile = defaultProfile;
      this.updateProfileDisplay();
      return this.profile;
    }
  }
  
  updateProfileDisplay() {
    if (!this.profile) return;
    if (this.elements.profileAvatar && this.elements.profileName) {
      this.elements.profileAvatar.textContent = this.profile.name.charAt(0).toUpperCase();
      this.elements.profileName.textContent = this.profile.name;
      this.elements.profileStatus.textContent = this.profile.apiKey ? 'Connected' : 'API Key Required';
    }
    // Fill modal fields
    this.elements.profileNameInput.value = this.profile.name;
    this.elements.profileApiKeyInput.value = this.profile.apiKey || '';
    if (this.profile.settings) {
      this.elements.darkModeCheckbox.checked = this.profile.settings.darkMode || false;
      this.elements.notificationsCheckbox.checked = this.profile.settings.notifications !== false;
      this.elements.autoRefreshCheckbox.checked = this.profile.settings.autoRefresh || false;
      this.elements.refreshIntervalInput.value = this.profile.settings.refreshInterval || 60;
      this.elements.refreshIntervalGroup.style.display = this.profile.settings.autoRefresh ? 'block' : 'none';
    }
  }
  
  async saveProfile() {
    if (!this.profile) return;
    this.profile.name = this.elements.profileNameInput.value.trim() || 'Unnamed Profile';
    this.profile.apiKey = this.elements.profileApiKeyInput.value.trim();
    this.profile.settings = {
      darkMode: this.elements.darkModeCheckbox.checked,
      notifications: this.elements.notificationsCheckbox.checked,
      autoRefresh: this.elements.autoRefreshCheckbox.checked,
      refreshInterval: parseInt(this.elements.refreshIntervalInput.value, 10) || 60
    };
    await window.tornAPI.saveProfile(this.profile);
    await this.loadProfile();
    UI.closeModal('profile-modal');
  }
  
  saveNotes() {
    if (!this.profile) return;
    this.profile.notes = this.elements.userNotes.value;
    this.saveActiveProfile();
    Utils.showNotification('Notes saved');
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