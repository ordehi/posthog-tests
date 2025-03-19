/**
 * code-preview.js - Code preview component for the PostHog API Client
 * 
 * This file provides functionality to generate and display code examples
 * for the different API endpoints.
 */

// We'll use highlight.js from the global context via CDN
// The rest of the module will use standard exports

// Initialize code preview when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checking for highlight.js:', typeof hljs !== 'undefined' ? 'Available' : 'Not available');
    initCodePreview();
});

// Export functions for use in other modules
export function updateCodePreview(endpoint, language) {
    console.log(`Updating code preview for endpoint: ${endpoint}, language: ${language}`);
    
    const codePreviewElement = document.getElementById('code-preview');
    if (!codePreviewElement) {
        console.error('Code preview element not found');
        return;
    }
    
    // Get common connection settings
    const hostSelect = document.getElementById('host');
    if (!hostSelect) {
        console.error('Host select element not found');
        return;
    }
    
    let host = hostSelect.value;
    if (host === 'custom') {
        const customHostInput = document.getElementById('custom-host');
        host = customHostInput ? customHostInput.value.trim() : '';
        host = host || 'https://your-posthog-instance.com';
    }
    
    // Ensure host doesn't have trailing slash
    if (host.endsWith('/')) {
        host = host.slice(0, -1);
    }
    
    const projectIdInput = document.getElementById('project-id');
    const projectId = projectIdInput ? projectIdInput.value.trim() : 'your_project_id';
    
    // Always use a placeholder for API key instead of the actual key
    const apiKey = 'YOUR_API_KEY_HERE';
    
    let code = '';
    
    if (language === 'javascript') {
        // Generate JavaScript code
        code = generateJavaScriptCode(endpoint, host, projectId, apiKey);
    } else if (language === 'curl') {
        // Generate cURL code
        code = generateCurlCode(endpoint, host, projectId, apiKey);
    }
    
    // Update the code preview with syntax highlighting
    const codeContentElement = codePreviewElement.querySelector('.code-content');
    if (codeContentElement) {
        codeContentElement.textContent = code;
        
        // Apply syntax highlighting if hljs is available (loaded via CDN)
        if (typeof hljs !== 'undefined') {
            console.log('Applying syntax highlighting with highlight.js');
            const hlLanguage = language === 'curl' ? 'bash' : 'javascript';
            try {
                const highlightedCode = hljs.highlight(code, { language: hlLanguage }).value;
                codeContentElement.innerHTML = highlightedCode;
                console.log('Highlighting applied successfully');
            } catch (e) {
                console.error('Error applying syntax highlighting:', e);
                // Fallback to basic HTML escaping
                codeContentElement.textContent = code;
            }
        } else {
            console.warn('Highlight.js not loaded, showing plain text');
        }
    } else {
        let content = code;
        
        // Apply syntax highlighting if hljs is available
        if (typeof hljs !== 'undefined') {
            const hlLanguage = language === 'curl' ? 'bash' : 'javascript';
            try {
                content = hljs.highlight(code, { language: hlLanguage }).value;
            } catch (e) {
                console.error('Error applying syntax highlighting:', e);
            }
        }
        
        codePreviewElement.innerHTML = `<pre class="code-content hljs">${content}</pre>`;
    }
}

// Export helper functions
export function getCurrentEndpoint() {
    const activeTab = document.querySelector('.endpoint-tab.active');
    return activeTab ? activeTab.getAttribute('data-endpoint') : 'query';
}

export function getCurrentLanguage() {
    const activeTab = document.querySelector('.code-tab.active');
    return activeTab ? activeTab.getAttribute('data-language') : 'javascript';
}

/**
 * Initialize code preview component
 */
function initCodePreview() {
    console.log('Initializing code preview component');
    
    // Code preview tab switching
    const codeTabs = document.querySelectorAll('.code-tab');
    codeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            codeTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update code preview based on selected language
            const language = this.getAttribute('data-language');
            updateCodePreview(getCurrentEndpoint(), language);
        });
    });
    
    // Add input change listeners for all input fields
    setupInputListeners();
    
    // Copy button handler
    const copyButton = document.getElementById('copy-code-button');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            const codeElement = document.querySelector('.code-content');
            if (codeElement) {
                // Strip HTML tags to get plain text for copying
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = codeElement.innerHTML;
                const codeText = tempDiv.textContent || tempDiv.innerText;
                
                navigator.clipboard.writeText(codeText).then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            }
        });
    }
    
    // Initialize code preview with default values
    updateCodePreview('query', 'javascript');
}

/**
 * Set up input listeners for relevant fields based on the current endpoint
 */
