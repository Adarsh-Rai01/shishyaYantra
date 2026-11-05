/* ========== SINCERE MODE — study.js ========== */

// ─── State ───
let goals = [];
let focusTimeToday = 0; // in minutes
let studyStreak = 0;
let lastActiveDate = '';

const STORAGE_GOALS_KEY = 'studyMantra_tasks';
const STORAGE_FOCUS_KEY = 'studyMantra_focusTime';
const STORAGE_STREAK_KEY = 'studyMantra_streak';
const STORAGE_LAST_ACTIVE_KEY = 'studyMantra_lastActive';

// Timer Variables
let timeLeft = 1500; // 25 minutes default
let timerDuration = 1500;
let timerInterval = null;
let isTimerRunning = false;
let activeMode = 'study'; // 'study', 'short', 'long'
let sessionMinutesAccumulated = 0;
let savedStudyTime = 0; // remaining study time saved during breaks

const timerModesConfig = {
  study: { name: 'Study Session', time: 1500 }, // 25 mins
  short: { name: 'Short Break', time: 300 },   // 5 mins
  long: { name: 'Long Break', time: 900 }      // 15 mins
};

// ─── Navbar Toggle ───
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// close mobile nav on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// ─── Sound Generator (Web Audio API) ───
function playChime(isBreak = false) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const playNote = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    if (isBreak) {
      // Relaxing chord for breaks
      playNote(440.00, now, 0.4); // A4
      playNote(329.63, now + 0.15, 0.6); // E4
    } else {
      // Bright chime for focus completion
      playNote(523.25, now, 0.25); // C5
      playNote(659.25, now + 0.12, 0.35); // E5
      playNote(783.99, now + 0.24, 0.55); // G5
    }
  } catch (e) {
    console.error("Audio Context initialization failed: ", e);
  }
}

// ─── Goal Tracker / Checklist ───
function loadGoals() {
  const raw = localStorage.getItem(STORAGE_GOALS_KEY);
  if (raw) {
    try { goals = JSON.parse(raw); } catch { goals = []; }
  } else {
    goals = [
      { id: 1, subject: 'Mathematics', title: 'Complete calculus practice set 1', priority: 'high', date: getTodayString(), completed: false },
      { id: 2, subject: 'Computer Science', title: 'Code binary search tree operations', priority: 'medium', date: getTodayString(), completed: true }
    ];
    saveGoals();
  }
}

function saveGoals() {
  localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(goals));
  updateStats();
  // Dispatch custom change event to alert scroll engines of container updates
  window.dispatchEvent(new Event('layoutchange'));
}

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function renderGoals() {
  const list = document.getElementById('goalList');
  if (!list) return;

  if (goals.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--text-dim);font-size:.88rem">
        You have no current goals. Create one to begin your comeback!
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  goals.forEach(goal => {
    const item = document.createElement('div');
    item.className = `goal-item ${goal.completed ? 'completed' : ''}`;
    
    item.innerHTML = `
      <div class="goal-item-left">
        <label class="goal-checkbox-wrapper">
          <input type="checkbox" class="goal-checkbox-input" ${goal.completed ? 'checked' : ''} onchange="toggleGoal(${goal.id})">
          <span class="goal-checkbox-custom"></span>
        </label>
        <div class="goal-details">
          <span class="goal-title">${escapeHTML(goal.title)}</span>
          <div class="goal-meta">
            <span class="goal-subject">${escapeHTML(goal.subject)}</span>
            <span>•</span>
            <span class="goal-badge priority-${goal.priority}">${goal.priority}</span>
            ${goal.date ? `<span>•</span><span>📅 ${goal.date}</span>` : ''}
          </div>
        </div>
      </div>
      <button class="btn-goal-delete" onclick="deleteGoal(${goal.id})" title="Delete Goal">✕</button>
    `;
    list.appendChild(item);
  });
}

function toggleGoal(id) {
  const goal = goals.find(g => g.id === id);
  if (goal) {
    goal.completed = !goal.completed;
    saveGoals();
    renderGoals();
    updateHeroStats();
  }
}

