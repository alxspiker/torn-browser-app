// userscript-manager.js - Manages userscripts
class UserscriptManager {
  constructor() {
    this.userscripts = [];
    this.selectedScriptIndex = 0;
    this.codeEditor = null;
    
    // UI elements
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
      scriptsCount: document.getElementById('scripts-count')
    };
  }
  
  async init() {
    // Initialize CodeMirror when first needed
    this.setupEventListeners();
    
    // Register event from main process
    window.tornAPI.onShowUserscripts(() => {
      UI.openModal('userscript-modal');
      if (!this.codeEditor) {
        setTimeout(() => this.initCodeEditor(), 100);
      }
    });
    
    return this;
  }
  
  setupEventListeners() {
    // Userscript modal button
    this.elements.userscriptsButton.addEventListener('click', () => {
      UI.openModal('userscript-modal');
      if (!this.codeEditor) {
        setTimeout(() => this.initCodeEditor(), 100);
      }
    });
    
    // New script button
    this.elements.newScriptButton.addEventListener('click', () => this.createNewScript());
    
    // Save script button
    this.elements.saveScriptButton.addEventListener('click', () => this.saveCurrentScript());
    
    // Delete script button
    this.elements.deleteScriptButton.addEventListener('click', () => this.deleteCurrentScript());
    
    // Validate script button
    this.elements.validateScriptButton.addEventListener('click', () => this.validateCurrentScript());
    
    // Export scripts button
    this.elements.exportScriptsButton.addEventListener('click', () => this.exportAllScripts());
    
    // Import scripts button
    this.elements.importScriptsButton.addEventListener('click', () => this.importScripts());
    
    // Import file input
    this.elements.importFileInput.addEventListener('change', (e) => this.handleImportedFile(e));
    
    // Script name input
    this.elements.scriptNameInput.addEventListener('input', () => {
      if (this.userscripts.length > 0) {
        this.userscripts[this.selectedScriptIndex].name = this.elements.scriptNameInput.value;
        this.renderUserscriptList();
      }
    });
    
    // Script enabled checkbox
    this.elements.scriptEnabledCheckbox.addEventListener('change', () => {
      if (this.userscripts.length > 0) {
        this.userscripts[this.selectedScriptIndex].enabled = this.elements.scriptEnabledCheckbox.checked;
        this.renderUserscriptList();
        this.saveUserscripts();
      }
    });
  }
  
  initCodeEditor() {
    this.codeEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
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
    
    // Load userscripts after editor is ready
    this.loadUserscripts();
  }
  
  loadUserscripts() {
    const activeProfile = window.ProfileManager.getActiveProfile();
    
    if (activeProfile && activeProfile.userscripts) {
      this.userscripts = activeProfile.userscripts;
    } else {
      this.userscripts = [this.getDefaultUserscript()];
      if (activeProfile) {
        activeProfile.userscripts = this.userscripts;
        window.ProfileManager.saveActiveProfile();
      }
    }
    
    this.renderUserscriptList();
    this.updateScriptEditor();
  }
  
  getDefaultUserscript() {
    return {
      name: 'New Script',
      match: '*://*.torn.com/*',
      code: `// ==UserScript==
// @name     New Script
// @match    *://*.torn.com/*
// ==/UserScript==

console.log('Hello from new userscript!');

// This is a sample userscript for Torn.com
// You can modify this to add custom functionality to the site.
`,
      enabled: true
    };
  }
  
  renderUserscriptList() {
    if (!this.elements.userscriptList) return;
    
    this.elements.userscriptList.innerHTML = '';
    
    this.userscripts.forEach((script, index) => {
      const item = document.createElement('div');
      item.className = 'script-list-item' + (index === this.selectedScriptIndex ? ' active' : '');
      
      item.innerHTML = `
        <div class="script-status-dot ${script.enabled ? 'enabled' : ''}"></div>
        <span>${script.name}</span>
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
    
    this.elements.scriptNameInput.value = script.name;
    this.elements.scriptMatchInput.value = script.match || '*://*.torn.com/*';
    this.elements.scriptEnabledCheckbox.checked = script.enabled;
    
    this.codeEditor.setValue(script.code);
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
    if (this.userscripts.length === 0) return;
    
    const script = this.userscripts[this.selectedScriptIndex];
    
    script.name = this.elements.scriptNameInput.value.trim() || 'Untitled Script';
    script.match = this.elements.scriptMatchInput.value.trim() || '*://*.torn.com/*';
    script.enabled = this.elements.scriptEnabledCheckbox.checked;
    script.code = this.codeEditor.getValue();
    
    this.renderUserscriptList();
    this.saveUserscripts();
    
    // Show confirmation
    Utils.showNotification('Script saved successfully');
  }
  
  deleteCurrentScript() {
    if (this.userscripts.length <= 1) {
      Utils.showNotification('Cannot delete the last script', 'error');
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
    const activeProfile = window.ProfileManager.getActiveProfile();
    if (!activeProfile) return;
    
    activeProfile.userscripts = this.userscripts;
    window.ProfileManager.saveActiveProfile();
  }
  
  validateCurrentScript() {
    if (!this.codeEditor || this.userscripts.length === 0) return;
    
    const code = this.codeEditor.getValue();
    const hasMatchDirective = /\/\/\s*@match\s+.+/i.test(code);
    const hasIncludeDirective = /\/\/\s*@include\s+.+/i.test(code);
    const hasNameDirective = /\/\/\s*@name\s+.+/i.test(code);
    
    const valid = hasNameDirective && (hasMatchDirective || hasIncludeDirective);
    const errors = [];
    
    if (!hasNameDirective) errors.push('Missing @name directive');
    if (!(hasMatchDirective || hasIncludeDirective)) errors.push('Missing @match or @include directive');
    
    if (valid) {
      Utils.showNotification('Script validation passed');
    } else {
      Utils.showNotification(`Validation failed: ${errors.join(', ')}`, 'error');
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
    this.elements.importFileInput.click();
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
            
            Utils.showNotification(`Successfully imported ${data.length} userscript(s)`);
          }
        } else {
          Utils.showNotification('Invalid userscript file format', 'error');
        }
      } catch (err) {
        Utils.showNotification('Failed to parse import file', 'error');
        console.error('Import error:', err);
      }
    };
    
    reader.readAsText(file);
    this.elements.importFileInput.value = '';
  }
  
  injectUserscripts(url) {
    try {
      let injectedCount = 0;
      
      this.userscripts.filter(script => script.enabled && Utils.matchUrlPattern(script.match, url))
        .forEach(script => {
          window.tornBrowser.executeScript(script.code)
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
    } catch (err) {
      console.error('Error injecting userscripts:', err);
    }
  }
  
  getUserscripts() {
    return this.userscripts;
  }
}

// Create global UserscriptManager instance
window.UserscriptManager = new UserscriptManager();