function setupInputListeners() {
    // Common inputs that affect all endpoints
    const commonInputs = ['host', 'custom-host', 'project-id', 'api-key'];
    commonInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                updateCodePreview(getCurrentEndpoint(), getCurrentLanguage());
            });
        }
    });
    
    // Query specific inputs
    const queryInput = document.getElementById('query');
    if (queryInput) {
        queryInput.addEventListener('input', () => {
            if (getCurrentEndpoint() === 'query') {
                updateCodePreview('query', getCurrentLanguage());
            }
        });
    }
    
    // Capture specific inputs
    ['event-name', 'distinct-id', 'properties'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                if (getCurrentEndpoint() === 'capture') {
                    updateCodePreview('capture', getCurrentLanguage());
                }
            });
        }
    });
    
    // Decide specific inputs
    ['decide-distinct-id', 'person-properties', 'groups'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                if (getCurrentEndpoint() === 'decide') {
                    updateCodePreview('decide', getCurrentLanguage());
                }
            });
        }
    });
}

/**
 * Generate JavaScript code examples for different endpoints
 */
function generateJavaScriptCode(endpoint, host, projectId, apiKey) {
    switch (endpoint) {
        case 'query':
            const queryInput = document.getElementById('query');
            const query = queryInput && queryInput.value.trim() ? 
                queryInput.value.trim() : 
                "SELECT properties FROM events WHERE timestamp > toDateTime('2025-02-26T14:05:00.000000Z')";
            
            return [
                '// Query API - JavaScript Example',
                'const queryConfig = {',
                '    host: "' + host + '",',
                '    path: "/api/projects/' + projectId + '/query",',
                '    method: "POST",',
                '    headers: {',
                '        "Content-Type": "application/json",',
                '        "Authorization": "Bearer ' + apiKey + '"',
                '    },',
                '    body: JSON.stringify({',
                '        query: {',
                '            kind: "HogQLQuery",',
                '            query: `' + query + '`',
                '        }',
                '    })',
                '};',
                '',
                '// Make the API request',
                'fetch(`${queryConfig.host}${queryConfig.path}`, {',
                '    method: queryConfig.method,',
                '    headers: queryConfig.headers,',
                '    body: queryConfig.body',
                '})',
                '.then(response => response.json())',
                '.then(data => console.log(data))',
                '.catch(error => console.error("Error:", error));'
            ].join('\n');
        
        case 'capture':
            const eventNameInput = document.getElementById('event-name');
            const eventName = eventNameInput && eventNameInput.value.trim() ? 
                eventNameInput.value.trim() : 'event_name';
            
            const distinctIdInput = document.getElementById('distinct-id');
            const distinctId = distinctIdInput && distinctIdInput.value.trim() ? 
                distinctIdInput.value.trim() : 'user_123';
            
            let properties = '{}';
            try {
                const propertiesInput = document.getElementById('properties');
                if (propertiesInput && propertiesInput.value.trim()) {
                    const parsed = JSON.parse(propertiesInput.value);
                    properties = JSON.stringify(parsed, null, 4);
                }
            } catch (e) {
                console.error('Error parsing properties JSON:', e);
                properties = '{}';
            }
            
            return [
                '// Capture API - JavaScript Example',
                'const captureConfig = {',
                '    host: "' + host + '",',
                '    path: "/capture",',
                '    method: "POST",',
                '    headers: {',
                '        "Content-Type": "application/json"',
                '    },',
                '    body: JSON.stringify({',
                '        api_key: "' + apiKey + '",',
                '        event: "' + eventName + '",',
                '        distinct_id: "' + distinctId + '",',
                '        properties: ' + properties,
                '    })',
                '};',
                '',
                '// Make the API request',
                'fetch(`${captureConfig.host}${captureConfig.path}`, {',
                '    method: captureConfig.method,',
                '    headers: captureConfig.headers,',
                '    body: captureConfig.body',
                '})',
                '.then(response => response.json())',
                '.then(data => console.log(data))',
                '.catch(error => console.error("Error:", error));'
            ].join('\n');
        
        case 'decide':
            const decideDistinctIdInput = document.getElementById('decide-distinct-id');
            const decideDistinctId = decideDistinctIdInput && decideDistinctIdInput.value.trim() ? 
                decideDistinctIdInput.value.trim() : 'user_123';
            
            // Build person properties
            let personProperties = '{}';
            try {
                const personPropsInput = document.getElementById('person-properties');
                if (personPropsInput && personPropsInput.value.trim()) {
                    const parsed = JSON.parse(personPropsInput.value);
                    personProperties = JSON.stringify(parsed, null, 4);
                }
            } catch (e) {
                console.error('Error parsing person properties JSON:', e);
                personProperties = '{}';
            }
            
            // Build groups
            let groups = '{}';
            try {
                const groupsInput = document.getElementById('groups');
                if (groupsInput && groupsInput.value.trim()) {
                    const parsed = JSON.parse(groupsInput.value);
                    groups = JSON.stringify(parsed, null, 4);
                }
            } catch (e) {
                console.error('Error parsing groups JSON:', e);
                groups = '{}';
            }
            
            return [
                '// Decide API - JavaScript Example',
                'const decideConfig = {',
                '    host: "' + host + '",',
                '    path: "/decide",',
                '    method: "POST",',
                '    headers: {',
                '        "Content-Type": "application/json"',
                '    },',
                '    body: JSON.stringify({',
                '        api_key: "' + apiKey + '",',
                '        distinct_id: "' + decideDistinctId + '",',
                '        person_properties: ' + personProperties + ',',
                '        groups: ' + groups,
                '    })',
                '};',
                '',
                '// Make the API request',
                'fetch(`${decideConfig.host}${decideConfig.path}`, {',
                '    method: decideConfig.method,',
                '    headers: decideConfig.headers,',
                '    body: decideConfig.body',
                '})',
                '.then(response => response.json())',
                '.then(data => console.log(data))',
                '.catch(error => console.error("Error:", error));'
            ].join('\n');
        
        default:
            return '// Select an endpoint to see code example';
    }
}

