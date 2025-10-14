import { getReduceMotion, onMotionPreferenceChange } from './motion.js';
import { startCountdownIfNeeded } from './countdown.js';

const slideChangeListeners = new Set();
const topReturnListeners = new Set();
const redBannerListeners = new Set();

let reduceMotion = getReduceMotion();
let navigationBlocked = false;

onMotionPreferenceChange((value) => {
  reduceMotion = value;
});

function getBannerSlide() {
  return document.getElementById('bannerSlide');
}

function getRedBannerSlide() {
  return document.getElementById('redBannerSlide');
}

function getYellowBanner() {
  return document.getElementById('yellowBanner');
}

function getRedBanner() {
  return document.getElementById('redBanner');
}

function getFreeMaterialsSlide() {
  return document.getElementById('freeMaterialsSlide');
}

function getDataTrailSection() {
  return document.getElementById('dataTrailSection');
}

function setupStaticScrollIndicators() {
  const heroIndicator = document.querySelector('#heroSlide .scroll-indicator');
  const arrowMarkup = heroIndicator?.querySelector('svg')?.outerHTML ||
    '<svg class="scroll-indicator__arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M5.2 10.4 L16 24 L26.8 10.4" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" /></svg>';
  const ariaLabel = heroIndicator?.getAttribute('aria-label') || 'Scroll to next section';

  const excludedIds = new Set(['heroSlide', 'redBannerSlide', 'callToActionSectionSecondary']);

  const slides = Array.from(document.querySelectorAll('.slide'));

  slides.forEach((slide) => {
    const id = slide.getAttribute('id') || '';
    if (excludedIds.has(id)) return;
    if (slide.querySelector('.scroll-indicator')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scroll-indicator scroll-indicator--static';
    button.setAttribute('aria-label', ariaLabel);
    button.innerHTML = arrowMarkup;

    button.addEventListener('click', () => {
      const currentSlides = slideController.slides;
      let targetIndex = currentSlides.indexOf(slide);
      if (targetIndex === -1) {
        targetIndex = slides.indexOf(slide);
      }
      if (targetIndex === -1) return;
      const nextIndex = Math.min(currentSlides.length - 1, targetIndex + 1);
      if (nextIndex === targetIndex) return;
      slideController.goTo(nextIndex, { source: 'static-scroll-indicator' });
    });

    slide.appendChild(button);
  });
}

function getRedBannerRect() {
  const slide = getRedBannerSlide();
  return slide?.getBoundingClientRect?.() || null;
}

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

    this.refresh();
    this.observer = null;
    this.setupObserver();
    this.updateRedBanner();
  }

  refresh() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.bannerIndex = this.slides.indexOf(getBannerSlide());
    this.redBannerIndex = this.slides.indexOf(getRedBannerSlide());
    this.freeMaterialsIndex = this.slides.indexOf(getFreeMaterialsSlide());
    this.dataTrailIndex = this.slides.indexOf(getDataTrailSection());
  }

  setupObserver() {
    if (!('IntersectionObserver' in window)) return;

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = this.slides.indexOf(entry.target);
          if (idx !== -1) this.handleIndexChange(idx);
        }
      });
    }, { threshold: 0.55 });

    this.slides.forEach((slide) => this.observer.observe(slide));
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

  goTo(index, { source = 'generic' } = {}) {
    if (navigationBlocked) return this.activeTransition;
    if (this.locked) return this.activeTransition;
    if (index < 0 || index >= this.slides.length) return this.activeTransition;

    const target = this.slides[index];
    if (!target) return this.activeTransition;

    this.locked = true;

    const run = async () => {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });

      this.handleIndexChange(index);

      if (this.unlockTimer) {
        clearTimeout(this.unlockTimer);
      }
      let delay = reduceMotion ? 650 : 700;
      if (source === 'keyboard') {
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
    notifySlideChange(index);
    this.updateRedBanner();
    trackTopReturn(index);
  }

  updateRedBanner(forceShow = false) {
    const redBanner = getRedBanner();
    if (!redBanner) return;
    const atRedBannerSlide = this.redBannerIndex !== -1 && this.index === this.redBannerIndex;
    const shouldShow = forceShow || atRedBannerSlide;

    if (shouldShow) {
      if (!this.redBannerShown) {
        redBanner.classList.add('is-visible');
        document.body.classList.add('red-banner-visible');
        this.redBannerShown = true;
        startCountdownIfNeeded();
        notifyRedBannerEvent({ type: 'show', getRect: getRedBannerRect });
      }
      if (atRedBannerSlide) {
        notifyRedBannerEvent({ type: 'at-slide', getRect: getRedBannerRect });
      } else {
        notifyRedBannerEvent({ type: 'away' });
      }
    } else if (this.redBannerShown) {
      redBanner.classList.remove('is-visible');
      document.body.classList.remove('red-banner-visible');
      this.redBannerShown = false;
      notifyRedBannerEvent({ type: 'hide' });
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

function notifySlideChange(index) {
  slideChangeListeners.forEach((fn) => {
    try {
      fn(index);
    } catch (err) {
      console.error('Slide listener failed', err);
    }
  });
}

function notifyTopReturn(payload) {
  topReturnListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error('Top-return listener failed', err);
    }
  });
}

