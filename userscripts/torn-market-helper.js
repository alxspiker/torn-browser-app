// ==UserScript==
// @name         Torn Market Helper
// @version      1.0
// @description  Adds additional features to Torn market pages
// @author       TornBrowserApp
// @match        https://www.torn.com/imarket.php*
// @match        https://www.torn.com/bazaar.php*
// @match        https://www.torn.com/trade.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Configuration
    const config = {
        highlightProfitableItems: true,   // Highlight items with good prices
        addQuickLinks: true,              // Add quick links to different market sections
        showItemAverages: true,           // Show average prices for items
        minProfitPercentage: 10           // Minimum profit percentage to highlight
    };
    
    // Market price data (manually maintained or could be fetched from an API)
    const marketPrices = {
        // Format: itemId: { min: minPrice, max: maxPrice, avg: avgPrice }
        // This would be populated with real data in a full implementation
        // Sample data for demonstration
        '1': { min: 1000, max: 2000, avg: 1500 },  // Chocolate Bar
        '2': { min: 4500, max: 7000, avg: 5500 },  // Bottle of Beer
        '3': { min: 3000, max: 5000, avg: 4000 }   // Can of Tango
    };
    
    // Helper function to format numbers with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // Helper function to calculate profit percentage
    function calculateProfitPercentage(currentPrice, averagePrice) {
        if (!currentPrice || !averagePrice) return 0;
        return ((averagePrice - currentPrice) / currentPrice) * 100;
    }
    
    // Add quick links to the page
    function addQuickLinks() {
        if (!config.addQuickLinks) return;
        
        // Check if we're on a market page
        if (!window.location.href.includes('imarket.php') && 
            !window.location.href.includes('bazaar.php') && 
            !window.location.href.includes('trade.php')) {
            return;
        }
        
        // Create quick links container
        const container = document.createElement('div');
        container.id = 'market-helper-quick-links';
        container.style.padding = '10px';
        container.style.marginBottom = '10px';
        container.style.background = '#f2f2f2';
        container.style.borderRadius = '5px';
        container.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        
        // Quick links HTML
        container.innerHTML = `
            <h4 style="margin-top:0;margin-bottom:5px;">Quick Market Links</h4>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
                <a href="/imarket.php" style="padding:3px 8px;background:#1c3f7c;color:white;text-decoration:none;border-radius:3px;">Item Market</a>
                <a href="/bazaar.php" style="padding:3px 8px;background:#1c3f7c;color:white;text-decoration:none;border-radius:3px;">Bazaar</a>
                <a href="/trade.php" style="padding:3px 8px;background:#1c3f7c;color:white;text-decoration:none;border-radius:3px;">Trade</a>
                <a href="/bigalgunshop.php" style="padding:3px 8px;background:#1c3f7c;color:white;text-decoration:none;border-radius:3px;">Gun Shop</a>
                <a href="/shops.php?step=bitsnbobs" style="padding:3px 8px;background:#1c3f7c;color:white;text-decoration:none;border-radius:3px;">Bits n Bobs</a>
                <a href="/shops.php?step=super" style="padding:3px 8px;background:#1c3f7c;color:white;text-decoration:none;border-radius:3px;">Supermarket</a>
            </div>
        `;
        
        // Find insertion point and insert
        const insertionPoint = document.querySelector('.content-title, .content-wrapper, .content');
        if (insertionPoint && insertionPoint.parentNode) {
            insertionPoint.parentNode.insertBefore(container, insertionPoint);
        }
    }
    
    // Process item market page
    function processItemMarket() {
        if (!config.highlightProfitableItems && !config.showItemAverages) return;
        
        // Find all item rows
        const itemRows = document.querySelectorAll('.items-list > li, .items-wrapper > li, .item');
        
        itemRows.forEach(row => {
            // Try to extract item ID
            const itemIdMatch = row.innerHTML.match(/item_id=(\d+)/) || 
                               row.innerHTML.match(/data-item=(\d+)/) || 
                               row.innerHTML.match(/data-item-id=(\d+)/);
            
            if (!itemIdMatch) return;
            
            const itemId = itemIdMatch[1];
            const priceData = marketPrices[itemId];
            
            if (!priceData) return;
            
            // Try to find the price element
            const priceElement = row.querySelector('.price, .cost, .t-price, [class*="price"], [class*="cost"]');
            if (!priceElement) return;
            
            // Extract current price
            const priceText = priceElement.textContent.trim();
            const priceMatch = priceText.match(/[$,£€]?([\d,]+)/);
            
            if (!priceMatch) return;
            
            const currentPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
            
            // Calculate profit percentage
            const profitPercentage = calculateProfitPercentage(currentPrice, priceData.avg);
            
            // Highlight profitable items
            if (config.highlightProfitableItems && profitPercentage > config.minProfitPercentage) {
                row.style.backgroundColor = `rgba(46, 204, 113, ${Math.min(0.2 + (profitPercentage / 100), 0.5)})`;
                row.style.transition = 'background-color 0.3s ease';
            }
            
            // Show average price
            if (config.showItemAverages) {
                const infoElement = document.createElement('div');
                infoElement.className = 'market-helper-info';
                infoElement.style.fontSize = '10px';
                infoElement.style.marginTop = '2px';
                infoElement.style.color = '#777';
                
                infoElement.innerHTML = `
                    Avg: $${formatNumber(priceData.avg)} 
                    (${profitPercentage > 0 ? '+' : ''}${profitPercentage.toFixed(1)}%)
                `;
                
                priceElement.appendChild(infoElement);
            }
        });
    }
    
    // Initialize the script
    function initialize() {
        console.log('[Torn Market Helper] Initializing...');
        
        // Add quick links
        addQuickLinks();
        
        // Process market pages
        processItemMarket();
        
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .market-helper-info {
                transition: opacity 0.3s ease;
            }
            
            #market-helper-quick-links a:hover {
                background: #2c5aa0 !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('[Torn Market Helper] Initialized');
    }
    
    // Run when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
