// Site-level behaviour: Engineer-box default, theme, reader (progress, resume, sheet), freshness, "new since last visit", quizzes, glossary search, radar.
// Escape text before it goes into HTML or an attribute. Data from the page (JSON, headings) is never trusted as markup.
const escH = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const today = new Date();
const iso = d => d.toISOString().slice(0, 10);

/* ---------- Engineer boxes: closed (default) | open. Stored as lfg-depth = beginner | engineer for continuity. ---------- */
function applyDepth(depth, initial) {
  document.documentElement.dataset.depth = depth;
  $$('[data-depth-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.depthBtn === depth)));
  $$('details.eng').forEach(d => { d.open = depth === 'engineer'; });
  if (!initial) store.set('lfg-depth', depth);
}
applyDepth(store.get('lfg-depth', 'beginner'), true);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-depth-btn]');
  if (b) applyDepth(b.dataset.depthBtn, false);
});

/* ---------- colour theme: auto (system) -> light -> dark ---------- */
function applyTheme(t) {
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  $$('[data-theme-set]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.themeSet === t)));
  // redraw canvases/SVGs that read colours at draw time
  window.dispatchEvent(new Event('resize'));
}
applyTheme(store.get('lfg-theme', 'auto'));

document.addEventListener('click', e => {
  const b = e.target.closest('[data-theme-set]'); if (!b) return;
  store.set('lfg-theme', b.dataset.themeSet); applyTheme(b.dataset.themeSet);
});

/* ---------- text size: s | m | l ---------- */
function applySize(z) {
  if (z === 'm') delete document.documentElement.dataset.size; else document.documentElement.dataset.size = z;
  $$('[data-size-btn]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.sizeBtn === z)));
}
applySize(store.get('lfg-size', 'm'));
document.addEventListener('click', e => {
  const b = e.target.closest('[data-size-btn]'); if (!b) return;
  store.set('lfg-size', b.dataset.sizeBtn); applySize(b.dataset.sizeBtn); readerUpdate && readerUpdate();
});

var readerUpdate = null;

/* ---------- menu sheet ---------- */
const sheet = $('#sheet');
let sheetReturn = null;
function openSheet(at) {
  if (!sheet || sheet.open) return;
  sheetReturn = document.activeElement;
  readerUpdate && readerUpdate();
  sheet.showModal();
  const target = at && document.getElementById(at);
  const body = sheet.querySelector('.sheet-body');
  if (target && body) body.scrollTop = target.offsetTop - body.offsetTop;
  else if (body) body.scrollTop = 0;
  const focusEl = (target && target.querySelector('[aria-current], a, button')) || sheet.querySelector('[data-sheet-close]');
  if (focusEl) focusEl.focus({ preventScroll: true });
}
function closeSheet() { if (sheet && sheet.open) sheet.close(); }
if (sheet) {
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-sheet-open]'); if (o) { e.preventDefault(); openSheet(o.dataset.sheetAt); return; }
    if (e.target.closest('[data-sheet-close]')) closeSheet();
  });
  // tap on the backdrop closes; links inside close before navigating within the page
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); const a = e.target.closest('a[href^="#"]'); if (a) closeSheet(); });
  sheet.addEventListener('close', () => { if (sheetReturn && sheetReturn.focus) sheetReturn.focus({ preventScroll: true }); });
}

/* ---------- freshness of claims (re-computed in the browser, so fading works between builds) ---------- */
function freshness(verified, hl) {
  if (!hl) return 'evergreen';
  const months = (today - new Date(verified + 'T00:00:00Z')) / (1000 * 60 * 60 * 24 * 30.44);
  return months < hl ? 'fresh' : months < hl * 2 ? 'aging' : 'stale';
}
$$('[data-verified]').forEach(el => {
  const f = freshness(el.dataset.verified, +el.dataset.hl || 0);
  el.classList.remove('fresh', 'aging', 'stale', 'evergreen');
  el.classList.add(f);
  const cb = el.querySelector('.cb');
  if (cb && f !== 'evergreen') cb.title = f === 'fresh' ? 'Verified recently' : f === 'aging' ? 'Due for re-checking' : 'Overdue for re-checking: treat with care';
  const lab = el.querySelector('[data-fresh-label]');
  if (lab) lab.textContent = f;
});

