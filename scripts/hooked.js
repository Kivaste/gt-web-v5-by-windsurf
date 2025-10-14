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

  if (!slotButtons.length || !overlay || !picker || !stageList) {
    return;
  }

  const assignments = new Array(slotButtons.length).fill(null);
  let activeSlotIndex = null;
  let lastActiveElement = null;

  function findStage(stageId) {
    return HOOKED_STAGES.find((stage) => stage.id === stageId) || null;
  }

  function updateSlotDisplay(slotIndex) {
    const slot = slotButtons[slotIndex];
    if (!slot) return;

    const stageId = assignments[slotIndex];
    const valueEl = slot.querySelector('[data-slot-value]');
    const descEl = slot.querySelector('[data-slot-desc]');

    if (!stageId) {
      slot.classList.remove('is-filled');
      slot.removeAttribute('data-stage');
      valueEl.textContent = 'Select a stage';
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
    valueEl.textContent = stage.title;
    if (descEl) {
      const examples = stage.examples.join(', ');
      descEl.textContent = `${stage.summary}. Examples: ${examples}`;
    }
  }

  function closePicker() {
    if (!overlay) return;
    overlay.classList.remove('is-active');
    overlay.hidden = true;
    document.body.classList.remove('hooked-modal-open');
    activeSlotIndex = null;
    slotButtons.forEach((slot) => slot.classList.remove('is-active'));
    if (lastActiveElement) {
      lastActiveElement.focus({ preventScroll: true });
      lastActiveElement = null;
    }
  }

  function handleStageSelection(stageId) {
    if (activeSlotIndex === null) {
      return;
    }

    const existingIndex = assignments.findIndex((assigned, idx) => assigned === stageId && idx !== activeSlotIndex);
    if (existingIndex !== -1) {
      assignments[existingIndex] = null;
      updateSlotDisplay(existingIndex);
    }

    assignments[activeSlotIndex] = stageId;
    updateSlotDisplay(activeSlotIndex);
    closePicker();
  }

  function renderStageList() {
    const activeStageId = assignments[activeSlotIndex] || null;
    const usedElsewhere = new Set(assignments.filter((stageId, idx) => stageId && idx !== activeSlotIndex));

    const available = [];
    const used = [];

    HOOKED_STAGES.forEach((stage) => {
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
    document.body.classList.add('hooked-modal-open');
    lastActiveElement = slotButtons[slotIndex];

    requestAnimationFrame(() => {
      const firstOption = stageList.querySelector('.hooked-stage-option');
      firstOption?.focus();
    });
  }

  slotButtons.forEach((slot, index) => {
    slot.addEventListener('click', () => {
      openPickerForSlot(index);
    });
  });

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
}

export { initHooked };
