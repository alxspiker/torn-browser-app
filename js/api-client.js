// api-client.js - Handles API calls to Torn.com
class ApiClient {
  constructor() {
    this.refreshInterval = null;
    this.initialized = false;
    
    // UI elements
    this.elements = {};
  }
  
  init() {
    try {
      // Initialize UI elements
      this.elements = {
        refreshStatsButton: document.getElementById('refresh-stats'),
        pageInfo: document.getElementById('page-info'),
        statEnergy: document.getElementById('stat-energy'),
        statNerve: document.getElementById('stat-nerve'),
        statHappy: document.getElementById('stat-happy'),
        statLife: document.getElementById('stat-life'),
        statChain: document.getElementById('stat-chain'),
        statMoney: document.getElementById('stat-money'),
        statPoints: document.getElementById('stat-points'),
        cooldownDrug: document.getElementById('cooldown-drug'),
        cooldownMedical: document.getElementById('cooldown-medical'),
        cooldownBooster: document.getElementById('cooldown-booster'),
        profileName: document.getElementById('profile-name'),
        profileStatus: document.getElementById('profile-status'),
        profileAvatar: document.getElementById('profile-avatar')
      };

      // Check if UI elements are available
      if (!this.elements.pageInfo) {
        console.warn('Some API client UI elements not found, they might not be loaded yet');
      }
      
      this.initialized = true;
      
      return this;
    } catch (error) {
      console.error('Error initializing API client:', error);
      return this;
    }
  }
  
  async refreshPlayerStats() {
    try {
      const stats = await this.fetchTornStats();
      return stats;
    } catch (error) {
      console.error('Error refreshing player stats:', error);
      if (window.Utils) {
        window.Utils.showNotification('Failed to refresh stats', 'error');
      }
      return null;
    }
  }
  
  async fetchTornStats() {
    // Make sure ProfileManager is available
    if (!window.ProfileManager || !window.ProfileManager.getActiveProfile) {
      console.error('ProfileManager not available');
      return { error: 'Profile manager not initialized' };
    }
    
    const activeProfile = window.ProfileManager.getActiveProfile();
    
    if (!activeProfile || !activeProfile.apiKey) {
      if (this.elements.pageInfo) {
        this.elements.pageInfo.textContent = 'API key not configured';
      }
      
      this.updateStatsDisplay({
        error: 'API key not configured'
      });
      return { error: 'API key not configured' };
    }
    
    try {
      if (this.elements.pageInfo) {
        this.elements.pageInfo.textContent = 'Fetching Torn stats...';
      }
      
      if (!window.tornAPI || !window.tornAPI.apiRequest) {
        console.error('Torn API not available');
        return { error: 'API interface not available' };
      }
      
      const data = await window.tornAPI.apiRequest('user', { selections: 'money,icons,basic,cooldowns,bars' });
      
      if (data.error) {
        this.updateStatsDisplay({ error: data.error });
        return data;
      }
      
      this.updateStatsDisplay(data);
      
      if (this.elements.pageInfo) {
        this.elements.pageInfo.textContent = 'Stats updated';
      }
      
      return data;
    } catch (err) {
      console.error('Failed to fetch Torn stats:', err);
      
      if (this.elements.pageInfo) {
        this.elements.pageInfo.textContent = 'Stats update failed';
      }
      
      this.updateStatsDisplay({
        error: 'Failed to connect to Torn API'
      });
      
      return { error: err.message || 'API request failed' };
    }
  }
  
  updateStatsDisplay(data) {
    // If elements aren't initialized yet, do nothing
    if (!this.elements.statEnergy) return;
    
    // Handle API error
    if (data.error) {
      this.elements.statEnergy.textContent = '--';
      this.elements.statNerve.textContent = '--';
      this.elements.statHappy.textContent = '--';
      this.elements.statLife.textContent = '--';
      this.elements.statChain.textContent = '--';
      this.elements.statMoney.textContent = '$--';
      this.elements.statPoints.textContent = '--';
      
      this.elements.cooldownDrug.textContent = '--';
      this.elements.cooldownMedical.textContent = '--';
      this.elements.cooldownBooster.textContent = '--';
      
      if (this.elements.profileStatus) {
        this.elements.profileStatus.textContent = data.error;
      }
      return;
    }
    
    // Update profile display
    if (data.name && data.level) {
      if (this.elements.profileName) {
        this.elements.profileName.textContent = data.name;
      }
      
      if (this.elements.profileStatus) {
        this.elements.profileStatus.textContent = `Level ${data.level}`;
      }
      
      if (this.elements.profileAvatar) {
        // Only set text if there is no avatar image set by the profile manager
        const profile = window.ProfileManager?.getActiveProfile();
        if (!profile || !profile.avatar) {
          this.elements.profileAvatar.textContent = data.name.charAt(0).toUpperCase();
        }
        // Otherwise, leave the avatar image as set by the profile manager
      }
    }
    
    // Update stats
    if (data.energy) {
      this.elements.statEnergy.textContent = `${data.energy.current} / ${data.energy.maximum}`;
    }
    
    if (data.nerve) {
      this.elements.statNerve.textContent = `${data.nerve.current} / ${data.nerve.maximum}`;
    }
    
    if (data.happy) {
      this.elements.statHappy.textContent = `${data.happy.current} / ${data.happy.maximum}`;
    }
    
    if (data.life) {
      this.elements.statLife.textContent = `${data.life.current} / ${data.life.maximum}`;
    }
    
    if (data.chain && data.chain.current !== undefined) {
      this.elements.statChain.textContent = data.chain.current;
    }
    
    if (data.money_onhand !== undefined) {
      this.elements.statMoney.textContent = '$' + data.money_onhand.toLocaleString();
    }
    
    if (data.points !== undefined) {
      this.elements.statPoints.textContent = data.points.toLocaleString();
    }
    
    // Update cooldowns
    if (data.cooldowns) {
      this.elements.cooldownDrug.textContent = this.formatCooldown(data.cooldowns.drug);
      this.elements.cooldownMedical.textContent = this.formatCooldown(data.cooldowns.medical);
      this.elements.cooldownBooster.textContent = this.formatCooldown(data.cooldowns.booster);
    }
    
    // Check for notifications
    const activeProfile = window.ProfileManager?.getActiveProfile();
    if (activeProfile && activeProfile.settings && activeProfile.settings.notifications) {
      // Energy full notification
      if (data.energy && data.energy.current >= data.energy.maximum && data.energy.maximum > 0) {
        window.Utils?.showDesktopNotification('Energy Full', 'Your energy is now full!');
      }
      
      // Nerve full notification
      if (data.nerve && data.nerve.current >= data.nerve.maximum && data.nerve.maximum > 0) {
        window.Utils?.showDesktopNotification('Nerve Full', 'Your nerve is now full!');
      }
    }

    // Update sidebar stats as well
    if (window.UI && window.UI.updateSidebarStats) {
      window.UI.updateSidebarStats(data);
    }
  }
  
  formatCooldown(time) {
    if (!time) return 'Ready';
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}m ${seconds}s`;
  }
  
  startStatsRefresh(interval) {
    // Clear existing interval if any
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Set new interval (minimum 30 seconds)
    const seconds = Math.max(30, parseInt(interval, 10) || 60);
    this.refreshInterval = setInterval(() => this.fetchTornStats(), seconds * 1000);
  }
  
  stopStatsRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Create global TornAPI instance
window.TornAPI = new ApiClient();