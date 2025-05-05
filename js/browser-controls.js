// browser-controls.js - Handles browser navigation controls
class BrowserControls {
  constructor() {
    this.webview = document.getElementById('browser-view');
    
    // UI elements
    this.elements = {
      urlInput: document.getElementById('url-input'),
      goButton: document.getElementById('go-button'),
      backButton: document.getElementById('back-button'),
      forwardButton: document.getElementById('forward-button'),
      reloadButton: document.getElementById('reload-button'),
      pageInfo: document.getElementById('page-info')
    };
    
    // Default URL
    this.defaultUrl = 'https://www.torn.com';
  }
  
  init() {
    // Configure navigation controls
    this.setupNavigationControls();
    
    // Set up webview event listeners
    this.setupWebviewListeners();
    
    return this;
  }
  
  setupNavigationControls() {
    // Go button
    this.elements.goButton.addEventListener('click', () => {
      this.navigate(this.elements.urlInput.value);
    });
    
    // URL input enter key
    this.elements.urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this.navigate(this.elements.urlInput.value);
      }
    });
    
    // Back button
    this.elements.backButton.addEventListener('click', () => {
      window.tornBrowser.goBack();
    });
    
    // Forward button
    this.elements.forwardButton.addEventListener('click', () => {
      window.tornBrowser.goForward();
    });
    
    // Reload button
    this.elements.reloadButton.addEventListener('click', () => {
      window.tornBrowser.reload();
    });
    
    // Set up quick links
    document.querySelectorAll('.quick-link').forEach(link => {
      link.addEventListener('click', () => {
        const url = link.getAttribute('data-url');
        if (url) this.navigate(url);
      });
    });
  }
  
  setupWebviewListeners() {
    // Loading state
    this.webview.addEventListener('did-start-loading', () => {
      this.elements.pageInfo.textContent = 'Loading...';
    });
    
    this.webview.addEventListener('did-stop-loading', () => {
      this.elements.pageInfo.textContent = 'Ready';
    });
    
    // URL updates
    this.webview.addEventListener('did-navigate', () => {
      this.elements.urlInput.value = this.webview.getURL();
    });
    
    this.webview.addEventListener('did-navigate-in-page', () => {
      this.elements.urlInput.value = this.webview.getURL();
    });
    
    // Page title updates
    this.webview.addEventListener('page-title-updated', (e) => {
      document.title = `${e.title} - Torn Browser`;
    });
    
    // Inject userscripts when page is ready
    this.webview.addEventListener('dom-ready', () => {
      if (window.UserscriptManager) {
        window.UserscriptManager.injectUserscripts(this.webview.getURL());
      }
    });
  }
  
  navigate(url) {
    // Use the exposed API from preload.js
    window.tornBrowser.navigate(url);
    this.elements.urlInput.value = url;
    
    // Save last URL to profile if setting is enabled
    const activeProfile = window.ProfileManager.getActiveProfile();
    const settings = window.App.getSettings();
    
    if (settings.rememberLastUrl && activeProfile) {
      activeProfile.lastVisitedUrl = url;
      window.ProfileManager.saveActiveProfile();
    }
  }
  
  navigateToLastUrl() {
    const activeProfile = window.ProfileManager.getActiveProfile();
    const settings = window.App.getSettings();
    
    if (settings.rememberLastUrl && activeProfile && activeProfile.lastVisitedUrl) {
      this.navigate(activeProfile.lastVisitedUrl);
    } else {
      this.navigate(settings.defaultPage || this.defaultUrl);
    }
  }
}

// Create global BrowserControls instance
window.BrowserControls = new BrowserControls();