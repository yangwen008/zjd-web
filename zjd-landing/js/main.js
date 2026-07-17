// zjd.cn Landing Page - Main JS
(function() {
  'use strict';

  const API_BASE = 'https://z.zjd.cn';

  // ====== Navbar Scroll ======
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // ====== Mobile Nav Toggle ======
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // Close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  // ====== Fetch Live Stats (CORS-safe: try API, fallback to static) ======
  async function fetchStats() {
    // 静态数据（虚拟空间无法跨域调用 z.zjd.cn API 时的兜底）
    animateNumber('stat-assets', 104281);
    animateNumber('stat-today', 142);
    animateNumber('stat-brokers', 86);
    animateNumber('stat-regions', 877);

    // 尝试拉取实时数据（需要 z.zjd.cn 开启 CORS）
    try {
      const res = await fetch(API_BASE + '/api/admin/stats', { mode: 'cors' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        animateNumber('stat-assets', data.totalAssets || data.total || 104281);
        animateNumber('stat-today', data.todayNew || 142);
      }
    } catch (e) {
      // 静态数据已展示，忽略跨域错误
    }
  }

  // ====== Fetch Latest Assets ======
  async function fetchLatestAssets() {
    try {
      const res = await fetch(API_BASE + '/api/assets?limit=3&sort=newest', { mode: 'cors' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        renderLatestAssets(data.data);
      }
    } catch (e) {
      // 静态占位，不影响页面
    }
  }

  function renderLatestAssets(assets) {
    const container = document.getElementById('latestAssets');
    if (!container) return;
    container.innerHTML = assets.map(asset => {
      let imgSrc = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=300&h=200&fit=crop';
      try {
        if (asset.images) {
          const arr = JSON.parse(asset.images);
          if (arr.length > 0) {
            const first = arr[0];
            imgSrc = typeof first === 'object' ? (first.thumb || first.url) : first;
            if (!imgSrc.startsWith('http')) imgSrc = API_BASE + '/api/images/' + imgSrc;
          }
        }
      } catch {}
      const price = asset.price_year ? '¥' + asset.price_year + '万/年' : '价格面议';
      const loc = asset.province ? asset.province + (asset.city ? '·' + asset.city : '') : '全国';
      return '<a href="' + API_BASE + '/asset/' + asset.id + '" target="_blank" class="asset-mini">' +
        '<img src="' + imgSrc + '" alt="' + escapeHtml(asset.title) + '" class="asset-mini-img" loading="lazy">' +
        '<div class="asset-mini-body">' +
        '<div class="asset-mini-title">' + escapeHtml(asset.title) + '</div>' +
        '<div class="asset-mini-meta">' + loc + ' · ' + price + '</div>' +
        '</div></a>';
    }).join('');
  }

  // ====== Number Animation ======
  function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = 0;
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      el.textContent = current.toLocaleString('zh-CN');
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ====== Escape HTML ======
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ====== Smooth Scroll for Anchor Links ======
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ====== Init ======
  fetchStats();
  fetchLatestAssets();

})();
