// macOS-style portfolio — window manager, dock, menu bar, lock screen
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

  const wins = {};
  $$('.win').forEach(w => { wins[w.dataset.app] = w; w.dataset.state = 'closed'; });

  let z = 10;

  /* ---------- Window manager ---------- */
  // Center the window in the free area (between menu bar and dock)
  function place(w) {
    if (isMobile() || w.dataset.placed) return;
    const r = w.getBoundingClientRect();
    const freeH = window.innerHeight - 28 - 90;
    const left = Math.max(12, (window.innerWidth - r.width) / 2);
    const top = Math.max(12, (freeH - r.height) / 2 + 4);
    w.style.left = left + 'px';
    w.style.top = top + 'px';
    w.dataset.placed = '1';
  }

  function updateDock() {
    $$('.dock-item[data-open]').forEach(b => {
      const w = wins[b.dataset.open];
      b.classList.toggle('running', !!w && w.dataset.state !== 'closed');
    });
  }

  function focusWin(w) {
    z += 1;
    w.style.zIndex = z;
    $$('.win').forEach(x => x.classList.toggle('active', x === w));
    $('#appName').textContent = w.dataset.name || 'Finder';
  }

  function topOpenWin() {
    return $$('.win').filter(x => !x.hidden).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
  }

  function openApp(name) {
    const w = wins[name];
    if (!w) return;
    // One window at a time: close every other window first
    $$('.win').forEach(o => {
      if (o !== w && !o.hidden) {
        o.hidden = true;
        o.dataset.state = 'closed';
        o.classList.remove('max', 'closing', 'pop');
      }
    });
    if (w.hidden) {
      w.hidden = false;
      w.classList.remove('closing');
      place(w);
      w.classList.add('pop');
      setTimeout(() => w.classList.remove('pop'), 260);
    }
    w.dataset.state = 'open';
    if (name === 'resume') {
      const f = $('#pdfFrame');
      if (f && !f.getAttribute('src')) f.setAttribute('src', f.dataset.src);
    }
    focusWin(w);
    updateDock();
  }

  function hideApp(w, state) {
    w.classList.add('closing');
    setTimeout(() => {
      w.hidden = true;
      w.classList.remove('closing');
      w.dataset.state = state;
      if (state === 'closed') w.classList.remove('max');
      const next = topOpenWin();
      if (next) focusWin(next); else { $$('.win').forEach(x => x.classList.remove('active')); $('#appName').textContent = 'Finder'; }
      updateDock();
    }, 150);
  }

  // Open from any element with data-open
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open]');
    if (!t) return;
    if (t.classList.contains('desk-icon') && !window.matchMedia('(pointer: coarse)').matches) {
      $$('.desk-icon').forEach(i => i.classList.remove('sel'));
      return; // desktop: open on double click
    }
    openApp(t.dataset.open);
    closeApple();
  });
  document.addEventListener('dblclick', e => {
    const t = e.target.closest('.desk-icon[data-open]');
    if (t) openApp(t.dataset.open);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const t = document.activeElement;
      if (t && t.classList && t.classList.contains('desk-icon')) openApp(t.dataset.open);
    }
  });

  // Traffic lights + focus on press
  $$('.win').forEach(w => {
    w.addEventListener('pointerdown', () => { if (!w.classList.contains('active')) focusWin(w); });
    $('.l.close', w).addEventListener('click', () => hideApp(w, 'closed'));
    $('.l.min', w).addEventListener('click', () => hideApp(w, 'min'));
    $('.l.max', w).addEventListener('click', () => w.classList.toggle('max'));
    $('.titlebar', w).addEventListener('dblclick', e => {
      if (!e.target.closest('.l') && !isMobile()) w.classList.toggle('max');
    });

    // Dragging
    const bar = $('.titlebar', w);
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.l') || isMobile() || w.classList.contains('max')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = w.offsetLeft; oy = w.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', e => {
      if (!dragging) return;
      const nx = ox + e.clientX - sx;
      const ny = oy + e.clientY - sy;
      w.style.left = Math.max(-w.offsetWidth + 90, Math.min(window.innerWidth - 90, nx)) + 'px';
      w.style.top = Math.max(0, Math.min(window.innerHeight - 28 - 40, ny)) + 'px';
    });
    const stop = e => { dragging = false; try { bar.releasePointerCapture(e.pointerId); } catch (_) {} };
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  });

  // Escape closes the active window
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !$('#lock').classList.contains('gone')) return;
    const w = $('.win.active:not([hidden])');
    if (w) hideApp(w, 'closed');
    closeApple();
  });

  /* ---------- Projects list ---------- */
  $$('.side-item').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.side-item').forEach(b => b.classList.toggle('active', b === btn));
      $$('[data-proj-pane]').forEach(p => { p.hidden = p.dataset.projPane !== btn.dataset.proj; });
      const pane = $('#win-projects .pane');
      if (pane) pane.scrollTop = 0;
    });
  });

  /* ---------- Contact form -> mailto ---------- */
  $('#mailForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#mfName').value.trim();
    const subject = $('#mfSubject').value.trim() || 'Hello Ranim';
    let body = $('#mfBody').value.trim();
    if (name) body += (body ? '\n\n' : '') + '— ' + name;
    window.location.href = 'mailto:ranim.bouguila@enis.tn?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

  /* ---------- Dock magnification ---------- */
  const dock = $('#dock');
  const items = $$('.dock-item', dock);
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    dock.addEventListener('mousemove', e => {
      items.forEach(it => {
        const r = it.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        const s = 1 + 0.55 * Math.max(0, 1 - d / 120);
        it.classList.remove('reset');
        it.style.setProperty('--s', s.toFixed(3));
      });
    });
    dock.addEventListener('mouseleave', () => {
      items.forEach(it => { it.classList.add('reset'); it.style.setProperty('--s', 1); });
    });
  }

  /* ---------- Apple menu ---------- */
  const appleBtn = $('#appleBtn');
  const applePop = $('#applePop');
  function closeApple() { applePop.hidden = true; appleBtn.setAttribute('aria-expanded', 'false'); }
  appleBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = applePop.hidden;
    applePop.hidden = !open;
    appleBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => { if (!e.target.closest('.menu-wrap')) closeApple(); });

  /* ---------- Clock ---------- */
  const clock = $('#clock');
  const lockTime = $('#lockTime');
  const lockDate = $('#lockDate');
  function tick() {
    const d = new Date();
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    clock.textContent = day + '  ' + time;
    lockTime.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
    lockDate.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Lock screen ---------- */
  const lock = $('#lock');
  function unlock() {
    if (lock.classList.contains('gone')) return;
    lock.classList.add('gone');
    try { sessionStorage.setItem('unlocked', '1'); } catch (_) {}
    const hash = location.hash.replace('#', '');
    openApp(wins[hash] ? hash : 'about');
  }
  function relock() {
    closeApple();
    lock.classList.remove('gone');
    try { sessionStorage.removeItem('unlocked'); } catch (_) {}
    $('#enterBtn').focus();
  }
  $('#enterBtn').addEventListener('click', unlock);
  lock.addEventListener('click', unlock);
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && !lock.classList.contains('gone')) unlock(); });
  $('#lockBtn').addEventListener('click', relock);

  let skip = false;
  try { skip = sessionStorage.getItem('unlocked') === '1'; } catch (_) {}
  if (skip) {
    lock.classList.add('gone');
    const hash = location.hash.replace('#', '');
    openApp(wins[hash] ? hash : 'about');
  } else {
    $('#enterBtn').focus();
  }
})();