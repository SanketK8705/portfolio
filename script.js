
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
  return {
    totalSolved: stats?.solvedProblem,
    easySolved: stats?.easySolved,
    mediumSolved: stats?.mediumSolved,
    hardSolved: stats?.hardSolved,
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

// Populate LeetCode Stats from imported JSON
function updateLeetCodeStats(data) {
  if (!data) return;
  
  const totalSolved = data.totalSolved || 0;
  const easySolved = data.easySolved || 0;
  const mediumSolved = data.mediumSolved || 0;
  const hardSolved = data.hardSolved || 0;
  const submissionCalendar = data.submissionCalendar || {};
  
  // Calculate active days (number of unique active days in calendar)
  const activeDays = Object.keys(submissionCalendar).length;
  
  // Calculate max streak
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDateStr = null;
  
  // Sort keys (timestamps) ascending
  const sortedTimestamps = Object.keys(submissionCalendar)
    .map(Number)
    .sort((a, b) => a - b);
    
  sortedTimestamps.forEach(ts => {
    // Leetcode timestamps are in seconds. Convert to Date.
    const date = new Date(ts * 1000);
    // Normalize date to YYYY-MM-DD in UTC/local to reliably count consecutive days
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!prevDateStr) {
      currentStreak = 1;
    } else {
      const prevDate = new Date(prevDateStr);
      const currDate = new Date(dateStr);
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    prevDateStr = dateStr;
  });
  maxStreak = Math.max(maxStreak, currentStreak);
  
  // Update DOM
  const totalIntroEl = document.getElementById('lc-total-intro');
  const totalEl = document.getElementById('lc-total');
  const easyEl = document.getElementById('lc-easy');
  const mediumEl = document.getElementById('lc-medium');
  const hardEl = document.getElementById('lc-hard');
  const activeEl = document.getElementById('lc-active');
  const streakEl = document.getElementById('lc-streak');
  
  if (totalIntroEl) totalIntroEl.textContent = totalSolved;
  if (totalEl) totalEl.textContent = totalSolved;
  if (easyEl) easyEl.textContent = easySolved;
  if (mediumEl) mediumEl.textContent = mediumSolved;
  if (hardEl) hardEl.textContent = hardSolved;
  if (activeEl) activeEl.textContent = activeDays;
  if (streakEl) streakEl.textContent = `Max streak · ${maxStreak} days`;
}

// Run stats update
try {
  updateLeetCodeStats(leetcodeData);
} catch (e) {
  console.error("Failed to load LeetCode statistics:", e);
}
