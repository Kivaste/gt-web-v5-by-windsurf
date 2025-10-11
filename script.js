// Absurd countdown values
let years = 9999;
let days = 999;
let hours = 99;
let minutes = 99;
let seconds = 99;

// Countdown DOM reference
const countdownEl = document.getElementById("countdown");
const inlineCountdownSelector = '[data-countdown-el]';
let countdownTimerId = null;

function updateCountdownText() {
  const targets = [];
  if (countdownEl) targets.push(countdownEl);
  document.querySelectorAll(inlineCountdownSelector).forEach((el) => targets.push(el));
  if (!targets.length) return;
  const template = t('banner.red.countdownFormat', '{{years}}y {{days}}d {{hours}}h {{minutes}}m {{seconds}}s');
  const text = formatTemplate(template, { years, days, hours, minutes, seconds });
  targets.forEach((el) => {
    el.textContent = text;
  });
}

let activePopupReason = null;

function onPopupPrimaryClick() {
  if (!popupOpen) return;
  const reason = activePopupReason;
  hidePopup();
  if (reason === "fast-to-top") {
    const hash = btnPrimary?.getAttribute("data-target-hash") || furthestSlideHash();
    const targetSlide = hash ? document.querySelector(hash) : null;
    if (targetSlide) {
      const targetIndex = slideController.slides.indexOf(targetSlide);
      if (targetIndex !== -1) {
        goToSlide(targetIndex, { source: "popup" });
      } else {
        targetSlide.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }
    } else {
      goToSlide(Math.max(1, highestSlideIndexReached), { source: "popup" });
    }
  }
}

function onPopupSecondaryClick() {
  if (!popupOpen) return;
  const reason = activePopupReason;
  hidePopup();
  if (reason === "fast-to-top") {
    goToSlide(0, { source: "popup" });
  }
}

function applyHeroTitleVariant() {
  const heroTitleEl = document.querySelector('[data-i18n="hero.title"]');
  if (!heroTitleEl) return;

  const deviceType = detectDeviceType().toLowerCase();
  let key = 'hero.titleDefault';

  if (deviceType === 'mobile') {
    key = 'hero.titlePhone';
  }

  const existing = heroTitleEl.innerHTML;
  const fallbackVariant = t('hero.title') || existing;
  const variant = t(key) || fallbackVariant || existing;
  if (variant) {
    heroTitleEl.innerHTML = variant;
  }
}

function applyHeroSubtitleVariant() {
  const heroSubtitleEl = document.querySelector('[data-i18n="hero.subtitle"]');
  if (!heroSubtitleEl) return;

  const deviceType = detectDeviceType().toLowerCase();
  const target = deviceType === 'mobile' ? 'phone' : 'devices';

  const fallback = 'your first training on Taming your {{target}} starts now';
  const template = t('hero.subtitle', fallback) || fallback;
  heroSubtitleEl.innerHTML = formatTemplate(template, { target });
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
  if (!countdownEl && !document.querySelector(inlineCountdownSelector)) return;
  if (countdownTimerId !== null) return;
  updateCountdownText();
  countdownTimerId = window.setInterval(tickCountdown, 1000);
}

// ===== Localization =====
const DEFAULT_LOCALE = 'en';
const LOCALE_STORAGE_KEY = 'gt-locale';
const AVAILABLE_LOCALES = ['en', 'et'];
let translations = {};
let fallbackTranslations = {};
let currentLocale = DEFAULT_LOCALE;
let fallbackLoaded = false;
const loggedMissingKeys = new Set();

function lookup(source, path) {
  if (!source) return undefined;
  const segments = path.split('.');
  let value = source;
  for (const segment of segments) {
    if (value && Object.prototype.hasOwnProperty.call(value, segment)) {
      value = value[segment];
    } else {
      return undefined;
    }
  }
  return value;
}

function logMissingKey(locale, key) {
  const id = `${locale}:${key}`;
  if (loggedMissingKeys.has(id)) return;
  loggedMissingKeys.add(id);
  const suffix = locale === 'fallback' ? ' (fallback locale)' : '';
  console.warn(`[i18n] Missing translation key "${key}" for locale "${locale}"${suffix}.`);
}

