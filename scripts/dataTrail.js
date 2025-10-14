import { detectDeviceType, detectOS } from './device.js';
import { onTranslationsApplied, t } from './localization.js';
import { hasSeenAnyPopup, onPopupSeen } from './popup.js';

let storyDeviceNoun = null;
let storyReferrerSentence = null;
let storyTime = null;
let storyPopups = null;
let storyButtonsList = null;
let btnFetchIP = null;
let abTestButtons = [];
let abTestCopy = null;
let accordions = [];

let defaultLocationButtonText = '';
let loadingLocationButtonText = '';
const GUESS_LOCATION_LABEL_KEY = 'slides.dataTrail.guessLocationLabel';
const GUESS_LOCATION_LABEL_FALLBACK = 'Guess location';

let selectedAbVariant = null;
let sessionStart = Date.now();
let buttonClicks = Object.create(null);
let updateTimerId = null;
let documentClickHandlerBound = false;
let keydownHandlerBound = false;
let initialized = false;

function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  return String(text).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return char;
    }
  });
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

function describeReferrerSentence() {
  const referrer = document.referrer;
  const host = getReferrerHost();
  const directLabel = t('stats.referrer.direct', 'Direct');
  const isDirect = !referrer || !host || host === directLabel;
  if (isDirect) {
    return 'directly';
  }
  const escapedHost = escapeHtml(host);
  return `<strong>${escapedHost}</strong>`;
}

function describeDevice() {
  const os = detectOS();
  const deviceType = detectDeviceType();

  if (deviceType === 'Mobile') {
    if (os === 'Android') return 'an Android Phone';
    if (os === 'iOS') return 'an iPhone';
    return 'a mobile device';
  }

  if (deviceType === 'Tablet') {
    if (os === 'Android') return 'an Android Tablet';
    if (os === 'iOS') return 'an iPad';
    return 'a tablet';
  }

  if (os === 'macOS') return 'a Mac';
  if (os === 'Windows') return 'a Windows PC';
  if (os && os !== 'Unknown') return `a ${os} device`;
  return 'a device';
}

function splitArticleAndNoun(text) {
  if (!text) return { article: '', noun: '' };
  const match = text.match(/^(a|an)\s+/i);
  if (!match) return { article: '', noun: text };
  const article = match[0];
  const noun = text.slice(article.length);
  return { article, noun };
}

function updatePopupStats() {
  if (!storyPopups) return;
  const seenAny = hasSeenAnyPopup();
  const key = seenAny ? 'slides.dataTrail.popupSeen' : 'slides.dataTrail.popupNotSeen';
  const fallback = seenAny ? 'seen' : 'not seen';
  storyPopups.textContent = t(key, fallback);
}

function labelForButton(btn) {
  return (
    btn.getAttribute('aria-label') ||
    btn.title ||
    (btn.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) ||
    '(unlabeled button)'
  );
}

function recordButtonClick(btn) {
  if (!btn) return;
  const isGuessLocation = btn === btnFetchIP;
  const label = isGuessLocation
    ? t(GUESS_LOCATION_LABEL_KEY, GUESS_LOCATION_LABEL_FALLBACK)
    : labelForButton(btn);
  buttonClicks[label] = (buttonClicks[label] || 0) + 1;
  renderButtonClicks();
}

