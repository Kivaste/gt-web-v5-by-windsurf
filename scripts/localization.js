const DEFAULT_LOCALE = 'en';
const LOCALE_STORAGE_KEY = 'gt-locale';
const AVAILABLE_LOCALES = ['en', 'et'];

let translations = {};
let fallbackTranslations = {};
let currentLocale = DEFAULT_LOCALE;
let fallbackLoaded = false;
const loggedMissingKeys = new Set();
const translationSubscribers = new Set();
const localeSubscribers = new Set();

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

function notifyTranslationsApplied() {
  translationSubscribers.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('Translation subscriber failed', err);
    }
  });
}

function notifyLocaleChanged() {
  localeSubscribers.forEach((fn) => {
    try {
      fn(currentLocale);
    } catch (err) {
      console.error('Locale subscriber failed', err);
    }
  });
}

function applyTranslations() {
  document.documentElement.lang = currentLocale;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const value = t(key);
    if (value !== undefined && value !== null) {
      el.innerHTML = value;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const value = t(key);
    if (value !== undefined && value !== null) {
      el.setAttribute('placeholder', value);
    }
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.dataset.i18nAriaLabel;
    const value = t(key);
    if (value !== undefined && value !== null) {
      el.setAttribute('aria-label', value);
    }
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const mapping = el.dataset.i18nAttr;
    if (!mapping) return;
    mapping.split(';').forEach((entry) => {
      const [attr, key] = entry.split(':').map((part) => part && part.trim()).filter(Boolean);
      if (!attr || !key) return;
      const value = t(key);
      if (value === undefined || value === null) return;
      if (attr === 'textContent') {
        el.textContent = value;
        return;
      }
      el.setAttribute(attr, value);
      if (attr.startsWith('data-')) {
        const dataKey = attr
          .slice(5)
          .split('-')
          .map((segment, index) => (index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1)))
          .join('');
        if (dataKey) {
          el.dataset[dataKey] = value;
        }
      }
    });
  });

  notifyTranslationsApplied();
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

function formatTemplate(template, values) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
  });
}

function deriveLocaleFromPath() {
  const segments = (window.location.pathname || '').split('/').filter(Boolean);
  if (!segments.length) return null;
  const last = segments[segments.length - 1].toLowerCase();
  return AVAILABLE_LOCALES.includes(last) ? last : null;
}

function resolveContentUrl(locale) {
  const directoryUrl = new URL('.', window.location.href);
  return new URL(`content/${locale}.json`, directoryUrl).href;
}

function updateLocaleInUrl(locale) {
  if (!window.history || typeof window.history.replaceState !== 'function') {
    return;
  }

  const url = new URL(window.location.href);
  const segments = url.pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const hasFileExtension = lastSegment && lastSegment.includes('.') && !AVAILABLE_LOCALES.includes(lastSegment);

  if (hasFileExtension) {
    return;
  }

  if (segments.length && AVAILABLE_LOCALES.includes(lastSegment)) {
    segments.pop();
  }

  if (locale !== DEFAULT_LOCALE) {
    segments.push(locale);
  }

  const hadTrailingSlash = url.pathname.endsWith('/') && url.pathname !== '/';
  let newPathname = segments.length ? `/${segments.join('/')}` : '/';
  if (hadTrailingSlash && !newPathname.endsWith('/')) {
    newPathname += '/';
  }

  if (newPathname === url.pathname) {
    return;
  }

  const newUrl = `${newPathname}${url.search}${url.hash}`;
  window.history.replaceState(null, '', newUrl);
}

async function loadLocaleData(locale) {
  const candidate = AVAILABLE_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const response = await fetch(resolveContentUrl(candidate), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load locale: ${candidate}`);
  return { data: await response.json(), locale: candidate };
}

async function setLocale(locale) {
  const { data, locale: resolved } = await loadLocaleData(locale);
  translations = data;
  currentLocale = resolved;
  localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
  updateLocaleInUrl(resolved);
  applyTranslations();
  notifyLocaleChanged();
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

function onTranslationsApplied(fn) {
  if (typeof fn !== 'function') return;
  translationSubscribers.add(fn);
}

function onLocaleChanged(fn) {
  if (typeof fn !== 'function') return;
  localeSubscribers.add(fn);
}

function getLocalizedArray(key, fallback = []) {
  const direct = lookup(translations, key);
  if (Array.isArray(direct) && direct.length) {
    return direct.slice();
  }
  const fb = lookup(fallbackTranslations, key);
  if (Array.isArray(fb) && fb.length) {
    return fb.slice();
  }
  return Array.isArray(fallback) ? fallback.slice() : [];
}

export {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  formatTemplate,
  getLocalizedArray,
  initializeLocalization,
  onLocaleChanged,
  onTranslationsApplied,
  setLocale,
  t
};
