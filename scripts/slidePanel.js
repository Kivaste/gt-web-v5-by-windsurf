import { onTranslationsApplied, t, translateSubtree } from './localization.js';
import { onSlideChange, setNavigationBlocked } from './slides.js';
const PANEL_SELECTOR = '[data-slide-panel]';
const PANEL_DRAWER_SELECTOR = '[data-slide-panel-drawer]';
const PANEL_BACKDROP_SELECTOR = '[data-slide-panel-backdrop]';
const PANEL_CLOSE_SELECTOR = '[data-slide-panel-close]';
const PANEL_BODY_SELECTOR = '[data-slide-panel-body]';
const PANEL_TITLE_SELECTOR = '[data-slide-panel-title]';
const PANEL_TRIGGER_ATTR = 'data-panel-id';
const BLOCKED_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);
const WHEEL_RELEASE_DELAY = 260;

function createFocusTrap(container) {
  const previousFocusStack = [];
  let focusable = [];
  let first = null;
  let last = null;

  function updateFocusable() {
    focusable = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => !node.hasAttribute('hidden'));
    first = focusable[0] || null;
    last = focusable[focusable.length - 1] || null;
  }

  function handleFocus(event) {
    if (!container.contains(event.target)) {
      first?.focus({ preventScroll: true });
    }
  }

  function handleKeydown(event) {
    if (event.key !== 'Tab') return;
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return {
    activate() {
      previousFocusStack.push(document.activeElement);
      updateFocusable();
      if (!focusable.length) {
        container.setAttribute('tabindex', '-1');
        container.focus({ preventScroll: true });
        return;
      }
      first?.focus({ preventScroll: true });
      document.addEventListener('focus', handleFocus, true);
      document.addEventListener('keydown', handleKeydown, true);
    },
    deactivate() {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('keydown', handleKeydown, true);
      const lastFocused = previousFocusStack.pop();
      if (lastFocused?.focus) {
        lastFocused.focus({ preventScroll: true });
      }
    },
    refresh() {
      updateFocusable();
    },
  };
}

