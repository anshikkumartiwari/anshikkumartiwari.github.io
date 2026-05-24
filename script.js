/**
 * ==========================================================================
 * PORTFOLIO SCROLL CONTROLLER — v2 (Phase-Separated Intent Model)
 * Anshik Kumar Tiwari — Personal Portfolio
 *
 * Scroll Ownership Model:
 *  Phase 1 (Internal): Scroll input is fully owned by .scrollable-content.
 *                      No momentum leaks to parent. Boundary is consumed silently.
 *  Phase 2 (Section):  Only triggered by a brand-new gesture AFTER the region
 *                      was already exhausted and the previous gesture fully settled.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initThemeSwitcher();
  initDropdownNavigation();
  initScrollController();
  initMobileObserver();
});

/* ==========================================================================
   THEME SWITCHER
   ========================================================================== */
function initThemeSwitcher() {
  const themeButtons = document.querySelectorAll(".theme-btn");
  if (!themeButtons.length) return;

  const savedTheme = localStorage.getItem("theme-preference") || "system";
  applyTheme(savedTheme);

  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.getAttribute("data-theme")));
  });

  function applyTheme(theme) {
    const htmlEl = document.documentElement;
    theme === "system"
      ? htmlEl.removeAttribute("data-theme")
      : htmlEl.setAttribute("data-theme", theme);
    localStorage.setItem("theme-preference", theme);

    themeButtons.forEach((btn) => {
      const isActive = btn.getAttribute("data-theme") === theme;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if ((localStorage.getItem("theme-preference") || "system") === "system") {
        applyTheme("system");
      }
    });
}

/* ==========================================================================
   DROPDOWN
   ========================================================================== */
function initDropdownNavigation() {
  const dropdown = document.querySelector(".dropdown");
  const trigger  = document.querySelector(".dropdown-trigger");
  if (!dropdown || !trigger) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    trigger.setAttribute("aria-expanded", dropdown.classList.contains("open"));
  });

  document.addEventListener("click",   () => dropdown.classList.remove("open"));
  document.addEventListener("keydown",  (e) => {
    if (e.key === "Escape") dropdown.classList.remove("open");
  });
}

/* ==========================================================================
   HELPERS
   ========================================================================== */
const isMobile = () => window.innerWidth <= 768;

/**
 * Update the navbar dropdown label and highlighted item.
 */
function syncNavState(sectionId) {
  const triggerLabel = document.getElementById("active-section-name");
  document.querySelectorAll(".dropdown-item").forEach((item) => {
    const match = item.getAttribute("href").replace("#", "") === sectionId;
    item.classList.toggle("active", match);
    item.setAttribute("aria-selected", String(match));
    if (match && triggerLabel) triggerLabel.textContent = item.textContent.trim();
  });
}

/* ==========================================================================
   SCROLL BOUNDARY CUE — builds and manages indicator DOM per section
   ========================================================================== */
function buildBoundaryCue(section) {
  const cue = document.createElement("div");
  cue.className = "scroll-boundary-cue";
  cue.setAttribute("aria-hidden", "true");
  cue.innerHTML = `
    <span class="scroll-boundary-cue-label">scroll again</span>
    <svg class="scroll-boundary-cue-arrow" viewBox="0 0 24 24">
      <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>
    </svg>`;
  section.appendChild(cue);
  return cue;
}

function showCue(cue, atTop = false) {
  if (!cue) return;
  cue.classList.toggle("at-top", atTop);
  cue.classList.add("visible");
}

function hideCue(cue) {
  if (!cue) return;
  cue.classList.remove("visible");
}

/* ==========================================================================
   MAIN SCROLL CONTROLLER (Desktop / Large Tablet)
   ========================================================================== */
