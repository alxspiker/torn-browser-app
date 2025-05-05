// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose validated IPC API to renderer process
contextBridge.exposeInMainWorld('tornAPI', {
  // Profile management
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  getActiveProfile: () => ipcRenderer.invoke('get-active-profile'),
  saveProfile: (profile) => ipcRenderer.invoke('save-profile', profile),
  deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),
  setActiveProfile: (profileId) => ipcRenderer.invoke('set-active-profile', profileId),
  
  // Torn.com API proxy
  apiRequest: (endpoint, params) => ipcRenderer.invoke('torn-api-request', endpoint, params),
  
  // Event listeners
  onProfileChanged: (callback) => {
    const listener = (_, profileId) => callback(profileId);
    ipcRenderer.on('profile-changed', listener);
    return () => {
      ipcRenderer.removeListener('profile-changed', listener);
    };
  },
  
  onShowUserscripts: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('show-userscripts', listener);
    return () => {
      ipcRenderer.removeListener('show-userscripts', listener);
    };
  },
  
  onShowSettings: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('show-settings', listener);
    return () => {
      ipcRenderer.removeListener('show-settings', listener);
    };
  },
  
  onShowProfiles: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('show-profiles', listener);
    return () => {
      ipcRenderer.removeListener('show-profiles', listener);
    };
  }
});

// Add browser navigation functions
contextBridge.exposeInMainWorld('tornBrowser', {
  // Browser controls
  goBack: () => {
    const webview = document.getElementById('browser-view');
    if (webview && webview.canGoBack()) {
      webview.goBack();
    }
  },
  
  goForward: () => {
    const webview = document.getElementById('browser-view');
    if (webview && webview.canGoForward()) {
      webview.goForward();
    }
  },
  
  reload: () => {
    const webview = document.getElementById('browser-view');
    if (webview) {
      webview.reload();
    }
  },
  
  navigate: (url) => {
    const webview = document.getElementById('browser-view');
    if (webview) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      webview.src = url;
    }
  },
  
  executeScript: (code) => {
    const webview = document.getElementById('browser-view');
    if (webview) {
      return webview.executeJavaScript(code);
    }
    return Promise.reject(new Error('Webview not available'));
  },
  
  getURL: () => {
    const webview = document.getElementById('browser-view');
    if (webview) {
      return webview.getURL();
    }
    return '';
  }
});

// Set up a utility API for the renderer
contextBridge.exposeInMainWorld('tornUtils', {
  generateUUID: () => {
    // Simple UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  // Utility for validating userscripts
  validateUserscript: (code) => {
    // Basic validation - check for @match or @include directive
    const hasMatchDirective = /\/\/\s*@match\s+.+/i.test(code);
    const hasIncludeDirective = /\/\/\s*@include\s+.+/i.test(code);
    const hasNameDirective = /\/\/\s*@name\s+.+/i.test(code);
    
    return {
      valid: hasNameDirective && (hasMatchDirective || hasIncludeDirective),
      errors: !hasNameDirective ? ['Missing @name directive'] : 
              !(hasMatchDirective || hasIncludeDirective) ? ['Missing @match or @include directive'] : []
    };
  },
  
  // Extract metadata from userscript
  extractUserscriptMeta: (code) => {
    const metaStart = code.indexOf('// ==UserScript==');
    const metaEnd = code.indexOf('// ==/UserScript==');
    
    if (metaStart === -1 || metaEnd === -1 || metaEnd <= metaStart) {
      return { error: 'Invalid userscript metadata block' };
    }
    
    const metaBlock = code.substring(metaStart, metaEnd + '// ==/UserScript=='.length);
    const meta = {};
    
    // Extract all metadata fields
    const lines = metaBlock.split('\n');
    for (const line of lines) {
      const match = line.match(/\/\/\s*@(\w+)\s+(.+)/);
      if (match) {
        const [, key, value] = match;
        if (meta[key]) {
          if (!Array.isArray(meta[key])) {
            meta[key] = [meta[key]];
          }
          meta[key].push(value.trim());
        } else {
          meta[key] = value.trim();
        }
      }
    }
    
    return meta;
  },
  
  // Match URL pattern with wildcards
  matchUrlPattern: (pattern, url) => {
    if (!pattern || !url) return false;
    
    try {
      // Handle common pattern formats
      // 1. *://*.example.com/* format
      // 2. https://example.com/* format
      // 3. /regex/ format
      
      let regex;
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // It's a regex pattern
        regex = new RegExp(pattern.slice(1, -1));
      } else {
        // Convert glob pattern to regex
        regex = new RegExp(
          '^' + 
          pattern
            .replace(/\*/g, '.*')
            .replace(/[[\](){}?+^$\\.|]/g, '\\$&')
            .replace(/\\\.\*/g, '.*')
          + '$'
        );
      }
      
      return regex.test(url);
    } catch (err) {
      console.error('Invalid URL pattern:', pattern, err);
      return false;
    }
  }
});
