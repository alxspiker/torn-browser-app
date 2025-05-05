// utils.js - Utility functions for Torn Browser

/**
 * Format date in a user-friendly format
 * @param {Date|string|number} date - Date to format
 * @return {string} Formatted date
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Generate a UUID v4
 * @return {string} Generated UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @return {Object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Show a notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning)
 */
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

/**
 * Show a desktop notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Notification options
 */
function showDesktopNotification(title, message, options = {}) {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, { 
      body: message,
      icon: '/assets/icon.png',
      ...options
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { 
          body: message,
          icon: '/assets/icon.png',
          ...options
        });
      }
    });
  }
}

/**
 * Check if a URL matches a pattern with wildcards
 * @param {string} pattern - URL pattern with wildcards
 * @param {string} url - URL to check
 * @return {boolean} Whether the URL matches
 */
function matchUrlPattern(pattern, url) {
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

/**
 * Format cooldown time in a human-readable format
 * @param {number} seconds - Seconds remaining
 * @return {string} Formatted time string
 */
function formatCooldown(time) {
  if (!time) return 'Ready';
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Load HTML template and inject it into a container
 * @param {string} templatePath - Path to the template file
 * @param {string} containerId - ID of the container element
 * @return {Promise<boolean>} Whether the template was successfully loaded
 */
async function loadTemplate(templatePath, containerId) {
  try {
    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID '${containerId}' not found`);
      return false;
    }
    
    // Fetch template
    console.log(`Loading template from ${templatePath}...`);
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Inject template into container
    container.innerHTML = html;
    console.log(`Template ${templatePath} loaded successfully`);
    
    return true;
  } catch (err) {
    console.error(`Error loading template ${templatePath}:`, err);
    return false;
  }
}

/**
 * Load a CSS file dynamically
 * @param {string} cssPath - Path to the CSS file
 * @return {Promise<boolean>} Whether the CSS file was successfully loaded
 */
async function loadCSS(cssPath) {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = cssPath;
    
    link.onload = () => {
      console.log(`CSS file ${cssPath} loaded successfully`);
      resolve(true);
    };
    
    link.onerror = (err) => {
      console.error(`Failed to load CSS file ${cssPath}:`, err);
      resolve(false);
    };
    
    document.head.appendChild(link);
  });
}

/**
 * Safely access nested object properties
 * @param {Object} obj - Object to access
 * @param {string} path - Path to access (e.g., 'a.b.c')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @return {*} Value at path or default value
 */
function getObjectPath(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
}

// Export all functions
window.Utils = {
  formatDate,
  generateUUID,
  deepClone,
  showNotification,
  showDesktopNotification,
  matchUrlPattern,
  formatCooldown,
  loadTemplate,
  loadCSS,
  getObjectPath
};