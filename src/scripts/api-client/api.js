/**
 * api.js - API handling functions for the PostHog API Client
 * 
 * This file manages interactions with the PostHog API:
 * - Constructing API requests
 * - Handling authentication
 * - Processing API responses
 * - Error handling
 */

import { isValidUrl } from './utils.js';

// Define PostHog API endpoints structure
export const API_ENDPOINTS = {
    events: {
        path: '/api/projects/{project_id}/events',
        method: 'GET',
        description: 'Get events data',
        params: {
            properties: { type: 'string', description: 'Filter by properties' },
            event: { type: 'string', description: 'Filter by event name' },
            distinct_id: { type: 'string', description: 'Filter by distinct_id' },
            limit: { type: 'number', description: 'Number of events to fetch' }
        }
    },
    persons: {
        path: '/api/projects/{project_id}/persons',
        method: 'GET',
        description: 'Get persons data',
        params: {
            search: { type: 'string', description: 'Search term' },
            properties: { type: 'string', description: 'Filter by properties' },
            limit: { type: 'number', description: 'Number of persons to fetch' }
        }
    },
    query: {
        path: '/api/projects/{project_id}/query',
        method: 'POST',
        description: 'Run SQL query',
        body: {
            query: { 
                type: 'object', 
                description: 'Query object with kind and query',
                properties: {
                    kind: { type: 'string', description: 'Query type (usually "HogQLQuery")' },
                    query: { type: 'string', description: 'The SQL query to run' }
                }
            }
        }
    },
    capture: {
        path: '/capture',
        method: 'POST',
        description: 'Send events to PostHog',
        body: {
            api_key: { type: 'string', description: 'Project API key' },
            event: { type: 'string', description: 'Event name' },
            distinct_id: { type: 'string', description: 'User identifier' },
            properties: { type: 'object', description: 'Event properties' }
        },
        required: ['api_key', 'event', 'distinct_id']
    },
    decide: {
        path: '/decide',
        method: 'POST',
        description: 'Evaluate feature flags',
        body: {
            api_key: { type: 'string', description: 'Project API key' },
            distinct_id: { type: 'string', description: 'User identifier' },
            person_properties: { type: 'object', description: 'Person properties', optional: true },
            groups: { type: 'object', description: 'Group properties', optional: true }
        },
        required: ['api_key', 'distinct_id']
    },
    // More endpoints will be added as needed
};

/**
 * Validates API request parameters
 * @param {Object} endpoint - The API endpoint configuration
 * @param {Object} params - The parameters to validate
 * @return {Object} - Validation result {isValid, errors}
 */
export function validateParams(endpoint, params) {
    const errors = [];
    const requiredParams = endpoint.required || [];
    
    // Check required parameters
    requiredParams.forEach(param => {
        if (!params[param]) {
            errors.push(`Missing required parameter: ${param}`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Builds an API request URL with path parameters
 * @param {string} host - API host
 * @param {string} path - API path template
 * @param {Object} pathParams - Path parameters
 * @return {string} - The complete URL
 */
export function buildUrl(host, path, pathParams = {}) {
    let url = path;
    
    // Replace path parameters
    Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
    });
    
    // Ensure host doesn't have a trailing slash
    if (host.endsWith('/')) {
        host = host.slice(0, -1);
    }
    
    return `${host}${url}`;
}

/**
 * Builds query parameters for GET requests
 * @param {Object} params - The query parameters
 * @return {string} - The query string
 */
export function buildQueryParams(params) {
    if (!params || Object.keys(params).length === 0) {
        return '';
    }
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            if (typeof value === 'object') {
                queryParams.append(key, JSON.stringify(value));
            } else {
                queryParams.append(key, String(value));
            }
        }
    });
    
    return `?${queryParams.toString()}`;
}

/**
 * Executes an API request
 * @param {Object} config - Request configuration
 * @param {string} config.host - API host
 * @param {string} config.path - API path
 * @param {string} config.method - HTTP method
 * @param {Object} config.pathParams - Path parameters
 * @param {Object} config.queryParams - Query parameters
 * @param {Object} config.body - Request body
 * @param {string} config.apiKey - API key for authentication
 * @return {Promise<Object>} - API response
 */
