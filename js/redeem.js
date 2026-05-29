// Staff door-redemption page logic. Kept in an external file because the
// site CSP (script-src 'self') does not allow inline scripts.

const SUPABASE_URL = 'https://iialbhtgugmkmbrhwlud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYWxiaHRndWdta21icmh3bHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDk2MzYsImV4cCI6MjA5NTQ4NTYzNn0.IYXoLMF_frAY6HtRy58v-sk8IUV1BHQxXiBtiSt1kd0';
const REDEEM_URL = `${SUPABASE_URL}/functions/v1/redeem`;

// The staff secret is held only in sessionStorage: it clears when the tab
// closes, so it is not left behind on a shared device.
const SECRET_KEY = 'latribu_staff_secret';

const gate = document.getElementById('gate');
const tool = document.getElementById('tool');
const secretInput = document.getElementById('secret');
const gateError = document.getElementById('gate-error');
const codeInput = document.getElementById('code');
const result = document.getElementById('result');
const redeemBtn = document.getElementById('redeem-btn');

function getSecret() {
  return sessionStorage.getItem(SECRET_KEY) || '';
}

function showTool() {
  gate.hidden = true;
  tool.hidden = false;
  codeInput.focus();
}

function showGate(message) {
  tool.hidden = true;
  gate.hidden = false;
  gateError.textContent = message || '';
  secretInput.value = '';
  secretInput.focus();
}

// Format raw input into AAAA-AAAA-AAAA as the user types.
function formatCode(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return clean.match(/.{1,4}/g)?.join('-') ?? '';
}

function setResult(state, title, detail) {
  result.className = `result result-${state}`;
  result.innerHTML = `<p class="result-title">${title}</p>${detail ? `<p class="result-detail">${detail}</p>` : ''}`;
  result.hidden = false;
}

async function redeem() {
  const code = codeInput.value.trim().toUpperCase();
  if (!code) {
    setResult('warn', 'Enter a code', 'Type or scan the customer’s code first.');
    return;
  }

  redeemBtn.disabled = true;
  setResult('pending', 'Checking…', '');

  let res, data;
  try {
    res = await fetch(REDEEM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        'x-staff-secret': getSecret(),
      },
      body: JSON.stringify({ offer_code: code }),
    });
    data = await res.json();
  } catch (_err) {
    redeemBtn.disabled = false;
    setResult('warn', 'Connection problem', 'Check your signal and try again.');
    return;
  }

  redeemBtn.disabled = false;

  if (res.status === 401) {
    // Secret is wrong or was unset on the server. Send them back to the gate.
    sessionStorage.removeItem(SECRET_KEY);
    showGate('Staff password rejected. Enter it again.');
    return;
  }

  if (data.ok && data.status === 'redeemed') {
    setResult('ok', '✓ Valid — 2 free shots', 'Marked as used. Pour them!');
  } else if (data.status === 'already_used') {
    setResult('bad', '✕ Already used', data.message || 'This code was already redeemed.');
  } else if (data.status === 'not_found') {
    setResult('bad', '✕ Not a valid code', 'No such code. Double-check the spelling.');
  } else {
    setResult('warn', 'Could not redeem', data.message || 'Please try again.');
  }

  codeInput.value = '';
  codeInput.focus();
}

document.getElementById('gate-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const secret = secretInput.value.trim();
  if (!secret) return;
  sessionStorage.setItem(SECRET_KEY, secret);
  gateError.textContent = '';
  showTool();
});

document.getElementById('redeem-form').addEventListener('submit', (e) => {
  e.preventDefault();
  redeem();
});

codeInput.addEventListener('input', () => {
  const pos = codeInput.value.length;
  codeInput.value = formatCode(codeInput.value);
  // Keep cursor at the end (fine for a scan-and-go flow).
  codeInput.setSelectionRange(codeInput.value.length, codeInput.value.length);
  void pos;
});

document.getElementById('logout').addEventListener('click', () => {
  sessionStorage.removeItem(SECRET_KEY);
  result.hidden = true;
  codeInput.value = '';
  showGate('');
});

// On load, skip the gate if a secret is already in this session.
if (getSecret()) {
  showTool();
} else {
  showGate('');
}
