/* ========== BUNK TANTRA — script.js ========== */

// ─── State ───
let subjects = [];
let editIndex = -1;
let balanceData = null; // stores last calculated total balance

const STORAGE_KEY = 'bunkTantra_subjects';

// ─── Microcopy Banks ───
const funnyMessages = {
  royal: [
    "You're untouchable. Even professors would bunk your class.",
    "Legend status unlocked. Go touch some grass 🌿",
    "Your attendance has its own fan club.",
    "Bunk all you want, king. The portal bows to you. 👑"
  ],
  safe: [
    "You're safe, but don't become legendary.",
    "Bunk smart, not blind.",
    "Chill zone. But keep one eye on the portal.",
    "You can afford a movie day. Just one though 🍿"
  ],
  borderline: [
    "75% ke border pe khade ho. Don't jump.",
    "One wrong bunk and you're writing apology emails.",
    "Walking on thin ice. In flip-flops. ❄️",
    "Your attendance is on life support. Handle with care."
  ],
  danger: [
    "Attendance is breathing. Keep it alive.",
    "Your professor may not notice, but the portal will.",
    "SOS! Time to become a first-bencher. 🚨",
    "Stop reading this and GO TO CLASS."
  ]
};

function getRandomMsg(zone) {
  const msgs = funnyMessages[zone] || funnyMessages.safe;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ─── Utility Functions ───
function getZone(percent) {
  if (percent >= 90) return 'royal';
  if (percent >= 80) return 'safe';
  if (percent >= 75) return 'borderline';
  return 'danger';
}

function getZoneLabel(zone) {
  const labels = {
    royal: '👑 Royal Bunker Zone',
    safe: '✅ Safe Zone',
    borderline: '⚠️ Borderline Zone',
    danger: '🚨 Red Alert Zone'
  };
  return labels[zone] || 'Unknown';
}

function getZoneClass(zone) {
  const map = { royal: 'royal', safe: 'safe', borderline: 'warn', danger: 'danger' };
  return map[zone] || 'safe';
}

function getStatusBadgeClass(zone) {
  return 'status-' + getZoneClass(zone);
}

function calcAttendance(total, attended) {
  if (total <= 0) return 0;
  return (attended / total) * 100;
}

function calcSafeBunks(total, attended, required) {
  // How many more classes can you skip?
  // After bunking b classes: attended / (total + b) >= required/100
  // b <= (attended * 100 - required * total) / required
  if (total <= 0 || required <= 0) return 0;
  const bunks = Math.floor((attended * 100 - required * total) / required);
  return Math.max(bunks, 0);
}

function calcRecovery(total, attended, required) {
  // How many consecutive classes to attend to reach required%?
  // (attended + r) / (total + r) >= required / 100
  // r >= (required * total - attended * 100) / (100 - required)
  const currentPercent = calcAttendance(total, attended);
  if (currentPercent >= required) return 0;
  if (required >= 100) return Infinity;
  const r = Math.ceil((required * total - attended * 100) / (100 - required));
  return Math.max(r, 0);
}

// ─── LocalStorage ───
function saveSubjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

function loadSubjects() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { subjects = JSON.parse(raw); } catch { subjects = []; }
  }
  if (subjects.length === 0) {
    // Initialize with empty array if no subjects exist yet
    // We'll prompt users to add their subjects upon sign up in the future
    subjects = [];
  }
}

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