function initScrollController() {
  const container = document.getElementById("main-scroll-container");
  const sections  = Array.from(document.querySelectorAll("section"));
  const total     = sections.length;
  if (!container || !total) return;

  /* ── State ─────────────────────────────────────────── */
  let currentIndex   = 0;
  let isAnimating    = false;   // true while CSS transition plays (~650ms)
  let gestureSettled = true;    // false while user is actively scrolling/swiping
  let settleTimer    = null;    // debounce timer — fires when gesture stops

  // Per-section boundary state: were we at bottom/top when last gesture ended?
  const boundaryState = sections.map(() => ({ atBottom: false, atTop: false }));

  // Per-section boundary cue DOM elements
  const cues = sections.map((sec) => {
    const scrollable = sec.querySelector(".scrollable-content");
    return scrollable ? buildBoundaryCue(sec) : null;
  });

  /* ── Gesture settle debounce ────────────────────────
   *  After the user stops producing wheel/touch events for SETTLE_MS,
   *  we mark the gesture as fully complete and record the boundary state.
   *  The next gesture is only allowed to transition if ALREADY at boundary.
   */
  const SETTLE_MS   = 220;  // Time after last event before a "new gesture" is possible
  const ANIMATE_MS  = 700;  // Matches --transition-slow in CSS (+buffer)

  function onGestureActivity() {
    gestureSettled = false;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      gestureSettled = true;
      // Sample boundary position for the current section NOW (after momentum dies)
      updateBoundaryState(currentIndex);
    }, SETTLE_MS);
  }

  function updateBoundaryState(idx) {
    const sec        = sections[idx];
    const scrollable = sec ? sec.querySelector(".scrollable-content") : null;
    if (!scrollable) {
      // Sections without a scrollable region are always "exhausted"
      boundaryState[idx].atBottom = true;
      boundaryState[idx].atTop    = true;
      return;
    }
    const st = scrollable.scrollTop;
    const sh = scrollable.scrollHeight;
    const ch = scrollable.clientHeight;

    const atBottom = st + ch >= sh - 2;
    const atTop    = st <= 1;

    boundaryState[idx].atBottom = atBottom;
    boundaryState[idx].atTop    = atTop;

    // Show or hide the subtle boundary cue
    if (atBottom && !atTop) {
      // content is scrolled to end — "scroll again ↓" cue
      showCue(cues[idx], false);
    } else if (atTop && !atBottom && st > 0) {
      showCue(cues[idx], true);
    } else {
      hideCue(cues[idx]);
    }
  }

  /* ── Section transition ─────────────────────────────── */
  function goToSection(idx) {
    if (idx < 0 || idx >= total || isAnimating) return;

    // Hide the departing cue
    hideCue(cues[currentIndex]);

    isAnimating  = currentIndex !== idx;
    currentIndex = idx;
    container.style.transform = `translateY(-${idx * 100}vh)`;

    sections.forEach((sec, i) => {
      const active = i === idx;
      sec.classList.toggle("active-in-view", active);
      sec.classList.toggle("active-section",  active);
    });
    syncNavState(sections[idx].id);

    // After animation completes, sample the new section's initial boundary state
    setTimeout(() => {
      isAnimating = false;
      updateBoundaryState(idx);
    }, ANIMATE_MS);
  }

  /* ── Wheel handler ──────────────────────────────────── */
  function handleWheel(e) {
    if (isMobile()) return;

    onGestureActivity();

    // Block all input while a section animation is in flight
    if (isAnimating) {
      e.preventDefault();
      return;
    }

    const dir        = e.deltaY > 0 ? 1 : -1;
    const scrollable = e.target.closest(".scrollable-content");

    if (scrollable) {
      // ── Phase 1: We are inside a scrollable region ────
      //
      // Gate: can we hand off to section nav?
      // Only if: gestureSettled (previous gesture finished) AND boundary is exhausted.
      //
      const state    = boundaryState[currentIndex];
      const atBoundary = dir === 1 ? state.atBottom : state.atTop;

      if (atBoundary && gestureSettled) {
        // ── Phase 2: This is a new, deliberate gesture after exhaustion ──
        e.preventDefault();
        goToSection(currentIndex + dir);
      } else {
        // ── Still in Phase 1: let the inner region scroll ──
        // Do NOT call preventDefault() so the browser naturally scrolls it.
        // But if we are at the boundary and the gesture is still live (momentum),
        // consume the delta — clamp scrollTop manually so no leakage occurs.
        if (atBoundary) {
          e.preventDefault(); // Absorb remaining momentum — do NOT transition
        }
        // Otherwise let default scroll bubble to the scrollable element.
        // Update boundary state on each tick so we track it in real time.
        requestAnimationFrame(() => updateBoundaryState(currentIndex));
      }
    } else {
      // ── Outside any scrollable region — immediate section snap ──
      e.preventDefault();
      const state      = boundaryState[currentIndex];
      const canNavigate =
        dir === 1 ? state.atBottom : state.atTop;

      // Sections with no scrollable content always allow navigation
      const hasScrollable = !!sections[currentIndex].querySelector(".scrollable-content");

      if (!hasScrollable || (canNavigate && gestureSettled)) {
        goToSection(currentIndex + dir);
      }
    }
  }

  /* ── Touch handlers ─────────────────────────────────── */
  let touchStartY   = 0;
  let touchConsumed = false; // Has this touch gesture already triggered a section transition?

  function handleTouchStart(e) {
    if (isMobile()) return;
    touchStartY   = e.touches[0].clientY;
    touchConsumed = false;
  }

  function handleTouchMove(e) {
    if (isMobile()) return;

    onGestureActivity();

    if (isAnimating || touchConsumed) {
      e.preventDefault();
      return;
    }

    const deltaY     = touchStartY - e.touches[0].clientY;
    const absDelta   = Math.abs(deltaY);
    if (absDelta < 35) return; // Noise threshold

    const dir        = deltaY > 0 ? 1 : -1;
    const scrollable = e.target.closest(".scrollable-content");

    if (scrollable) {
      const st       = scrollable.scrollTop;
      const sh       = scrollable.scrollHeight;
      const ch       = scrollable.clientHeight;
      const atBottom = st + ch >= sh - 2;
      const atTop    = st <= 1;
      const atBoundary = dir === 1 ? atBottom : atTop;

      if (atBoundary && gestureSettled) {
        e.preventDefault();
        touchConsumed = true;
        goToSection(currentIndex + dir);
      } else if (atBoundary) {
        e.preventDefault(); // Absorb momentum, do not transition
      }
    } else {
      e.preventDefault();
      const state    = boundaryState[currentIndex];
      const hasScrollable = !!sections[currentIndex].querySelector(".scrollable-content");
      const canNav   = !hasScrollable || (dir === 1 ? state.atBottom : state.atTop);

      if (canNav && gestureSettled) {
        touchConsumed = true;
        goToSection(currentIndex + dir);
      }
    }
  }

  /* ── Dropdown nav clicks ────────────────────────────── */
  document.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const id  = item.getAttribute("href").substring(1);
      const idx = sections.findIndex((s) => s.id === id);
      if (idx !== -1) goToSection(idx);
    });
  });

  /* ── Scroll-down indicator on hero ─────────────────── */
  const indicator = document.querySelector(".scroll-indicator");
  if (indicator) indicator.addEventListener("click", () => goToSection(1));

  /* ── Internal scrollable regions: update boundary state on every scroll ── */
  document.querySelectorAll(".scrollable-content").forEach((el) => {
    el.addEventListener("scroll", () => {
      // Find which section this belongs to
      const sec = el.closest("section");
      const idx = sections.indexOf(sec);
      if (idx === currentIndex) updateBoundaryState(idx);
    }, { passive: true });
  });

  /* ── Bind events ────────────────────────────────────── */
  window.addEventListener("wheel",      handleWheel,       { passive: false });
  window.addEventListener("touchstart", handleTouchStart,  { passive: true  });
  window.addEventListener("touchmove",  handleTouchMove,   { passive: false });

  /* ── Resize: recalculate position ───────────────────── */
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      container.style.transform = `translateY(-${currentIndex * 100}vh)`;
    } else {
      container.style.transform = "none";
    }
  });

  /* ── Boot ───────────────────────────────────────────── */
  goToSection(0);
  // Initialize boundary state for section 0 after first paint
  requestAnimationFrame(() => updateBoundaryState(0));
}

/* ==========================================================================
   MOBILE: passive IntersectionObserver for navbar sync during native scroll
   ========================================================================== */
function initMobileObserver() {
  const sections = document.querySelectorAll("section");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!isMobile()) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active-in-view");
          syncNavState(entry.target.id);
        }
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach((sec) => observer.observe(sec));
}