function t(path, fallback = '') {
  if (!path) return fallback;
  const direct = lookup(translations, path);
  if (direct !== undefined) return direct;

  const fb = lookup(fallbackTranslations, path);
  if (fb !== undefined) {
    logMissingKey(currentLocale, path);
    return fb;
  }

  logMissingKey('fallback', path);
  return fallback;
}

function deriveLocaleFromPath() {
  const segments = (window.location.pathname || '').split('/').filter(Boolean);
  if (!segments.length) return null;
  const last = segments[segments.length - 1].toLowerCase();
  return AVAILABLE_LOCALES.includes(last) ? last : null;
}

function formatTemplate(template, values) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
     return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
  });
}

function applyTranslations() {
  document.documentElement.lang = currentLocale;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const value = t(key);
    if (value) {
      el.innerHTML = value;
    }
  });

  applyHeroTitleVariant();
  applyHeroSubtitleVariant();

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const value = t(key);
    if (value) {
      el.setAttribute('placeholder', value);
    }
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.dataset.i18nAriaLabel;
    const value = t(key);
    if (value) {
      el.setAttribute('aria-label', value);
    }
  });

  renderButtonClicks();
  updateCountdownText();
}

function localizePopupCopy() {
  if (!popupOpen) return;
  applyPopupCopy(getSharedPopupCopy());
}

async function loadLocaleData(locale) {
  const candidate = AVAILABLE_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const response = await fetch(`content/${candidate}.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load locale: ${candidate}`);
  return { data: await response.json(), locale: candidate };
}

async function setLocale(locale) {
  try {
    if (locale === currentLocale && Object.keys(translations).length) return;
    const { data, locale: resolved } = await loadLocaleData(locale);
    translations = data;
    currentLocale = resolved;
    localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
    applyTranslations();
    localizePopupCopy();
  } catch (err) {
    if (locale !== DEFAULT_LOCALE) {
      await setLocale(DEFAULT_LOCALE);
    }
  }
}

async function initializeLocalization() {
  if (!fallbackLoaded) {
    const { data } = await loadLocaleData(DEFAULT_LOCALE);
    fallbackTranslations = data;
    fallbackLoaded = true;
  }

  const urlLocale = deriveLocaleFromPath();
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  const initial = urlLocale || (stored && AVAILABLE_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE);
  await setLocale(initial);
}

// Motion preference
const mediaReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = mediaReduce.matches;
mediaReduce.addEventListener?.("change", (e) => (reduceMotion = e.matches));

// Core DOM references
const bannerSlide = document.getElementById("bannerSlide");
const redBannerSlide = document.getElementById("redBannerSlide");
const yellowBanner = document.getElementById("yellowBanner");
const redBanner = document.getElementById("redBanner");
const freeMaterialsSlide = document.getElementById("freeMaterialsSlide");
const dataTrailSection = document.getElementById("dataTrailSection");
const whyPopupSlide = document.getElementById("whyPopupSection");

// ===== Slide Controller =====
class SlideController {
  constructor() {
    this.slides = [];
    this.index = 0;
    this.locked = false;
    this.bannerIndex = -1;
    this.redBannerIndex = -1;
    this.activeTransition = Promise.resolve();
    this.unlockTimer = null;
    this.redBannerShown = false;
    this.freeMaterialsIndex = -1;
    this.dataTrailIndex = -1;
    this.whyPopupIndex = -1;

    this.refresh();
    this.observer = null;
    this.setupObserver();
    this.updateRedBanner();
  }

