// ui-manager.js - Handles UI interactions
class UIManager {
  constructor() {
    this.modals = {};
    this.tabs = {};
    this.toggleButtons = {};
    this.sidebarVisible = true;
    this.initialized = false;
    this.darkModeEnabled = false;
  }

  async init() {
    try {
      console.log('Initializing UI Manager...');
      
      // Load templates
      await this.loadSidebar();
      
      const modalsContainer = document.getElementById('modals-container');
      if (!modalsContainer) {
        throw new Error('Modals container not found in DOM');
      }
      
      modalsContainer.innerHTML = '';
      
      // Load modals
      const modalTemplates = [
        { path: 'templates/modals/profile-modal.html', id: 'profile-modal' },
        { path: 'templates/modals/userscript-modal.html', id: 'userscript-modal' },
        { path: 'templates/modals/settings-modal.html', id: 'settings-modal' }
      ];
      
      for (const template of modalTemplates) {
        try {
          const response = await fetch(template.path);
          if (!response.ok) {
            throw new Error(`Failed to load modal template ${template.path}: ${response.status} ${response.statusText}`);
          }
          
          const html = await response.text();
          modalsContainer.innerHTML += html;
          
          // Store modal reference
          this.modals[template.id] = document.getElementById(template.id);
          
          if (!this.modals[template.id]) {
            console.warn(`Modal element #${template.id} not found after loading template`);
          }
        } catch (error) {
          console.error(`Error loading modal template ${template.path}:`, error);
        }
      }
      
      // Set up event listeners for modals
      this.setupModalListeners();
      
      // Set up tab navigation
      this.setupTabNavigation();
      
      // Set up sidebar toggle
      this.setupSidebarToggle();

      // Set up top bar event listeners
      this.setupTopBarEventListeners();
      
      // Check if dark mode preference is stored in localStorage
      try {
        const appSettings = localStorage.getItem('appSettings');
        if (appSettings) {
          const settings = JSON.parse(appSettings);
          if (settings.darkMode) {
            this.toggleDarkMode(true);
          }
        }
      } catch (error) {
        console.error('Error loading dark mode preference:', error);
      }
      
      this.initialized = true;
      console.log('UI Manager initialized');
      
      return this;
    } catch (error) {
      console.error('UIManager initialization error:', error);
      return this;
    }
  }
  
