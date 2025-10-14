import { onTranslationsApplied, t } from './localization.js';

let btnPostComment = null;
let commentText = null;
let commentEmail = null;
let commentStatus = null;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function updateCommentButtonState() {
  if (!btnPostComment) return;
  const hasContent = Boolean(commentText?.value?.trim());
  const emailValue = commentEmail?.value?.trim();
  const emailIsValid = !emailValue || isValidEmail(emailValue);
  btnPostComment.disabled = !(hasContent && emailIsValid);
}

function handleCommentInput() {
  if (commentStatus) commentStatus.textContent = '';
  updateCommentButtonState();
}

function handleCommentSubmit() {
  const text = commentText?.value?.trim();
  const email = commentEmail?.value?.trim();

  if (!text) {
    if (commentStatus) {
      commentStatus.textContent = t('comment.form.error', 'Please write something first!');
      commentStatus.style.color = '#d32f2f';
    }
    return;
  }

  if (email && !isValidEmail(email)) {
    if (commentStatus) {
      commentStatus.textContent = t('comment.form.errorEmail', 'Please enter a valid email.');
      commentStatus.style.color = '#d32f2f';
    }
    commentEmail?.focus();
    return;
  }

  if (commentStatus) {
    commentStatus.textContent = t('comment.form.success', 'Comment posted! (Not really, but visually it works 😉)');
    commentStatus.style.color = '#28a745';
  }

  if (commentText) commentText.value = '';
  if (commentEmail) commentEmail.value = '';
  updateCommentButtonState();

  window.setTimeout(() => {
    if (commentStatus) commentStatus.textContent = '';
  }, 3000);
}

function initComments() {
  btnPostComment = document.getElementById('btnPostComment');
  commentText = document.getElementById('commentText');
  commentEmail = document.getElementById('commentEmail');
  commentStatus = document.getElementById('commentStatus');

  if (!btnPostComment || !commentText || !commentStatus) {
    window.requestAnimationFrame(initComments);
    return;
  }

  commentText.addEventListener('input', handleCommentInput);
  commentEmail?.addEventListener('input', handleCommentInput);
  btnPostComment.addEventListener('click', handleCommentSubmit);

  onTranslationsApplied(() => {
    updateCommentButtonState();
  });

  updateCommentButtonState();
}

export { initComments };
