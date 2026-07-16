/* ===========================================
   BREAKOUT MUSIC DISTRIBUTION — SHARED JAVASCRIPT
   shared/nela.js
=========================================== */

// FACTORY RESET SCRIPT: Clears old mock data from localStorage
// but keeps registered users (nelaUsers).
(function() {
  if (!localStorage.getItem('nela_factory_reset_v2')) {
    localStorage.removeItem('nela_db');
    localStorage.removeItem('userAnalytics');
    localStorage.setItem('nela_factory_reset_v2', 'true');
  }
})();

/* ===== SIDEBAR GENERATORS ===== */
const SVG_ICONS = {
  overview: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  statistics: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  revenue: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  releases: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
  upload: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>`,
  royalties: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="12" y1="12" x2="12" y2="12.01"></line><line x1="16" y1="12" x2="16" y2="12.01"></line><line x1="8" y1="12" x2="8" y2="12.01"></line></svg>`,
  withdrawal: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>`,
  history: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  reports: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  plans: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"></polygon></svg>`,
  billing: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  signout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  artists: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
  subscriptions: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  analytics: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
};

function renderArtistSidebar(activePage) {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const nav = (page, iconKey, label, badge) => `
    <a href="${_artistHref(page)}" class="nav-item ${activePage===page?'active':''}" data-page="${page}">
      <span class="nav-icon">${SVG_ICONS[iconKey] || ''}</span>${label}${badge?`<span class="nav-badge">${badge}</span>`:''}
    </a>`;
  let currentUser = { firstName: 'Alex', lastName: 'Johnson', plan: '✦ Pro Artist' };
  try {
    const savedUser = JSON.parse(localStorage.getItem('nelaCurrentUser'));
    if (savedUser && savedUser.firstName) {
      currentUser = savedUser;
      currentUser.plan = savedUser.type ? '✦ ' + savedUser.type.charAt(0).toUpperCase() + savedUser.type.slice(1) : '✦ Pro Artist';
    }
  } catch(e) {}
  
  const initial = currentUser.firstName.charAt(0).toUpperCase();
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;

  el.innerHTML = `
    <a href="/dashboard/index.html" class="sidebar-logo" style="color:inherit;">
      <div class="logo-icon">B</div>
      <span class="sidebar-brand">BREAKOUT MUSIC</span>
    </a>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main</div>
      ${nav('overview','overview','Overview')}
      ${nav('statistics','statistics','Statistics')}
      ${nav('revenue','revenue','Revenue')}
      ${nav('releases','releases','My Releases')}
      <div class="nav-section-label">Distribution</div>
      ${nav('upload','upload','Upload Music')}
      <div class="nav-section-label">Finance</div>
      ${nav('royalties','royalties','Royalties')}
      ${nav('withdrawal','withdrawal','Withdrawal')}
      ${nav('history','history','History')}
      ${nav('reports','reports','Reports')}
      <div class="nav-section-label">Account</div>
      ${nav('plans','plans','Subscription')}
      ${nav('billing','billing','Billing')}
      <a href="/auth/login.html" class="nav-item" onclick="localStorage.removeItem('nelaCurrentUser')"><span class="nav-icon">${SVG_ICONS.signout}</span>Sign Out</a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-profile">
        <div class="user-avatar">${initial}</div>
        <div class="user-info">
          <div class="user-name">${fullName}</div>
          <div class="user-plan">${currentUser.plan}</div>
        </div>
      </div>
    </div>`;
}

function _artistHref(page) {
  const map = {
    overview: '/dashboard/index.html', statistics: '/dashboard/statistics.html',
    revenue: '/dashboard/revenue.html', releases: '/dashboard/releases.html',
    upload: '/upload/index.html', royalties: '/royalties/index.html',
    withdrawal: '/royalties/withdrawal.html', history: '/royalties/history.html',
    reports: '/royalties/reports.html', plans: '/subscription/plans.html',
    billing: '/subscription/billing.html'
  };
  return map[page] || '#';
}

function renderAdminSidebar(activePage) {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const nav = (page, iconKey, label, badge) => `
    <a href="${_adminHref(page)}" class="nav-item ${activePage===page?'active':''}" data-page="${page}">
      <span class="nav-icon">${SVG_ICONS[iconKey] || ''}</span>${badge?`<span class="nav-badge nav-badge-red">${badge}</span>`:''}${label}
    </a>`;
  let pendingCount = '';
  try {
    const db = JSON.parse(localStorage.getItem('nela_db'));
    if (db && db.releases) {
      const p = db.releases.filter(r => r.status === 'pending').length;
      if (p > 0) pendingCount = p.toString();
    }
  } catch(e) {}

  el.innerHTML = `
    <a href="/admin/index.html" class="sidebar-logo" style="color:inherit;">
      <div class="logo-icon" style="background:linear-gradient(135deg,#EF4444,#F97316)">B</div>
      <span class="sidebar-brand">BREAKOUT MUSIC Admin</span>
    </a>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Dashboard</div>
      ${nav('overview','overview','Overview')}
      <div class="nav-section-label">Management</div>
      ${nav('users','users','Users')}
      ${nav('artists','artists','Artists')}
      ${nav('releases','releases','Releases', pendingCount)}
      <div class="nav-section-label">Finance</div>
      ${nav('royalties','royalties','Royalties')}
      ${nav('subscriptions','subscriptions','Subscriptions')}
      <div class="nav-section-label">System</div>
      ${nav('analytics','analytics','Analytics')}
      ${nav('settings','settings','Settings')}
      <a href="#" class="nav-item" onclick="handleAdminLogout(event)"><span class="nav-icon">${SVG_ICONS.signout}</span>Sign Out</a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-profile">
        <div class="user-avatar" style="background:linear-gradient(135deg,#EF4444,#F97316)">S</div>
        <div class="user-info">
          <div class="user-name">Super Admin</div>
          <div class="user-plan" style="color:#F97316">Administrator</div>
        </div>
      </div>
    </div>`;
}

