import { initCountdown } from './countdown.js';
import { initDataTrail } from './dataTrail.js';
import { initHero } from './hero.js';
import { initializeLocalization } from './localization.js';
import { initPersonalNote } from './personalNote.js';
import { initPopup } from './popup.js';
import { initSlides } from './slides.js';
import { initComments } from './comments.js';
import { initHooked } from './hooked.js';

async function bootstrap() {
  try {
    await initializeLocalization();
  } catch (err) {
    console.error('Localization failed', err);
  }

  initHero();
  initSlides();
  initCountdown();
  initPopup();
  initPersonalNote();
  initDataTrail();
  initComments();
  initHooked();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
