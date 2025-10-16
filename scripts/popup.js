import { onTranslationsApplied, t } from './localization.js';
import { onRedBannerEvent, onTopReturn, setNavigationBlocked, slideController } from './slides.js';

let popup = null;
let popupScaler = null;
let popupDialog = null;
let popupClose = null;
let popupGhostClose = null;
let popupTitle = null;
let popupDesc = null;
let btnPrimary = null;
let btnGhost = null;

let popupOpen = false;
let focusRestoreEl = null;
let activePopupReason = null;
let redBannerPopupTimer = null;
let exitIntentHandlerBound = false;
let scrollListenerBound = false;
let popupInitialized = false;

const seenReasons = new Set();
const popupSeenSubscribers = new Set();

let lastScrollY = window.scrollY;
let lastScrollT = performance.now();

const POPUP_REASONS_LIST = ['fast-to-top', 'exit-intent', 'red-banner'];

function hasSeen(reason) {
  return seenReasons.has(reason);
}

function markSeen(reason) {
  if (!reason) return;
  if (!seenReasons.has(reason)) {
    seenReasons.add(reason);
    notifyPopupSeen();
  }
}

function hasSeenAnyPopup() {
  return seenReasons.size > 0;
}

function onPopupSeen(fn) {
  if (typeof fn !== 'function') return () => {};
  popupSeenSubscribers.add(fn);
  return () => popupSeenSubscribers.delete(fn);
}

function notifyPopupSeen() {
  popupSeenSubscribers.forEach((fn) => {
    try {
      fn({ reasons: Array.from(seenReasons) });
    } catch (err) {
      console.error('Popup seen subscriber failed', err);
    }
  });
}

function clearRedBannerPopupTimer() {
  if (redBannerPopupTimer !== null) {
    clearTimeout(redBannerPopupTimer);
    redBannerPopupTimer = null;
  }
}

function getSharedPopupCopy() {
  return {
    title: t('popups.shared.title', 'Why a Pop-Up?'),
    desc: t('popups.shared.desc', "Last-ditch guilt trip. Clock runs out or you try to leave.<br>You hate it. It works anyway."),
    primary: t('popups.shared.primary', "I see what's going on!"),
    secondary: t('popups.shared.secondary', 'WTF is happening?')
  };
}

function applyPopupCopy(copy) {
  if (!copy) return;
  if (popupTitle) popupTitle.textContent = copy.title;
  if (popupDesc) popupDesc.innerHTML = copy.desc;
  if (btnPrimary) btnPrimary.textContent = copy.primary;
  if (btnGhost) btnGhost.textContent = copy.secondary;
}

function localizePopupCopy() {
  if (!popupOpen) return;
  applyPopupCopy(getSharedPopupCopy());
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
  popupScaler.style.setProperty('--origin-x', `${originX}px`);
  popupScaler.style.setProperty('--origin-y', `${originY}px`);
}

function hidePopup() {
  if (!popupOpen || !popup) return;
  popupOpen = false;
  popup.classList.remove('open');
  popup.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
  setNavigationBlocked(false);

  document.removeEventListener('keydown', onPopupKeydown);
  popup.removeEventListener('click', onBackdropClick);
  popupClose?.removeEventListener('click', hidePopup);
  popupGhostClose?.removeEventListener('click', hidePopup);

  activePopupReason = null;

  if (focusRestoreEl) {
    try {
      focusRestoreEl.focus();
    } catch (err) {
      console.error('Failed to restore focus after popup', err);
    }
    focusRestoreEl = null;
  }
}

function onPopupKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    hidePopup();
    return;
  }
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
    return;
  }
  if (e.key === 'Tab') {
    const focusables = popup.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    const list = Array.from(focusables).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function onBackdropClick(e) {
  if (e.target === popup) hidePopup();
}

function shouldAdvanceAfterPopup() {
  const controller = slideController;
  if (!controller) return false;
  const index = controller.index ?? 0;
  return index >= 0 && index <= 4;
}

function onPopupPrimaryClick() {
  if (!popupOpen) return;
  hidePopup();
  if (shouldAdvanceAfterPopup()) {
    slideController?.goNext?.({ source: 'popup-primary' });
  }
}

function onPopupSecondaryClick() {
  if (!popupOpen) return;
  hidePopup();
  if (shouldAdvanceAfterPopup()) {
    slideController?.goNext?.({ source: 'popup-secondary' });
  }
}

function showPopup(reason, originRect = null) {
  if (!popup || popupOpen) return;
  if (hasSeenAnyPopup()) return;

  clearRedBannerPopupTimer();
  activePopupReason = reason || null;
  markSeen(reason || 'unknown');

  const copy = getSharedPopupCopy();
  applyPopupCopy(copy);

  setPopupOriginFromRect(originRect);

  popup.setAttribute('aria-hidden', 'false');
  popup.classList.add('open');
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
  setNavigationBlocked(true);
  popupOpen = true;

  focusRestoreEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  popupDialog?.focus();

  document.addEventListener('keydown', onPopupKeydown);
  popup.addEventListener('click', onBackdropClick);
  popupClose?.addEventListener('click', hidePopup);
  popupGhostClose?.addEventListener('click', hidePopup);
}

function scheduleRedBannerPopup(rectProvider) {
  if (hasSeenAnyPopup() || popupOpen) return;
  clearRedBannerPopupTimer();
  redBannerPopupTimer = setTimeout(() => {
    redBannerPopupTimer = null;
    if (hasSeenAnyPopup() || popupOpen) return;
    const rect = rectProvider?.() || null;
    showPopup('red-banner', rect);
  }, 1300);
}

function handleRedBannerEvent(event) {
  if (!event || !event.type) return;
  if (event.type === 'at-slide') {
    scheduleRedBannerPopup(event.getRect);
  } else if (event.type === 'away' || event.type === 'hide') {
    clearRedBannerPopupTimer();
  }
}

function onFastTopScroll() {
  if (hasSeenAnyPopup() || popupOpen) return;

  const now = performance.now();
  const y = window.scrollY;
  const dy = lastScrollY - y;
  const dt = Math.max(1, now - lastScrollT);
  const velocity = (dy / dt) * 1000;
  const distanceQuickReturn = dy > 400;
  const timeQuickReturn = dt < 800;

  if (y < 200 && (velocity > 1200 || (distanceQuickReturn && timeQuickReturn))) {
    showPopup('fast-to-top', null);
  }

  lastScrollY = y;
  lastScrollT = now;
}

function onMouseOut(e) {
  if (hasSeenAnyPopup() || popupOpen) return;
  if (!e.relatedTarget && e.clientY <= 0) {
    showPopup('exit-intent', null);
    document.removeEventListener('mouseout', onMouseOut);
    exitIntentHandlerBound = false;
  }
}

function bindExitIntent() {
  if (exitIntentHandlerBound) return;
  document.addEventListener('mouseout', onMouseOut);
  exitIntentHandlerBound = true;
}

function bindScrollListener() {
  if (scrollListenerBound) return;
  window.addEventListener('scroll', onFastTopScroll, { passive: true });
  scrollListenerBound = true;
}

function handleTopReturn() {
  if (hasSeenAnyPopup() || popupOpen) return;
  showPopup('fast-to-top', null);
}

function initPopup() {
  if (popupInitialized) {
    return;
  }

  const root = document.getElementById('popup');
  if (!root) {
    window.requestAnimationFrame(initPopup);
    return;
  }

  popup = root;
  popupScaler = popup.querySelector('.popup-scaler');
  popupDialog = popup.querySelector('.popup-dialog');
  popupClose = popup.querySelector('.popup-close');
  popupGhostClose = popup.querySelector('[data-close]');
  popupTitle = popup.querySelector('#popupTitle');
  popupDesc = popup.querySelector('#popupDesc');
  btnPrimary = popup.querySelector('.btn-primary');
  btnGhost = popup.querySelector('.btn-ghost');

  btnPrimary?.addEventListener('click', onPopupPrimaryClick);
  btnGhost?.addEventListener('click', onPopupSecondaryClick);

  bindExitIntent();
  bindScrollListener();

  onTopReturn(handleTopReturn);
  onRedBannerEvent((event) => {
    if (event?.type === 'at-slide') {
      scheduleRedBannerPopup(event.getRect);
    } else if (event?.type === 'away' || event?.type === 'hide') {
      clearRedBannerPopupTimer();
    }
  });

  onTranslationsApplied(localizePopupCopy);
  popupInitialized = true;
}

function getPopupReasons() {
  return POPUP_REASONS_LIST.slice();
}

export {
  getPopupReasons,
  hasSeenAnyPopup,
  hidePopup,
  initPopup,
  onPopupSeen,
  showPopup
};
