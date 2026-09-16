/* ============================================================
   MD Noman Islam — Portfolio
   Interactions, scroll choreography, micro-animation
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap;
  var ST = window.ScrollTrigger;
  var useG = !!(G && ST) && !reduce;
  if (useG) G.registerPlugin(ST);
  if (reduce) document.documentElement.classList.add('no-anim');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- loader ---------------- */
  var loader = $('#loader'), bar = $('#loaderBar');
  var pct = 0;
  document.body.classList.add('loading');

  var tick = setInterval(function () {
    pct = Math.min(92, pct + Math.random() * 18);
    if (bar) bar.style.width = pct + '%';
  }, 180);

  function finishLoad() {
    clearInterval(tick);
    if (bar) bar.style.width = '100%';
    setTimeout(function () {
      if (loader) loader.classList.add('done');
      document.body.classList.remove('loading');
      playHero();
    }, 260);
  }
  if (document.readyState === 'complete') setTimeout(finishLoad, 350);
  else window.addEventListener('load', function () { setTimeout(finishLoad, 350); });
  setTimeout(finishLoad, 4200);

  /* ---------------- text splitting ---------------- */
  function splitChars(el) {
    // A gradient line must animate as one block: transformed child spans get their
    // own paint layer, which breaks background-clip:text on the parent.
    if (el.classList.contains('grad')) {
      var whole = el.textContent;
      el.classList.remove('grad');
      el.innerHTML = '<span class="ch grad">' + whole + '</span>';
      return $$('.ch', el);
    }
    var text = el.textContent, out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      out += ch === ' '
        ? '<span class="ch" style="width:.32em">&nbsp;</span>'
        : '<span class="ch">' + (ch === '&' ? '&amp;' : ch) + '</span>';
    }
    el.innerHTML = out;
    return $$('.ch', el);
  }

  function splitLines(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var ws = $$('.w', el), rows = [], last = null;
    ws.forEach(function (w) {
      var top = w.offsetTop;
      if (last === null || Math.abs(top - last) > 4) { rows.push([]); last = top; }
      rows[rows.length - 1].push(w.textContent);
    });
    el.innerHTML = rows.map(function (r) {
      return '<span class="ln"><i>' + r.join(' ') + '</i></span>';
    }).join('');
    return $$('.ln i', el);
  }

  var heroChars = [];
  $$('[data-split]').forEach(function (el) { heroChars = heroChars.concat(splitChars(el)); });

  var headLines = [];
  $$('[data-split-lines]').forEach(function (el) {
    var lines = splitLines(el);
    headLines.push({ el: el, lines: lines });
  });

  function show(nodes, stagger, delay) {
    if (useG) {
      G.set(nodes, { y: 0 });
      G.fromTo(nodes, { yPercent: 105 },
        { yPercent: 0, duration: 1.05, ease: 'power3.out', stagger: stagger, delay: delay || 0 });
    } else {
      nodes.forEach(function (n, i) {
        n.style.transition = 'transform .9s cubic-bezier(.22,.9,.28,1) ' + ((delay || 0) + i * stagger) + 's';
        n.style.transform = 'translateY(0%)';
      });
    }
  }

  var heroPlayed = false;
  function playHero() {
    if (heroPlayed) return;
    heroPlayed = true;
    if (reduce) {
      heroChars.forEach(function (c) { c.style.transform = 'none'; });
    } else {
      show(heroChars, 0.026, 0.12);
    }
    $$('.hero .reveal').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('in'); }, 520 + i * 120);
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = $$('.reveal').filter(function (el) { return !el.closest('.hero'); });

  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    headLines.forEach(function (h) { h.lines.forEach(function (l) { l.style.transform = 'none'; }); });
  } else if (useG) {
    ST.batch(revealEls, {
      start: 'top 88%',
      onEnter: function (batch) {
        batch.forEach(function (el, i) { setTimeout(function () { el.classList.add('in'); }, i * 85); });
      },
      once: true
    });
    headLines.forEach(function (h) {
      ST.create({
        trigger: h.el, start: 'top 86%', once: true,
        onEnter: function () { show(h.lines, 0.1, 0); }
      });
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var el = en.target;
        setTimeout(function () { el.classList.add('in'); }, Math.min(i * 80, 320));
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });

    var ioH = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var rec = headLines.filter(function (h) { return h.el === en.target; })[0];
        if (rec) show(rec.lines, 0.1, 0);
        ioH.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    headLines.forEach(function (h) { ioH.observe(h.el); });
  }

  /* ---------------- parallax + section depth ---------------- */
  if (useG) {
    $$('.section .sec-head').forEach(function (el) {
      G.fromTo(el, { y: 26 }, {
        y: -26, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
    var mq = $('#marqueeTrack');
    if (mq) {
      G.to(mq, {
        x: '-=220', ease: 'none',
        scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }
  }

  /* ---------------- marquee loop ---------------- */
  var track = $('#marqueeTrack');
  if (track && !reduce) {
    track.innerHTML = track.innerHTML + track.innerHTML;
    var mpos = 0, half = 0;
    var measure = function () { half = track.scrollWidth / 2; };
    setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    (function loop() {
      requestAnimationFrame(loop);
      if (!half) return;
      mpos -= 0.4;
      if (-mpos >= half) mpos = 0;
      track.style.transform = 'translate3d(' + mpos + 'px,0,0)';
    })();
  }

  /* ---------------- nav ---------------- */
  var nav = $('#nav'), progress = $('#progressBar');
  var links = $$('.nav-links a');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    if (nav) nav.classList.toggle('stuck', y > 24);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    var cur = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= window.innerHeight * 0.36) cur = sections[i].id;
    }
    links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  var menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
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

  /* ---------------- role rotator ---------------- */
  var roles = [
    'Large Language Models',
    'Human–Computer Interaction',
    'Sustainable Computing',
    'IT teams that ship',
    'UX research & design',
    'Computer Science education'
  ];
  var out = $('#roleRotate');
  if (out) {
    if (reduce) { out.textContent = roles[0]; }
    else {
      var ri = 0, ci = 0, del = false;
      (function type() {
        var word = roles[ri];
        out.textContent = word.slice(0, ci);
        var d = del ? 32 : 62;
        if (!del && ci === word.length) { del = true; d = 1700; }
        else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; d = 240; }
        else { ci += del ? -1 : 1; }
        setTimeout(type, d);
      })();
    }
  }

  /* ---------------- research filter ---------------- */
  var filters = $$('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      var want = btn.getAttribute('data-filter');
      $$('.rcard').forEach(function (card, i) {
        var ok = want === 'all' || card.getAttribute('data-type') === want;
        card.classList.toggle('hide', !ok);
        if (ok && !reduce) {
          card.classList.remove('in');
          void card.offsetWidth;
          setTimeout(function () { card.classList.add('in'); }, i * 55);
        }
      });
      if (useG) ST.refresh();
    });
  });

  /* ---------------- counters ---------------- */
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target.toFixed(dec) + suf; return; }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / 1600, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else counters.forEach(runCount);

  /* ---------------- cursor + magnets + tilt ---------------- */
  var fine = window.matchMedia('(pointer: fine)').matches;

  if (fine && !reduce) {
    var cur = $('#cursor');
    if (cur) {
      var cx = 0, cy = 0, tx = 0, ty = 0, raf = null;
      window.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        cur.classList.add('on');
        if (!raf) raf = requestAnimationFrame(follow);
      }, { passive: true });
      function follow() {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        raf = (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) ? requestAnimationFrame(follow) : null;
      }
      $$('a, button, [data-tilt]').forEach(function (el) {
        el.addEventListener('mouseenter', function () { cur.classList.add('hot'); });
        el.addEventListener('mouseleave', function () { cur.classList.remove('hot'); });
      });
    }

    $$('[data-magnet]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.22,.9,.28,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 520);
      });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 4.5) + 'deg) rotateY(' + (px * 5.5) + 'deg) translateY(-5px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .55s cubic-bezier(.22,.9,.28,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 580);
      });
    });
  }

  /* ---------------- misc ---------------- */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  if (useG) setTimeout(function () { ST.refresh(); }, 900);
})();
