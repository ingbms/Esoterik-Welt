// Esoterik-Welt — Main Entry Point
// Initializes the app, handles routing, and coordinates modules

import { TarotModule } from './modules/tarot.js';
import { initCrystalsModule } from './modules/crystals.js';
import { MoonModule } from './modules/moon.js';
import { RunesModule } from './modules/runes.js';
import { BlogModule } from './modules/blog.js';

// --- State ---
const state = {
  currentPage: 'home',
  modules: {}
};

// --- DOM Elements ---
const elements = {
  header: document.getElementById('header'),
  nav: document.getElementById('nav'),
  navList: document.getElementById('navList'),
  navToggle: document.getElementById('navToggle'),
  pages: document.querySelectorAll('.page'),
  navLinks: document.querySelectorAll('.nav-link'),
  heroCanvas: document.getElementById('heroCanvas'),
  modals: {
    card: document.getElementById('cardModal'),
    crystal: document.getElementById('crystalModal'),
    rune: document.getElementById('runeModal'),
    article: document.getElementById('articleModal')
  },
  modalCloses: {
    card: document.getElementById('closeCardModal'),
    crystal: document.getElementById('closeCrystalModal'),
    rune: document.getElementById('closeRuneModal'),
    article: document.getElementById('closeArticleModal')
  }
};

// --- Initialize ---
async function init() {
  // Initialize hero canvas animation
  initHeroCanvas();

  // Setup navigation
  setupNavigation();

  // Setup modal close handlers
  setupModals();

  // Initialize all modules
  state.modules.tarot = new TarotModule(elements.modals.card, document.getElementById('cardModalBody'), elements.modalCloses.card);
  await initCrystalsModule();
  state.modules.moon = new MoonModule();
  state.modules.runes = new RunesModule(elements.modals.rune, document.getElementById('runeModalBody'), elements.modalCloses.rune);
  state.modules.blog = new BlogModule(elements.modals.article, document.getElementById('articleModalBody'), elements.modalCloses.article);

  await Promise.all([
    state.modules.tarot.init(),
    state.modules.moon.init(),
    state.modules.runes.init(),
    state.modules.blog.init()
  ]);

  // Handle initial hash / direct access
  const initialPage = (location.hash.replace('#','') || 'home');
  if (initialPage && initialPage !== 'home') navigateTo(initialPage, true);

  // Populate home feature grid
  populateFeatureGrid();

  // Handle scroll effects on header
  window.addEventListener('scroll', onScroll, { passive: true });

  // Keyboard navigation for modals
  document.addEventListener('keydown', onKeyDown);

  console.log('Esoterik-Welt initialized');
}

