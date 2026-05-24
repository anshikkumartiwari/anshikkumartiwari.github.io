/**
 * ==========================================================================
 * PORTFOLIO SCRIPT
 * Anshik Kumar Tiwari — Personal Portfolio
 *
 * Scroll model:
 *  • Page-level snapping is done by native CSS scroll-snap on <html>.
 *  • .section-body panels have overscroll-behavior:none by default (absorbed).
 *  • When a panel reaches its bottom boundary AND the current wheel/touch
 *    gesture has fully settled, we flip overscroll-behavior to 'auto' and
 *    show the edge hint.  The NEXT deliberate gesture then chains naturally
 *    to the parent <html>, which the CSS snap handles.
 *  • On reaching the top boundary we also open chaining (to snap to the
 *    previous section) but don't show a hint — the user just scrolls up.
 *  • On mobile the same logic applies; touchend marks gesture completion.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initDropdown();
  initNavObserver();
  initSectionBodies();
  initScrollIndicator();
});

/* ==========================================================================
   THEME
   ========================================================================== */
function initTheme() {
  const buttons = document.querySelectorAll(".theme-btn");
  const apply = (t) => {
    t === "system"
      ? document.documentElement.removeAttribute("data-theme")
      : document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    buttons.forEach((b) => {
      const active = b.dataset.theme === t;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  };
  apply(localStorage.getItem("theme") || "system");
  buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.theme)));
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ((localStorage.getItem("theme") || "system") === "system") apply("system");
  });
}

/* ==========================================================================
   DROPDOWN
   ========================================================================== */
function initDropdown() {
  const dd      = document.querySelector(".dropdown");
  const trigger = document.querySelector(".dropdown-trigger");
  if (!dd || !trigger) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = dd.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click",   () => dd.classList.remove("open"));
  document.addEventListener("keydown",  (e) => e.key === "Escape" && dd.classList.remove("open"));

  // Clicking a section item → native smooth scroll (CSS handles snap)
  dd.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      dd.classList.remove("open");
      const target = document.getElementById(item.getAttribute("href").slice(1));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ==========================================================================
   NAV OBSERVER — keeps dropdown label in sync with active section
   ========================================================================== */
function initNavObserver() {
  const label = document.getElementById("active-section-name");
  const items = document.querySelectorAll(".dropdown-item");

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        items.forEach((item) => {
          const match = item.getAttribute("href").slice(1) === id;
          item.classList.toggle("active", match);
          item.setAttribute("aria-selected", String(match));
          if (match && label) label.textContent = item.textContent.trim();
        });
      });
    },
    // Centre-biased root margin so only the dominant section triggers
    { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
  );

  document.querySelectorAll("section").forEach((s) => obs.observe(s));
}

/* ==========================================================================
   SCROLL INDICATOR (hero ↓ button)
   ========================================================================== */
function initScrollIndicator() {
  const btn  = document.querySelector(".scroll-indicator");
  const next = document.getElementById("experience");
  if (btn && next) btn.addEventListener("click", () => next.scrollIntoView({ behavior: "smooth" }));
}

/* ==========================================================================
   SECTION BODIES — two-phase scroll ownership
   ========================================================================== */
function initSectionBodies() {
  document.querySelectorAll(".section-body").forEach((body) => {
    const hint       = body.closest("section").querySelector(".section-edge-hint");
    const SETTLE_MS  = 180;   // ms of quiet before a gesture is "done"

    let gestureActive = false;
    let settleTimer   = null;

    /* ── helpers ─────────────────────────────────────────── */
    function atBottom() {
      return body.scrollTop + body.clientHeight >= body.scrollHeight - 3;
    }
    function atTop() {
      return body.scrollTop <= 2;
    }
    function hasOverflow() {
      return body.scrollHeight > body.clientHeight + 6;
    }

    /**
     * Recompute overscroll-behavior and hint visibility.
     * Called after gesture settles OR after every scroll tick.
     */
    function sync(fromGestureSettle = false) {
      if (!hasOverflow()) {
        // Panel content fits — always let parent snap
        body.style.overscrollBehavior = "auto";
        hideHint();
        return;
      }

      if (atBottom()) {
        showHint();
        if (fromGestureSettle) {
          // Gesture is done AND we're at bottom → open the gate for the next swipe
          body.style.overscrollBehavior = "auto";
        } else {
          // Gesture still live → absorb momentum, keep gate shut
          body.style.overscrollBehavior = "none";
        }
      } else if (atTop()) {
        hideHint();
        if (fromGestureSettle) {
          // Top boundary after gesture → open upward chaining for prev section
          body.style.overscrollBehavior = "auto";
        } else {
          body.style.overscrollBehavior = "none";
        }
      } else {
        // Middle of content — always contain
        hideHint();
        body.style.overscrollBehavior = "none";
      }
    }

    function showHint() { if (hint) hint.classList.add("visible"); }
    function hideHint() { if (hint) hint.classList.remove("visible"); }

    function onGestureStart() {
      gestureActive = true;
      // While the gesture is live, always contain — prevents any leakage
      body.style.overscrollBehavior = "none";
      clearTimeout(settleTimer);
    }

    function onGestureActivity() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        gestureActive = false;
        // Gesture has settled — re-evaluate with gate-open logic
        sync(true);
      }, SETTLE_MS);
    }

    /* ── scroll event (fired while panel is moving) ──────── */
    body.addEventListener("scroll", () => sync(false), { passive: true });

    /* ── wheel events ────────────────────────────────────── */
    body.addEventListener("wheel", (e) => {
      onGestureStart();
      onGestureActivity();
      // Update hint visibility in real-time even while gate is shut
      requestAnimationFrame(() => {
        if (atBottom()) showHint();
        else if (!atTop()) hideHint();
      });
    }, { passive: true });

    /* ── touch events ────────────────────────────────────── */
    body.addEventListener("touchstart", () => {
      onGestureStart();
    }, { passive: true });

    body.addEventListener("touchmove", () => {
      onGestureActivity();
      requestAnimationFrame(() => {
        if (atBottom()) showHint();
        else if (!atTop()) hideHint();
      });
    }, { passive: true });

    body.addEventListener("touchend", () => {
      // Treat touchend itself as gesture completion after a short delay
      // (allow momentum scroll events to finish first)
      setTimeout(() => {
        gestureActive = false;
        sync(true);
      }, SETTLE_MS + 80);
    }, { passive: true });

    /* ── initial state ───────────────────────────────────── */
    // On first load the panel is at top with content below → contain
    body.style.overscrollBehavior = "none";
    // After a paint, check if content fits at all
    requestAnimationFrame(() => sync(false));
  });
}