// ─── Bunk Balance Calculator ───
function calculateBalance() {
  const total = parseInt(document.getElementById('totalClasses').value) || 0;
  const attended = parseInt(document.getElementById('attendedClasses').value) || 0;
  const required = parseFloat(document.getElementById('requiredPercent').value) || 75;

  if (total <= 0) {
    showToast('Enter total classes held');
    return;
  }
  if (attended > total) {
    showToast('Attended cannot exceed total classes');
    return;
  }

  const percent = calcAttendance(total, attended);
  const safeBunks = calcSafeBunks(total, attended, required);
  const recovery = calcRecovery(total, attended, required);
  const zone = getZone(percent);

  balanceData = { total, attended, required, percent, safeBunks, recovery, zone };

  // Update result panel
  const panel = document.getElementById('balanceResultPanel');
  panel.innerHTML = `
    <div class="result-row">
      <span class="result-label">Current Attendance</span>
      <span class="result-value ${getZoneClass(zone)}">${percent.toFixed(1)}%</span>
    </div>
    <div class="result-row">
      <span class="result-label">Bunks Available</span>
      <span class="result-value ${safeBunks > 0 ? 'safe' : 'danger'}">${safeBunks}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Recovery Classes Needed</span>
      <span class="result-value ${recovery > 0 ? 'danger' : 'safe'}">${recovery === Infinity ? '∞' : recovery}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Overall Status</span>
      <span class="status-badge ${getStatusBadgeClass(zone)}">${getZoneLabel(zone)}</span>
    </div>
    <div class="progress-bar-wrapper">
      <div class="progress-bar-fill ${zone === 'danger' ? 'danger-fill' : zone === 'borderline' ? 'warn-fill' : zone === 'royal' ? 'royal-fill' : ''}" 
           style="width:0%" id="balanceBar"></div>
    </div>
    <p class="microcopy">"${getRandomMsg(zone)}"</p>
  `;

  // Animate progress bar
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('balanceBar').style.width = Math.min(percent, 100) + '%';
    });
  });

  // Update hero orb
  document.getElementById('orbPercent').textContent = percent.toFixed(1) + '%';
  document.getElementById('fcBunks').textContent = safeBunks;
  document.getElementById('fcStatus').textContent = getZoneLabel(zone).split(' ').slice(1).join(' ');

  // Refresh dependent sections
  renderDangerMeter();
  renderEscapePlan();
  renderRecovery();
}