function renderButtonClicks() {
  if (!storyButtonsList) return;
  const entries = Object.entries(buttonClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (!entries.length) {
    resetButtonList();
    return;
  }

  storyButtonsList.innerHTML = entries
    .map(([label, count]) => `<li>${label}: ${count}</li>`)
    .join('');
}

function resetButtonList() {
  if (!storyButtonsList) return;
  const defaultText = storyButtonsList.dataset.defaultText || t('slides.dataTrail.noneYet', 'None yet');
  storyButtonsList.innerHTML = `<li>${defaultText}</li>`;
}

function setLocationDisplay(place, connector, isp) {
  if (!btnFetchIP) return;
  const hasContent = Boolean(place) || Boolean(isp);
  if (!hasContent) {
    btnFetchIP.textContent = defaultLocationButtonText;
    return;
  }

  const connectionPart = connector && isp ? `${connector}${isp}` : '';
  const displayText = [place, connectionPart].filter(Boolean).join('');
  btnFetchIP.textContent = displayText || defaultLocationButtonText;
}

function resetLocationDisplay() {
  setLocationDisplay('', '', '');
}

function cleanISPName(value) {
  if (!value) return '';
  return value
    .replace(/^AS\d+\s+/i, '')
    .replace(/\s+\(?AS\d+\)?$/i, '')
    .replace(/\s+AS\b/i, '')
    .trim();
}

function formatConnectionParts(data) {
  const rawOrg = data.org || '';
  const isp = cleanISPName(rawOrg) || t('stats.isp.unknown', 'an unknown network');
  const connector = isp ? ' · connecting through ' : '';
  return { connector, isp };
}

async function fetchIpLocation() {
  if (!btnFetchIP) return;
  try {
    btnFetchIP.disabled = true;
    btnFetchIP.textContent = loadingLocationButtonText;
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('IP service unavailable');
    const data = await res.json();
    const city = data.city || '';
    const region = data.region || '';
    const country = data.country_name || data.country || '';
    const placeParts = [city, region, country].filter(Boolean);
    const place = placeParts.length ? placeParts.join(', ') : t('stats.location.unknown', 'Unknown location');
    const { connector, isp } = formatConnectionParts(data);
    setLocationDisplay(place, connector, isp);
  } catch (err) {
    const place = t('stats.location.unavailable', "Location unavailable - sorry, doesn't always work:(");
    setLocationDisplay(place, '', '');
  } finally {
    if (btnFetchIP) {
      btnFetchIP.disabled = false;
    }
  }
}

function updateTimeOnSite() {
  if (!storyTime) return;
  const total = Math.floor((Date.now() - sessionStart) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const formatted = (hours ? `${hours}:` : '') + `${minutes}`.padStart(2, '0') + ':' + `${seconds}`.padStart(2, '0');
  storyTime.textContent = formatted;
}

function getAbTestCopy(variant) {
  if (variant === 'A') {
    return t(
      'slides.abTesting.copyA',
      "Split 100,000 visitors - half see A, half see B. Let the wallets vote.<br>That's called A/B testing."
    );
  }
  if (variant === 'B') {
    return t(
      'slides.abTesting.copyB',
      'Randomly show half the visitors A others B. Which copy gets more sales remains. Digital survival of the fittest aka A/B testing.'
    );
  }
  return '';
}

function setAbTestSelection(variant) {
  selectedAbVariant = variant || null;
  abTestButtons.forEach((btn) => {
    const isActive = variant !== null && btn.dataset.variant === variant;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  if (abTestCopy) {
    const copy = variant ? getAbTestCopy(variant) : '';
    abTestCopy.innerHTML = copy;
  }
}

function initAccordion(accordion) {
  const triggers = Array.from(accordion.querySelectorAll('[data-accordion-trigger]'));
  const panels = Array.from(accordion.querySelectorAll('[data-accordion-panel]'));

  function closeAll(exceptId) {
    triggers.forEach((trigger) => {
      const controls = trigger.getAttribute('aria-controls');
      const isMatch = controls === exceptId;
      trigger.setAttribute('aria-expanded', isMatch ? 'true' : 'false');
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
    trigger.addEventListener('click', () => {
      const controls = trigger.getAttribute('aria-controls');
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        trigger.setAttribute('aria-expanded', 'false');
        panels.forEach((panel) => {
          if (panel.id === controls) panel.hidden = true;
        });
        return;
      }

      closeAll(controls);
    });
  });
}

function handleDocumentClick(event) {
  const btn = event.target.closest('button');
  if (!btn) return;
  if (btn === btnFetchIP) return;
  recordButtonClick(btn);
}

function handleKeydown(event) {
  if (event.defaultPrevented) return;
  if (event.key !== 'Enter' || event.repeat) return;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
  const target = event.target;
  if (!target) return;
  const tagName = target.tagName;
  if (target.isContentEditable) return;
  if (tagName === 'TEXTAREA' || tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'BUTTON') {
    return;
  }
  btnFetchIP?.click();
}

function initStaticStats() {
  const devicePhrase = describeDevice();
  const { noun } = splitArticleAndNoun(devicePhrase);
  if (storyDeviceNoun) storyDeviceNoun.textContent = noun || '—';
  if (storyReferrerSentence) storyReferrerSentence.innerHTML = describeReferrerSentence();
  resetLocationDisplay();
  resetButtonList();
  renderButtonClicks();
  updatePopupStats();
}

function initDataTrail() {
  if (initialized) return;

  const dataTrailSection = document.getElementById('dataTrailSection');
  if (!dataTrailSection) {
    window.requestAnimationFrame(initDataTrail);
    return;
  }

  storyDeviceNoun = dataTrailSection.querySelector('#storyDeviceNoun');
  storyReferrerSentence = dataTrailSection.querySelector('#storyReferrerSentence');
  storyTime = dataTrailSection.querySelector('#storyTime');
  storyPopups = dataTrailSection.querySelector('#storyPopups');
  storyButtonsList = dataTrailSection.querySelector('#storyButtonsList');
  btnFetchIP = dataTrailSection.querySelector('#btnFetchIP');
  abTestButtons = Array.from(document.querySelectorAll('.ab-test-button'));
  abTestCopy = document.getElementById('abTestCopy');
  accordions = Array.from(document.querySelectorAll('[data-accordion]'));

  const essentialElements = [storyDeviceNoun, storyReferrerSentence, storyTime, storyPopups, storyButtonsList];
  const essentialsReady = essentialElements.every(Boolean);
  if (!essentialsReady) {
    window.requestAnimationFrame(initDataTrail);
    return;
  }

  defaultLocationButtonText = btnFetchIP?.dataset.defaultText || 'Want me to guess your location?*';
  loadingLocationButtonText = btnFetchIP?.dataset.loadingText || 'Guess location';

  sessionStart = Date.now();
  buttonClicks = Object.create(null);

  initStaticStats();

  if (!updateTimerId) {
    updateTimeOnSite();
    updateTimerId = window.setInterval(updateTimeOnSite, 1000);
  }

  if (!documentClickHandlerBound) {
    document.addEventListener('click', handleDocumentClick);
    documentClickHandlerBound = true;
  }

  if (!keydownHandlerBound) {
    document.addEventListener('keydown', handleKeydown);
    keydownHandlerBound = true;
  }

  btnFetchIP?.addEventListener('click', (event) => {
    event.preventDefault();
    recordButtonClick(btnFetchIP);
    fetchIpLocation();
  });

  abTestButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const variant = btn.dataset.variant;
      if (!variant) return;
      if (selectedAbVariant === variant) return;
      setAbTestSelection(variant);
    });
  });

  setAbTestSelection(null);

  accordions.forEach((accordion) => initAccordion(accordion));

  onPopupSeen(updatePopupStats);
  onTranslationsApplied(() => {
    renderButtonClicks();
    updatePopupStats();
    if (selectedAbVariant) {
      setAbTestSelection(selectedAbVariant);
    }
  });

  initialized = true;
}

export { initDataTrail };
