// Absurd countdown values
let years = 9999;
let days = 999;
let hours = 99;
let minutes = 99;
let seconds = 99;

// Countdown DOM reference
const countdownEl = document.getElementById("countdown");
let countdownTimerId = null;

function updateCountdownText() {
  if (!countdownEl) return;
  countdownEl.textContent = `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function tickCountdown() {
  seconds--;
  if (seconds < 0) {
    seconds = 59;
    minutes--;
    if (minutes < 0) {
      minutes = 59;
      hours--;
      if (hours < 0) {
        hours = 23;
        days--;
        if (days < 0) {
          days = 364;
          years--;
        }
      }
    }
  }
  updateCountdownText();
}

function startCountdownIfNeeded() {
  if (!countdownEl) return;
  if (countdownTimerId !== null) return;
  updateCountdownText();
  countdownTimerId = window.setInterval(tickCountdown, 1000);
}

// Motion preference
const mediaReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = mediaReduce.matches;
mediaReduce.addEventListener?.("change", (e) => (reduceMotion = e.matches));

// Core DOM references
const bannerSlide = document.getElementById("bannerSlide");
const redBanner = document.getElementById("redBanner");
const freeMaterialsSlide = document.getElementById("freeMaterialsSlide");

// ===== Slide Controller =====
class SlideController {
  constructor() {
    this.slides = [];
    this.index = 0;
    this.locked = false;
    this.bannerIndex = -1;
    this.activeTransition = Promise.resolve();
    this.unlockTimer = null;
    this.redBannerShown = false;
    this.freeMaterialsIndex = -1;

    this.refresh();
    this.observer = null;
    this.setupObserver();
    this.updateRedBanner();
  }

  refresh() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.bannerIndex = this.slides.indexOf(bannerSlide);
    this.freeMaterialsIndex = this.slides.indexOf(freeMaterialsSlide);
  }

  setupObserver() {
    if (!('IntersectionObserver' in window)) return;

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = this.slides.indexOf(entry.target);
          if (idx !== -1) this.handleIndexChange(idx);
        }
      });
    }, { threshold: 0.55 });

    this.slides.forEach(slide => this.observer.observe(slide));
  }

  get current() {
    return this.slides[this.index] || null;
  }

  get nextIndex() {
    return Math.min(this.slides.length - 1, this.index + 1);
  }

  get prevIndex() {
    return Math.max(0, this.index - 1);
  }

  goTo(index, { source = "generic" } = {}) {
    if (this.locked) return this.activeTransition;
    if (index < 0 || index >= this.slides.length) return this.activeTransition;

    const target = this.slides[index];
    if (!target) return this.activeTransition;

    this.locked = true;

    const run = async () => {
      if (reduceMotion) {
        target.scrollIntoView();
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }

      this.handleIndexChange(index);

      if (this.unlockTimer) {
        clearTimeout(this.unlockTimer);
      }
      let delay = reduceMotion ? 650 : 700;
      if (source === "keyboard") {
        delay = reduceMotion ? 350 : 400;
      }
      this.unlockTimer = setTimeout(() => {
        this.locked = false;
        this.unlockTimer = null;
      }, delay);
    };

    this.activeTransition = this.activeTransition.then(run).catch(() => {
      this.locked = false;
    });

    return this.activeTransition;
  }

  goNext(options) {
    return this.goTo(this.nextIndex, options);
  }

  goPrev(options) {
    return this.goTo(this.prevIndex, options);
  }

  handleIndexChange(index) {
    this.index = index;
    this.updateRedBanner();
  }

  updateRedBanner() {
    if (!redBanner) return;
    const passedBanner = this.bannerIndex !== -1 && this.index > this.bannerIndex;
    const atOrBeyondFree = this.freeMaterialsIndex !== -1 && this.index >= this.freeMaterialsIndex;

    if (atOrBeyondFree) {
      redBanner.classList.remove('is-visible');
      document.body.classList.remove('red-banner-visible');
      return;
    }

    if (passedBanner) {
      if (!this.redBannerShown) {
        redBanner.classList.add('is-visible');
        document.body.classList.add('red-banner-visible');
        this.redBannerShown = true;
        startCountdownIfNeeded();
      }
    } else {
      redBanner.classList.remove('is-visible');
      document.body.classList.remove('red-banner-visible');
      this.redBannerShown = false;
    }
  }
}

const slideController = new SlideController();

function goToSlide(index, options) {
  if (popupOpen) return;
  slideController.goTo(index, options);
}

function goToRelative(delta, options) {
  if (popupOpen) return;
  if (delta > 0) return slideController.goNext(options);
  if (delta < 0) return slideController.goPrev(options);
}

// ===== Keyboard Navigation =====
function handleKeyNav(e) {
  if (popupOpen) return; // don't navigate when popup is open

  if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    goToRelative(-1, { source: 'keyboard' });
  } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    goToRelative(1, { source: 'keyboard' });
  } else if (e.key === 'Home') {
    e.preventDefault();
    goToSlide(0, { source: 'keyboard' });
  } else if (e.key === 'End') {
    e.preventDefault();
    goToSlide(slideController.slides.length - 1, { source: 'keyboard' });
  }
}

document.addEventListener('keydown', handleKeyNav);

// ===== Mouse wheel control (delta accumulation approach) =====
let wheelDelta = 0;
let wheelTimeout;
let wheelCooldownUntil = 0;

function handleWheel(e) {
  e.preventDefault();

  if (popupOpen) return;

  const now = performance.now();

  if (now < wheelCooldownUntil) {
    wheelDelta = 0;
    return;
  }

  if (slideController.locked) return;

  // Accumulate wheel delta
  wheelDelta += Math.abs(e.deltaY);

  // Clear existing wheel timeout
  clearTimeout(wheelTimeout);

  // Set a new timeout to reset the accumulated delta
  wheelTimeout = setTimeout(() => {
    wheelDelta = 0;
  }, 150); // Reset after 150ms of no scrolling

  // Only proceed if we've accumulated enough delta or it's a "big" scroll
  if (wheelDelta < 50 && Math.abs(e.deltaY) < 50) return;

  // Reset accumulated delta
  wheelDelta = 0;

  const direction = e.deltaY > 0 ? 1 : -1;
  goToRelative(direction, { source: 'wheel' });
  const cooldown = reduceMotion ? 700 : 720;
  wheelCooldownUntil = now + cooldown;
}

document.addEventListener('wheel', handleWheel, { passive: false });

// ===== Popup logic =====
const popup = document.getElementById("popup");
const popupScaler = popup?.querySelector(".popup-scaler");
const popupDialog = popup?.querySelector(".popup-dialog");
const popupClose = popup?.querySelector(".popup-close");
const popupGhostClose = popup?.querySelector("[data-close]");
const popupTitle = popup?.querySelector("#popupTitle");
const popupDesc = popup?.querySelector("#popupDesc");
const btnPrimary = popup?.querySelector(".btn-primary");
const btnGhost = popup?.querySelector(".btn-ghost");

const whySection = document.getElementById("whyPopupSection");

const seenReasons = new Set();
function hasSeen(reason) {
  return seenReasons.has(reason);
}
function markSeen(reason) {
  seenReasons.add(reason);
}

let popupOpen = false;
let lastScrollY = window.scrollY;
let lastScrollT = performance.now();
let focusRestoreEl = null;

const POPUP_COPY = {
  "why-popup": {
    title: "Here's your pop-up!",
    desc: "This is exactly what we were talking about—timed to grab your attention right when you're learning about pop-ups. Meta, right?",
    primary: "I see what you did there",
    secondary: "Close"
  },
  "fast-to-top": {
    title: "Back to the top already?",
    desc: "Here's a 2‑minute summary of what matters most — and your next step.",
    primary: "Get the summary",
    secondary: "No thanks"
  },
  "exit-intent": {
    title: "Wait — before you go",
    desc: "Grab the free field guide to spotting persuasion patterns so your attention stays yours.",
    primary: "Get the field guide",
    secondary: "No thanks"
  }
};
const POPUP_REASONS_LIST = ["why-popup", "fast-to-top", "exit-intent"];

function setPopupOriginFromRect(rect) {
  if (!popupScaler) return;
  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;
  if (rect) {
    const left = Math.max(0, Math.min(window.innerWidth, rect.left));
    const top = Math.max(0, Math.min(window.innerHeight, rect.top));
    originX = left + Math.min(rect.width, window.innerWidth) / 2;
    originY = top + Math.min(rect.height, window.innerHeight) / 2;
  }
  popupScaler.style.setProperty("--origin-x", `${originX}px`);
  popupScaler.style.setProperty("--origin-y", `${originY}px`);
}

function showPopup(reason, originRect = null) {
  if (!popup || popupOpen) return;
  if (hasSeen(reason)) return;

  markSeen(reason);
  updatePopupStats();

  const copy = POPUP_COPY[reason] || POPUP_COPY["why-popup"];
  popupTitle && (popupTitle.textContent = copy.title);
  popupDesc && (popupDesc.textContent = copy.desc);
  btnPrimary && (btnPrimary.textContent = copy.primary);
  btnGhost && (btnGhost.textContent = copy.secondary);

  setPopupOriginFromRect(originRect);

  popup.setAttribute("aria-hidden", "false");
  popup.classList.add("open");
  document.body.classList.add("modal-open");
  document.documentElement.classList.add("modal-open");
  document.removeEventListener('keydown', handleKeyNav);
  popupOpen = true;

  focusRestoreEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  popupDialog?.focus();

  document.addEventListener("keydown", onPopupKeydown);
  popup.addEventListener("click", onBackdropClick);
  popupClose?.addEventListener("click", hidePopup);
  popupGhostClose?.addEventListener("click", hidePopup);
}

function hidePopup() {
  if (!popupOpen || !popup) return;
  popupOpen = false;

  popup.classList.remove("open");
  popup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  document.documentElement.classList.remove("modal-open");
  document.addEventListener('keydown', handleKeyNav);

  document.removeEventListener("keydown", onPopupKeydown);
  popup.removeEventListener("click", onBackdropClick);
  popupClose?.removeEventListener("click", hidePopup);
  popupGhostClose?.removeEventListener("click", hidePopup);

  if (focusRestoreEl) { focusRestoreEl.focus(); focusRestoreEl = null; }
}

function onBackdropClick(e) {
  if (e.target === popup) hidePopup();
}

function onPopupKeydown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    hidePopup();
    return;
  }
  if (e.key === "Tab") {
    const focusables = popup.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    const list = Array.from(focusables).filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

// Trigger 1: "Why a Pop-Up?" slide comes into view
function checkPopupWhySection() {
  if (!whySection) return;
  const reason = "why-popup";
  if (hasSeen(reason) || popupOpen) return;

  const rect = whySection.getBoundingClientRect();
  const viewportMid = window.innerHeight / 2;
  const halfY = rect.top + rect.height * 0.5;

  if (viewportMid >= halfY && rect.bottom > 0 && rect.top < window.innerHeight) {
    showPopup(reason, rect);
  }
}

// Trigger 2: rapid scroll to top
function onFastTopScroll() {
  const reason = "fast-to-top";
  if (hasSeen(reason) || popupOpen) return;

  const now = performance.now();
  const y = window.scrollY;
  const dy = lastScrollY - y;
  const dt = Math.max(1, now - lastScrollT);
  const velocity = (dy / dt) * 1000;

  if (y < 200 && velocity > 1600) showPopup(reason, null);

  lastScrollY = y;
  lastScrollT = now;
}

// Trigger 3: exit intent
function onMouseOut(e) {
  const reason = "exit-intent";
  if (hasSeen(reason) || popupOpen) return;
  if (!e.relatedTarget && e.clientY <= 0) {
    showPopup(reason, null);
    document.removeEventListener("mouseout", onMouseOut);
  }
}
document.addEventListener("mouseout", onMouseOut);

// Wire popup scroll listeners
window.addEventListener("scroll", () => {
  checkPopupWhySection();
  onFastTopScroll();
}, { passive: true });

// ===== Data Trail: live stats =====
const statBrowser = document.getElementById("statBrowser");
const statOS = document.getElementById("statOS");
const statDevice = document.getElementById("statDevice");
const statReferrer = document.getElementById("statReferrer");
const statLocation = document.getElementById("statLocation");
const statTime = document.getElementById("statTime");
const statPopupCount = document.getElementById("statPopupCount");
const statPopupBar = document.getElementById("statPopupBar");
const statButtonsList = document.getElementById("statButtonsList");
const btnFetchIP = document.getElementById("btnFetchIP");

let sessionStart = Date.now();
let buttonClicks = Object.create(null);

function detectDeviceType() {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobile";
  return "Desktop";
}

function detectBrowser() {
  const ua = navigator.userAgent || "";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/") && !ua.includes("Edg/") && !ua.includes("OPR/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Unknown";
}

function detectOS() {
  const p = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
  if (/Win/i.test(p)) return "Windows";
  if (/Mac/i.test(p) && !/iPhone|iPad|iPod/i.test(p)) return "macOS";
  if (/iPhone|iPad|iPod/i.test(p)) return "iOS";
  if (/Android/i.test(p)) return "Android";
  if (/Linux/i.test(p)) return "Linux";
  return "Unknown";
}

function getReferrerHost() {
  const ref = document.referrer;
  if (!ref) return "Direct";
  try {
    return new URL(ref).hostname;
  } catch {
    return "Direct";
  }
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return (h ? `${h}:` : "") + `${m}`.padStart(2, "0") + ":" + `${s}`.padStart(2, "0");
}

function initStaticStats() {
  statBrowser && (statBrowser.textContent = detectBrowser());
  statOS && (statOS.textContent = detectOS());
  statDevice && (statDevice.textContent = detectDeviceType());
  statReferrer && (statReferrer.textContent = getReferrerHost());
  updatePopupStats();
}

function updateTimeOnSite() {
  statTime && (statTime.textContent = formatTime(Date.now() - sessionStart));
}
setInterval(updateTimeOnSite, 1000);

function updatePopupStats() {
  const count = POPUP_REASONS_LIST.reduce((acc, r) => acc + (hasSeen(r) ? 1 : 0), 0);
  const total = POPUP_REASONS_LIST.length;
  if (statPopupCount) statPopupCount.textContent = `${count}/${total}`;
  if (statPopupBar) statPopupBar.style.width = `${(count / total) * 100}%`;
}

function labelForButton(btn) {
  return btn.getAttribute("aria-label") || btn.title || (btn.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) || "(unlabeled button)";
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const label = labelForButton(btn);
  buttonClicks[label] = (buttonClicks[label] || 0) + 1;
  renderButtonClicks();
});

function renderButtonClicks() {
  if (!statButtonsList) return;
  const entries = Object.entries(buttonClicks).sort((a, b) => b[1] - a[1]).slice(0, 8);
  statButtonsList.innerHTML = entries.length
    ? entries.map(([k, v]) => `<li>${k} — ${v}</li>`).join("")
    : `<li>None yet</li>`;
}

async function fetchIpLocation() {
  if (!statLocation) return;
  try {
    statLocation.textContent = "Loading…";
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("IP service unavailable");
    const data = await res.json();
    const city = data.city || "";
    const region = data.region || "";
    const country = data.country_name || data.country || "";
    const parts = [city, region, country].filter(Boolean);
    statLocation.textContent = parts.length ? parts.join(", ") : "Unknown";
  } catch (err) {
    statLocation.textContent = "Unavailable";
  }
}
btnFetchIP?.addEventListener("click", fetchIpLocation);

// ===== Comment form handler =====
const btnPostComment = document.getElementById("btnPostComment");
const commentText = document.getElementById("commentText");
const commentStatus = document.getElementById("commentStatus");

btnPostComment?.addEventListener("click", () => {
  const text = commentText?.value?.trim();
  if (!text) {
    commentStatus.textContent = "Please write something first!";
    commentStatus.style.color = "#d32f2f";
    return;
  }

  commentStatus.textContent = "Comment posted! (Not really, but visually it works 😉)";
  commentStatus.style.color = "#28a745";

  if (commentText) commentText.value = "";

  setTimeout(() => {
    if (commentStatus) commentStatus.textContent = "";
  }, 3000);
});

// ===== Cookie detection (third-party) =====
const thirdPartyCookiesStatus = document.getElementById("thirdPartyCookiesStatus");
const btnRecheck3P = document.getElementById("btnRecheck3P");

async function check3PCookies() {
  if (!thirdPartyCookiesStatus) return;
  thirdPartyCookiesStatus.textContent = "Checking…";
  thirdPartyCookiesStatus.className = "status-badge status-unknown";

  try {
    const testUrl = "https://cdn.jsdelivr.net/gh/you/nothing@main/ping.json";
    const res = await fetch(testUrl, { credentials: "include" });
    const hasThirdParty = document.cookie.includes("test");

    if (hasThirdParty) {
      thirdPartyCookiesStatus.textContent = "Allowed";
      thirdPartyCookiesStatus.className = "status-badge status-allowed";
    } else {
      thirdPartyCookiesStatus.textContent = "Blocked";
      thirdPartyCookiesStatus.className = "status-badge status-blocked";
    }
  } catch {
    thirdPartyCookiesStatus.textContent = "Likely Blocked";
    thirdPartyCookiesStatus.className = "status-badge status-blocked";
  }
}

btnRecheck3P?.addEventListener("click", check3PCookies);

// ===== Clear site data =====
const btnClearData = document.getElementById("btnClearData");
const siteDataStatus = document.getElementById("siteDataStatus");

btnClearData?.addEventListener("click", () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    if (siteDataStatus) {
      siteDataStatus.textContent = "✓ Cleared";
      siteDataStatus.style.color = "#28a745";
      setTimeout(() => { siteDataStatus.textContent = ""; }, 2000);
    }
  } catch {
    if (siteDataStatus) {
      siteDataStatus.textContent = "✗ Failed";
      siteDataStatus.style.color = "#d32f2f";
    }
  }
});

// ===== Initialize everything on load =====
document.addEventListener("DOMContentLoaded", () => {
  slideController.refresh();
  slideController.setupObserver();
  initStaticStats();
  checkPopupWhySection();
  check3PCookies();
});
