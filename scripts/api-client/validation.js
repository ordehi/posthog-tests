/**
 * validation.js - Validation functions for the PostHog API Client
 *
 * Handles form validation, error display, and input validation for API endpoints.
 */

/**
 * Validate the connection settings
 * @param {HTMLSelectElement} hostSelect - Host selection dropdown
 * @param {HTMLInputElement} customHostInput - Custom host input
 * @param {HTMLInputElement} projectIdInput - Project ID input
 * @param {HTMLInputElement} apiKeyInput - API key input
 * @returns {Array} Array of validation error objects with element and message properties
 */
export function validateConnectionSettings(hostSelect, customHostInput, projectIdInput, apiKeyInput) {
    const errors = [];
    
    // Check for host URL
    if (hostSelect.value === 'custom') {
        const customHost = customHostInput.value.trim();
        if (!customHost) {
            errors.push({
                element: customHostInput,
                message: 'Custom host URL is required'
            });
        } else if (!isValidUrl(customHost)) {
            errors.push({
                element: customHostInput,
                message: 'Invalid URL format (should begin with http:// or https://)'
            });
        }
    }
    
    // Check for project ID
    const projectId = projectIdInput.value.trim();
    if (!projectId) {
        errors.push({
            element: projectIdInput,
            message: 'Project ID is required'
        });
    }
    
    // Check for API key
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        errors.push({
            element: apiKeyInput,
            message: 'API Key is required'
        });
    }
    
    return errors;
}

/**
 * Validate query endpoint inputs
 * @param {HTMLTextAreaElement} queryInput - SQL query input
 * @returns {Array} Array of validation error objects
 */
export function validateQueryInputs(queryInput) {
    const errors = [];
    
    // Validate query-specific inputs
    const query = queryInput.value.trim();
    if (!query) {
        errors.push({
            element: queryInput,
            message: 'SQL Query is required'
        });
    }
    
    return errors;
}

/**
 * Validate capture endpoint inputs
 * @param {HTMLInputElement} eventNameInput - Event name input
 * @param {HTMLInputElement} distinctIdInput - Distinct ID input
 * @param {HTMLTextAreaElement} propertiesInput - Properties JSON input
 * @returns {Array} Array of validation errors and parsed properties object
 */
export function validateCaptureInputs(eventNameInput, distinctIdInput, propertiesInput) {
    const errors = [];
    let properties = {};
    
    // Check required fields
    const eventName = eventNameInput.value.trim();
    const distinctId = distinctIdInput.value.trim();
    
    if (!eventName) {
        errors.push({
            element: eventNameInput,
            message: 'Event name is required'
        });
    }
    
    if (!distinctId) {
        errors.push({
            element: distinctIdInput,
            message: 'Distinct ID is required'
        });
    }
    
    // Parse properties if provided
    if (propertiesInput.value.trim()) {
        try {
            properties = JSON.parse(propertiesInput.value);
        } catch (e) {
            errors.push({
                element: propertiesInput,
                message: 'Invalid JSON format in properties'
            });
        }
    }
    
    return { errors, properties };
}

/**
 * Validate decide endpoint inputs
 * @param {HTMLInputElement} distinctIdInput - Distinct ID input
 * @param {HTMLTextAreaElement} personPropertiesInput - Person properties JSON input
 * @param {HTMLTextAreaElement} groupsInput - Groups JSON input
 * @returns {Object} Object containing errors array and parsed data objects
 */
export function validateDecideInputs(distinctIdInput, personPropertiesInput, groupsInput) {
    const errors = [];
    let personProperties = {};
    let groups = {};
    
    // Check required fields
    const distinctId = distinctIdInput.value.trim();
    if (!distinctId) {
        errors.push({
            element: distinctIdInput,
            message: 'Distinct ID is required'
        });
    }
    
    // Parse person properties if provided
    if (personPropertiesInput.value.trim()) {
        try {
            personProperties = JSON.parse(personPropertiesInput.value);
        } catch (e) {
            errors.push({
                element: personPropertiesInput,
                message: 'Invalid JSON format in person properties'
            });
        }
    }
    
    // Parse groups if provided
    if (groupsInput.value.trim()) {
        try {
            groups = JSON.parse(groupsInput.value);
        } catch (e) {
            errors.push({
                element: groupsInput,
                message: 'Invalid JSON format in groups'
            });
        }
    }
    
    return { errors, personProperties, groups };
}

/**
 * Check if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

/**
 * Display validation errors on the form
 * @param {Array} errors - Array of validation error objects
 */
export function displayValidationErrors(errors) {
    errors.forEach(error => {
        // Add error class to the element
        error.element.classList.add('validation-error');
        
        // Get container of the element
        const container = error.element.closest('.form-group');
        
        // Check if error message already exists
        let errorMessage = container.querySelector('.error-message');
        if (!errorMessage) {
            // Create error message element
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            container.appendChild(errorMessage);
        }
        
        // Set error message text
        errorMessage.textContent = error.message;
    });
    
    // Focus the first element with an error
    if (errors.length > 0) {
        errors[0].element.focus();
    }
}

/**
 * Clear all validation errors
 */
export function clearAllValidationErrors() {
    // Remove all error classes from inputs
    document.querySelectorAll('.validation-error').forEach(element => {
        clearValidationError(element);
    });
}

/**
 * Clear validation error for a specific element
 * @param {HTMLElement} element - The element to clear errors for
 */
export function clearValidationError(element) {
    element.classList.remove('validation-error');
    
    // Get container of the element
    const container = element.closest('.form-group');
    if (container) {
        // Remove error message element if it exists
        const errorMessage = container.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
} 