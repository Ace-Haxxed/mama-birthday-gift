/* ═══════════════════════════════════════════════════════════════
   Happy Birthday, Ruheena Syed — experience engine
   Vanilla JS. No dependencies. GPU-friendly (transform/opacity only).
   ═══════════════════════════════════════════════════════════════ */

"use strict";

/* ─────────────────────────────────────────────
   Photo library — discovered from the project folder.
   To add photos later: drop them in the folder and list them here.
   ───────────────────────────────────────────── */
const PHOTOS = [
  "WhatsApp Image 2026-07-02 at 3.19.15 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.16 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.17 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.18 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.19 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.20 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.21 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.22 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.23 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.24 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.25 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.26 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.27 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.28 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.29 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.30 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.31 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.32 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.33 PM.jpeg",
  "WhatsApp Image 2026-07-02 at 3.19.34 PM.jpeg",
  "Added image 1.jpeg",
  "Added Image 2.jpeg",
  "Added Image 3.jpeg",
  "Added image 4.jpeg",
];

/* Each of these has an independent 1-in-200 chance per page load */
const BONUS_PHOTOS = ["Amyra Jumpscare.jpeg", "Jumpscare number 2.jpeg"];
const BONUS_CHANCE = 1 / 200;

/* Hidden jumpscare easter eggs (see initJumpscares) */
const JUMP_IMAGES = {
  amyra: "Amyra Jumpscare.jpeg",
  weird: "Jumpscare number 2.jpeg",
};

const BIRTH_DATE = new Date(1985, 5, 25); // June 25, 1985 (months are 0-based)
const DISPLAYED_AGE = 40; // her age — shown in the Memorial counter and "Years Loved"

const REASONS = [
  "Your Kindness",
  "Your Strength",
  "Your Generosity",
  "Your Smile",
  "Your Patience",
  "Your Wisdom",
  "Your Unconditional Love",
  "Your Support",
];

/* ─────────────────────────────────────────────
   Utilities
   ───────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ─────────────────────────────────────────────
   1. Preloader → reveal the page
   ───────────────────────────────────────────── */
function initPreloader() {
  const preloader = $("#preloader");
  const reveal = () => {
    // Small beat so the heart is seen, then hand off to the hero reveal
    setTimeout(() => {
      preloader.classList.add("is-done");
      document.body.classList.add("is-loaded");
      launchCelebration();
    }, prefersReducedMotion ? 0 : 700);
  };
  if (document.readyState === "complete") reveal();
  else window.addEventListener("load", reveal, { once: true });
  // Safety: never trap the user on the preloader
  setTimeout(reveal, 4000);
}

/* ─────────────────────────────────────────────
   2. Scroll progress bar + back-to-top
   ───────────────────────────────────────────── */
function initScrollUI() {
  const bar = $("#scrollProgress");
  const topBtn = $("#backToTop");
  let ticking = false;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = `scaleX(${p})`;
    topBtn.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.8);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();

  topBtn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
  );
}

/* ─────────────────────────────────────────────
   3. Cursor glow (desktop, pointer: fine only)
   ───────────────────────────────────────────── */
function initCursorGlow() {
  if (prefersReducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const glow = $("#cursorGlow");
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;

  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    // Trailing lerp gives the glow gentle weight
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    glow.style.transform = `translate(${x - 260}px, ${y - 260}px)`;
    requestAnimationFrame(loop);
  })();
}

/* ─────────────────────────────────────────────
   4. Intersection Observer reveals
   ───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

function observeReveals(root = document) {
  root.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

/* ─────────────────────────────────────────────
   5. Hero particles — soft champagne motes + glowing hearts
   ───────────────────────────────────────────── */