  refresh() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.bannerIndex = this.slides.indexOf(bannerSlide);
    this.redBannerIndex = this.slides.indexOf(redBannerSlide);
    this.freeMaterialsIndex = this.slides.indexOf(freeMaterialsSlide);
    this.whyPopupIndex = this.slides.indexOf(whyPopupSlide);
    this.dataTrailIndex = this.slides.indexOf(dataTrailSection);
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
    if (!hasSeen('why-popup') && this.whyPopupIndex !== -1 && this.index <= this.whyPopupIndex && index > this.whyPopupIndex) {
      index = this.whyPopupIndex;
      checkPopupWhySection();
    }
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
    if (!hasSeen('why-popup') && this.whyPopupIndex !== -1 && index > this.whyPopupIndex) {
      const guardSlide = this.slides[this.whyPopupIndex];
      if (guardSlide) {
        if (reduceMotion) {
          guardSlide.scrollIntoView();
        } else {
          guardSlide.scrollIntoView({ behavior: 'smooth' });
        }
      }
      index = this.whyPopupIndex;
      checkPopupWhySection();
    }
    this.index = index;
    this.updateRedBanner();
    trackTopReturn(index);
  }

  updateRedBanner(forceShow = false) {
    if (!redBanner) return;
    const atRedBannerSlide = this.redBannerIndex !== -1 && this.index === this.redBannerIndex;
    const shouldShow = forceShow || atRedBannerSlide;

    if (shouldShow) {
      if (!this.redBannerShown) {
        redBanner.classList.add('is-visible');
        document.body.classList.add('red-banner-visible');
        this.redBannerShown = true;
        startCountdownIfNeeded();
      }
      if (atRedBannerSlide) {
        scheduleRedBannerPopup();
      } else {
        clearRedBannerPopupTimer();
      }
    } else if (this.redBannerShown) {
      redBanner.classList.remove('is-visible');
      document.body.classList.remove('red-banner-visible');
      this.redBannerShown = false;
      clearRedBannerPopupTimer();
    }
  }
}

const slideController = new SlideController();

let highestSlideIndexReached = 0;
const slideIdByIndex = [];
(function buildSlideIndexMap() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  slides.forEach((slide, idx) => {
    slideIdByIndex[idx] = slide.getAttribute('id') || null;
  });
})();

function furthestSlideHash() {
  const targetIndex = Math.max(0, highestSlideIndexReached);
  const id = slideIdByIndex[targetIndex];
  return id ? `#${id}` : '#whySimilar';
}

function trackTopReturn(index) {
  if (index > highestSlideIndexReached) {
    highestSlideIndexReached = index;
  }

  if (index === 0 && highestSlideIndexReached > 1) {
    showPopup("fast-to-top", null);
  }
}

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

  // Accumulate wheel delta magnitude
  wheelDelta += Math.abs(e.deltaY);

  // Clear existing wheel timeout
  clearTimeout(wheelTimeout);

  // Reset accumulation after a short pause
  wheelTimeout = setTimeout(() => {
    wheelDelta = 0;
  }, 150);

  // Require either several small ticks or one large tick
  if (wheelDelta < 50 && Math.abs(e.deltaY) < 50) return;

  // Trigger slide move and cooldown
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

btnPrimary?.addEventListener("click", onPopupPrimaryClick);
btnGhost?.addEventListener("click", onPopupSecondaryClick);

const whySection = document.getElementById("whyPopupSection");

const seenReasons = new Set();
function hasSeen(reason) {
  return seenReasons.has(reason);
}
function markSeen(reason) {
  seenReasons.add(reason);
}

function hasSeenAnyPopup() {
  return seenReasons.size > 0;
}

let popupOpen = false;
let lastScrollY = window.scrollY;
let lastScrollT = performance.now();
let focusRestoreEl = null;
let redBannerPopupTimer = null;

const POPUP_REASONS_LIST = ["why-popup", "fast-to-top", "exit-intent", "red-banner"];

function clearRedBannerPopupTimer() {
  if (redBannerPopupTimer) {
    clearTimeout(redBannerPopupTimer);
    redBannerPopupTimer = null;
  }
}

function scheduleRedBannerPopup() {
  if (hasSeenAnyPopup() || popupOpen) return;
  clearRedBannerPopupTimer();
  redBannerPopupTimer = setTimeout(() => {
    redBannerPopupTimer = null;
    if (hasSeenAnyPopup() || popupOpen) return;
    if (slideController?.index !== undefined && slideController.redBannerIndex !== -1 && slideController.index !== slideController.redBannerIndex) {
      return;
    }
    const rect = redBannerSlide?.getBoundingClientRect?.() || null;
    showPopup('red-banner', rect);
  }, 1300);
}

function getSharedPopupCopy() {
  return {
    title: t('slides.whyPopup.title', "Why a Pop-Up?"),
    desc: t('slides.whyPopup.body', "A pop-up is your final \"don't leave yet\" moment—either timed with urgency or triggered as you close the page. Annoying? Maybe. Effective? Definitely."),
    primary: t('popups.shared.primary', "Got it"),
    secondary: t('popups.shared.secondary', "Close")
  };
}