function deleteGoal(id) {
  goals = goals.filter(g => g.id !== id);
  saveGoals();
  renderGoals();
  updateHeroStats();
}

function openGoalModal() {
  document.getElementById('goalModal').classList.add('active');
  document.getElementById('modalGoalDate').value = getTodayString();
  populateSubjectsDatalist();
}

function closeGoalModal() {
  document.getElementById('goalModal').classList.remove('active');
  // Clear inputs
  document.getElementById('modalGoalSubject').value = '';
  document.getElementById('modalGoalTitle').value = '';
  document.getElementById('modalGoalPriority').value = 'medium';
}

function saveGoal() {
  const subject = document.getElementById('modalGoalSubject').value.trim();
  const title = document.getElementById('modalGoalTitle').value.trim();
  const priority = document.getElementById('modalGoalPriority').value;
  const date = document.getElementById('modalGoalDate').value;

  if (!title) {
    showToast('Enter a goal description');
    return;
  }
  if (!subject) {
    showToast('Enter subject or class');
    return;
  }

  const newGoal = {
    id: Date.now(),
    subject,
    title,
    priority,
    date,
    completed: false
  };

  goals.push(newGoal);
  saveGoals();
  renderGoals();
  updateHeroStats();
  closeGoalModal();
  showToast('Study goal added! Stay sincere 📓');
}

