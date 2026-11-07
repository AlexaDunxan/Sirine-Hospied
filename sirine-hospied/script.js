// ---------- Helper: generic tab switcher (used by the homepage AND project pages) ----------
// Clicking tab i marks it selected and calls show(panel, isActive) for every panel.
function setupTabs(tabs, panels, show, afterSwitch) {
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      panels.forEach((panel, j) => show(panel, j === i));
      if (afterSwitch) afterSwitch();
    });
  });
}

// ---------- 1. Hero: build the copies (so we only write the content once in the HTML) ----------
const hero = document.getElementById("hero");

if (hero) {
  const stage = hero.querySelector(".hero-stage");

  // Copy the content of the "base" layer into the empty "diagonal" layer
  stage.querySelector(".hero-diagonal").innerHTML =
    stage.querySelector(".hero-base").innerHTML;

  // Make a full copy of the stage and mark it as the inverted one
  const inverted = stage.cloneNode(true);
  inverted.classList.add("hero-inverted");
  inverted.setAttribute("aria-hidden", "true");
  inverted.inert = true;
  hero.appendChild(inverted);

  // ---------- 2. The light follows the mouse ----------
  // The animation loop only runs while the light is actually moving,
  // instead of every frame forever.
  const MAX_RADIUS = 160;
  const SMOOTHNESS = 0.15;
  const EPSILON = 0.01; // px; below this the movement is invisible

  let targetX = 0, targetY = 0, targetR = 0;
  let x = 0, y = 0, r = 0;
  let running = false;

  function animate() {
    x += (targetX - x) * SMOOTHNESS;
    y += (targetY - y) * SMOOTHNESS;
    r += (targetR - r) * SMOOTHNESS;
    if (Math.abs(targetR - r) < 0.5) r = targetR;

    const settled =
      r === targetR &&
      Math.abs(targetX - x) < EPSILON &&
      Math.abs(targetY - y) < EPSILON;
    if (settled) {
      x = targetX;
      y = targetY;
    }

    inverted.style.setProperty("--x", x + "px");
    inverted.style.setProperty("--y", y + "px");
    inverted.style.setProperty("--r", r + "px");

    running = !settled;
    if (running) requestAnimationFrame(animate);
  }

  function wake() {
    if (!running) {
      running = true;
      requestAnimationFrame(animate);
    }
  }

  hero.addEventListener("pointermove", (e) => {
    const box = hero.getBoundingClientRect();
    targetX = e.clientX - box.left;
    targetY = e.clientY - box.top;
    targetR = MAX_RADIUS;
    if (r === 0) {
      x = targetX;
      y = targetY;
    }
    wake();
  });
  hero.addEventListener("pointerleave", () => {
    targetR = 0;
    wake();
  });

  animate();
}

// ---------- 3. Projects tabs (homepage) ----------
setupTabs(
  document.querySelectorAll(".proj-tab"),
  document.querySelectorAll(".proj-panel"),
  (panel, on) => panel.classList.toggle("proj-on", on),
  closeAllProjRows
);

// ---------- 4. Un-stick the preview after clicking out ----------
document.querySelectorAll(".proj-title, .pv, .proj-more").forEach((link) => {
  link.addEventListener("click", () => link.blur());
});

// ---------- 5. Email (built once, used by the contact section AND the footer) ----------
const email = "hospied.sirine" + "@" + "gmail.com";
const mailto = "mailto:" + email;

const emailLink = document.getElementById("contact-email");
if (emailLink) {
  emailLink.textContent = email;
  emailLink.href = mailto;
  const emailBtn = document.getElementById("contact-btn");
  if (emailBtn) emailBtn.href = mailto;
}

const footerEmail = document.getElementById("footer-email");
if (footerEmail) footerEmail.href = mailto;

// ---------- 6. Project-page mobile nav (hamburger toggle) ----------
const menuToggle = document.querySelector(".pp-menu-toggle");
const topnav = document.querySelector(".pp-topnav");
if (menuToggle && topnav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topnav.classList.toggle("pp-menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// ---------- 7. "Design choices" tab card on project pages ----------
setupTabs(
  document.querySelectorAll(".pp-tabcard-tab"),
  document.querySelectorAll(".pp-tabcard-panel"),
  (panel, on) => { panel.hidden = !on; }
);

// ---------- 8. Mobile project accordion ----------
const mobileQuery = window.matchMedia("(max-width: 700px)");

function closeAllProjRows() {
  document.querySelectorAll(".proj-row.is-open").forEach((row) => {
    row.classList.remove("is-open");
    row.querySelector(".proj-title")?.setAttribute("aria-expanded", "false");
  });
}

document.querySelectorAll(".proj-title").forEach((titleLink) => {
  titleLink.addEventListener("click", (e) => {
    if (!mobileQuery.matches) return;

    e.preventDefault();
    const row = titleLink.closest(".proj-row");
    const wasOpen = row.classList.contains("is-open");

    closeAllProjRows();

    if (!wasOpen) {
      row.classList.add("is-open");
      titleLink.setAttribute("aria-expanded", "true");
    }
  });
});

// ---------- 9. Image carousel (project pages) ----------
// Built for 3 slides: one centered/active, the other two parked slightly
// behind on each side (see the [data-slot="..."] rules in the CSS). The
// buttons just shift which slide is "active"; nothing moves in the DOM,
// only each slide's data-slot attribute changes.
document.querySelectorAll(".pp-carousel").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll(".pp-car-slide")];
  const n = slides.length;
  if (n < 2) return;

  let active = 0;

  function render() {
    slides.forEach((slide, i) => {
      const offset = (i - active + n) % n;
      slide.dataset.slot =
        offset === 0 ? "active" :
        offset === 1 ? "next" :
        offset === n - 1 ? "prev" : "hidden";
    });
  }

  function go(step) {
    active = (active + step + n) % n;
    render();
  }

  carousel.querySelector(".pp-car-prev")?.addEventListener("click", () => go(-1));
  carousel.querySelector(".pp-car-next")?.addEventListener("click", () => go(1));

  render();
});

// ---------- 10. Scroll hint on device mockup screens ----------
// Adds a small bouncing dot in front of every .pp-screen (laptop and phone
// previews), so people notice they can scroll the preview itself. It reuses
// the screen's own .pp-screen-laptop/.pp-screen-phone class so its box always
// matches, and disappears for good the first time that screen scrolls.
document.querySelectorAll(".pp-screen").forEach((screen) => {
  const posClass = [...screen.classList].find((c) => c !== "pp-screen");
  if (!posClass) return;

  const hint = document.createElement("div");
  hint.className = "pp-scroll-hint " + posClass;
  hint.innerHTML = '<span aria-hidden="true">&#x2304;</span>';
  screen.after(hint);

  screen.addEventListener(
    "scroll",
    () => hint.classList.add("pp-scroll-hint-gone"),
    { once: true }
  );
});
