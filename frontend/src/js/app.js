import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Toast } from '@capacitor/toast';

// API endpoint (change in production)
const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
const openBrowserBtn = document.getElementById('open-browser');
const closeBrowserBtn = document.getElementById('close-browser');
const backBtn = document.getElementById('back-btn');
const reloadBtn = document.getElementById('reload-btn');
const browserContainer = document.getElementById('browser-container');
const webviewContainer = document.getElementById('webview-container');
const userscriptsBtn = document.getElementById('userscripts-btn');
const userscriptsModal = document.getElementById('userscripts-modal');
const closeUserscriptsBtn = document.getElementById('close-userscripts');
const userscriptsList = document.getElementById('userscripts-list');
const playerInfo = document.getElementById('player-info');
const saveAlertsBtn = document.getElementById('save-alerts');

// Store userscripts
let userscripts = [];

// Store API key
let apiKey = '';

// Initialize app
async function initApp() {
    try {
        // Get API key from storage
        const { value } = await Preferences.get({ key: 'tornApiKey' });
        if (value) {
            apiKey = value;
            loadPlayerData();
        } else {
            promptForApiKey();
        }
        
        // Load userscripts
        loadUserscripts();
        
        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing app');
    }
}

// Load player data from API
async function loadPlayerData() {
    try {
        const response = await fetch(`${API_BASE_URL}/torn/user?key=${apiKey}`);
        const data = await response.json();
        
        if (data.error) {
            playerInfo.innerHTML = `<p class="error">Error: ${data.error.error}</p>`;
            return;
        }
        
        playerInfo.innerHTML = `
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Level:</strong> ${data.level}</p>
            <p><strong>Status:</strong> ${data.status.state}</p>
            <div class="stats">
                <div class="stat">
                    <span>Energy</span>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(data.energy.current / data.energy.maximum) * 100}%"></div>
                    </div>
                    <span>${data.energy.current}/${data.energy.maximum}</span>
                </div>
                <div class="stat">
                    <span>Nerve</span>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(data.nerve.current / data.nerve.maximum) * 100}%"></div>
                    </div>
                    <span>${data.nerve.current}/${data.nerve.maximum}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading player data:', error);
        playerInfo.innerHTML = `<p class="error">Error loading player data</p>`;
    }
}

// Load userscripts from API
async function loadUserscripts() {
    try {
        const response = await fetch(`${API_BASE_URL}/torn/userscripts`);
        userscripts = await response.json();
        renderUserscriptsList();
    } catch (error) {
        console.error('Error loading userscripts:', error);
        showToast('Error loading userscripts');
    }
}

// Render userscripts list
function renderUserscriptsList() {
    userscriptsList.innerHTML = userscripts.map(script => `
        <div class="userscript-item">
            <div class="userscript-header">
                <h3>${script.name}</h3>
                <label class="switch">
                    <input type="checkbox" data-id="${script.id}" ${script.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <p>${script.description}</p>
        </div>
    `).join('');
    
    // Add event listeners to toggles
    userscriptsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleUserscriptToggle);
    });
}

// Handle userscript toggle
function handleUserscriptToggle(e) {
    const scriptId = parseInt(e.target.dataset.id);
    const enabled = e.target.checked;
    
    // Update local userscripts array
    userscripts = userscripts.map(script => {
        if (script.id === scriptId) {
            return { ...script, enabled };
        }
        return script;
    });
    
    // In a real app, you would save this to the server
    showToast(`Userscript ${enabled ? 'enabled' : 'disabled'}`);
}

// Open browser with torn.com
function openBrowser() {
    // Create iframe for webview
    const webview = document.createElement('iframe');
    webview.id = 'webview';
    webview.src = 'https://www.torn.com';
    webview.style.width = '100%';
    webview.style.height = '100%';
    webview.style.border = 'none';
    
    // Clear container and add webview
    webviewContainer.innerHTML = '';
    webviewContainer.appendChild(webview);
    
    // Show browser container
    browserContainer.classList.remove('hidden');
    
    // Add event listener for load
    webview.addEventListener('load', injectUserscripts);
}

// Inject enabled userscripts
function injectUserscripts() {
    const webview = document.getElementById('webview');
    if (!webview) return;
    
    const enabledScripts = userscripts.filter(script => script.enabled);
    if (enabledScripts.length === 0) return;
    
    const scriptCode = enabledScripts.map(script => script.code).join('\n\n');
    
    // In a production app, you would use the Capacitor JavaScript bridge
    // For this demo, we'll use a simple approach that works in browser
    try {
        webview.contentWindow.eval(scriptCode);
        showToast(`Injected ${enabledScripts.length} userscripts`);
    } catch (error) {
        console.error('Error injecting userscripts:', error);
        showToast('Error injecting userscripts');
    }
}

// Prompt for API key
function promptForApiKey() {
    const key = prompt('Please enter your Torn API key:');
    if (key) {
        apiKey = key;
        Preferences.set({ key: 'tornApiKey', value: key });
        loadPlayerData();
    }
}

// Save alerts
function saveAlerts() {
    const energyAlert = document.getElementById('energy-alert').value;
    const nerveAlert = document.getElementById('nerve-alert').value;
    
    // In a real app, you would save this to the server
    fetch(`${API_BASE_URL}/torn/alerts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            energy: energyAlert,
            nerve: nerveAlert
        })
    })
    .then(response => response.json())
    .then(data => {
        showToast('Alerts saved');
    })
    .catch(error => {
        console.error('Error saving alerts:', error);
        showToast('Error saving alerts');
    });
}

// Show toast message
async function showToast(message) {
    await Toast.show({
        text: message,
        duration: 'short'
    });
}

// Set up event listeners
function setupEventListeners() {
    openBrowserBtn.addEventListener('click', openBrowser);
    closeBrowserBtn.addEventListener('click', () => {
        browserContainer.classList.add('hidden');
    });
    backBtn.addEventListener('click', () => {
        const webview = document.getElementById('webview');
        if (webview) {
            webview.contentWindow.history.back();
        }
    });
    reloadBtn.addEventListener('click', () => {
        const webview = document.getElementById('webview');
        if (webview) {
            webview.contentWindow.location.reload();
        }
    });
    userscriptsBtn.addEventListener('click', () => {
        userscriptsModal.classList.remove('hidden');
    });
    closeUserscriptsBtn.addEventListener('click', () => {
        userscriptsModal.classList.add('hidden');
    });
    saveAlertsBtn.addEventListener('click', saveAlerts);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Initialize when platform is ready (for Capacitor)
document.addEventListener('deviceready', initApp, false);
