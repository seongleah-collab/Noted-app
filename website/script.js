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

// ─── Meeting Timer (ticks up like a real call) ─────
const meetingTimeEl = document.getElementById('meeting-time');
if (meetingTimeEl) {
  let seconds = 32 * 60 + 14; // starts at 32:14
  setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    meetingTimeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

// ─── Parallax tilt on scene (mouse-based, desktop only) ──
const scene = document.querySelector('.scene');
const heroRight = document.querySelector('.hero-right');
if (scene && heroRight && window.matchMedia('(min-width: 901px)').matches) {
  heroRight.addEventListener('mousemove', (e) => {
    const rect = heroRight.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    scene.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 3}deg)`;
  });

  heroRight.addEventListener('mouseleave', () => {
    scene.style.transition = 'transform 0.6s ease-out';
    scene.style.transform = 'rotateY(0) rotateX(0)';
    setTimeout(() => { scene.style.transition = ''; }, 600);
  });
}

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
