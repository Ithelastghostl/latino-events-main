// Capture image errors, including images rendered later in the event gallery.
function hideFailedImage(event) {
  if (event.target instanceof HTMLImageElement && event.target.hasAttribute("data-hide-on-error")) {
    event.target.hidden = true;
  }
}
document.addEventListener("error", hideFailedImage, true);
document.querySelectorAll("img[data-hide-on-error]").forEach((image) => {
  if (image.complete && image.naturalWidth === 0) hideFailedImage({ target: image });
});

function showToast(success, message) {
  const toast = document.getElementById("signup-toast");
  document.getElementById("toast-icon").textContent = success ? "🎉" : "⚠️";
  document.getElementById("toast-title").textContent = success ? "You're In!" : "Oops";
  document.getElementById("toast-message").textContent = message;
  toast.className = success ? "toast visible" : "toast visible toast-error";
}

function closeToast() {
  document.getElementById("signup-toast").classList.remove("visible");
}

document.querySelector(".toast-close").addEventListener("click", closeToast);

document.getElementById("signup-toast").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeToast();
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
navLinks.forEach((link) => link.addEventListener("click", () => {
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
}));

document.querySelectorAll("[data-signup-form]").forEach((form) => {
  const status = form.querySelector("[data-signup-status]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.className = "form-status";
    status.textContent = "Joining...";
    const email = new FormData(form).get("email");
    try {
      const result = await subscribeEmail(email);
      status.textContent = result.message;
      status.classList.add(result.success ? "success" : "error");
      if (result.success) { form.reset(); showToast(true, result.message); }
      else { showToast(false, result.message); }
    } catch (error) {
      status.textContent = "Something went wrong. Please try again.";
      status.classList.add("error");
      showToast(false, "Something went wrong. Please try again.");
    }
  });
});

const eventsRoot = document.getElementById("events-root");
const signOutButton = document.getElementById("sign-out-button");
let pastEvents = [];
let currentSession = null;
let photoCache = {};
let visibleSignInEvent = null;
let busyEvent = null;

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function formatDate(value) {
  if (!value) return "Date coming soon";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function renderPhotos(eventId) {
  if (busyEvent === eventId) return '<div class="loading-state">Loading photos...</div>';
  const photos = photoCache[eventId];
  if (!photos) return "";
  if (!photos.length) return '<div class="empty-state">No photos are live yet. Check back after the next upload.</div>';
  return `
    <div class="photo-grid">
      ${photos.map((photo) => `
        <figure class="photo-card">
          <div class="image-frame ratio-wide">
            <img src="${escapeHtml(photo.image_url)}" alt="${escapeHtml(photo.caption || "La Tribu event photo")}" data-hide-on-error>
          </div>
          <figcaption>${escapeHtml(photo.caption || "La Tribu moment")}</figcaption>
        </figure>
      `).join("")}
    </div>
  `;
}

function renderAuthAction(event) {
  const eventId = String(event.id);
  if (currentSession) {
    return `
      <button class="primary-cta" type="button" data-load-photos="${escapeHtml(eventId)}">
        ${photoCache[eventId] ? "Refresh Photos" : "View Photos"}
      </button>
      ${renderPhotos(eventId)}
    `;
  }

  // Photo sign-in (Supabase magic link) was removed in the Cloudflare move: no users, no events.
  return "";
}

function renderEvents() {
  signOutButton.hidden = !currentSession;
  if (!pastEvents.length) {
    eventsRoot.innerHTML = '<div class="empty-state">No recaps are live yet. Join the list and be first in when the next gallery drops.</div>';
    return;
  }

  eventsRoot.innerHTML = pastEvents.map((event) => `
    <article class="card past-event-card">
      <div class="image-frame">
        <img src="${escapeHtml(event.cover_image_url || "images/gallery-1.webp")}" alt="${escapeHtml(event.title || "La Tribu past event")}" data-hide-on-error>
      </div>
      <div class="card-content">
        <div class="past-event-meta">
          <span>${formatDate(event.date)}</span>
          <span>${escapeHtml(event.venue || "London")}</span>
        </div>
        <h3>${escapeHtml(event.title || "La Tribu Night")}</h3>
        <p>${escapeHtml(event.description || "You were there. Next one's even bigger.")}</p>
        ${renderAuthAction(event)}
      </div>
    </article>
  `).join("");
}

async function loadEvents() {
  eventsRoot.innerHTML = '<div class="loading-state">Loading past events...</div>';
  try {
    pastEvents = await getPastEvents();
    renderEvents();
  } catch (error) {
    eventsRoot.innerHTML = '<div class="error-state">We could not load past events right now. Please try again soon.</div>';
  }
}

async function refreshSession() {
  try {
    currentSession = await getSession();
    renderEvents();
  } catch (error) {
    currentSession = null;
    renderEvents();
  }
}

eventsRoot.addEventListener("click", async (event) => {
  const signInButton = event.target.closest("[data-show-signin]");
  const photosButton = event.target.closest("[data-load-photos]");

  if (signInButton) {
    visibleSignInEvent = signInButton.dataset.showSignin;
    renderEvents();
    return;
  }

  if (photosButton) {
    const eventId = photosButton.dataset.loadPhotos;
    busyEvent = eventId;
    renderEvents();
    try {
      photoCache[eventId] = await getEventPhotos(eventId);
    } catch (error) {
      photoCache[eventId] = [];
    } finally {
      busyEvent = null;
      renderEvents();
    }
  }
});

eventsRoot.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-photo-signin]");
  if (!form) return;
  event.preventDefault();
  const status = form.querySelector("[data-auth-status]");
  const email = new FormData(form).get("email");
  status.className = "form-status";
  status.textContent = "Sending...";
  try {
    const result = await signInWithEmail(email);
    status.textContent = result.success ? "Check your email for a magic link" : result.message;
    status.classList.add(result.success ? "success" : "error");
    if (result.success) form.reset();
  } catch (error) {
    status.textContent = "Could not send login link. Please try again.";
    status.classList.add("error");
  }
});

signOutButton.addEventListener("click", async () => {
  await signOut();
  currentSession = null;
  photoCache = {};
  renderEvents();
});

onAuthChange((session) => {
  currentSession = session;
  visibleSignInEvent = null;
  renderEvents();
});

loadEvents().then(refreshSession);
