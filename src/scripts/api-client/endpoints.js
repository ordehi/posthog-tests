/**
 * endpoints.js - API endpoint execution functions for the PostHog API Client
 *
 * Handles executing requests to different PostHog API endpoints.
 */

import * as API from './api.js';
import * as Validation from './validation.js';
import * as UI from './ui.js';

/**
 * Execute Query API request
 * @param {Object} elements - UI elements for the query endpoint
 * @param {Object} connectionInfo - Connection information (host, projectId, apiKey)
 * @returns {Promise<void>}
 */
export async function executeQueryAPI(elements, connectionInfo) {
    const { queryInput, queryButton, queryLoader, queryStatus, queryOutput } = elements;
    
    if (!queryButton || !queryInput) {
        console.error('Query elements not found');
        return;
    }
    
    // Clear previous error states
    Validation.clearAllValidationErrors();
    
    // Validate common inputs
    const validationErrors = Validation.validateConnectionSettings(
        connectionInfo.hostSelect,
        connectionInfo.customHostInput,
        connectionInfo.projectIdInput,
        connectionInfo.apiKeyInput
    );
    
    // Validate query-specific inputs
    const queryErrors = Validation.validateQueryInputs(queryInput);
    validationErrors.push(...queryErrors);
    
    // If there are validation errors, display them and stop
    if (validationErrors.length > 0) {
        Validation.displayValidationErrors(validationErrors);
        return;
    }
    
    // Get validated connection info
    const { host, projectId, apiKey } = connectionInfo.getValues();
    
    // Show loading state
    UI.updateEndpointUIForLoading('query', true, {
        button: queryButton,
        loader: queryLoader,
        status: queryStatus
    });
    
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
                    query: queryInput.value.trim()
                }
            },
            apiKey
        };
        
        // Execute the request
        const result = await API.executeRequest(config);
        
        // Process and display the result
        UI.updateEndpointUIForLoading('query', false, {
            button: queryButton,
            loader: queryLoader,
            status: queryStatus
        });
        UI.displayEndpointResult(queryOutput, result);
    } catch (error) {
        UI.updateEndpointUIForLoading('query', false, {
            button: queryButton,
            loader: queryLoader,
            status: queryStatus
        });
        UI.showError(`Error: ${error.message}`, queryStatus);
        queryOutput.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

/**
 * Execute Capture API request
 * @param {Object} elements - UI elements for the capture endpoint
 * @param {Object} connectionInfo - Connection information (host, projectId, apiKey)
 * @returns {Promise<void>}
 */
export async function executeCaptureAPI(elements, connectionInfo) {
    const { eventNameInput, distinctIdInput, propertiesInput, captureButton, captureLoader, captureStatus, captureOutput } = elements;
    
    if (!captureButton || !eventNameInput || !distinctIdInput) {
        console.error('Capture elements not found');
        return;
    }
    
    // Clear previous error states
    Validation.clearAllValidationErrors();
    
    // Validate common inputs
    const validationErrors = Validation.validateConnectionSettings(
        connectionInfo.hostSelect,
        connectionInfo.customHostInput,
        connectionInfo.projectIdInput,
        connectionInfo.apiKeyInput
    );
    
    // Validate capture-specific inputs
    const { errors, properties } = Validation.validateCaptureInputs(
        eventNameInput,
        distinctIdInput,
        propertiesInput
    );
    
    validationErrors.push(...errors);
    
    // If there are validation errors, display them and stop
    if (validationErrors.length > 0) {
        Validation.displayValidationErrors(validationErrors);
        return;
    }
    
    // Get validated connection info
    const { host, projectId, apiKey } = connectionInfo.getValues();
    
    // Show loading state
    UI.updateEndpointUIForLoading('capture', true, {
        button: captureButton,
        loader: captureLoader,
        status: captureStatus
    });
    
    try {
        // Create the request configuration
        const config = {
            host,
            path: API.API_ENDPOINTS.capture.path,
            method: API.API_ENDPOINTS.capture.method,
            body: {
                api_key: apiKey,
                event: eventNameInput.value.trim(),
                distinct_id: distinctIdInput.value.trim(),
                properties
            }
        };
        
        // Execute the request
        const result = await API.executeRequest(config);
        
        // Process and display the result
        UI.updateEndpointUIForLoading('capture', false, {
            button: captureButton,
            loader: captureLoader,
            status: captureStatus
        });
        UI.displayEndpointResult(captureOutput, result);
    } catch (error) {
        UI.updateEndpointUIForLoading('capture', false, {
            button: captureButton,
            loader: captureLoader,
            status: captureStatus
        });
        UI.showError(`Error: ${error.message}`, captureStatus);
        captureOutput.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

/**
 * Execute Decide API request
 * @param {Object} elements - UI elements for the decide endpoint
 * @param {Object} connectionInfo - Connection information (host, projectId, apiKey)
 * @returns {Promise<void>}
 */
export async function executeDecideAPI(elements, connectionInfo) {
    const { decideDistinctIdInput, personPropertiesInput, groupsInput, decideButton, decideLoader, decideStatus, decideOutput } = elements;
    
    if (!decideButton || !decideDistinctIdInput) {
        console.error('Decide elements not found');
        return;
    }
    
    // Clear previous error states
    Validation.clearAllValidationErrors();
    
    // Validate common inputs
    const validationErrors = Validation.validateConnectionSettings(
        connectionInfo.hostSelect,
        connectionInfo.customHostInput,
        connectionInfo.projectIdInput,
        connectionInfo.apiKeyInput
    );
    
    // Validate decide-specific inputs
    const { errors, personProperties, groups } = Validation.validateDecideInputs(
        decideDistinctIdInput,
        personPropertiesInput,
        groupsInput
    );
    
    validationErrors.push(...errors);
    
    // If there are validation errors, display them and stop
    if (validationErrors.length > 0) {
        Validation.displayValidationErrors(validationErrors);
        return;
    }
    
    // Get validated connection info
    const { host, projectId, apiKey } = connectionInfo.getValues();
    
    // Show loading state
    UI.updateEndpointUIForLoading('decide', true, {
        button: decideButton,
        loader: decideLoader,
        status: decideStatus
    });
    
    try {
        // Create the request configuration
        const config = {
            host,
            path: API.API_ENDPOINTS.decide.path,
            method: API.API_ENDPOINTS.decide.method,
            body: {
                api_key: apiKey,
                distinct_id: decideDistinctIdInput.value.trim()
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
        UI.updateEndpointUIForLoading('decide', false, {
            button: decideButton,
            loader: decideLoader,
            status: decideStatus
        });
        UI.displayEndpointResult(decideOutput, result);
    } catch (error) {
        UI.updateEndpointUIForLoading('decide', false, {
            button: decideButton,
            loader: decideLoader,
            status: decideStatus
        });
        UI.showError(`Error: ${error.message}`, decideStatus);
        decideOutput.innerHTML = `<div class="error">${error.message}</div>`;
    }
} 