function initHeroParticles() {
  if (prefersReducedMotion) return;
  const canvas = $("#heroParticles");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w, h, particles = [];

  const PALETTE = ["233,190,170", "246,223,224", "229,212,179", "201,168,106"];

  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    const isHeart = Math.random() < 0.14;
    return {
      x: Math.random() * w,
      y: h + 20 + Math.random() * 60,
      r: isHeart ? 7 + Math.random() * 7 : 1 + Math.random() * 2.6,
      vy: 0.15 + Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 0.18,
      drift: Math.random() * Math.PI * 2,
      alpha: 0,
      maxAlpha: isHeart ? 0.16 + Math.random() * 0.12 : 0.25 + Math.random() * 0.3,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      isHeart,
    };
  }

  function drawHeart(x, y, size, style) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 16, size / 16);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, 1, -3, -3, -7, -3);
    ctx.bezierCurveTo(-12, -3, -12, 4, -12, 4);
    ctx.bezierCurveTo(-12, 8, -8, 12, 0, 17);
    ctx.bezierCurveTo(8, 12, 12, 8, 12, 4);
    ctx.bezierCurveTo(12, 4, 12, -3, 7, -3);
    ctx.bezierCurveTo(3, -3, 0, 1, 0, 4);
    ctx.fillStyle = style;
    ctx.shadowColor = style;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  const COUNT = Math.min(46, Math.floor(innerWidth / 30));
  for (let i = 0; i < COUNT; i++) {
    const p = spawn();
    p.y = Math.random() * h; // scatter the first generation
    particles.push(p);
  }

  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(canvas);

  (function tick() {
    requestAnimationFrame(tick);
    if (!heroVisible) return; // don't burn frames off-screen
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.drift += 0.008;
      p.x += p.vx + Math.sin(p.drift) * 0.14;
      p.y -= p.vy;
      p.alpha = Math.min(p.maxAlpha, p.alpha + 0.004);
      if (p.y < -30) particles[i] = spawn();
      const style = `rgba(${p.color},${p.alpha})`;
      if (p.isHeart) {
        drawHeart(p.x, p.y, p.r, style);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = style;
        ctx.fill();
      }
    }
  })();
}

/* ─────────────────────────────────────────────
   6. Opening celebration — confetti, sparkles, hearts
   Runs once, gently, then removes itself.
   ───────────────────────────────────────────── */
function launchCelebration() {
  const canvas = $("#celebrationCanvas");
  if (prefersReducedMotion) { canvas.remove(); return; }

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const COLORS = ["#e9bea9", "#f6dfe0", "#e5d4b3", "#c9a86a", "#ecc7ca", "#fdfaf6"];
  const pieces = [];
  const start = performance.now();
  const DURATION = 5200;

  for (let i = 0; i < 120; i++) {
    const kind = Math.random() < 0.14 ? "heart" : Math.random() < 0.5 ? "confetti" : "sparkle";
    pieces.push({
      kind,
      x: Math.random() * innerWidth,
      y: -30 - Math.random() * innerHeight * 0.6,
      size: kind === "heart" ? 8 + Math.random() * 8 : 3 + Math.random() * 6,
      vy: 0.7 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.8,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.06,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      wobble: Math.random() * Math.PI * 2,
    });
  }

  function drawHeartPath(size) {
    const s = size / 16;
    ctx.beginPath();
    ctx.moveTo(0, 4 * s);
    ctx.bezierCurveTo(0, s, -3 * s, -3 * s, -7 * s, -3 * s);
    ctx.bezierCurveTo(-12 * s, -3 * s, -12 * s, 4 * s, -12 * s, 4 * s);
    ctx.bezierCurveTo(-12 * s, 8 * s, -8 * s, 12 * s, 0, 17 * s);
    ctx.bezierCurveTo(8 * s, 12 * s, 12 * s, 8 * s, 12 * s, 4 * s);
    ctx.bezierCurveTo(12 * s, 4 * s, 12 * s, -3 * s, 7 * s, -3 * s);
    ctx.bezierCurveTo(3 * s, -3 * s, 0, s, 0, 4 * s);
  }

  (function frame(now) {
    const elapsed = now - start;
    if (elapsed > DURATION) { canvas.remove(); return; }
    requestAnimationFrame(frame);

    // Global fade in the final second so the exit is soft
    const fade = elapsed > DURATION - 1000 ? (DURATION - elapsed) / 1000 : 1;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (const p of pieces) {
      p.wobble += 0.03;
      p.x += p.vx + Math.sin(p.wobble) * 0.5;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > innerHeight + 30) continue;

      ctx.save();
      ctx.globalAlpha = 0.85 * fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.kind === "heart") {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        drawHeartPath(p.size);
        ctx.fill();
      } else if (p.kind === "confetti") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        // Sparkle: soft glowing dot with a twinkle
        ctx.globalAlpha = (0.4 + 0.45 * Math.abs(Math.sin(p.wobble * 2))) * fade;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  })(start);
}