/* ---------- new since your last visit ---------- */
let prev = null;
try { prev = sessionStorage.getItem('lfg-prev'); } catch (e) {}
if (prev === null) {
  prev = store.get('lfg-last-visit', '');
  try { sessionStorage.setItem('lfg-prev', prev); } catch (e) {}
}
store.set('lfg-last-visit', iso(today));
// Nothing is marked during the soft launch. After launch (site.yaml: launched), only changes dated after
// both the launch and the reader's last visit count as new.
const launched = document.body.dataset.launched || '';
if (prev && launched) {
  const since = prev > launched ? prev : launched;
  $$('[data-updated]').forEach(el => { if (el.dataset.updated > since) el.classList.add('is-new'); });
  $$('.claim[data-verified]').forEach(el => { if (el.dataset.verified > since) el.classList.add('is-new'); });
  const n = $$('.is-new').length;
  const banner = $('#since');
  if (banner && n) { banner.hidden = false; banner.querySelector('b').textContent = `${n} change${n === 1 ? '' : 's'}`; }
}

/* ---------- quizzes and chapter progress ---------- */
const page = document.body.dataset.chapter || '';
const quizzes = $$('.quiz');
const quizKey = page || document.body.dataset.quizKey || ''; // review pages keep answers without counting as a chapter
const solved = new Set(store.get('lfg-quiz-' + quizKey, []));
const done = new Set(store.get('lfg-done', []));
function markDone() {
  const score = $('[data-quiz-score]'); if (score && quizzes.length) score.textContent = `${solved.size} of ${quizzes.length} answered correctly`;
  if (page && quizzes.length && quizzes.every((_, i) => solved.has(i))) { done.add(page); store.set('lfg-done', [...done]); }
  $$('[data-chapter-link]').forEach(a => a.classList.toggle('done', done.has(a.dataset.chapterLink)));
  // where to continue: the chapter you were last reading if it isn't finished, otherwise the next unfinished one after it.
  // The hero's journey map lists every chapter in reading order, so it is the source of truth here.
  const stations = $$('.hm-dots li');
  if (!stations.length) return;
  const ids = stations.map(li => li.dataset.chapterLink);
  const last = store.get('lfg-last', null), pos = store.get('lfg-pos', {});
  let target = null, note = '';
  if (last && ids.includes(last) && !done.has(last)) { target = last; if (pos[last]) note = `${Math.round(pos[last] * 100)}% read`; }
  else if (last && ids.includes(last)) { const i = ids.indexOf(last); target = [...ids.slice(i + 1), ...ids.slice(0, i)].find(id => !done.has(id)) || null; }
  else if (done.size) target = ids.find(id => !done.has(id)) || null;
  const li = target && stations[ids.indexOf(target)];
  const finished = ids.filter(id => done.has(id)).length;
  const summary = [note, `${finished} of ${ids.length} chapters done`].filter(Boolean).join(' · ');
  const start = $('#hero-start');
  if (start && li) { start.href = li.querySelector('a').href; start.textContent = `Continue: ${li.dataset.short}`; const meta = $('#hero-meta'); if (meta) meta.textContent = summary; }
  // highlight where to go next (chapter 1 on a first visit); the key only matters once there is progress
  const t = target || (done.size ? null : ids[0]);
  stations.forEach(d => d.classList.toggle('next', d.dataset.chapterLink === t));
  const k = $('#hm-key-next'); if (k) k.textContent = target ? 'continue here' : 'start here';
  const key = $('#hm-key'); if (key) key.hidden = !done.size;
  // the map is a progress tool: show it once there is progress to show
  const side = $('#hero-side'); if (side) side.hidden = !(done.size || target);
}
quizzes.forEach((el, i) => {
  const ans = +el.dataset.answer, ex = el.querySelector('.qe');
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const ok = +b.dataset.j === ans;
    el.querySelectorAll('button').forEach(x => x.classList.remove('right', 'wrong'));
    b.classList.add(ok ? 'right' : 'wrong');
    ex.hidden = false;
    ex.innerHTML = (ok ? '<b>Right.</b> ' : '<b>Not quite.</b> ') + el.dataset.explain.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    // once solved, the other options are switched off, so a later stray click cannot turn "Right" into "Not quite"
    if (ok) { el.querySelectorAll('button').forEach(x => { if (x !== b) x.disabled = true; }); solved.add(i); store.set('lfg-quiz-' + quizKey, [...solved]); markDone(); }
  });
});
{ const n = done.size, started = n || store.get('lfg-last', null); const row = $('#sheet-progress');
  if (row && started) { row.hidden = false; const total = $$('.sheet-chapters a').length; $('#sheet-progress-n').textContent = `${n} of ${total} done`; } }
