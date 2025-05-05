// renderer.js
window.addEventListener('DOMContentLoaded', () => {
  const webview = document.getElementById('browser-view');
  const urlInput = document.getElementById('url');
  const goBtn = document.getElementById('go');
  const backBtn = document.getElementById('back');
  const forwardBtn = document.getElementById('forward');
  const reloadBtn = document.getElementById('reload');

  // Userscript manager logic
  function getDefaultUserscript() {
    return {
      name: 'New Script',
      match: '*://*/*',
      code: `// ==UserScript==\n// @name     New Script\n// @match    *://*/*\n// ==/UserScript==\nconsole.log('Hello from new userscript!');`,
      enabled: true
    };
  }
  function loadUserscripts() {
    try {
      return JSON.parse(localStorage.getItem('userscripts')) || [getDefaultUserscript()];
    } catch {
      return [getDefaultUserscript()];
    }
  }
  function saveUserscripts(arr) {
    localStorage.setItem('userscripts', JSON.stringify(arr));
  }
  let userscripts = loadUserscripts();
  let selectedIdx = 0;

  // UI elements
  const userscriptList = document.getElementById('userscript-list');
  const addBtn = document.getElementById('add-userscript');
  const nameInput = document.getElementById('userscript-name');
  const matchInput = document.getElementById('userscript-match');
  const codeArea = document.getElementById('userscript-area');
  const saveBtn = document.getElementById('save-userscript');
  const deleteBtn = document.getElementById('delete-userscript');
  const enabledCheckbox = document.getElementById('userscript-enabled');
  const saveStatus = document.getElementById('save-status');
  const exportBtn = document.getElementById('export-userscripts');
  const importBtn = document.getElementById('import-userscripts');
  const importFile = document.getElementById('import-file');
  const scriptCount = document.getElementById('script-count');

  function renderList() {
    userscriptList.innerHTML = '';
    userscripts.forEach((script, i) => {
      const li = document.createElement('li');
      li.className = i === selectedIdx ? 'selected' : '';
      li.innerHTML = `<span class="${script.enabled ? 'enabled-dot' : 'enabled-dot disabled-dot'}"></span>${script.name}`;
      li.onclick = () => {
        selectedIdx = i;
        renderList();
        renderEditor();
      };
      userscriptList.appendChild(li);
    });
  }
  function renderEditor() {
    const script = userscripts[selectedIdx];
    nameInput.value = script.name;
    matchInput.value = script.match || '';
    codeArea.value = script.code;
    enabledCheckbox.checked = script.enabled;
    scriptCount.textContent = userscripts.length + ' script' + (userscripts.length === 1 ? '' : 's');
  }
  addBtn.onclick = () => {
    userscripts.push(getDefaultUserscript());
    selectedIdx = userscripts.length - 1;
    renderList();
    renderEditor();
    saveUserscripts(userscripts);
  };
  saveBtn.onclick = () => {
    userscripts[selectedIdx].name = nameInput.value.trim() || 'Untitled';
    userscripts[selectedIdx].match = matchInput.value.trim() || '*://*/*';
    userscripts[selectedIdx].code = codeArea.value;
    userscripts[selectedIdx].enabled = enabledCheckbox.checked;
    saveUserscripts(userscripts);
    renderList();
    saveStatus.style.display = 'inline';
    setTimeout(() => { saveStatus.style.display = 'none'; }, 1200);
  };
  deleteBtn.onclick = () => {
    if (userscripts.length === 1) return;
    if (!confirm('Delete this userscript?')) return;
    userscripts.splice(selectedIdx, 1);
    selectedIdx = Math.max(0, selectedIdx - 1);
    renderList();
    renderEditor();
    saveUserscripts(userscripts);
  };
  nameInput.oninput = () => {
    userscripts[selectedIdx].name = nameInput.value;
    renderList();
  };
  matchInput.oninput = () => {
    userscripts[selectedIdx].match = matchInput.value;
    saveUserscripts(userscripts);
    renderList();
  };
  enabledCheckbox.onchange = () => {
    userscripts[selectedIdx].enabled = enabledCheckbox.checked;
    saveUserscripts(userscripts);
    renderList();
  };
  // Export userscripts
  exportBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(userscripts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'userscripts.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  // Import userscripts
  importBtn.onclick = () => {
    importFile.click();
  };
  importFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arr = JSON.parse(evt.target.result);
        if (Array.isArray(arr) && arr.every(s => s.name && s.code)) {
          userscripts = arr.map(s => ({
            name: s.name,
            match: s.match || '*://*/*',
            code: s.code,
            enabled: s.enabled !== false
          }));
          selectedIdx = 0;
          saveUserscripts(userscripts);
          renderList();
          renderEditor();
          alert('Userscripts imported!');
        } else {
          alert('Invalid userscript file.');
        }
      } catch {
        alert('Failed to import userscripts.');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  };
  // Initial render
  renderList();
  renderEditor();

  const settingsBtn = document.getElementById('settings');
  const settingsPanel = document.getElementById('settings-panel');
  const closeSettingsBtn = document.getElementById('close-settings');

  settingsBtn.onclick = () => {
    settingsPanel.style.display = 'flex';
    codeArea.focus();
  };
  closeSettingsBtn.onclick = () => {
    settingsPanel.style.display = 'none';
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsPanel.style.display === 'flex') {
      settingsPanel.style.display = 'none';
    }
  });

  function navigate(url) {
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    webview.src = url;
    urlInput.value = url;
  }

  goBtn.onclick = () => navigate(urlInput.value);
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigate(urlInput.value);
  });
  reloadBtn.onclick = () => webview.reload();
  backBtn.onclick = () => webview.goBack();
  forwardBtn.onclick = () => webview.goForward();

  webview.addEventListener('did-navigate', () => {
    urlInput.value = webview.getURL();
  });

  // URL matching utility (simple glob to regex)
  function matchUrl(pattern, url) {
    // Convert * to .*
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return regex.test(url);
  }

  webview.addEventListener('did-finish-load', () => {
    const pageUrl = webview.getURL();
    userscripts.filter(s => s.enabled && matchUrl(s.match || '*://*/*', pageUrl)).forEach(s => {
      webview.executeJavaScript(s.code);
    });
  });
});