export async function executeRequest(config) {
    const { 
        host, 
        path, 
        method = 'GET', 
        pathParams = {}, 
        queryParams = {}, 
        body = null, 
        apiKey,
        includeApiKeyInHeader = true,
        includeApiKeyInBody = false
    } = config;
    
    // Validate host
    if (!host || !isValidUrl(host)) {
        throw new Error('Invalid API host');
    }
    
    // Validate API key
    if (!apiKey) {
        throw new Error('API key is required');
    }
    
    // Build URL with path parameters
    let url = buildUrl(host, path, pathParams);
    
    // Add query parameters for GET requests
    if (method === 'GET' && Object.keys(queryParams).length > 0) {
        url += buildQueryParams(queryParams);
    }
    
    // Configure fetch options
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Add authorization header if needed
    if (includeApiKeyInHeader) {
        options.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // Add body for non-GET requests
    if (method !== 'GET' && body) {
        // Include API key in body if specified
        const requestBody = {...body};
        if (includeApiKeyInBody && !requestBody.api_key) {
            requestBody.api_key = apiKey;
        }
        options.body = JSON.stringify(requestBody);
    }
    
    try {
        // Execute request
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Handle non-JSON responses
            const text = await response.text();
            try {
                // Try to parse as JSON anyway, in case content-type is wrong
                data = JSON.parse(text);
            } catch (e) {
                // Return text as is
                data = { text };
            }
        }
        
        // Handle error responses
        if (!response.ok) {
            const error = new Error(data.detail || data.error || 'API request failed');
            error.status = response.status;
            error.data = data;
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

/**
 * Executes a HogQL query via the Query API
 * @param {Object} config - Query configuration
 * @param {string} config.host - API host
 * @param {string} config.projectId - Project ID
 * @param {string} config.apiKey - API key
 * @param {string} config.query - SQL query to execute
 * @return {Promise<Object>} - Query results
 */
export async function executeHogQLQuery(config) {
    const { host, projectId, apiKey, query } = config;
    
    return executeRequest({
        host,
        path: API_ENDPOINTS.query.path,
        method: API_ENDPOINTS.query.method,
        pathParams: {
            project_id: projectId
        },
        body: {
            query: {
                kind: "HogQLQuery",
                query
            }
        },
        apiKey,
        includeApiKeyInHeader: true,
        includeApiKeyInBody: false
    });
}

/**
 * Sends an event via the Capture API
 * @param {Object} config - Capture configuration
 * @param {string} config.host - API host
 * @param {string} config.apiKey - API key
 * @param {string} config.event - Event name
 * @param {string} config.distinctId - User identifier
 * @param {Object} config.properties - Event properties
 * @return {Promise<Object>} - API response
 */
export async function captureEvent(config) {
    const { host, apiKey, event, distinctId, properties } = config;
    
    return executeRequest({
        host,
        path: API_ENDPOINTS.capture.path,
        method: API_ENDPOINTS.capture.method,
        body: {
            event,
            distinct_id: distinctId,
            properties
        },
        apiKey,
        includeApiKeyInHeader: false,
        includeApiKeyInBody: true
    });
}

/**
 * Evaluates feature flags via the Decide API
 * @param {Object} config - Decide configuration
 * @param {string} config.host - API host
 * @param {string} config.apiKey - API key
 * @param {string} config.distinctId - User identifier
 * @param {Object} config.personProperties - Person properties
 * @param {Object} config.groups - Group properties
 * @return {Promise<Object>} - API response with feature flags
 */
export async function decideFeatureFlags(config) {
    const { host, apiKey, distinctId, personProperties, groups } = config;
    
    const body = {
        distinct_id: distinctId
    };
    
    if (personProperties) {
        body.person_properties = personProperties;
    }
    
    if (groups) {
        body.groups = groups;
    }
    
    return executeRequest({
        host,
        path: API_ENDPOINTS.decide.path,
        method: API_ENDPOINTS.decide.method,
        body,
        apiKey,
        includeApiKeyInHeader: false,
        includeApiKeyInBody: true
    });
}

/**
 * Creates a code preview for the current API request
 * @param {Object} config - The request configuration
 * @return {string} - JavaScript code snippet
 */
export function generateCodePreview(config) {
    const { host, path, method, pathParams = {}, queryParams = {}, body = {} } = config;
    
    // Build URL
    let url = buildUrl(host, path, pathParams);
    
    // Add query parameters for GET requests
    if (method === 'GET' && Object.keys(queryParams).length > 0) {
        url += buildQueryParams(queryParams);
    }
    
    // JavaScript fetch example
    const lines = [
        '// PostHog API Request',
        `const url = "${url}";`,
        '',
        'const options = {',
        `    method: "${method}",`,
        '    headers: {',
        '        "Content-Type": "application/json",',
        '        "Authorization": "Bearer YOUR_API_KEY"',
        '    }',
    ];
    
    // Add request body for non-GET requests
    if (method !== 'GET' && Object.keys(body).length > 0) {
        lines.push('    ,');
        lines.push('    body: JSON.stringify({');
        
        // Add body properties
        const bodyLines = Object.entries(body).map(([key, value]) => {
            if (typeof value === 'object') {
                return `        ${key}: ${JSON.stringify(value, null, 8).replace(/\n/g, '\n        ')}`;
            } else {
                return `        ${key}: ${JSON.stringify(value)}`;
            }
        });
        
        lines.push(bodyLines.join(',\n'));
        lines.push('    })');
    }
    
    lines.push('};');
    lines.push('');
    lines.push('fetch(url, options)');
    lines.push('    .then(response => response.json())');
    lines.push('    .then(data => console.log(data))');
    lines.push('    .catch(error => console.error("Error:", error));');
    
    return lines.join('\n');
} 