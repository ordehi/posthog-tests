// DOM elements
const hostSelect = document.getElementById('host');
const customHostContainer = document.getElementById('custom-host-container');
const customHostInput = document.getElementById('custom-host');
const projectIdInput = document.getElementById('project-id');
const apiKeyInput = document.getElementById('api-key');
const queryInput = document.getElementById('query');
const fetchButton = document.getElementById('fetch-button');
const formattedOutputDiv = document.getElementById('formatted-output');
const rawOutputDiv = document.getElementById('raw-output');
const loader = document.getElementById('loader');
const statusSpan = document.getElementById('status');
const copyFormattedButton = document.getElementById('copy-formatted-button');
const copyRawButton = document.getElementById('copy-raw-button');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize tabs
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

// Handle custom host selection
hostSelect.addEventListener('change', function() {
    customHostContainer.style.display = this.value === 'custom' ? 'block' : 'none';
});

// Fetch data from PostHog API
fetchButton.addEventListener('click', async function() {
    let host;
    if (hostSelect.value === 'custom') {
        host = customHostInput.value.trim();
        if (!host) {
            showError('Please enter a custom host URL');
            return;
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
    const query = queryInput.value.trim();

    // Validate inputs
    if (!projectId) {
        showError('Project ID is required');
        return;
    }
    if (!apiKey) {
        showError('API Key is required');
        return;
    }
    if (!query) {
        showError('SQL Query is required');
        return;
    }

    // Show loading state
    fetchButton.disabled = true;
    loader.style.display = 'inline-block';
    statusSpan.textContent = 'Running query...';
    statusSpan.className = 'status';
    formattedOutputDiv.innerHTML = '<div class="output-placeholder">Fetching results...</div>';
    rawOutputDiv.innerHTML = '<div class="output-placeholder">Fetching results...</div>';
    copyFormattedButton.style.display = 'none';
    copyRawButton.style.display = 'none';

    try {
        const response = await fetch(`${host}/api/projects/${projectId}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                query: {
                    kind: "HogQLQuery",
                    query: query
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            let errorMessage = 'An error occurred';
            if (data && data.detail) {
                errorMessage = `Error: ${data.detail}`;
            } else if (data && data.error) {
                errorMessage = `Error: ${data.error}`;
            }
            showError(errorMessage);
            return;
        }

        // Format and display the raw JSON response
        const formattedRawOutput = JSON.stringify(data, null, 2);
        rawOutputDiv.innerHTML = `<pre>${formattedRawOutput}</pre>`;
        copyRawButton.style.display = 'block';

        // Format and display the structured response according to HogQLQueryResponse schema
        displayFormattedResults(data);
        copyFormattedButton.style.display = 'block';

        statusSpan.textContent = 'Query completed successfully';
    } catch (error) {
        showError(`Network error: ${error.message}`);
    } finally {
        // Reset UI state
        fetchButton.disabled = false;
        loader.style.display = 'none';
    }
});

// Display formatted results as a table
function displayFormattedResults(data) {
    // Check if the response has the expected structure
    if (!data || !data.results || !Array.isArray(data.results) || !data.columns || !Array.isArray(data.columns)) {
        formattedOutputDiv.innerHTML = '<div class="error-box">The response does not contain valid query results.</div>';
        return;
    }

    const { query, results, columns, types, hogql, clickhouse } = data;

    let html = '<div>';

    // Create table for results
    if (results.length > 0) {
        html += '<table class="sql-results-table">';
        
        // Table header with column names
        html += '<thead><tr>';
        columns.forEach(column => {
            html += `<th>${escapeHtml(column)}</th>`;
        });
        html += '</tr></thead>';
        
        // Table body with results
        html += '<tbody>';
        results.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                let cellValue = cell;
                
                // Format the cell value based on type
                if (cell === null) {
                    cellValue = '<i>null</i>';
                } else if (typeof cell === 'object') {
                    cellValue = JSON.stringify(cell);
                }
                
                html += `<td>${escapeHtml(String(cellValue))}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        // Add result count
        html += `<p style="margin-top: 10px;">${results.length} ${results.length === 1 ? 'row' : 'rows'} returned</p>`;
    } else {
        html += '<div class="info-box">No results returned</div>';
    }

    // Add query details section
    html += '<div class="query-details">';
    
    if (query) {
        html += `<details>
            <summary>Original Query</summary>
            <pre>${escapeHtml(query)}</pre>
        </details>`;
    }
    
    if (hogql) {
        html += `<details>
            <summary>Generated HogQL</summary>
            <pre>${escapeHtml(hogql)}</pre>
        </details>`;
    }
    
    if (clickhouse) {
        html += `<details>
            <summary>Generated ClickHouse Query</summary>
            <pre>${escapeHtml(clickhouse)}</pre>
        </details>`;
    }
    
    html += '</div></div>';
    
    formattedOutputDiv.innerHTML = html;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy results to clipboard (formatted)
copyFormattedButton.addEventListener('click', function() {
    const contentToCopy = formattedOutputDiv.textContent;
    copyToClipboard(contentToCopy, copyFormattedButton);
});

// Copy results to clipboard (raw)
copyRawButton.addEventListener('click', function() {
    const preElement = rawOutputDiv.querySelector('pre');
    if (preElement) {
        copyToClipboard(preElement.textContent, copyRawButton);
    }
});

// Helper function for copying to clipboard
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Show error message
function showError(message) {
    statusSpan.textContent = message;
    statusSpan.className = 'status error';
    formattedOutputDiv.innerHTML = '<div class="error-box">An error occurred. Please check your inputs and try again.</div>';
    rawOutputDiv.innerHTML = '<div class="error-box">An error occurred. Please check your inputs and try again.</div>';
}

// Load any saved values from localStorage
window.addEventListener('DOMContentLoaded', function() {
    const savedHost = localStorage.getItem('posthog_host');
    const savedProjectId = localStorage.getItem('posthog_project_id');
    const savedApiKey = localStorage.getItem('posthog_api_key');
    const savedQuery = localStorage.getItem('posthog_query');

    if (savedHost) {
        if (savedHost === 'https://us.posthog.com' || savedHost === 'https://eu.posthog.com') {
            hostSelect.value = savedHost;
        } else {
            hostSelect.value = 'custom';
            customHostContainer.style.display = 'block';
            customHostInput.value = savedHost;
        }
    }
    
    if (savedProjectId) projectIdInput.value = savedProjectId;
    if (savedApiKey) apiKeyInput.value = savedApiKey;
    if (savedQuery) queryInput.value = savedQuery;
});

// Save values to localStorage when input changes
[hostSelect, customHostInput, projectIdInput, apiKeyInput, queryInput].forEach(input => {
    input.addEventListener('change', saveInputValues);
    input.addEventListener('input', saveInputValues);
});

function saveInputValues() {
    let hostValue;
    if (hostSelect.value === 'custom') {
        hostValue = customHostInput.value.trim();
    } else {
        hostValue = hostSelect.value;
    }
    
    localStorage.setItem('posthog_host', hostValue);
    localStorage.setItem('posthog_project_id', projectIdInput.value.trim());
    localStorage.setItem('posthog_api_key', apiKeyInput.value.trim());
    localStorage.setItem('posthog_query', queryInput.value.trim());
}