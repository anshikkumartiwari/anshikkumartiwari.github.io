/**
 * ==========================================================================
 * PORTFOLIO COMPONENT LOGIC & INTERACTION
 * Anshik Kumar Tiwari - Personal Portfolio
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initThemeSwitcher();
  initActiveSectionTracker();
  initDropdownNavigation();
  initScrollIndicators();
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

  // Retrieve saved theme preference, fallback to 'system'
  const savedTheme = localStorage.getItem("theme-preference") || "system";
  applyTheme(savedTheme);

  // Bind click handlers to theme toggle buttons
  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedTheme = btn.getAttribute("data-theme");
      applyTheme(selectedTheme);
    });
  });

  function applyTheme(theme) {
    const htmlEl = document.documentElement;

    // Apply data-theme attribute for CSS targeting
    if (theme === "system") {
      htmlEl.removeAttribute("data-theme");
    } else {
      htmlEl.setAttribute("data-theme", theme);
    }

    // Persist user selection
    localStorage.setItem("theme-preference", theme);

    // Update active button state in the UI
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

  // Listen for system color preference changes in real-time
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const currentPreference = localStorage.getItem("theme-preference") || "system";
    if (currentPreference === "system") {
      // Re-trigger theme logic to ensure real-time update
      applyTheme("system");
    }
  });
}

/**
 * --------------------------------------------------------------------------
 * 2. INTERSECTION OBSERVER FOR ACTIVE SECTION TRACKING
 * Automatically tracks which section is in view and updates UI accordingly.
 * --------------------------------------------------------------------------
 */
let currentActiveSectionId = "landing";

function initActiveSectionTracker() {
  const sections = document.querySelectorAll("section");
  const dropdownTriggerText = document.getElementById("active-section-name");
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  if (!sections.length) return;

  // Define intersection ratios. Trigger when section occupies majority of viewport
  const observerOptions = {
    root: null,
    rootMargin: "-25% 0px -25% 0px", // Focus on central 50% of screen height
    threshold: 0.1 // Triggers when at least 10% is visible within the region
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        
        // Add class to trigger CSS fade-in animations on enter
        entry.target.classList.add("active-in-view");

        currentActiveSectionId = id;
        updateUIState(id);
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));

  function updateUIState(sectionId) {
    // 1. Update dropdown active menu item styling
    dropdownItems.forEach((item) => {
      const targetHash = item.getAttribute("href") || item.getAttribute("data-target");
      const cleanHash = targetHash.replace("#", "");

      if (cleanHash === sectionId) {
        item.classList.add("active");
        
        // Update trigger text with matching label
        if (dropdownTriggerText) {
          dropdownTriggerText.textContent = item.textContent.replace(" ▼", "").replace(" ▲", "").trim();
        }
      } else {
        item.classList.remove("active");
      }
    });
  }
}

/**
 * --------------------------------------------------------------------------
 * 3. DROPDOWN NAVIGATION LOGIC
 * Handles clicking on the section selector, dropdown toggling, and smooth scrolls.
 * --------------------------------------------------------------------------
 */
function initDropdownNavigation() {
  const dropdown = document.querySelector(".dropdown");
  const trigger = document.querySelector(".dropdown-trigger");
  const items = document.querySelectorAll(".dropdown-item");

  if (!dropdown || !trigger) return;

  // Toggle dropdown menu visibility
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  // Close dropdown on click outside
  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
  });

  // Handle keyboard interaction (escape to close)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.classList.remove("open");
    }
  });

  // Handle menu item clicking
  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      
      const targetId = item.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        // Smoothly scroll to the target section
        targetSection.scrollIntoView({ behavior: "smooth" });
      }

      dropdown.classList.remove("open");
    });
  });
}

/**
 * --------------------------------------------------------------------------
 * 4. SCROLL INDICATOR
 * Binds clicking the indicator in Section 1 to scroll down to Section 2.
 * --------------------------------------------------------------------------
 */
function initScrollIndicators() {
  const indicator = document.querySelector(".scroll-indicator");
  if (indicator) {
    indicator.addEventListener("click", () => {
      const section2 = document.querySelector("section:nth-of-type(2)");
      if (section2) {
        section2.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
}
