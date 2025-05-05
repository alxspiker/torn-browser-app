// main.js
const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const fetch = require('node-fetch');

// Initialize configuration store
const store = new Store({
  name: 'torn-browser-config',
  defaults: {
    profiles: [{
      id: 'default',
      name: 'Default',
      apiKey: '',
      userscripts: [],
      lastVisitedUrl: 'https://www.torn.com',
      settings: {
        darkMode: false,
        notifications: true,
        autoRefresh: false,
        refreshInterval: 60
      }
    }],
    activeProfile: 'default',
    windowBounds: { width: 1200, height: 800 }
  }
});

// Initialize API cache
const apiCache = {
  data: {},
  timestamp: {},
  maxAge: 5 * 60 * 1000 // 5 minutes
};

// Find or create the userData directory for storing files
const userDataPath = app.getPath('userData');
const userscriptsPath = path.join(userDataPath, 'userscripts');
if (!fs.existsSync(userscriptsPath)) {
  fs.mkdirSync(userscriptsPath, { recursive: true });
}

// Get the active profile
function getActiveProfile() {
  const activeProfileId = store.get('activeProfile');
  const profiles = store.get('profiles');
  return profiles.find(p => p.id === activeProfileId) || profiles[0];
}

// Create the browser window
function createWindow() {
  const bounds = store.get('windowBounds');
  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: false,
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Save window size on resize
  win.on('resize', () => {
    store.set('windowBounds', win.getBounds());
  });

  // Load the index.html file
  win.loadFile('index.html');

  // Set up the application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { 
          label: 'New Window', 
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow()
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Profiles',
      submenu: [
        {
          label: 'Manage Profiles',
          click: () => win.webContents.send('show-profiles')
        },
        { type: 'separator' }
        // Profile list will be dynamically populated
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Userscript Manager',
          accelerator: 'CmdOrCtrl+U',
          click: () => win.webContents.send('show-userscripts')
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => win.webContents.send('show-settings')
        },
        { type: 'separator' },
        {
          label: 'Clear Cache',
          click: () => {
            win.webContents.session.clearCache();
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'Cache Cleared',
              message: 'Browser cache has been cleared successfully.'
            });
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Torn Browser',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About Torn Browser',
              message: 'Torn Browser v1.1.0',
              detail: 'A specialized browser for Torn.com with userscript capabilities.\n\nCreated by Alex Spiker'
            });
          }
        },
        {
          label: 'Visit Torn.com',
          click: () => shell.openExternal('https://www.torn.com')
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/alxspiker/torn-browser-app/issues')
        }
      ]
    }
  ]);

  // Update profile submenu
  function updateProfileMenu() {
    const profiles = store.get('profiles');
    const activeProfile = store.get('activeProfile');
    
    const profileMenu = menu.items.find(item => item.label === 'Profiles').submenu;
    
    // Remove old profile items (keeping the first two items)
    while (profileMenu.items.length > 2) {
      profileMenu.items.pop();
    }
    
    // Add profile items
    profiles.forEach(profile => {
      profileMenu.append(new Menu.MenuItem({
        label: profile.name,
        type: 'radio',
        checked: profile.id === activeProfile,
        click: () => {
          store.set('activeProfile', profile.id);
          win.webContents.send('profile-changed', profile.id);
          updateProfileMenu();
        }
      }));
    });
    
    Menu.setApplicationMenu(menu);
  }
  
  updateProfileMenu();
  Menu.setApplicationMenu(menu);

  return win;
}

// Create window when app is ready
app.whenReady().then(() => {
  const mainWindow = createWindow();
  
  // Handle IPC messages from renderer process
  ipcMain.handle('get-profiles', () => {
    return store.get('profiles');
  });
  
  ipcMain.handle('get-active-profile', () => {
    return getActiveProfile();
  });
  
  ipcMain.handle('save-profile', (event, profile) => {
    const profiles = store.get('profiles');
    const index = profiles.findIndex(p => p.id === profile.id);
    
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    
    store.set('profiles', profiles);
    return true;
  });
  
  ipcMain.handle('delete-profile', (event, profileId) => {
    let profiles = store.get('profiles');
    
    // Don't delete if it's the last profile
    if (profiles.length <= 1) {
      return false;
    }
    
    profiles = profiles.filter(p => p.id !== profileId);
    store.set('profiles', profiles);
    
    // If active profile was deleted, switch to first available
    if (store.get('activeProfile') === profileId) {
      store.set('activeProfile', profiles[0].id);
      mainWindow.webContents.send('profile-changed', profiles[0].id);
    }
    
    return true;
  });
  
  ipcMain.handle('set-active-profile', (event, profileId) => {
    store.set('activeProfile', profileId);
    mainWindow.webContents.send('profile-changed', profileId);
    return true;
  });
  
  // API proxy to handle caching and authentication
  ipcMain.handle('torn-api-request', async (event, endpoint, params = {}) => {
    try {
      const profile = getActiveProfile();
      const apiKey = profile.apiKey;
      
      if (!apiKey) {
        return { error: 'API key not set. Please add your API key in the profile settings.' };
      }
      
      const queryParams = new URLSearchParams({
        key: apiKey,
        ...params
      });
      
      const url = `https://api.torn.com/${endpoint}?${queryParams}`;
      
      // Check cache
      const cacheKey = url;
      const now = Date.now();
      if (apiCache.data[cacheKey] && (now - apiCache.timestamp[cacheKey]) < apiCache.maxAge) {
        return apiCache.data[cacheKey];
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Cache the result
      apiCache.data[cacheKey] = data;
      apiCache.timestamp[cacheKey] = now;
      
      return data;
    } catch (err) {
      return { error: err.message };
    }
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// On macOS, recreate window when dock icon is clicked and no windows are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
