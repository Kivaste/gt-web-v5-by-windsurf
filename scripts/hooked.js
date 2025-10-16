import { setNavigationBlocked } from './slides.js';

const HOOKED_STAGES = [
  {
    id: 'trigger',
    title: 'Trigger',
    summary: 'Cue that prompts you to act',
    examples: ['Push notification', 'Inbox badge', 'Boredom scroll']
  },
  {
    id: 'action',
    title: 'Action',
    summary: 'Simple behavior in anticipation of reward',
    examples: ['Open the app', 'Swipe to refresh', 'Tap the play button']
  },
  {
    id: 'variable-reward',
    title: 'Variable Reward',
    summary: 'Unpredictable payoff that hooks attention',
    examples: ['New likes or comments', 'Loot drop', 'Fresh content']
  },
  {
    id: 'investment',
    title: 'Investment',
    summary: 'Effort that increases the product’s future value',
    examples: ['Upload a photo', 'Follow friends', 'Save preferences']
  }
];

function shuffle(items) {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function initHooked() {
  const root = document.querySelector('[data-hooked-exercise]');
  if (!root) {
    return;
  }

  const slotButtons = Array.from(root.querySelectorAll('[data-slot]'));
  const overlay = root.querySelector('[data-stage-overlay]');
  const picker = overlay?.querySelector('.hooked-picker');
  const stageList = overlay?.querySelector('[data-stage-list]');
  const closeButton = overlay?.querySelector('[data-stage-close]');
  const docEl = document.documentElement;
  const videoTrigger = root.parentElement?.querySelector('[data-video-trigger]');
  const videoOverlay = root.parentElement?.querySelector('[data-video-overlay]');
  const videoCloseBtn = videoOverlay?.querySelector('[data-video-close]');

  if (!slotButtons.length || !overlay || !picker || !stageList) {
    return;
  }

  const assignments = new Array(slotButtons.length).fill(null);
  let activeSlotIndex = null;
  let lastActiveElement = null;
  let overlayOpen = false;

  function findStage(stageId) {
    return HOOKED_STAGES.find((stage) => stage.id === stageId) || null;
  }

  function updateSlotDisplay(slotIndex) {
    const slot = slotButtons[slotIndex];
    if (!slot) return;

    const stageId = assignments[slotIndex];
    const valueEl = slot.querySelector('[data-slot-value]');
    const descEl = slot.querySelector('[data-slot-desc]');
    const correctStage = slot.dataset.correctStage || null;

    if (!stageId) {
      slot.classList.remove('is-filled');
      slot.removeAttribute('data-stage');
      slot.classList.remove('is-correct', 'is-incorrect');
      slot.disabled = false;
      slot.removeAttribute('aria-disabled');
      valueEl.textContent = `Stage ${slotIndex + 1} slot`;
      if (descEl) {
        descEl.textContent = '';
      }
      return;
    }

    const stage = findStage(stageId);
    if (!stage) {
      return;
    }

    slot.classList.add('is-filled');
    slot.setAttribute('data-stage', stage.id);
    const isCorrect = correctStage && stage.id === correctStage;
    slot.classList.toggle('is-correct', Boolean(isCorrect));
    slot.classList.toggle('is-incorrect', !isCorrect);
    if (isCorrect) {
      slot.disabled = true;
      slot.setAttribute('aria-disabled', 'true');
    } else {
      slot.disabled = false;
      slot.removeAttribute('aria-disabled');
    }
    valueEl.textContent = stage.title;
    if (descEl) {
      descEl.textContent = stage.examples.join(', ');
    }

    updateVideoTriggerState();
  }

  function closePicker() {
    if (!overlay) return;
    overlay.classList.remove('is-active');
    overlay.hidden = true;
    if (overlayOpen) {
      document.body.classList.remove('hooked-modal-open', 'slide-panel-open');
      docEl.classList.remove('hooked-modal-open', 'slide-panel-open');
      setNavigationBlocked(false);
      overlayOpen = false;
    }
    activeSlotIndex = null;
    slotButtons.forEach((slot) => slot.classList.remove('is-active'));
    if (lastActiveElement) {
      lastActiveElement.focus({ preventScroll: true });
      lastActiveElement = null;
    }
  }

  function allSlotsCorrect() {
    return assignments.every((stageId, idx) => {
      if (!stageId) return false;
      const slot = slotButtons[idx];
      return slot?.classList.contains('is-correct');
    });
  }

  function updateVideoTriggerState() {
    if (!videoTrigger) {
      return;
    }
    const unlocked = allSlotsCorrect();
    videoTrigger.disabled = !unlocked;
    if (unlocked) {
      videoTrigger.removeAttribute('aria-disabled');
    } else {
      videoTrigger.setAttribute('aria-disabled', 'true');
    }
  }

  function handleStageSelection(stageId) {
    if (activeSlotIndex === null) {
      return;
    }

    const existingIndex = assignments.findIndex((assigned, idx) => assigned === stageId && idx !== activeSlotIndex);
    if (existingIndex !== -1) {
      const existingSlot = slotButtons[existingIndex];
      if (existingSlot?.classList.contains('is-correct')) {
        closePicker();
        return;
      }
      assignments[existingIndex] = null;
      updateSlotDisplay(existingIndex);
    }

    assignments[activeSlotIndex] = stageId;
    updateSlotDisplay(activeSlotIndex);
    closePicker();
  }

  function renderStageList() {
    const activeStageId = assignments[activeSlotIndex] || null;
    const lockedStages = new Set();
    const usedElsewhere = new Set();

    assignments.forEach((stageId, idx) => {
      if (!stageId || idx === activeSlotIndex) {
        return;
      }
      const slot = slotButtons[idx];
      if (slot?.classList.contains('is-correct')) {
        lockedStages.add(stageId);
        return;
      }
      usedElsewhere.add(stageId);
    });

    const available = [];
    const used = [];

    HOOKED_STAGES.forEach((stage) => {
      if (lockedStages.has(stage.id)) {
        return;
      }
      const isCurrent = stage.id === activeStageId;
      const isUsed = usedElsewhere.has(stage.id);
      const bucket = (isUsed && !isCurrent) ? used : available;
      bucket.push({ stage, isUsed, isCurrent });
    });

    const ordered = [...shuffle(available), ...shuffle(used)];

    stageList.innerHTML = '';
    ordered.forEach(({ stage, isUsed, isCurrent }) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hooked-stage-option';
      if (isUsed) {
        button.classList.add('is-used');
      }
      if (isCurrent) {
        button.classList.add('is-current');
      }
      button.setAttribute('data-stage', stage.id);
      button.innerHTML = `
        <span class="hooked-stage-option__title">${stage.title}</span>
        <span class="hooked-stage-option__summary">${stage.summary}</span>
        <span class="hooked-stage-option__examples">${stage.examples.join(' • ')}</span>
      `;
      button.addEventListener('click', () => {
        handleStageSelection(stage.id);
      });
      li.appendChild(button);
      stageList.appendChild(li);
    });
  }

  function openPickerForSlot(slotIndex) {
    if (activeSlotIndex === slotIndex) {
      closePicker();
      return;
    }
    activeSlotIndex = slotIndex;
    slotButtons.forEach((slot, idx) => {
      slot.classList.toggle('is-active', idx === slotIndex);
    });
    renderStageList();
    overlay.hidden = false;
    overlay.classList.add('is-active');
    document.body.classList.add('hooked-modal-open', 'slide-panel-open');
    docEl.classList.add('hooked-modal-open', 'slide-panel-open');
    setNavigationBlocked(true);
    overlayOpen = true;
    lastActiveElement = slotButtons[slotIndex];

    requestAnimationFrame(() => {
      const firstOption = stageList.querySelector('.hooked-stage-option');
      firstOption?.focus();
    });
  }

  slotButtons.forEach((slot, index) => {
    slot.addEventListener('click', () => {
      if (slot.disabled || slot.classList.contains('is-correct')) {
        return;
      }
      openPickerForSlot(index);
    });
  });

  function closeVideoOverlay() {
    if (!videoOverlay) return;
    videoOverlay.classList.remove('is-active');
    videoOverlay.hidden = true;
    document.body.classList.remove('hooked-modal-open', 'slide-panel-open');
    docEl.classList.remove('hooked-modal-open', 'slide-panel-open');
    setNavigationBlocked(false);
  }

  if (videoTrigger && videoOverlay) {
    videoTrigger.addEventListener('click', () => {
      if (videoTrigger.disabled) {
        return;
      }
      videoOverlay.hidden = false;
      videoOverlay.classList.add('is-active');
      document.body.classList.add('hooked-modal-open', 'slide-panel-open');
      docEl.classList.add('hooked-modal-open', 'slide-panel-open');
      setNavigationBlocked(true);
      videoOverlay.querySelector('button, [href], [tabindex]:not([tabindex="-1"])')?.focus();
    });

    if (videoCloseBtn) {
      videoCloseBtn.addEventListener('click', () => {
        closeVideoOverlay();
      });
    }

    videoOverlay.addEventListener('click', (event) => {
      if (event.target === videoOverlay) {
        closeVideoOverlay();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !videoOverlay.hidden) {
        closeVideoOverlay();
      }
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closePicker();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closePicker();
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) {
      closePicker();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePicker();
    }
  });

  updateVideoTriggerState();
}

export { initHooked };