function applyPopupCopy(copy) {
  if (popupTitle) {
    popupTitle.textContent = copy.title;
  }
  if (popupDesc) {
    popupDesc.textContent = copy.desc;
  }
  if (btnPrimary) {
    btnPrimary.textContent = copy.primary;
  }
  if (btnGhost) {
    btnGhost.textContent = copy.secondary;
  }
}

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
  if (hasSeenAnyPopup()) return;

  clearRedBannerPopupTimer();
  markSeen(reason);
  updatePopupStats();

  const copy = getSharedPopupCopy();
  applyPopupCopy(copy);
  if (btnPrimary) {
    if (reason === "fast-to-top") {
      btnPrimary.setAttribute("data-target-hash", furthestSlideHash());
      btnPrimary.dataset.popupAction = "return";
    } else {
      btnPrimary.removeAttribute("data-target-hash");
      delete btnPrimary.dataset.popupAction;
    }
  }

  setPopupOriginFromRect(originRect);

  popup.setAttribute("aria-hidden", "false");
  popup.classList.add("open");
  document.body.classList.add("modal-open");
  document.documentElement.classList.add("modal-open");
  document.removeEventListener('keydown', handleKeyNav);
  activePopupReason = reason;
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
  activePopupReason = null;

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
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown" || e.key === "Home" || e.key === "End") {
    e.preventDefault();
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
  if (hasSeenAnyPopup() || popupOpen) return;

  const rect = whySection.getBoundingClientRect();
  const viewportMid = window.innerHeight / 2;
  const halfY = rect.top + rect.height * 0.5;

  if (viewportMid >= halfY && rect.bottom > 0 && rect.top < window.innerHeight) {
    showPopup(reason, rect);
    return;
  }

  if (!checkPopupWhySection._observer && 'IntersectionObserver' in window) {
    checkPopupWhySection._observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          observer.disconnect();
          checkPopupWhySection._observer = null;
          const entryRect = entry.target.getBoundingClientRect();
          showPopup(reason, entryRect);
        }
      });
    }, { threshold: 0.45 });
    checkPopupWhySection._observer.observe(whySection);
  }
}

// Trigger 2: rapid scroll to top
function onFastTopScroll() {
  const reason = "fast-to-top";
  if (hasSeenAnyPopup() || popupOpen) return;

  const now = performance.now();
  const y = window.scrollY;
  const dy = lastScrollY - y;
  const dt = Math.max(1, now - lastScrollT);
  const velocity = (dy / dt) * 1000;
  const distanceQuickReturn = dy > 400;
  const timeQuickReturn = dt < 800;

  if (y < 200 && (velocity > 1200 || (distanceQuickReturn && timeQuickReturn))) {
    showPopup(reason, null);
  }

  lastScrollY = y;
  lastScrollT = now;
}

