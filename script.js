/**
 * Portfolio script — Anshik Kumar Tiwari
 * Theme switching, dropdown, active nav highlight via IntersectionObserver.
 * No scroll manipulation. The browser handles scrolling.
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initDropdown();
  initNavHighlight();
});

/* ==========================================================================
   THEME
   ========================================================================== */
function initTheme() {
  const btns = document.querySelectorAll(".theme-btn");

  function apply(t) {
    t === "system"
      ? document.documentElement.removeAttribute("data-theme")
      : document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    btns.forEach(b => {
      const on = b.dataset.theme === t;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  apply(localStorage.getItem("theme") || "system");
  btns.forEach(b => b.addEventListener("click", () => apply(b.dataset.theme)));

  window.matchMedia("(prefers-color-scheme:dark)").addEventListener("change", () => {
    if ((localStorage.getItem("theme") || "system") === "system") apply("system");
  });
}

/* ==========================================================================
   DROPDOWN
   ========================================================================== */
function initDropdown() {
  const dd      = document.getElementById("section-dd");
  const trigger = dd.querySelector(".dd-trigger");
  const items   = dd.querySelectorAll(".dd-item");

  // Open / close
  trigger.addEventListener("click", e => {
    e.stopPropagation();
    const open = dd.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click",   ()  => dd.classList.remove("open"));
  document.addEventListener("keydown",  e  => e.key === "Escape" && dd.classList.remove("open"));

  // Smooth-scroll to section on item click
  items.forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      dd.classList.remove("open");
      const target = document.querySelector(item.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ==========================================================================
   ACTIVE NAV HIGHLIGHT — IntersectionObserver keeps dropdown label in sync
   ========================================================================== */
function initNavHighlight() {
  const label = document.getElementById("dd-label");
  const items = document.querySelectorAll(".dd-item");

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      items.forEach(item => {
        const match = item.getAttribute("href") === `#${id}`;
        item.classList.toggle("active", match);
        if (match && label) label.textContent = item.textContent.trim();
      });
    });
  }, {
    // Fire when a section occupies the centre band of the viewport
    rootMargin: "-35% 0px -55% 0px",
    threshold: 0,
  });

  document.querySelectorAll("section[id]").forEach(s => obs.observe(s));
}
