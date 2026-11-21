// Site-level behaviour: reading path, freshness, "new since last visit", quizzes, glossary search, radar.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const today = new Date();
const iso = d => d.toISOString().slice(0, 10);

/* ---------- reading path: beginner | engineer ---------- */
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
const THEMES = ['auto', 'light', 'dark'];
function applyTheme(t) {
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  const b = $('#theme-btn');
  if (b) { b.querySelector('.theme-label').textContent = t[0].toUpperCase() + t.slice(1); b.setAttribute('aria-label', t === 'auto' ? 'Colour theme: follows your system' : `Colour theme: ${t}`); }
  // redraw canvases/SVGs that read colours at draw time
  window.dispatchEvent(new Event('resize'));
}
applyTheme(store.get('lfg-theme', 'auto'));
const themeBtn = $('#theme-btn');
if (themeBtn) themeBtn.addEventListener('click', () => {
  const next = THEMES[(THEMES.indexOf(store.get('lfg-theme', 'auto')) + 1) % THEMES.length];
  store.set('lfg-theme', next); applyTheme(next);
});

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
if (prev) {
  $$('[data-updated]').forEach(el => { if (el.dataset.updated > prev) el.classList.add('is-new'); });
  $$('.claim[data-verified]').forEach(el => { if (el.dataset.verified > prev) el.classList.add('is-new'); });
  const n = $$('.is-new').length;
  const banner = $('#since');
  if (banner && n) { banner.hidden = false; banner.querySelector('b').textContent = `${n} change${n === 1 ? '' : 's'}`; }
}

/* ---------- quizzes and chapter progress ---------- */
const page = document.body.dataset.chapter || '';
const quizzes = $$('.quiz');
const solved = new Set(store.get('lfg-quiz-' + page, []));
const done = new Set(store.get('lfg-done', []));
function markDone() {
  if (page && quizzes.length && quizzes.every((_, i) => solved.has(i))) { done.add(page); store.set('lfg-done', [...done]); }
  $$('[data-chapter-link]').forEach(a => a.classList.toggle('done', done.has(a.dataset.chapterLink)));
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
    if (ok) { solved.add(i); store.set('lfg-quiz-' + page, [...solved]); markDone(); }
  });
});
markDone();
const reset = $('#reset-progress');
if (reset) reset.addEventListener('click', () => {
  Object.keys(localStorage).filter(k => k.startsWith('lfg-quiz-') || k === 'lfg-done').forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  location.reload();
});

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
    RINGS.forEach((rg, i) => { const r0 = i ? radii[i - 1] : 0; s += `<text x="${cx + 5}" y="${cy - (i ? (r0 + radii[i]) / 2 : radii[0] * 0.88) + 4}" class="rl">${rg}</text>`; });
    // quadrant labels in the corners
    const ql = [[16, 26, 'start'], [W - 16, 26, 'end'], [16, H - 12, 'start'], [W - 16, H - 12, 'end']];
    if (W >= 520) R.quadrants.forEach((q, i) => { s += `<text x="${ql[i][0]}" y="${ql[i][1]}" text-anchor="${ql[i][2]}" class="ql">${q}</text>`; });
    // blips: entries sharing a quadrant and ring are spread evenly so they never overlap; numbers match the list
    const angles = [[Math.PI, 1.5 * Math.PI], [1.5 * Math.PI, 2 * Math.PI], [0.5 * Math.PI, Math.PI], [0, 0.5 * Math.PI]];
    const groups = {};
    R.entries.forEach((e, i) => { const rg = ringOf(e, month); if (!rg) return; const k = e.quadrant + '|' + rg; (groups[k] = groups[k] || []).push([e, i, rg]); });
    Object.values(groups).forEach(list => list.forEach(([e, i, rg], k) => {
      const qi = R.quadrants.indexOf(e.quadrant), ri = RINGS.indexOf(rg);
      const r0 = ri ? radii[ri - 1] : 0, r1 = radii[ri];
      const a0 = angles[qi][0] + 0.26, a1 = angles[qi][1] - 0.26;
      const a = a0 + (a1 - a0) * (k + 0.5) / list.length;
      const r = r0 + (r1 - r0) * (list.length > 2 ? (k % 2 ? 0.72 : 0.34) : 0.55) + (ri === 0 ? 8 : 0);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const on = sel === e.id;
      s += `<g class="blip${on ? ' on' : ''}" data-id="${e.id}" tabindex="0" role="button" aria-label="${i + 1}. ${e.name}: ${rg}" style="transform:translate(${x}px,${y}px)"><circle r="${(on ? 3 : 0) + (W < 520 ? 8.5 : 11)}" style="fill:${COL[rg]};stroke:${on ? 'var(--ink)' : 'var(--bg)'}" stroke-width="2"/><text text-anchor="middle" y="${W < 520 ? 3.5 : 4}" class="bn" style="font-size:${W < 520 ? 9.5 : 11.5}px;fill:${rg === 'emerging' ? 'var(--onY)' : 'var(--blipink)'}">${i + 1}</text></g>`;
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
