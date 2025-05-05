// ==UserScript==
// @name         Torn Battles Enhancer
// @version      1.0
// @description  Enhances the battle experience on Torn.com
// @author       TornBrowserApp
// @match        https://www.torn.com/loader.php?sid=attack*
// @match        https://www.torn.com/bigalgunshop.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Configuration
    const config = {
        showStatEstimates: true,   // Show stat estimates for opponents
        quickHealButtons: true,    // Add quick heal buttons
        battleStats: true,         // Track battle statistics
        keyboardShortcuts: true    // Enable keyboard shortcuts
    };
    
    // Stats tracking
    let battleStats = {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        escapes: 0,
        damageDealt: 0,
        damageReceived: 0,
        startTime: null
    };
    
    // Load saved stats if available
    function loadStats() {
        const savedStats = localStorage.getItem('torn-battles-enhancer-stats');
        if (savedStats) {
            try {
                battleStats = JSON.parse(savedStats);
            } catch (e) {
                console.error('[Torn Battles Enhancer] Error loading saved stats:', e);
            }
        }
    }
    
    // Save stats
    function saveStats() {
        localStorage.setItem('torn-battles-enhancer-stats', JSON.stringify(battleStats));
    }
    
    // Reset stats
    function resetStats() {
        battleStats = {
            totalBattles: 0,
            wins: 0,
            losses: 0,
            escapes: 0,
            damageDealt: 0,
            damageReceived: 0,
            startTime: Date.now()
        };
        saveStats();
    }
    
    // Estimate opponent stats based on level and battle performance
    function estimateOpponentStats() {
        if (!config.showStatEstimates) return;
        
        // Only on attack pages
        if (!window.location.href.includes('sid=attack')) return;
        
        // Find opponent level element
        const levelElement = document.querySelector('[class*="playerLevel"], [class*="level"], .level, .player-info .level');
        if (!levelElement) return;
        
        // Extract level
        const levelText = levelElement.textContent.trim();
        const levelMatch = levelText.match(/Level (\d+)/);
        if (!levelMatch) return;
        
        const level = parseInt(levelMatch[1], 10);
        
        // Basic estimate based on level
        let estimatedStats = level * 500;
        
        // Create or update stats estimation element
        let statsElement = document.getElementById('opponent-stats-estimate');
        
        if (!statsElement) {
            statsElement = document.createElement('div');
            statsElement.id = 'opponent-stats-estimate';
            statsElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
            statsElement.style.color = '#fff';
            statsElement.style.padding = '5px 10px';
            statsElement.style.borderRadius = '3px';
            statsElement.style.marginTop = '10px';
            statsElement.style.fontSize = '12px';
            
            // Insert after level element's parent container
            const container = levelElement.closest('.player-info, .name-level, .info-cont, .name-text');
            if (container) {
                container.appendChild(statsElement);
            }
        }
        
        // Update text
        statsElement.innerHTML = `
            <div><strong>Estimated Battle Stats:</strong></div>
            <div>~${(estimatedStats).toLocaleString()} - ${(estimatedStats * 2).toLocaleString()}</div>
            <div style="font-size:10px;margin-top:3px;color:#aaa;">(Based on level only - rough estimate)</div>
        `;
    }
    
    // Add quick heal buttons
    function addQuickHealButtons() {
        if (!config.quickHealButtons) return;
        
        // Only on attack pages
        if (!window.location.href.includes('sid=attack')) return;
        
        // Find insertion point
        const insertionPoint = document.querySelector('.battle-stats-wrap, .battle-stats, .responsive-sidebar-wrap');
        if (!insertionPoint) return;
        
        // Create quick heal container
        let healContainer = document.getElementById('quick-heal-container');
        
        if (!healContainer) {
            healContainer = document.createElement('div');
            healContainer.id = 'quick-heal-container';
            healContainer.style.marginTop = '10px';
            healContainer.style.padding = '10px';
            healContainer.style.backgroundColor = 'rgba(0,0,0,0.1)';
            healContainer.style.borderRadius = '5px';
            
            // Add heal buttons
            healContainer.innerHTML = `
                <div style="font-weight:bold;margin-bottom:5px;">Quick Heal</div>
                <div style="display:flex;gap:5px;flex-wrap:wrap;">
                    <button id="heal-25" class="torn-btn">25%</button>
                    <button id="heal-50" class="torn-btn">50%</button>
                    <button id="heal-75" class="torn-btn">75%</button>
                    <button id="heal-100" class="torn-btn">100%</button>
                </div>
            `;
            
            // Style buttons
            const style = document.createElement('style');
            style.textContent = `
                .torn-btn {
                    padding: 3px 8px;
                    background: #1c3f7c;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.2s ease;
                }
                
                .torn-btn:hover {
                    background: #2c5aa0;
                }
            `;
            document.head.appendChild(style);
            
            // Insert container
            insertionPoint.appendChild(healContainer);
            
            // Add event listeners to buttons
            document.getElementById('heal-25').addEventListener('click', () => triggerHeal(25));
            document.getElementById('heal-50').addEventListener('click', () => triggerHeal(50));
            document.getElementById('heal-75').addEventListener('click', () => triggerHeal(75));
            document.getElementById('heal-100').addEventListener('click', () => triggerHeal(100));
        }
    }
    
    // Trigger healing - this is a simplified version and would need to be adapted for the actual site
    function triggerHeal(percentage) {
        console.log(`[Torn Battles Enhancer] Quick heal ${percentage}% triggered`);
        
        // In a real implementation, this would need to trigger the actual site's healing mechanism
        // This might involve clicking a button or making an API call
        
        // Example: Try to find and click the heal button
        const healButton = document.querySelector('[class*="heal"], [class*="medical"], .heal-button');
        if (healButton) {
            // Set healing percentage if applicable
            const percentInput = document.querySelector('[name="heal"], [name="healperc"], input[type="range"]');
            if (percentInput) {
                percentInput.value = percentage;
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                percentInput.dispatchEvent(event);
            }
            
            // Click the heal button
            healButton.click();
        }
    }
    
    // Add battle statistics panel
    function addBattleStatsPanel() {
        if (!config.battleStats) return;
        
        // Only on attack pages
        if (!window.location.href.includes('sid=attack')) return;
        
        // Find insertion point
        const insertionPoint = document.querySelector('.battle-stats-wrap, .battle-stats, .responsive-sidebar-wrap');
        if (!insertionPoint) return;
        
        // Create stats panel
        let statsPanel = document.getElementById('battle-stats-panel');
        
        if (!statsPanel) {
            statsPanel = document.createElement('div');
            statsPanel.id = 'battle-stats-panel';
            statsPanel.style.marginTop = '10px';
            statsPanel.style.padding = '10px';
            statsPanel.style.backgroundColor = 'rgba(0,0,0,0.1)';
            statsPanel.style.borderRadius = '5px';
            
            // Add stats content
            updateStatsPanel(statsPanel);
            
            // Insert panel
            insertionPoint.appendChild(statsPanel);
            
            // Add reset button event listener
            statsPanel.addEventListener('click', (e) => {
                if (e.target.id === 'reset-battle-stats') {
                    if (confirm('Reset battle statistics?')) {
                        resetStats();
                        updateStatsPanel(statsPanel);
                    }
                }
            });
        }
    }
    
    // Update stats panel content
    function updateStatsPanel(panel) {
        if (!panel) return;
        
        // Calculate win rate
        const winRate = battleStats.totalBattles > 0 ? 
            ((battleStats.wins / battleStats.totalBattles) * 100).toFixed(1) : '0.0';
        
        // Calculate session duration
        let sessionTime = 'N/A';
        if (battleStats.startTime) {
            const minutes = Math.floor((Date.now() - battleStats.startTime) / 60000);
            if (minutes < 60) {
                sessionTime = `${minutes}m`;
            } else {
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                sessionTime = `${hours}h ${remainingMinutes}m`;
            }
        }
        
        // Update HTML
        panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:5px;">Battle Statistics</div>
            <div style="font-size:12px;">
                <div>Total Battles: ${battleStats.totalBattles}</div>
                <div>Wins: ${battleStats.wins} (${winRate}%)</div>
                <div>Losses: ${battleStats.losses}</div>
                <div>Escapes: ${battleStats.escapes}</div>
                <div style="margin-top:5px;">Damage Dealt: ${battleStats.damageDealt.toLocaleString()}</div>
                <div>Damage Received: ${battleStats.damageReceived.toLocaleString()}</div>
                <div style="margin-top:5px;">Session Time: ${sessionTime}</div>
                <button id="reset-battle-stats" class="torn-btn" style="margin-top:8px;">Reset Stats</button>
            </div>
        `;
    }
    
    // Add keyboard shortcuts
    function addKeyboardShortcuts() {
        if (!config.keyboardShortcuts) return;
        
        // Only on attack pages
        if (!window.location.href.includes('sid=attack')) return;
        
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key) {
                case '1': // Attack with first attack button
                    clickAttackButton(0);
                    break;
                case '2': // Attack with second attack button
                    clickAttackButton(1);
                    break;
                case '3': // Attack with third attack button
                    clickAttackButton(2);
                    break;
                case '4': // Attack with fourth attack button
                    clickAttackButton(3);
                    break;
                case 'h': // Quick heal 50%
                    triggerHeal(50);
                    break;
                case 'e': // Escape/Leave battle
                    const escapeButton = document.querySelector('[class*="escape"], [class*="leave"], .escape-link');
                    if (escapeButton) escapeButton.click();
                    break;
            }
        });
    }
    
    // Click attack button by index
    function clickAttackButton(index) {
        const attackButtons = document.querySelectorAll('[class*="attack-btn"], [class*="attack"], .attack-button');
        if (attackButtons && attackButtons.length > index) {
            attackButtons[index].click();
        }
    }
    
    // Initialize the script
    function initialize() {
        console.log('[Torn Battles Enhancer] Initializing...');
        
        // Load saved stats
        loadStats();
        
        // If stats don't have a start time, set one
        if (!battleStats.startTime) {
            battleStats.startTime = Date.now();
            saveStats();
        }
        
        // Initialize features
        estimateOpponentStats();
        addQuickHealButtons();
        addBattleStatsPanel();
        addKeyboardShortcuts();
        
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            #battle-stats-panel, #quick-heal-container, #opponent-stats-estimate {
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        
        // Track battle events - simplified version
        // In a real implementation, this would need to observe DOM changes or intercept XHR requests
        // to accurately track battle events
        
        // Example: Monitor for battle result messages every second
        setInterval(() => {
            const resultText = document.body.textContent;
            
            // Check for win
            if (resultText.includes('You have won the fight') && !battleStats.lastResult) {
                battleStats.wins++;
                battleStats.totalBattles++;
                battleStats.lastResult = 'win';
                saveStats();
                updateStatsPanel(document.getElementById('battle-stats-panel'));
            }
            
            // Check for loss
            else if (resultText.includes('You have been defeated') && !battleStats.lastResult) {
                battleStats.losses++;
                battleStats.totalBattles++;
                battleStats.lastResult = 'loss';
                saveStats();
                updateStatsPanel(document.getElementById('battle-stats-panel'));
            }
            
            // Check for escape
            else if (resultText.includes('You escaped from the fight') && !battleStats.lastResult) {
                battleStats.escapes++;
                battleStats.totalBattles++;
                battleStats.lastResult = 'escape';
                saveStats();
                updateStatsPanel(document.getElementById('battle-stats-panel'));
            }
            
            // Reset last result when not in a results page
            else if (!resultText.includes('You have won') && 
                     !resultText.includes('You have been defeated') && 
                     !resultText.includes('You escaped')) {
                battleStats.lastResult = null;
            }
            
        }, 1000);
        
        console.log('[Torn Battles Enhancer] Initialized');
    }
    
    // Run when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
