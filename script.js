/**
 * ==========================================================================
 * PORTFOLIO SCROLL CONTROLLER
 * Anshik Kumar Tiwari — anshikkumartiwari.github.io
 *
 * Desktop scroll model (> 768 px):
 * ─────────────────────────────────────────────────────────────────────────
 * The page is locked (overflow:hidden on html/body). All section navigation
 * is done by sliding #scroll-track with transform:translateY(-N*100vh).
 * The CSS transition on that element provides the smooth animation.
 *
 * Internal .section-body panels scroll normally inside their sections.
 * Section navigation is gated — it can only fire on the FIRST wheel/swipe
 * event of a new gesture, not during ongoing momentum. This prevents
 * accidental skips when a user scrolls quickly through inner content.
 *
 * Gate logic:
 *   1. On each wheel/touchmove, mark the gesture as "live" and restart
 *      a 180 ms settle timer.
 *   2. When the timer fires (180 ms of silence), record the current
 *      boundary state of the active section-body (atTop / atBottom).
 *   3. The next incoming event checks this STORED boundary state.
 *      If stored-boundary matches scroll direction → navigate.
 *      If not → let inner content scroll.
 *      Either way, mark gesture live again and block re-entry until it
 *      settles again.
 *
 * Mobile (≤ 768 px):
 * ─────────────────────────────────────────────────────────────────────────
 * JS transform is disabled (CSS overrides it with !important).
 * The browser uses native CSS scroll-snap on html/body, which is silky
 * smooth on iOS/Android. JS only manages the nav label via
 * IntersectionObserver.
 * ==========================================================================
 */

/* ==========================================================================
   BOOT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initDropdown();
  if (!isMobile()) {
    initDesktopScroll();
  } else {
    initMobileObserver();
  }
  window.addEventListener("resize", debounce(onResize, 200));
});

/* ==========================================================================
   UTILITIES
   ========================================================================== */
function isMobile() { return window.innerWidth <= 768; }

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

/* ==========================================================================
   THEME
   ========================================================================== */
