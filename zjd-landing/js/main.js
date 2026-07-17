// zjd.cn Landing Page v2
(function() {
  'use strict';

  const API_BASE = 'https://z.zjd.cn';

  // Navbar scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile nav
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // Animate numbers on scroll
  function animateNumber(el, target) {
    const duration = 1500;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString('zh-CN');
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Intersection Observer for stats
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const val = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10);
        if (val > 0) animateNumber(el, val);
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  ['stat-assets', 'stat-provinces', 'stat-districts', 'stat-today'].forEach(id => {
    const el = document.getElementById(id);
    if (el) statsObserver.observe(el);
  });

  // Fetch live stats
  async function fetchStats() {
    try {
      const res = await fetch(API_BASE + '/api/admin/stats', { mode: 'cors' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        const el1 = document.getElementById('stat-assets');
        const el2 = document.getElementById('stat-today');
        if (el1 && (data.totalAssets || data.total)) {
          el1.textContent = (data.totalAssets || data.total).toLocaleString('zh-CN');
        }
        if (el2 && data.todayNew) {
          el2.textContent = data.todayNew.toLocaleString('zh-CN');
        }
      }
    } catch {}
  }
  fetchStats();

})();