// ─── Subject Management ───
function renderSubjects() {
  const required = parseFloat(document.getElementById('requiredPercent').value) || 75;
  const tbody = document.getElementById('subjectBody');
  tbody.innerHTML = '';

  subjects.forEach((sub, i) => {
    const pct = calcAttendance(sub.total, sub.attended);
    const zone = getZone(pct);
    const safeBunks = calcSafeBunks(sub.total, sub.attended, required);

    const tr = document.createElement('tr');
    tr.style.animation = `slideIn .3s ease ${i * .05}s both`;
    tr.innerHTML = `
      <td class="subject-name">${escHtml(sub.name)}</td>
      <td>${sub.total}</td>
      <td>${sub.attended}</td>
      <td>
        <span class="result-value ${getZoneClass(zone)}">${pct.toFixed(1)}%</span>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill ${zone === 'danger' ? 'danger-fill' : zone === 'borderline' ? 'warn-fill' : zone === 'royal' ? 'royal-fill' : ''}" 
               style="width:${Math.min(pct, 100)}%"></div>
        </div>
      </td>
      <td><span class="${safeBunks > 0 ? 'result-value safe' : 'result-value danger'}">${safeBunks}</span></td>
      <td><span class="status-badge ${getStatusBadgeClass(zone)}">${getZoneLabel(zone)}</span></td>
      <td class="subject-actions">
        <button class="btn-sm" onclick="editSubject(${i})">✏️</button>
        <button class="btn-sm btn-danger" onclick="deleteSubject(${i})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Auto-refresh dependent sections
  renderDangerMeter();
  renderEscapePlan();
  renderRecovery();
  updateForecastDropdown();

  // Notify layout has changed
  window.dispatchEvent(new Event('layoutchange'));
}

function updateForecastDropdown() {
  const dropdown = document.getElementById('forecastSubject');
  if (!dropdown) return;
  const currentVal = dropdown.value;
  let html = '<option value="overall">📊 Overall Attendance</option>';
  subjects.forEach((sub, i) => {
    html += `<option value="${i}">📚 ${escHtml(sub.name)}</option>`;
  });
  dropdown.innerHTML = html;
  if (currentVal && dropdown.querySelector(`option[value="${currentVal}"]`)) {
    dropdown.value = currentVal;
  }
}

function openModal(index) {
  editIndex = index !== undefined ? index : -1;
  const modal = document.getElementById('subjectModal');
  const title = document.getElementById('modalTitle');

  if (editIndex >= 0) {
    title.textContent = 'Edit Subject';
    const sub = subjects[editIndex];
    document.getElementById('modalSubjectName').value = sub.name;
    document.getElementById('modalTotalClasses').value = sub.total;
    document.getElementById('modalAttended').value = sub.attended;
  } else {
    title.textContent = 'Add Subject';
    document.getElementById('modalSubjectName').value = '';
    document.getElementById('modalTotalClasses').value = '';
    document.getElementById('modalAttended').value = '';
  }
  modal.classList.add('active');
  document.getElementById('modalSubjectName').focus();
}

function closeModal() {
  document.getElementById('subjectModal').classList.remove('active');
  editIndex = -1;
}

function saveSubject() {
  const name = document.getElementById('modalSubjectName').value.trim();
  const total = parseInt(document.getElementById('modalTotalClasses').value) || 0;
  const attended = parseInt(document.getElementById('modalAttended').value) || 0;

  if (!name) { showToast('Enter subject name'); return; }
  if (total <= 0) { showToast('Total classes must be > 0'); return; }
  if (attended > total) { showToast('Attended cannot exceed total'); return; }

  if (editIndex >= 0) {
    subjects[editIndex] = { name, total, attended };
  } else {
    subjects.push({ name, total, attended });
  }

  saveSubjects();
  renderSubjects();
  closeModal();
  showToast(editIndex >= 0 ? 'Subject updated!' : 'Subject added!');
}

function editSubject(i) { openModal(i); }

function deleteSubject(i) {
  subjects.splice(i, 1);
  saveSubjects();
  renderSubjects();
  showToast('Subject removed');
}

// ─── Danger Meter ───
function renderDangerMeter() {
  const required = parseFloat(document.getElementById('requiredPercent').value) || 75;
  const grid = document.getElementById('meterGrid');
  const items = [];

  // Overall if balance was calculated
  if (balanceData) {
    items.push({
      name: '📊 Overall Attendance',
      percent: balanceData.percent,
      zone: balanceData.zone
    });
  }

  // Per subject
  subjects.forEach(sub => {
    const pct = calcAttendance(sub.total, sub.attended);
    items.push({ name: sub.name, percent: pct, zone: getZone(pct) });
  });

  if (items.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-dim);font-size:.88rem;grid-column:1/-1">Add subjects and calculate balance to see danger levels</div>';
    return;
  }

  // Sort items in ascending order of attendance percentage
  items.sort((a, b) => a.percent - b.percent);

  grid.innerHTML = items.map((item, i) => `
    <div class="meter-item" style="animation:fadeInUp .4s ease ${i * .06}s both">
      <div class="meter-name">${escHtml(item.name)}</div>
      <div class="meter-percent ${getZoneClass(item.zone)}">${item.percent.toFixed(1)}%</div>
      <div class="progress-bar-wrapper">
        <div class="progress-bar-fill ${item.zone === 'danger' ? 'danger-fill' : item.zone === 'borderline' ? 'warn-fill' : item.zone === 'royal' ? 'royal-fill' : ''}" 
             style="width:${Math.min(item.percent, 100)}%"></div>
      </div>
      <div class="meter-status">
        <span class="status-badge ${getStatusBadgeClass(item.zone)}">${getZoneLabel(item.zone)}</span>
      </div>
    </div>
  `).join('');
}

// ─── Bunk Forecast ───
function calculateForecast() {
  const upcoming = parseInt(document.getElementById('upcomingClasses').value) || 0;
  const planned = parseInt(document.getElementById('plannedBunks').value) || 0;
  const target = document.getElementById('forecastSubject') ? document.getElementById('forecastSubject').value : 'overall';

  if (upcoming <= 0) { showToast('Enter upcoming classes count'); return; }
  if (planned > upcoming) { showToast('Bunks cannot exceed upcoming classes'); return; }

  let baseTotal, baseAttended, basePercent;
  let targetName = 'Overall Attendance';

  if (target === 'overall') {
    if (!balanceData) { showToast('Calculate your Bunk Balance first ↑'); return; }
    baseTotal = balanceData.total;
    baseAttended = balanceData.attended;
    basePercent = balanceData.percent;
  } else {
    const sub = subjects[parseInt(target)];
    if (!sub) { showToast('Subject not found'); return; }
    baseTotal = sub.total;
    baseAttended = sub.attended;
    basePercent = calcAttendance(sub.total, sub.attended);
    targetName = sub.name;
  }

  const newTotal = baseTotal + upcoming;
  const newAttended = baseAttended + (upcoming - planned);
  const newPercent = calcAttendance(newTotal, newAttended);
  const zone = getZone(newPercent);
  const diff = newPercent - basePercent;

  const container = document.getElementById('forecastResult');
  container.innerHTML = `
    <div class="result-panel">
      <div class="result-row">
        <span class="result-label">Target</span>
        <span class="result-value" style="font-size:.85rem;max-width:120px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap">${escHtml(targetName)}</span>
      </div>
      <div class="result-row">
        <span class="result-label">New Attendance</span>
        <span class="result-value ${getZoneClass(zone)}">${newPercent.toFixed(1)}%</span>
      </div>
      <div class="result-row">
        <span class="result-label">Change</span>
        <span class="result-value ${diff >= 0 ? 'safe' : 'danger'}">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%</span>
      </div>
      <div class="result-row">
        <span class="result-label">Status After Bunks</span>
        <span class="status-badge ${getStatusBadgeClass(zone)}">${getZoneLabel(zone)}</span>
      </div>
      <div class="progress-bar-wrapper">
        <div class="progress-bar-fill ${zone === 'danger' ? 'danger-fill' : zone === 'borderline' ? 'warn-fill' : zone === 'royal' ? 'royal-fill' : ''}" 
             style="width:${Math.min(newPercent, 100)}%"></div>
      </div>
    </div>
    <div class="forecast-msg">"${getRandomMsg(zone)}"</div>
  `;
}

// ─── Safe Escape Plan ───
function renderEscapePlan() {
  const required = parseFloat(document.getElementById('requiredPercent').value) || 75;
  const container = document.getElementById('escapeResult');

  if (subjects.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-dim);font-size:.88rem">Add subjects to see bunk recommendations</div>';
    return;
  }

  // Find safest and riskiest
  let safest = null, riskiest = null;
  let maxBunks = -1, minBunks = Infinity;

  subjects.forEach(sub => {
    const bunks = calcSafeBunks(sub.total, sub.attended, required);
    const pct = calcAttendance(sub.total, sub.attended);
    if (bunks > maxBunks) { maxBunks = bunks; safest = { ...sub, bunks, pct }; }
    if (bunks < minBunks) { minBunks = bunks; riskiest = { ...sub, bunks, pct }; }
  });

  // Overall recommendation
  const avgPct = subjects.reduce((sum, s) => sum + calcAttendance(s.total, s.attended), 0) / subjects.length;
  const overallZone = getZone(avgPct);
  let recommendation = '';
  if (overallZone === 'royal') recommendation = 'Your attendance is legendary. Bunk freely but wisely.';
  else if (overallZone === 'safe') recommendation = 'You have room to breathe, but keep monitoring weekly.';
  else if (overallZone === 'borderline') recommendation = 'No more bunks recommended. Attend everything this week.';
  else recommendation = 'EMERGENCY: Attend all classes immediately. Every class counts now.';

  container.innerHTML = `
    <div class="suggestion-item">
      <div class="suggestion-icon">✅</div>
      <div>
        <div class="suggestion-title" style="color:var(--safe)">Safest to Bunk: ${safest ? escHtml(safest.name) : '—'}</div>
        <div class="suggestion-desc">${safest ? `${safest.pct.toFixed(1)}% attendance · ${safest.bunks} bunks available` : 'No data'}</div>
      </div>
    </div>
    <div class="suggestion-item">
      <div class="suggestion-icon">🚫</div>
      <div>
        <div class="suggestion-title" style="color:var(--danger)">Avoid Bunking: ${riskiest ? escHtml(riskiest.name) : '—'}</div>
        <div class="suggestion-desc">${riskiest ? `${riskiest.pct.toFixed(1)}% attendance · ${riskiest.bunks} bunks available` : 'No data'}</div>
      </div>
    </div>
    <div class="suggestion-item">
      <div class="suggestion-icon">💡</div>
      <div>
        <div class="suggestion-title">Overall Recommendation</div>
        <div class="suggestion-desc">${recommendation}</div>
      </div>
    </div>
    <p class="microcopy">"Bunk smart, not blind."</p>
  `;
}

// ─── Recovery Mission ───
function renderRecovery() {
  const required = parseFloat(document.getElementById('requiredPercent').value) || 75;
  const container = document.getElementById('recoveryResult');
  const items = [];

  // Overall
  if (balanceData && balanceData.recovery > 0) {
    items.push({ name: '📊 Overall', recovery: balanceData.recovery, percent: balanceData.percent });
  }

  // Per subject
  subjects.forEach(sub => {
    const pct = calcAttendance(sub.total, sub.attended);
    const rec = calcRecovery(sub.total, sub.attended, required);
    if (rec > 0) {
      items.push({ name: sub.name, recovery: rec, percent: pct });
    }
  });

  if (items.length === 0) {
    const hasData = balanceData || subjects.length > 0;
    container.innerHTML = hasData
      ? `<div class="recovery-highlight">
           <div class="recovery-number">0</div>
           <div class="recovery-label">No recovery needed! All attendance is above ${required}% 🎉</div>
         </div>
         <p class="microcopy">"You're safe, but don't become legendary."</p>`
      : '<div style="text-align:center;padding:30px;color:var(--text-dim);font-size:.88rem">Calculate your bunk balance first to see recovery data</div>';
    return;
  }

  container.innerHTML = items.map((item, i) => `
    <div class="suggestion-item" style="animation:fadeInUp .4s ease ${i * .08}s both">
      <div class="suggestion-icon">🏥</div>
      <div style="flex:1">
        <div class="suggestion-title">${escHtml(item.name)}</div>
        <div class="suggestion-desc">
          Current: <strong class="result-value danger">${item.percent.toFixed(1)}%</strong> · 
          Must attend <strong class="result-value warn">${item.recovery === Infinity ? '∞' : item.recovery}</strong> classes continuously to recover
        </div>
        <div class="progress-bar-wrapper" style="margin-top:8px">
          <div class="progress-bar-fill danger-fill" style="width:${Math.min(item.percent, 100)}%"></div>
        </div>
      </div>
    </div>
  `).join('') + `<p class="microcopy">"Attendance is breathing. Keep it alive."</p>`;
}

// ─── Toast Notification ───
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%) translateY(20px)',
      padding: '12px 28px', borderRadius: '50px', fontSize: '.88rem', fontWeight: '600',
      background: 'rgba(53,89,73,.9)', color: '#BBE3CE',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(187,227,206,.15)', boxShadow: '0 8px 30px rgba(0,0,0,.4)',
      zIndex: '999', opacity: '0', transition: 'all .3s ease', pointerEvents: 'none'
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

// ─── HTML Escape ───
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM SCROLL ANIMATION ENGINE
// ═══════════════════════════════════════════════════════════════

// ─── Scroll Progress Bar ───
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

// ─── Scroll Reveal (IntersectionObserver) ───
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  if (revealElements.length === 0) return;

  // Group elements by their parent section for stagger
  const sectionMap = new Map();
  revealElements.forEach(el => {
    const section = el.closest('.section') || el.closest('.hero') || document.body;
    if (!sectionMap.has(section)) sectionMap.set(section, []);
    sectionMap.get(section).push(el);
  });

  // Assign stagger delays within each section
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

// ─── Parallax Engine ───
function initParallax() {
  const hero = document.querySelector('[data-sticky-hero]');
  if (!hero) return;

  const heroVisual = hero.querySelector('.hero-visual');
  const floatCards = hero.querySelectorAll('.float-card');
  let ticking = false;

  // Cache layout parameters to prevent layout thrashing on scroll
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

        // Only apply parallax when hero is in/near viewport
        if (scrollY < heroBottom + 200) {
          if (heroVisual) {
            // Orb moves at 0.4x speed — creates depth
            const orbOffset = scrollY * 0.4;
            heroVisual.style.transform = `translateY(${orbOffset}px)`;
          }

          floatCards.forEach((card, i) => {
            // Float cards at different speeds for layered depth
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

// ─── Sticky Hero Fade Effect ───
function initStickyHeroEffect() {
  const hero = document.querySelector('[data-sticky-hero]');
  if (!hero) return;

  const heroContent = hero.querySelector('.hero-content');
  if (!heroContent) return;

  let ticking = false;

  // Cache layout parameters to prevent layout thrashing on scroll
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

// ─── 3D Card Tilt + Cursor Glow ───
function initCardTilt() {
  // Skip on touch devices
  if ('ontouchstart' in window) return;

  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Tilt: ±4 degrees max
      const tiltX = ((y - centerY) / centerY) * -4;
      const tiltY = ((x - centerX) / centerX) * 4;

      // Glow position (percentage)
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

// ─── Floating Particles ───
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
    const speed = 0.05 + Math.random() * 0.2; // parallax speed factor
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

  // Parallax movement on scroll
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
document.getElementById('subjectModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ─── Keyboard support ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  loadSubjects();
  renderSubjects();

  // Premium scroll engine
  initScrollProgressBar();
  initScrollReveals();
  initParallax();
  initStickyHeroEffect();
  initCardTilt();
  initFloatingParticles();
});
