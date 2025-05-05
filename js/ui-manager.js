// ui-manager.js - Handles UI interactions
class UIManager {
  constructor() {
    this.modals = {};
    this.tabs = {};
    this.toggleButtons = {};
    this.sidebarVisible = true;
  }

  async init() {
    try {
      // Load templates
      await this.loadSidebar();
      
      const modalsContainer = document.getElementById('modals-container');
      modalsContainer.innerHTML = '';
      
      // Load modals
      const modalTemplates = [
        { path: 'templates/modals/profile-modal.html', id: 'profile-modal' },
        { path: 'templates/modals/userscript-modal.html', id: 'userscript-modal' },
        { path: 'templates/modals/settings-modal.html', id: 'settings-modal' }
      ];
      
      for (const template of modalTemplates) {
        const response = await fetch(template.path);
        const html = await response.text();
        modalsContainer.innerHTML += html;
        
        // Store modal reference
        this.modals[template.id] = document.getElementById(template.id);
      }
      
      // Set up event listeners for modals
      this.setupModalListeners();
      
      // Set up tab navigation
      this.setupTabNavigation();
      
      // Set up sidebar toggle
      this.setupSidebarToggle();
      
      return this;
    } catch (error) {
      console.error('UIManager initialization error:', error);
      throw error;
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
            Utils.showNotification('Stats refreshed successfully');
          }
        } catch (error) {
          console.error('Error refreshing stats:', error);
          Utils.showNotification('Failed to refresh stats', 'error');
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
        const profile = window.ProfileManager?.getActiveProfile();
        if (profile) {
          profile.notes = userNotes.value;
          window.ProfileManager.saveActiveProfile();
          Utils.showNotification('Notes saved');
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
        this.closeModal(modal.id);
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
        const tabGroup = tab.closest('.tabs').parentElement;
        const tabId = tab.getAttribute('data-tab');
        
        // Deactivate all tabs in this group
        tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tabGroup.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Activate the selected tab
        tab.classList.add('active');
        tabGroup.querySelector(`#${tabId}`).classList.add('active');
      });
    });
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
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
  
  setFontSize(size) {
    document.documentElement.style.fontSize = 
      size === 'small' ? '14px' : 
      size === 'large' ? '18px' : '16px';
  }
}

// Create a global UIManager instance
window.UI = new UIManager();