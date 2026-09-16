/* ============================================================
   MD Noman Islam — Portfolio
   Three.js scroll-driven 3D scene
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('gl');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fail() {
    document.body.classList.add('no-gl');
    if (canvas) canvas.style.display = 'none';
    window.__scene = { ready: false, setProgress: function () {}, setFormation: function () {} };
  }

  if (!canvas || typeof THREE === 'undefined') { fail(); return; }

  try {
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) { fail(); return; }
  } catch (e) { fail(); return; }

  var W = window.innerWidth, H = window.innerHeight;
  var mobile = W < 760;
  var COUNT = reduce ? 1200 : (mobile ? 2200 : 4200);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { fail(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2));
  renderer.setSize(W, H, false);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 100);
  camera.position.set(0, 0, 16);

  var world = new THREE.Group();
  scene.add(world);

  /* ---------- formations ---------- */
  var R = 3.75;

  function sphere(n) {
    var a = new Float32Array(n * 3), gr = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2, rad = Math.sqrt(Math.max(0, 1 - y * y)), th = gr * i;
      a[i * 3] = Math.cos(th) * rad * R;
      a[i * 3 + 1] = y * R;
      a[i * 3 + 2] = Math.sin(th) * rad * R;
    }
    return a;
  }

  function torus(n) {
    var a = new Float32Array(n * 3), Rr = 3.1, rr = 1.15;
    for (var i = 0; i < n; i++) {
      var u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 2;
      a[i * 3] = (Rr + rr * Math.cos(v)) * Math.cos(u);
      a[i * 3 + 1] = rr * Math.sin(v);
      a[i * 3 + 2] = (Rr + rr * Math.cos(v)) * Math.sin(u);
    }
    return a;
  }

  function helix(n) {
    var a = new Float32Array(n * 3), turns = 4.2, hgt = 9;
    for (var i = 0; i < n; i++) {
      var t = i / n, strand = i % 2 === 0 ? 0 : Math.PI;
      var ang = t * Math.PI * 2 * turns + strand;
      var rad = 2.5 + Math.sin(t * Math.PI) * 0.9;
      a[i * 3] = Math.cos(ang) * rad + (Math.random() - 0.5) * 0.25;
      a[i * 3 + 1] = (t - 0.5) * hgt;
      a[i * 3 + 2] = Math.sin(ang) * rad + (Math.random() - 0.5) * 0.25;
    }
    return a;
  }

  function grid(n) {
    var a = new Float32Array(n * 3), side = Math.ceil(Math.sqrt(n)), span = 10;
    for (var i = 0; i < n; i++) {
      var gx = (i % side) / (side - 1) - 0.5, gz = Math.floor(i / side) / (side - 1) - 0.5;
      var x = gx * span, z = gz * span, d = Math.sqrt(x * x + z * z);
      a[i * 3] = x;
      a[i * 3 + 1] = Math.sin(d * 0.95) * 1.5 - 0.4;
      a[i * 3 + 2] = z;
    }
    return a;
  }

  function galaxy(n) {
    var a = new Float32Array(n * 3), arms = 4;
    for (var i = 0; i < n; i++) {
      var t = Math.pow(Math.random(), 0.55), arm = (i % arms) / arms * Math.PI * 2;
      var ang = arm + t * 5.0, rad = t * 4.9;
      var sp = (1 - t) * 0.85;
      a[i * 3] = Math.cos(ang) * rad + (Math.random() - 0.5) * sp;
      a[i * 3 + 1] = (Math.random() - 0.5) * (0.5 + sp * 1.2);
      a[i * 3 + 2] = Math.sin(ang) * rad + (Math.random() - 0.5) * sp;
    }
    return a;
  }

  function lattice(n) {
    var a = new Float32Array(n * 3), side = Math.ceil(Math.cbrt(n)), span = 6.8;
    for (var i = 0; i < n; i++) {
      var x = i % side, y = Math.floor(i / side) % side, z = Math.floor(i / (side * side));
      a[i * 3] = (x / (side - 1) - 0.5) * span;
      a[i * 3 + 1] = (y / (side - 1) - 0.5) * span;
      a[i * 3 + 2] = (z / (side - 1) - 0.5) * span;
    }
    return a;
  }

  function rings(n) {
    var a = new Float32Array(n * 3), k = 3;
    for (var i = 0; i < n; i++) {
      var ring = i % k, ang = (i / n) * Math.PI * 2 * 9;
      var rad = 2.1 + ring * 1.2, tilt = ring * 0.62;
      var x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      a[i * 3] = x;
      a[i * 3 + 1] = z * Math.sin(tilt) + (Math.random() - 0.5) * 0.14;
      a[i * 3 + 2] = z * Math.cos(tilt);
    }
    return a;
  }

  var FORMS = {
    sphere: sphere(COUNT), torus: torus(COUNT), helix: helix(COUNT),
    grid: grid(COUNT), galaxy: galaxy(COUNT), lattice: lattice(COUNT), rings: rings(COUNT)
  };

  /* ---------- point cloud ---------- */
  var geo = new THREE.BufferGeometry();
  var cur = new Float32Array(FORMS.sphere);
  var tgt = new Float32Array(FORMS.sphere);
  var sizes = new Float32Array(COUNT);
  var cols = new Float32Array(COUNT * 3);

  var PAL = [[0.69, 0.58, 0.87], [0.55, 0.44, 0.75], [0.44, 0.32, 0.66], [0.80, 0.72, 0.92]];
  for (var i = 0; i < COUNT; i++) {
    sizes[i] = 0.55 + Math.random() * 1.15;
    var c = PAL[(Math.random() * PAL.length) | 0];
    cols[i * 3] = c[0]; cols[i * 3 + 1] = c[1]; cols[i * 3 + 2] = c[2];
  }

  geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));

  var uniforms = {
    uMix: { value: 1 },
    uTime: { value: 0 },
    uSize: { value: mobile ? 0.19 : 0.23 }
  };

  var mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: [
      'attribute vec3 aTarget;',
      'attribute float aSize;',
      'attribute vec3 aColor;',
      'uniform float uMix;',
      'uniform float uTime;',
      'uniform float uSize;',
      'varying vec3 vColor;',
      'varying float vFade;',
      'void main(){',
      '  vec3 p = mix(position, aTarget, uMix);',
      '  p.y += sin(uTime * 0.55 + p.x * 1.3) * 0.07;',
      '  p.x += cos(uTime * 0.45 + p.z * 1.3) * 0.07;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  gl_PointSize = aSize * uSize * (300.0 / max(0.1, -mv.z));',
      '  gl_Position = projectionMatrix * mv;',
      '  vColor = aColor;',
      '  vFade = clamp(1.0 - (-mv.z - 10.0) / 26.0, 0.12, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vColor;',
      'varying float vFade;',
      'void main(){',
      '  vec2 c = gl_PointCoord - vec2(0.5);',
      '  float d = length(c);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.08, d) * vFade;',
      '  gl_FragColor = vec4(vColor, a * 0.62);',
      '}'
    ].join('\n')
  });

  var points = new THREE.Points(geo, mat);
  world.add(points);

  /* ---------- floating solids ---------- */
  var solids = [];
  if (!reduce) {
    var defs = [
      { r: 0.95, pos: [-6.6, 2.4, -7.0], col: 0xb095df, det: 1 },
      { r: 0.72, pos: [6.4, -2.4, -6.0], col: 0x8b6fc0, det: 0 },
      { r: 0.55, pos: [5.0, 3.3, -9.0], col: 0xcdb8ea, det: 1 }
    ];
    for (var s = 0; s < defs.length; s++) {
      var d = defs[s];
      var g = new THREE.IcosahedronGeometry(d.r, d.det);
      var m = new THREE.MeshStandardMaterial({
        color: d.col, roughness: 0.34, metalness: 0.12,
        flatShading: true, transparent: true, opacity: 0.42
      });
      var mesh = new THREE.Mesh(g, m);
      mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
      mesh.userData.spin = (Math.random() - 0.5) * 0.3 + 0.12;
      mesh.userData.base = d.pos[1];
      mesh.userData.off = Math.random() * 6;
      scene.add(mesh);
      solids.push(mesh);
    }
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  var key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(4, 6, 8);
  scene.add(key);
  var rim = new THREE.PointLight(0x8b6fc0, 1.35, 40);
  rim.position.set(-7, -4, 5);
  scene.add(rim);

  /* ---------- formation switching ---------- */
  var mixV = 1, currentName = 'sphere';

  function setFormation(name) {
    if (!FORMS[name] || name === currentName) return;
    var pos = geo.attributes.position.array, tg = geo.attributes.aTarget.array;
    for (var k = 0; k < pos.length; k++) pos[k] = pos[k] + (tg[k] - pos[k]) * mixV;
    var next = FORMS[name];
    for (var j = 0; j < tg.length; j++) tg[j] = next[j];
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aTarget.needsUpdate = true;
    mixV = 0;
    uniforms.uMix.value = 0;
    currentName = name;
  }

  /* ---------- scroll + pointer ---------- */
  var prog = 0, progT = 0;
  var mx = 0, my = 0, mxT = 0, myT = 0;

  function readScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progT = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  if (!mobile) {
    window.addEventListener('mousemove', function (e) {
      mxT = (e.clientX / window.innerWidth - 0.5) * 2;
      myT = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  var secs = [].slice.call(document.querySelectorAll('[data-scene]'));
  if ('IntersectionObserver' in window && secs.length) {
    var io = new IntersectionObserver(function (entries) {
      var best = null, ratio = 0;
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio > ratio) { ratio = en.intersectionRatio; best = en.target; }
      });
      if (best) setFormation(best.getAttribute('data-scene'));
    }, { threshold: [0.22, 0.5, 0.75], rootMargin: '-12% 0px -12% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---------- resize ---------- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      W = window.innerWidth; H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
      readScroll();
    }, 140);
  });

  /* ---------- loop ---------- */
  var visible = true;
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; });

  var clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;

    var dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value += dt;

    if (mixV < 1) {
      mixV = Math.min(1, mixV + dt * (reduce ? 4 : 1.05));
      uniforms.uMix.value = mixV < 1 ? (1 - Math.pow(1 - mixV, 3)) : 1;
    }

    prog += (progT - prog) * Math.min(1, dt * 3.2);
    mx += (mxT - mx) * Math.min(1, dt * 2.6);
    my += (myT - my) * Math.min(1, dt * 2.6);

    world.rotation.y = prog * Math.PI * 1.5 + mx * 0.22;
    world.rotation.x = Math.sin(prog * Math.PI) * 0.22 + my * 0.12;
    world.position.y = prog * 1.1;

    camera.position.z = 16 - prog * 3.2;
    camera.position.x = mx * 0.85;
    camera.position.y = -my * 0.55 + prog * 0.7;
    camera.lookAt(0, world.position.y * 0.35, 0);

    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      s.rotation.x += dt * s.userData.spin * 0.55;
      s.rotation.y += dt * s.userData.spin;
      s.position.y = s.userData.base + Math.sin(uniforms.uTime.value * 0.5 + s.userData.off) * 0.45;
    }

    renderer.render(scene, camera);
  }

  frame();

  window.__scene = { ready: true, setFormation: setFormation };
})();