function notifyRedBannerEvent(event) {
  redBannerListeners.forEach((fn) => {
    try {
      fn(event);
    } catch (err) {
      console.error('Red banner listener failed', err);
    }
  });
}

function trackTopReturn(index) {
  if (index > highestSlideIndexReached) {
    highestSlideIndexReached = index;
  }

  if (index === 0 && highestSlideIndexReached > 1) {
    notifyTopReturn({ index, highestSlideIndexReached });
  }
}

function furthestSlideHash() {
  const targetIndex = Math.max(0, highestSlideIndexReached);
  const id = slideIdByIndex[targetIndex];
  return id ? `#${id}` : '#whySimilar';
}

function handleKeyNav(e) {
  if (navigationBlocked) return;

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

let wheelAccumulatedDelta = 0;
let wheelCooldownUntil = 0;

const MIN_INSTANT_DELTA = 25;
const MIN_ACCUMULATED_DELTA = 60;

function handleWheel(e) {
  if (navigationBlocked) return;
  e.preventDefault();

  const now = performance.now();
  if (now < wheelCooldownUntil) {
    wheelAccumulatedDelta = 0;
    return;
  }

  if (slideController.locked) {
    wheelAccumulatedDelta = 0;
    return;
  }

  wheelAccumulatedDelta += e.deltaY;
  if (wheelAccumulatedDelta > MIN_ACCUMULATED_DELTA) {
    wheelAccumulatedDelta = MIN_ACCUMULATED_DELTA;
  } else if (wheelAccumulatedDelta < -MIN_ACCUMULATED_DELTA) {
    wheelAccumulatedDelta = -MIN_ACCUMULATED_DELTA;
  }

  const absoluteDelta = Math.abs(e.deltaY);
  const absoluteAccumulated = Math.abs(wheelAccumulatedDelta);

  let direction = 0;
  if (absoluteDelta >= MIN_INSTANT_DELTA) {
    direction = e.deltaY > 0 ? 1 : -1;
    wheelAccumulatedDelta = 0;
  } else if (absoluteAccumulated >= MIN_ACCUMULATED_DELTA) {
    direction = wheelAccumulatedDelta > 0 ? 1 : -1;
    wheelAccumulatedDelta = 0;
  }

  if (!direction) return;

  goToRelative(direction, { source: 'wheel' });
  const cooldown = reduceMotion ? 480 : 660;
  wheelCooldownUntil = now + cooldown;
}

document.addEventListener('wheel', handleWheel, { passive: false });

function goToSlide(index, options) {
  return slideController.goTo(index, options);
}

function goToRelative(delta, options) {
  if (delta > 0) return slideController.goNext(options);
  if (delta < 0) return slideController.goPrev(options);
  return slideController.activeTransition;
}

function initSlides() {
  slideController.refresh();
  slideController.setupObserver();
  setupStaticScrollIndicators();
}

function onSlideChange(fn) {
  if (typeof fn !== 'function') return () => {};
  slideChangeListeners.add(fn);
  return () => slideChangeListeners.delete(fn);
}

function onTopReturn(fn) {
  if (typeof fn !== 'function') return () => {};
  topReturnListeners.add(fn);
  return () => topReturnListeners.delete(fn);
}

function onRedBannerEvent(fn) {
  if (typeof fn !== 'function') return () => {};
  redBannerListeners.add(fn);
  return () => redBannerListeners.delete(fn);
}

function setNavigationBlocked(value) {
  navigationBlocked = Boolean(value);
}

export {
  furthestSlideHash,
  goToRelative,
  goToSlide,
  initSlides,
  onRedBannerEvent,
  onSlideChange,
  onTopReturn,
  setNavigationBlocked,
  slideController
};
