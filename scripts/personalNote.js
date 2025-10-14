import { getLocalizedArray, onTranslationsApplied } from './localization.js';

const PERSONAL_NOTE_ROTATOR_FALLBACK = [
  'gadgets',
  'phone',
  'attention',
  'social media',
  'computer',
  'emails',
  'tech',
  'news',
  'ads'
];

let personalNoteRotatorInterval = null;

function stopPersonalNoteRotator() {
  if (personalNoteRotatorInterval !== null) {
    clearInterval(personalNoteRotatorInterval);
    personalNoteRotatorInterval = null;
  }
}

function getPersonalNoteRotatingItems() {
  return getLocalizedArray('slides.personalNote.rotatingItems', PERSONAL_NOTE_ROTATOR_FALLBACK);
}

function initPersonalNoteRotator() {
  const rotator = document.querySelector('.personal-note-rotator');
  stopPersonalNoteRotator();

  if (!rotator) {
    return;
  }

  const items = getPersonalNoteRotatingItems();
  if (!items.length) {
    rotator.textContent = '';
    return;
  }

  rotator.setAttribute('aria-live', 'polite');
  rotator.setAttribute('aria-atomic', 'true');

  let index = 0;
  const setItem = () => {
    const next = items[index];
    rotator.textContent = next;
    index = (index + 1) % items.length;
  };

  setItem();

  personalNoteRotatorInterval = window.setInterval(setItem, 1600);
}

function initPersonalNote() {
  initPersonalNoteRotator();
  onTranslationsApplied(() => {
    initPersonalNoteRotator();
  });
}

export { initPersonalNote, initPersonalNoteRotator, stopPersonalNoteRotator };
