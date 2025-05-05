// utils.js - Utility functions for the application

class Utils {
  // Show a notification to the user
  static showNotification(message, type = 'success') {
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

  // Show a desktop notification
  static showDesktopNotification(title, message) {
    // Get active profile from ProfileManager
    const activeProfile = window.ProfileManager?.getActiveProfile();
    
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

  // Generate a UUID v4
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Validate userscript content
  static validateUserscript(code) {
    if (window.tornUtils && window.tornUtils.validateUserscript) {
      return window.tornUtils.validateUserscript(code);
    }
    
    // Fallback validation implementation
    const hasMatchDirective = /\/\/\s*@match\s+.+/i.test(code);
    const hasIncludeDirective = /\/\/\s*@include\s+.+/i.test(code);
    const hasNameDirective = /\/\/\s*@name\s+.+/i.test(code);
    
    return {
      valid: hasNameDirective && (hasMatchDirective || hasIncludeDirective),
      errors: !hasNameDirective ? ['Missing @name directive'] : 
              !(hasMatchDirective || hasIncludeDirective) ? ['Missing @match or @include directive'] : []
    };
  }

  // Extract metadata from userscript
  static extractUserscriptMeta(code) {
    if (window.tornUtils && window.tornUtils.extractUserscriptMeta) {
      return window.tornUtils.extractUserscriptMeta(code);
    }
    
    // Fallback implementation
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
  }

  // Match URL pattern with wildcards
  static matchUrlPattern(pattern, url) {
    if (window.tornUtils && window.tornUtils.matchUrlPattern) {
      return window.tornUtils.matchUrlPattern(pattern, url);
    }
    
    // Fallback implementation
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
}

// Make Utils globally available
window.Utils = Utils;