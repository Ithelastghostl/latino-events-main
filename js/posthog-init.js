// PostHog — analytics + A/B testing (feature flags) for La Tribu.
//
// Setup notes:
//  - Loads through our own domain (/ingest) via the Vercel rewrite in
//    vercel.json, so it survives ad-blockers and stays same-origin (CSP 'self').
//  - Cookieless/minimal: persistence is in-memory and session recording is OFF,
//    so this does NOT require a cookie-consent banner. Pageviews + feature
//    flags (A/B tests) still work.
//
// TODO(frontend): replace PH_PROJECT_KEY with the real PostHog project API key
//   (starts with "phc_"). Until then PostHog will no-op / 401.
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

posthog.init('PH_PROJECT_KEY', {
  api_host: '/ingest',
  ui_host: 'https://eu.posthog.com',
  persistence: 'memory',          // cookieless — no consent banner required
  disable_session_recording: true,
  autocapture: true,
  capture_pageview: true,
});