// Trigger 3: exit intent
function onMouseOut(e) {
  const reason = "exit-intent";
  if (hasSeenAnyPopup() || popupOpen) return;
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
const storyDeviceArticle = document.getElementById("storyDeviceArticle");
const storyDeviceNoun = document.getElementById("storyDeviceNoun");
const storyReferrerSentence = document.getElementById("storyReferrerSentence");
const storyLocation = document.getElementById("storyLocation");
const storyLocationPlace = document.getElementById("storyLocationPlace");
const storyLocationConnector = document.getElementById("storyLocationConnector");
const storyLocationISP = document.getElementById("storyLocationISP");
const storyLocationHyphen = document.getElementById("storyLocationHyphen");
const storyLocationASN = document.getElementById("storyLocationASN");
const storyTime = document.getElementById("storyTime");
const storyPopups = document.getElementById("storyPopups");
const storyButtonsList = document.getElementById("storyButtonsList");
const btnFetchIP = document.getElementById("btnFetchIP");
const abTestButtons = Array.from(document.querySelectorAll(".ab-test-button"));
const abTestCopy = document.getElementById("abTestCopy");
const abTestingInstruction = document.getElementById("abTestingInstruction");
const accordions = Array.from(document.querySelectorAll('[data-accordion]'));

let selectedAbVariant = null;

let sessionStart = Date.now();
let buttonClicks = Object.create(null);
buttonClicks["Guess my location"] = 0;

function escapeHtml(text) {
  if (text === undefined || text === null) return "";
  return String(text).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

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
  if (!ref) return t('stats.referrer.direct', 'Direct');
  try {
    return new URL(ref).hostname;
  } catch {
    return t('stats.referrer.direct', 'Direct');
  }
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return (h ? `${h}:` : "") + `${m}`.padStart(2, "0") + ":" + `${s}`.padStart(2, "0");
}

function describeDevice() {
  const os = detectOS();
  const deviceType = detectDeviceType();

  if (deviceType === "Mobile") {
    if (os === "Android") return "an Android Phone";
    if (os === "iOS") return "an iPhone";
    return "a mobile device";
  }

  if (deviceType === "Tablet") {
    if (os === "Android") return "an Android Tablet";
    if (os === "iOS") return "an iPad";
    return "a tablet";
  }

  if (os === "macOS") return "a Mac";
  if (os === "Windows") return "a Windows PC";
  if (os && os !== "Unknown") return `a ${os} device`;
  return "a device";
}

function describeReferrerSentence() {
  const referrer = document.referrer;
  const host = getReferrerHost();
  const directLabel = t('stats.referrer.direct', 'Direct');
  const isDirect = !referrer || !host || host === directLabel;
  if (isDirect) {
    return "and you came here directly with <strong>gadgetTamer.com</strong> on your address bar.";
  }
  const escapedHost = escapeHtml(host);
  return `and <strong>${escapedHost}</strong> sent you here.`;
}

function splitArticleAndNoun(text) {
  if (!text) return { article: "", noun: "" };
  const match = text.match(/^(a|an)\s+/i);
  if (!match) return { article: "", noun: text };
  const article = match[0];
  const noun = text.slice(article.length);
  return { article, noun };
}

function initStaticStats() {
  const devicePhrase = describeDevice();
  const { article, noun } = splitArticleAndNoun(devicePhrase);
  if (storyDeviceArticle) storyDeviceArticle.textContent = article;
  if (storyDeviceNoun) storyDeviceNoun.textContent = noun || "—";
  if (storyReferrerSentence) storyReferrerSentence.innerHTML = describeReferrerSentence();
  resetLocationDisplay();
  resetButtonList();
  renderButtonClicks();
  updatePopupStats();
}

function updateTimeOnSite() {
  storyTime && (storyTime.textContent = formatTime(Date.now() - sessionStart));
}
setInterval(updateTimeOnSite, 1000);

function updatePopupStats() {
  const count = POPUP_REASONS_LIST.reduce((acc, r) => acc + (hasSeen(r) ? 1 : 0), 0);
  const total = POPUP_REASONS_LIST.length;
  if (storyPopups) storyPopups.textContent = `${count}/${total}`;
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

function abTestLabelFor(variant, fallback) {
  if (variant === "A") return t('slides.abTesting.optionA', fallback);
  if (variant === "B") return t('slides.abTesting.optionB', fallback);
  return fallback;
}

function normalizeAbTestText(text) {
  if (!text) return "";
  return text
    .replace(/^\s*[AB]\.\s*/, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function composeAbTestCopy(variant, fallback) {
  const base = abTestLabelFor(variant, fallback);
  const cleaned = normalizeAbTestText(base);
  if (!cleaned) return "Cool.";
  const withPeriod = /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  const safe = escapeHtml(withPeriod);
  return `Cool. <em>${safe}</em>`;
}

function updateAbTestInstruction() {
  if (!abTestingInstruction) return;
  const device = detectDeviceType();
  const isTouch = device === "Mobile" || device === "Tablet";
  const key = isTouch ? "slides.abTesting.line1Tap" : "slides.abTesting.line1";
  const fallback = isTouch ? "Pick your favorite (tap):" : "Pick your favorite (click):";
  abTestingInstruction.textContent = t(key, fallback);
}

function setAbTestSelection(variant) {
  selectedAbVariant = variant || null;
  abTestButtons.forEach((btn) => {
    const isActive = variant !== null && btn.dataset.variant === variant;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  if (abTestCopy) {
    if (!variant) {
      abTestCopy.innerHTML = "Cool.";
    } else {
      const activeButton = abTestButtons.find((btn) => btn.dataset.variant === variant);
      const fallback = normalizeAbTestText(activeButton?.textContent || "");
      abTestCopy.innerHTML = composeAbTestCopy(variant, fallback);
    }
  }
}

abTestButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const variant = btn.dataset.variant;
    if (!variant) return;
    if (selectedAbVariant === variant) return;
    setAbTestSelection(variant);
  });
});

setAbTestSelection(null);
updateAbTestInstruction();

accordions.forEach((accordion) => {
  const triggers = Array.from(accordion.querySelectorAll('[data-accordion-trigger]'));
  const panels = Array.from(accordion.querySelectorAll('[data-accordion-panel]'));

  function closeAll(exceptId) {
    triggers.forEach((trigger) => {
      const controls = trigger.getAttribute("aria-controls");
      const isMatch = controls === exceptId;
      trigger.setAttribute("aria-expanded", isMatch ? "true" : "false");
    });

    panels.forEach((panel) => {
      if (panel.id === exceptId) {
        panel.hidden = false;
      } else {
        panel.hidden = true;
      }
    });
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const controls = trigger.getAttribute("aria-controls");
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        trigger.setAttribute("aria-expanded", "false");
        panels.forEach((panel) => {
          if (panel.id === controls) panel.hidden = true;
        });
        return;
      }

      closeAll(controls);
    });
  });
});

