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
    } catch (_error) {
      status.textContent = "Something went wrong. Please try again.";
      status.classList.add("error");
      showToast(false, "Something went wrong. Please try again.");
    }
  });
});

const venueForm = document.getElementById("venue-contact-form");
const venueStatus = document.getElementById("venue-form-status");
venueForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  venueStatus.className = "form-status";
  venueStatus.textContent = "Sending...";
  const data = new FormData(venueForm);
  try {
    const result = await sendContactMessage({
      name: data.get("name"),
      venue: data.get("venue"),
      email: data.get("email"),
      message: data.get("message"),
    });
    venueStatus.textContent = result.message;
    venueStatus.classList.add(result.success ? "success" : "error");
    if (result.success) { venueForm.reset(); showToast(true, result.message); }
    else { showToast(false, result.message); }
  } catch (_error) {
    venueStatus.textContent = "Something went wrong. Please try again.";
    venueStatus.classList.add("error");
    showToast(false, "Something went wrong. Please try again.");
  }
});