function populateSubjectsDatalist() {
  const datalist = document.getElementById('subjectsList');
  if (!datalist) return;

  // Retrieve subject names from Bunk Tantra key to integrate workspaces
  const rawBunkSubjects = localStorage.getItem('bunkTantra_subjects');
  let subjectNames = new Set(['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English']);
  
  if (rawBunkSubjects) {
    try {
      const parsed = JSON.parse(rawBunkSubjects);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subjectNames.clear();
        parsed.forEach(sub => {
          if (sub.name) subjectNames.add(sub.name);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  datalist.innerHTML = '';
  subjectNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    datalist.appendChild(option);
  });
}

// ─── Pomodoro Focus Timer ───
function setTimerMode(mode) {
  if (isTimerRunning) {
    if (!confirm('Abandon current focus session? Timer progress will be reset.')) return;
  }

  // Save remaining study time when switching FROM study to a break
  if (activeMode === 'study' && mode !== 'study' && timeLeft > 0) {
    savedStudyTime = timeLeft;
  }

  stopTimerInterval();
  activeMode = mode;
  
  // Update UI tabs
  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const conf = timerModesConfig[mode];

  // Restore saved study time when switching back to study after a break
  if (mode === 'study' && savedStudyTime > 0) {
    timeLeft = savedStudyTime;
    timerDuration = timerModesConfig.study.time; // keep original for ring calc
    savedStudyTime = 0;
  } else {
    timeLeft = conf.time;
    timerDuration = conf.time;
  }

  sessionMinutesAccumulated = 0;
  
  // Show/hide duration control only in study mode
  const durationCtrl = document.getElementById('durationControl');
  if (durationCtrl) durationCtrl.style.display = mode === 'study' ? '' : 'none';

  document.getElementById('timerLabel').textContent = conf.name;
  updateTimerDisplay();
  updateTimerRingProgress();
}

function toggleTimer() {
  if (isTimerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  // Resume AudioContext if browser blocked it
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const dummy = new AudioContext();
      if (dummy.state === 'suspended') dummy.resume();
    }
  } catch (e) {}

  isTimerRunning = true;
  document.getElementById('startIcon').textContent = '⏸';
  document.getElementById('btnTimerStart').classList.add('pulse');
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    updateTimerRingProgress();
    
    // Accumulate actual study minutes in real-time
    if (activeMode === 'study') {
      const elapsedMinutes = Math.floor((timerDuration - timeLeft) / 60);
      if (elapsedMinutes > sessionMinutesAccumulated) {
        const diff = elapsedMinutes - sessionMinutesAccumulated;
        accumulateFocusMinutes(diff);
        sessionMinutesAccumulated = elapsedMinutes;
      }
    }

    if (timeLeft <= 0) {
      timerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  stopTimerInterval();
  showToast('Timer Paused. Don\'t lose focus!');
}

function stopTimerInterval() {
  isTimerRunning = false;
  document.getElementById('startIcon').textContent = '▶';
  document.getElementById('btnTimerStart').classList.remove('pulse');
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimerInterval();
  timeLeft = timerDuration;
  sessionMinutesAccumulated = 0;
  updateTimerDisplay();
  updateTimerRingProgress();
  showToast('Timer Reset');
}

function adjustFocusTime(delta) {
  // Only allow adjustment when timer is not running
  if (isTimerRunning) {
    showToast('Pause the timer first to adjust duration');
    return;
  }
  if (activeMode !== 'study') {
    showToast('Switch to Study Focus to adjust duration');
    return;
  }

  const currentMins = timerModesConfig.study.time / 60;
  const newMins = Math.min(120, Math.max(5, currentMins + delta));
  const newSeconds = newMins * 60;

  timerModesConfig.study.time = newSeconds;
  timeLeft = newSeconds;
  timerDuration = newSeconds;
  sessionMinutesAccumulated = 0;
  savedStudyTime = 0;

  // Update stepper display
  const display = document.getElementById('focusDurationDisplay');
  if (display) display.textContent = newMins;

  updateTimerDisplay();
  updateTimerRingProgress();
  showToast(`Focus duration set to ${newMins} min`);
}

function skipTimer() {
  if (confirm('Skip active timer state?')) {
    timerComplete();
  }
}

function timerComplete() {
  stopTimerInterval();
  const completedMode = activeMode;
  
  if (completedMode === 'study') {
    // Study completed naturally — clear saved time so next session starts fresh
    savedStudyTime = 0;
    playChime(false);
    showToast('Focus Session Complete! Outstanding work 🏆');
    
    // Add any remaining partial minutes
    const totalSessionMinutes = Math.ceil((timerDuration - timeLeft) / 60);
    const remainingMins = totalSessionMinutes - sessionMinutesAccumulated;
    if (remainingMins > 0) {
      accumulateFocusMinutes(remainingMins);
    }
    
    incrementStreak();
    // Switch to short break automatically
    setTimerMode('short');
  } else {
    playChime(true);
    showToast('Break Over! Time to get back to work 📓');
    // Switch to study — will restore savedStudyTime if it exists
    setTimerMode('study');
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const disp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  document.getElementById('timerDisplay').textContent = disp;
  
  // Document title ticking
  const modeLabel = activeMode === 'study' ? '📓 Focus' : '☕ Break';
  document.title = `${disp} - ${modeLabel} | Study Mantra`;
}

function updateTimerRingProgress() {
  const ring = document.getElementById('timerProgressRing');
  if (!ring) return;
  
  // circumference = 2 * PI * r where r = 100
  const circumference = 628.318;
  const progress = (timeLeft / timerDuration);
  const offset = circumference * (1 - progress);
  
  ring.style.strokeDashoffset = offset;
}

// ─── Analytics & Streaks Logic ───
function loadAnalytics() {
  const today = getTodayString();
  
  // Focus minutes
  const storedFocus = localStorage.getItem(`${STORAGE_FOCUS_KEY}_${today}`);
  focusTimeToday = storedFocus ? parseInt(storedFocus) : 0;

  // Streak
  const storedStreak = localStorage.getItem(STORAGE_STREAK_KEY);
  studyStreak = storedStreak ? parseInt(storedStreak) : 0;
  
  lastActiveDate = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY) || '';

  // Validate streak
  if (lastActiveDate) {
    const lastActive = new Date(lastActiveDate);
    const timeDiff = new Date().getTime() - lastActive.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // If it has been more than 1 day since activity, reset streak
    if (dayDiff > 1) {
      studyStreak = 0;
      localStorage.setItem(STORAGE_STREAK_KEY, 0);
    }
  }

  updateStats();
  updateHeroStats();
}

function accumulateFocusMinutes(mins) {
  if (mins <= 0) return;
  const today = getTodayString();
  focusTimeToday += mins;
  localStorage.setItem(`${STORAGE_FOCUS_KEY}_${today}`, focusTimeToday);
  
  // Save active date
  localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, today);
  
  updateStats();
  updateHeroStats();
}

function incrementStreak() {
  const today = getTodayString();
  if (lastActiveDate !== today) {
    studyStreak++;
    localStorage.setItem(STORAGE_STREAK_KEY, studyStreak);
    localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, today);
    lastActiveDate = today;
  }
  updateStats();
  updateHeroStats();
}