function setLocationDisplay(place, connector, isp, hyphen, asn) {
  const hasContent = Boolean(place) || Boolean(isp);
  if (storyLocation) {
    storyLocation.classList.toggle("is-populated", hasContent);
  }
  if (storyLocationPlace) {
    if (!place) {
      storyLocationPlace.textContent = "\u00A0";
    } else {
      const escaped = escapeHtml(place);
      const highlightPlace = !connector && !isp;
      storyLocationPlace.innerHTML = highlightPlace ? `<strong>${escaped}</strong>` : escaped;
    }
  }
  if (storyLocationConnector) storyLocationConnector.textContent = connector || "";
  if (storyLocationISP) storyLocationISP.textContent = isp || "";
  if (storyLocationHyphen) storyLocationHyphen.textContent = hyphen || "";
  if (storyLocationASN) storyLocationASN.textContent = asn || "";
}

function resetLocationDisplay() {
  setLocationDisplay(undefined, "", "", "", "");
}

function resetButtonList() {
  if (!storyButtonsList) return;
  const defaultText = storyButtonsList.dataset.defaultText || t('slides.dataTrail.noneYet', 'None yet');
  storyButtonsList.innerHTML = `<li>${defaultText}</li>`;
}

function renderButtonClicks() {
  if (!storyButtonsList) return;
  const entries = Object.entries(buttonClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (!entries.length) {
    resetButtonList();
    return;
  }

  storyButtonsList.innerHTML = entries
    .map(([label, count]) => `<li>${label}: ${count}</li>`)
    .join("");
}

function cleanISPName(value) {
  if (!value) return "";
  return value
    .replace(/^AS\d+\s+/i, "")
    .replace(/\s+\(?AS\d+\)?$/i, "")
    .replace(/\s+AS\b/i, "")
    .trim();
}

function formatConnectionParts(data) {
  const rawOrg = data.org || "";
  const isp = cleanISPName(rawOrg) || t('stats.isp.unknown', 'an unknown network');
  const connector = isp ? " · connecting through " : "";
  return { connector, isp, hyphen: "", asn: "" };
}

async function fetchIpLocation() {
  if (!storyLocation) return;
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("IP service unavailable");
    const data = await res.json();
    const city = data.city || "";
    const region = data.region || "";
    const country = data.country_name || data.country || "";
    const placeParts = [city, region, country].filter(Boolean);
    const place = placeParts.length ? placeParts.join(", ") : t('stats.location.unknown', 'Unknown location');
    const { connector, isp, hyphen, asn } = formatConnectionParts(data);
    setLocationDisplay(place, connector, isp, hyphen, asn);
  } catch (err) {
    const place = t('stats.location.unavailable', "Location unavailable - sorry, doesn't always work:(");
    setLocationDisplay(place, '', '', '', '');
  }
}
btnFetchIP?.addEventListener("click", (event) => {
  event.preventDefault();
  fetchIpLocation();
});

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  if (event.key !== "Enter" || event.repeat) return;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
  const target = event.target;
  if (!target) return;
  const tagName = target.tagName;
  const isEditable = target.isContentEditable;
  if (isEditable) return;
  if (tagName === "TEXTAREA" || tagName === "INPUT" || tagName === "SELECT" || tagName === "BUTTON") {
    return;
  }
  btnFetchIP?.click();
});

