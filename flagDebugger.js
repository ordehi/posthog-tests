(function() {
    // Create a unique namespace to avoid conflicts
    window.PostHogDebugger = window.PostHogDebugger || {};
    
    // Only initialize once
    if (window.PostHogDebugger.initialized) return;
    window.PostHogDebugger.initialized = true;
    
    // Create visual indicator container
    const debugContainer = document.createElement('div');
    debugContainer.id = 'posthog-debug-container';
    
    // Apply styles that won't conflict with the site
    Object.assign(debugContainer.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '999999',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px',
        maxHeight: '300px',
        overflowY: 'auto',
        transition: 'all 0.3s ease',
        opacity: '0.9',
        border: '1px solid #444'
    });
    
    // Set up status indicators
    const indicatorStyles = {
        display: 'flex',
        alignItems: 'center',
        margin: '5px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '5px'
    };
    
    const statusDotStyles = {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        marginRight: '10px',
        background: '#777',
        transition: 'background-color 0.5s ease'
    };
    
    // Helper to create indicators
    const createIndicator = (name) => {
        const indicator = document.createElement('div');
        Object.assign(indicator.style, indicatorStyles);
        
        const statusDot = document.createElement('span');
        Object.assign(statusDot.style, statusDotStyles);
        
        const statusText = document.createElement('div');
        statusText.style.flex = '1';
        statusText.innerHTML = `<strong>${name}:</strong> <span>Waiting...</span>`;
        
        indicator.appendChild(statusDot);
        indicator.appendChild(statusText);
        
        return {
            container: indicator,
            dot: statusDot,
            text: statusText.querySelector('span')
        };
    };
    
    // Create all our indicators
    const indicators = {
        domReady: createIndicator('DOM Ready'),
        posthogAvailable: createIndicator('PostHog Available'),
        onFeatureFlagsAvailable: createIndicator('onFeatureFlags Available'),
        featureFlagsLoaded: createIndicator('Feature Flags Loaded'),
        flagValue: createIndicator('sandbox_embed Flag'),
        sandboxElement: createIndicator('Sandbox Element'),
        sandboxDisplayed: createIndicator('Sandbox Displayed')
    };
    
    // Add indicators to container
    Object.values(indicators).forEach(indicator => {
        debugContainer.appendChild(indicator.container);
    });
    
    // Add expand/collapse button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Minimize';
    Object.assign(toggleButton.style, {
        background: '#333',
        border: 'none',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        marginTop: '5px',
        cursor: 'pointer',
        width: '100%'
    });
    
    let minimized = false;
    toggleButton.addEventListener('click', () => {
        minimized = !minimized;
        if (minimized) {
            Object.values(indicators).forEach(ind => ind.container.style.display = 'none');
            toggleButton.textContent = 'Expand';
            debugContainer.style.padding = '5px';
        } else {
            Object.values(indicators).forEach(ind => ind.container.style.display = 'flex');
            toggleButton.textContent = 'Minimize';
            debugContainer.style.padding = '10px';
        }
    });
    
    debugContainer.appendChild(toggleButton);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    Object.assign(closeButton.style, {
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '0',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });
    
    closeButton.addEventListener('click', () => {
        debugContainer.style.display = 'none';
    });
    
    debugContainer.appendChild(closeButton);
    
    // Add to document
    const addContainerToDocument = () => {
        if (document.body) {
            document.body.appendChild(debugContainer);
        } else {
            // If body doesn't exist yet, retry in a moment
            setTimeout(addContainerToDocument, 10);
        }
    };
    
    addContainerToDocument();
    
    // Status update helper functions
    const updateStatus = (indicator, status, message, details = null) => {
        // Status can be: waiting, success, error, warning, or info
        const colors = {
            waiting: '#777',
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        
        indicator.dot.style.backgroundColor = colors[status] || colors.waiting;
        indicator.text.textContent = message;
        
        // Log to console with styling
        const styles = {
            waiting: 'color: #777',
            success: 'color: #4CAF50; font-weight: bold',
            error: 'color: #F44336; font-weight: bold',
            warning: 'color: #FF9800; font-weight: bold',
            info: 'color: #2196F3; font-weight: bold'
        };
        
        console.log(
            `%c[PostHogDebugger] ${message}`, 
            styles[status] || styles.waiting,
            details
        );
        
        return { status, message, timestamp: new Date().toISOString(), details };
    };
    
    // Store timestamps for timing analysis
    const timing = {
        start: performance.now(),
        events: []
    };
    
    const logEvent = (name, status, message, details = null) => {
        const time = performance.now() - timing.start;
        timing.events.push({
            name,
            status,
            message,
            details,
            time
        });
        
        console.log(`%c[${time.toFixed(2)}ms] ${name}: ${message}`, 
            `color: ${status === 'error' ? 'red' : status === 'success' ? 'green' : 'blue'}`,
            details);
            
        return time;
    };
    
    // Make debug data available globally
    window.PostHogDebugger.timing = timing;
    window.PostHogDebugger.indicators = indicators;
    window.PostHogDebugger.showDebugger = () => {
        debugContainer.style.display = 'block';
    };
    
    // DOM Ready Check
    if (document.readyState === 'loading') {
        updateStatus(indicators.domReady, 'waiting', 'Waiting for DOM...');
        document.addEventListener('DOMContentLoaded', () => {
            const time = logEvent('DOMContentLoaded', 'success', 'DOM is ready');
            updateStatus(indicators.domReady, 'success', `Ready (${time.toFixed(0)}ms)`);
            checkPostHog();
        });
    } else {
        const time = logEvent('DOMAlreadyLoaded', 'info', 'DOM was already loaded');
        updateStatus(indicators.domReady, 'success', `Already ready (${time.toFixed(0)}ms)`);
        checkPostHog();
    }
    
    // Check PostHog availability
    function checkPostHog(retries = 20) {
        // Don't retry if we've already succeeded
        if (indicators.posthogAvailable.dot.style.backgroundColor === '#4CAF50') {
            return;
        }
        
        const posthogExists = typeof window.posthog !== 'undefined';
        
        if (!posthogExists) {
            if (retries <= 0) {
                const time = logEvent('PostHogCheck', 'error', 'PostHog not found after retries');
                updateStatus(indicators.posthogAvailable, 'error', `Not found (${time.toFixed(0)}ms)`);
                return;
            }
            
            logEvent('PostHogCheck', 'waiting', `PostHog not found, retrying (${retries} left)`);
            updateStatus(indicators.posthogAvailable, 'waiting', `Checking... (${retries} retries left)`);
            
            // Retry after delay
            setTimeout(() => checkPostHog(retries - 1), 100);
            return;
        }
        
        const time = logEvent('PostHogFound', 'success', 'PostHog object exists');
        updateStatus(indicators.posthogAvailable, 'success', `Available (${time.toFixed(0)}ms)`);
        
        // Check for onFeatureFlags method
        if (typeof window.posthog.onFeatureFlags !== 'function') {
            const errTime = logEvent('OnFeatureFlagsCheck', 'error', 'onFeatureFlags method missing');
            updateStatus(
                indicators.onFeatureFlagsAvailable, 
                'error', 
                `Not available (${errTime.toFixed(0)}ms)`,
                { availableMethods: Object.keys(window.posthog).filter(k => typeof window.posthog[k] === 'function') }
            );
            return;
        }
        
        const methodTime = logEvent('OnFeatureFlagsCheck', 'success', 'onFeatureFlags method exists');
        updateStatus(indicators.onFeatureFlagsAvailable, 'success', `Available (${methodTime.toFixed(0)}ms)`);
        
        // Register for feature flags
        checkFeatureFlags();
    }
    
    // Check Feature Flags
    function checkFeatureFlags() {
        // First, check if flags are already loaded
        if (window.posthog.featureFlags && window.posthog.featureFlags.flagsLoaded) {
            const time = logEvent('FeatureFlagsAlreadyLoaded', 'info', 'Feature flags were already loaded');
            updateStatus(indicators.featureFlagsLoaded, 'success', `Already loaded (${time.toFixed(0)}ms)`);
            checkSandboxFlag();
            return;
        }
        
        // Wait for flags to load
        updateStatus(indicators.featureFlagsLoaded, 'waiting', 'Waiting for flags...');
        
        window.posthog.onFeatureFlags(() => {
            const time = logEvent('FeatureFlagsLoaded', 'success', 'Feature flags loaded');
            updateStatus(indicators.featureFlagsLoaded, 'success', `Loaded (${time.toFixed(0)}ms)`);
            checkSandboxFlag();
        });
    }
    
    // Check the specific flag
    function checkSandboxFlag() {
        try {
            const flagValue = window.posthog.getFeatureFlag('sandbox_embed');
            
            if (flagValue === null || flagValue === undefined) {
                const time = logEvent('FlagCheck', 'warning', 'sandbox_embed flag not found', { value: flagValue });
                updateStatus(indicators.flagValue, 'warning', `Not found (${time.toFixed(0)}ms)`);
                
                // Skip sandbox element check since flag is not found
                updateStatus(indicators.sandboxElement, 'info', 'Skipped (flag not found)');
                updateStatus(indicators.sandboxDisplayed, 'info', 'Skipped (flag not found)');
                return;
            } else if (flagValue === 'with-sandbox') {
                const time = logEvent('FlagCheck', 'success', 'Flag is set to with-sandbox', { value: flagValue });
                updateStatus(indicators.flagValue, 'success', `Value: with-sandbox (${time.toFixed(0)}ms)`);
                
                // Only proceed to check for sandbox element if flag is correctly set
                checkSandboxElement();
            } else {
                const time = logEvent('FlagCheck', 'info', `Flag value: ${flagValue}`, { value: flagValue });
                updateStatus(indicators.flagValue, 'info', `Value: ${flagValue} (${time.toFixed(0)}ms)`);
                
                // Log that we're skipping due to incorrect flag value
                logEvent('SandboxSkipped', 'info', `Skipping sandbox display (flag value '${flagValue}' != 'with-sandbox')`);
                updateStatus(indicators.sandboxElement, 'info', `Skipped (flag value '${flagValue}')`);
                updateStatus(indicators.sandboxDisplayed, 'info', `Skipped (flag value '${flagValue}')`);
                return;
            }
        } catch (error) {
            const time = logEvent('FlagCheckError', 'error', 'Error checking flag', { error });
            updateStatus(indicators.flagValue, 'error', `Error: ${error.message} (${time.toFixed(0)}ms)`);
            
            // Skip sandbox checks on error
            updateStatus(indicators.sandboxElement, 'error', 'Skipped (flag error)');
            updateStatus(indicators.sandboxDisplayed, 'error', 'Skipped (flag error)');
        }
    }
    
    // Check for sandbox element
    function checkSandboxElement() {
        const sandboxDiv = document.querySelector('.homepage-sandbox');
        
        if (!sandboxDiv) {
            const time = logEvent('SandboxElementCheck', 'error', 'Sandbox element not found');
            updateStatus(indicators.sandboxElement, 'error', `Not found (${time.toFixed(0)}ms)`);
            
            // Create a mock sandbox element for demonstration
            createMockSandbox();
            return;
        }
        
        const time = logEvent('SandboxElementCheck', 'success', 'Sandbox element found', {
            id: sandboxDiv.id,
            className: sandboxDiv.className,
            display: window.getComputedStyle(sandboxDiv).display
        });
        
        updateStatus(indicators.sandboxElement, 'success', `Found (${time.toFixed(0)}ms)`);
        
        // Update sandbox display
        updateSandboxDisplay(sandboxDiv);
    }
    
    // Create mock sandbox if needed
    function createMockSandbox() {
        // Double-check flag value before creating mock
        const flagValue = window.posthog.getFeatureFlag('sandbox_embed');
        if (flagValue !== 'with-sandbox') {
            const time = logEvent('MockSandboxSkipped', 'warning', 
                `Not creating mock sandbox: flag value '${flagValue}' is not 'with-sandbox'`);
            updateStatus(indicators.sandboxElement, 'warning', 
                `Mock not created (incorrect flag) (${time.toFixed(0)}ms)`);
            updateStatus(indicators.sandboxDisplayed, 'info', 
                `Skipped (no sandbox with correct flag)`);
            return;
        }
        
        const mockSandbox = document.createElement('div');
        mockSandbox.className = 'homepage-sandbox mock-sandbox';
        mockSandbox.style.display = 'none';
        
        // Add some content to make it visible
        mockSandbox.innerHTML = `
            <div style="background: #f5f5f5; border: 1px solid #ccc; padding: 15px; 
                        border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 10px; color: #333; font-family: sans-serif;">Mock Sandbox Element</h3>
                <p style="margin: 0; color: #666; font-family: sans-serif;">
                    This is a mock sandbox element created by the PostHog debugger 
                    since no element with class '.homepage-sandbox' was found 
                    and the 'sandbox_embed' flag is set to 'with-sandbox'.
                </p>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(mockSandbox);
        
        const time = logEvent('MockSandboxCreated', 'info', 'Created mock sandbox element');
        updateStatus(indicators.sandboxElement, 'info', `Created mock (${time.toFixed(0)}ms)`);
        
        // Update sandbox display
        updateSandboxDisplay(mockSandbox);
    }
    
    // Update sandbox display
    function updateSandboxDisplay(element) {
        const previousDisplay = element.style.display;
        element.style.display = 'block';
        
        const isMock = element.classList.contains('mock-sandbox');
        
        // Position the mock element in a visible area
        if (isMock) {
            Object.assign(element.style, {
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: '999998'
            });
        }
        
        const time = logEvent('SandboxDisplayUpdated', 'success', 'Set sandbox display to block', {
            from: previousDisplay || '(not set)',
            to: 'block',
            isMock
        });
        
        // Check if it's actually visible
        setTimeout(() => {
            const computedDisplay = window.getComputedStyle(element).display;
            const isVisible = computedDisplay !== 'none';
            
            if (isVisible) {
                updateStatus(
                    indicators.sandboxDisplayed, 
                    'success', 
                    `Displayed${isMock ? ' (mock)' : ''} (${time.toFixed(0)}ms)`
                );
            } else {
                updateStatus(
                    indicators.sandboxDisplayed, 
                    'warning', 
                    `Set to block but still hidden (${time.toFixed(0)}ms)`,
                    { computedDisplay }
                );
            }
        }, 50);
    }
    
    // Export debugging log data
    window.PostHogDebugger.getDebugReport = () => {
        return {
            timing: timing.events,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    };
    
    console.log('%c[PostHogDebugger] Initialized: View debug data with window.PostHogDebugger.timing', 'color: #2196F3; font-weight: bold');
})();