// --- Hero Canvas Animation ---
function initHeroCanvas() {
  const canvas = elements.heroCanvas;
  if (!canvas) return;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionQuery.matches) {
    const enable = event => {
      if (!event.matches) { motionQuery.removeEventListener('change', enable); initHeroCanvas(); }
    };
    motionQuery.addEventListener('change', enable);
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let particles = [];
  let animationId = null;

  function resize() {
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.offsetWidth;
      this.y = Math.random() * canvas.offsetHeight;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.5 ? '187,134,252' : '3,218,198';
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.offsetWidth || this.y < 0 || this.y > canvas.offsetHeight) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
      ctx.fill();
    }
  }

  function createParticles() {
    const count = Math.min(80, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 15000));
    particles = Array.from({ length: count }, () => new Particle());
  }

  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    targetMouseX = (e.clientX - rect.left - rect.width/2) / rect.width;
    targetMouseY = (e.clientY - rect.top - rect.height/2) / rect.height;
  }, { passive: true });

  function animate() {
    if (document.hidden || motionQuery.matches) {
      if (motionQuery.matches) ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationId = null;
      return;
    }
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.save();
    ctx.translate(mouseX * 12, mouseY * 12);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    ctx.restore();
    animationId = requestAnimationFrame(animate);
  }

  function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(187,134,252,${0.1 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  resize();
  createParticles();
  animate();
  motionQuery.addEventListener('change', event => {
    if (event.matches) {
      if (animationId !== null) cancelAnimationFrame(animationId);
      animationId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (animationId === null && !document.hidden) {
      animationId = requestAnimationFrame(animate);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !motionQuery.matches && animationId === null) animationId = requestAnimationFrame(animate);
  });

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}

// --- Navigation ---
function setupNavigation() {
  // Nav link clicks
  elements.navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });
  });

  // Mobile toggle
  elements.navToggle.addEventListener('click', () => {
    const isOpen = elements.nav.classList.toggle('open');
    elements.navToggle.setAttribute('aria-expanded', String(isOpen));
    elements.navToggle.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
  });
  elements.navToggle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elements.navToggle.click();
    }
  });

  // Close mobile nav on link click
  elements.navList.addEventListener('click', e => {
    if (e.target.classList.contains('nav-link')) {
      elements.nav.classList.remove('open');
      elements.navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close mobile nav on outside click
  document.addEventListener('click', e => {
    if (!elements.header.contains(e.target)) {
      elements.nav.classList.remove('open');
      elements.navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Back/forward button support
  window.addEventListener('popstate', e => {
    const page = (e.state && e.state.page) || (location.hash.replace('#','') || 'home');
    if (page && page !== state.currentPage) navigateTo(page);
  });
  window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#','') || 'home';
    if (page && page !== state.currentPage) navigateTo(page);
  });
}

function navigateTo(pageId, replace = false) {
  // Update active states
  elements.pages.forEach(page => {
    page.classList.toggle('active', page.id === pageId);
    page.hidden = page.id !== pageId;
  });
  elements.navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
    if (link.dataset.page === pageId) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  state.currentPage = pageId;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });

  // Trigger module-specific onShow
  if (state.modules[pageId] && state.modules[pageId].onShow) {
    state.modules[pageId].onShow();
  }

  // Update URL hash without scroll
  if (replace) {
    history.replaceState({ page: pageId }, '', `#${pageId}`);
  } else {
    history.pushState({ page: pageId }, '', `#${pageId}`);
  }
}

function onScroll() {
  if (window.scrollY > 50) {
    elements.header.classList.add('scrolled');
  } else {
    elements.header.classList.remove('scrolled');
  }
}

// --- Modals ---
function setupModals() {
  Object.keys(elements.modals).forEach(key => {
    const modal = elements.modals[key];
    const closeBtn = elements.modalCloses[key];

    // Close on backdrop click
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(key);
    });

    // Close button
    closeBtn.addEventListener('click', () => closeModal(key));
  });
}

function openModal(key) {
  const modal = elements.modals[key];
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.style.overflow = 'hidden';
}

function closeModal(key) {
  const modal = elements.modals[key];
  modal.classList.remove('open');
  setTimeout(() => {
    modal.hidden = true;
    document.body.style.overflow = '';
  }, 300);
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    Object.keys(elements.modals).forEach(key => {
      if (!elements.modals[key].hidden) closeModal(key);
    });
  }
}

// --- Home Feature Grid ---
function populateFeatureGrid() {
  const grid = document.getElementById('featureGrid');
  if (!grid) return;

  const features = [
    { id: 'tarot', icon: '🃏', title: 'Tarot', desc: '78 Karten, Major & Minor Arcana, Tageskarte & Legungen' },
    { id: 'crystals', icon: '💎', title: 'Kristalle', desc: '30+ Steine mit Chakra-Filter, Wirkungen & Details' },
    { id: 'moon', icon: '🌙', title: 'Mondphasen', desc: 'Aktuelle Phase, Kalender, Rituale & Tierkreiszeichen' },
    { id: 'runes', icon: 'ᚠ', title: 'Runen', desc: 'Älteres Futhark, 3-Runen-Wurf & Deutung' },
    { id: 'blog', icon: '📜', title: 'Wissen', desc: 'Artikel zu Esoterik, Geschichte, Ritualen & Praxis' }
  ];

  grid.innerHTML = features.map((f, i) => `
    <article class="card feature-card animate-slide-up stagger-${i + 1}" role="link" data-page="${f.id}">
      <div class="feature-icon">${f.icon}</div>
      <h3 class="feature-title">${f.title}</h3>
      <p class="feature-desc">${f.desc}</p>
    </article>
  `).join('');

  grid.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.page));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo(card.dataset.page);
      }
    });
    card.setAttribute('tabindex', '0');
  });
}

// --- Utility: Debounce ---
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// --- Start ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
window.EsoterikWelt = { state, navigateTo, openModal, closeModal };