// userscript-manager.js - Manages userscripts
class UserscriptManager {
  constructor() {
    this.userscripts = [];
    this.selectedScriptIndex = 0;
    this.codeEditor = null;
    this.initialized = false;
    
    // UI elements will be initialized in init()
    this.elements = {};
  }
  
  async init() {
    try {
      console.log('Initializing Userscript Manager...');
      
      // Initialize UI elements
      this.elements = {
        userscriptList: document.getElementById('userscript-list'),
        newScriptButton: document.getElementById('new-script'),
        scriptNameInput: document.getElementById('script-name'),
        scriptMatchInput: document.getElementById('script-match'),
        scriptEnabledCheckbox: document.getElementById('script-enabled'),
        validateScriptButton: document.getElementById('validate-script'),
        saveScriptButton: document.getElementById('save-script'),
        deleteScriptButton: document.getElementById('delete-script'),
        exportScriptsButton: document.getElementById('export-scripts'),
        importScriptsButton: document.getElementById('import-scripts'),
        importFileInput: document.getElementById('import-file'),
        userscriptsButton: document.getElementById('userscripts-button'),
        scriptsCount: document.getElementById('scripts-count'),
        codeEditorElement: document.getElementById('code-editor')
      };

      this.ensureCodeEditorInitialized = () => {
        if (!this.codeEditor) {
          this.initCodeEditor();
        } else {
          this.codeEditor.refresh(); // Refresh the editor if already initialized
        }
      };
      
      // Check if all required elements are available
      if (!this.elements.userscriptList || !this.elements.codeEditorElement) {
        console.warn('Some userscript manager UI elements not found, they might not be loaded yet');
      }
      
      // Initialize event listeners
      this.setupEventListeners();
      
      // Register event from main process
      if (window.tornAPI && window.tornAPI.onShowUserscripts) {
        window.tornAPI.onShowUserscripts(() => {
          if (window.UI) {
            window.UI.openModal('userscript-modal');
            this.ensureCodeEditorInitialized(); 
          }
        });
      }
      
      // Pre-load userscripts
      this.loadUserscripts();

      // Check for updates
      await this.checkAllForUpdates();
      
      this.initialized = true;
      console.log('Userscript Manager initialized');
      
      return this;
    } catch (error) {
      console.error('Error initializing Userscript Manager:', error);
      return this;
    }
  }
  
  setupEventListeners() {
    // Skip if UI elements aren't available yet

    // New script button
    if (this.elements.newScriptButton) {
      this.elements.newScriptButton.addEventListener('click', () => this.createNewScript());
    }
    
    // Save script button
    if (this.elements.saveScriptButton) {
      this.elements.saveScriptButton.addEventListener('click', () => this.saveCurrentScript());
    }
    
    // Delete script button
    if (this.elements.deleteScriptButton) {
      this.elements.deleteScriptButton.addEventListener('click', () => this.deleteCurrentScript());
    }
    
    // Validate script button
    if (this.elements.validateScriptButton) {
      this.elements.validateScriptButton.addEventListener('click', () => this.validateCurrentScript());
    }
    
    // Export scripts button
    if (this.elements.exportScriptsButton) {
      this.elements.exportScriptsButton.addEventListener('click', () => this.exportAllScripts());
    }
    
    // Import scripts button
    if (this.elements.importScriptsButton) {
      this.elements.importScriptsButton.addEventListener('click', () => this.importScripts());
    }
    
    // Import file input
    if (this.elements.importFileInput) {
      this.elements.importFileInput.addEventListener('change', (e) => this.handleImportedFile(e));
    }
    
    // Download URL input
    const downloadUrlInput = document.getElementById('script-download-url');
    if (downloadUrlInput) {
      downloadUrlInput.addEventListener('input', () => {
        this._updateMetaInCode('// @downloadURL', downloadUrlInput.value);
      });
    }

    // Update URL input
    const updateUrlInput = document.getElementById('script-update-url');
    if (updateUrlInput) {
      updateUrlInput.addEventListener('input', () => {
        this._updateMetaInCode('// @updateURL', updateUrlInput.value);
      });
    }

    // Script name input
    if (this.elements.scriptNameInput) {
      this.elements.scriptNameInput.addEventListener('input', () => {
        this._updateMetaInCode('// @name', this.elements.scriptNameInput.value);
        if (this.userscripts.length > 0) {
          this.userscripts[this.selectedScriptIndex].name = this.elements.scriptNameInput.value;
          this.renderUserscriptList();
        }
      });
    }
    
    // Script enabled checkbox
    if (this.elements.scriptEnabledCheckbox) {
      this.elements.scriptEnabledCheckbox.addEventListener('change', () => {
        if (this.userscripts.length > 0) {
          this.userscripts[this.selectedScriptIndex].enabled = this.elements.scriptEnabledCheckbox.checked;
          this.renderUserscriptList();
          this.saveUserscripts();
        }
      });
    }

    // Tab switching
    const tabEdit = document.getElementById('tab-edit');
    const tabSettings = document.getElementById('tab-settings');
    const tabContentEdit = document.getElementById('tab-content-edit');
    const tabContentSettings = document.getElementById('tab-content-settings');
    if (tabEdit && tabSettings && tabContentEdit && tabContentSettings) {
      tabEdit.addEventListener('click', () => {
        tabEdit.classList.add('active');
        tabSettings.classList.remove('active');
        tabContentEdit.style.display = 'block';
        tabContentSettings.style.display = 'none';
      });
      tabSettings.addEventListener('click', () => {
        tabSettings.classList.add('active');
        tabEdit.classList.remove('active');
        tabContentSettings.style.display = 'block';
        tabContentEdit.style.display = 'none';
      });
    }

    // Autoupdate toggle
    const autoupdateCheckbox = document.getElementById('script-autoupdate');
    if (autoupdateCheckbox) {
      autoupdateCheckbox.addEventListener('change', () => {
        if (this.userscripts.length > 0) {
          this.userscripts[this.selectedScriptIndex].autoupdate = autoupdateCheckbox.checked;
          this.saveUserscripts();
        }
      });
    }

    // Update button
    const updateBtn = document.getElementById('script-update-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', async () => {
        await this.updateScriptToLatest(this.selectedScriptIndex);
      });
    }