function updateStats() {
  const focusEl = document.getElementById('statFocusTime');
  const streakEl = document.getElementById('statStreak');
  const ratioEl = document.getElementById('statGoalRatio');
  const descEl = document.getElementById('statGoalDesc');
  const fillEl = document.getElementById('streakFill');

  if (focusEl) focusEl.textContent = `${focusTimeToday} mins`;
  if (streakEl) streakEl.textContent = `${studyStreak} ${studyStreak === 1 ? 'Day' : 'Days'}`;
  
  if (ratioEl) {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    ratioEl.textContent = `${completed}/${total}`;
    
    if (descEl) {
      if (total === 0) {
        descEl.textContent = 'No goals set yet';
      } else {
        const percent = Math.round((completed / total) * 100);
        descEl.textContent = `${percent}% goals completed today`;
      }
    }
  }

  if (fillEl) {
    // Max streak visual capped at 10 for bar fill
    const streakProgress = Math.min((studyStreak / 10) * 100, 100);
    fillEl.style.width = streakProgress + '%';
  }
}

function updateHeroStats() {
  const hStreak = document.getElementById('heroStreak');
  const hMins = document.getElementById('heroMinutes');
  const hProgress = document.getElementById('heroProgress');

  if (hStreak) hStreak.textContent = `${studyStreak}d`;
  if (hMins) hMins.textContent = `${focusTimeToday}m`;
  if (hProgress) {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    hProgress.textContent = `${percent}%`;
  }
}

