/**
 * api-client.js - Main entry point for the PostHog API Client
 *
 * This file integrates the utility, export, and API modules to provide
 * a complete interface for interacting with the PostHog API.
 */

import * as Utils from './api-client/utils.js';
import * as Export from './api-client/export.js';
import * as Validation from './api-client/validation.js';
import * as UI from './api-client/ui.js';
import * as Endpoints from './api-client/endpoints.js';
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
    UI.setupEndpointSwitching(endpointTabs);
    
    // Set up tab switching
    UI.setupTabSwitching(tabButtons, tabContents);
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
                
                // Clear any error states when changing inputs
                Validation.clearValidationError(input);
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
            Validation.clearValidationError(queryInput);
        });
    }
    
    // Add validation clearing for other inputs
    if (eventNameInput) {
        eventNameInput.addEventListener('input', () => Validation.clearValidationError(eventNameInput));
    }
    
    if (distinctIdInput) {
        distinctIdInput.addEventListener('input', () => Validation.clearValidationError(distinctIdInput));
    }
    
    if (propertiesInput) {
        propertiesInput.addEventListener('input', () => Validation.clearValidationError(propertiesInput));
    }
    
    if (decideDistinctIdInput) {
        decideDistinctIdInput.addEventListener('input', () => Validation.clearValidationError(decideDistinctIdInput));
    }
    
    if (personPropertiesInput) {
        personPropertiesInput.addEventListener('input', () => Validation.clearValidationError(personPropertiesInput));
    }
    
    if (groupsInput) {
        groupsInput.addEventListener('input', () => Validation.clearValidationError(groupsInput));
    }
    
    // Execute buttons for each endpoint
    if (queryButton) {
        queryButton.addEventListener('click', () => {
            Endpoints.executeQueryAPI(
                { queryInput, queryButton, queryLoader, queryStatus, queryOutput },
                getConnectionInfoObject()
            );
        });
    }
    
    if (captureButton) {
        captureButton.addEventListener('click', () => {
            Endpoints.executeCaptureAPI(
                { eventNameInput, distinctIdInput, propertiesInput, captureButton, captureLoader, captureStatus, captureOutput },
                getConnectionInfoObject()
            );
        });
    }
    
    if (decideButton) {
        decideButton.addEventListener('click', () => {
            Endpoints.executeDecideAPI(
                { decideDistinctIdInput, personPropertiesInput, groupsInput, decideButton, decideLoader, decideStatus, decideOutput },
                getConnectionInfoObject()
            );
        });
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
        lastQuery: queryInput ? queryInput.value.trim() : ''
    });
}

/**
 * Get connection information object with form elements and values retrieval
 * @returns {Object} Connection info object with form elements and getValues method
 */
function getConnectionInfoObject() {
    return {
        hostSelect,
        customHostInput,
        projectIdInput,
        apiKeyInput,
        getValues: function() {
            let host;
            if (hostSelect.value === 'custom') {
                host = customHostInput.value.trim();
                
                // Remove trailing slash if present
                if (host.endsWith('/')) {
                    host = host.slice(0, -1);
                }
            } else {
                host = hostSelect.value;
            }
            
            const projectId = projectIdInput.value.trim();
            const apiKey = apiKeyInput.value.trim();
            
            return { host, projectId, apiKey };
        }
    };
}

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
 * Add copy button to output containers
 * @param {HTMLElement} outputContainer - The output container element
 */
function addCopyButtonToOutput(outputContainer) {
    // Check if button already exists
    if (outputContainer.querySelector('.output-copy-button')) {
        return;
    }
    
    const copyButton = document.createElement('button');
    copyButton.className = 'output-copy-button';
    copyButton.textContent = 'Copy';
    
    // Position the button properly within the container
    outputContainer.style.position = 'relative';
    
    copyButton.addEventListener('click', function() {
        const preElement = outputContainer.querySelector('pre');
        if (preElement) {
            Utils.copyToClipboard(preElement.textContent, copyButton);
        }
    });
    
    outputContainer.appendChild(copyButton);
}

// Modify the endpoint execution functions to add copy buttons
const originalExecuteQueryAPI = Endpoints.executeQueryAPI;
Endpoints.executeQueryAPI = async function(elements, connectionInfo) {
    try {
        const result = await originalExecuteQueryAPI(elements, connectionInfo);
        // Only add the copy button if there's content to copy
        if (elements.queryOutput && elements.queryOutput.querySelector('pre')) {
            addCopyButtonToOutput(elements.queryOutput.closest('.output-container'));
        }
        return result;
    } catch (error) {
        console.error('Error in executeQueryAPI:', error);
        throw error;
    }
};

const originalExecuteCaptureAPI = Endpoints.executeCaptureAPI;
Endpoints.executeCaptureAPI = async function(elements, connectionInfo) {
    try {
        const result = await originalExecuteCaptureAPI(elements, connectionInfo);
        if (elements.captureOutput && elements.captureOutput.querySelector('pre')) {
            addCopyButtonToOutput(elements.captureOutput.closest('.output-container'));
        }
        return result;
    } catch (error) {
        console.error('Error in executeCaptureAPI:', error);
        throw error;
    }
};

const originalExecuteDecideAPI = Endpoints.executeDecideAPI;
Endpoints.executeDecideAPI = async function(elements, connectionInfo) {
    try {
        const result = await originalExecuteDecideAPI(elements, connectionInfo);
        if (elements.decideOutput && elements.decideOutput.querySelector('pre')) {
            addCopyButtonToOutput(elements.decideOutput.closest('.output-container'));
        }
        return result;
    } catch (error) {
        console.error('Error in executeDecideAPI:', error);
        throw error;
    }
};