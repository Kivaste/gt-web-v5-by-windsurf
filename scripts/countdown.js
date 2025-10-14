import { formatTemplate, onTranslationsApplied, t } from './localization.js';

let years = 9999;
let days = 999;
let hours = 99;
let minutes = 99;
let seconds = 99;

const inlineCountdownSelector = '[data-countdown-el]';
let countdownTimerId = null;

function getCountdownTargets() {
  const targets = [];
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) targets.push(countdownEl);
  document.querySelectorAll(inlineCountdownSelector).forEach((el) => targets.push(el));
  return targets;
}

function updateCountdownText() {
  const targets = getCountdownTargets();
  if (!targets.length) return;
  const template = t('banner.red.countdownFormat', '{{years}}y {{days}}d {{hours}}h {{minutes}}m {{seconds}}s');
  const text = formatTemplate(template, { years, days, hours, minutes, seconds });
  targets.forEach((el) => {
    el.textContent = text;
  });
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
  if (!getCountdownTargets().length) return;
  if (countdownTimerId !== null) return;
  updateCountdownText();
  countdownTimerId = window.setInterval(tickCountdown, 1000);
}

function initCountdown() {
  startCountdownIfNeeded();
  onTranslationsApplied(updateCountdownText);
}

export { initCountdown, startCountdownIfNeeded, updateCountdownText };