markDone();
// Reset asks twice (no browser dialog): the first press arms the button for a few seconds.
$$('[data-reset-progress]').forEach(btn => {
  const label = btn.textContent; let timer = null;
  btn.addEventListener('click', () => {
    if (btn.dataset.armed) {
      Object.keys(localStorage).filter(k => k.startsWith('lfg-quiz-') || ['lfg-done', 'lfg-pos', 'lfg-last'].includes(k)).forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
      location.reload(); return;
    }
    btn.dataset.armed = '1'; btn.textContent = 'Tap again to reset'; btn.classList.add('armed');
    clearTimeout(timer); timer = setTimeout(() => { delete btn.dataset.armed; btn.textContent = label; btn.classList.remove('armed'); }, 4000);
  });
});

/* ---------- keyboard access to blocks that scroll sideways (WCAG 2.1.1) ---------- */
function markScrollers() {
  document.querySelectorAll('pre, .scroll').forEach(el => {
    if (el.scrollWidth > el.clientWidth + 1) { el.tabIndex = 0; el.dataset.scroller = ''; }
    else if ('scroller' in el.dataset) { el.removeAttribute('tabindex'); delete el.dataset.scroller; }
  });
}
markScrollers();
addEventListener('resize', markScrollers, { passive: true });
document.addEventListener('toggle', markScrollers, true);

/* ---------- glossary search ---------- */
const gq = $('#gq');
if (gq) gq.addEventListener('input', () => {
  const q = gq.value.trim().toLowerCase();
  $$('.gi').forEach(d => { d.hidden = !!q && !d.dataset.s.includes(q); });
});

