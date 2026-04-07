// ─── Theme Toggle ──────────────────────────────────
function getPreferredTheme() {
  const stored = localStorage.getItem('noted-theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('noted-theme', theme);
}

setTheme(getPreferredTheme());

document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ─── Learn More Modal ──────────────────────────────
const learnMoreBtn = document.getElementById('learn-more-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');

learnMoreBtn.addEventListener('click', () => {
  modalOverlay.classList.add('active');
});

modalClose.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modalOverlay.classList.remove('active');
  }
});

// ─── Signup Form ───────────────────────────────────
const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = signupForm.querySelector('.signup-input').value;
  if (email) {
    signupForm.querySelector('.signup-input').value = '';
    signupForm.querySelector('.signup-input').placeholder = 'Thanks! We\'ll be in touch.';
  }
});
