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
