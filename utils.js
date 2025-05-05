// utils.js - Utility functions for Torn Browser

/**
 * Format currency with commas and dollar sign
 * @param {number} amount - The amount to format
 * @return {string} Formatted currency string
 */
function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-US');
}

/**
 * Format time remaining in a human-readable format
 * @param {number} seconds - Seconds remaining
 * @return {string} Formatted time string
 */
function formatTimeRemaining(seconds) {
  if (seconds <= 0) return 'Ready';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

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
 * Extract userscript metadata from code
 * @param {string} code - Userscript code
 * @return {Object} Extracted metadata
 */
function extractUserscriptMeta(code) {
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

/**
 * Validate a userscript
 * @param {string} code - Userscript code
 * @return {Object} Validation result
 */
function validateUserscript(code) {
  // Check for required metadata
  const meta = extractUserscriptMeta(code);
  
  if (meta.error) {
    return {
      valid: false,
      errors: [meta.error]
    };
  }
  
  const errors = [];
  
  // Check for required metadata fields
  if (!meta.name) {
    errors.push('Missing @name directive');
  }
  
  if (!meta.match && !meta.include) {
    errors.push('Missing @match or @include directive');
  }
  
  // Basic syntax check
  try {
    // This is a simple check, not a full parse
    Function(code);
  } catch (err) {
    errors.push(`Syntax error: ${err.message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
    meta: meta
  };
}

// Export utilities
module.exports = {
  formatCurrency,
  formatTimeRemaining,
  formatDate,
  generateUUID,
  deepClone,
  matchUrlPattern,
  extractUserscriptMeta,
  validateUserscript
};
