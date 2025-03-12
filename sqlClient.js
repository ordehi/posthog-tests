// DOM elements
const hostSelect = document.getElementById('host');
const customHostContainer = document.getElementById('custom-host-container');
const customHostInput = document.getElementById('custom-host');
const projectIdInput = document.getElementById('project-id');
const apiKeyInput = document.getElementById('api-key');
const queryInput = document.getElementById('query');
const fetchButton = document.getElementById('fetch-button');
const outputDiv = document.getElementById('output');
const loader = document.getElementById('loader');
const statusSpan = document.getElementById('status');
const copyButton = document.getElementById('copy-button');

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
    outputDiv.innerHTML = '<div class="output-placeholder">Fetching results...</div>';
    copyButton.style.display = 'none';

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

        // Format and display the results
        const formattedOutput = JSON.stringify(data, null, 2);
        outputDiv.innerHTML = `<pre>${formattedOutput}</pre>`;
        statusSpan.textContent = 'Query completed successfully';
        copyButton.style.display = 'block';
    } catch (error) {
        showError(`Network error: ${error.message}`);
    } finally {
        // Reset UI state
        fetchButton.disabled = false;
        loader.style.display = 'none';
    }
});

// Copy results to clipboard
copyButton.addEventListener('click', function() {
    const preElement = outputDiv.querySelector('pre');
    if (preElement) {
        const text = preElement.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
});

// Show error message
function showError(message) {
    statusSpan.textContent = message;
    statusSpan.className = 'status error';
    outputDiv.innerHTML = '<div class="output-placeholder">An error occurred. Please check your inputs and try again.</div>';
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