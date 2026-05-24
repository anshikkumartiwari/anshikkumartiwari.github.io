/**
 * ==========================================================================
 * PORTFOLIO COMPONENT LOGIC & INTERACTION
 * Anshik Kumar Tiwari - Personal Portfolio
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initThemeSwitcher();
  initDropdownNavigation();
  initScrollController();
  initMobileIntersectionObserver();
});

/**
 * --------------------------------------------------------------------------
 * 1. THEME SWITCHER LOGIC
 * Supports Light, Dark, and System Preferences with persistent memory.
 * --------------------------------------------------------------------------
 */
function initThemeSwitcher() {
  const themeButtons = document.querySelectorAll(".theme-btn");
  if (!themeButtons.length) return;

  const savedTheme = localStorage.getItem("theme-preference") || "system";
  applyTheme(savedTheme);

  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedTheme = btn.getAttribute("data-theme");
      applyTheme(selectedTheme);
    });
  });

  function applyTheme(theme) {
    const htmlEl = document.documentElement;

    if (theme === "system") {
      htmlEl.removeAttribute("data-theme");
    } else {
      htmlEl.setAttribute("data-theme", theme);
    }

    localStorage.setItem("theme-preference", theme);

    themeButtons.forEach((btn) => {
      if (btn.getAttribute("data-theme") === theme) {
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      }
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const currentPreference = localStorage.getItem("theme-preference") || "system";
    if (currentPreference === "system") {
      applyTheme("system");
    }
  });
}

/**
 * --------------------------------------------------------------------------
 * 2. DROPDOWN STYLING & TOGGLES
 * Handles toggling, clicking outside, and keyboard escapes.
 * --------------------------------------------------------------------------
 */
function initDropdownNavigation() {
  const dropdown = document.querySelector(".dropdown");
  const trigger = document.querySelector(".dropdown-trigger");

  if (!dropdown || !trigger) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.classList.remove("open");
    }
  });
}

/**
 * Helper to check viewport width.
 * Under 768px (standard mobile/tablet vertical viewports), we fallback to native long scroll.
 */
function isMobileViewport() {
  return window.innerWidth <= 768;
}

/**
 * --------------------------------------------------------------------------
 * 3. HIERARCHICAL SCROLL SNAPPING CONTROLLER (Desktop/Tablet)
 * Manages parent page snapping and internal scroll containers.
 * --------------------------------------------------------------------------
 */
let currentSectionIndex = 0;
let isTransitioning = false;
const transitionCooldown = 800; // ms to match CSS transition-slow

