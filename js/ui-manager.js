// ui-manager.js - Handles UI interactions
class UIManager {
  constructor() {
    this.modals = {};
    this.tabs = {};
    this.toggleButtons = {};
    this.sidebarVisible = true;
  }

  async init() {
    // Load templates
    await Utils.loadTemplate('templates/sidebar.html', 'sidebar-container');
    
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
    
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-collapsed');
      this.sidebarVisible = !sidebar.classList.contains('sidebar-collapsed');
    });
    
    this.toggleButtons.sidebar = sidebarToggle;
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
    if (show) {
      sidebar.classList.remove('sidebar-collapsed');
    } else {
      sidebar.classList.add('sidebar-collapsed');
    }
    this.sidebarVisible = show;
  }
  
  toggleDarkMode(isDark) {
    if (isDark) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
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