
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

const leetcodeStatNodes = document.querySelectorAll('[data-leetcode-stat]');

function getLeetCodeCalendar(stats) {
  const calendar = stats?.submissionCalendar ?? stats?.calendar ?? stats?.matchedUser?.submissionCalendar;
  if (!calendar) return null;
  if (typeof calendar === 'string') {
    try {
      return JSON.parse(calendar);
    } catch {
      return null;
    }
  }
  return calendar;
}

function getActiveDays(stats) {
  if (Number.isFinite(Number(stats?.activeDays))) return Number(stats.activeDays);
  const calendar = getLeetCodeCalendar(stats);
  if (!calendar || typeof calendar !== 'object') return null;
  return Object.values(calendar).filter((count) => Number(count) > 0).length;
}

function getMaxStreak(stats) {
  if (Number.isFinite(Number(stats?.maxStreak))) return Number(stats.maxStreak);
  const calendar = getLeetCodeCalendar(stats);
  if (!calendar || typeof calendar !== 'object') return null;

  const activeDays = Object.entries(calendar)
    .filter(([, count]) => Number(count) > 0)
    .map(([timestamp]) => Math.floor(Number(timestamp) / 86400))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  let longest = 0;
  let current = 0;
  let previous = null;

  activeDays.forEach((day) => {
    current = previous === null || day === previous + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  });

  return longest || null;
}

function normalizeLeetCodeStats(stats) {
  const acStats = stats?.submitStats?.acSubmissionNum ?? [];
  const findCount = (difficulty) => acStats.find((s) => s.difficulty === difficulty)?.count;
  return {
    totalSolved: findCount('All'),
    easySolved: findCount('Easy'),
    mediumSolved: findCount('Medium'),
    hardSolved: findCount('Hard'),
    activeDays: Number.isFinite(Number(stats?.totalActiveDays)) ? Number(stats.totalActiveDays) : getActiveDays(stats),
    maxStreak: Number.isFinite(Number(stats?.streak)) ? Number(stats.streak) : getMaxStreak(stats),
  };
}

async function syncLeetCodeStats() {
  if (!leetcodeStatNodes.length) return;

  try {
    const response = await fetch('assets/leetcode-stats.json', { cache: 'no-store' });
    if (!response.ok) return;

    const stats = normalizeLeetCodeStats(await response.json());

    leetcodeStatNodes.forEach((node) => {
      const key = node.getAttribute('data-leetcode-stat');
      if (stats[key] === null || stats[key] === undefined) return;
      const value = Number(stats[key]);
      if (Number.isFinite(value)) {
        node.textContent = value.toLocaleString('en-IN');
  }
});
  } catch (error) {
    console.warn('LeetCode stats could not be loaded; using embedded fallback values.', error);
  }
}

syncLeetCodeStats();

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

