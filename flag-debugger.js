(function() {
    // Check if debugging is enabled via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    
    // Only initialize if ?debugPHFlags is present in the URL
    if (!urlParams.has('debugPHFlags')) {
        return; // Exit early if not enabled
    }
    
    // Get configuration from URL parameters
    const config = {
        flagName: urlParams.get('flag_name') || 'sandbox_embed',
        flagValue: urlParams.get('flag_value') || 'with-sandbox',
        selector: urlParams.get('selector') || '.homepage-sandbox',
        displayMode: urlParams.get('mode') || 'console' // 'console' or 'window'
    };
    
    // Create a unique namespace to avoid conflicts
    window.PostHogDebugger = window.PostHogDebugger || {};
    
    // Only initialize once
    if (window.PostHogDebugger.initialized) return;
    window.PostHogDebugger.initialized = true;
    
    // First, hide all elements matching our target selector until we've checked the flags
    const initialElements = document.querySelectorAll(urlParams.get('selector') || '.homepage-sandbox');
    if (initialElements.length > 0) {
        initialElements.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Store configuration
    window.PostHogDebugger.config = config;
    
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
        border: '1px solid #444',
        display: config.displayMode === 'window' ? 'block' : 'none' // Only show if displayMode is 'window'
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
        flagValue: createIndicator(`${config.flagName} Flag`),
        targetElement: createIndicator(`Target Element (${config.selector})`),
        elementDisplayed: createIndicator('Element Displayed')
    };
    
    // Add indicators to container
    Object.values(indicators).forEach(indicator => {
        debugContainer.appendChild(indicator.container);
    });
    
    // Add configuration display
    const configDisplay = document.createElement('div');
    configDisplay.style.margin = '10px 0';
    configDisplay.style.padding = '8px';
    configDisplay.style.background = 'rgba(255, 255, 255, 0.1)';
    configDisplay.style.borderRadius = '4px';
    configDisplay.style.fontSize = '11px';
    configDisplay.innerHTML = `
        <strong>Configuration:</strong><br>
        Flag Name: ${config.flagName}<br>
        Expected Value: ${config.flagValue}<br>
        Target Selector: ${config.selector}<br>
        Display Mode: ${config.displayMode}
    `;
    debugContainer.appendChild(configDisplay);
    
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
            configDisplay.style.display = 'none';
            toggleButton.textContent = 'Expand';
            debugContainer.style.padding = '5px';
        } else {
            Object.values(indicators).forEach(ind => ind.container.style.display = 'flex');
            configDisplay.style.display = 'block';
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
            checkSpecificFlag();
            return;
        }
        
        // Wait for flags to load
        updateStatus(indicators.featureFlagsLoaded, 'waiting', 'Waiting for flags...');
        
        window.posthog.onFeatureFlags(() => {
            const time = logEvent('FeatureFlagsLoaded', 'success', 'Feature flags loaded');
            updateStatus(indicators.featureFlagsLoaded, 'success', `Loaded (${time.toFixed(0)}ms)`);
            checkSpecificFlag();
        });
    }
    
    // Check the specific flag
    function checkSpecificFlag() {
        try {
            const flagValue = window.posthog.getFeatureFlag(config.flagName);
            
            if (flagValue === null || flagValue === undefined) {
                const time = logEvent('FlagCheck', 'warning', `${config.flagName} flag not found`, { value: flagValue });
                updateStatus(indicators.flagValue, 'warning', `Not found (${time.toFixed(0)}ms)`);
                
                // Skip element check since flag is not found
                updateStatus(indicators.targetElement, 'info', 'Skipped (flag not found)');
                updateStatus(indicators.elementDisplayed, 'info', 'Skipped (flag not found)');
                
                // Ensure any existing elements matching the selector are hidden
                hideTargetElements();
                return;
            } else if (flagValue === config.flagValue) {
                const time = logEvent('FlagCheck', 'success', `Flag is set to ${config.flagValue}`, { value: flagValue });
                updateStatus(indicators.flagValue, 'success', `Value: ${config.flagValue} (${time.toFixed(0)}ms)`);
                
                // Only proceed to check for target element if flag is correctly set
                checkTargetElement();
            } else {
                const time = logEvent('FlagCheck', 'info', `Flag value: ${flagValue}`, { value: flagValue });
                updateStatus(indicators.flagValue, 'info', `Value: ${flagValue} (${time.toFixed(0)}ms)`);
                
                // Log that we're skipping due to incorrect flag value
                logEvent('ElementSkipped', 'info', `Skipping element display (flag value '${flagValue}' != '${config.flagValue}')`);
                updateStatus(indicators.targetElement, 'info', `Skipped (unexpected flag value '${flagValue}')`);
                updateStatus(indicators.elementDisplayed, 'info', `Skipped (unexpected flag value '${flagValue}')`);
                
                // Ensure any existing elements matching the selector are hidden
                hideTargetElements();
                return;
            }
        } catch (error) {
            const time = logEvent('FlagCheckError', 'error', 'Error checking flag', { error });
            updateStatus(indicators.flagValue, 'error', `Error: ${error.message} (${time.toFixed(0)}ms)`);
            
            // Skip element checks on error
            updateStatus(indicators.targetElement, 'error', 'Skipped (flag error)');
            updateStatus(indicators.elementDisplayed, 'error', 'Skipped (flag error)');
            
            // Ensure any existing elements matching the selector are hidden
            hideTargetElements();
        }
    }
    
    // Hide any elements matching the target selector
    function hideTargetElements() {
        const elements = document.querySelectorAll(config.selector);
        if (elements.length > 0) {
            logEvent('ElementsHidden', 'info', `Hiding ${elements.length} elements matching ${config.selector}`);
            elements.forEach(el => {
                el.style.display = 'none';
            });
        }
    }
    
    // Check for target element
    function checkTargetElement() {
        const targetElement = document.querySelector(config.selector);
        
        if (!targetElement) {
            const time = logEvent('TargetElementCheck', 'error', `Target element not found (${config.selector})`);
            updateStatus(indicators.targetElement, 'error', `Not found (${time.toFixed(0)}ms)`);
            
            // Create a mock element for demonstration when appropriate
            if (config.flagValue === window.posthog.getFeatureFlag(config.flagName)) {
                createMockElement();
            }
            return;
        }
        
        const time = logEvent('TargetElementCheck', 'success', 'Target element found', {
            id: targetElement.id,
            className: targetElement.className,
            display: window.getComputedStyle(targetElement).display
        });
        
        updateStatus(indicators.targetElement, 'success', `Found (${time.toFixed(0)}ms)`);
        
        // Update element display
        updateElementDisplay(targetElement);
    }
    
                // Create mock element if needed
    function createMockElement() {
        // Double-check flag value before creating mock
        const flagValue = window.posthog.getFeatureFlag(config.flagName);
        if (flagValue !== config.flagValue) {
            const time = logEvent('MockElementSkipped', 'warning', 
                `Not creating mock element: flag value '${flagValue}' is not '${config.flagValue}'`);
            updateStatus(indicators.targetElement, 'warning', 
                `Mock not created (incorrect flag) (${time.toFixed(0)}ms)`);
            updateStatus(indicators.elementDisplayed, 'info', 
                `Skipped (no element with correct flag)`);
            return;
        }
        
        const mockElement = document.createElement('div');
        mockElement.className = `mock-element ${config.selector.replace(/^\./, '')}`;
        mockElement.style.display = 'none';
        
        // Add some content to make it visible
        mockElement.innerHTML = `
            <div style="background: #f5f5f5; border: 1px solid #ccc; padding: 15px; 
                        border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 10px; color: #333; font-family: sans-serif;">Mock Element (${config.selector})</h3>
                <p style="margin: 0; color: #666; font-family: sans-serif;">
                    This is a mock element created by the PostHog debugger 
                    since no element with selector '${config.selector}' was found 
                    and the '${config.flagName}' flag is set to '${config.flagValue}'.
                </p>
            </div>
        `;
        
        // Find the first valid container to append to
        let targetContainer = document.body;
        const customContainer = document.querySelector(urlParams.get('container') || 'body');
        if (customContainer) {
            targetContainer = customContainer;
        }
        
        // Add to container
        targetContainer.appendChild(mockElement);
        
        const time = logEvent('MockElementCreated', 'info', 'Created mock element');
        updateStatus(indicators.targetElement, 'info', `Created mock (${time.toFixed(0)}ms)`);
        
        // Update element display
        updateElementDisplay(mockElement);
    }
    
    // Update element display
    function updateElementDisplay(element) {
        const previousDisplay = element.style.display;
        element.style.display = 'block';
        
        const isMock = element.classList.contains('mock-element');
        
        // Position the mock element in a visible area
        if (isMock) {
            Object.assign(element.style, {
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: '999998'
            });
        }
        
        const time = logEvent('ElementDisplayUpdated', 'success', 'Set element display to block', {
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
                    indicators.elementDisplayed, 
                    'success', 
                    `Displayed${isMock ? ' (mock)' : ''} (${time.toFixed(0)}ms)`
                );
            } else {
                updateStatus(
                    indicators.elementDisplayed, 
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
            config: config,
            timestamp: new Date().toISOString()
        };
    };
    
    // Toggle debugger visibility
    window.PostHogDebugger.toggleVisibility = () => {
        if (debugContainer.style.display === 'none') {
            debugContainer.style.display = 'block';
        } else {
            debugContainer.style.display = 'none';
        }
    };
    
    console.log('%c[PostHogDebugger] Initialized with config:', 'color: #2196F3; font-weight: bold', config);
    console.log('%c[PostHogDebugger] View debug data with window.PostHogDebugger.timing or toggle visibility with window.PostHogDebugger.toggleVisibility()', 'color: #2196F3;');
})();