/* ─────────────────────────────────────────────
   7. Gallery + lightbox (+ the quiet bonus photo)
   ───────────────────────────────────────────── */
let galleryList = [];

function buildGallery() {
  const grid = $("#galleryGrid");
  galleryList = [...PHOTOS];

  // Once in a very rare while, an extra memory slips into the collection.
  for (const bonus of BONUS_PHOTOS) {
    if (Math.random() < BONUS_CHANCE) {
      const at = 1 + Math.floor(Math.random() * (galleryList.length - 1));
      galleryList.splice(at, 0, bonus);
    }
  }

  const frag = document.createDocumentFragment();
  galleryList.forEach((src, i) => {
    const item = document.createElement("figure");
    item.className = "gallery__item reveal";
    if (BONUS_PHOTOS.includes(src)) item.classList.add("gallery__item--glow");
    item.style.setProperty("--d", `${(i % 6) * 0.08}s`);
    item.style.setProperty("--float-d", `${(i % 7) * -1.1}s`);
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `View photo ${i + 1} of ${galleryList.length}`);

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Family memory ${i + 1}`;
    img.loading = i < 6 ? "eager" : "lazy";
    img.decoding = "async";

    item.appendChild(img);
    item.addEventListener("click", () => openLightbox(i));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); }
    });
    frag.appendChild(item);
  });
  grid.appendChild(frag);
  observeReveals(grid);
}

/* Lightbox */
const lightbox = {
  el: null, img: null, counter: null, index: 0, lastFocus: null,
};

function openLightbox(index) {
  lightbox.index = index;
  lightbox.lastFocus = document.activeElement;
  lightbox.el.hidden = false;
  document.body.style.overflow = "hidden";
  // Double rAF so the transition runs after unhiding
  requestAnimationFrame(() => requestAnimationFrame(() => lightbox.el.classList.add("is-open")));
  updateLightbox();
  $("#lightboxClose").focus();
}

function updateLightbox() {
  const src = galleryList[lightbox.index];
  lightbox.img.style.opacity = "0";
  const swap = new Image();
  swap.onload = () => {
    lightbox.img.src = src;
    lightbox.img.alt = `Family memory ${lightbox.index + 1} of ${galleryList.length}`;
    lightbox.img.style.opacity = "1";
  };
  swap.src = src;
  lightbox.counter.textContent = `${lightbox.index + 1} · ${galleryList.length}`;
}

function stepLightbox(dir) {
  lightbox.index = (lightbox.index + dir + galleryList.length) % galleryList.length;
  updateLightbox();
}

function closeLightbox() {
  lightbox.el.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => { lightbox.el.hidden = true; }, 600);
  if (lightbox.lastFocus) lightbox.lastFocus.focus();
}

function initLightbox() {
  lightbox.el = $("#lightbox");
  lightbox.img = $("#lightboxImg");
  lightbox.counter = $("#lightboxCounter");
  lightbox.img.style.transition = "opacity .45s ease";

  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#lightboxBackdrop").addEventListener("click", closeLightbox);
  $("#lightboxPrev").addEventListener("click", () => stepLightbox(-1));
  $("#lightboxNext").addEventListener("click", () => stepLightbox(1));

  document.addEventListener("keydown", (e) => {
    if (lightbox.el.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") stepLightbox(-1);
    else if (e.key === "ArrowRight") stepLightbox(1);
  });

  // Swipe support
  let touchX = null;
  lightbox.el.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.el.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 48) stepLightbox(dx > 0 ? -1 : 1);
    touchX = null;
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   9. Reasons We Love You
   ───────────────────────────────────────────── */
function buildReasons() {
  const grid = $("#reasonsGrid");
  const frag = document.createDocumentFragment();

  REASONS.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "reason-card reveal";
    card.style.setProperty("--d", `${(i % 4) * 0.1}s`);
    card.style.setProperty("--float-d", `${(i % 5) * -1.6}s`);
    card.innerHTML = `
      <span class="reason-card__heart" aria-hidden="true">❤️</span>
      <h3 class="reason-card__title">${r}</h3>
    `;
    frag.appendChild(card);
  });
  grid.appendChild(frag);
  observeReveals(grid);
}

/* ─────────────────────────────────────────────
   10. Footer greeting — "Happy Birthday Mom" on June 25 only
   ───────────────────────────────────────────── */
function initFooterGreeting() {
  const now = new Date();
  const isBirthday = now.getMonth() === 5 && now.getDate() === 25; // June 25

  // Footer
  const greeting = isBirthday ? "Happy Birthday Mom" : "For my Mom";
  $("#footerGreeting").textContent = greeting;
  document.title = `${greeting} ♡`;

  // Hero — only celebrates "Happy Birthday" on the actual day
  if (isBirthday) {
    $("#heroEyebrow").textContent = "June 25 · A Day Worth Celebrating";
    $("#heroGreeting").textContent = "Happy Birthday";
  }
}

/* ─────────────────────────────────────────────
   11. Memorial — live count-up since June 25, 1985
   ───────────────────────────────────────────── */
function initCountUp() {
  const years = $("#cuYears"), days = $("#cuDays"), hours = $("#cuHours"),
        mins = $("#cuMinutes"), secs = $("#cuSeconds");

  // Most recent birthday anniversary — the remainder counts from here
  function lastAnniversary(now) {
    let anni = new Date(now.getFullYear(), BIRTH_DATE.getMonth(), BIRTH_DATE.getDate());
    if (now < anni) anni = new Date(now.getFullYear() - 1, BIRTH_DATE.getMonth(), BIRTH_DATE.getDate());
    return anni;
  }

  function tick() {
    const now = new Date();
    const anni = lastAnniversary(now);
    const rem = now - anni;
    years.textContent = DISPLAYED_AGE;
    days.textContent = Math.floor(rem / 86400000);
    hours.textContent = String(Math.floor(rem / 3600000) % 24).padStart(2, "0");
    mins.textContent = String(Math.floor(rem / 60000) % 60).padStart(2, "0");
    secs.textContent = String(Math.floor(rem / 1000) % 60).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

/* ─────────────────────────────────────────────
   12. Animated statistics
   ───────────────────────────────────────────── */
function initStats() {
  const now = new Date();
  const daysLived = Math.floor((now - BIRTH_DATE) / 86400000);

  const targets = {
    years: DISPLAYED_AGE,
    days: daysLived,
    memories: Infinity, // counts up, then resolves to ∞
  };

  const counters = document.querySelectorAll("[data-counter]");
  const statObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      statObserver.unobserve(entry.target);
      animateCounter(entry.target, targets[entry.target.dataset.targetKey]);
    }
  }, { threshold: 0.6 });
  counters.forEach((el) => statObserver.observe(el));

  function animateCounter(el, target) {
    if (prefersReducedMotion) {
      el.textContent = target === Infinity ? "∞" : target.toLocaleString();
      if (target === Infinity) el.classList.add("is-infinite");
      return;
    }
    const DURATION = 2200;
    const isInfinite = target === Infinity;
    const numericTarget = isInfinite ? 9999 : target;
    const start = performance.now();

    (function step(now) {
      const t = clamp((now - start) / DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart, Apple-ish deceleration
      if (t < 1) {
        el.textContent = Math.round(numericTarget * eased).toLocaleString();
        requestAnimationFrame(step);
      } else if (isInfinite) {
        el.textContent = "∞";
        el.classList.add("is-infinite");
      } else {
        el.textContent = target.toLocaleString();
      }
    })(start);
  }
}

/* ─────────────────────────────────────────────
   13. Her Journey — lazy-load the 3D globe on first view
   ───────────────────────────────────────────── */
function initJourneyLazy() {
  const section = $("#journey");
  if (!section) return;

  let loaded = false;
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting || loaded) return;
    loaded = true;
    observer.disconnect();

    import("./journey.js")
      .then((mod) => mod.initJourney())
      .catch((err) => {
        // The globe is 100% offline — every asset (Three.js, OrbitControls,
        // and the Earth textures) is vendored locally. The only thing that can
        // stop it is HOW the page is opened: browsers refuse to load ES modules
        // over the file:// protocol (CORS), so opening index.html by
        // double-clicking will fail here even with a perfect internet
        // connection. Surface the *real* error instead of blaming the network.
        console.error("Globe failed to initialize. Real error:", err);

        const isFileProtocol = location.protocol === "file:";
        const loader = $("#globeLoader");
        if (!loader) return;
        const textEl = loader.querySelector(".globe-loader__text");
        if (!textEl) return;

        if (isFileProtocol) {
          textEl.innerHTML =
            "This page was opened directly from a file. Browsers block the " +
            "globe's modules over <code>file://</code>.<br>Run it through a " +
            "local server instead (see <code>START-HERE.md</code>). " +
            "No internet is required.";
        } else {
          // Served over http(s) but still failed — show the genuine JS error.
          textEl.textContent = "Globe error: " + (err && err.message ? err.message : String(err));
        }
      });
  }, { rootMargin: "200px" }); // begin loading just before it's on screen

  observer.observe(section);
}

/* ─────────────────────────────────────────────
   14. Magnetic buttons — subtle pull toward the cursor
   ───────────────────────────────────────────── */
function initMagnetic() {
  if (prefersReducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll(".magnetic").forEach((el) => {
    const STRENGTH = 0.32;
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.style.transition = "transform .2s cubic-bezier(0.22,1,0.36,1)";
      el.style.transform = `translate(${dx * STRENGTH}px, ${dy * STRENGTH}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .7s cubic-bezier(0.34,1.4,0.44,1)";
      el.style.transform = "";
    });
  });
}

