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
const signupInput = signupForm.querySelector('.signup-input');
const signupBtn = signupForm.querySelector('.signup-btn');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = signupInput.value.trim();
  if (!email) return;

  signupBtn.textContent = 'Joining...';
  signupBtn.disabled = true;

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      signupInput.value = '';
      signupInput.placeholder = 'You\'re on the list!';
      signupBtn.textContent = 'Joined';
      setTimeout(() => {
        signupBtn.textContent = 'Join Waitlist';
        signupBtn.disabled = false;
        signupInput.placeholder = 'Enter your email';
      }, 3000);
    } else {
      const data = await res.json().catch(() => null);
      if (data?.message?.includes('already')) {
        signupInput.value = '';
        signupInput.placeholder = 'You\'re already on the list!';
        signupBtn.textContent = 'Joined';
      } else {
        signupInput.placeholder = 'Something went wrong. Try again.';
        signupBtn.textContent = 'Join Waitlist';
      }
      setTimeout(() => {
        signupBtn.textContent = 'Join Waitlist';
        signupBtn.disabled = false;
        signupInput.placeholder = 'Enter your email';
      }, 3000);
    }
  } catch {
    signupInput.placeholder = 'Network error. Try again.';
    signupBtn.textContent = 'Join Waitlist';
    signupBtn.disabled = false;
    setTimeout(() => {
      signupInput.placeholder = 'Enter your email';
    }, 3000);
  }
});
