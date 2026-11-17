// Browser calls to the site's own API (Cloudflare Worker, worker/index.ts).
// File name kept so every page's <script src> stays the same.

async function callApi(name, payload) {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function subscribeEmail(email) {
  // Server generates the unique offer code and sends the welcome email.
  return callApi('subscribe', { email: email.trim().toLowerCase() });
}

async function sendContactMessage({ name, venue, email, message }) {
  return callApi('contact', { name, venue, email, message });
}

async function getPastEvents() {
  try {
    const res = await fetch('/api/past-events');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Photo sign-in (Supabase magic link) was removed: it had no users and no events.
// These stubs keep past-events.html working without it.
async function getEventPhotos() {
  return [];
}

async function signInWithEmail() {
  return { success: false, message: 'Photo sign-in is not available.' };
}

async function getSession() {
  return null;
}

async function signOut() {}

function onAuthChange() {}
