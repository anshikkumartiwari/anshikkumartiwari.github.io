/**
 * Portfolio script — Anshik Kumar Tiwari
 * Theme switching, dropdown, active nav highlight via IntersectionObserver.
 * No scroll manipulation. The browser handles scrolling.
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initDropdown();
  initNavHighlight();
  initBlogs();
  initContactForm();
});

/* ==========================================================================
   THEME
   ========================================================================== */
function initTheme() {
  const dd = document.getElementById("theme-dd");
  if (!dd) return;
  const trigger = dd.querySelector(".dd-trigger");
  const btns = dd.querySelectorAll(".theme-btn");
  const activeIcon = document.getElementById("theme-active-icon");

  function apply(t) {
    t === "system"
      ? document.documentElement.removeAttribute("data-theme")
      : document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    btns.forEach(b => {
      const on = b.dataset.theme === t;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
      if (on && activeIcon) {
        activeIcon.innerHTML = b.querySelector("svg").outerHTML;
      }
    });
  }

  apply(localStorage.getItem("theme") || "system");

  trigger.addEventListener("click", e => {
    e.stopPropagation();
    const open = dd.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(open));
    document.getElementById("section-dd")?.classList.remove("open");
  });

  btns.forEach(b => {
    b.addEventListener("click", e => {
      e.stopPropagation();
      apply(b.dataset.theme);
      dd.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", () => {
    dd.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      dd.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

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
    document.getElementById("theme-dd")?.classList.remove("open");
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

/* ==========================================================================
   BLOGS SYSTEM
   ========================================================================== */
function initBlogs() {
  const blogList = document.getElementById("blog-list");
  if (!blogList) return;

  loadBlogList(blogList);
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseFrontMatter(text) {
  const regex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = text.match(regex);
  const metadata = {};
  let bodyContent = text;

  if (match) {
    bodyContent = text.replace(match[0], '').trim();
    const yaml = match[1];
    const lines = yaml.split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        val = val.replace(/^['"]|['"]$/g, '');
        metadata[key] = val;
      }
    }
  }
  return { metadata, bodyContent };
}

async function loadBlogList(container) {
  let articles = [];

  // 1. Try local manifest
  try {
    const res = await fetch("blogs/manifest.json");
    if (res.ok) {
      articles = await res.json();
    }
  } catch (e) {
    console.warn("Local manifest load failed, attempting API fallback", e);
  }

  // 2. Try GitHub Repository API fallback
  if (articles.length === 0) {
    try {
      const res = await fetch("https://api.github.com/repos/anshikkumartiwari/anshikkumartiwari.github.io/contents/blogs");
      if (res.ok) {
        const files = await res.json();
        const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== 'template.md');
        
        for (const file of mdFiles) {
          try {
            const fRes = await fetch(file.download_url);
            if (fRes.ok) {
              const text = await fRes.text();
              const { metadata } = parseFrontMatter(text);
              articles.push({
                file: file.name,
                title: metadata.title || file.name,
                subtitle: metadata.subtitle || "",
                category: metadata.category || "General",
                date: metadata.date || "",
                readTime: metadata.readTime || "",
                description: metadata.description || ""
              });
            }
          } catch (e) {
            console.error("Failed to parse", file.name, e);
          }
        }
      }
    } catch (e) {
      console.error("GitHub API load failed", e);
    }
  }

  if (articles.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--muted);padding:2rem;font-family:var(--f-mono);">No articles published yet.</div>`;
    return;
  }

  // Render cards
  container.innerHTML = articles.map(art => {
    const titleSlug = generateSlug(art.title);
    
    const thumbHtml = art.thumbnail 
      ? `<img src="${art.thumbnail}" alt="Thumbnail" class="blog-card-thumb">`
      : `<div class="blog-card-thumb" style="display:flex;align-items:center;justify-content:center;font-family:var(--f-head);font-weight:700;font-size:1.5rem;color:var(--accent);background:var(--accent-bg);">${art.title.charAt(0)}</div>`;

    return `
      <a href="pages/article.html?a=${art.file}" class="blog-card" data-slug="/blogs/${titleSlug}">
        <div class="blog-card-left">
          <h3 class="blog-card-title">${art.title}</h3>
          <p class="blog-card-desc">${art.description || art.subtitle || ""}</p>
          <div class="blog-card-meta">
            <span class="blog-card-author">Anshik Kumar Tiwari</span>
            <span class="blog-card-sep">•</span>
            <span class="blog-card-date">${art.date}</span>
            <span class="blog-card-sep">•</span>
            <span class="blog-card-read">${art.readTime}</span>
          </div>
        </div>
        <div class="blog-card-right">
          ${thumbHtml}
        </div>
      </a>
    `;
  }).join('');
}

/* ==========================================================================
   CONTACT FORM & ROUTING
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const keyInput = document.getElementById("routing-key");
  const statusDiv = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");
  const submitBtnText = submitBtn.querySelector("span");

  const GIST_CONFIG_URL = "https://gist.githubusercontent.com/anshikkumartiwari/411bf1cc9a493fdc29acee08e8e8292f/raw/routing-config.json";
  const SUBMIT_ENDPOINT = "https://api.web3forms.com/submit";
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes rate limit
  
  let routingToken = "";

  // Helper to show messages in form-status
  function setStatus(msg, type = "") {
    statusDiv.textContent = msg;
    statusDiv.className = "form-status";
    if (type) {
      statusDiv.classList.add(type);
    }
  }

  // 1. Asynchronously fetch the routing configuration from the public Gist
  async function fetchConfig() {
    try {
      const response = await fetch(GIST_CONFIG_URL);
      if (response.ok) {
        const data = await response.json();
        if (data && data.routing_token) {
          routingToken = data.routing_token;
          if (keyInput) keyInput.value = routingToken;
        }
      }
    } catch (err) {
      console.warn("Unable to fetch routing configuration asynchronously.", err);
    }
  }

  // Start fetching the key immediately on load
  fetchConfig();

  // 2. Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Client-side Rate Limiting check
    const lastSubmit = localStorage.getItem("last_contact_submit");
    if (lastSubmit) {
      const elapsed = Date.now() - parseInt(lastSubmit, 10);
      if (elapsed < COOLDOWN_MS) {
        const remainingSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        const minutes = Math.floor(remainingSec / 60);
        const seconds = remainingSec % 60;
        const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        setStatus(`Please wait ${timeString} before sending another message.`, "warning");
        return;
      }
    }

    // Honey pot spam prevention
    const botcheck = form.querySelector('input[name="botcheck"]');
    if (botcheck && botcheck.checked) {
      console.warn("Spam detected.");
      setStatus("Message processed.", "success");
      form.reset();
      return;
    }

    // Ensure we have a routing token
    if (!routingToken) {
      setStatus("Initializing connection...", "warning");
      await fetchConfig();
      if (!routingToken) {
        setStatus("Unable to route message. Please try again later.", "error");
        return;
      }
    }

    // Set UI to loading/disabled state
    submitBtn.disabled = true;
    submitBtn.classList.add("sending");
    submitBtnText.textContent = "Sending...";
    setStatus("");

    // Update subject line dynamically with sender name
    const subjectField = document.getElementById("form-subject");
    const senderName = document.getElementById("form-name")?.value.trim();
    if (subjectField && senderName) {
      subjectField.value = `Anshik! you've a message from ${senderName}`;
    }

    // Submit payload
    const formData = new FormData(form);
    
    try {
      const response = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Accept": "application/json"
        },
        body: formData
      });

      const result = await response.json();

      if (response.status === 200 || result.success) {
        setStatus("Message sent successfully! ✨", "success");
        form.reset();
        
        // Save submit timestamp to localStorage for rate limiting
        localStorage.setItem("last_contact_submit", Date.now().toString());

        submitBtn.classList.remove("sending");
        submitBtn.classList.add("success");
        submitBtnText.textContent = "Sent!";
        setTimeout(() => {
          submitBtn.classList.remove("success");
          submitBtnText.textContent = "Send";
          submitBtn.disabled = false;
          setStatus("");
        }, 4000);
      } else {
        setStatus(result.message || "Something went wrong. Please try again.", "error");
        submitBtn.classList.remove("sending");
        submitBtn.disabled = false;
        submitBtnText.textContent = "Send";
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus("Connection error. Please try again.", "error");
      submitBtn.classList.remove("sending");
      submitBtn.disabled = false;
      submitBtnText.textContent = "Send";
    }
  });
}



