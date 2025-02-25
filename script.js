const POSTHOG_CONFIG = {
    disable_compression: true,
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    debug: true
};

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

document.getElementById("clickMe").addEventListener("click", function () {
    document.getElementById("message").innerText = "Hello from JavaScript!";
});

document.getElementById("config").innerText = JSON.stringify(POSTHOG_CONFIG, null, 4);

!function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);
posthog.init('phc_ddA554Xlja4bfLInShnZnM6b7d3Op1aQAaieWzw3oz7', POSTHOG_CONFIG)

// Ensure flags are loaded before usage.
// You'll only need to call this on the code for when the first time a user visits.
posthog.onFeatureFlags(function() {
    // feature flags should be available at this point
    if (posthog.isFeatureEnabled('new-feature') ) {
        injectFeature('new-feature')
    } else {
        injectFeature('old-feature')
    }
})

if (posthog.isFeatureEnabled('new-feature') ) {
    injectFeature('new-feature')
} else {
    injectFeature('old-feature')
}

// Inject the new feature into the page
function injectFeature(ff) {
    const featureDiv = document.createElement('div');
    featureDiv.innerHTML = FEATURES[ff];
    document.body.appendChild(featureDiv);
}