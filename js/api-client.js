// api-client.js - Handles API calls to Torn.com
class ApiClient {
  constructor() {
    this.refreshInterval = null;
    
    // UI elements
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
  }
  
  init() {
    // Setup refresh button
    this.elements.refreshStatsButton.addEventListener('click', () => this.fetchTornStats());
    
    return this;
  }
  
  async fetchTornStats() {
    const activeProfile = window.ProfileManager.getActiveProfile();
    
    if (!activeProfile || !activeProfile.apiKey) {
      this.updateStatsDisplay({
        error: 'API key not configured'
      });
      return;
    }
    
    try {
      this.elements.pageInfo.textContent = 'Fetching Torn stats...';
      
      const data = await window.tornAPI.apiRequest('user', { selections: 'basic,cooldowns,bars,icons' });
      
      if (data.error) {
        this.updateStatsDisplay({ error: data.error });
        return;
      }
      
      this.updateStatsDisplay(data);
      this.elements.pageInfo.textContent = 'Stats updated';
      
      return data;
    } catch (err) {
      console.error('Failed to fetch Torn stats:', err);
      this.elements.pageInfo.textContent = 'Stats update failed';
      
      this.updateStatsDisplay({
        error: 'Failed to connect to Torn API'
      });
    }
  }
  
  updateStatsDisplay(data) {
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
      
      this.elements.profileStatus.textContent = data.error;
      return;
    }
    
    // Update profile display
    if (data.name && data.level) {
      this.elements.profileName.textContent = data.name;
      this.elements.profileStatus.textContent = `Level ${data.level}`;
      this.elements.profileAvatar.textContent = data.name.charAt(0).toUpperCase();
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
    
    if (data.money) {
      this.elements.statMoney.textContent = '$' + data.money.toLocaleString();
    }
    
    if (data.points !== undefined) {
      this.elements.statPoints.textContent = data.points.toLocaleString();
    }
    
    // Update cooldowns
    if (data.cooldowns) {
      this.elements.cooldownDrug.textContent = Utils.formatCooldown(data.cooldowns.drug);
      this.elements.cooldownMedical.textContent = Utils.formatCooldown(data.cooldowns.medical);
      this.elements.cooldownBooster.textContent = Utils.formatCooldown(data.cooldowns.booster);
    }
    
    // Check for notifications
    const activeProfile = window.ProfileManager.getActiveProfile();
    if (activeProfile && activeProfile.settings && activeProfile.settings.notifications) {
      // Energy full notification
      if (data.energy && data.energy.current >= data.energy.maximum && data.energy.maximum > 0) {
        Utils.showDesktopNotification('Energy Full', 'Your energy is now full!');
      }
      
      // Nerve full notification
      if (data.nerve && data.nerve.current >= data.nerve.maximum && data.nerve.maximum > 0) {
        Utils.showDesktopNotification('Nerve Full', 'Your nerve is now full!');
      }
    }
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

// Create global ApiClient instance
window.TornAPI = new ApiClient();