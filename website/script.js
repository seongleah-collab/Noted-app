// ─── Theme Toggle ────────────────────────────────────
function getPreferredTheme() {
  const stored = localStorage.getItem('noted-theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('noted-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// Set initial theme
setTheme(getPreferredTheme());

// Bind toggle buttons
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
const mobileToggle = document.getElementById('theme-toggle-mobile');
if (mobileToggle) mobileToggle.addEventListener('click', toggleTheme);

// ─── Mobile Menu ─────────────────────────────────────
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

menuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  menuBtn.classList.toggle('active');
});

// Close mobile menu on link click
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuBtn.classList.remove('active');
  });
});

// ─── Scroll Animations ──────────────────────────────
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Add fade-in class to elements
document.querySelectorAll('.feature-card, .step-card, .cta-card').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// ─── Nav Background on Scroll ───────────────────────
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.classList.add('nav-scrolled');
  } else {
    nav.classList.remove('nav-scrolled');
  }
});

// ─── Smooth Scroll for Anchor Links ─────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80;
      const position = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  });
});

// ─── Parallax on Mockup ─────────────────────────────
const mockup = document.querySelector('.mockup-window');

if (mockup && window.innerWidth > 900) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const rate = scrolled * 0.15;
    mockup.style.transform = `translateY(${-rate}px)`;
  });
}

// ─── 3D Tilt on Feature Cards ──────────────────────
if (window.innerWidth > 900) {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -4;
      const rotateY = (x - centerX) / centerX * 4;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ─── Cursor Glow on Feature Cards ──────────────────
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--glow-x', `${x}px`);
    card.style.setProperty('--glow-y', `${y}px`);
  });
});

// ─── Magnetic Buttons ──────────────────────────────
if (window.innerWidth > 900) {
  document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.02)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ─── Background Orbs Follow Mouse ──────────────────
if (window.innerWidth > 900) {
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const glow1 = document.querySelector('.bg-glow-1');
  const glow2 = document.querySelector('.bg-glow-2');
  const glow3 = document.querySelector('.bg-glow-3');
  const glow4 = document.querySelector('.bg-glow-4');
  const glow5 = document.querySelector('.bg-glow-5');

  function animateOrbs() {
    if (glow1) glow1.style.translate = `${mouseX * 20}px ${mouseY * 15}px`;
    if (glow2) glow2.style.translate = `${mouseX * -15}px ${mouseY * -10}px`;
    if (glow3) glow3.style.translate = `${mouseX * 12}px ${mouseY * -18}px`;
    if (glow4) glow4.style.translate = `${mouseX * -18}px ${mouseY * 14}px`;
    if (glow5) glow5.style.translate = `${mouseX * 10}px ${mouseY * -12}px`;
    requestAnimationFrame(animateOrbs);
  }
  animateOrbs();
}

// ─── Scroll Progress Bar ───────────────────────────
const progressBar = document.createElement('div');
progressBar.classList.add('scroll-progress');
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${progress}%`;
});

// ─── Staggered Fade-In for Feature Cards ───────────
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const cards = entry.target.querySelectorAll('.feature-card');
      cards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.08}s`;
      });
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

const featuresGrid = document.querySelector('.features-grid');
if (featuresGrid) staggerObserver.observe(featuresGrid);

// ─── Typing Effect in Mockup Input ─────────────────
const mockupField = document.querySelector('.mockup-input-field');
if (mockupField) {
  const prompts = [
    'Ask about this meeting...',
    'What were the action items?',
    'Summarize the key decisions',
    'Who is responsible for what?',
    'Any deadlines mentioned?',
    'Draft a follow-up email'
  ];
  let promptIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let pauseTimer = 0;

  function typeLoop() {
    const current = prompts[promptIndex];

    if (!isDeleting) {
      charIndex++;
      mockupField.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        pauseTimer++;
        if (pauseTimer > 40) {
          isDeleting = true;
          pauseTimer = 0;
        }
        requestAnimationFrame(typeLoop);
        return;
      }
    } else {
      charIndex--;
      mockupField.textContent = current.slice(0, charIndex) || '\u00A0';
      if (charIndex === 0) {
        isDeleting = false;
        promptIndex = (promptIndex + 1) % prompts.length;
      }
    }

    setTimeout(() => requestAnimationFrame(typeLoop), isDeleting ? 30 : 70);
  }

  setTimeout(typeLoop, 2000);
}

// ─── Comparison Table Row Highlight on Scroll ──────
document.querySelectorAll('.comparison-table tbody tr').forEach(row => {
  row.addEventListener('mouseenter', () => {
    const notedCell = row.querySelector('.ct-noted');
    if (notedCell) notedCell.style.transform = 'scale(1.1)';
  });
  row.addEventListener('mouseleave', () => {
    const notedCell = row.querySelector('.ct-noted');
    if (notedCell) notedCell.style.transform = '';
  });
});

// ─── Ripple Effect on Buttons ──────────────────────
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.classList.add('btn-ripple');
    const rect = this.getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    this.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});
