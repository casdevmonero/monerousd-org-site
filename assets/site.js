// MoneroUSD site — scroll reveals, the hero's block-DAG backdrop and the mobile menu. No trackers, no third-party calls.
(function () {
  // clean addresses: a page opened by an old link (/business.html) shows /business in the address bar. The .html file
  // still answers, so no old link breaks; this only tidies what the visitor sees and shares.
  try {
    var clean = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (clean !== location.pathname && /^https?:$/.test(location.protocol)) history.replaceState(null, '', clean + location.search + location.hash);
  } catch (e) { /* the address stays as typed */ }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // reveal + start diagram animations when they scroll in
  var els = document.querySelectorAll('.rv, .anim');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }
  // mobile menu
  var nav = document.querySelector('.nav'), mb = document.querySelector('.menu-btn');
  if (nav && mb) mb.addEventListener('click', function (ev) { ev.preventDefault(); var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  var menu = document.getElementById('menu');
  if (nav && mb && menu) menu.addEventListener('click', function (ev) { if (ev.target.closest('a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); } });
  // film player: the native controls are replaced by a scrub bar that previews the frame under the pointer (a sprite
  // sheet of thumbnails, one every data-thumb-every seconds), play/pause, mute and fullscreen. Without JS the native
  // controls stay.
  document.querySelectorAll('[data-player]').forEach(function (box) {
    var v = box.querySelector('video'); if (!v) return;
    var every = +box.dataset.thumbEvery || 2, cols = +box.dataset.thumbCols || 10, tw = +box.dataset.thumbW || 160, th = +box.dataset.thumbH || 90, sprite = box.dataset.thumbs;
    var I = { play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>', pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
      vol: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
      mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9zm15.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z"/></svg>',
      fs: '<svg viewBox="0 0 24 24"><path d="M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zM5 14h2v3h3v2H5zm12 3v-3h2v5h-5v-2z"/></svg>',
      dl: '<svg viewBox="0 0 24 24"><path d="M11 4h2v8.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4 3.3 3.3zM5 18h14v2H5z"/></svg>' };
    // the download link points at the same file the player streams (a plain link, so it works without JS too)
    var srcEl = v.querySelector('source'), file = (srcEl && srcEl.getAttribute('src')) || v.getAttribute('src') || '';
    v.controls = false; v.removeAttribute('controls'); v.preload = 'metadata';
    box.classList.add('pl'); box.tabIndex = 0; box.setAttribute('aria-label', 'Film player');
    box.insertAdjacentHTML('beforeend',
      '<div class="pl-ui"><div class="pl-track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">' +
      '<div class="pl-rail"><div class="pl-buf"></div><div class="pl-hov"></div><div class="pl-fill"></div></div><div class="pl-knob"></div>' +
      '<div class="pl-prev"><div class="pl-thumb"></div><span>0:00</span></div></div>' +
      '<div class="pl-row"><button class="pl-btn pl-pp" type="button" aria-label="Play">' + I.play + '</button>' +
      '<button class="pl-btn pl-vol" type="button" aria-label="Mute">' + I.vol + '</button><span class="pl-time">0:00 / 0:00</span><span class="pl-sp"></span>' +
      (file ? '<a class="pl-btn pl-dl" href="' + file + '" download="' + (box.dataset.download || 'MoneroUSD-film.mp4') + '" aria-label="Download the film (MP4)" title="Download the film">' + I.dl + '</a>' : '') +
      '<button class="pl-btn pl-fs" type="button" aria-label="Full screen">' + I.fs + '</button></div></div>');
    var q = function (s) { return box.querySelector(s); };
    var ui = q('.pl-ui'), track = q('.pl-track'), fill = q('.pl-fill'), buf = q('.pl-buf'), hov = q('.pl-hov'), knob = q('.pl-knob'),
      prev = q('.pl-prev'), thumb = q('.pl-thumb'), ptime = q('.pl-prev span'), pp = q('.pl-pp'), vol = q('.pl-vol'), time = q('.pl-time'), fsb = q('.pl-fs');
    var fmt = function (t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); };
    var dur = function () { return isFinite(v.duration) ? v.duration : 0; };
    var dragging = false, wasPlaying = false, idleT = 0;
    function paint(t) {
      var d = dur(), f = d ? Math.min(1, Math.max(0, t / d)) : 0;
      fill.style.width = (f * 100) + '%'; knob.style.left = (f * 100) + '%';
      time.textContent = fmt(t) + ' / ' + fmt(d);
      track.setAttribute('aria-valuemax', Math.round(d)); track.setAttribute('aria-valuenow', Math.round(t)); track.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(d));
    }
    function paintBuf() { var d = dur(); if (!d || !v.buffered.length) return; buf.style.width = (v.buffered.end(v.buffered.length - 1) / d * 100) + '%'; }
    function timeAt(ev) { var r = track.getBoundingClientRect(); var f = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); return { f: f, t: f * dur(), x: f * r.width, w: r.width }; }
    function preview(ev) {
      var p = timeAt(ev); if (!dur()) return p;
      hov.style.width = (p.f * 100) + '%';
      var half = (thumb.offsetWidth || tw) / 2 + 4; prev.style.left = Math.min(p.w - half, Math.max(half, p.x)) + 'px';
      ptime.textContent = fmt(p.t);
      if (sprite) {
        var k = Math.min(Math.floor(p.t / every), Math.ceil(dur() / every) - 1), s = (thumb.offsetWidth || tw) / tw;
        thumb.style.backgroundImage = 'url(' + sprite + ')';
        thumb.style.backgroundSize = (cols * tw * s) + 'px auto';
        thumb.style.backgroundPosition = (-(k % cols) * tw * s) + 'px ' + (-Math.floor(k / cols) * th * s) + 'px';
      } else thumb.style.display = 'none';
      return p;
    }
    function toggle() { if (v.paused || v.ended) v.play(); else v.pause(); }
    function wake() { box.classList.remove('idle'); clearTimeout(idleT); if (!v.paused) idleT = setTimeout(function () { if (!dragging) box.classList.add('idle'); }, 2500); }
    function seek(t) { if (dur()) { v.currentTime = Math.min(dur() - 0.05, Math.max(0, t)); paint(v.currentTime); } }
    v.addEventListener('loadedmetadata', function () { paint(v.currentTime); });
    v.addEventListener('timeupdate', function () { if (!dragging) paint(v.currentTime); });
    v.addEventListener('progress', paintBuf);
    v.addEventListener('play', function () { box.classList.add('playing'); pp.innerHTML = I.pause; pp.setAttribute('aria-label', 'Pause'); wake(); });
    v.addEventListener('pause', function () { box.classList.remove('playing', 'idle'); pp.innerHTML = I.play; pp.setAttribute('aria-label', 'Play'); });
    v.addEventListener('volumechange', function () { vol.innerHTML = v.muted ? I.mute : I.vol; vol.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute'); });
    v.addEventListener('click', toggle);
    pp.addEventListener('click', toggle);
    vol.addEventListener('click', function () { v.muted = !v.muted; });
    fsb.addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen(); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); });
    box.addEventListener('pointermove', wake);
    track.addEventListener('pointermove', function (e) { var p = preview(e); if (dragging) { fill.style.width = (p.f * 100) + '%'; knob.style.left = (p.f * 100) + '%'; time.textContent = fmt(p.t) + ' / ' + fmt(dur()); } });
    track.addEventListener('pointerdown', function (e) {
      if (!dur()) return; e.preventDefault(); dragging = true; wasPlaying = !v.paused; v.pause(); track.classList.add('drag');
      track.setPointerCapture(e.pointerId); var p = preview(e); seek(p.t);
    });
    function endDrag(e) { if (!dragging) return; dragging = false; track.classList.remove('drag'); seek(timeAt(e).t); if (wasPlaying) v.play(); }
    track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag);
    ui.addEventListener('click', function (e) { e.stopPropagation(); });
    box.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
      else if (k === 'ArrowRight') { e.preventDefault(); seek(v.currentTime + 5); }
      else if (k === 'ArrowLeft') { e.preventDefault(); seek(v.currentTime - 5); }
      else if (k === 'm') vol.click();
      else if (k === 'f') fsb.click();
      wake();
    });
    paint(0);
  });
  // hero backdrop: blocks appear in parallel lanes and link to the previous column, drifting left (a block-DAG)
  var cv = document.getElementById('dag');
  if (!cv || reduce) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); window.addEventListener('resize', size);
  var cols = [], step = 120, x0 = 0, last = performance.now(), running = true;
  function addCol(x) { var n = 1 + Math.floor(Math.random() * 3), c = []; for (var i = 0; i < n; i++) c.push({ x: x, y: H * (0.2 + 0.6 * (i + 0.5 + (Math.random() - .5) * .6) / n), born: performance.now() }); cols.push(c); }
  for (var x = 0; x < 2400; x += step) addCol(x);
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(t) {
    if (!running) return;
    var dt = Math.min(50, t - last); last = t; x0 += dt * 0.028;
    ctx.clearRect(0, 0, W, H);
    while (cols.length && cols[0][0].x - x0 < -step) cols.shift();
    while (cols.length && cols[cols.length - 1][0].x - x0 < W + step) addCol(cols[cols.length - 1][0].x + step);
    for (var i = 1; i < cols.length; i++) for (var a = 0; a < cols[i].length; a++) for (var b = 0; b < cols[i - 1].length; b++) {
      var p = cols[i][a], q = cols[i - 1][b];
      ctx.strokeStyle = 'rgba(255,122,0,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x - x0 + 16, q.y); ctx.lineTo(p.x - x0 - 16, p.y); ctx.stroke();
    }
    for (i = 0; i < cols.length; i++) for (a = 0; a < cols[i].length; a++) {
      var k = cols[i][a], fx = k.x - x0, edge = Math.min(1, fx / 300, (W - fx) / 300);
      ctx.globalAlpha = Math.max(0, edge) * 0.9;
      ctx.fillStyle = '#121216'; ctx.strokeStyle = 'rgba(255,122,0,0.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(fx - 16, k.y - 11, 32, 22, 5); else ctx.rect(fx - 16, k.y - 11, 32, 22); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
