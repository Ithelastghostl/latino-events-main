const SUPABASE_URL = 'https://iialbhtgugmkmbrhwlud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYWxiaHRndWdta21icmh3bHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDk2MzYsImV4cCI6MjA5NTQ4NTYzNn0.IYXoLMF_frAY6HtRy58v-sk8IUV1BHQxXiBtiSt1kd0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function subscribeEmail(email) {
  const { error } = await supabase
    .from('subscribers')
    .insert({ email: email.trim().toLowerCase(), source: 'website' });

  if (error) {
    if (error.code === '23505') return { success: false, message: 'You\'re already subscribed!' };
    if (error.code === '23514') return { success: false, message: 'Please enter a valid email address.' };
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
  return { success: true, message: 'Welcome to La Tribu! 🎉' };
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
