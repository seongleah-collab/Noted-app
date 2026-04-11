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

// ─── Particle Background ──────────────────────────
(function() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight * 5; // cover full scroll
  }
  resize();
  window.addEventListener('resize', resize);

  function createParticles() {
    particles = [];
    const count = Math.floor((w * h) / 25000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }
  }
  createParticles();

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const color = isDark ? '255,255,255' : '0,0,0';

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── Scrolled Nav + Scroll Progress ──────────────
const nav = document.querySelector('.nav');
const scrollProgress = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);

  // Scroll progress bar
  if (scrollProgress) {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = scrollPercent + '%';
  }
});

// ─── Smooth Scroll ────────────────────────────────
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
const revealEls = document.querySelectorAll(
  '.feature-card, .mode-card, .step-card, .memory-item, .privacy-card, ' +
  '.stat-card, .faq-item, .compare-table-wrap, ' +
  '.section-label, .section-title, .section-subtitle, ' +
  '.download-title, .download-subtitle, .download-buttons, .download-mobile'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal', 'visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  // Stagger within each section's group
  const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
  const idx = siblings.indexOf(el);
  el.style.transitionDelay = `${(idx >= 0 ? idx : i % 6) * 0.1}s`;
  revealObserver.observe(el);
});

// ─── Stats Counter ────────────────────────────────
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(target * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => statsObserver.observe(el));

// ─── FAQ Accordion ────────────────────────────────
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');

    // Close all others
    document.querySelectorAll('.faq-item.open').forEach(other => {
      if (other !== item) other.classList.remove('open');
    });

    item.classList.toggle('open', !isOpen);
  });
});

// ─── Section Nav Dots ────────────────────────────
(function() {
  const dots = document.querySelectorAll('.section-dots .dot');
  if (!dots.length) return;

  const sectionIds = Array.from(dots).map(d => d.dataset.section);
  const sectionEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  const dotObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        dots.forEach(d => d.classList.remove('active'));
        const activeDot = document.querySelector('.section-dots .dot[data-section="' + entry.target.id + '"]');
        if (activeDot) activeDot.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sectionEls.forEach(el => dotObserver.observe(el));
})();

// ─── Glow Card Mouse Tracking ─────────────────────
document.querySelectorAll('.glow-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
  });
});

// ─── Meeting Timer ────────────────────────────────
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

// ─── Float card entrance → idle ───────────────────
const floatCards = document.querySelectorAll('.float-notes, .float-actions, .float-chat, .float-incognito');
floatCards.forEach((card) => {
  card.addEventListener('animationend', (e) => {
    if (e.animationName.startsWith('floatIn')) {
      card.classList.add('animated');
    }
  });
});

// ─── Scene parallax tilt (desktop) ────────────────
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

  var chatPairs = [
    { q: "What's the deadline?", a: 'Budget proposal due <strong>Friday Oct 11</strong>. Late submissions won\'t be reviewed until next quarter.' },
    { q: 'What did Sarah say about Q4?', a: 'Sarah flagged <strong>pipeline risks</strong> for Q4 and suggested pushing the launch timeline by two weeks.' },
    { q: 'Who handles onboarding?', a: 'Mike is drafting the plan. New hires start <strong>Monday</strong>, orientation at 9 AM in Room 3B.' },
    { q: 'Summarize the action items', a: 'Three items: budget proposal by <strong>Friday</strong>, review the marketing deck, and schedule a follow-up with Sarah.' },
  ];
  var chatIdx = 1;

  function toPlain(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }

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
