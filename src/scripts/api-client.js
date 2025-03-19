/**
 * api-client.js - Main entry point for the PostHog API Client
 *
 * This file integrates the utility, export, and API modules to provide
 * a complete interface for interacting with the PostHog API.
 */

import * as Utils from './api-client/utils.js';
import * as Export from './api-client/export.js';
import * as API from './api-client/api.js';
import { updateCodePreview, getCurrentEndpoint, getCurrentLanguage } from './api-client/code-preview.js';

// DOM Elements
let hostSelect, customHostContainer, customHostInput, projectIdInput, apiKeyInput;
let queryInput, queryButton, queryLoader, queryStatus, queryOutput;
let eventNameInput, distinctIdInput, propertiesInput, captureButton, captureLoader, captureStatus, captureOutput;
let decideDistinctIdInput, personPropertiesInput, groupsInput, decideButton, decideLoader, decideStatus, decideOutput;
let formattedOutputDiv, rawOutputDiv;
let copyFormattedButton, copyRawButton, exportTextButton, exportCsvButton;
let tabButtons, tabContents;
let codePreviewDiv, copyCodeButton;
let endpointTabs;
let fetchButton, loader, statusSpan;

// Initialize the client when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    initElements();
    
    // Load saved settings
    loadSavedSettings();
    
    // Set up event listeners
    setupEventListeners();

    // Set up endpoint switching
    setupEndpointSwitching();
});

/**
 * Initialize DOM elements
 */
function initElements() {
    // Connection settings
    hostSelect = document.getElementById('host');
    customHostContainer = document.getElementById('custom-host-container');
    customHostInput = document.getElementById('custom-host');
    projectIdInput = document.getElementById('project-id');
    apiKeyInput = document.getElementById('api-key');
    
    // Query API elements
    queryInput = document.getElementById('query');
    queryButton = document.getElementById('query-button');
    queryLoader = document.querySelector('.query-loader');
    queryStatus = document.querySelector('.query-status');
    queryOutput = document.getElementById('query-output');
    
    // Capture API elements
    eventNameInput = document.getElementById('event-name');
    distinctIdInput = document.getElementById('distinct-id');
    propertiesInput = document.getElementById('properties');
    captureButton = document.getElementById('capture-button');
    captureLoader = document.querySelector('.capture-loader');
    captureStatus = document.querySelector('.capture-status');
    captureOutput = document.getElementById('capture-output');
    
    // Decide API elements
    decideDistinctIdInput = document.getElementById('decide-distinct-id');
    personPropertiesInput = document.getElementById('person-properties');
    groupsInput = document.getElementById('groups');
    decideButton = document.getElementById('decide-button');
    decideLoader = document.querySelector('.decide-loader');
    decideStatus = document.querySelector('.decide-status');
    decideOutput = document.getElementById('decide-output');
    
    // General elements from the SQL client
    fetchButton = document.getElementById('fetch-button');
    loader = document.getElementById('loader');
    statusSpan = document.getElementById('status');
    formattedOutputDiv = document.getElementById('formatted-output');
    rawOutputDiv = document.getElementById('raw-output');
    copyFormattedButton = document.getElementById('copy-formatted-button');
    copyRawButton = document.getElementById('copy-raw-button');
    exportTextButton = document.getElementById('export-text-button');
    exportCsvButton = document.getElementById('export-csv-button');
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');
    codePreviewDiv = document.getElementById('code-preview');
    copyCodeButton = document.getElementById('copy-code-button');

    // Endpoint selector tabs
    endpointTabs = document.querySelectorAll('.endpoint-tab');
}

/**
 * Load saved settings from localStorage
 */
