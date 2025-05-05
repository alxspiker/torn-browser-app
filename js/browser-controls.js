// browser-controls.js - Handles browser navigation controls
class BrowserControls {
  constructor() {
    this.webview = null;
    this.elements = {};
    this.defaultUrl = 'https://www.torn.com';
    this.initialized = false;
  }
  
  init() {
    try {
      console.log('Initializing Browser Controls...');
      
      // Get webview reference
      this.webview = document.getElementById('browser-view');
      
      if (!this.webview) {
        console.error('Browser webview element not found');
        return this;
      }
      
      // UI elements
      this.elements = {
        urlInput: document.getElementById('url-input'),
        goButton: document.getElementById('go-button'),
        backButton: document.getElementById('back-button'),
        forwardButton: document.getElementById('forward-button'),
        reloadButton: document.getElementById('reload-button'),
        pageInfo: document.getElementById('page-info'),
        scriptsCount: document.getElementById('scripts-count')
      };
      
      // Verify all elements exist
      const missingElements = Object.entries(this.elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
      
      if (missingElements.length > 0) {
        console.error('Missing browser control UI elements:', missingElements.join(', '));
      }
      
      // Configure navigation controls
      this.setupNavigationControls();
      
      // Set up webview event listeners
      this.setupWebviewListeners();
      
      this.initialized = true;
      console.log('Browser controls initialized');
      
      return this;
    } catch (error) {
      console.error('Error initializing browser controls:', error);
      return this;
    }
  }
  
  setupNavigationControls() {
    // Go button
    if (this.elements.goButton) {
      this.elements.goButton.addEventListener('click', () => {
        if (this.elements.urlInput) {
          this.navigate(this.elements.urlInput.value);
        }
      });
    }
    
    // URL input enter key
    if (this.elements.urlInput) {
      this.elements.urlInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.navigate(this.elements.urlInput.value);
        }
      });
    }
    
    // Back button
    if (this.elements.backButton) {
      this.elements.backButton.addEventListener('click', () => {
        this.goBack();
      });
    }
    
    // Forward button
    if (this.elements.forwardButton) {
      this.elements.forwardButton.addEventListener('click', () => {
        this.goForward();
      });
    }
    
    // Reload button
    if (this.elements.reloadButton) {
      this.elements.reloadButton.addEventListener('click', () => {
        this.reload();
      });
    }
    
    // Add click handlers for quick links
    this.setupQuickLinks();
  }
  
  setupQuickLinks() {
    // Set up quick links
    const quickLinks = document.querySelectorAll('.quick-link');
    
    quickLinks.forEach(link => {
      link.addEventListener('click', () => {
        const url = link.getAttribute('data-url');
        if (url) {
          this.navigate(url);
        }
      });
    });
  }
  
  setupWebviewListeners() {
    if (!this.webview) return;
    
    // Loading state
    this.webview.addEventListener('did-start-loading', () => {
      if (this.elements.pageInfo) {
        this.elements.pageInfo.textContent = 'Loading...';
      }
    });
    
    this.webview.addEventListener('did-stop-loading', () => {
      if (this.elements.pageInfo) {
        this.elements.pageInfo.textContent = 'Ready';
      }
    });
    
    // URL updates
    this.webview.addEventListener('did-navigate', () => {
      if (this.elements.urlInput) {
        this.elements.urlInput.value = this.webview.getURL();
      }
    });
    
    this.webview.addEventListener('did-navigate-in-page', () => {
      if (this.elements.urlInput) {
        this.elements.urlInput.value = this.webview.getURL();
      }
    });
    
    // Page title updates
    this.webview.addEventListener('page-title-updated', (e) => {
      document.title = `${e.title} - Torn Browser`;
    });
    
    // Inject userscripts when page is ready
    this.webview.addEventListener('dom-ready', () => {
      if (window.UserscriptManager && typeof window.UserscriptManager.injectUserscripts === 'function') {
        try {
          window.UserscriptManager.injectUserscripts(this.webview.getURL());
        } catch (error) {
          console.error('Error injecting userscripts:', error);
          if (window.Utils) {
            window.Utils.showNotification('Error injecting userscripts', 'error');
          }
        }
      }
    });
  }
  
  navigate(url) {
    if (!this.webview) {
      console.error('Cannot navigate: webview not initialized');
      return;
    }
    
    if (!url) return;
    
    // Add https:// if not present - FIX: Corrected regex pattern
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    
    try {
      // Use the webview directly
      this.webview.src = url;
      
      // Update URL input
      if (this.elements.urlInput) {
        this.elements.urlInput.value = url;
      }
      
      // Save last URL to profile if setting is enabled
      const activeProfile = window.ProfileManager?.getActiveProfile();
      const settings = window.App?.getSettings() || {};
      
      if (settings.rememberLastUrl && activeProfile) {
        activeProfile.lastVisitedUrl = url;
        window.ProfileManager.saveProfile();
      }
    } catch (error) {
      if (error.message && error.message.includes('ERR_ABORTED')) {
        console.info('Navigation aborted (likely harmless):', error.message);
      } else {
        console.error('Navigation error:', error);
        if (this.elements.pageInfo) {
          this.elements.pageInfo.textContent = 'Navigation error';
        }
      }
    }
  }
  
  goBack() {
    if (this.webview && this.webview.canGoBack()) {
      this.webview.goBack();
    }
  }
  
  goForward() {
    if (this.webview && this.webview.canGoForward()) {
      this.webview.goForward();
    }
  }
  
  reload() {
    if (this.webview) {
      this.webview.reload();
    }
  }
  
  navigateToLastUrl() {
    try {
      const activeProfile = window.ProfileManager?.getActiveProfile();
      const settings = window.App?.getSettings() || {};
      
      if (settings.rememberLastUrl && activeProfile && activeProfile.lastVisitedUrl) {
        this.navigate(activeProfile.lastVisitedUrl);
      } else {
        this.navigate(settings.defaultPage || this.defaultUrl);
      }
    } catch (error) {
      console.error('Error navigating to last URL:', error);
      this.navigate(this.defaultUrl);
    }
  }
  
  executeScript(code) {
    if (this.webview) {
      return this.webview.executeJavaScript(code);
    }
    return Promise.reject(new Error('Webview not available'));
  }
  
  getURL() {
    if (this.webview) {
      return this.webview.getURL();
    }
    return '';
  }
}

// Create global BrowserControls instance
window.BrowserControls = new BrowserControls();