/* ─────────────────────────────────────────────
   15. Hero parallax — content drifts slower than the scroll
   ───────────────────────────────────────────── */
function initParallax() {
  if (prefersReducedMotion) return;
  const content = $(".hero__content");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < innerHeight * 1.2) {
        content.style.transform = `translateY(${y * 0.28}px)`;
        content.style.opacity = clamp(1 - y / (innerHeight * 0.85), 0, 1);
      }
      ticking = false;
    });
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   16. Jumpscares — hidden easter eggs 👻
   • type "amyra"  → Amyra jumpscare
   • type "weird"  → the other jumpscare
   • a small random chance one ambushes you while browsing
   Each is the real deal: full-screen image, screech, and a violent shake.
   ───────────────────────────────────────────── */
function initJumpscares() {
  let active = false;
  let audioCtx = null;

  // Prepare/resume audio on the first real gesture (browser autoplay policy).
  const ensureAudio = () => {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { try { audioCtx = new AC(); } catch { audioCtx = null; } }
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  };
  window.addEventListener("pointerdown", ensureAudio);
  window.addEventListener("keydown", ensureAudio);

  // A short, nasty screech: a band-passed noise burst + detuned saw tones.
  function screech() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.9, now + 0.015);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    master.connect(ctx.destination);

    const dur = 1.4;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.6;
    noise.connect(bp).connect(master);
    noise.start(now); noise.stop(now + dur);

    [196, 208, 311].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f * 4, now);
      o.frequency.exponentialRampToValueAtTime(f, now + 1.1);
      const g = ctx.createGain();
      g.gain.value = 0.22;
      o.connect(g).connect(master);
      o.start(now); o.stop(now + 1.25);
    });
  }

  function strike(src) {
    if (active) return;
    active = true;

    const overlay = document.createElement("div");
    overlay.className = "jumpscare" + (prefersReducedMotion ? "" : " jumpscare--shake");
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    if (!prefersReducedMotion) screech();
    if (navigator.vibrate) { try { navigator.vibrate([0, 220, 60, 220]); } catch {} }

    setTimeout(() => {
      overlay.classList.add("is-out");
      setTimeout(() => { overlay.remove(); active = false; }, 320);
    }, 1300);
  }

  // ── Typed triggers (global — not tied to any input field) ──
  let buffer = "";
  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-8);
    if (buffer.endsWith("amyra")) { buffer = ""; strike(JUMP_IMAGES.amyra); }
    else if (buffer.endsWith("weird")) { buffer = ""; strike(JUMP_IMAGES.weird); }
  });

  // ── Random ambush while browsing normally ──
  const pics = [JUMP_IMAGES.amyra, JUMP_IMAGES.weird];
  setInterval(() => {
    if (active || document.hidden) return;
    if (Math.random() < 0.06) strike(pics[Math.floor(Math.random() * pics.length)]);
  }, 25000);
}

/* ─────────────────────────────────────────────
   Boot
   ───────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  initScrollUI();
  initCursorGlow();
  initHeroParticles();
  buildGallery();
  initLightbox();
  buildReasons();
  initFooterGreeting();
  initCountUp();
  initStats();
  initJourneyLazy();
  initMagnetic();
  initParallax();
  observeReveals();
  initJumpscares();
});