function initSlidePanel() {
  const panel = document.querySelector(PANEL_SELECTOR);
  const drawer = panel?.querySelector(PANEL_DRAWER_SELECTOR);
  const backdrop = panel?.querySelector(PANEL_BACKDROP_SELECTOR);
  const closeButton = panel?.querySelector(PANEL_CLOSE_SELECTOR);
  const body = panel?.querySelector(PANEL_BODY_SELECTOR);
  const title = panel?.querySelector(PANEL_TITLE_SELECTOR);
  const templates = new Map();

  if (!panel || !drawer || !backdrop || !closeButton || !body || !title) {
    return;
  }

  document
    .querySelectorAll('template[data-panel-template]')
    .forEach((template) => {
      templates.set(template.dataset.panelTemplate, template);
    });

  if (!templates.size) {
    return;
  }

  const focusTrap = createFocusTrap(drawer);
  const docEl = document.documentElement;
  let activePanelId = null;
  let isOpen = false;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pendingNavUnblock = false;
  let windowWheelSuppressTimeout = null;
  const wheelEventOptions = { passive: false };

  const handleDrawerWheel = (event) => {
    event.preventDefault();
  };

  const handleDrawerKeydown = (event) => {
    if (BLOCKED_KEYS.has(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleWindowWheel = (event) => {
    if (isOpen || pendingNavUnblock) {
      event.preventDefault();
    }
  };

  function ensureWindowWheelSuppressed() {
    if (windowWheelSuppressTimeout) {
      clearTimeout(windowWheelSuppressTimeout);
      windowWheelSuppressTimeout = null;
    }
    window.addEventListener('wheel', handleWindowWheel, wheelEventOptions);
  }

  function scheduleWindowWheelRelease() {
    if (windowWheelSuppressTimeout) {
      clearTimeout(windowWheelSuppressTimeout);
    }
    windowWheelSuppressTimeout = window.setTimeout(() => {
      window.removeEventListener('wheel', handleWindowWheel, wheelEventOptions);
      windowWheelSuppressTimeout = null;
    }, WHEEL_RELEASE_DELAY);
  }

  function updateCloseButtonLabel() {
    const closeLabel = t('slidePanels.close', '← Back');
    closeButton.textContent = closeLabel;
    closeButton.setAttribute('aria-label', closeLabel);
  }

  updateCloseButtonLabel();
  onTranslationsApplied(updateCloseButtonLabel);

  const retranslatePanelBody = () => {
    if (body.childElementCount) {
      translateSubtree(body);
    }
  };

  onTranslationsApplied(retranslatePanelBody);

  function closePanel() {
    if (!isOpen) return;
    panel.classList.remove('is-visible');
    document.body.classList.remove('slide-panel-open');
    docEl.classList.remove('slide-panel-open');
    focusTrap.deactivate();
    body.innerHTML = '';
    activePanelId = null;
    isOpen = false;
    pendingNavUnblock = true;
    drawer.removeEventListener('wheel', handleDrawerWheel);
    drawer.removeEventListener('keydown', handleDrawerKeydown, true);

    if (reduceMotionQuery.matches) {
      panel.hidden = true;
      pendingNavUnblock = false;
      setNavigationBlocked(false);
      scheduleWindowWheelRelease();
    }
  }

  function openPanel(panelId, triggerLabel) {
    if (!templates.has(panelId)) {
      return;
    }

    const template = templates.get(panelId);
    body.innerHTML = '';
    const fragment = template.content.cloneNode(true);
    body.appendChild(fragment);
    translateSubtree(body);
    body.scrollTop = 0;
    drawer.scrollTop = 0;
    focusTrap.refresh();

    if (triggerLabel) {
      title.textContent = triggerLabel;
    } else {
      title.textContent = panelId;
    }

    panel.dataset.activePanel = panelId;
    panel.hidden = false;
    requestAnimationFrame(() => {
      panel.classList.add('is-visible');
      document.body.classList.add('slide-panel-open');
      docEl.classList.add('slide-panel-open');
      focusTrap.activate();
    });

    activePanelId = panelId;
    isOpen = true;
    setNavigationBlocked(true);
    ensureWindowWheelSuppressed();
    drawer.addEventListener('wheel', handleDrawerWheel, wheelEventOptions);
    drawer.addEventListener('keydown', handleDrawerKeydown, true);
  }

  function handleTriggerClick(event) {
    const trigger = event.target.closest(`[${PANEL_TRIGGER_ATTR}]`);
    if (!trigger) return;
    const panelId = trigger.getAttribute(PANEL_TRIGGER_ATTR);
    if (!panelId) return;
    event.preventDefault();
    const label = trigger.getAttribute('data-i18n')
      ? trigger.textContent.trim()
      : trigger.getAttribute('aria-label') || trigger.textContent.trim();
    openPanel(panelId, label);
  }

  function handleKeydown(event) {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      closePanel();
    }
  }

  document.addEventListener('click', handleTriggerClick);
  closeButton.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', handleKeydown);

  onSlideChange(() => {
    if (isOpen) {
      closePanel();
    }
  });

  document.addEventListener('slide-navigation-blocked', (event) => {
    if (!isOpen) return;
    const source = event?.detail?.source;
    if (source === 'history' || source === 'generic') {
      closePanel();
    }
  });

  panel.addEventListener('transitionend', (event) => {
    if (event.target !== panel) return;
    if (panel.classList.contains('is-visible')) return;
    if (isOpen) return;
    panel.hidden = true;
    panel.removeAttribute('data-active-panel');
    if (pendingNavUnblock) {
      setNavigationBlocked(false);
      pendingNavUnblock = false;
      scheduleWindowWheelRelease();
    }
  });

  return {
    openPanel,
    closePanel,
  };
}

export { initSlidePanel };
