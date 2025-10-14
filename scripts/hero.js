import { detectDeviceType } from './device.js';
import { formatTemplate, onTranslationsApplied, t } from './localization.js';
import { goToRelative } from './slides.js';
import { getReduceMotion } from './motion.js';

function setupScrollIndicator() {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (!scrollIndicator) {
    window.requestAnimationFrame(setupScrollIndicator);
    return;
  }

  if (scrollIndicator.dataset.enhanced === 'true') {
    return;
  }

  scrollIndicator.dataset.enhanced = 'true';

  const reveal = () => {
    scrollIndicator.classList.add('is-visible');
  };

  if (getReduceMotion()) {
    reveal();
  } else {
    window.setTimeout(reveal, 1500);
  }

  scrollIndicator.addEventListener('click', () => {
    goToRelative(1, { source: 'hero-arrow' });
    const nextSlide = document.querySelector('#whySimilar');
    if (nextSlide) {
      nextSlide.scrollIntoView({ behavior: getReduceMotion() ? 'auto' : 'smooth' });
    }
  });
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
  if (variant !== undefined && variant !== null) {
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

function initHero() {
  applyHeroTitleVariant();
  applyHeroSubtitleVariant();
  onTranslationsApplied(() => {
    applyHeroTitleVariant();
    applyHeroSubtitleVariant();
  });
  setupScrollIndicator();
}

export { applyHeroSubtitleVariant, applyHeroTitleVariant, initHero };