function _adminHref(page) {
  const map = {
    overview: '/admin/index.html', users: '/admin/users.html', artists: '/admin/artists.html',
    releases: '/admin/releases.html', royalties: '/admin/royalties.html',
    subscriptions: '/admin/subscriptions.html', analytics: '/admin/analytics.html',
    settings: '/admin/settings.html'
  };
  return map[page] || '#';
}

/* ===== SIDEBAR TOGGLE ===== */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburgerBtn');
  if (!hamburger || !sidebar) return;
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  });
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
}

/* ===== TOAST ===== */
function showToast(msg, type = 'success') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.classList.add('show'), 30);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3500);
}

/* ===== CANVAS LINE CHART ===== */
function drawLineChart(canvas, data, opts = {}) {
  if (!canvas || !data || data.length < 2) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : 500;
  const h = canvas.height = opts.height || 160;
  const pad = opts.padding || 22;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(...data) * 1.12 || 1;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - (v / max) * (h - pad * 2)
  }));
  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(t => {
    const y = pad + t * (h - pad * 2);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
  });
  // Line with bezier curves
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) { ctx.moveTo(p.x, p.y); return; }
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
  });
  const lg = ctx.createLinearGradient(0, 0, w, 0);
  lg.addColorStop(0, '#8B5CF6'); lg.addColorStop(0.5, '#3B82F6'); lg.addColorStop(1, '#06B6D4');
  ctx.strokeStyle = lg; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
  // Gradient fill
  const last = pts[pts.length - 1]; const first = pts[0];
  ctx.lineTo(last.x, h - pad); ctx.lineTo(first.x, h - pad); ctx.closePath();
  const fg = ctx.createLinearGradient(0, 0, 0, h);
  fg.addColorStop(0, 'rgba(139,92,246,0.22)'); fg.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = fg; ctx.fill();
  // Dots on last point
  const lp = pts[pts.length - 1];
  ctx.beginPath(); ctx.arc(lp.x, lp.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#8B5CF6'; ctx.fill();
  ctx.beginPath(); ctx.arc(lp.x, lp.y, 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(139,92,246,0.3)'; ctx.lineWidth = 2; ctx.stroke();
}

/* ===== CANVAS BAR CHART ===== */
function drawBarChart(canvas, data, labels, opts = {}) {
  if (!canvas || !data || !data.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : 500;
  const h = canvas.height = opts.height || 140;
  const pad = 22;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(...data) * 1.1 || 1;
  const slot = (w - pad * 2) / data.length;
  const barW = Math.max(Math.min(slot * 0.55, 44), 8);
  data.forEach((v, i) => {
    const barH = (v / max) * (h - pad * 2 - 18);
    const x = pad + i * slot + (slot - barW) / 2;
    const y = h - pad - 18 - barH;
    const g = ctx.createLinearGradient(0, y, 0, y + barH);
    g.addColorStop(0, 'rgba(139,92,246,0.88)'); g.addColorStop(1, 'rgba(59,130,246,0.4)');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, 4);
    else ctx.rect(x, y, barW, barH);
    ctx.fill();
    if (labels && labels[i]) {
      ctx.fillStyle = 'rgba(100,116,139,0.8)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, h - 6);
    }
  });
}

/* ===== CANVAS DONUT CHART ===== */
function drawDonutChart(canvas, data, colors, opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = opts.size || 180;
  canvas.width = size; canvas.height = size;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.42, innerR = r * 0.63;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let start = -Math.PI / 2;
  data.forEach((v, i) => {
    const angle = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.arc(cx, cy, innerR, start + angle, start, true);
    ctx.closePath();
    ctx.fillStyle = colors[i] || '#8B5CF6';
    ctx.fill();
    start += angle + 0.014;
  });
  // Center text
  if (opts.centerText) {
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.round(size * 0.11)}px Outfit, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(opts.centerText, cx, cy);
  }
}

/* ===== MODAL HELPERS ===== */
function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initSidebar();
});

/* ===== ADMIN LOGOUT ===== */
function handleAdminLogout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('adminLoggedIn');
  window.location.href = 'login.html';
}

/* ===== LOCAL STORAGE DATABASE ===== */
const DEFAULT_NELA_DB = {
  releases: [],
  transactions: [],
  balances: {
    available: 0.00,
    pending: 0.00,
    withdrawn: 0.00,
    estimated: 0.00
  }
};

function getNelaDB() {
  try {
    const data = localStorage.getItem('nela_db');
    if (!data) {
      localStorage.setItem('nela_db', JSON.stringify(DEFAULT_NELA_DB));
      return DEFAULT_NELA_DB;
    }
    return JSON.parse(data);
  } catch (e) {
    console.warn("localStorage is blocked or unavailable:", e);
    return DEFAULT_NELA_DB;
  }
}

function saveNelaDB(db) {
  try {
    localStorage.setItem('nela_db', JSON.stringify(db));
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }
}
