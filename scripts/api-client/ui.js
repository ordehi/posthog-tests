/**
 * ui.js - UI manipulation functions for the PostHog API Client
 *
 * Handles UI updates, loading states, and endpoint switching functionality.
 */

/**
 * Update UI elements for loading state for a specific endpoint
 * @param {string} endpoint - The endpoint name ('query', 'capture', or 'decide')
 * @param {boolean} isLoading - Whether the endpoint is in a loading state
 * @param {Object} elements - Object containing UI elements for the endpoint
 */
export function updateEndpointUIForLoading(endpoint, isLoading, elements) {
    const { button, loader, status } = elements;
    
    if (isLoading) {
        button.disabled = true;
        if (loader) loader.style.display = 'inline-block';
        if (status) status.textContent = 'Loading...';
    } else {
        button.disabled = false;
        if (loader) loader.style.display = 'none';
        if (status) status.textContent = '';
    }
}

/**
 * Display the result of an API call for a specific endpoint
 * @param {Object} outputElement - The element to display the result in
 * @param {*} result - The API call result
 */
export function displayEndpointResult(outputElement, result) {
    if (!outputElement) {
        console.error('Output element not found');
        return;
    }
    
    // Format the result nicely
    try {
        const formattedResult = JSON.stringify(result, null, 2);
        outputElement.innerHTML = `<pre>${formattedResult}</pre>`;
    } catch (e) {
        outputElement.innerHTML = `<div class="error">Error formatting result: ${e.message}</div>`;
    }
}

/**
 * Show an error message in the specified element
 * @param {string} message - The error message to display
 * @param {HTMLElement} statusElement - The element to display the message in (optional)
 */
export function showError(message, statusElement = null) {
    if (statusElement) {
        statusElement.textContent = message;
    } else {
        console.error(message);
    }
}

/**
 * Setup endpoint switching functionality
 * @param {NodeList} endpointTabs - The endpoint tab elements
 */
export function setupEndpointSwitching(endpointTabs) {
    if (!endpointTabs || endpointTabs.length === 0) {
        console.warn('Endpoint tabs not found');
        return;
    }
    
    console.log('Setting up endpoint switching with', endpointTabs.length, 'tabs');
    
    // Add click handlers to endpoint tabs
    endpointTabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Update active tab
            endpointTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Get the endpoint name
            const endpoint = this.getAttribute('data-endpoint');
            
            // Show/hide the appropriate endpoint content
            const apiEndpointContents = document.querySelectorAll('.api-endpoint-content');
            
            apiEndpointContents.forEach(content => {
                content.style.display = 'none';
            });
            
            const endpointContent = document.getElementById(endpoint + '-endpoint');
            if (endpointContent) {
                endpointContent.style.display = 'block';
            } else {
                console.warn('Endpoint content not found:', endpoint);
            }
            
            // Dispatch an event to notify about the endpoint change
            document.dispatchEvent(new CustomEvent('endpointChanged', {
                detail: { endpoint }
            }));
        });
    });
}

/**
 * Setup tab switching functionality (for output display tabs)
 * @param {NodeList} tabButtons - The tab button elements
 * @param {NodeList} tabContents - The tab content elements
 */
export function setupTabSwitching(tabButtons, tabContents) {
    if (!tabButtons || tabButtons.length === 0) {
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
} 