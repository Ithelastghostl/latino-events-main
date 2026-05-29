const SUPABASE_URL = 'https://iialbhtgugmkmbrhwlud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYWxiaHRndWdta21icmh3bHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDk2MzYsImV4cCI6MjA5NTQ4NTYzNn0.IYXoLMF_frAY6HtRy58v-sk8IUV1BHQxXiBtiSt1kd0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

async function callFunction(name, payload) {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function subscribeEmail(email) {
  // Server generates the unique offer code and sends the welcome email.
  return callFunction('subscribe', { email: email.trim().toLowerCase() });
}

async function sendContactMessage({ name, venue, email, message }) {
  return callFunction('contact', { name, venue, email, message });
}

async function getPastEvents() {
  const { data, error } = await supabase
    .from('past_events')
    .select('*')
    .order('date', { ascending: false });

  if (error) return [];
  return data;
}

async function getEventPhotos(eventId) {
  const { data, error } = await supabase
    .from('past_event_photos')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data;
}

async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
  if (error) return { success: false, message: 'Could not send login link. Please try again.' };
  return { success: true, message: 'Check your email for a login link!' };
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function signOut() {
  await supabase.auth.signOut();
}

function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => callback(session));
}
