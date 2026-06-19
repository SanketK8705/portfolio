const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('main section[id]');
const reveals = document.querySelectorAll('.reveal');
const cursorGlow = document.querySelector('.cursor-glow');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.classList.remove('open');
    mobileMenu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflow = '';
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

reveals.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
  revealObserver.observe(item);
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -60% 0px' });

sections.forEach((section) => sectionObserver.observe(section));

window.addEventListener('pointermove', (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

document.querySelector('#year').textContent = new Date().getFullYear();

// Theme Accent Switcher Logic
const themeButtons = document.querySelectorAll('.theme-btn');
const activeTheme = localStorage.getItem('selected-theme') || 'default';

function applyTheme(theme) {
  // Remove existing theme classes
  document.documentElement.classList.remove('theme-purple', 'theme-blue', 'theme-red');
  
  // Add new theme class if not default
  if (theme !== 'default') {
    document.documentElement.classList.add(`theme-${theme}`);
  }
  
  // Update active state in UI
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
}

// Set initial theme
applyTheme(activeTheme);

// Handle clicks
themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedTheme = btn.getAttribute('data-theme');
    localStorage.setItem('selected-theme', selectedTheme);
    applyTheme(selectedTheme);
  });
});