// ===== Comment form handler =====
const btnPostComment = document.getElementById("btnPostComment");
const commentText = document.getElementById("commentText");
const commentStatus = document.getElementById("commentStatus");

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function updateCommentButtonState() {
  if (!btnPostComment) return;
  const hasContent = Boolean(commentText?.value?.trim());
  const emailValue = commentEmail?.value?.trim();
  const emailIsValid = !emailValue || isValidEmail(emailValue);
  btnPostComment.disabled = !(hasContent && emailIsValid);
}

commentText?.addEventListener("input", () => {
  if (commentStatus) commentStatus.textContent = "";
  updateCommentButtonState();
});

commentEmail?.addEventListener("input", () => {
  if (commentStatus) commentStatus.textContent = "";
  updateCommentButtonState();
});

btnPostComment?.addEventListener("click", () => {
  const text = commentText?.value?.trim();
  const email = commentEmail?.value?.trim();
  if (!text) {
    commentStatus.textContent = t('comment.form.error', 'Please write something first!');
    commentStatus.style.color = "#d32f2f";
    return;
  }

  if (email && !isValidEmail(email)) {
    commentStatus.textContent = t('comment.form.errorEmail', 'Please enter a valid email.');
    commentStatus.style.color = "#d32f2f";
    commentEmail?.focus();
    return;
  }

  commentStatus.textContent = t('comment.form.success', 'Comment posted! (Not really, but visually it works 😉)');
  commentStatus.style.color = "#28a745";

  if (commentText) commentText.value = "";
  if (commentEmail) commentEmail.value = "";
  updateCommentButtonState();

  setTimeout(() => {
    if (commentStatus) commentStatus.textContent = "";
  }, 3000);
});

updateCommentButtonState();

// ===== Cookie detection (third-party) =====
const thirdPartyCookiesStatus = document.getElementById("thirdPartyCookiesStatus");
const btnRecheck3P = document.getElementById("btnRecheck3P");

async function check3PCookies() {
  if (!thirdPartyCookiesStatus) return;
  thirdPartyCookiesStatus.textContent = t('cookies.status.checking', 'Checking…');
  thirdPartyCookiesStatus.className = "status-badge status-unknown";

  try {
    const testUrl = "https://cdn.jsdelivr.net/gh/you/nothing@main/ping.json";
    const res = await fetch(testUrl, { credentials: "include" });
    const hasThirdParty = document.cookie.includes("test");

    if (hasThirdParty) {
      thirdPartyCookiesStatus.textContent = t('cookies.status.allowed', 'Allowed');
      thirdPartyCookiesStatus.className = "status-badge status-allowed";
    } else {
      thirdPartyCookiesStatus.textContent = t('cookies.status.blocked', 'Blocked');
      thirdPartyCookiesStatus.className = "status-badge status-blocked";
    }
  } catch {
    thirdPartyCookiesStatus.textContent = t('cookies.status.likelyBlocked', 'Likely Blocked');
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
      siteDataStatus.textContent = t('cookies.status.cleared', '✓ Cleared');
      siteDataStatus.style.color = "#28a745";
      setTimeout(() => { siteDataStatus.textContent = ""; }, 2000);
    }
  } catch {
    if (siteDataStatus) {
      siteDataStatus.textContent = t('cookies.status.failed', '✗ Failed');
      siteDataStatus.style.color = "#d32f2f";
    }
  }
});

// ===== Initialize everything on load =====
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeLocalization();
  } catch (err) {
    console.error("Localization failed", err);
  }

  applyHeroTitleVariant();
  applyHeroSubtitleVariant();
  startCountdownIfNeeded();

  const scrollIndicator = document.querySelector(".scroll-indicator");
  if (scrollIndicator) {
    window.setTimeout(() => {
      scrollIndicator.classList.add("is-visible");
    }, 1500);
  }

  slideController.refresh();
  slideController.setupObserver();
  initStaticStats();
  updateAbTestInstruction();
  checkPopupWhySection();
});