    // Check for update (single script)
    const checkUpdateBtn = document.getElementById('script-check-update-btn');
    if (checkUpdateBtn) {
      checkUpdateBtn.addEventListener('click', async () => {
        await this.checkForUpdate(this.selectedScriptIndex);
        this.renderUserscriptList();
        this.updateScriptEditor();
        if (window.Utils) window.Utils.showNotification('Checked for update.');
      });
    }

    // Check all for updates (all scripts)
    const checkAllBtn = document.getElementById('check-all-updates-btn');
    if (checkAllBtn) {
      checkAllBtn.addEventListener('click', async () => {
        await this.checkAllForUpdates();
        if (window.Utils) window.Utils.showNotification('Checked all scripts for updates.');
      });
    }
  }
  
  // Helper to update a userscript meta line in the code editor
  _updateMetaInCode(metaKey, value) {
    if (!this.codeEditor) return;
    let code = this.codeEditor.getValue();
    const metaRegex = new RegExp(`^(${metaKey}\\s+).*`, 'm');
    if (metaRegex.test(code)) {
      if (value.trim()) {
        code = code.replace(metaRegex, `$1${value}`);
      } else {
        code = code.replace(metaRegex, '');
      }
    } else if (value.trim()) {
      // Insert after the last meta line
      const lines = code.split('\n');
      let lastMetaIdx = lines.findIndex(line => line.startsWith('// ==/UserScript=='));
      if (lastMetaIdx === -1) lastMetaIdx = lines.findIndex(line => line.startsWith('// ==UserScript=='));
      if (lastMetaIdx === -1) lastMetaIdx = 0;
      // Find last meta line before ==/UserScript==
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('// @')) lastMetaIdx = i;
        if (lines[i].startsWith('// ==/UserScript==')) break;
      }
      lines.splice(lastMetaIdx + 1, 0, `${metaKey} ${value}`);
      code = lines.join('\n');
    }
    this.codeEditor.setValue(code);
  }

  initCodeEditor() {
    if (!this.elements.codeEditorElement) {
      console.error('Code editor element not found');
      return;
    }
    if (this.codeEditor) {
      // Editor already initialized
      return;
    }
    if (typeof CodeMirror === 'undefined') {
      console.error('CodeMirror not loaded');
      if (window.Utils) {
        window.Utils.showNotification('CodeMirror editor not loaded', 'error');
      }
      return;
    }
    this.codeEditor = CodeMirror.fromTextArea(this.elements.codeEditorElement, {
      mode: 'javascript',
      theme: 'material',
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      tabSize: 2,
      indentWithTabs: false,
      extraKeys: {
        'Ctrl-Space': 'autocomplete'
      },
      gutters: ['CodeMirror-lint-markers'],
      lint: {
        esversion: 11,
        asi: true
      }
    });
    this.codeEditor.on('change', () => {
      // Auto-save after a delay
      if (window.autoSaveTimeout) {
        clearTimeout(window.autoSaveTimeout);
      }
      window.autoSaveTimeout = setTimeout(() => {
        if (this.userscripts.length > 0) {
          this.userscripts[this.selectedScriptIndex].code = this.codeEditor.getValue();
          this.saveUserscripts();
        }
      }, 2000);
    });
    // Update editor with current script
    this.updateScriptEditor();
    console.log('CodeMirror editor initialized');
  }
  
  loadUserscripts() {
    try {
      if (!window.ProfileManager || !window.ProfileManager.getActiveProfile) {
        console.error('ProfileManager not available');
        return;
      }
      
      const activeProfile = window.ProfileManager.getActiveProfile();
      
      if (activeProfile && activeProfile.userscripts) {
        this.userscripts = activeProfile.userscripts;
      } else {
        this.userscripts = [this.getDefaultUserscript()];
        if (activeProfile) {
          activeProfile.userscripts = this.userscripts;
          window.ProfileManager.saveProfile();
        }
      }
      
      this.renderUserscriptList();
      
      // If code editor is already initialized, update it
      if (this.codeEditor) {
        this.updateScriptEditor();
      }
    } catch (error) {
      console.error('Error loading userscripts:', error);
      this.userscripts = [this.getDefaultUserscript()];
      this.renderUserscriptList();
    }
  }
  
  getDefaultUserscript() {
    return {
      name: 'New Script',
      match: '*://*.torn.com/*',
      code: `// ==UserScript==
// @name     New Script
// @version  1.0.0
// @downloadURL https://example.org/scripts/new-script.user.js
// @updateURL https://example.org/scripts/new-script.meta.js
// @match    *://*.torn.com/*
// ==/UserScript==

console.log('Hello from new userscript!');

// This is a sample userscript for Torn.com
// You can modify this to add custom functionality to the site.
`,
      enabled: true,
      autoupdate: false
    };
  }
  
  renderUserscriptList() {
    if (!this.elements.userscriptList) return;
    
    this.elements.userscriptList.innerHTML = '';
    
    this.userscripts.forEach((script, index) => {
      const item = document.createElement('div');
      item.className = 'script-list-item' + (index === this.selectedScriptIndex ? ' active' : '');
      
      let updateIcon = '';
      if (script.hasUpdate) {
        updateIcon = '<span title="Update available" style="color: var(--accent-color); font-size: 1.2em; margin-right: 4px;">⬆️</span>';
      }

      item.innerHTML = `
        <div class="script-status-dot ${script.enabled ? 'enabled' : ''}"></div>
        ${updateIcon}<span>${script.name}</span>
      `;
      
      item.addEventListener('click', () => {
        this.selectedScriptIndex = index;
        this.renderUserscriptList();
        this.updateScriptEditor();
      });
      
      this.elements.userscriptList.appendChild(item);
    });
    
    // Update scripts count in status bar
    if (this.elements.scriptsCount) {
      const enabledCount = this.userscripts.filter(s => s.enabled).length;
      this.elements.scriptsCount.textContent = enabledCount;
    }
  }
  
  updateScriptEditor() {
    if (!this.codeEditor || this.userscripts.length === 0) return;
    
    const script = this.userscripts[this.selectedScriptIndex];
    
    if (this.elements.scriptNameInput) {
      this.elements.scriptNameInput.value = script.name;
    }
    
    if (this.elements.scriptMatchInput) {
      this.elements.scriptMatchInput.value = script.match || '*://*.torn.com/*';
    }
    
    if (this.elements.scriptEnabledCheckbox) {
      this.elements.scriptEnabledCheckbox.checked = script.enabled;
    }

    // Sync meta fields from code
    const code = this.codeEditor.getValue();
    const nameMatch = code.match(/^\/\/\s*@name\s+(.+)$/m);
    if (this.elements.scriptNameInput) {
      this.elements.scriptNameInput.value = nameMatch ? nameMatch[1].trim() : (script.name || '');
    }
    const downloadUrlInput = document.getElementById('script-download-url');
    const downloadMatch = code.match(/^\/\/\s*@downloadURL\s+(.+)$/m);
    if (downloadUrlInput) downloadUrlInput.value = downloadMatch ? downloadMatch[1].trim() : (script.downloadUrl || '');
    const updateUrlInput = document.getElementById('script-update-url');
    const updateMatch = code.match(/^\/\/\s*@updateURL\s+(.+)$/m);
    if (updateUrlInput) updateUrlInput.value = updateMatch ? updateMatch[1].trim() : (script.updateUrl || '');

    // Autoupdate checkbox
    const autoupdateCheckbox = document.getElementById('script-autoupdate');
    if (autoupdateCheckbox) autoupdateCheckbox.checked = !!script.autoupdate;

    // Update button visibility
    const updateStatus = document.getElementById('script-update-status');
    if (updateStatus) updateStatus.style.display = script.hasUpdate ? '' : 'none';

    this.codeEditor.setValue(script.code || '');
    this.codeEditor.clearHistory();
  }
  
  createNewScript() {
    const newScript = this.getDefaultUserscript();
    this.userscripts.push(newScript);
    this.selectedScriptIndex = this.userscripts.length - 1;
    
    this.renderUserscriptList();
    this.updateScriptEditor();
    this.saveUserscripts();
  }
  
  saveCurrentScript() {
    if (this.userscripts.length === 0 || !this.codeEditor) return;
    
    const script = this.userscripts[this.selectedScriptIndex];
    
    if (this.elements.scriptNameInput) {
      script.name = this.elements.scriptNameInput.value.trim() || 'Untitled Script';
    }
    
    if (this.elements.scriptMatchInput) {
      script.match = this.elements.scriptMatchInput.value.trim() || '*://*.torn.com/*';
    }
    
    if (this.elements.scriptEnabledCheckbox) {
      script.enabled = this.elements.scriptEnabledCheckbox.checked;
    }
    
    // Save download/update URLs from fields
    const downloadUrlInput = document.getElementById('script-download-url');
    if (downloadUrlInput) script.downloadUrl = downloadUrlInput.value.trim();
    const updateUrlInput = document.getElementById('script-update-url');
    if (updateUrlInput) script.updateUrl = updateUrlInput.value.trim();

    script.code = this.codeEditor.getValue();
    
    this.renderUserscriptList();
    this.saveUserscripts();
    
    // Show confirmation
    if (window.Utils) {
      window.Utils.showNotification('Script saved successfully');
    }
  }
  
  deleteCurrentScript() {
    if (this.userscripts.length <= 1) {
      if (window.Utils) {
        window.Utils.showNotification('Cannot delete the last script', 'error');
      }
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${this.userscripts[this.selectedScriptIndex].name}"?`)) {
      return;
    }
    
    this.userscripts.splice(this.selectedScriptIndex, 1);
    this.selectedScriptIndex = Math.max(0, this.selectedScriptIndex - 1);
    
    this.renderUserscriptList();
    this.updateScriptEditor();
    this.saveUserscripts();
  }
  
  saveUserscripts() {
    if (!window.ProfileManager || !window.ProfileManager.getActiveProfile) {
      console.error('ProfileManager not available');
      return;
    }
    
    const activeProfile = window.ProfileManager.getActiveProfile();
    if (!activeProfile) return;
    
    activeProfile.userscripts = this.userscripts;
    window.ProfileManager.saveProfile();
  }
  
  validateCurrentScript() {
    if (!this.codeEditor || this.userscripts.length === 0) return;
    
    const code = this.codeEditor.getValue();
    
    if (window.tornUtils && window.tornUtils.validateUserscript) {
      const result = window.tornUtils.validateUserscript(code);
      
      if (result.valid) {
        if (window.Utils) {
          window.Utils.showNotification('Script validation passed');
        }
      } else {
        if (window.Utils) {
          window.Utils.showNotification(`Validation failed: ${result.errors.join(', ')}`, 'error');
        }
      }
      return;
    }
    
    // Fallback validation if tornUtils is not available
    const hasMatchDirective = /\/\/\s*@match\s+.+/i.test(code);
    const hasIncludeDirective = /\/\/\s*@include\s+.+/i.test(code);
    const hasNameDirective = /\/\/\s*@name\s+.+/i.test(code);
    
    const valid = hasNameDirective && (hasMatchDirective || hasIncludeDirective);
    const errors = [];
    
    if (!hasNameDirective) errors.push('Missing @name directive');
    if (!(hasMatchDirective || hasIncludeDirective)) errors.push('Missing @match or @include directive');
    
    if (valid) {
      if (window.Utils) {
        window.Utils.showNotification('Script validation passed');
      }
    } else {
      if (window.Utils) {
        window.Utils.showNotification(`Validation failed: ${errors.join(', ')}`, 'error');
      }
    }
  }
  
  exportAllScripts() {
    const blob = new Blob([JSON.stringify(this.userscripts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'torn-userscripts.json';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  importScripts() {
    if (this.elements.importFileInput) {
      this.elements.importFileInput.click();
    }
  }
  
  handleImportedFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        
        if (Array.isArray(data) && data.length > 0 && data.every(s => s.name && s.code)) {
          if (confirm(`Import ${data.length} userscript(s)? This will replace your current scripts.`)) {
            this.userscripts = data.map(s => ({
              name: s.name,
              match: s.match || '*://*.torn.com/*',
              code: s.code,
              enabled: s.enabled !== false
            }));
            
            this.selectedScriptIndex = 0;
            this.saveUserscripts();
            this.renderUserscriptList();
            this.updateScriptEditor();
            
            if (window.Utils) {
              window.Utils.showNotification(`Successfully imported ${data.length} userscript(s)`);
            }
          }
        } else {
          if (window.Utils) {
            window.Utils.showNotification('Invalid userscript file format', 'error');
          }
        }
      } catch (err) {
        if (window.Utils) {
          window.Utils.showNotification('Failed to parse import file', 'error');
        }
        console.error('Import error:', err);
      }
    };
    
    reader.readAsText(file);
    if (this.elements.importFileInput) {
      this.elements.importFileInput.value = '';
    }
  }
  
  injectUserscripts(url) {
    try {
      // Use the correct webview reference
      const webview = window.BrowserControls && window.BrowserControls.webview;
      if (!url || !webview || typeof webview.executeJavaScript !== 'function') {
        console.error('Browser webview not available for script injection');
        return 0;
      }
      let injectedCount = 0;
      const matchingScripts = this.userscripts.filter(script => {
        if (!script.enabled) return false;
        
        // Use the utility function if available, otherwise use simple matching
        if (window.Utils && window.Utils.matchUrlPattern) {
          return window.Utils.matchUrlPattern(script.match, url);
        } else if (window.tornUtils && window.tornUtils.matchUrlPattern) {
          return window.tornUtils.matchUrlPattern(script.match, url);
        } else {
          // Very simple fallback matcher
          const pattern = script.match || '*://*.torn.com/*';
          return (pattern === '*' || url.includes(pattern.replace(/\*/g, '')));
        }
      });
      
      // Inject matching scripts
      matchingScripts.forEach(script => {
        webview.executeJavaScript(script.code)
          .then(() => {
            injectedCount++;
            if (this.elements.scriptsCount) {
              this.elements.scriptsCount.textContent = injectedCount;
            }
          })
          .catch(err => {
            console.error('Script injection error:', err);
          });
      });
      
      console.log(`Injected ${matchingScripts.length} userscripts for URL: ${url}`);
      return matchingScripts.length;
    } catch (err) {
      console.error('Error injecting userscripts:', err);
      return 0;
    }
  }
  
  async checkAllForUpdates() {
    for (let i = 0; i < this.userscripts.length; i++) {
      await this.checkForUpdate(i);
    }
    this.renderUserscriptList();
  }

  async checkForUpdate(index) {
    const script = this.userscripts[index];
    if (!script || !script.autoupdate || !script.updateUrl) {
      script.hasUpdate = false;
      return;
    }
    try {
      const meta = await this.fetchRemoteMeta(script.updateUrl);
      if (meta && meta.version && this.getScriptVersion(script.code) && this.isVersionNewer(meta.version, this.getScriptVersion(script.code))) {
        script.hasUpdate = true;
        script.latestVersion = meta.version;
        script.latestCode = meta.fullCode;
      } else {
        script.hasUpdate = false;
      }
    } catch (e) {
      script.hasUpdate = false;
    }
  }

  async updateScriptToLatest(index) {
    const script = this.userscripts[index];
    if (!script || !script.hasUpdate || !script.latestCode) return;
    script.code = script.latestCode;
    script.hasUpdate = false;
    script.latestVersion = undefined;
    script.latestCode = undefined;
    this.saveUserscripts();
    this.updateScriptEditor();
    if (window.Utils) window.Utils.showNotification('Script updated to latest version');
  }

  async fetchRemoteMeta(url) {
    const resp = await fetch(url);
    const text = await resp.text();
    const versionMatch = text.match(/^\/\/\s*@version\s+(.+)$/m);
    return {
      version: versionMatch ? versionMatch[1].trim() : null,
      fullCode: text
    };
  }

  getScriptVersion(code) {
    const match = code.match(/^\/\/\s*@version\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }

  isVersionNewer(remote, local) {
    // Simple semver compare
    if (!remote || !local) return false;
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);
    for (let i = 0; i < Math.max(r.length, l.length); i++) {
      if ((r[i] || 0) > (l[i] || 0)) return true;
      if ((r[i] || 0) < (l[i] || 0)) return false;
    }
    return false;
  }

  getUserscripts() {
    return this.userscripts;
  }
}

// Create global UserscriptManager instance
window.UserscriptManager = new UserscriptManager();