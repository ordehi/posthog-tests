const FEATURES = {
    'new-feature': `
        <div id="new-feature" style="padding: 20px; background: lightblue; border-radius: 5px;">
            <h3>🚀 New Feature Activated!</h3>
            <p>This feature is only visible when the flag is enabled.</p>
        </div>
    `,
    'old-feature': `
        <div id="old-feature" style="padding: 20px; background: lightblue; border-radius: 5px;">
            <h3>🚀 You got the old feature!</h3>
            <p>This feature is only visible when the flag is disabled.</p>
        </div>
    `
}


// document.getElementById("clickMe").addEventListener("click", function () {
//     const userId = document.getElementById("userid").value;
//     if (userId) {
//         posthog.identify(userId);
//         document.getElementById("message").innerText = `${userId} identified!`;
//     } else {
//         document.getElementById("message").innerText = "You joker, you. Please set a user ID above";
//     }
// });

// const configContainer = document.getElementById("config");
// configContainer.innerText = JSON.stringify(POSTHOG_CONFIG, null, 4);

// Your flag depends on properties that are not instantly available. If you want
// to make them available without waiting for server delays, send these properties for flag evaluation, like so:
// Make sure to call this before evaluating flags. More info: https://posthog.com/docs/libraries/js#overriding-server-properties 
// posthog.setPersonPropertiesForFlags({'$current_url': window.location.href});

// posthog.onFeatureFlags(function() {
//     // feature flags should be available at this point
//     if (posthog.isFeatureEnabled('old-vs-new')) {
//         console.log('old-vs-new is true');
//         injectFeature('new-feature')
//     } else {
//         console.log('old-vs-new is false');
//         injectFeature('old-feature')
//     }
// })

// Ensure flags are loaded before usage.
// You'll only need to call this on the code for when the first time a user visits.
// posthog.onFeatureFlags(function() {
//     console.log('running onFeatureFlags');
//     // feature flags should be available at this point
//     let flag = posthog.getFeatureFlag('old-vs-new');
//     console.log('Detected flag value: ', flag);
//     if (flag  == 'test') {
//         injectFeature('new-feature', flag);
//     } else if (flag == 'control') {
//         injectFeature('old-feature', flag)
//     }
// })


// Inject the new feature into the page
function injectFeature(feature, flag) {
    // Check if the feature already exists
    if (!document.querySelector(`[data-feature="${feature}"]`)) {
        const featureDiv = document.createElement('div');
        featureDiv.setAttribute('data-feature', feature);
        featureDiv.innerHTML = FEATURES[feature];
        document.body.appendChild(featureDiv);
    }
}