// Mock PostHog implementation for testing
let mockPostHogInitialized = false;
let surveyVisible = false;

// Initialize mock PostHog
function initMockPostHog() {
    window.posthog = {
        onFeatureFlags: function(callback) {
            console.log("Mock PostHog: onFeatureFlags called");
            if (callback) callback();
        },
        getFeatureFlag: function(flagName) {
            console.log(`Mock PostHog: getFeatureFlag called for '${flagName}'`);
            return true;
        },
        featureFlags: {
            flagsLoaded: true
        }
    };
    
    mockPostHogInitialized = true;
    console.log("Mock PostHog: Initialized");
}

// Toggle survey visibility
function toggleSurvey() {
    if (!mockPostHogInitialized) {
        alert("Please initialize PostHog first!");
        return;
    }
    
    surveyVisible = !surveyVisible;
    const surveyContainer = document.getElementById('car_type_question_survey');
    
    if (surveyVisible) {
        surveyContainer.innerHTML = `
            <div class="survey-content">
                <h4>Car Type Survey</h4>
                <p>What type of car do you drive?</p>
                <div class="survey-options">
                    <button class="btn secondary">Sedan</button>
                    <button class="btn secondary">SUV</button>
                    <button class="btn secondary">Sports Car</button>
                    <button class="btn secondary">Other</button>
                </div>
            </div>
        `;
        console.log("Survey: Made visible");
    } else {
        surveyContainer.innerHTML = '<p class="placeholder-text">Survey should appear here when targeted correctly</p>';
        console.log("Survey: Hidden");
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize button handlers
    document.getElementById('init-posthog-btn').addEventListener('click', initMockPostHog);
    document.getElementById('toggle-survey-btn').addEventListener('click', toggleSurvey);
    
    // Check if we're in debug mode
    if (window.location.search.includes('debugPHFlags')) {
        console.log("Debug mode enabled");
        initMockPostHog();
    }
}); 