function initTheme() {
  const btns  = document.querySelectorAll(".theme-btn");
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
  const dd      = document.querySelector(".dropdown");
  const trigger = document.querySelector(".dropdown-trigger");
  if (!dd || !trigger) return;

  trigger.addEventListener("click", e => {
    e.stopPropagation();
    const open = dd.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click",   ()  => dd.classList.remove("open"));
  document.addEventListener("keydown",  e  => e.key === "Escape" && dd.classList.remove("open"));
}

/* Sync nav label + active item */
function syncNav(sectionId) {
  const label = document.getElementById("active-section-name");
  document.querySelectorAll(".dropdown-item").forEach(item => {
    const match = item.getAttribute("href").slice(1) === sectionId;
    item.classList.toggle("active", match);
    item.setAttribute("aria-selected", String(match));
    if (match && label) label.textContent = item.textContent.trim();
  });
}

/* ==========================================================================
   DESKTOP SCROLL CONTROLLER
   ========================================================================== */
function initDesktopScroll() {
  const track    = document.getElementById("scroll-track");
  const sections = Array.from(document.querySelectorAll("section"));
  if (!track || !sections.length) return;

  const TOTAL       = sections.length;
  const ANIM_MS     = 700;   // must match CSS --snap-duration
  const SETTLE_MS   = 180;   // ms quiet before gesture is "done"

  let idx         = 0;       // current section index
  let animating   = false;   // true while CSS transition plays
  let gestLive    = false;   // true while wheel/touch events are arriving

  // Boundary state sampled AFTER the gesture settles.
  // This is what the NEXT gesture reads to decide whether to navigate.
  let stored = { atBottom: false, atTop: true };

  let settleTimer = null;

  /* ── Section bodies & hints ─────────────────────────────────── */
  const bodies = sections.map(s => s.querySelector(".section-body"));
  const hints  = sections.map(s => s.querySelector(".section-edge-hint"));

  /* ── Navigate to a section ──────────────────────────────────── */
  function goTo(i) {
    i = clamp(i, 0, TOTAL - 1);
    if (i === idx || animating) return;

    // Hide hint on departing section
    if (hints[idx]) hints[idx].classList.remove("visible");

    idx       = i;
    animating = true;
    track.style.transform = `translateY(-${idx * 100}vh)`;
    syncNav(sections[idx].id);

    // Reset the body we just landed on to top (for fresh state)
    if (bodies[idx]) bodies[idx].scrollTop = 0;

    setTimeout(() => {
      animating = false;
      // After landing, sample boundary for the new section
      sampleAndStore();
    }, ANIM_MS);
  }

  /* ── Dropdown nav clicks ─────────────────────────────────────── */
  document.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      document.querySelector(".dropdown").classList.remove("open");
      const id = item.getAttribute("href").slice(1);
      const i  = sections.findIndex(s => s.id === id);
      if (i !== -1) goTo(i);
    });
  });

  /* ── Hero scroll indicator ───────────────────────────────────── */
  const ind = document.querySelector(".scroll-indicator");
  if (ind) ind.addEventListener("click", () => goTo(1));

  /* ── Boundary helpers ────────────────────────────────────────── */
  function getBody() { return bodies[idx]; }

  function readBoundary(body) {
    if (!body || body.scrollHeight <= body.clientHeight + 4) {
      return { atBottom: true, atTop: true }; // no overflow → always passthrough
    }
    return {
      atBottom: body.scrollTop + body.clientHeight >= body.scrollHeight - 3,
      atTop:    body.scrollTop <= 2,
    };
  }

  function sampleAndStore() {
    stored = readBoundary(getBody());
    updateHint();
  }

  function updateHint() {
    const hint = hints[idx];
    if (!hint) return;
    // Show hint when at bottom (but NOT when there's no overflow)
    const body = getBody();
    if (body && body.scrollHeight > body.clientHeight + 4 && stored.atBottom) {
      hint.classList.add("visible");
    } else {
      hint.classList.remove("visible");
    }
  }

  /* ── Gesture lifecycle ───────────────────────────────────────── */
  function gestureStart() {
    gestLive = true;
    clearTimeout(settleTimer);
  }

  function gestureActivity() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      gestLive = false;
      sampleAndStore();
    }, SETTLE_MS);
  }

  /* ── Core navigation decision ────────────────────────────────── */
  /**
   * dir: +1 = forward (scroll down), -1 = backward (scroll up)
   * Returns true if section navigation was triggered.
   */
  function tryNavigate(dir) {
    if (animating) return true;  // always block during animation

    const body     = getBody();
    const hasScroll = body && body.scrollHeight > body.clientHeight + 4;

    if (!hasScroll) {
      // No inner content → navigate immediately (landing, thanks)
      if (!gestLive) { goTo(idx + dir); return true; }
      return false;
    }

    // Check stored boundary in scroll direction
    const boundaryHit = dir === 1 ? stored.atBottom : stored.atTop;

    if (boundaryHit && !gestLive) {
      // ── Phase 2: new gesture, boundary was exhausted → navigate ──
      goTo(idx + dir);
      return true;
    }

    return false; // let inner content scroll
  }

  /* ── WHEEL ────────────────────────────────────────────────────── */
  window.addEventListener("wheel", e => {
    if (isMobile()) return;

    const dir      = e.deltaY > 0 ? 1 : -1;
    const inBody   = !!e.target.closest(".section-body");
    const prevLive = gestLive;

    gestureStart();
    gestureActivity();

    if (animating) { e.preventDefault(); return; }

    if (inBody) {
      const live      = readBoundary(getBody());
      const atEdge    = dir === 1 ? live.atBottom : live.atTop;

      if (atEdge) {
        // Real-time: show hint as soon as user hits bottom
        updateHintLive(live);

        if (!prevLive && stored.atBottom && dir === 1) {
          // First event of a new gesture and boundary was already stored as exhausted
          e.preventDefault();
          goTo(idx + 1);
        } else if (!prevLive && stored.atTop && dir === -1) {
          e.preventDefault();
          goTo(idx - 1);
        } else {
          // Same gesture still running — absorb, do not navigate
          e.preventDefault();
        }
      }
      // Not at edge → let browser scroll inner content naturally (no preventDefault)
      else {
        // Scrolling away from boundary → hide hint
        if (hints[idx]) hints[idx].classList.remove("visible");
      }
    } else {
      // Outside any section-body (hero, thanks) → navigate
      e.preventDefault();
      if (!prevLive) goTo(idx + dir);
    }
  }, { passive: false });

  function updateHintLive(live) {
    const hint = hints[idx];
    if (!hint) return;
    const body = getBody();
    if (body && body.scrollHeight > body.clientHeight + 4 && live.atBottom) {
      hint.classList.add("visible");
    }
  }

  /* ── TOUCH (desktop tablets) ──────────────────────────────────── */
  let touchY0    = 0;
  let touchUsed  = false;

  window.addEventListener("touchstart", e => {
    if (isMobile()) return;
    touchY0   = e.touches[0].clientY;
    touchUsed = false;
    gestureStart();
  }, { passive: true });

  window.addEventListener("touchmove", e => {
    if (isMobile()) return;

    const dy      = touchY0 - e.touches[0].clientY;
    const dir     = dy > 0 ? 1 : -1;
    const absDy   = Math.abs(dy);
    if (absDy < 12) return;

    const inBody  = !!e.target.closest(".section-body");
    const prevLive = gestLive;

    gestureStart();
    gestureActivity();

    if (animating || touchUsed) { e.preventDefault(); return; }

    if (inBody) {
      const live   = readBoundary(getBody());
      const atEdge = dir === 1 ? live.atBottom : live.atTop;
      if (atEdge && !prevLive) {
        e.preventDefault();
        touchUsed = true;
        goTo(idx + dir);
      } else if (atEdge) {
        e.preventDefault(); // absorb momentum
      }
    } else {
      e.preventDefault();
      if (!prevLive) { touchUsed = true; goTo(idx + dir); }
    }
  }, { passive: false });

  window.addEventListener("touchend", () => {
    if (isMobile()) return;
    // Let momentum events finish, then settle
    setTimeout(() => {
      gestLive = false;
      sampleAndStore();
    }, SETTLE_MS + 60);
  }, { passive: true });

  /* ── Inner body scroll: update hint in real time ─────────────── */
  bodies.forEach((body, i) => {
    if (!body) return;
    body.addEventListener("scroll", () => {
      if (i !== idx) return;
      const live = readBoundary(body);
      const hint = hints[i];
      if (!hint) return;
      if (live.atBottom && body.scrollHeight > body.clientHeight + 4) {
        hint.classList.add("visible");
      } else {
        hint.classList.remove("visible");
      }
    }, { passive: true });
  });

  /* ── Resize ──────────────────────────────────────────────────── */
  function onResize() {
    if (!isMobile()) {
      track.style.transform = `translateY(-${idx * 100}vh)`;
    }
  }
  window.addEventListener("resize", debounce(onResize, 120));

  /* ── Init ───────────────────────────────────────────────────── */
  goTo(0);
  setTimeout(sampleAndStore, 50);
}

/* ==========================================================================
   MOBILE OBSERVER — nav label only (CSS snap handles scrolling)
   ========================================================================== */
function initMobileObserver() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) syncNav(e.target.id); }),
    { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
  );
  document.querySelectorAll("section").forEach(s => obs.observe(s));
}

/* ==========================================================================
   RESIZE — switch mode on orientation change
   ========================================================================== */
function onResize() {
  // Full reload on mobile↔desktop switch keeps state clean
  // (rare event — orientation change or window resize past breakpoint)
  const nowMobile = isMobile();
  const track     = document.getElementById("scroll-track");
  if (!track) return;
  if (nowMobile) {
    track.style.transform   = "none";
    track.style.transition  = "none";
  }
}
