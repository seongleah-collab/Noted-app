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

// ─── Switch cards from entrance → idle animation after entrance completes ──
const floatCards = document.querySelectorAll('.float-notes, .float-actions, .float-chat, .float-incognito');
floatCards.forEach((card) => {
  card.addEventListener('animationend', (e) => {
    // Only trigger on the entrance animation, not on idle
    if (e.animationName.startsWith('floatIn')) {
      card.classList.add('animated');
    }
  });
});

// ─── Gentle parallax tilt on scene (desktop only) ──
const scene = document.querySelector('.scene');
const heroRight = document.querySelector('.hero-right');
if (scene && heroRight && window.matchMedia('(min-width: 901px)').matches) {
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  let rafId = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function updateTilt() {
    currentX = lerp(currentX, targetX, 0.08);
    currentY = lerp(currentY, targetY, 0.08);
    scene.style.transform = `rotateY(${currentX}deg) rotateX(${currentY}deg)`;

    if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
      rafId = requestAnimationFrame(updateTilt);
    } else {
      rafId = null;
    }
  }

  heroRight.addEventListener('mousemove', (e) => {
    const rect = heroRight.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = x * 3;
    targetY = -y * 2;
    if (!rafId) rafId = requestAnimationFrame(updateTilt);
  });

  heroRight.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(updateTilt);
  });
}

// ─── Realistic Scene Animations ──────────────────────

// --- Speaker Rotation ---
(function() {
  const participants = document.querySelectorAll('.participant');
  if (!participants.length) return;

  // 0=Sarah, 1=You, 2=Mike, 3=Jane — "You" rarely speaks
  const pattern = [0, 2, 0, 3, 2, 3, 0, 2, 0, 3];
  let step = 0;

  function nextSpeaker() {
    participants.forEach(p => p.classList.remove('speaking'));

    const pause = 300 + Math.random() * 500;
    setTimeout(() => {
      const idx = pattern[step % pattern.length];
      step++;
      participants[idx].classList.add('speaking');
    }, pause);

    setTimeout(nextSpeaker, 3000 + Math.random() * 4000);
  }

  setTimeout(nextSpeaker, 4000);
})();

// --- Live Notes Typing ---
(function() {
  const notesList = document.getElementById('notes-list');
  if (!notesList) return;

  const lines = [
    '- Q3 revenue targets increased to **$2.4M**',
    '- New hire onboarding starts **Monday**',
    '- Marketing team to present campaign results',
    '- Sarah flagged **Q4** pipeline risks',
    '- Budget proposal due **Friday** — Mike to draft',
    '- Jane: eng bandwidth tight, may push launch',
    '- Follow up w/ Sarah on client timeline',
    '- Need final sign-off from VP before **EOD**',
  ];

  // Start seamlessly from static HTML state: first 2 lines done, 3rd partially typed
  let completed = [lines[0], lines[1]];
  let lineIdx = 2;
  let charIdx = 24; // "- Marketing team to pres"
  const MAX_VISIBLE = 3;

  function boldify(t) { return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); }
  function strip(t) { return t.replace(/\*\*/g, ''); }

  function render() {
    const visible = completed.slice(-(MAX_VISIBLE - 1));
    let html = visible.map(l => '<p>' + boldify(l) + '</p>').join('');
    const raw = strip(lines[lineIdx % lines.length]);
    const typed = raw.substring(0, charIdx);
    if (charIdx < raw.length) {
      html += '<p class="float-note-typing">' + typed + '<span class="cursor-blink">|</span></p>';
    } else {
      html += '<p>' + boldify(lines[lineIdx % lines.length]) + '</p>';
    }
    notesList.innerHTML = html;
  }

  function tick() {
    const raw = strip(lines[lineIdx % lines.length]);
    if (charIdx < raw.length) {
      charIdx++;
      render();
      setTimeout(tick, 35 + Math.random() * 45);
    } else {
      completed.push(lines[lineIdx % lines.length]);
      render();
      lineIdx++;
      charIdx = 0;
      setTimeout(tick, 2000 + Math.random() * 2000);
    }
  }

  // Seamlessly continue from static HTML after entrance animations
  setTimeout(tick, 2500);
})();

// --- Action Items Checking ---
(function() {
  const actionsList = document.getElementById('actions-list');
  if (!actionsList) return;

  const items = actionsList.querySelectorAll('.action-item');
  const checkSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
  let step = 0;

  function checkItem(item) {
    const el = item.querySelector('.action-check-empty');
    if (!el) return;
    el.classList.remove('action-check-empty');
    el.innerHTML = checkSvg;
    el.style.transition = 'transform 0.3s ease';
    el.style.transform = 'scale(1.2)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
  }

  function uncheckItem(item) {
    const el = item.querySelector('.action-check');
    if (!el || el.classList.contains('action-check-empty')) return;
    el.classList.add('action-check-empty');
    el.innerHTML = '';
    el.style.transform = '';
  }

  function cycle() {
    if (step === 0) {
      checkItem(items[1]);
      setTimeout(cycle, 6000 + Math.random() * 3000);
    } else if (step === 1) {
      checkItem(items[2]);
      setTimeout(cycle, 10000 + Math.random() * 5000);
    } else {
      uncheckItem(items[1]);
      uncheckItem(items[2]);
      setTimeout(cycle, 8000 + Math.random() * 4000);
    }
    step = (step + 1) % 3;
  }

  setTimeout(cycle, 8000);
})();

// --- Chat Q&A Cycling ---
(function() {
  const chatBody = document.getElementById('chat-body');
  if (!chatBody) return;

  const pairs = [
    { q: "What's the deadline?", a: 'Budget proposal due <strong>Friday Oct 11</strong>. Late submissions won\'t be reviewed until next quarter.' },
    { q: 'What did Sarah say about Q4?', a: 'Sarah flagged <strong>pipeline risks</strong> for Q4 and suggested pushing the launch timeline by two weeks.' },
    { q: 'Who handles onboarding?', a: 'Mike is drafting the plan. New hires start <strong>Monday</strong>, orientation at 9 AM in Room 3B.' },
    { q: 'Summarize the action items', a: 'Three items: budget proposal by <strong>Friday</strong>, review the marketing deck, and schedule a follow-up with Sarah.' },
  ];

  let pairIdx = 1; // 0 is already shown in static HTML
  let ansCharIdx = 0;

  function toPlain(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent;
  }

  function showPair() {
    const pair = pairs[pairIdx % pairs.length];
    chatBody.style.transition = 'opacity 0.4s ease';
    chatBody.style.opacity = '0';

    setTimeout(() => {
      chatBody.innerHTML = '<div class="float-chat-q">' + pair.q + '</div><div class="float-chat-a"></div>';
      chatBody.style.opacity = '1';
      ansCharIdx = 0;
      const plain = toPlain(pair.a);
      setTimeout(() => typeAnswer(pair, plain), 800 + Math.random() * 600);
    }, 400);
  }

  function typeAnswer(pair, plain) {
    const el = chatBody.querySelector('.float-chat-a');
    if (!el) return;
    if (ansCharIdx < plain.length) {
      ansCharIdx++;
      el.textContent = plain.substring(0, ansCharIdx);
      setTimeout(() => typeAnswer(pair, plain), 20 + Math.random() * 30);
    } else {
      el.innerHTML = pair.a;
      pairIdx++;
      setTimeout(showPair, 8000 + Math.random() * 4000);
    }
  }

  setTimeout(showPair, 12000);
})();

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