// ─── Helpers ───
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function showToast(msg) {
  // Use existing toast if it exists or create one dynamically
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      display:none;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      padding:12px 28px;border-radius:50px;font-size:.88rem;font-weight:600;
      background:rgba(53,89,73,.9);color:#BBE3CE;backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);border:1px solid rgba(187,227,206,.15);
      box-shadow:0 8px 30px rgba(0,0,0,.4);z-index:999;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.display = 'block';
  
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(-50%) translateY(20px)';
  
  requestAnimationFrame(() => {
    toast.style.transition = 'all .3s ease';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 2000);
}

// ─── Premium Scroll Engine & Parallax ───
function initScrollProgressBar() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  let docHeight = document.documentElement.scrollHeight - window.innerHeight;
  let ticking = false;

  const updateDocHeight = () => {
    docHeight = document.documentElement.scrollHeight - window.innerHeight;
  };

  window.addEventListener('resize', updateDocHeight, { passive: true });
  window.addEventListener('layoutchange', updateDocHeight, { passive: true });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initScrollReveals() {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  if (revealElements.length === 0) return;

  const sectionMap = new Map();
  revealElements.forEach(el => {
    const section = el.closest('.section') || el.closest('.hero') || document.body;
    if (!sectionMap.has(section)) sectionMap.set(section, []);
    sectionMap.get(section).push(el);
  });

  sectionMap.forEach((elements) => {
    elements.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', (i * 0.12) + 's');
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      } else {
        entry.target.classList.remove('revealed');
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

function initParallax() {
  const hero = document.querySelector('[data-sticky-hero]');
  if (!hero) return;

  const heroVisual = hero.querySelector('.hero-visual');
  const floatCards = hero.querySelectorAll('.float-card');
  let ticking = false;

  let heroHeight = hero.offsetHeight;
  let heroOffsetTop = hero.offsetTop;

  const updateCache = () => {
    heroHeight = hero.offsetHeight;
    heroOffsetTop = hero.offsetTop;
  };

  window.addEventListener('resize', updateCache, { passive: true });
  window.addEventListener('layoutchange', updateCache, { passive: true });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroBottom = heroOffsetTop + heroHeight;

        if (scrollY < heroBottom + 200) {
          if (heroVisual) {
            const orbOffset = scrollY * 0.4;
            heroVisual.style.transform = `translateY(${orbOffset}px)`;
          }

          floatCards.forEach((card, i) => {
            const speed = 0.2 + (i * 0.15);
            const offset = scrollY * speed;
            card.style.transform = `translateY(${offset}px)`;
          });
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initStickyHeroEffect() {
  const hero = document.querySelector('[data-sticky-hero]');
  if (!hero) return;

  const heroContent = hero.querySelector('.hero-content');
  if (!heroContent) return;

  let ticking = false;
  let heroHeight = hero.offsetHeight;

  const updateCache = () => {
    heroHeight = hero.offsetHeight;
  };

  window.addEventListener('resize', updateCache, { passive: true });
  window.addEventListener('layoutchange', updateCache, { passive: true });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const fadeStart = heroHeight * 0.15;
        const fadeEnd = heroHeight * 0.65;

        if (scrollY <= fadeStart) {
          heroContent.style.opacity = '1';
          heroContent.style.transform = 'translateY(0) scale(1)';
        } else if (scrollY >= fadeEnd) {
          heroContent.style.opacity = '0';
          heroContent.style.transform = 'translateY(-30px) scale(0.95)';
        } else {
          const progress = (scrollY - fadeStart) / (fadeEnd - fadeStart);
          const opacity = 1 - progress;
          const translateY = -30 * progress;
          const scale = 1 - (0.05 * progress);
          heroContent.style.opacity = opacity;
          heroContent.style.transform = `translateY(${translateY}px) scale(${scale})`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initCardTilt() {
  if ('ontouchstart' in window) return;

  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -4;
      const tiltY = ((x - centerX) / centerX) * 4;

      const glowX = ((x / rect.width) * 100).toFixed(1) + '%';
      const glowY = ((y / rect.height) * 100).toFixed(1) + '%';

      card.style.setProperty('--tilt-x', tiltX + 'deg');
      card.style.setProperty('--tilt-y', tiltY + 'deg');
      card.style.setProperty('--glow-x', glowX);
      card.style.setProperty('--glow-y', glowY);
      card.classList.add('tilt-active');
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.classList.remove('tilt-active');
    });
  });
}

function initFloatingParticles() {
  const container = document.getElementById('particlesContainer');
  if (!container) return;

  const PARTICLE_COUNT = 14;
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'particle' + (Math.random() > 0.6 ? ' glow' : '');

    const size = 2 + Math.random() * 5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const opacity = 0.06 + Math.random() * 0.14;
    const speed = 0.05 + Math.random() * 0.2;
    const delay = Math.random() * 2;

    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = x + '%';
    el.style.top = y + '%';
    el.style.setProperty('--particle-opacity', opacity);
    el.style.animationDelay = delay + 's';

    container.appendChild(el);
    particles.push({ el, speed, baseY: (y / 100) * window.innerHeight });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        particles.forEach(p => {
          const offset = scrollY * p.speed;
          p.el.style.transform = `translateY(${-offset}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── Close modal on overlay click ───
document.getElementById('goalModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeGoalModal();
});

// Keyboard Esc support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeGoalModal();
});

// ─── Document Ready Initialization ───
document.addEventListener('DOMContentLoaded', () => {
  loadGoals();
  renderGoals();
  loadAnalytics();
  
  // Initialize timer mode
  setTimerMode('study');
  initDashboardFeatures();

  // Scroll animations and effects
  initScrollProgressBar();
  initScrollReveals();
  initParallax();
  initStickyHeroEffect();
  initCardTilt();
  initFloatingParticles();
});


// ─── NEW STATE VARIABLES ───
let subjects = [];
let revisions = [];
let forecastData = { examDate: '', dailyHours: 0 };

const STORAGE_SUBJECTS_KEY = 'studyMantra_subjects';
const STORAGE_REVISIONS_KEY = 'studyMantra_revisions';
const STORAGE_FORECAST_KEY = 'studyMantra_forecast';

// ─── LOAD DATA ───
function loadDashboardData() {
  const s = localStorage.getItem(STORAGE_SUBJECTS_KEY);
  if (s) subjects = JSON.parse(s);
  else subjects = [
    { id: 1, name: 'Physics', totalTopics: 20, completedTopics: 5, priority: 'high' },
    { id: 2, name: 'Chemistry', totalTopics: 15, completedTopics: 12, priority: 'medium' }
  ];

  const r = localStorage.getItem(STORAGE_REVISIONS_KEY);
  if (r) revisions = JSON.parse(r);
  else revisions = [
    { id: 1, subjectName: 'Physics', topicName: 'Kinematics', status: 0 },
    { id: 2, subjectName: 'Chemistry', topicName: 'Organic Chem', status: 3 }
  ];

  const f = localStorage.getItem(STORAGE_FORECAST_KEY);
  if (f) forecastData = JSON.parse(f);

  if (forecastData.examDate) {
    document.getElementById('forecastDate').value = forecastData.examDate;
    document.getElementById('forecastHours').value = forecastData.dailyHours;
  }
}

function saveSubjects() {
  localStorage.setItem(STORAGE_SUBJECTS_KEY, JSON.stringify(subjects));
  renderSubjects();
  updateStudyBalance();
  updateComebackMeter();
}

function saveRevisions() {
  localStorage.setItem(STORAGE_REVISIONS_KEY, JSON.stringify(revisions));
  renderRevisions();
}

// ─── SUBJECT PROGRESS MAP ───
function openSubjectModal() {
  document.getElementById('subjectModal').style.display = 'flex';
  document.getElementById('modalSubName').value = '';
  document.getElementById('modalSubTotal').value = '';
  document.getElementById('modalSubCompleted').value = '';
}
function closeSubjectModal() {
  document.getElementById('subjectModal').style.display = 'none';
}
function saveSubject() {
  const name = document.getElementById('modalSubName').value.trim();
  const total = parseInt(document.getElementById('modalSubTotal').value) || 0;
  const comp = parseInt(document.getElementById('modalSubCompleted').value) || 0;
  const prio = document.getElementById('modalSubPriority').value;

  if (!name || total <= 0) return alert('Enter valid subject details');

  subjects.push({
    id: Date.now(),
    name,
    totalTopics: total,
    completedTopics: comp,
    priority: prio
  });

  saveSubjects();
  closeSubjectModal();
}

function updateSubjectTopics(id, delta) {
  const sub = subjects.find(s => s.id === id);
  if(sub) {
    let newComp = sub.completedTopics + delta;
    if(newComp >= 0 && newComp <= sub.totalTopics) {
      sub.completedTopics = newComp;
      saveSubjects();
    }
  }
}

function deleteSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  saveSubjects();
}

function renderSubjects() {
  const list = document.getElementById('subjectList');
  list.innerHTML = '';

  const select = document.getElementById('modalRevSubject');
  select.innerHTML = '<option value="">Select a Subject...</option>';

  if (subjects.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim);">No subjects added yet.</div>';
    return;
  }

  subjects.forEach(sub => {
    // Populate revision select
    const opt = document.createElement('option');
    opt.value = sub.name;
    opt.innerText = sub.name;
    select.appendChild(opt);

    const progress = sub.totalTopics > 0 ? Math.round((sub.completedTopics / sub.totalTopics) * 100) : 0;
    let status = 'Comeback Mode';
    if (progress > 30 && progress <= 60) status = 'Getting Serious';
    else if (progress > 60 && progress <= 85) status = 'Topper Energy';
    else if (progress > 85) status = 'Syllabus Slayer';

    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <div class="sub-header">
        <div class="sub-name">${sub.name} <span class="badge outline" style="font-size:.6rem;margin-left:5px">${sub.priority}</span></div>
        <button class="btn-ghost" style="padding:2px 6px;font-size:.7rem" onclick="deleteSubject(${sub.id})">Del</button>
      </div>
      <div class="sub-meta" style="display:flex;align-items:center;gap:10px;margin-top:5px;">
        <button class="btn-ghost" style="padding:2px 8px;font-size:1.1rem;line-height:1;" onclick="updateSubjectTopics(${sub.id}, -1)">−</button>
        <span>${sub.completedTopics} / ${sub.totalTopics} Topics Completed (${progress}%)</span>
        <button class="btn-ghost" style="padding:2px 8px;font-size:1.1rem;line-height:1;" onclick="updateSubjectTopics(${sub.id}, 1)">+</button>
      </div>
      <div class="sub-progress-wrapper">
        <div class="sub-progress-bg">
          <div class="sub-progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="sub-status">
        <span>${status}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

// ─── REVISION RADAR ───
function openRevisionModal() {
  document.getElementById('revisionModal').style.display = 'flex';
  document.getElementById('modalRevName').value = '';
}
function closeRevisionModal() {
  document.getElementById('revisionModal').style.display = 'none';
}
function saveRevision() {
  const subName = document.getElementById('modalRevSubject').value;
  const topic = document.getElementById('modalRevName').value.trim();

  if (!subName || !topic) return alert('Select subject and enter topic name');

  revisions.push({
    id: Date.now(),
    subjectName: subName,
    topicName: topic,
    status: 0 // 0: Not revised, 1: Revised 1x, 2: Revised 2x, 3: Exam Ready
  });

  saveRevisions();
  closeRevisionModal();
}
function cycleRevisionStatus(id) {
  const rev = revisions.find(r => r.id === id);
  if (rev) {
    rev.status = (rev.status + 1) % 4;
    saveRevisions();
  }
}
function renderRevisions() {
  const list = document.getElementById('revisionList');
  list.innerHTML = '';

  let readyCount = 0;

  if (revisions.length === 0) {
    list.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-dim);">No topics to revise.</div>';
  } else {
    revisions.forEach(rev => {
      if (rev.status === 3) readyCount++;
      
      const labels = ['Not Revised', 'Revised 1x', 'Revised 2x', 'Exam Ready'];
      const card = document.createElement('div');
      card.className = 'revision-item';
      card.innerHTML = `
        <div class="rev-info">
          <div class="topic">${rev.topicName}</div>
          <div class="sub">${rev.subjectName}</div>
        </div>
        <div class="rev-status status-${rev.status}" onclick="cycleRevisionStatus(${rev.id})">${labels[rev.status]}</div>
      `;
      list.appendChild(card);
    });
  }

  document.getElementById('revTotalCount').innerText = revisions.length;
  document.getElementById('revReadyCount').innerText = readyCount;
}

// ─── STUDY BALANCE ───
function updateStudyBalance() {
  let totalComps = 0;
  let totalTopics = 0;
  
  subjects.forEach(s => {
    totalComps += s.completedTopics;
    totalTopics += s.totalTopics;
  });

  const pending = totalTopics - totalComps;
  document.getElementById('balCompleted').innerText = totalComps;
  document.getElementById('balPending').innerText = pending > 0 ? pending : 0;

  let ratio = 0;
  if (goals.length > 0) {
    const doneGoals = goals.filter(g => g.completed).length;
    ratio = Math.round((doneGoals / goals.length) * 100);
  }
  document.getElementById('balGoalRatio').innerText = ratio + '%';

  const prog = totalTopics > 0 ? (totalComps / totalTopics) * 100 : 0;
  let balStat = 'Kal Se Pakka Zone';
  let balMicro = 'Your academic comeback is loading...';

  if (prog > 30 && prog <= 60) {
    balStat = 'Comeback Loading';
    balMicro = 'Keep pushing. You are getting there.';
  } else if (prog > 60 && prog <= 85) {
    balStat = 'Topper Arc Started';
    balMicro = 'Consistency is your weapon now.';
  } else if (prog > 85) {
    balStat = 'Syllabus Slayer';
    balMicro = 'Nothing can stop you now.';
  }

  document.getElementById('balStatus').innerText = balStat;
  document.getElementById('balMicro').innerText = balMicro;
}

// ─── ACADEMIC COMEBACK METER ───
function updateComebackMeter() {
  // Score out of 100
  let score = 0;

  // Streak (Max 20 pts) - 1 pt per day up to 20
  score += Math.min(studyStreak, 20);

  // Focus Time Today (Max 20 pts) - 1 pt per 10 mins up to 200 mins
  score += Math.min(Math.floor(focusTimeToday / 10), 20);

  // Goal ratio (Max 30 pts)
  if (goals.length > 0) {
    const doneGoals = goals.filter(g => g.completed).length;
    score += Math.round((doneGoals / goals.length) * 30);
  }

  // Syllabus progress (Max 30 pts)
  let totalComps = 0;
  let totalTopics = 0;
  subjects.forEach(s => {
    totalComps += s.completedTopics;
    totalTopics += s.totalTopics;
  });
  if (totalTopics > 0) {
    score += Math.round((totalComps / totalTopics) * 30);
  }

  document.getElementById('meterScore').innerText = score;

  // Update SVG Circle (dasharray 210)
  const offset = 210 - (score / 100) * 210;
  document.getElementById('meterFill').style.strokeDashoffset = offset;

  let mTitle = 'Kal Se Pakka Zone';
  let mDesc = 'Syllabus ko panic nahi, plan se todte hain.';

  if (score > 30 && score <= 50) {
    mTitle = 'Trying Mode';
    mDesc = 'One topic at a time.';
  } else if (score > 50 && score <= 75) {
    mTitle = 'Comeback Loading';
    mDesc = 'Topper arc unlocked.';
  } else if (score > 75 && score <= 90) {
    mTitle = 'Topper Arc';
    mDesc = 'You are in the zone.';
  } else if (score > 90) {
    mTitle = 'Syllabus Slayer';
    mDesc = 'Academic comeback completed.';
  }

  document.getElementById('meterTitle').innerText = mTitle;
  document.getElementById('meterDesc').innerText = mDesc;
}


// ─── STUDY FORECAST ───
function calculateForecast() {
  const examDateStr = document.getElementById('forecastDate').value;
  const hours = parseFloat(document.getElementById('forecastHours').value);

  if (!examDateStr || !hours) return alert('Please enter exam date and daily hours.');

  const examDate = new Date(examDateStr);
  const today = new Date();
  
  // calculate diff in days
  const diffTime = examDate - today;
  let daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) daysLeft = 0;

  let totalComps = 0;
  let totalTopics = 0;
  subjects.forEach(s => {
    totalComps += s.completedTopics;
    totalTopics += s.totalTopics;
  });
  
  const pending = totalTopics - totalComps;
  const topicsPerDay = daysLeft > 0 ? (pending / daysLeft).toFixed(1) : pending;
  
  document.getElementById('forecastResults').style.display = 'block';
  document.getElementById('resDays').innerText = daysLeft;
  document.getElementById('resTopicsPerDay').innerText = topicsPerDay;

  let status = 'Chill Plan';
  let color = 'var(--text)';
  
  if (daysLeft === 0 && pending > 0) {
    status = 'Academic Emergency 🚨';
    color = '#ff4a4a';
  } else {
    // arbitrary thresholds
    if (topicsPerDay > 5) {
      status = 'Serious Mode Needed';
      color = '#ffaa00';
    } else if (topicsPerDay > 2) {
      status = 'Manageable Grind';
      color = 'var(--accent)';
    }
  }
  
  const statusEl = document.getElementById('resStatus');
  statusEl.innerText = status;
  statusEl.style.color = color;

  forecastData = { examDate: examDateStr, dailyHours: hours, totalTopics, completedTopics: totalComps };
  localStorage.setItem(STORAGE_FORECAST_KEY, JSON.stringify(forecastData));
}

// Initialize New Features
function initDashboardFeatures() {
  loadDashboardData();
  renderSubjects();
  renderRevisions();
  updateStudyBalance();
  updateComebackMeter();
  
  if (forecastData.examDate) {
    calculateForecast();
  }
}
