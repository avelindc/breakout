// dashboard/js/analytics.js
document.addEventListener('DOMContentLoaded', () => {
  // Try to load manual analytics from localStorage for the active user
  const activeUserId = localStorage.getItem('activeDashboardUserId');
  const storedKey = activeUserId ? `userAnalytics_${activeUserId}` : 'userAnalytics';
  let userStats = JSON.parse(localStorage.getItem(storedKey)) || {
    totalStreams: 0,
    spotify: 0,
    apple: 0,
    youtube: 0,
    tiktok: 0,
    amazon: 0,
    joox: 0,
    totalListeners: 0,
    grossRevenue: 0,
    deductions: 0,
    netRoyalty: 0,
    currency: 'USD',
    reportDate: new Date().toISOString().split('T')[0]
  };

  const formatNumber = (num) => {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCurrency = (amount, curr) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amount);
  };

  // Populate Stat Cards
  const textContentIfExist = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  textContentIfExist('statTotalStreams', formatNumber(userStats.totalStreams));
  textContentIfExist('statTotalRoyalty', formatCurrency(userStats.netRoyalty, userStats.currency));
  let activeReleasesCount = 0;
  let totalWithdrawn = 0;
  try {
    const db = JSON.parse(localStorage.getItem('nela_db'));
    if (db && db.releases) {
      const userReleases = db.releases.filter(r => r.userId === activeUserId);
      activeReleasesCount = userReleases.filter(r => r.status === 'live' || r.status === 'approved').length;
    }
    if (db && db.transactions) {
      const userTxns = db.transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed' && t.userId === activeUserId);
      totalWithdrawn = userTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }
  } catch(e) {}

  textContentIfExist('statTotalWithdrawn', formatCurrency(totalWithdrawn, userStats.currency));

  textContentIfExist('statTotalReleases', activeReleasesCount.toString());
  textContentIfExist('statActiveSongs', activeReleasesCount.toString());
  textContentIfExist('statSaldo', formatCurrency(userStats.netRoyalty, userStats.currency));
  const vStat = document.getElementById('statVerification');
  if (vStat) vStat.innerHTML = '<span class="badge badge-green">Verified</span>';

  // Platform Stats
  textContentIfExist('platSpotify', formatNumber(userStats.spotify));
  textContentIfExist('platApple', formatNumber(userStats.apple));
  textContentIfExist('platYouTube', formatNumber(userStats.youtube));
  textContentIfExist('platTikTok', formatNumber(userStats.tiktok));

  // Common Chart.js Options
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#94A3B8';
    Chart.defaults.font.family = 'Inter, sans-serif';
    const gridOptions = { color: 'rgba(255,255,255,0.05)' };

    // Utility to generate mock trend data that scales up to target
    const generateTrend = (points, target) => {
      if (target === 0) return Array(points).fill(0);
      return Array.from({length: points}, (_, i) => Math.round(target * ((i + 1) / points) * (0.8 + Math.random() * 0.4)));
    };

    // Line Chart: Streams Harian (7 hari)
    const ctxDaily = document.getElementById('chartDailyStreams');
    if (ctxDaily) {
      new Chart(ctxDaily.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
          datasets: [{
            label: 'Streams',
            data: generateTrend(7, userStats.totalStreams || 0),
            borderColor: '#FFC107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { grid: gridOptions } }
        }
      });
    }

    // Line Chart: Streams Bulanan (12 bulan)
    const ctxMonthly = document.getElementById('chartMonthlyStreams');
    if (ctxMonthly) {
      new Chart(ctxMonthly.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Streams',
            data: generateTrend(12, userStats.totalStreams || 0),
            borderColor: '#FFC107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { grid: gridOptions } }
        }
      });
    }

    // Area Chart: Pertumbuhan Listener
    const ctxListener = document.getElementById('chartListenerGrowth');
    if (ctxListener) {
      new Chart(ctxListener.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Listeners',
            data: generateTrend(6, userStats.totalListeners || 0),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { grid: gridOptions } }
        }
      });
    }

    // Bar Chart: Pendapatan Bulanan
    const ctxRevenue = document.getElementById('chartRevenue');
    if (ctxRevenue) {
      new Chart(ctxRevenue.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue',
            data: generateTrend(6, userStats.grossRevenue || 0),
            backgroundColor: '#10B981',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { grid: gridOptions } }
        }
      });
    }

    // Bar Chart: Top 10 Lagu
    const ctxTopSongs = document.getElementById('chartTopSongs');
    if (ctxTopSongs) {
      new Chart(ctxTopSongs.getContext('2d'), {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Streams',
            data: [],
            backgroundColor: '#FFC107',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: gridOptions }, y: { grid: { display: false } } }
        }
      });
    }

    // Pie Chart: Platform
    const ctxPlatform = document.getElementById('chartPlatform');
    if (ctxPlatform) {
      new Chart(ctxPlatform.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Spotify', 'Apple', 'YouTube', 'TikTok', 'Deezer', 'Amazon', 'Joox'],
          datasets: [{
            data: [userStats.spotify, userStats.apple, userStats.youtube, userStats.tiktok, 0, userStats.amazon, userStats.joox],
            backgroundColor: ['#1DB954', '#FA243C', '#FF0000', '#00F2FE', '#00C7F2', '#FF9900', '#25D366'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#E2E8F0', font: { family: 'Inter' } } }
          },
          cutout: '70%'
        }
      });
    }
  }
});
