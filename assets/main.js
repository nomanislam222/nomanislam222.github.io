/* ============================================================
   MD Noman Islam — Portfolio interactions
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('nm-theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') {
    root.setAttribute('data-theme', stored);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute('data-theme', 'light');
  }
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'light' ? '#f6f7fb' : '#06070d');
      try { localStorage.setItem('nm-theme', next); } catch (e) {}
    });
  }

  /* ---------- year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- portrait fallback ---------- */
  var img = document.getElementById('portraitImg');
  if (img) {
    var fail = function () {
      var p = img.closest('.portrait');
      if (p) p.classList.add('fallback');
    };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- nav state, scroll progress, scrollspy ---------- */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('progressBar');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (nav) nav.classList.toggle('stuck', y > 24);

    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }

    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= window.innerHeight * 0.34) current = sections[i].id;
    }
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });

    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (en.isIntersecting) {
          var el = en.target;
          setTimeout(function () { el.classList.add('in'); }, Math.min(i * 70, 320));
          io.unobserve(el);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
  }

  /* ---------- role rotator ---------- */
  var roles = [
    'Large Language Models',
    'Human–Computer Interaction',
    'Software Engineering',
    'Sustainable Computing',
    'UX Research & Design',
    'Computer Science Education'
  ];
  var out = document.getElementById('roleRotate');
  if (out) {
    if (reduceMotion) {
      out.textContent = roles[0];
    } else {
      var ri = 0, ci = 0, deleting = false;
      (function type() {
        var word = roles[ri];
        out.textContent = word.slice(0, ci);
        var delay = deleting ? 34 : 62;
        if (!deleting && ci === word.length) { deleting = true; delay = 1700; }
        else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 260; }
        else { ci += deleting ? -1 : 1; }
        setTimeout(type, delay);
      })();
    }
  }

  /* ---------- research filter ---------- */
  var filters = document.querySelectorAll('.filter');
  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(filters, function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      var want = btn.getAttribute('data-filter');
      Array.prototype.forEach.call(document.querySelectorAll('.rcard'), function (card) {
        var show = want === 'all' || card.getAttribute('data-type') === want;
        card.classList.toggle('hide', !show);
        if (show) { card.classList.remove('in'); void card.offsetWidth; card.classList.add('in'); }
      });
    });
  });

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target.toFixed(dec) + suffix; return; }
    var start = null, dur = 1500;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
  } else {
    Array.prototype.forEach.call(counters, runCount);
  }

  /* ---------- cursor glow ---------- */
  var glow = document.querySelector('.cursor-glow');
  if (glow && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var gx = 0, gy = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!raf) raf = requestAnimationFrame(follow);
    }, { passive: true });
    function follow() {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.left = cx + 'px';
      glow.style.top = cy + 'px';
      raf = (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5) ? requestAnimationFrame(follow) : null;
    }
  }
})();
