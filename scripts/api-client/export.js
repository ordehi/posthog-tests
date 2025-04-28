/**
 * export.js - Export functions for the PostHog API Client
 * 
 * This file contains functions for exporting API results in various formats:
 * - Plain text export
 * - CSV export (mapping JSON to rows and columns)
 * - Future extensions for other formats
 */

import { escapeHtml } from './utils.js';

/**
 * Exports data as plain text
 * @param {Object|Array} data - Data to export
 * @return {string} - Formatted text
 */
export function exportAsText(data) {
    try {
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error exporting as text:', error);
        return `Error exporting data: ${error.message}`;
    }
}

/**
 * Exports data as CSV
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column names (optional, will be derived from data if not provided)
 * @return {string} - CSV formatted string
 */
export function exportAsCsv(data, columns = null) {
    try {
        // Handle non-array data
        if (!Array.isArray(data)) {
            if (typeof data === 'object' && data !== null) {
                // Convert object to array of key-value pairs
                data = Object.entries(data).map(([key, value]) => ({ key, value }));
            } else {
                // Return simple string for primitive types
                return String(data);
            }
        }

        // Nothing to export
        if (data.length === 0) {
            return '';
        }

        // Determine columns if not provided
        if (!columns) {
            // Use keys from the first object as columns
            columns = Object.keys(data[0]);
        }

        // Create CSV header
        let csv = columns.map(column => `"${String(column).replace(/"/g, '""')}"`).join(',') + '\n';

        // Add data rows
        data.forEach(item => {
            const row = columns.map(column => {
                const value = item[column];
                // Handle different value types
                if (value === null || value === undefined) {
                    return '';
                } else if (typeof value === 'object') {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                } else {
                    return `"${String(value).replace(/"/g, '""')}"`;
                }
            }).join(',');
            csv += row + '\n';
        });

        return csv;
    } catch (error) {
        console.error('Error exporting as CSV:', error);
        return `Error exporting data as CSV: ${error.message}`;
    }
}

/**
 * Creates a download link for exported data
 * @param {string} data - Data to download
 * @param {string} filename - Name of the file
 * @param {string} mimeType - MIME type of the file
 */
export function downloadData(data, filename, mimeType = 'text/plain') {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Formats tabular data for display in the UI
 * @param {Array} data - Array of objects to display
 * @param {Array} columns - Column definitions (optional)
 * @return {string} - HTML table representation of the data
 */
export function formatTableForDisplay(data, columns = null) {
    try {
        // Handle non-array data
        if (!Array.isArray(data)) {
            return `<div class="info-box">Data is not in tabular format</div>`;
        }

        // No data to display
        if (data.length === 0) {
            return `<div class="info-box">No data to display</div>`;
        }

        // Determine columns if not provided
        if (!columns) {
            columns = Object.keys(data[0]);
        }

        // Build HTML table
        let html = '<table class="api-results-table">';
        
        // Table header
        html += '<thead><tr>';
        columns.forEach(column => {
            html += `<th>${escapeHtml(String(column))}</th>`;
        });
        html += '</tr></thead>';
        
        // Table body
        html += '<tbody>';
        data.forEach(row => {
            html += '<tr>';
            columns.forEach(column => {
                const value = row[column];
                let cellValue;
                
                // Format cell value based on type
                if (value === null || value === undefined) {
                    cellValue = '<i>null</i>';
                } else if (typeof value === 'object') {
                    cellValue = JSON.stringify(value);
                } else {
                    cellValue = String(value);
                }
                
                html += `<td>${escapeHtml(cellValue)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        return html;
    } catch (error) {
        console.error('Error formatting table:', error);
        return `<div class="error-box">Error formatting table: ${escapeHtml(error.message)}</div>`;
    }
} 