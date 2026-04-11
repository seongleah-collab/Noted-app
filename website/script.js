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

// ─── Scrolled Nav ─────────────────────────────────
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ─── Smooth Scroll for Nav Links ──────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── Scroll Reveal ────────────────────────────────
const revealEls = document.querySelectorAll('.feature-card, .mode-card, .step-card, .memory-item, .privacy-card, .section-label, .section-title, .section-subtitle, .download-title, .download-subtitle, .download-buttons, .download-mobile');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal', 'visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${(i % 6) * 0.08}s`;
  revealObserver.observe(el);
});

// ─── Meeting Timer (ticks up like a real call) ─────
const meetingTimeEl = document.getElementById('meeting-time');
if (meetingTimeEl) {
  let seconds = 32 * 60 + 14;
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

// ─── Scene Orchestrator ──────────────────────────────
(function() {
  const cursor = document.getElementById('scene-cursor');
  const ring = cursor && cursor.querySelector('.cursor-ring');
  const notesList = document.getElementById('notes-list');
  const actionsList = document.getElementById('actions-list');
  const chatBody = document.getElementById('chat-body');
  const participants = document.querySelectorAll('.participant');

  if (!cursor || !notesList || !actionsList || !chatBody) return;

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function moveTo(left, top, ms) {
    return new Promise(resolve => {
      cursor.style.transition = 'left ' + ms + 'ms cubic-bezier(0.4,0,0.2,1), top ' + ms + 'ms cubic-bezier(0.4,0,0.2,1)';
      cursor.style.left = left;
      cursor.style.top = top;
      setTimeout(resolve, ms);
    });
  }

  function click() {
    return new Promise(resolve => {
      ring.classList.remove('click');
      void ring.offsetWidth;
      ring.classList.add('click');
      setTimeout(function() { ring.classList.remove('click'); resolve(); }, 450);
    });
  }

  // Speaker rotation
  var speakerPattern = [0, 2, 0, 3, 2, 3, 0, 2, 0, 3];
  var speakerStep = 0;

  function nextSpeaker() {
    participants.forEach(function(p) { p.classList.remove('speaking'); });
    setTimeout(function() {
      var idx = speakerPattern[speakerStep % speakerPattern.length];
      speakerStep++;
      participants[idx].classList.add('speaking');
    }, 300);
    setTimeout(nextSpeaker, 4000 + Math.random() * 3000);
  }

  // Notes state
  var noteLines = [
    '- Q3 revenue targets increased to **$2.4M**',
    '- New hire onboarding starts **Monday**',
    '- Marketing team to present campaign results',
    '- Sarah flagged **Q4** pipeline risks',
    '- Budget proposal due **Friday** — Mike to draft',
    '- Jane: eng bandwidth tight, may push launch',
    '- Follow up w/ Sarah on client timeline',
    '- Need final sign-off from VP before **EOD**',
  ];
  var noteCompleted = [noteLines[0], noteLines[1]];
  var noteLineIdx = 2;
  var noteCharIdx = 24;

  function boldify(t) { return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); }
  function strip(t) { return t.replace(/\*\*/g, ''); }

  function renderNotes(typing) {
    var visible = noteCompleted.slice(-2);
    var html = visible.map(function(l) { return '<p>' + boldify(l) + '</p>'; }).join('');
    var raw = strip(noteLines[noteLineIdx % noteLines.length]);
    var typed = raw.substring(0, noteCharIdx);
    if (typing && noteCharIdx < raw.length) {
      html += '<p class="float-note-typing">' + typed + '<span class="cursor-blink">|</span></p>';
    } else if (noteCharIdx > 0) {
      html += '<p>' + (noteCharIdx >= raw.length ? boldify(noteLines[noteLineIdx % noteLines.length]) : typed) + '</p>';
    }
    notesList.innerHTML = html;
  }

  function typeOneLine() {
    return new Promise(function(resolve) {
      var raw = strip(noteLines[noteLineIdx % noteLines.length]);
      (function tick() {
        if (noteCharIdx < raw.length) {
          noteCharIdx++;
          renderNotes(true);
          setTimeout(tick, 40 + Math.random() * 40);
        } else {
          noteCompleted.push(noteLines[noteLineIdx % noteLines.length]);
          renderNotes(false);
          noteLineIdx++;
          noteCharIdx = 0;
          resolve();
        }
      })();
    });
  }

  // Action items
  var actionItems = actionsList.querySelectorAll('.action-item');
  var checkSvg = '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

  function checkItem(item) {
    var el = item.querySelector('.action-check-empty');
    if (!el) return;
    el.classList.remove('action-check-empty');
    el.innerHTML = checkSvg;
    el.style.transition = 'transform 0.3s ease';
    el.style.transform = 'scale(1.2)';
    setTimeout(function() { el.style.transform = 'scale(1)'; }, 300);
  }

  function uncheckItem(item) {
    var el = item.querySelector('.action-check');
    if (!el || el.classList.contains('action-check-empty')) return;
    el.classList.add('action-check-empty');
    el.innerHTML = '';
    el.style.transform = '';
  }

  // Chat
  var chatPairs = [
    { q: "What's the deadline?", a: 'Budget proposal due <strong>Friday Oct 11</strong>. Late submissions won\'t be reviewed until next quarter.' },
    { q: 'What did Sarah say about Q4?', a: 'Sarah flagged <strong>pipeline risks</strong> for Q4 and suggested pushing the launch timeline by two weeks.' },
    { q: 'Who handles onboarding?', a: 'Mike is drafting the plan. New hires start <strong>Monday</strong>, orientation at 9 AM in Room 3B.' },
    { q: 'Summarize the action items', a: 'Three items: budget proposal by <strong>Friday</strong>, review the marketing deck, and schedule a follow-up with Sarah.' },
  ];
  var chatIdx = 1;

  function toPlain(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent;
  }

  function typeChatPair() {
    return new Promise(function(resolve) {
      var pair = chatPairs[chatIdx % chatPairs.length];
      chatBody.style.transition = 'opacity 0.4s ease';
      chatBody.style.opacity = '0';

      setTimeout(function() {
        chatBody.innerHTML = '<div class="float-chat-q">' + pair.q + '</div><div class="float-chat-a"></div>';
        chatBody.style.opacity = '1';
        var plain = toPlain(pair.a);
        var ci = 0;

        setTimeout(function typeChar() {
          var el = chatBody.querySelector('.float-chat-a');
          if (!el) { resolve(); return; }
          if (ci < plain.length) {
            ci++;
            el.textContent = plain.substring(0, ci);
            setTimeout(typeChar, 25 + Math.random() * 25);
          } else {
            el.innerHTML = pair.a;
            chatIdx++;
            resolve();
          }
        }, 800);
      }, 400);
    });
  }

  // Main sequence
  async function run() {
    await moveTo('70%', '14%', 1200);
    await wait(600);
    await moveTo('68%', '22%', 700);
    await typeOneLine();
    await wait(1200);

    await moveTo('18%', '74%', 1400);
    await wait(500);
    await moveTo('19%', '79%', 400);
    await click();
    checkItem(actionItems[1]);
    await wait(1000);
    await moveTo('20%', '86%', 400);
    await click();
    checkItem(actionItems[2]);
    await wait(1500);

    await moveTo('68%', '82%', 1300);
    await wait(400);
    await moveTo('67%', '90%', 400);
    await click();
    await typeChatPair();
    await wait(2000);

    await moveTo('45%', '40%', 1200);
    await wait(1500);
    uncheckItem(actionItems[1]);
    uncheckItem(actionItems[2]);

    run();
  }

  setTimeout(nextSpeaker, 4000);

  setTimeout(function() {
    cursor.classList.add('visible');
    setTimeout(run, 1200);
  }, 3000);
})();
