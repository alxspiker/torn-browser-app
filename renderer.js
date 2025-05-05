// renderer.js
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const webview = document.getElementById('browser-view');
  const urlInput = document.getElementById('url-input');
  const goButton = document.getElementById('go-button');
  const backButton = document.getElementById('back-button');
  const forwardButton = document.getElementById('forward-button');
  const reloadButton = document.getElementById('reload-button');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const profileButton = document.getElementById('profile-button');
  const settingsButton = document.getElementById('settings-button');
  const userscriptsButton = document.getElementById('userscripts-button');
  const pageInfo = document.getElementById('page-info');
  const scriptsCount = document.getElementById('scripts-count');
  const refreshStatsButton = document.getElementById('refresh-stats');
  const userNotes = document.getElementById('user-notes');
  const saveNotesButton = document.getElementById('save-notes');

  // Modals
  const profileModal = document.getElementById('profile-modal');
  const settingsModal = document.getElementById('settings-modal');
  const userscriptModal = document.getElementById('userscript-modal');
  const closeButtons = document.querySelectorAll('.modal-close, .close-modal');
  
  // Profile UI elements
  const profilesList = document.getElementById('profiles-list');
  const createProfileButton = document.getElementById('create-profile');
  const profileNameInput = document.getElementById('profile-edit-name');
  const profileApiKeyInput = document.getElementById('profile-api-key');
  const darkModeCheckbox = document.getElementById('setting-dark-mode');
  const notificationsCheckbox = document.getElementById('setting-notifications');
  const autoRefreshCheckbox = document.getElementById('setting-auto-refresh');
  const refreshIntervalInput = document.getElementById('setting-refresh-interval');
  const refreshIntervalGroup = document.getElementById('refresh-interval-group');
  const saveProfileButton = document.getElementById('save-profile');
  const deleteProfileButton = document.getElementById('delete-profile');
  const profileTabs = document.querySelectorAll('.tab[data-tab]');
  const profileTabContents = document.querySelectorAll('.tab-content');
  
  // Userscript UI elements
  const userscriptList = document.getElementById('userscript-list');
  const newScriptButton = document.getElementById('new-script');
  const scriptNameInput = document.getElementById('script-name');
  const scriptMatchInput = document.getElementById('script-match');
  const scriptEnabledCheckbox = document.getElementById('script-enabled');
  const validateScriptButton = document.getElementById('validate-script');
  const saveScriptButton = document.getElementById('save-script');
  const deleteScriptButton = document.getElementById('delete-script');
  const exportScriptsButton = document.getElementById('export-scripts');
  const importScriptsButton = document.getElementById('import-scripts');
  const importFileInput = document.getElementById('import-file');
  
  // Quick links
  const quickLinks = document.querySelectorAll('.quick-link');
  
  // Settings elements
  const saveSettingsButton = document.getElementById('save-settings');
  const settingsDarkModeCheckbox = document.getElementById('setting-dark-mode-app');
  const settingsRememberUrlCheckbox = document.getElementById('setting-remember-last-url');
  const settingsClearCacheCheckbox = document.getElementById('setting-clear-cache-on-exit');
  const settingsDefaultPageInput = document.getElementById('setting-default-page');
  const settingsShowSidebarCheckbox = document.getElementById('setting-show-sidebar');
  const settingsFontSizeSelect = document.getElementById('setting-font-size');
  const settingsAutoRefreshStatsCheckbox = document.getElementById('setting-auto-refresh-stats');
  const settingsEventNotificationsCheckbox = document.getElementById('setting-event-notifications');
  const settingsEnergyNotificationsCheckbox = document.getElementById('setting-energy-notifications');
  const settingsApiCacheInput = document.getElementById('setting-api-cache');
  
  // State variables
  let activeProfile = null;
  let allProfiles = [];
  let editingProfileId = null;
  let currentUserscripts = [];
  let selectedScriptIndex = 0;
  let codeEditor = null;
  let appSettings = {
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
  let statsRefreshInterval = null;

  // Initialize CodeMirror editor
  function initCodeEditor() {
    codeEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
      mode: 'javascript',
      theme: 'material',
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      tabSize: 2,
      indentWithTabs: false,
      extraKeys: {
        'Ctrl-Space': 'autocomplete'
      },
      gutters: ['CodeMirror-lint-markers'],
      lint: {
        esversion: 11,
        asi: true
      }
    });
    
    codeEditor.on('change', () => {
      // Auto-save after a delay
      if (window.autoSaveTimeout) {
        clearTimeout(window.autoSaveTimeout);
      }
      window.autoSaveTimeout = setTimeout(() => {
        if (currentUserscripts.length > 0) {
          currentUserscripts[selectedScriptIndex].code = codeEditor.getValue();
          saveUserscripts();
        }
      }, 2000);
    });
  }

  // =======================
  // Browser Functions
  // =======================
  
  function navigate(url) {
    // Use the exposed API from preload.js
    window.tornBrowser.navigate(url);
    urlInput.value = url;
    
    // Save last URL to profile if setting is enabled
    if (appSettings.rememberLastUrl && activeProfile) {
      activeProfile.lastVisitedUrl = url;
      saveActiveProfile();
    }
  }
  
  // =======================
  // Profile Management
  // =======================
  
  // Load profiles from Electron store
  async function loadProfiles() {
    try {
      allProfiles = await window.tornAPI.getProfiles();
      activeProfile = await window.tornAPI.getActiveProfile();
      
      renderProfiles();
      updateProfileDisplay();
      
      // Load user notes from active profile
      if (activeProfile && activeProfile.notes) {
        userNotes.value = activeProfile.notes;
      }
      
      // Apply dark mode if enabled
      if (activeProfile && activeProfile.settings && activeProfile.settings.darkMode) {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      
      // Set up auto-refresh if enabled
      if (activeProfile && activeProfile.settings && activeProfile.settings.autoRefresh) {
        startStatsRefresh(activeProfile.settings.refreshInterval || 60);
      }
      
      // Navigate to last URL if applicable
      if (appSettings.rememberLastUrl && activeProfile && activeProfile.lastVisitedUrl) {
        navigate(activeProfile.lastVisitedUrl);
      } else {
        navigate(appSettings.defaultPage);
      }
      
      // Load userscripts from active profile
      if (activeProfile && activeProfile.userscripts) {
        currentUserscripts = activeProfile.userscripts;
      } else {
        currentUserscripts = [getDefaultUserscript()];
        if (activeProfile) {
          activeProfile.userscripts = currentUserscripts;
          saveActiveProfile();
        }
      }
      
      renderUserscriptList();
      
      // Fetch Torn stats if API key is available
      if (activeProfile && activeProfile.apiKey) {
        fetchTornStats();
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
      // Create a default profile if none exists
      const defaultProfile = {
        id: 'default',
        name: 'Default',
        apiKey: '',
        userscripts: [getDefaultUserscript()],
        settings: {
          darkMode: false,
          notifications: true,
          autoRefresh: false,
          refreshInterval: 60
        },
        notes: ''
      };
      
      window.tornAPI.saveProfile(defaultProfile);
      activeProfile = defaultProfile;
      allProfiles = [defaultProfile];
      currentUserscripts = defaultProfile.userscripts;
      
      renderProfiles();
      updateProfileDisplay();
      renderUserscriptList();
    }
  }
  
  function renderProfiles() {
    if (!profilesList) return;
    
    profilesList.innerHTML = '';
    
    allProfiles.forEach(profile => {
      const li = document.createElement('li');
      li.className = 'profile-list-item' + (profile.id === activeProfile.id ? ' active' : '');
      li.innerHTML = `
        <span>${profile.name}</span>
        <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.85em;">Edit</button>
      `;
      
      li.querySelector('span').addEventListener('click', () => {
        window.tornAPI.setActiveProfile(profile.id);
      });
      
      li.querySelector('button').addEventListener('click', () => {
        editProfile(profile);
      });
      
      profilesList.appendChild(li);
    });
  }
  
  function updateProfileDisplay() {
    if (!activeProfile) return;
    
    // Update avatar and name in sidebar
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileStatus = document.getElementById('profile-status');
    
    if (profileAvatar && profileName) {
      profileAvatar.textContent = activeProfile.name.charAt(0).toUpperCase();
      profileName.textContent = activeProfile.name;
      profileStatus.textContent = activeProfile.apiKey ? 'Connected' : 'API Key Required';
    }
  }
  
  function editProfile(profile) {
    editingProfileId = profile.id;
    
    profileNameInput.value = profile.name;
    profileApiKeyInput.value = profile.apiKey || '';
    
    // Set profile settings
    if (profile.settings) {
      darkModeCheckbox.checked = profile.settings.darkMode || false;
      notificationsCheckbox.checked = profile.settings.notifications !== false;
      autoRefreshCheckbox.checked = profile.settings.autoRefresh || false;
      refreshIntervalInput.value = profile.settings.refreshInterval || 60;
      
      refreshIntervalGroup.style.display = profile.settings.autoRefresh ? 'block' : 'none';
    }
    
    // Switch to edit tab and show delete button if multiple profiles exist
    const editTab = document.querySelector('.tab[data-tab="profile-edit"]');
    if (editTab) {
      switchTab(editTab);
    }
    
    deleteProfileButton.style.display = allProfiles.length > 1 ? 'block' : 'none';
  }
  
  function createNewProfile() {
    const newId = 'profile_' + Date.now();
    editingProfileId = newId;
    
    profileNameInput.value = 'New Profile';
    profileApiKeyInput.value = '';
    
    // Default settings
    darkModeCheckbox.checked = false;
    notificationsCheckbox.checked = true;
    autoRefreshCheckbox.checked = false;
    refreshIntervalInput.value = 60;
    refreshIntervalGroup.style.display = 'none';
    
    // Switch to edit tab
    const editTab = document.querySelector('.tab[data-tab="profile-edit"]');
    if (editTab) {
      switchTab(editTab);
    }
    
    deleteProfileButton.style.display = 'none';
  }
  
  async function saveProfile() {
    if (!editingProfileId) return;
    
    // Check if creating new profile or editing existing
    let profile = allProfiles.find(p => p.id === editingProfileId);
    const isNew = !profile;
    
    if (isNew) {
      profile = {
        id: editingProfileId,
        userscripts: [getDefaultUserscript()],
        notes: ''
      };
    }
    
    // Update profile data
    profile.name = profileNameInput.value.trim() || 'Unnamed Profile';
    profile.apiKey = profileApiKeyInput.value.trim();
    
    // Update settings
    profile.settings = {
      darkMode: darkModeCheckbox.checked,
      notifications: notificationsCheckbox.checked,
      autoRefresh: autoRefreshCheckbox.checked,
      refreshInterval: parseInt(refreshIntervalInput.value, 10) || 60
    };
    
    // Save to store
    await window.tornAPI.saveProfile(profile);
    
    // Reload profiles
    loadProfiles();
    
    // If created new profile, set it as active
    if (isNew) {
      window.tornAPI.setActiveProfile(profile.id);
    }
    
    // Close modal and switch back to list tab
    closeModal(profileModal);
    const listTab = document.querySelector('.tab[data-tab="profile-list"]');
    if (listTab) {
      switchTab(listTab);
    }
  }
  
  async function deleteProfile() {
    if (!editingProfileId) return;
    
    if (!confirm(`Are you sure you want to delete the profile "${profileNameInput.value}"?`)) {
      return;
    }
    
    await window.tornAPI.deleteProfile(editingProfileId);
    loadProfiles();
    
    closeModal(profileModal);
    const listTab = document.querySelector('.tab[data-tab="profile-list"]');
    if (listTab) {
      switchTab(listTab);
    }
  }
  
  function saveActiveProfile() {
    if (activeProfile) {
      window.tornAPI.saveProfile(activeProfile);
    }
  }
  
  // =======================
  // Userscript Management
  // =======================
  
  function getDefaultUserscript() {
    return {
      name: 'New Script',
      match: '*://*.torn.com/*',
      code: `// ==UserScript==
// @name     New Script
// @match    *://*.torn.com/*
// ==/UserScript==

console.log('Hello from new userscript!');

// This is a sample userscript for Torn.com
// You can modify this to add custom functionality to the site.
`,
      enabled: true
    };
  }
  
  function renderUserscriptList() {
    if (!userscriptList) return;
    
    userscriptList.innerHTML = '';
    
    currentUserscripts.forEach((script, index) => {
      const item = document.createElement('div');
      item.className = 'script-list-item' + (index === selectedScriptIndex ? ' active' : '');
      
      item.innerHTML = `
        <div class="script-status-dot ${script.enabled ? 'enabled' : ''}"></div>
        <span>${script.name}</span>
      `;
      
      item.addEventListener('click', () => {
        selectedScriptIndex = index;
        renderUserscriptList();
        updateScriptEditor();
      });
      
      userscriptList.appendChild(item);
    });
    
    // Update scripts count in status bar
    if (scriptsCount) {
      const enabledCount = currentUserscripts.filter(s => s.enabled).length;
      scriptsCount.textContent = enabledCount;
    }
  }
  
  function updateScriptEditor() {
    if (!codeEditor || currentUserscripts.length === 0) return;
    
    const script = currentUserscripts[selectedScriptIndex];
    
    scriptNameInput.value = script.name;
    scriptMatchInput.value = script.match || '*://*.torn.com/*';
    scriptEnabledCheckbox.checked = script.enabled;
    
    codeEditor.setValue(script.code);
    codeEditor.clearHistory();
  }
  
  function createNewScript() {
    const newScript = getDefaultUserscript();
    currentUserscripts.push(newScript);
    selectedScriptIndex = currentUserscripts.length - 1;
    
    renderUserscriptList();
    updateScriptEditor();
    saveUserscripts();
  }
  
  function saveCurrentScript() {
    if (currentUserscripts.length === 0) return;
    
    const script = currentUserscripts[selectedScriptIndex];
    
    script.name = scriptNameInput.value.trim() || 'Untitled Script';
    script.match = scriptMatchInput.value.trim() || '*://*.torn.com/*';
    script.enabled = scriptEnabledCheckbox.checked;
    script.code = codeEditor.getValue();
    
    renderUserscriptList();
    saveUserscripts();
    
    // Show confirmation
    showNotification('Script saved successfully');
  }
  
  function deleteCurrentScript() {
    if (currentUserscripts.length <= 1) {
      showNotification('Cannot delete the last script', 'error');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${currentUserscripts[selectedScriptIndex].name}"?`)) {
      return;
    }
    
    currentUserscripts.splice(selectedScriptIndex, 1);
    selectedScriptIndex = Math.max(0, selectedScriptIndex - 1);
    
    renderUserscriptList();
    updateScriptEditor();
    saveUserscripts();
  }
  
  function saveUserscripts() {
    if (!activeProfile) return;
    
    activeProfile.userscripts = currentUserscripts;
    saveActiveProfile();
  }
  
  function validateCurrentScript() {
    if (!codeEditor || currentUserscripts.length === 0) return;
    
    const code = codeEditor.getValue();
    const result = window.tornUtils.validateUserscript(code);
    
    if (result.valid) {
      showNotification('Script validation passed');
    } else {
      showNotification(`Validation failed: ${result.errors.join(', ')}`, 'error');
    }
  }
  
  function exportAllScripts() {
    const blob = new Blob([JSON.stringify(currentUserscripts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'torn-userscripts.json';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  function importScripts() {
    importFileInput.click();
  }
  
  // Handle imported script file
  function handleImportedFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        
        if (Array.isArray(data) && data.length > 0 && data.every(s => s.name && s.code)) {
          if (confirm(`Import ${data.length} userscript(s)? This will replace your current scripts.`)) {
            currentUserscripts = data.map(s => ({
              name: s.name,
              match: s.match || '*://*.torn.com/*',
              code: s.code,
              enabled: s.enabled !== false
            }));
            
            selectedScriptIndex = 0;
            saveUserscripts();
            renderUserscriptList();
            updateScriptEditor();
            
            showNotification(`Successfully imported ${data.length} userscript(s)`);
          }
        } else {
          showNotification('Invalid userscript file format', 'error');
        }
      } catch (err) {
        showNotification('Failed to parse import file', 'error');
        console.error('Import error:', err);
      }
    };
    
    reader.readAsText(file);
    importFileInput.value = '';
  }
  
  function injectUserscripts() {
    try {
      const url = window.tornBrowser.getURL();
      let injectedCount = 0;
      
      currentUserscripts.filter(script => script.enabled && window.tornUtils.matchUrlPattern(script.match, url))
        .forEach(script => {
          window.tornBrowser.executeScript(script.code)
            .then(() => {
              injectedCount++;
              if (scriptsCount) {
                scriptsCount.textContent = injectedCount;
              }
            })
            .catch(err => {
              console.error('Script injection error:', err);
            });
        });
    } catch (err) {
      console.error('Error injecting userscripts:', err);
    }
  }
  
  // =======================
  // Torn API Integration
  // =======================
  
  async function fetchTornStats() {
    if (!activeProfile || !activeProfile.apiKey) {
      updateStatsDisplay({
        error: 'API key not configured'
      });
      return;
    }
    
    try {
      pageInfo.textContent = 'Fetching Torn stats...';
      
      const data = await window.tornAPI.apiRequest('user', { selections: 'basic,cooldowns,bars,icons' });
      
      if (data.error) {
        updateStatsDisplay({ error: data.error });
        return;
      }
      
      updateStatsDisplay(data);
      pageInfo.textContent = 'Stats updated';
      
      return data;
    } catch (err) {
      console.error('Failed to fetch Torn stats:', err);
      pageInfo.textContent = 'Stats update failed';
      
      updateStatsDisplay({
        error: 'Failed to connect to Torn API'
      });
    }
  }
  
  function updateStatsDisplay(data) {
    // Handle API error
    if (data.error) {
      document.getElementById('stat-energy').textContent = '--';
      document.getElementById('stat-nerve').textContent = '--';
      document.getElementById('stat-happy').textContent = '--';
      document.getElementById('stat-life').textContent = '--';
      document.getElementById('stat-chain').textContent = '--';
      document.getElementById('stat-money').textContent = '$--';
      document.getElementById('stat-points').textContent = '--';
      
      document.getElementById('cooldown-drug').textContent = '--';
      document.getElementById('cooldown-medical').textContent = '--';
      document.getElementById('cooldown-booster').textContent = '--';
      
      document.getElementById('profile-status').textContent = data.error;
      return;
    }
    
    // Update profile display
    if (data.name && data.level) {
      document.getElementById('profile-name').textContent = data.name;
      document.getElementById('profile-status').textContent = `Level ${data.level}`;
      document.getElementById('profile-avatar').textContent = data.name.charAt(0).toUpperCase();
    }
    
    // Update stats
    if (data.energy) {
      document.getElementById('stat-energy').textContent = `${data.energy.current} / ${data.energy.maximum}`;
    }
    
    if (data.nerve) {
      document.getElementById('stat-nerve').textContent = `${data.nerve.current} / ${data.nerve.maximum}`;
    }
    
    if (data.happy) {
      document.getElementById('stat-happy').textContent = `${data.happy.current} / ${data.happy.maximum}`;
    }
    
    if (data.life) {
      document.getElementById('stat-life').textContent = `${data.life.current} / ${data.life.maximum}`;
    }
    
    if (data.chain && data.chain.current !== undefined) {
      document.getElementById('stat-chain').textContent = data.chain.current;
    }
    
    if (data.money) {
      document.getElementById('stat-money').textContent = '$' + data.money.toLocaleString();
    }
    
    if (data.points !== undefined) {
      document.getElementById('stat-points').textContent = data.points.toLocaleString();
    }
    
    // Update cooldowns
    if (data.cooldowns) {
      const formatCooldown = (time) => {
        if (!time) return 'Ready';
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}m ${seconds}s`;
      };
      
      document.getElementById('cooldown-drug').textContent = formatCooldown(data.cooldowns.drug);
      document.getElementById('cooldown-medical').textContent = formatCooldown(data.cooldowns.medical);
      document.getElementById('cooldown-booster').textContent = formatCooldown(data.cooldowns.booster);
    }
    
    // Check for notifications
    if (activeProfile && activeProfile.settings && activeProfile.settings.notifications) {
      // Energy full notification
      if (data.energy && data.energy.current >= data.energy.maximum && data.energy.maximum > 0) {
        showDesktopNotification('Energy Full', 'Your energy is now full!');
      }
      
      // Nerve full notification
      if (data.nerve && data.nerve.current >= data.nerve.maximum && data.nerve.maximum > 0) {
        showDesktopNotification('Nerve Full', 'Your nerve is now full!');
      }
    }
  }
  
  function startStatsRefresh(interval) {
    // Clear existing interval if any
    if (statsRefreshInterval) {
      clearInterval(statsRefreshInterval);
    }
    
    // Set new interval (minimum 30 seconds)
    const seconds = Math.max(30, parseInt(interval, 10) || 60);
    statsRefreshInterval = setInterval(fetchTornStats, seconds * 1000);
  }
  
  function stopStatsRefresh() {
    if (statsRefreshInterval) {
      clearInterval(statsRefreshInterval);
      statsRefreshInterval = null;
    }
  }
  
  // =======================
  // UI Utilities
  // =======================
  
  function switchTab(tabElement) {
    // Update tab active states
    profileTabs.forEach(tab => {
      tab.classList.remove('active');
    });
    tabElement.classList.add('active');
    
    // Update content visibility
    const tabId = tabElement.getAttribute('data-tab');
    profileTabContents.forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
  }
  
  function openModal(modal) {
    modal.classList.add('active');
  }
  
  function closeModal(modal) {
    modal.classList.remove('active');
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.color = '#fff';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '9999';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    
    if (type === 'success') {
      notification.style.backgroundColor = 'var(--success-color, #2e7d32)';
    } else if (type === 'error') {
      notification.style.backgroundColor = 'var(--danger-color, #e53935)';
    } else if (type === 'warning') {
      notification.style.backgroundColor = 'var(--warning-color, #f9a825)';
    }
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  function showDesktopNotification(title, message) {
    if (!activeProfile || !activeProfile.settings || !activeProfile.settings.notifications) {
      return;
    }
    
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification(title, { 
        body: message,
        icon: '/assets/icon.png' 
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { 
            body: message,
            icon: '/assets/icon.png' 
          });
        }
      });
    }
  }
  
  function toggleSidebar() {
    sidebar.classList.toggle('sidebar-collapsed');
  }
  
  function saveNotes() {
    if (!activeProfile) return;
    
    activeProfile.notes = userNotes.value;
    saveActiveProfile();
    showNotification('Notes saved');
  }

  // =======================
  // Event Listeners
  // =======================
  
  // Browser navigation - Use the new tornBrowser API
  goButton.addEventListener('click', () => navigate(urlInput.value));
  urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') navigate(urlInput.value);
  });
  backButton.addEventListener('click', () => window.tornBrowser.goBack());
  forwardButton.addEventListener('click', () => window.tornBrowser.goForward());
  reloadButton.addEventListener('click', () => window.tornBrowser.reload());
  
  // Sidebar toggle
  sidebarToggle.addEventListener('click', toggleSidebar);
  
  // Modal open buttons
  profileButton.addEventListener('click', () => openModal(profileModal));
  settingsButton.addEventListener('click', () => openModal(settingsModal));
  userscriptsButton.addEventListener('click', () => {
    openModal(userscriptModal);
    if (!codeEditor) {
      // Initialize code editor when first opened
      setTimeout(initCodeEditor, 100);
    }
  });
  
  // Modal close buttons
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });
  
  // Close modal with escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        closeModal(modal);
      });
    }
  });
  
  // Tab switching
  profileTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab));
  });
  
  // Profile management
  createProfileButton.addEventListener('click', createNewProfile);
  saveProfileButton.addEventListener('click', saveProfile);
  deleteProfileButton.addEventListener('click', deleteProfile);
  
  // Auto refresh toggle
  autoRefreshCheckbox.addEventListener('change', () => {
    refreshIntervalGroup.style.display = autoRefreshCheckbox.checked ? 'block' : 'none';
  });
  
  // Quick links
  quickLinks.forEach(link => {
    link.addEventListener('click', () => {
      const url = link.getAttribute('data-url');
      if (url) navigate(url);
    });
  });
  
  // Stats refresh button
  refreshStatsButton.addEventListener('click', fetchTornStats);
  
  // Notes
  saveNotesButton.addEventListener('click', saveNotes);
  
  // Userscript manager
  newScriptButton.addEventListener('click', createNewScript);
  saveScriptButton.addEventListener('click', saveCurrentScript);
  deleteScriptButton.addEventListener('click', deleteCurrentScript);
  validateScriptButton.addEventListener('click', validateCurrentScript);
  exportScriptsButton.addEventListener('click', exportAllScripts);
  importScriptsButton.addEventListener('click', importScripts);
  importFileInput.addEventListener('change', handleImportedFile);
  
  scriptNameInput.addEventListener('input', () => {
    if (currentUserscripts.length > 0) {
      currentUserscripts[selectedScriptIndex].name = scriptNameInput.value;
      renderUserscriptList();
    }
  });
  
  scriptEnabledCheckbox.addEventListener('change', () => {
    if (currentUserscripts.length > 0) {
      currentUserscripts[selectedScriptIndex].enabled = scriptEnabledCheckbox.checked;
      renderUserscriptList();
      saveUserscripts();
    }
  });
  
  // Settings
  saveSettingsButton.addEventListener('click', () => {
    // Save general settings
    appSettings.rememberLastUrl = settingsRememberUrlCheckbox.checked;
    appSettings.clearCacheOnExit = settingsClearCacheCheckbox.checked;
    appSettings.defaultPage = settingsDefaultPageInput.value;
    appSettings.showSidebar = settingsShowSidebarCheckbox.checked;
    appSettings.fontSize = settingsFontSizeSelect.value;
    appSettings.autoRefreshStats = settingsAutoRefreshStatsCheckbox.checked;
    appSettings.eventNotifications = settingsEventNotificationsCheckbox.checked;
    appSettings.energyNotifications = settingsEnergyNotificationsCheckbox.checked;
    appSettings.apiCacheDuration = parseInt(settingsApiCacheInput.value) || 5;
    
    // Apply dark mode if changed
    if (settingsDarkModeCheckbox.checked !== document.body.classList.contains('light-theme')) {
      document.body.classList.toggle('light-theme');
    }
    appSettings.darkMode = settingsDarkModeCheckbox.checked;
    
    // Apply sidebar visibility
    if (appSettings.showSidebar) {
      sidebar.classList.remove('sidebar-collapsed');
    } else {
      sidebar.classList.add('sidebar-collapsed');
    }
    
    // Apply font size
    document.documentElement.style.fontSize = 
      appSettings.fontSize === 'small' ? '14px' : 
      appSettings.fontSize === 'large' ? '18px' : '16px';
    
    // Store settings in local storage
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    
    // Close modal
    closeModal(settingsModal);
    showNotification('Settings saved');
  });
  
  // Webview events
  webview.addEventListener('did-start-loading', () => {
    pageInfo.textContent = 'Loading...';
  });
  
  webview.addEventListener('did-stop-loading', () => {
    pageInfo.textContent = 'Ready';
  });
  
  webview.addEventListener('did-navigate', () => {
    urlInput.value = webview.getURL();
  });
  
  webview.addEventListener('did-navigate-in-page', () => {
    urlInput.value = webview.getURL();
  });
  
  webview.addEventListener('page-title-updated', (e) => {
    document.title = `${e.title} - Torn Browser`;
  });
  
  webview.addEventListener('dom-ready', () => {
    injectUserscripts();
  });
  
  // Profile change event from main process
  window.tornAPI.onProfileChanged((profileId) => {
    loadProfiles();
  });
  
  // Show userscripts event from main process
  window.tornAPI.onShowUserscripts(() => {
    openModal(userscriptModal);
    if (!codeEditor) {
      setTimeout(initCodeEditor, 100);
    }
  });
  
  // Show settings event from main process
  window.tornAPI.onShowSettings(() => {
    openModal(settingsModal);
  });
  
  // Show profiles event from main process
  window.tornAPI.onShowProfiles(() => {
    openModal(profileModal);
  });
  
  // =======================
  // Initialization
  // =======================
  
  function init() {
    // Load app settings from local storage
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        appSettings = { ...appSettings, ...parsedSettings };
      }
    } catch (err) {
      console.error('Failed to load app settings:', err);
    }
    
    // Apply settings
    document.documentElement.style.fontSize = 
      appSettings.fontSize === 'small' ? '14px' : 
      appSettings.fontSize === 'large' ? '18px' : '16px';
    
    if (appSettings.darkMode) {
      document.body.classList.add('light-theme');
    }
    
    if (!appSettings.showSidebar) {
      sidebar.classList.add('sidebar-collapsed');
    }
    
    // Initialize UI settings
    settingsRememberUrlCheckbox.checked = appSettings.rememberLastUrl;
    settingsClearCacheCheckbox.checked = appSettings.clearCacheOnExit;
    settingsDefaultPageInput.value = appSettings.defaultPage;
    settingsShowSidebarCheckbox.checked = appSettings.showSidebar;
    settingsFontSizeSelect.value = appSettings.fontSize;
    settingsAutoRefreshStatsCheckbox.checked = appSettings.autoRefreshStats;
    settingsEventNotificationsCheckbox.checked = appSettings.eventNotifications;
    settingsEnergyNotificationsCheckbox.checked = appSettings.energyNotifications;
    settingsApiCacheInput.value = appSettings.apiCacheDuration;
    settingsDarkModeCheckbox.checked = appSettings.darkMode;
    
    // Load profiles
    loadProfiles();
    
    // Request notification permission if enabled
    if (appSettings.eventNotifications || appSettings.energyNotifications) {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }
  
  // Start the application
  init();
});
