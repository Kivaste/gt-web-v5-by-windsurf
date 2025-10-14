let reduceMotion = false;
const listeners = new Set();
let mediaQueryList = null;

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn(reduceMotion);
    } catch (err) {
      console.error('Motion listener failed', err);
    }
  });
}

function handleMediaChange(event) {
  reduceMotion = event.matches;
  notifyListeners();
}

function initMotionPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    reduceMotion = false;
    return;
  }

  mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduceMotion = Boolean(mediaQueryList.matches);

  mediaQueryList.addEventListener?.('change', handleMediaChange);
}

function onMotionPreferenceChange(fn) {
  if (typeof fn !== 'function') return;
  listeners.add(fn);
}

function getReduceMotion() {
  return reduceMotion;
}

initMotionPreference();

export { getReduceMotion, onMotionPreferenceChange };