/**
 * Generate cURL code examples for different endpoints
 */
function generateCurlCode(endpoint, host, projectId, apiKey) {
    switch (endpoint) {
        case 'query':
            const queryInput = document.getElementById('query');
            const query = queryInput && queryInput.value.trim() ? 
                queryInput.value.trim() : 
                "SELECT properties FROM events WHERE timestamp > toDateTime('2025-02-26T14:05:00.000000Z')";
            
            return [
                '# Query API - cURL Example',
                'curl -X POST "' + host + '/api/projects/' + projectId + '/query" \\',
                '  -H "Content-Type: application/json" \\',
                '  -H "Authorization: Bearer ' + apiKey + '" \\',
                '  -d \'{',
                '    "query": {',
                '      "kind": "HogQLQuery",',
                '      "query": "' + query.replace(/"/g, '\\"') + '"',
                '    }',
                '  }\''
            ].join('\n');
        
        case 'capture':
            const eventNameInput = document.getElementById('event-name');
            const eventName = eventNameInput && eventNameInput.value.trim() ? 
                eventNameInput.value.trim() : 'event_name';
            
            const distinctIdInput = document.getElementById('distinct-id');
            const distinctId = distinctIdInput && distinctIdInput.value.trim() ? 
                distinctIdInput.value.trim() : 'user_123';
            
            let properties = '{}';
            try {
                const propertiesInput = document.getElementById('properties');
                if (propertiesInput && propertiesInput.value.trim()) {
                    const parsed = JSON.parse(propertiesInput.value);
                    properties = JSON.stringify(parsed).replace(/"/g, '\\"');
                }
            } catch (e) {
                console.error('Error parsing properties JSON:', e);
                properties = '{}';
            }
            
            return [
                '# Capture API - cURL Example',
                'curl -X POST "' + host + '/capture" \\',
                '  -H "Content-Type: application/json" \\',
                '  -d \'{',
                '    "api_key": "' + apiKey + '",',
                '    "event": "' + eventName + '",',
                '    "distinct_id": "' + distinctId + '",',
                '    "properties": ' + properties,
                '  }\''
            ].join('\n');
        
        case 'decide':
            const decideDistinctIdInput = document.getElementById('decide-distinct-id');
            const decideDistinctId = decideDistinctIdInput && decideDistinctIdInput.value.trim() ? 
                decideDistinctIdInput.value.trim() : 'user_123';
            
            // Build person properties
            let personProperties = '{}';
            try {
                const personPropsInput = document.getElementById('person-properties');
                if (personPropsInput && personPropsInput.value.trim()) {
                    const parsed = JSON.parse(personPropsInput.value);
                    personProperties = JSON.stringify(parsed).replace(/"/g, '\\"');
                }
            } catch (e) {
                console.error('Error parsing person properties JSON:', e);
                personProperties = '{}';
            }
            
            // Build groups
            let groups = '{}';
            try {
                const groupsInput = document.getElementById('groups');
                if (groupsInput && groupsInput.value.trim()) {
                    const parsed = JSON.parse(groupsInput.value);
                    groups = JSON.stringify(parsed).replace(/"/g, '\\"');
                }
            } catch (e) {
                console.error('Error parsing groups JSON:', e);
                groups = '{}';
            }
            
            return [
                '# Decide API - cURL Example',
                'curl -X POST "' + host + '/decide" \\',
                '  -H "Content-Type: application/json" \\',
                '  -d \'{',
                '    "api_key": "' + apiKey + '",',
                '    "distinct_id": "' + decideDistinctId + '",',
                '    "person_properties": ' + personProperties + ',',
                '    "groups": ' + groups,
                '  }\''
            ].join('\n');
        
        default:
            return '# Select an endpoint to see code example';
    }
}