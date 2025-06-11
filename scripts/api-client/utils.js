/**
 * utils.js - Utility functions for the PostHog API Client
 * 
 * This file contains general-purpose helper functions used throughout the application:
 * - HTML escaping (to prevent XSS)
 * - Local storage management
 * - JSON response formatting
 * - Basic error handling
 */

/**
 * Escapes HTML special characters in a string to prevent XSS attacks
 * @param {string} text - Text to escape
 * @return {string} - HTML-escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem('posthog_api_client_settings', JSON.stringify({
            host: settings.host || '',
            projectId: settings.projectId || '',
            apiKey: settings.apiKey || '',
            lastQuery: settings.lastQuery || ''
        }));
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

/**
 * Load settings from localStorage
 * @return {Object} - Settings object
 */
export function loadSettings() {
    try {
        const settings = localStorage.getItem('posthog_api_client_settings');
        return settings ? JSON.parse(settings) : {};
    } catch (e) {
        console.error('Error loading settings:', e);
        return {};
    }
}

/**
 * Format JSON data for display
 * @param {Object} jsonData - JSON data to format
 * @return {string} - Formatted JSON string
 */
export function formatJsonForDisplay(jsonData) {
    try {
        return JSON.stringify(jsonData, null, 2);
    } catch (e) {
        console.error('Error formatting JSON:', e);
        return String(jsonData);
    }
}

/**
 * Format an error object for display
 * @param {Error|Object} error - Error object to format
 * @return {Object} - Formatted error object
 */
export function formatError(error) {
    let formattedError = {
        message: 'Unknown error',
        details: null
    };
    
    if (error instanceof Error) {
        formattedError.message = error.message;
        if (error.stack) {
            formattedError.details = error.stack;
        }
    } else if (typeof error === 'object') {
        formattedError.message = error.message || error.error || 'Unknown error';
        formattedError.details = error;
    } else if (typeof error === 'string') {
        formattedError.message = error;
    }
    
    return formattedError;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {HTMLElement} button - Button element that triggered the copy
 */
export function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        button.textContent = 'Failed!';
        
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    });
}

/**
 * Check if a string is a valid URL
 * @param {string} url - URL to check
 * @return {boolean} - Whether the URL is valid
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
} 