  async loadSidebar() {
    try {
      // Load sidebar template
      const response = await fetch('templates/sidebar.html');
      if (!response.ok) {
        throw new Error(`Failed to load sidebar: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      const sidebarContainer = document.getElementById('sidebar-container');
      
      if (!sidebarContainer) {
        throw new Error('Sidebar container not found in DOM');
      }
      
      sidebarContainer.innerHTML = html;
      
      // Setup sidebar event listeners after DOM is loaded
      this.setupSidebarEventListeners();
      
      return true;
    } catch (err) {
      console.error('Error loading sidebar:', err);
      return false;
    }
  }

  setupSidebarEventListeners() {
    // Setup refresh stats button
    const refreshStats = document.getElementById('refresh-stats');
    if (refreshStats) {
      refreshStats.addEventListener('click', async () => {
        try {
          if (window.TornAPI) {
            await window.TornAPI.refreshPlayerStats();
            if (window.Utils) {
              window.Utils.showNotification('Stats refreshed successfully');
            }
          }
        } catch (error) {
          console.error('Error refreshing stats:', error);
          if (window.Utils) {
            window.Utils.showNotification('Failed to refresh stats', 'error');
          }
        }
      });
    }

    // Setup quick links
    const quickLinks = document.querySelectorAll('.quick-link');
    quickLinks.forEach(link => {
      link.addEventListener('click', () => {
        const url = link.getAttribute('data-url');
        if (url && window.BrowserControls) {
          window.BrowserControls.navigate(url);
        }
      });
    });

    // Setup notes saving
    const saveNotes = document.getElementById('save-notes');
    const userNotes = document.getElementById('user-notes');
    
    if (saveNotes && userNotes) {
      // Load saved notes
      const activeProfile = window.ProfileManager?.getActiveProfile();
      if (activeProfile && activeProfile.notes) {
        userNotes.value = activeProfile.notes;
      }
      
      saveNotes.addEventListener('click', () => {
        if (window.ProfileManager) {
          window.ProfileManager.saveNotes();
        }
      });
    }
  }
  
  setupModalListeners() {
    // Setup close buttons
    const closeButtons = document.querySelectorAll('.modal-close, .close-modal');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        if (modal) {
          this.closeModal(modal.id);
        }
      });
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
          this.closeModal(modal.id);
        });
      }
    });
  }
  
  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab[data-tab]');
    
    tabButtons.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab);
      });
    });
  }
  
  switchTab(tabElement) {
    if (!tabElement) return;
    
    const tabGroup = tabElement.closest('.tabs');
    if (!tabGroup) return;
    
    const parentContainer = tabGroup.parentElement;
    const tabId = tabElement.getAttribute('data-tab');
    
    // Deactivate all tabs in this group
    parentContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    parentContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activate the selected tab
    tabElement.classList.add('active');
    
    const tabContent = parentContainer.querySelector(`#${tabId}`);
    if (tabContent) {
      tabContent.classList.add('active');
    } else {
      console.warn(`Tab content #${tabId} not found`);
    }
  }
  
  setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-collapsed');
        this.sidebarVisible = !sidebar.classList.contains('sidebar-collapsed');
      });
      
      this.toggleButtons.sidebar = sidebarToggle;
    }
  }

  setupTopBarEventListeners() {
    // Settings button
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => this.openModal('settings-modal'));
    }
    
    // Profile button
    const profileButton = document.getElementById('profile-button');
    if (profileButton) {
      profileButton.addEventListener('click', () => this.openModal('profile-modal'));
    }
    
    // Userscripts button
    const userscriptsButton = document.getElementById('userscripts-button');
    if (userscriptsButton) {
      userscriptsButton.addEventListener('click', () => {
        this.openModal('userscript-modal');
        
        // Initialize CodeMirror if UserscriptManager is available
        if (window.UserscriptManager && typeof window.UserscriptManager.initCodeEditor === 'function') {
          setTimeout(() => {
            window.UserscriptManager.initCodeEditor();
          }, 100);
        }
      });
    }
  }
  
  openModal(modalId) {
    if (this.modals[modalId]) {
      this.modals[modalId].classList.add('active');
    } else {
      console.error(`Modal '${modalId}' not found`);
    }
  }
  
  closeModal(modalId) {
    if (this.modals[modalId]) {
      this.modals[modalId].classList.remove('active');
    } else {
      console.error(`Modal '${modalId}' not found`);
    }
  }
  
  showSidebar(show = true) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      if (show) {
        sidebar.classList.remove('sidebar-collapsed');
      } else {
        sidebar.classList.add('sidebar-collapsed');
      }
      this.sidebarVisible = show;
    }
  }
  
  toggleDarkMode(isDark) {
    console.log(`Toggling dark mode: ${isDark ? 'ON' : 'OFF'}`);
    this.darkModeEnabled = isDark;
    
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
    
    // Store the preference
    try {
      const appSettings = localStorage.getItem('appSettings');
      if (appSettings) {
        const settings = JSON.parse(appSettings);
        settings.darkMode = isDark;
        localStorage.setItem('appSettings', JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  }
  
  setFontSize(size) {
    document.documentElement.style.fontSize = 
      size === 'small' ? '14px' : 
      size === 'large' ? '18px' : '16px';
  }
  
  // Utility function to check if modals are loaded
  areModalsLoaded() {
    return Object.keys(this.modals).length > 0;
  }
  
  isDarkModeEnabled() {
    return this.darkModeEnabled;
  }
}

// Create a global UIManager instance
window.UI = new UIManager();