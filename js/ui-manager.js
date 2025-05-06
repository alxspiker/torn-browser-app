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
          // Show that refresh is in progress
          if (window.Utils) {
            window.Utils.showNotification('Refreshing stats...', 'info');
          }
          
          // First ensure the UI elements are initialized
          if (window.TornAPI) {
            if (typeof window.TornAPI.init === 'function') {
              window.TornAPI.init(); // Ensure elements are bound
            }
            
            // Show loading state in the sidebar
            this.updateSidebarLoadingState(true);
            
            // Use refreshPlayerStats to ensure it properly updates the sidebar with bypass cache
            const stats = await window.TornAPI.refreshPlayerStats();
            
            // Clear loading state
            this.updateSidebarLoadingState(false);
            
            if (window.Utils) {
              if (stats && !stats.error) {
                window.Utils.showNotification('Stats refreshed successfully');
              } else {
                window.Utils.showNotification('Failed to refresh stats', 'error');
              }
            }
          } else {
            console.error('TornAPI is not available on window');
            if (window.Utils) {
              window.Utils.showNotification('Failed to refresh stats: API not available', 'error');
            }
          }
        } catch (error) {
          console.error('Error refreshing stats:', error);
          this.updateSidebarLoadingState(false);
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
  
  updateSidebarLoadingState(isLoading) {
    // Visual indication that stats are being refreshed
    const refreshButton = document.getElementById('refresh-stats');
    if (refreshButton) {
      if (isLoading) {
        refreshButton.textContent = 'Refreshing...';
        refreshButton.disabled = true;
        refreshButton.classList.add('loading');
      } else {
        refreshButton.textContent = 'Refresh Stats';
        refreshButton.disabled = false;
        refreshButton.classList.remove('loading');
      }
    }
    
    // Set a temporary "loading" state on the stat elements
    if (isLoading) {
      const statElements = [
        'stat-energy', 'stat-nerve', 'stat-happy', 'stat-life', 
        'stat-chain', 'stat-money', 'stat-points'
      ];
      
      statElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('refreshing');
          // Store the current text so we can restore it if needed
          el.dataset.prevText = el.textContent;
        }
      });
    } else {
      // Remove loading state from all stat elements
      document.querySelectorAll('.refreshing').forEach(el => {
        el.classList.remove('refreshing');
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
      if (el) {
        el.textContent = value;
        el.classList.remove('refreshing');
      }
    };
    
    if (!data) return; // Exit if no data is provided
    
    // Skip update if there's an error
    if (data.error) {
      console.warn('Skipping sidebar stats update due to error:', data.error);
      return;
    }
    
    // Update all stats with available data
    if (data.energy) set('stat-energy', `${data.energy.current} / ${data.energy.maximum}`);
    if (data.nerve) set('stat-nerve', `${data.nerve.current} / ${data.nerve.maximum}`);
    if (data.happy) set('stat-happy', `${data.happy.current} / ${data.happy.maximum}`);
    if (data.life) set('stat-life', `${data.life.current} / ${data.life.maximum}`);
    if (data.chain && data.chain.current !== undefined) set('stat-chain', data.chain.current);
    if (data.money_onhand !== undefined) set('stat-money', '$' + data.money_onhand.toLocaleString());
    if (data.points !== undefined) set('stat-points', data.points.toLocaleString());
    
    // Update cooldowns
    if (data.cooldowns) {
      const formatCooldown = window.TornAPI?.formatCooldown || function(time) {
        if (!time) return 'Ready';
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}m ${seconds}s`;
      };
      
      set('cooldown-drug', formatCooldown(data.cooldowns.drug));
      set('cooldown-medical', formatCooldown(data.cooldowns.medical));
      set('cooldown-booster', formatCooldown(data.cooldowns.booster));
    }
    
    // Store the latest stats in TornAPI for reference
    if (window.TornAPI) {
      window.TornAPI.lastStats = data;
    }
  }
}

// Create a global UIManager instance
window.UI = new UIManager();