/* ---------- radar ---------- */
const radarEl = $('#radar');
if (radarEl) {
  const R = JSON.parse($('#radar-data').textContent);
  const RINGS = ['shipping', 'emerging', 'research', 'faded']; // inner → outer
  const ringOf = (e, m) => { const ks = Object.keys(e.history).filter(k => k <= m).sort(); return ks.length ? e.history[ks[ks.length - 1]] : null; };
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
  const slider = $('#radar-month');
  let month = R.months[R.months.length - 1];
  let sel = location.hash.replace(/^#r-/, '') || null;
  const COL = { shipping: 'var(--t)', emerging: 'var(--y)', research: 'var(--bsoft)', faded: 'var(--faint)' };
  function draw() {
    const W = radarEl.clientWidth, H = radarEl.clientHeight;
    if (!W) return;
    const cx = W / 2, cy = H / 2, rMax = Math.min(W, H) / 2 - 18;
    const radii = [0.4, 0.66, 0.88, 1].map(f => f * rMax);
    let s = '';
    // rings
    [...radii].reverse().forEach((r, i) => { s += `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:var(--ring${i + 1});stroke:var(--line)"/>`; });
    s += `<line x1="${cx - rMax}" y1="${cy}" x2="${cx + rMax}" y2="${cy}" style="stroke:var(--line)"/><line x1="${cx}" y1="${cy - rMax}" x2="${cx}" y2="${cy + rMax}" style="stroke:var(--line)"/>`;
    // ring labels along the vertical axis
    if (W >= 520) RINGS.forEach((rg, i) => { const r0 = i ? radii[i - 1] : 0; s += `<text x="${cx + 5}" y="${cy - (i ? (r0 + radii[i]) / 2 : radii[0] * 0.88) + 4}" class="rl">${escH(rg)}</text>`; });
    // quadrant labels in the corners
    const ql = [[16, 26, 'start'], [W - 16, 26, 'end'], [16, H - 12, 'start'], [W - 16, H - 12, 'end']];
    if (W >= 520) R.quadrants.forEach((q, i) => { s += `<text x="${ql[i][0]}" y="${ql[i][1]}" text-anchor="${ql[i][2]}" class="ql">${escH(q)}</text>`; });
    // blips: entries sharing a quadrant and ring are spread evenly so they never overlap; numbers match the list
    const angles = [[Math.PI, 1.5 * Math.PI], [1.5 * Math.PI, 2 * Math.PI], [0.5 * Math.PI, Math.PI], [0, 0.5 * Math.PI]];
    const groups = {};
    R.entries.forEach((e, i) => { const rg = ringOf(e, month); if (!rg) return; const k = e.quadrant + '|' + rg; (groups[k] = groups[k] || []).push([e, i, rg]); });
    Object.values(groups).forEach(list => list.forEach(([e, i, rg], k) => {
      const qi = R.quadrants.indexOf(e.quadrant), ri = RINGS.indexOf(rg);
      const r0 = ri ? radii[ri - 1] : 0, r1 = radii[ri];
      const m = W < 520 ? 0.46 : 0.3; // keep blips clear of the axes, where the ring labels sit
      const a0 = angles[qi][0] + m, a1 = angles[qi][1] - m;
      const a = a0 + (a1 - a0) * (k + 0.5) / list.length;
      const r = r0 + (r1 - r0) * (list.length > 2 ? (k % 2 ? 0.72 : 0.34) : 0.55) + (ri === 0 ? 8 : 0);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const on = sel === e.id;
      s += `<g class="blip${on ? ' on' : ''}" data-id="${escH(e.id)}" tabindex="0" role="button" aria-label="${i + 1}. ${escH(e.name)}: ${escH(rg)}" style="transform:translate(${x}px,${y}px)"><circle r="${(on ? 3 : 0) + (W < 520 ? 8.5 : 11)}" style="fill:${COL[rg]};stroke:${on ? 'var(--ink)' : 'var(--bg)'}" stroke-width="2"/><text text-anchor="middle" y="${W < 520 ? 3.5 : 4}" class="bn" style="font-size:${W < 520 ? 9.5 : 11.5}px;fill:${rg === 'emerging' ? 'var(--onY)' : 'var(--blipink)'}">${i + 1}</text></g>`;
    }));
    radarEl.innerHTML = s;
    const label = $('#radar-month-label'); if (label) label.textContent = new Date(month + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    $$('[data-entry]').forEach(li => {
      const e = R.entries.find(x => x.id === li.dataset.entry);
      const rg = ringOf(e, month);
      li.hidden = !rg;
      li.classList.toggle('on', sel === e.id);
      const tag = li.querySelector('.ring'); if (tag && rg) { tag.textContent = rg; tag.dataset.ring = rg; }
    });
  }
  function pick(id) { sel = sel === id ? null : id; draw(); const li = sel && $(`[data-entry="${sel}"]`); if (li) li.scrollIntoView({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' }); }
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  radarEl.addEventListener('click', e => { const g = e.target.closest('.blip'); if (g) pick(g.dataset.id); });
  radarEl.addEventListener('keydown', e => { const g = e.target.closest('.blip'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(g.dataset.id); } });
  $$('[data-entry]').forEach(li => li.addEventListener('click', e => { if (!e.target.closest('a')) pick(li.dataset.entry); }));
  if (slider) { slider.max = R.months.length - 1; slider.value = R.months.length - 1; slider.addEventListener('input', () => { month = R.months[+slider.value]; draw(); }); }
  const roR = new ResizeObserver(draw); roR.observe(radarEl);
}

/* ---------- reader: progress, sections, resume, completion, hide-on-scroll ---------- */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapterId = document.body.dataset.chapter;
  const prose = chapterId && $('.chapter .prose');
  const root = document.documentElement;
  // hide header and reader bar while scrolling down; show on scroll up, near the top and near the end
  let lastY = scrollY, ticking = false;
  const compact = matchMedia('(max-width: 900px), (pointer: coarse)');
  function onScrollChrome() {
    const y = scrollY, dy = y - lastY;
    const nearEnd = y + innerHeight > document.documentElement.scrollHeight - 160;
    if (!compact.matches || y < 80 || nearEnd || (sheet && sheet.open)) root.classList.remove('head-hidden');
    else if (dy > 6) root.classList.add('head-hidden');
    else if (dy < -6) root.classList.remove('head-hidden');
    lastY = y;
  }
  if (!prose) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScrollChrome(); ticking = false; }); } }, { passive: true });
    return;
  }
  const minutes = +document.body.dataset.minutes || 0;
  const bar = $('.read-progress');
  const left = $('#rb-left');
  const heads = $$('.chapter .prose > h2');
  const toc = $('#sheet-toc');
  if (toc) toc.innerHTML = heads.map((h, i) => { if (!h.id) h.id = 's-' + (h.textContent || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48); return `<li><a href="#${escH(h.id)}">${escH(h.textContent)}</a></li>`; }).join('');
  const tocLinks = toc ? [...toc.querySelectorAll('a')] : [];
  const pos = store.get('lfg-pos', {});
  const anchorAt = () => innerHeight * 0.3;
  function progress() {
    const r = prose.getBoundingClientRect();
    const span = Math.max(1, r.height - innerHeight * 0.5);
    return Math.min(1, Math.max(0, (anchorAt() - r.top) / span));
  }
  let saveT = null, completed = false;
  // remember the place and the chapter being read; flushed immediately when the page is hidden or left
  function save() {
    clearTimeout(saveT);
    const p = progress();
    const all = store.get('lfg-pos', {}); if (p > 0.03 && p < 0.97) all[chapterId] = +p.toFixed(3); else delete all[chapterId]; store.set('lfg-pos', all);
    if (p > 0.03 && store.get('lfg-last', null) !== chapterId) store.set('lfg-last', chapterId);
  }
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
  function update() {
    const p = progress();
    if (bar) bar.style.setProperty('--p', p.toFixed(4));
    if (left) left.textContent = p >= 0.98 ? 'Done' : `${Math.max(1, Math.ceil(minutes * (1 - p)))} min left`;
    // current section
    let cur = -1;
    heads.forEach((h, i) => { if (h.getBoundingClientRect().top < anchorAt()) cur = i; });
    tocLinks.forEach((a, i) => { a.classList.toggle('read', i < cur); if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    // remember the place (debounced), and mark the chapter done at the end
    clearTimeout(saveT);
    saveT = setTimeout(save, 400);
    if (p >= 0.97 && !completed) {
      completed = true;
      done.add(chapterId); store.set('lfg-done', [...done]); markDone();
      const note = $('#complete-note'); if (note) note.hidden = false;
    }
  }
  readerUpdate = update;
  let idleT = null;
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { onScrollChrome(); update(); ticking = false; }); }
    clearTimeout(idleT); idleT = setTimeout(() => { update(); save(); }, 500); // also when animation frames are throttled
  }, { passive: true });
  addEventListener('resize', update);
  if (done.has(chapterId)) { const note = $('#complete-note'); if (note) note.hidden = false; completed = true; }
  update();
  // offer to resume where the reader stopped (never jump on its own)
  const saved = pos[chapterId];
  const toast = $('#toast');
  if (saved && !location.hash && scrollY < 40 && toast) {
    toast.innerHTML = `<span>Continue where you left off (${Math.round(saved * 100)}%)?</span><button type="button" class="btn pri" data-resume>Continue</button><button type="button" class="btn x" data-toast-close aria-label="Dismiss">✕</button>`;
    toast.hidden = false;
    const hide = () => { toast.hidden = true; };
    const timer = setTimeout(hide, 9000);
    toast.addEventListener('click', e => {
      if (e.target.closest('[data-resume]')) {
        const r = prose.getBoundingClientRect();
        const span = Math.max(1, r.height - innerHeight * 0.5);
        const y = scrollY + r.top + saved * span - anchorAt();
        scrollTo({ top: Math.max(0, y), behavior: reduce() ? 'auto' : 'smooth' });
        clearTimeout(timer); hide();
      } else if (e.target.closest('[data-toast-close]')) { clearTimeout(timer); hide(); }
    });
  }
  // keyboard: ← → move between chapters (not while typing or using a control)
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target; if (t.closest && t.closest('input, select, textarea, [contenteditable], .scroll, dialog')) return;
    const url = e.key === 'ArrowRight' ? document.body.dataset.next : e.key === 'ArrowLeft' ? document.body.dataset.prev : null;
    if (url) location.href = url;
  });
})();