function initScrollController() {
  const scrollContainer = document.getElementById("main-scroll-container");
  const sections = document.querySelectorAll("section");
  const totalSections = sections.length;

  if (!scrollContainer || !sections.length) return;

  // Global listeners for desktop scroll interception
  window.addEventListener("wheel", handleGlobalScroll, { passive: false });
  
  // Touch tracking for swiping on larger screens (e.g. iPad Pro)
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });

  let touchStartY = 0;

  function scrollToSection(index) {
    if (index < 0 || index >= totalSections || isTransitioning) return;

    isTransitioning = true;
    currentSectionIndex = index;

    // Trigger sliding animation using hardware-accelerated CSS translate
    scrollContainer.style.transform = `translateY(-${index * 100}vh)`;

    // Update active visual classes
    sections.forEach((sec, idx) => {
      if (idx === index) {
        sec.classList.add("active-in-view", "active-section");
        updateUIState(sec.id);
      } else {
        sec.classList.remove("active-section");
      }
    });

    setTimeout(() => {
      isTransitioning = false;
    }, transitionCooldown);
  }

  function handleGlobalScroll(e) {
    // If mobile viewport, let native long-scroll take over
    if (isMobileViewport()) return;

    if (isTransitioning) {
      e.preventDefault();
      return;
    }

    const direction = e.deltaY > 0 ? 1 : -1; // 1 is scroll down (next), -1 is scroll up (prev)

    // Locate closest internal scrollable content wrapper under cursor
    const scrollable = e.target.closest(".scrollable-content");

    if (scrollable) {
      const scrollTop = scrollable.scrollTop;
      const scrollHeight = scrollable.scrollHeight;
      const clientHeight = scrollable.clientHeight;

      // Detect boundaries with a slight buffer (1.5px) for browser zoom/rounding
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1.5;
      const isAtTop = scrollTop <= 0.5;

      if (direction === 1) {
        if (!isAtBottom) {
          // Let internal content scroll naturally, do not intercept
          return;
        } else {
          // Bottom reached, consume input and transition section
          e.preventDefault();
          scrollToSection(currentSectionIndex + 1);
        }
      } else {
        if (!isAtTop) {
          // Let internal content scroll naturally
          return;
        } else {
          // Top reached, consume input and transition section
          e.preventDefault();
          scrollToSection(currentSectionIndex - 1);
        }
      }
    } else {
      // Scrolling outside scroll containers - immediate section snap
      e.preventDefault();
      scrollToSection(currentSectionIndex + direction);
    }
  }

  function handleTouchStart(e) {
    if (isMobileViewport()) return;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    if (isMobileViewport()) return;

    if (isTransitioning) {
      e.preventDefault();
      return;
    }

    const touchCurrentY = e.touches[0].clientY;
    const deltaY = touchStartY - touchCurrentY; // Positive delta = swiping up (scrolling down)
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaY < 30) return; // Ignore small noise slides

    const direction = deltaY > 0 ? 1 : -1;
    const scrollable = e.target.closest(".scrollable-content");

    if (scrollable) {
      const scrollTop = scrollable.scrollTop;
      const scrollHeight = scrollable.scrollHeight;
      const clientHeight = scrollable.clientHeight;

      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1.5;
      const isAtTop = scrollTop <= 0.5;

      if (direction === 1) {
        if (!isAtBottom) {
          return;
        } else {
          e.preventDefault();
          scrollToSection(currentSectionIndex + 1);
        }
      } else {
        if (!isAtTop) {
          return;
        } else {
          e.preventDefault();
          scrollToSection(currentSectionIndex - 1);
        }
      }
    } else {
      e.preventDefault();
      scrollToSection(currentSectionIndex + direction);
    }
  }

  // Handle navigation dropdown item clicks
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = item.getAttribute("href").substring(1);
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        const targetIndex = Array.from(sections).indexOf(targetSec);
        scrollToSection(targetIndex);
      }
    });
  });

  // Handle hero scroll indicator clicking
  const indicator = document.querySelector(".scroll-indicator");
  if (indicator) {
    indicator.addEventListener("click", () => {
      scrollToSection(1);
    });
  }
  
  // Clean initialization reset to Section 0
  scrollToSection(0);

  // Readjust translate if desktop viewport is resized
  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      scrollContainer.style.transform = `translateY(-${currentSectionIndex * 100}vh)`;
    } else {
      scrollContainer.style.transform = "none";
    }
  });
}

/**
 * --------------------------------------------------------------------------
 * 4. PASSIVE OBSERVATION FOR MOBILE VIEWPORT
 * Monitors active sections during mobile free scroll to sync sticky navbar states.
 * --------------------------------------------------------------------------
 */
function initMobileIntersectionObserver() {
  const sections = document.querySelectorAll("section");
  if (!sections.length) return;

  const observerOptions = {
    root: null,
    rootMargin: "-45% 0px -45% 0px", // Strict center focus
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Mobile only - desktop updates active classes via scroll Snapper controller
      if (!isMobileViewport()) return;

      if (entry.isIntersecting) {
        const id = entry.target.id;
        entry.target.classList.add("active-in-view");
        updateUIState(id);
      }
    });
  }, observerOptions);

  sections.forEach((sec) => observer.observe(sec));
}

/**
 * --------------------------------------------------------------------------
 * 5. SHARED USER INTERFACE SYNC
 * Updates dropdown labels and highlights selection options in the navbar.
 * --------------------------------------------------------------------------
 */
function updateUIState(sectionId) {
  const dropdownTriggerText = document.getElementById("active-section-name");
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  dropdownItems.forEach((item) => {
    const targetHash = item.getAttribute("href");
    const cleanHash = targetHash.replace("#", "");

    if (cleanHash === sectionId) {
      item.classList.add("active");
      item.setAttribute("aria-selected", "true");

      if (dropdownTriggerText) {
        dropdownTriggerText.textContent = item.textContent.trim();
      }
    } else {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    }
  });
}
