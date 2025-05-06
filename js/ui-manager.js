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
      // Load templates
      await this.loadSidebar();
      
      // After loading sidebar, update stats if available
      if (window.TornAPI && window.TornAPI.lastStats && window.UI && window.UI.updateSidebarStats) {
        window.UI.updateSidebarStats(window.TornAPI.lastStats);
      }

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
          
          // Remove any existing modal with the same ID
          const existingModal = document.getElementById(template.id);
          if (existingModal && existingModal.parentNode) {
            existingModal.parentNode.removeChild(existingModal);
          }
          
          // Insert the new modal HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const newModal = tempDiv.firstElementChild;
          modalsContainer.appendChild(newModal);
          
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
            if (typeof window.TornAPI.init === 'function') {
              window.TornAPI.init(); // Ensure elements are bound
            }
            await window.TornAPI.refreshPlayerStats();
            if (window.Utils) {
              window.Utils.showNotification('Stats refreshed successfully');
            }
          } else {
            console.error('TornAPI is not available on window');
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
    // All top bar modal buttons have been removed, so this is now a no-op.
  }
  
  openModal(modalId) {
    if (this.modals[modalId]) {
      this.modals[modalId].classList.add('active');
    } else {
      console.error(`Modal '${modalId}' not found in UIManager.modals. Registered modals:`, Object.keys(this.modals));
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

  updateSidebarStats(data) {
    // Update stat fields in the sidebar if present
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    if (data.energy) set('stat-energy', `${data.energy.current} / ${data.energy.maximum}`);
    if (data.nerve) set('stat-nerve', `${data.nerve.current} / ${data.nerve.maximum}`);
    if (data.happy) set('stat-happy', `${data.happy.current} / ${data.happy.maximum}`);
    if (data.life) set('stat-life', `${data.life.current} / ${data.life.maximum}`);
    if (data.chain && data.chain.current !== undefined) set('stat-chain', data.chain.current);
    if (data.money_onhand !== undefined) set('stat-money', '$' + data.money_onhand.toLocaleString());
    if (data.points !== undefined) set('stat-points', data.points.toLocaleString());
    if (data.cooldowns) {
      set('cooldown-drug', window.TornAPI?.formatCooldown ? window.TornAPI.formatCooldown(data.cooldowns.drug) : data.cooldowns.drug);
      set('cooldown-medical', window.TornAPI?.formatCooldown ? window.TornAPI.formatCooldown(data.cooldowns.medical) : data.cooldowns.medical);
      set('cooldown-booster', window.TornAPI?.formatCooldown ? window.TornAPI.formatCooldown(data.cooldowns.booster) : data.cooldowns.booster);
    }
  }
}

// Create a global UIManager instance
window.UI = new UIManager();