function loadSavedSettings() {
    const settings = Utils.loadSettings();
    
    if (settings.host) {
        if (settings.host === 'https://us.posthog.com' || settings.host === 'https://eu.posthog.com') {
            hostSelect.value = settings.host;
        } else {
            hostSelect.value = 'custom';
            customHostContainer.style.display = 'block';
            customHostInput.value = settings.host;
        }
    }
    
    if (settings.projectId) {
        projectIdInput.value = settings.projectId;
    }
    
    if (settings.apiKey) {
        apiKeyInput.value = settings.apiKey;
    }
    
    if (settings.lastQuery) {
        queryInput.value = settings.lastQuery;
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Host selection change
    hostSelect.addEventListener('change', function() {
        customHostContainer.style.display = this.value === 'custom' ? 'block' : 'none';
        updateCodePreview(getCurrentEndpoint(), getCurrentLanguage());
    });
    
    // Input changes
    [customHostInput, projectIdInput, apiKeyInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                saveInputValues();
                updateCodePreview(getCurrentEndpoint(), getCurrentLanguage());
            });
        }
    });
    
    // Query-specific input change
    if (queryInput) {
        queryInput.addEventListener('input', function() {
            saveInputValues();
            if (getCurrentEndpoint() === 'query') {
                updateCodePreview('query', getCurrentLanguage());
            }
        });
    }
    
    // Tab switching (from SQL client)
    if (tabButtons && tabButtons.length > 0) {
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
    
    // Execute buttons for each endpoint
    if (queryButton) {
        queryButton.addEventListener('click', () => executeQueryAPI());
    }
    
    if (captureButton) {
        captureButton.addEventListener('click', () => executeCaptureAPI());
    }
    
    if (decideButton) {
        decideButton.addEventListener('click', () => executeDecideAPI());
    }
    
    // Copy and export buttons from SQL client
    if (copyFormattedButton) {
        copyFormattedButton.addEventListener('click', () => {
            Utils.copyToClipboard(formattedOutputDiv.textContent, copyFormattedButton);
        });
    }
    
    if (copyRawButton) {
        copyRawButton.addEventListener('click', () => {
            const preElement = rawOutputDiv.querySelector('pre');
            if (preElement) {
                Utils.copyToClipboard(preElement.textContent, copyRawButton);
            }
        });
    }
    
    if (copyCodeButton) {
        copyCodeButton.addEventListener('click', () => {
            const preElement = codePreviewDiv.querySelector('pre');
            if (preElement) {
                Utils.copyToClipboard(preElement.textContent, copyCodeButton);
            }
        });
    }
    
    // Export buttons
    if (exportTextButton) {
        exportTextButton.addEventListener('click', exportAsText);
    }
    
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', exportAsCsv);
    }
}

/**
 * Save input values to localStorage
 */
function saveInputValues() {
    let hostValue;
    if (hostSelect.value === 'custom') {
        hostValue = customHostInput.value.trim();
    } else {
        hostValue = hostSelect.value;
    }
    
    Utils.saveSettings({
        host: hostValue,
        projectId: projectIdInput.value.trim(),
        apiKey: apiKeyInput.value.trim(),
        lastQuery: queryInput.value.trim()
    });
}

/**
 * Execute Query API request
 */
