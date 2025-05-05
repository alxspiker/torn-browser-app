// ==UserScript==
// @name         Torn Energy Bar Enhancer
// @version      1.0
// @description  Enhances the energy bar on Torn.com with additional information
// @author       TornBrowserApp
// @match        https://www.torn.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Configuration
    const config = {
        updateInterval: 5000, // Update interval in milliseconds
        showTimeToFull: true, // Show time until energy is full
        showPercentage: true, // Show percentage
        colorizeBar: true     // Colorize bar based on energy level
    };
    
    // Helper function to format time
    function formatTime(seconds) {
        if (seconds <= 0) return 'Full';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
    
    // Main function to enhance the energy bar
    function enhanceEnergyBar() {
        // Get energy bar elements
        const energyBar = document.querySelector('.energy-user .bar');
        const energyCurrentElement = document.querySelector('.energy-user [class^="value-"]');
        
        if (!energyBar || !energyCurrentElement) return;
        
        // Get current and max energy values
        const energyText = energyCurrentElement.textContent;
        const energyValues = energyText.split('/');
        
        if (energyValues.length !== 2) return;
        
        const currentEnergy = parseInt(energyValues[0].trim(), 10);
        const maxEnergy = parseInt(energyValues[1].trim(), 10);
        
        if (isNaN(currentEnergy) || isNaN(maxEnergy)) return;
        
        // Calculate percentage
        const percentage = Math.round((currentEnergy / maxEnergy) * 100);
        
        // Calculate time until full
        const energyNeeded = maxEnergy - currentEnergy;
        const secondsUntilFull = energyNeeded * 300; // 5 minutes (300 seconds) per energy point
        
        // Create or update info container
        let infoContainer = document.getElementById('energy-enhancer-info');
        
        if (!infoContainer) {
            infoContainer = document.createElement('div');
            infoContainer.id = 'energy-enhancer-info';
            infoContainer.style.fontSize = '11px';
            infoContainer.style.textAlign = 'center';
            infoContainer.style.marginTop = '2px';
            infoContainer.style.color = '#fff';
            infoContainer.style.textShadow = '0 0 2px #000';
            
            // Insert after the energy bar
            energyBar.parentNode.insertBefore(infoContainer, energyBar.nextSibling);
        }
        
        // Update info text
        let infoText = '';
        
        if (config.showPercentage) {
            infoText += `${percentage}%`;
        }
        
        if (config.showTimeToFull && energyNeeded > 0) {
            if (infoText) infoText += ' • ';
            infoText += `Full in: ${formatTime(secondsUntilFull)}`;
        }
        
        infoContainer.textContent = infoText;
        
        // Colorize bar based on energy level
        if (config.colorizeBar) {
            const barFill = energyBar.querySelector('.bar-progress-fill, .bar-progress');
            
            if (barFill) {
                let color;
                
                if (percentage >= 90) {
                    color = '#4CAF50'; // Green
                } else if (percentage >= 70) {
                    color = '#8BC34A'; // Light Green
                } else if (percentage >= 50) {
                    color = '#FFEB3B'; // Yellow
                } else if (percentage >= 30) {
                    color = '#FFC107'; // Amber
                } else if (percentage >= 10) {
                    color = '#FF9800'; // Orange
                } else {
                    color = '#F44336'; // Red
                }
                
                barFill.style.backgroundColor = color;
            }
        }
    }
    
    // Initialize enhancement
    function initialize() {
        // Apply initial enhancement
        enhanceEnergyBar();
        
        // Set up interval for updates
        setInterval(enhanceEnergyBar, config.updateInterval);
        
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .energy-user .bar {
                transition: all 0.3s ease;
            }
            
            #energy-enhancer-info {
                transition: opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        
        console.log('[Torn Energy Bar Enhancer] Initialized');
    }
    
    // Run when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