async function executeQueryAPI() {
    if (!queryButton || !queryInput) {
        console.error('Query elements not found');
        return;
    }
    
    // Get common inputs
    const connectionInfo = getConnectionInfo();
    if (!connectionInfo) return;
    
    const { host, projectId, apiKey } = connectionInfo;
    const query = queryInput.value.trim();
    
    // Validate inputs
    if (!query) {
        showError('SQL Query is required', queryStatus);
        return;
    }
    
    // Show loading state
    updateEndpointUIForLoading('query', true);
    
    try {
        // Create the request configuration
        const config = {
            host,
            path: API.API_ENDPOINTS.query.path,
            method: API.API_ENDPOINTS.query.method,
            pathParams: {
                project_id: projectId
            },
            body: {
                query: {
                    kind: "HogQLQuery",
                    query: query
                }
            },
            apiKey
        };
        
        // Execute the request
        const result = await API.executeRequest(config);
        
        // Process and display the result
        updateEndpointUIForLoading('query', false);
        displayEndpointResult('query', result);
    } catch (error) {
        updateEndpointUIForLoading('query', false);
        showError(`Error: ${error.message}`, queryStatus);
        queryOutput.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

/**
 * Execute Capture API request
 */
async function executeCaptureAPI() {
    if (!captureButton || !eventNameInput || !distinctIdInput) {
        console.error('Capture elements not found');
        return;
    }
    
    // Get common inputs
    const connectionInfo = getConnectionInfo();
    if (!connectionInfo) return;
    
    const { host, projectId, apiKey } = connectionInfo;
    const eventName = eventNameInput.value.trim();
    const distinctId = distinctIdInput.value.trim();
    let properties = {};
    
    // Parse properties if provided
    if (propertiesInput.value.trim()) {
        try {
            properties = JSON.parse(propertiesInput.value);
        } catch (e) {
            showError('Invalid JSON in properties', captureStatus);
            return;
        }
    }
    
    // Validate inputs
    if (!eventName) {
        showError('Event name is required', captureStatus);
        return;
    }
    
    if (!distinctId) {
        showError('Distinct ID is required', captureStatus);
        return;
    }
    
    // Show loading state
    updateEndpointUIForLoading('capture', true);
    
    try {
        // Create the request configuration
        const config = {
            host,
            path: API.API_ENDPOINTS.capture.path,
            method: API.API_ENDPOINTS.capture.method,
            body: {
                api_key: apiKey,
                event: eventName,
                distinct_id: distinctId,
                properties
            }
        };
        
        // Execute the request
        const result = await API.executeRequest(config);
        
        // Process and display the result
        updateEndpointUIForLoading('capture', false);
        displayEndpointResult('capture', result);
    } catch (error) {
        updateEndpointUIForLoading('capture', false);
        showError(`Error: ${error.message}`, captureStatus);
        captureOutput.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

/**
 * Execute Decide API request
 */
async function executeDecideAPI() {
    if (!decideButton || !decideDistinctIdInput) {
        console.error('Decide elements not found');
        return;
    }
    
    // Get common inputs
    const connectionInfo = getConnectionInfo();
    if (!connectionInfo) return;
    
    const { host, projectId, apiKey } = connectionInfo;
    const distinctId = decideDistinctIdInput.value.trim();
    let personProperties = {};
    let groups = {};
    
    // Parse person properties if provided
    if (personPropertiesInput.value.trim()) {
        try {
            personProperties = JSON.parse(personPropertiesInput.value);
        } catch (e) {
            showError('Invalid JSON in person properties', decideStatus);
            return;
        }
    }
    
    // Parse groups if provided
    if (groupsInput.value.trim()) {
        try {
            groups = JSON.parse(groupsInput.value);
        } catch (e) {
            showError('Invalid JSON in groups', decideStatus);
            return;
        }
    }
    
    // Validate inputs
    if (!distinctId) {
        showError('Distinct ID is required', decideStatus);
        return;
    }
    
    // Show loading state
    updateEndpointUIForLoading('decide', true);
    
    try {
        // Create the request configuration
        const config = {
            host,
            path: API.API_ENDPOINTS.decide.path,
            method: API.API_ENDPOINTS.decide.method,
            body: {
                api_key: apiKey,
                distinct_id: distinctId
            }
        };
        
        // Add optional parameters if provided
        if (Object.keys(personProperties).length > 0) {
            config.body.person_properties = personProperties;
        }
        
        if (Object.keys(groups).length > 0) {
            config.body.groups = groups;
        }
        
        // Execute the request
        const result = await API.executeRequest(config);
        
        // Process and display the result
        updateEndpointUIForLoading('decide', false);
        displayEndpointResult('decide', result);
    } catch (error) {
        updateEndpointUIForLoading('decide', false);
        showError(`Error: ${error.message}`, decideStatus);
        decideOutput.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

/**
 * Get common connection information
 */
function getConnectionInfo() {
    let host;
    if (hostSelect.value === 'custom') {
        host = customHostInput.value.trim();
        if (!host) {
            showError('Please enter a custom host URL');
            return null;
        }
        // Remove trailing slash if present
        if (host.endsWith('/')) {
            host = host.slice(0, -1);
        }
    } else {
        host = hostSelect.value;
    }
    
    const projectId = projectIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    // Validate inputs
    if (!projectId) {
        showError('Project ID is required');
        return null;
    }
    
    if (!apiKey) {
        showError('API Key is required');
        return null;
    }
    
    return { host, projectId, apiKey };
}

/**
 * Update UI elements for loading state for a specific endpoint
 */
function updateEndpointUIForLoading(endpoint, isLoading) {
    let button, loader, status;
    
    switch (endpoint) {
        case 'query':
            button = queryButton;
            loader = queryLoader;
            status = queryStatus;
            break;
        case 'capture':
            button = captureButton;
            loader = captureLoader;
            status = captureStatus;
            break;
        case 'decide':
            button = decideButton;
            loader = decideLoader;
            status = decideStatus;
            break;
        default:
            console.error('Unknown endpoint:', endpoint);
            return;
    }
    
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
 */
function displayEndpointResult(endpoint, result) {
    let outputElement;
    
    switch (endpoint) {
        case 'query':
            outputElement = queryOutput;
            break;
        case 'capture':
            outputElement = captureOutput;
            break;
        case 'decide':
            outputElement = decideOutput;
            break;
        default:
            console.error('Unknown endpoint:', endpoint);
            return;
    }
    
    if (!outputElement) {
        console.error('Output element not found for endpoint:', endpoint);
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
 * Show an error message
 */
function showError(message, statusElement = null) {
    if (statusElement) {
        statusElement.textContent = message;
    } else {
        console.error(message);
    }
}

/**
 * Set up endpoint switching
 */
function setupEndpointSwitching() {
    if (!endpointTabs || endpointTabs.length === 0) {
        console.warn('Endpoint tabs not found');
        return;
    }
    
    console.log('Setting up endpoint switching with', endpointTabs.length, 'tabs');
    
    // Add click handlers to endpoint tabs
    endpointTabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Tab clicked:', this.getAttribute('data-endpoint'));
            
            // Update active tab
            endpointTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Get the endpoint name
            const endpoint = this.getAttribute('data-endpoint');
            
            // Show/hide the appropriate endpoint content
            const apiEndpointContents = document.querySelectorAll('.api-endpoint-content');
            console.log('Found', apiEndpointContents.length, 'endpoint contents');
            
            apiEndpointContents.forEach(content => {
                content.style.display = 'none';
            });
            
            const endpointContent = document.getElementById(endpoint + '-endpoint');
            if (endpointContent) {
                console.log('Showing endpoint content:', endpoint);
                endpointContent.style.display = 'block';
            } else {
                console.warn('Endpoint content not found:', endpoint);
            }
        });
    });
}

// Add an endpoint changed event handler
document.addEventListener('endpointChanged', function(e) {
  if (e.detail && e.detail.endpoint) {
    console.log('Endpoint changed event received:', e.detail.endpoint);
    updateCodePreview(e.detail.endpoint, getCurrentLanguage());
  }
});

// Update input change handlers for all field inputs
document.addEventListener('DOMContentLoaded', function() {
  // Listen for any input changes in the form and update code preview
  const allInputFields = document.querySelectorAll('input, textarea, select');
  allInputFields.forEach(function(field) {
    field.addEventListener('input', function() {
      const currentEndpoint = document.querySelector('.endpoint-tab.active')?.getAttribute('data-endpoint') || 'query';
      updateCodePreview(currentEndpoint, getCurrentLanguage());
    });
  });
});

/**
 * Export data as text file
 */
function exportAsText() {
    const result = getResultForExport();
    if (result) {
        Export.exportAsText(result);
    }
}

/**
 * Export data as CSV file
 */
function exportAsCsv() {
    const result = getResultForExport();
    if (result) {
        Export.exportAsCsv(result);
    }
}

/**
 * Get result for export
 */
function getResultForExport() {
    try {
        const preElement = rawOutputDiv.querySelector('pre');
        return preElement ? JSON.parse(preElement.textContent) : null;
    } catch (e) {
        console.error('Error parsing JSON for export:', e);
        return null;
    }
}