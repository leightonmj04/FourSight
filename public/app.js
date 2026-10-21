// ChE Degree Planner prototype.
//
// Geometry note: every position used for drawing lines is in TRACK-LOCAL coordinates, built from
// offsetLeft/offsetTop plus the animation offsets this file applies itself (FLIP slides and the
// elastic column drift). Nothing reads getBoundingClientRect for line drawing, so transforms never
// knock the lines out of alignment with the cards.
(() => {
  'use strict';

  const C = window.COURSES;  // the selected program's catalog with this student's changes
  const FSP = window.FS.programs;
  let P = null;              // the selected program (see data.js and programs/)
  let BASE = {};             // its courses as shipped, with on-time limits filled in
  let CATS = {};             // its course types: key -> { label }
  const $ = (id) => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';

  const ICON = {
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16 9.8"/></svg>',
    x: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.5v.01"/></svg>',
    award: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>',
    ok: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16 9.8"/></svg>',
    tick: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M9 4h6l-1 6 3.5 3.5h-11L10 10 9 4Z"/><path d="M12 13.5V20"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
  };

  // ---------------------------------------------------------------- state
  const S = {
    terms: null,           // [{ kind: 'fall' | 'spring' | 'summer', year }] in chronological order
    plan: null,            // one array of course ids per term
    done: new Set(),       // completed course ids
    credit: new Set(),     // ids earned by credit by exam (CR) on an imported transcript
    taken: {},             // slot id -> transcript course that fills it (e.g. TECH1 -> CHE 379)
    prior: [],             // transcript credit outside the 129 hours, e.g. CH 301: { code, title, index, grade }
    fromTranscript: new Set(), // completions that came from a transcript (cleared on reset)
    transcript: null,      // { name, report, scheduled } of the last import
    hover: null,
    catFocus: null,        // course type picked in the dropdown
    selected: null,
    pinned: null,          // course whose chain stays lit while scrolling or hovering elsewhere
    custom: {},            // courses added with the + button: id -> { code, title, hrs, cat, pre, co, unlocks, custom }
    edits: {},             // changes to catalog courses: id -> the fields that differ
    removed: [],           // catalog courses the student deleted
    drag: null,
  };

  let ALL_EDGES = [];      // every requirement in the catalog: { id, from, to, type: 'pre' | 'co' }
  let EDGES = [];          // the lines actually drawn (see below)

  // Lines actually drawn: the transitive reduction. A requirement A -> C is left out when a chain
  // A -> B -> ... -> C already implies it. A strict prerequisite is only implied by a chain that
  // contains at least one strict prerequisite (a chain of co-requisites allows the same semester).
  // Because the chain implies the hidden requirement, the hidden one can never break unless a line
  // on its chain breaks too, so conflicts always show up as a red line somewhere.
  // Edges are removed one at a time and each check only uses lines still kept, so the drawn
  // set always implies everything hidden (this matters for co-requisite pairs, which form loops).
  // Strict prerequisites are considered before co-requisites so the short co-req links stay.
  // Recomputed whenever a student adds, edits or deletes a course.
  function rebuildEdges() {
    ALL_EDGES = [];
    const seen = new Set();
    // `any` lists the options of a one-of requirement ("ECE 312 or 313"); each option gets a line.
    const add = (from, to, type, any) => {
      const id = `${from}${type === 'pre' ? '>' : '~'}${to}`;
      if (C[from] && C[to] && from !== to && !seen.has(id)) { seen.add(id); ALL_EDGES.push(any ? { id, from, to, type, any } : { id, from, to, type }); }
    };
    const each = (list, fn) => {
      for (const p of list || []) {
        if (!Array.isArray(p)) { fn(p, null); continue; }
        const opts = p.filter((o) => C[o]);
        for (const o of opts) fn(o, opts.length > 1 ? opts : null);
      }
    };
    for (const [id, c] of Object.entries(C)) {
      // A course with its own "unlocks" list (added or edited) decides which courses it leads to.
      each(c.pre, (p, any) => { if (!C[p] || !C[p].unlocks || C[p].unlocks.includes(id)) add(p, id, 'pre', any); });
      each(c.co, (p, any) => add(p, id, 'co', any));
      for (const t of c.unlocks || []) add(id, t, 'pre');
    }
    // One-of lines are always drawn: no single option is required, so they neither hide other
    // lines nor get hidden by them.
    const plain = ALL_EDGES.filter((e) => !e.any);
    const kept = plain.slice();
    updateLegendCounts();
    const order = plain.slice().sort((a, b) => (a.type === b.type ? 0 : a.type === 'pre' ? -1 : 1));
    for (const e of order) {
      const others = kept.filter((f) => f !== e);
      if (impliedByChain(e, others)) kept.splice(kept.indexOf(e), 1);
    }
    EDGES = ALL_EDGES.filter((e) => e.any || kept.includes(e));
  }
  rebuildEdges();

  // C is the catalog as this student sees it: the shipped courses with their edits, minus the ones
  // they deleted, plus the ones they added with the + button (marked custom).
  function applyCourses({ custom = {}, edits = {}, removed = [] } = {}) {
    S.custom = custom; S.edits = edits; S.removed = removed;
    for (const id of Object.keys(C)) delete C[id];
    for (const [id, c] of Object.entries(BASE)) if (!removed.includes(id)) C[id] = { ...c, ...edits[id] };
    for (const [id, c] of Object.entries(custom)) C[id] = { ...c, custom: true };
    for (const c of Object.values(C)) if (!CATS[c.cat]) c.cat = CATS[OLD_CATS[c.cat]] ? OLD_CATS[c.cat] : 'major';
    rebuildEdges();
  }
  // Course types were named after ChE before other programs arrived.
  const OLD_CATS = { che: 'major', chem: 'alt' };

  // After the plan is replaced (reset or transcript), put added courses back in their old term.
  function keepCustom(oldPlan) {
    for (const id of Object.keys(S.custom)) {
      if (semOf(S.plan, id) >= 0) continue;
      const was = Math.max(0, semOf(oldPlan, id));
      S.plan[Math.min(was, S.plan.length - 1)].push(id);
    }
  }
  function impliedByChain(edge, edges) {
    const seen = new Set();
    const stack = edges.filter((f) => f.from === edge.from).map((f) => ({ node: f.to, strict: f.type === 'pre', len: 1 }));
    while (stack.length) {
      const cur = stack.pop();
      if (cur.node === edge.to && cur.len >= 2 && (edge.type === 'co' || cur.strict)) return true;
      const key = `${cur.node}|${cur.strict}`;
      if (seen.has(key) || cur.len > 40) continue;
      seen.add(key);
      for (const f of edges) {
        if (f.from === cur.node) stack.push({ node: f.to, strict: cur.strict || f.type === 'pre', len: cur.len + 1 });
      }
    }
    return false;
  }

  const clone = (plan) => plan.map((s) => s.slice());

  // ---------------------------------------------------------------- terms
  const KIND = { fall: 'Fall', spring: 'Spring', summer: 'Summer' };
  const termName = (t) => (t.kind === 'credit' ? 'AP / Credit by Exam' : `${KIND[t.kind]} ${t.year}`);
  const isRegular = (t) => t.kind === 'fall' || t.kind === 'spring';
  const nameAt = (i) => (S.terms[i] ? termName(S.terms[i]) : '');
  // A program's suggested terms: eight falls and springs unless it plans a summer (Geosystems).
  function defaultTerms() {
    if (P.terms) return P.terms.map((t) => ({ ...t }));
    const t = [];
    for (let y = 1; y <= 4; y++) t.push({ kind: 'fall', year: y }, { kind: 'spring', year: y });
    return t;
  }
  // "latest" in the data counts only the eight standard fall/spring terms (0 = Fall 1).
  const latestName = (n) => `${n % 2 ? 'Spring' : 'Fall'} ${Math.floor(n / 2) + 1}`;
  // A course is late once it sits in or after the regular term that follows its latest one.
  // A summer straight after the latest term is still on time.
  function lateFrom(latest) {
    let seen = -1;
    for (let i = 0; i < S.terms.length; i++) {
      if (!isRegular(S.terms[i])) continue;
      seen++;
      if (seen === latest + 1) return i;
    }
    return Infinity;
  }
  const isExtra = (t) => isRegular(t) && t.year > 4;

  // One saved plan per program. ChE plans saved before programs existed used 'dp.plan.me'.
  const planKey = () => `dp.plan.${P.id}`;
  function savedState() {
    try {
      let raw = localStorage.getItem(planKey());
      if (!raw && P.id === 'che') raw = localStorage.getItem('dp.plan.me');
      const saved = JSON.parse(raw || 'null');
      applyCourses(saved ? { custom: saved.custom || {}, edits: saved.edits || {}, removed: saved.removed || [] } : {});
      if (validState(saved)) {
        return {
          terms: saved.terms, plan: saved.plan, done: new Set(saved.done || []),
          credit: new Set(saved.credit || []), taken: saved.taken || {}, prior: saved.prior || [],
          fromTranscript: new Set(saved.fromTranscript || []), transcript: saved.transcript || null,
        };
      }
    } catch (_) { /* storage unavailable */ }
    applyCourses({});
    return { terms: defaultTerms(), plan: clone(P.plan), done: new Set(), ...emptyTranscript() };
  }
  const emptyTranscript = () => ({ credit: new Set(), taken: {}, prior: [], fromTranscript: new Set(), transcript: null });
  function validState(st) {
    if (!st || !Array.isArray(st.terms) || !Array.isArray(st.plan) || st.terms.length !== st.plan.length) return false;
    const ids = st.plan.flat();
    // Every required course must be placed once; optional courses (like CHE 102) may be left out.
    return ids.every((id) => C[id]) && new Set(ids).size === ids.length &&
      Object.keys(C).every((id) => C[id].optional || C[id].custom || ids.includes(id));
  }
  function save() {
    try {
      localStorage.setItem(planKey(), JSON.stringify({
        terms: S.terms, plan: S.plan, done: [...S.done], credit: [...S.credit], taken: S.taken, prior: S.prior,
        fromTranscript: [...S.fromTranscript], transcript: S.transcript, custom: S.custom, edits: S.edits, removed: S.removed,
      }));
    } catch (_) { /* ignore */ }
  }
  function moveCourse(plan, id, sem, index) {
    for (const s of plan) { const i = s.indexOf(id); if (i >= 0) s.splice(i, 1); }
    plan[sem].splice(Math.min(index, plan[sem].length), 0, id);
  }
  function semOf(plan, id) { return plan.findIndex((s) => s.includes(id)); }

  // ---------------------------------------------------------------- rules
  // pre: the prerequisite must be in an earlier semester. co: same semester or earlier.
  // A one-of line only breaks when none of its options comes in time.
  function edgeBroken(plan, e) {
    const b = semOf(plan, e.to);
    const ok = (from) => { const a = semOf(plan, from); return e.type === 'pre' ? a < b : a <= b; };
    return e.any ? !e.any.some(ok) : !ok(e.from);
  }
  // offTerm: courses planned in a term they are not offered (fall-only in a spring, and so on).
  function analyze(plan) {
    const broken = new Set(), badCourses = new Set(), late = new Set(), offTerm = new Set();
    for (const e of EDGES) if (edgeBroken(plan, e)) { broken.add(e.id); badCourses.add(e.to); }
    plan.forEach((sem, i) => sem.forEach((id) => {
      if (i >= lateFrom(C[id].latest)) late.add(id);
      const t = S.terms[i];
      if (C[id].offered && t && t.kind !== 'credit' && t.kind !== C[id].offered && !S.done.has(id)) offTerm.add(id);
    }));
    return { broken, badCourses, late, offTerm };
  }

  // Programs without department on-time figures get them from the prerequisite chain: a course
  // is on time while every course that depends on it still fits in the four years.
  function withOnTimeLimits(courses, regularTerms) {
    const next = {};
    for (const [id, c] of Object.entries(courses)) {
      for (const p of c.pre || []) if (typeof p === 'string' && courses[p]) (next[p] ||= []).push([id, 1]);
      for (const p of c.co || []) if (typeof p === 'string' && courses[p]) (next[p] ||= []).push([id, 0]);
    }
    const memo = {}, visiting = new Set();
    const depth = (id) => {
      if (id in memo) return memo[id];
      if (visiting.has(id)) return 0; // co-requisite pairs point at each other
      visiting.add(id);
      const d = Math.max(0, ...(next[id] || []).map(([to, step]) => step + depth(to)));
      visiting.delete(id);
      return (memo[id] = d);
    };
    for (const [id, c] of Object.entries(courses)) {
      if (c.latest == null) { c.latest = Math.max(0, regularTerms - 1 - depth(id)); c.latestFromChain = true; }
    }
    return courses;
  }
  const hours = (sem) => sem.reduce((n, id) => n + C[id].hrs, 0);

  // ---------------------------------------------------------------- DOM refs
  const viewport = $('viewport'), track = $('track'), columnsEl = $('columns'), edgesG = $('edges');
  const svg = $('lines'), svgTop = $('linesTop'), edgesTopG = $('edgesTop'), bandsEl = $('bands');
  const cardEl = {};       // id -> element
  const colEl = [];        // column elements
  const pathEl = {};       // edge id -> path

  // ---------------------------------------------------------------- load
  function loadPlan() {
    const st = savedState();
    S.terms = st.terms; S.plan = st.plan; S.done = st.done;
    S.credit = st.credit; S.taken = st.taken; S.prior = st.prior; S.fromTranscript = st.fromTranscript; S.transcript = st.transcript;
    renderDock();
    S.selected = null; S.pinned = null; closeDrawer(); $('issues').hidden = true;
    build(true);
    scroller.jump(0);
    requestAnimationFrame(() => { updateSemnav(); loop.kick(); });
  }

  // ---------------------------------------------------------------- build + layout
  function buildLegend() {
    const count = (k) => Object.values(C).filter((c) => c.cat === k).length;
    const items = [`<button class="td-item" data-cat="" role="option"><span class="td-sw all"></span>All course types<b>${Object.keys(C).length}</b></button>`]
      .concat(Object.entries(CATS).map(([k, v]) =>
        `<button class="td-item" data-cat="${k}" role="option"><span class="td-sw" style="background:var(--${k})"></span>${v.label}<b>${count(k)}</b></button>`));
    $('legend').innerHTML =
      `<div class="typedrop" id="typedrop">` +
        `<button class="td-btn" id="tdBtn" aria-haspopup="listbox" aria-expanded="false">` +
          `<span class="td-dots">${Object.keys(CATS).map((k) => `<i style="background:var(--${k})"></i>`).join('')}</span>` +
          `<span class="td-text"><small>Course type</small><span id="tdLabel">All course types</span></span>` +
          `<svg class="td-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>` +
        `</button>` +
        `<div class="td-menu" id="tdMenu" role="listbox">${items.join('')}</div>` +
      `</div>` +
      `<div class="line-keys">` +
        `<span><svg viewBox="0 0 26 10"><path d="M1 5h22" stroke="var(--edge)" stroke-width="2"/></svg>Prerequisite</span>` +
        `<span><svg viewBox="0 0 26 10"><path d="M1 5h22" stroke="var(--edge)" stroke-width="2" stroke-dasharray="4 3"/></svg>Co-requisite</span>` +
        (ALL_EDGES.some((e) => e.any) ? `<span><svg viewBox="0 0 26 10"><path d="M1 5h22" stroke="var(--edge)" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/></svg>One of several</span>` : '') +
        `<span><svg viewBox="0 0 26 10"><path d="M1 5h22" stroke="var(--bad)" stroke-width="2.4" stroke-dasharray="6 4"/></svg>Broken chain</span>` +
      `</div>`;

    const drop = $('typedrop'), btn = $('tdBtn');
    const setOpen = (open) => { drop.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', (ev) => { ev.stopPropagation(); setOpen(!drop.classList.contains('open')); });
    drop.querySelectorAll('.td-item').forEach((b) => {
      b.addEventListener('mouseenter', () => highlightCategory(b.dataset.cat || null));
      b.addEventListener('mouseleave', () => highlightCategory(S.catFocus));
      b.addEventListener('click', () => {
        S.catFocus = b.dataset.cat || null;
        $('tdLabel').textContent = S.catFocus ? CATS[S.catFocus].label : 'All course types';
        btn.style.setProperty('--accent', S.catFocus ? `var(--${S.catFocus})` : 'transparent');
        btn.classList.toggle('active', !!S.catFocus);
        drop.querySelectorAll('.td-item').forEach((x) => x.classList.toggle('sel', x === b));
        setOpen(false);
        paint();
      });
    });
    drop.querySelector('.td-item').classList.add('sel');
  }

  // Course counts in the type dropdown; added courses change them.
  function updateLegendCounts() {
    document.querySelectorAll('#tdMenu .td-item').forEach((b) => {
      const k = b.dataset.cat;
      b.querySelector('b').textContent = Object.values(C).filter((c) => !k || c.cat === k).length;
    });
  }

  // The type dropdown is rebuilt per program; these close whichever one is showing.
  const closeTypeDrop = () => {
    const d = $('typedrop');
    if (d) { d.classList.remove('open'); $('tdBtn').setAttribute('aria-expanded', false); }
  };
  document.addEventListener('click', (ev) => { const d = $('typedrop'); if (d && !d.contains(ev.target)) closeTypeDrop(); });
  window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeTypeDrop(); });

  function buildSemnav() {
    const tr = $('semnav').querySelector('.semnav-track');
    tr.querySelectorAll('button').forEach((b) => b.remove());
    tr.style.gridTemplateColumns = S.terms.map((t) => (isRegular(t) ? '1fr' : '.75fr')).join(' ');
    S.terms.forEach((t, i) => {
      const b = document.createElement('button');
      if (t.kind === 'summer') b.classList.add('summer');
      if (t.kind === 'credit') b.classList.add('credit');
      b.innerHTML = t.kind === 'credit'
        ? `AP Credit<small>Before Year 1</small><span class="dot"></span>`
        : `${termName(t)}<small>Year ${t.year}</small><span class="dot"></span>`;
      b.addEventListener('click', () => scroller.toColumn(i));
      tr.appendChild(b);
    });
  }

  function build(intro) {
    columnsEl.innerHTML = ''; edgesG.innerHTML = ''; edgesTopG.innerHTML = ''; bandsEl.innerHTML = '';
    colEl.length = 0;
    for (const k of Object.keys(cardEl)) delete cardEl[k];
    for (const k of Object.keys(pathEl)) delete pathEl[k];
    anims.clear();

    S.terms.forEach((t, i) => {
      const col = document.createElement('section');
      col.className = `col ${t.kind}` + (isExtra(t) ? ' extra' : '') + (newTerm === t ? ' col-new' : '');
      col.dataset.sem = i;
      const removable = t.kind === 'summer' || (isExtra(t) && i === S.terms.length - 1);
      col.innerHTML =
        `<div class="col-head"><span class="col-title">${t.kind === 'summer' ? ICON.sun : t.kind === 'credit' ? ICON.award : ''}${termName(t)}</span>` +
        `<span class="col-hours"></span>${removable ? `<button class="term-remove" title="Remove term" aria-label="Remove ${termName(t)}">${ICON.close}</button>` : ''}</div>` +
        `<div class="col-body"></div>` +
        S.prior.filter((pc) => pc.index === i).map((pc) =>
          `<div class="prior-chip" title="Counts as a prerequisite, not toward the ${P.hours} hours">` +
          `<b>${pc.code}</b><span>${pc.grade === 'CR' ? 'AP credit (CR)' : pc.grade ? `Grade ${pc.grade}` : 'In progress'}: prerequisite credit</span></div>`).join('');
      if (t.kind === 'spring' && (!S.terms[i + 1] || S.terms[i + 1].kind !== 'summer')) {
        const add = document.createElement('button');
        add.className = 'add-summer';
        add.innerHTML = `${ICON.plus}Summer ${t.year}`;
        add.title = `Add a summer term after ${termName(t)}`;
        add.addEventListener('click', () => addSummer(i));
        col.appendChild(add);
      }
      if (t.kind !== 'credit') {
        const addC = document.createElement('button');
        addC.className = 'add-course';
        addC.innerHTML = `${ICON.plus}Add course`;
        addC.addEventListener('click', () => showCourseForm(i));
        col.querySelector('.col-body').appendChild(addC);
      }
      const rm = col.querySelector('.term-remove');
      if (rm) rm.addEventListener('click', () => removeTerm(i));
      columnsEl.appendChild(col);
      colEl.push(col);
    });
    // Ghost column at the end for adding another fall or spring.
    const next = nextRegular();
    const addCol = document.createElement('div');
    addCol.className = 'col add-col';
    addCol.innerHTML = `<button class="add-term">${ICON.plus}<span>Add ${termName(next)}</span><small>Extra term beyond year 4</small></button>`;
    addCol.querySelector('button').addEventListener('click', addRegular);
    columnsEl.appendChild(addCol);

    const years = [...new Set(S.terms.map((t) => t.year))];
    for (const y of years) {
      const band = document.createElement('div');
      band.className = 'band' + (y > 4 ? ' extra' : '');
      band.dataset.year = y;
      band.textContent = y === 0 ? 'Incoming credit' : `Year ${y}`;
      if (y === 0) band.classList.add('credit');
      bandsEl.appendChild(band);
    }
    colDrift.length = S.terms.length; colDrift.fill(0);
    newTerm = null;
    buildSemnav();

    let delay = 0;
    S.plan.forEach((sem, si) => sem.forEach((id, k) => {
      const c = C[id];
      const el = document.createElement('div');
      el.className = 'card' + (c.optional ? ' optional' : '') + (S.credit.has(id) ? ' cr' : '');
      el.dataset.id = id;
      el.dataset.cat = c.cat;
      el.innerHTML =
        `<div class="row"><span class="code">${c.code}${c.optional ? '<span class="opt">Optional</span>' : ''}</span>` +
        `<span class="right"><button class="pin" aria-label="Pin ${c.code} chain">${ICON.pin}</button><span class="hrs">${c.hrs} hr</span><button class="check" aria-label="Mark ${c.code} complete">${ICON.tick}</button></span></div>` +
        `<div class="title">${S.taken[id] ? `Taken as ${S.taken[id]}` : c.title}</div><span class="flag">${ICON.alert}</span>`;
      if (intro) {
        el.classList.add('intro');
        el.style.animationDelay = `${si * 70 + k * 35}ms`;
        el.addEventListener('animationend', () => { el.classList.remove('intro'); el.style.animationDelay = ''; }, { once: true });
      }
      el.addEventListener('pointerdown', onCardDown);
      const chk = el.querySelector('.check');
      chk.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      chk.addEventListener('click', (ev) => { ev.stopPropagation(); toggleDone(id); });
      const pin = el.querySelector('.pin');
      pin.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      pin.addEventListener('click', (ev) => { ev.stopPropagation(); togglePin(id); });
      el.addEventListener('mouseenter', () => { if (!S.drag) { S.hover = id; paint(); } });
      el.addEventListener('mouseleave', () => { if (S.hover === id) { S.hover = null; paint(); } });
      cardEl[id] = el;
      delay = Math.max(delay, si * 70 + k * 35);
    }));

    // Every requirement gets a path, including ones the overview leaves out because a longer chain
    // implies them: a focused course shows all of its direct links.
    for (const e of ALL_EDGES) {
      const p = document.createElementNS(svgNS, 'path');
      p.classList.add('edge', e.type);
      if (e.any) p.classList.add('any');
      edgesG.appendChild(p);
      pathEl[e.id] = p;
    }

    placeCards();
    paint();
    drawLines();
    if (intro) {
      // Lines draw themselves in once the cards have landed.
      for (const e of EDGES) {
        const p = pathEl[e.id];
        const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 600) || 600;
        p.style.setProperty('--len', len);
        p.style.strokeDasharray = `${len}`;
        p.style.animationDelay = `${delay * 0.5 + 200}ms`;
        p.classList.add('enter');
        p.addEventListener('animationend', () => { p.classList.remove('enter'); p.style.strokeDasharray = ''; p.style.animationDelay = ''; }, { once: true });
      }
    }
  }

  // Put each card element into its column in plan order. Moving existing nodes keeps listeners.
  function placeCards() {
    S.plan.forEach((sem, si) => {
      const body = colEl[si].querySelector('.col-body');
      const addBtn = body.querySelector('.add-course');
      sem.forEach((id) => body.insertBefore(cardEl[id], addBtn));
    });
  }

  // Classes and counters that depend on the plan's validity or on hover.
  function paint() {
    const { broken, badCourses, late, offTerm } = analyze(S.plan);
    // A pinned chain stays lit while swiping, ahead of whatever the pointer passes over.
    const focusId = S.pinned || S.hover || S.selected;
    // The whole chain stays highlighted; arrows show only one step each way from the course.
    const lit = focusId ? chainOf(focusId) : null;

    const cat = !lit && S.catFocus;
    for (const [id, el] of Object.entries(cardEl)) {
      el.classList.toggle('bad', badCourses.has(id));
      el.classList.toggle('late', late.has(id) || offTerm.has(id));
      el.classList.toggle('dim', lit ? !lit.cards.has(id) : !!cat && C[id].cat !== cat);
      el.classList.toggle('lit', !!lit && lit.cards.has(id));
      el.classList.toggle('selected', S.selected === id);
      el.classList.toggle('pinned', S.pinned === id);
      el.querySelector('.pin').setAttribute('aria-pressed', S.pinned === id);
      el.classList.toggle('done', S.done.has(id));
      el.querySelector('.check').setAttribute('aria-pressed', S.done.has(id));
    }
    for (const e of ALL_EDGES) {
      const p = pathEl[e.id];
      const bad = broken.has(e.id);
      const isLit = !!focusId && (e.from === focusId || e.to === focusId);
      p.classList.toggle('bad', bad);
      p.classList.toggle('lit', isLit && !bad);
      p.classList.toggle('dim', lit ? !isLit : !!cat && !(C[e.from].cat === cat && C[e.to].cat === cat));
      p.setAttribute('marker-end', `url(#${bad ? 'arrowBad' : isLit ? 'arrowLit' : 'arrow'})`);
      // Broken edges move to a layer above the cards so they are never hidden.
      const layer = bad ? edgesTopG : edgesG;
      if (p.parentNode !== layer) layer.appendChild(p);
    }
    // Which lines show changed, so their endpoints need spreading again.
    const shownKey = `${focusId}|${[...broken].join()}`;
    if (shownKey !== lastShownKey) { lastShownKey = shownKey; drawLines(); }

    S.plan.forEach((sem, i) => {
      const h = hours(sem);
      const el = colEl[i].querySelector('.col-hours');
      el.textContent = `${h} hrs`;
      el.classList.toggle('heavy', h > (S.terms[i].kind === 'summer' ? 14 : 18));
      const rm = colEl[i].querySelector('.term-remove');
      if (rm) { rm.disabled = sem.length > 0; rm.title = sem.length ? 'Move its courses out first' : 'Remove term'; }
      el.title = h > 18 ? 'Heavier than the suggested load' : '';
    });
    $('pinChip').hidden = !S.pinned;
    if (S.pinned) $('pinChipCode').textContent = C[S.pinned].code;
    const navBtns = $('semnav').querySelectorAll('button');
    navBtns.forEach((b, i) => b.classList.toggle('has-bad', S.plan[i].some((id) => badCourses.has(id))));

    const total = S.plan.flat().reduce((n, id) => n + (C[id].optional ? 0 : C[id].hrs), 0);
    $('totalHours').textContent = total;
    const st = $('statusBtn');
    if (broken.size) {
      st.className = 'status bad';
      st.innerHTML = `${ICON.alert}${broken.size} broken prerequisite${broken.size === 1 ? '' : 's'}`;
    } else if (late.size) {
      st.className = 'status bad';
      st.innerHTML = `${ICON.clock}${late.size} course${late.size === 1 ? '' : 's'} past on-time limit`;
    } else if (offTerm.size) {
      st.className = 'status bad';
      st.innerHTML = `${ICON.clock}${offTerm.size} course${offTerm.size === 1 ? '' : 's'} in a term ${offTerm.size === 1 ? 'it isn\'t' : 'they aren\'t'} offered`;
    } else {
      st.className = 'status ok';
      st.innerHTML = `${ICON.ok}All prerequisites satisfied`;
    }
    if (!$('issues').hidden) renderIssues();
    renderAudit();
  }

  function togglePin(id) {
    S.pinned = S.pinned === id ? null : id;
    paint();
  }
  $('pinChipGo').addEventListener('click', () => { if (S.pinned) focusCourse(S.pinned); });
  $('pinChipClose').addEventListener('click', () => { if (S.pinned) togglePin(S.pinned); });

  let lastShownKey = '';

  // Everything upstream and downstream of a course.
  function chainOf(id) {
    const cards = new Set([id]), edges = new Set();
    const walk = (start, dir) => {
      const stack = [start];
      while (stack.length) {
        const cur = stack.pop();
        for (const e of EDGES) {
          const [from, to] = dir === 'up' ? [e.to, e.from] : [e.from, e.to];
          if (from === cur) { edges.add(e.id); if (!cards.has(to)) { cards.add(to); stack.push(to); } }
        }
      }
    };
    walk(id, 'up'); walk(id, 'down');
    return { cards, edges };
  }

  // Preview a course type while hovering the dropdown; leaving restores the picked one.
  function highlightCategory(cat) {
    const keep = S.catFocus;
    S.catFocus = cat;
    paint();
    S.catFocus = keep;
  }

  // ---------------------------------------------------------------- geometry
  const anims = new Map();   // id -> { fx, fy, t0, dur, x, y }  current FLIP offset
  const colDrift = []; // elastic horizontal drift per column (px)

  function localPos(el) {
    let x = 0, y = 0, n = el;
    while (n && n !== track) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y };
  }
  // Visual rect of a course in track space, including slide offsets and column drift.
  function rectOf(id) {
    if (S.drag && S.drag.active && S.drag.id === id) {
      return { x: S.drag.gx, y: S.drag.gy, w: S.drag.w, h: S.drag.h };
    }
    const el = cardEl[id];
    const p = localPos(el);
    const a = anims.get(id);
    const sem = semOf(S.plan, id);
    return { x: p.x + (a ? a.x : 0) + (colDrift[sem] || 0), y: p.y + (a ? a.y : 0), w: el.offsetWidth, h: el.offsetHeight };
  }

  function drawLines() {
    const W = track.scrollWidth, H = track.scrollHeight;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svgTop.setAttribute('width', W); svgTop.setAttribute('height', H);
    svgTop.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const rects = {};
    for (const id of Object.keys(cardEl)) rects[id] = rectOf(id);
    const sem = {};
    S.plan.forEach((s, i) => s.forEach((id) => { sem[id] = i; }));

    // Spread the endpoints of the lines on show over each card's edge so bundles do not stack on
    // one pixel. Hidden lines attach at the middle until they show.
    const shown = (e) => pathEl[e.id] && (pathEl[e.id].classList.contains('lit') || pathEl[e.id].classList.contains('bad'));
    const outPorts = {}, inPorts = {};
    for (const e of ALL_EDGES) {
      if (!shown(e)) continue;
      (outPorts[e.from] ||= []).push(e);
      (inPorts[e.to] ||= []).push(e);
    }
    const portY = (list, e, id, otherKey) => {
      const r = rects[id];
      if (!list || !list.includes(e)) return r.y + r.h / 2;
      const sorted = list.slice().sort((a, b) => rects[a[otherKey]].y - rects[b[otherKey]].y);
      const n = sorted.length, i = sorted.indexOf(e);
      const step = n > 1 ? Math.min(9, (r.h * 0.6) / (n - 1)) : 0;
      return r.y + r.h / 2 + (i - (n - 1) / 2) * step;
    };

    for (const e of ALL_EDGES) {
      const a = rects[e.from], b = rects[e.to];
      const ay = portY(outPorts[e.from], e, e.from, 'to');
      const by = portY(inPorts[e.to], e, e.to, 'from');
      let d;
      if (sem[e.from] < sem[e.to]) {
        const sx = a.x + a.w, ex = b.x - 2;
        const k = Math.max(36, (ex - sx) * 0.45);
        d = `M${sx},${ay} C${sx + k},${ay} ${ex - k},${by} ${ex},${by}`;
      } else if (sem[e.from] === sem[e.to]) {
        // Same semester: loop out to the right of the column and back in.
        const sx = a.x + a.w, ex = b.x + b.w + 2;
        const bulge = 26 + Math.min(30, Math.abs(by - ay) * 0.12);
        d = `M${sx},${ay} C${sx + bulge},${ay} ${ex + bulge},${by} ${ex},${by}`;
      } else {
        // Prerequisite placed after the course: run backwards, right edge of the course.
        const sx = a.x, ex = b.x + b.w + 2;
        const k = Math.max(50, (sx - ex) * 0.35);
        d = `M${sx},${ay} C${sx - k},${ay} ${ex + k},${by} ${ex},${by}`;
      }
      pathEl[e.id].setAttribute('d', d);
    }

    // Year bands span every term of their year and follow the columns (including their drift).
    for (const band of bandsEl.children) {
      const y = +band.dataset.year;
      const idx = S.terms.map((t, i) => (t.year === y ? i : -1)).filter((i) => i >= 0);
      const i0 = idx[0], i1 = idx[idx.length - 1];
      const c0 = colEl[i0], c1 = colEl[i1];
      const p0 = localPos(c0), p1 = localPos(c1);
      const left = p0.x - 14 + colDrift[i0];
      const right = p1.x + c1.offsetWidth + 14 + colDrift[i1];
      band.style.transform = `translate(${left}px, ${p0.y - 6}px)`;
      band.style.width = `${right - left}px`;
      band.style.height = `${Math.max(...idx.map((i) => colEl[i].offsetHeight)) + 20}px`;
    }
  }

  // ---------------------------------------------------------------- FLIP slides
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  function snapshot() {
    const m = {};
    for (const id of Object.keys(cardEl)) {
      const p = localPos(cardEl[id]);
      const a = anims.get(id);
      m[id] = { x: p.x + (a ? a.x : 0), y: p.y + (a ? a.y : 0) };
    }
    return m;
  }
  function slideFrom(before, dur = 420) {
    const now = performance.now();
    for (const id of Object.keys(cardEl)) {
      if (S.drag && S.drag.active && S.drag.id === id) continue;
      const p = localPos(cardEl[id]);
      const b = before[id];
      if (!b) continue;
      const fx = b.x - p.x, fy = b.y - p.y;
      if (Math.abs(fx) < 0.5 && Math.abs(fy) < 0.5) { if (!anims.has(id)) continue; }
      anims.set(id, { fx, fy, t0: now, dur, x: fx, y: fy });
    }
    applyAnims(now);
    loop.kick();
  }
  function applyAnims(now) {
    for (const [id, a] of anims) {
      const t = Math.min(1, (now - a.t0) / a.dur);
      const k = 1 - easeOut(t);
      a.x = a.fx * k; a.y = a.fy * k;
      const el = cardEl[id];
      if (el) el.style.transform = t < 1 ? `translate(${a.x}px, ${a.y}px)` : '';
      if (t >= 1) anims.delete(id);
    }
  }

  // ---------------------------------------------------------------- smooth horizontal scrolling
  const scroller = (() => {
    let cur = 0, target = 0, last = 0, written = 0, vel = 0;
    const max = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const clamp = (v) => Math.max(0, Math.min(max(), v));

    viewport.addEventListener('wheel', (ev) => {
      if (ev.ctrlKey) return;
      const unit = ev.deltaMode === 1 ? 32 : ev.deltaMode === 2 ? viewport.clientWidth : 1;
      const horizontal = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) || ev.shiftKey;
      const delta = (horizontal ? (ev.deltaX || ev.deltaY) : ev.deltaY) * unit;
      // A sideways two-finger swipe glides through the semesters. A vertical swipe scrolls the
      // chart down when it is taller than the window, and otherwise also moves sideways.
      if (!horizontal && viewport.scrollHeight > viewport.clientHeight + 2) return;
      const next = clamp(target + delta);
      if (next === target && !horizontal) return;
      ev.preventDefault();
      target = next;
      loop.kick();
    }, { passive: false });

    return {
      get target() { return target; },
      set target(v) { target = clamp(v); loop.kick(); },
      get velocity() { return vel; },
      jump(v) { cur = target = written = clamp(v); viewport.scrollLeft = cur; },
      toColumn(i) {
        const p = localPos(colEl[i]);
        target = clamp(p.x - 40);
        loop.kick();
      },
      step() {
        // Native scrollbar or touchpad momentum moved us: adopt that position.
        if (Math.abs(viewport.scrollLeft - written) > 1.5) { cur = target = viewport.scrollLeft; }
        target = clamp(target);
        const prev = cur;
        cur += (target - cur) * 0.12;
        if (Math.abs(target - cur) < 0.3) cur = target;
        if (Math.round(cur) !== Math.round(viewport.scrollLeft)) viewport.scrollLeft = cur;
        written = viewport.scrollLeft;
        const v = cur - last;
        last = cur;
        vel += (v - vel) * 0.25;
        if (Math.abs(vel) < 0.01) vel = 0;
        return cur !== target || prev !== cur || vel !== 0;
      },
    };
  })();

  // Background drag-to-pan with momentum.
  (() => {
    let pan = null;
    viewport.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 || ev.target.closest('.card')) return;
      if (ev.pointerType === 'touch') return; // touch already pans natively
      pan = { x: ev.clientX, start: scroller.target, lastX: ev.clientX, t: performance.now(), v: 0 };
      viewport.classList.add('panning');
    });
    window.addEventListener('pointermove', (ev) => {
      if (!pan) return;
      const now = performance.now();
      pan.v = (ev.clientX - pan.lastX) / Math.max(1, now - pan.t);
      pan.lastX = ev.clientX; pan.t = now;
      scroller.target = pan.start - (ev.clientX - pan.x);
    });
    window.addEventListener('pointerup', () => {
      if (!pan) return;
      scroller.target = scroller.target - pan.v * 260;
      pan = null;
      viewport.classList.remove('panning');
    });
  })();

  window.addEventListener('keydown', (ev) => {
    if (ev.target.closest('select, input, textarea')) return;
    const colStep = colEl[1] ? localPos(colEl[1]).x - localPos(colEl[0]).x : 264;
    if (ev.key === 'ArrowRight') { scroller.target = scroller.target + colStep; ev.preventDefault(); }
    if (ev.key === 'ArrowLeft') { scroller.target = scroller.target - colStep; ev.preventDefault(); }
    if (ev.key === 'Escape') { closeDrawer(); $('issues').hidden = true; S.selected = null; S.pinned = null; paint(); }
  });

  // ---------------------------------------------------------------- animation loop
  const loop = (() => {
    let running = false;
    function frame(now) {
      const scrolling = scroller.step();
      applyAnims(now);

      // Elastic drift: while moving, columns trail by their distance from the viewport centre.
      const v = S.drag ? 0 : scroller.velocity;
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let drifting = false;
      colEl.forEach((col, i) => {
        const p = localPos(col);
        const rel = (p.x + col.offsetWidth / 2 - center) / Math.max(400, viewport.clientWidth);
        const want = Math.max(-26, Math.min(26, -v * 1.1 * rel * 2));
        colDrift[i] += (want - colDrift[i]) * 0.2;
        if (Math.abs(colDrift[i]) < 0.05) colDrift[i] = 0;
        col.style.transform = colDrift[i] ? `translateX(${colDrift[i]}px)` : '';
        if (colDrift[i]) drifting = true;
      });

      if (S.drag && S.drag.active) dragAutoScroll();
      drawLines();
      updateSemnav();

      if (scrolling || anims.size || drifting || (S.drag && S.drag.active)) requestAnimationFrame(frame);
      else running = false;
    }
    return { kick() { if (!running) { running = true; requestAnimationFrame(frame); } } };
  })();

  viewport.addEventListener('scroll', () => loop.kick(), { passive: true });
  window.addEventListener('resize', () => { drawLines(); updateSemnav(); });

  function updateSemnav() {
    const btns = $('semnav').querySelectorAll('button');
    if (!btns.length || !colEl.length) return;
    const left = viewport.scrollLeft, right = left + viewport.clientWidth;
    let first = -1, last = -1;
    colEl.forEach((col, i) => {
      const x = localPos(col).x, w = col.offsetWidth;
      const visible = Math.min(right, x + w) - Math.max(left, x);
      if (visible > w * 0.5) { if (first < 0) first = i; last = i; }
    });
    if (first < 0) return;
    const a = btns[first], b = btns[last];
    const win = $('semnavWindow');
    win.style.transform = `translateX(${a.offsetLeft - 4}px)`;
    win.style.width = `${b.offsetLeft + b.offsetWidth - a.offsetLeft}px`;
    win.style.transition = 'transform .35s cubic-bezier(.2,.9,.2,1), width .35s cubic-bezier(.2,.9,.2,1)';
  }

  // ---------------------------------------------------------------- drag and drop
  const SLOP = 5;

  function onCardDown(ev) {
    if (ev.button !== 0 || ev.target.closest('.check')) return;
    ev.stopPropagation();
    const id = ev.currentTarget.dataset.id;
    S.drag = { id, active: false, sx: ev.clientX, sy: ev.clientY, cx: ev.clientX, cy: ev.clientY, pointerId: ev.pointerId };
  }

  function toLocal(cx, cy) {
    const vr = viewport.getBoundingClientRect();
    return { x: cx - vr.left + viewport.scrollLeft - track.offsetLeft, y: cy - vr.top + viewport.scrollTop - track.offsetTop };
  }

  function startDrag() {
    const d = S.drag;
    const el = cardEl[d.id];
    const r = rectOf(d.id);
    const p = toLocal(d.sx, d.sy);
    d.active = true;
    d.offX = p.x - r.x; d.offY = p.y - r.y;
    d.w = el.offsetWidth; d.h = el.offsetHeight;
    d.gx = r.x; d.gy = r.y;
    d.origin = clone(S.plan);
    anims.delete(d.id); el.style.transform = '';

    const ghost = el.cloneNode(true);
    ghost.classList.remove('intro', 'dim', 'lit', 'placeholder', 'selected', 'pinned', 'pulse');
    ghost.classList.add('ghost');
    ghost.style.animationDelay = '';
    track.appendChild(ghost);
    d.ghost = ghost;
    el.classList.add('placeholder');
    S.hover = null;
    document.body.style.cursor = 'grabbing';
    paint();
    moveGhost();
  }

  function moveGhost() {
    const d = S.drag;
    const p = toLocal(d.cx, d.cy);
    d.gx = p.x - d.offX; d.gy = p.y - d.offY;
    const tilt = Math.max(-6, Math.min(6, (d.cx - (d.lastCx ?? d.cx)) * 0.4));
    d.lastCx = d.cx;
    d.tilt = (d.tilt || 0) + (tilt - (d.tilt || 0)) * 0.3;
    d.ghost.style.transform = `translate(${d.gx}px, ${d.gy}px) rotate(${d.tilt.toFixed(2)}deg) scale(1.04)`;

    // Which semester and slot is under the pointer?
    const centerX = p.x;
    let best = 0, bestDist = Infinity;
    colEl.forEach((col, i) => {
      const x = localPos(col).x + col.offsetWidth / 2;
      const dist = Math.abs(x - centerX);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    const others = S.plan[best].filter((id) => id !== d.id);
    let index = others.length;
    for (let k = 0; k < others.length; k++) {
      const r = rectOf(others[k]);
      if (p.y < r.y + r.h / 2) { index = k; break; }
    }
    const curSem = semOf(S.plan, d.id);
    const curIndex = S.plan[curSem].filter((id) => id !== d.id).length >= 0 ? S.plan[curSem].indexOf(d.id) : -1;
    if (best !== curSem || index !== curIndex) {
      const before = snapshot();
      moveCourse(S.plan, d.id, best, index);
      placeCards();
      slideFrom(before, 300);
      paint();
    }
    const bad = analyze(S.plan).badCourses;
    const involved = bad.has(d.id) || EDGES.some((e) => e.from === d.id && edgeBroken(S.plan, e));
    colEl.forEach((col, i) => {
      col.classList.toggle('drop-target', i === best);
      col.classList.toggle('drop-bad', i === best && involved);
    });
    d.ghost.classList.toggle('bad', involved);
  }

  function dragAutoScroll() {
    const d = S.drag;
    const vr = viewport.getBoundingClientRect();
    const edge = 90;
    let push = 0;
    if (d.cx < vr.left + edge) push = -(1 - (d.cx - vr.left) / edge);
    else if (d.cx > vr.right - edge) push = 1 - (vr.right - d.cx) / edge;
    if (push) {
      scroller.target = scroller.target + push * 18;
      moveGhost();
    }
  }

  window.addEventListener('pointermove', (ev) => {
    const d = S.drag;
    if (!d || ev.pointerId !== d.pointerId) return;
    d.cx = ev.clientX; d.cy = ev.clientY;
    if (!d.active) {
      if (Math.hypot(d.cx - d.sx, d.cy - d.sy) < SLOP) return;
      startDrag();
    }
    moveGhost();
    loop.kick();
  });

  function endDrag(cancel) {
    const d = S.drag;
    S.drag = null;
    document.body.style.cursor = '';
    if (!d) return;
    if (!d.active) {
      // A press without travel is a click.
      if (!cancel) openCourse(d.id);
      return;
    }
    if (cancel) {
      const before = snapshot();
      S.plan = d.origin; placeCards(); slideFrom(before);
    }
    const el = cardEl[d.id];
    el.classList.remove('placeholder');
    // Fly the card from where the ghost was into its slot.
    const p = localPos(el);
    const drift = colDrift[semOf(S.plan, d.id)] || 0;
    anims.set(d.id, { fx: d.gx - p.x - drift, fy: d.gy - p.y, t0: performance.now(), dur: 380, x: d.gx - p.x, y: d.gy - p.y });
    d.ghost.remove();
    colEl.forEach((col) => col.classList.remove('drop-target', 'drop-bad'));
    save();
    paint();
    if (S.selected) renderDrawer();
    loop.kick();
  }
  window.addEventListener('pointerup', (ev) => { if (S.drag && ev.pointerId === S.drag.pointerId) endDrag(false); });
  window.addEventListener('pointercancel', (ev) => { if (S.drag && ev.pointerId === S.drag.pointerId) endDrag(true); });

  // ---------------------------------------------------------------- details drawer
  function openCourse(id) {
    S.selected = id;
    renderDrawer();
    $('drawer').classList.add('open');
    $('drawer').setAttribute('aria-hidden', 'false');
    paint();
  }
  function closeDrawer() {
    $('drawer').classList.remove('open');
    $('drawer').setAttribute('aria-hidden', 'true');
    if (S.selected) { S.selected = null; if (S.plan) paint(); }
  }
  $('drawerClose').addEventListener('click', closeDrawer);

  function reqItem(reqId, ok, tag) {
    if (!C[reqId]) {
      const pc = S.prior.find((x) => x.code.replace(/\s/g, '') === reqId);
      const text = pc ? `${pc.code}: ${pc.grade === 'CR' ? 'AP credit (CR)' : pc.grade ? `grade ${pc.grade}` : 'in progress'} on your transcript` : ((P.prior && P.prior[reqId]) || reqId);
      return `<li class="ext">${ICON.info}<span>${text}</span></li>`;
    }
    const s = semOf(S.plan, reqId);
    return `<li class="${ok ? 'ok' : 'bad'}">${ok ? ICON.check : ICON.x}<button data-go="${reqId}">${C[reqId].code}</button>` +
      `${tag ? `<span class="tag">${tag}</span>` : ''}<span class="sem">${S.done.has(reqId) ? 'Completed' : nameAt(s)}</span></li>`;
  }

  function renderDrawer() {
    const id = S.selected;
    if (!id) return;
    const c = C[id];
    const sem = semOf(S.plan, id);
    // Requirements come from the edges (added and edited courses change them), plus credit from
    // outside the plan such as CH 301. Deleted catalog courses are dropped.
    const outside = (list) => (list || []).filter((p) => typeof p === 'string' && !C[p] && !BASE[p]);
    const into = (type) => ALL_EDGES.filter((e) => e.to === id && e.type === type && !e.any).map((e) => e.from);
    // One-of requirements, each shown once with all its options.
    const groups = [];
    for (const e of ALL_EDGES) {
      if (e.to !== id || !e.any || groups.some((g) => g.type === e.type && g.opts === e.any)) continue;
      groups.push({ type: e.type, opts: e.any, ok: !edgeBroken(S.plan, e) });
    }
    const groupItems = groups.map((g) => `<li class="${g.ok ? 'ok' : 'bad'}">${g.ok ? ICON.check : ICON.x}<span class="one-of">One of</span>` +
      g.opts.map((o) => `<button data-go="${o}">${C[o].code}</button>`).join('<span class="or">or</span>') +
      `${g.type === 'co' ? '<span class="tag">co-req</span>' : ''}</li>`);
    const preIds = [...into('pre'), ...outside(c.pre)];
    const coIds = [...into('co'), ...outside(c.co)];
    const pre = preIds.map((p) => reqItem(p, !C[p] || semOf(S.plan, p) < sem));
    const co = coIds.map((p) => reqItem(p, !C[p] || semOf(S.plan, p) <= sem, 'co-req'));
    const unlocks = ALL_EDGES.filter((e) => e.from === id).map((e) => {
      const ok = !edgeBroken(S.plan, e);
      return `<li class="${ok ? 'ok' : 'bad'}">${ok ? ICON.check : ICON.x}<button data-go="${e.to}">${C[e.to].code}</button>` +
        `${e.type === 'co' ? '<span class="tag">co-req</span>' : ''}${e.any ? '<span class="tag">one of</span>' : ''}<span class="sem">${nameAt(semOf(S.plan, e.to))}</span></li>`;
    });
    const badPre = preIds.filter((p) => C[p] && semOf(S.plan, p) >= sem);
    const badCo = coIds.filter((p) => C[p] && semOf(S.plan, p) > sem);
    let alerts = '';
    const badGroups = groups.filter((g) => !g.ok);
    if (badPre.length || badCo.length || badGroups.length) {
      const parts = [];
      if (badPre.length) parts.push(`${badPre.map((p) => C[p].code).join(', ')} must be completed in an earlier semester`);
      if (badCo.length) parts.push(`${badCo.map((p) => C[p].code).join(', ')} must be taken in the same semester or earlier`);
      for (const g of badGroups) parts.push(`one of ${g.opts.map((o) => C[o].code).join(' or ')} must come ${g.type === 'pre' ? 'in an earlier semester' : 'in the same semester or earlier'}`);
      alerts += `<div class="d-alert bad"><strong>Prerequisite chain broken.</strong> ${parts.join('; ')}.</div>`;
    }
    if (c.latest != null && sem >= lateFrom(c.latest)) {
      alerts += `<div class="d-alert warn"><strong>Past the on-time limit.</strong> To graduate in four years, take ${c.code} no later than ${latestName(c.latest)}.</div>`;
    }
    if (c.offered && analyze(S.plan).offTerm.has(id)) {
      alerts += `<div class="d-alert warn"><strong>Not offered then.</strong> ${c.code} is offered in the ${c.offered} only, but it is planned for ${nameAt(sem)}.</div>`;
    }
    const openPre = [...preIds, ...coIds].filter((p) => C[p] && !S.done.has(p));
    if (S.done.has(id) && openPre.length) {
      alerts += `<div class="d-alert warn">Marked complete, but ${openPre.map((p) => C[p].code).join(', ')} ${openPre.length === 1 ? 'is' : 'are'} not checked off yet.</div>`;
    }
    if (S.credit.has(id)) alerts += `<div class="d-alert credit"><strong>AP credit.</strong> Your transcript shows ${S.taken[id] || c.code} with a grade of CR (credit by exam), so this requirement is complete.</div>`;
    if (S.taken[id] && !S.credit.has(id)) alerts += `<div class="d-alert note">Filled by <strong>${S.taken[id]}</strong> from your transcript.</div>`;
    if (c.note) alerts += `<div class="d-alert note">${c.note}</div>`;
    if (c.custom) alerts += `<div class="d-alert note">You added this course.</div>`;
    else if (S.edits[id]) alerts += `<div class="d-alert note">You edited this course. Reset to suggested restores the original.</div>`;

    $('drawerBody').innerHTML =
      `<div class="d-cat" style="color:var(--${c.cat})"><i style="background:var(--${c.cat})"></i>${CATS[c.cat].label}</div>` +
      `<div class="d-code">${c.code}</div><p class="d-title">${c.title}</p>` +
      `<div class="d-actions"><button class="d-done${S.done.has(id) ? ' on' : ''}" id="dDone">${S.done.has(id) ? `${ICON.ok}Completed` : `${ICON.check}Mark as completed`}</button>` +
      `<button class="d-done d-edit" id="dEdit">${ICON.edit}Edit</button><button class="d-done d-delete" id="dDelete">${ICON.trash}Delete</button></div>` +
      `<div class="d-meta"><span>${c.hrs} credit hours</span><span>Planned: ${nameAt(sem)}</span>` +
      `${c.latest != null ? `<span${c.latestFromChain ? ' title="Worked out from the prerequisite chain, so every later course still fits in four years"' : ''}>Latest on track: ${latestName(c.latest)}</span>` : ''}` +
      `${c.offered ? `<span>Offered: ${c.offered} only</span>` : ''}</div>` +
      alerts +
      `<h3>Requires</h3>${pre.length || co.length || groupItems.length ? `<ul class="req">${pre.join('')}${groupItems.join('')}${co.join('')}</ul>` : '<p class="empty">No prerequisites.</p>'}` +
      `<h3>Leads to</h3>${unlocks.length ? `<ul class="req">${unlocks.join('')}</ul>` : '<p class="empty">Not a prerequisite for other required courses.</p>'}`;
    $('drawerBody').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => focusCourse(b.dataset.go, true)));
    $('dDone').addEventListener('click', () => toggleDone(id));
    $('dEdit').addEventListener('click', () => showCourseForm(semOf(S.plan, id), id));
    $('dDelete').addEventListener('click', () => confirmDelete(id));
  }

  function focusCourse(id, open) {
    const sem = semOf(S.plan, id);
    const p = localPos(colEl[sem]);
    const want = p.x + colEl[sem].offsetWidth / 2 - viewport.clientWidth / 2;
    scroller.target = want;
    const el = cardEl[id];
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    el.addEventListener('animationend', () => el.classList.remove('pulse'), { once: true });
    if (open) openCourse(id);
  }

  // ---------------------------------------------------------------- issues list
  $('statusBtn').addEventListener('click', () => {
    if ($('statusBtn').classList.contains('ok')) return;
    $('issues').hidden = !$('issues').hidden;
    if (!$('issues').hidden) renderIssues();
  });
  $('issuesClose').addEventListener('click', () => { $('issues').hidden = true; });

  function renderIssues() {
    const items = [];
    for (const e of EDGES) {
      if (!edgeBroken(S.plan, e)) continue;
      const a = C[e.from], b = C[e.to];
      const sa = nameAt(semOf(S.plan, e.from)), sb = nameAt(semOf(S.plan, e.to));
      const why = e.type === 'pre'
        ? (sa === sb ? `are both in ${sb}, but ${a.code} must come first` : `${a.code} is in ${sa}, after ${b.code} in ${sb}`)
        : `${a.code} (${sa}) must be taken with or before ${b.code} (${sb})`;
      if (e.any) {
        if (e.any[0] !== e.from) continue; // one entry per one-of requirement
        items.push(`<li><button data-go="${e.to}"><b>${b.code}</b> needs one of <b>${e.any.map((o) => C[o].code).join(' or ')}</b> ${e.type === 'pre' ? 'in an earlier semester' : 'in the same semester or earlier'}.</button></li>`);
        continue;
      }
      items.push(`<li><button data-go="${e.to}"><b>${b.code}</b> needs <b>${a.code}</b>: ${e.type === 'pre' && sa === sb ? `they ${why}` : why}.</button></li>`);
    }
    const { late, offTerm } = analyze(S.plan);
    for (const id of late) {
      items.push(`<li class="warn"><button data-go="${id}"><b>${C[id].code}</b> is planned for ${nameAt(semOf(S.plan, id))}. Take it by ${latestName(C[id].latest)} to stay on a four-year track.</button></li>`);
    }
    for (const id of offTerm) {
      items.push(`<li class="warn"><button data-go="${id}"><b>${C[id].code}</b> is offered in the ${C[id].offered} only, but it is planned for ${nameAt(semOf(S.plan, id))}.</button></li>`);
    }
    $('issuesList').innerHTML = items.join('') || '<li class="empty">No conflicts.</li>';
    $('issuesList').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => focusCourse(b.dataset.go, true)));
  }

  // ---------------------------------------------------------------- reset
  $('resetBtn').addEventListener('click', confirmReset);

  // Spell out what a reset undoes; completions and added courses are the student's choice.
  function confirmReset() {
    const marked = [...S.done].filter((id) => !S.fromTranscript.has(id)).length;
    const added = Object.keys(S.custom).length;
    const keep = (id, text) => `<label class="rs-keep"><input type="checkbox" id="${id}" checked><span>${text}</span></label>`;
    openModal(`<h2 id="modalTitle">Reset to the suggested plan?</h2>` +
      `<p class="m-sub">Every course goes back to its suggested semester and extra terms are removed. ` +
      `Edited and deleted courses are restored, and anything from an imported transcript is cleared.</p>` +
      (marked || added ? `<div class="rs-keeps">` +
        (marked ? keep('rsKeepDone', `Keep my ${marked} completed course${marked === 1 ? '' : 's'} checked off`) : '') +
        (added ? keep('rsKeepAdded', `Keep the ${added} course${added === 1 ? '' : 's'} I added`) : '') + `</div>` : '') +
      `<div class="m-actions"><button class="btn ghost" id="rsCancel">Cancel</button><button class="btn primary" id="rsOk">Reset plan</button></div>`);
    $('rsCancel').addEventListener('click', closeModal);
    $('rsOk').addEventListener('click', () => {
      const opts = { keepDone: !$('rsKeepDone') || $('rsKeepDone').checked, keepAdded: !$('rsKeepAdded') || $('rsKeepAdded').checked };
      closeModal();
      revertToSuggested(opts);
    });
  }

  function revertToSuggested({ keepDone = true, keepAdded = true } = {}) {
    const before = snapshot();
    const oldPlan = S.plan;
    // Brings back deleted and edited catalog courses.
    applyCourses({ custom: keepAdded ? S.custom : {} });
    S.terms = defaultTerms();
    S.plan = clone(P.plan);
    keepCustom(oldPlan);
    // Undo everything the transcript set; check-offs made by hand stay if asked.
    if (keepDone) { for (const id of S.fromTranscript) S.done.delete(id); } else S.done = new Set();
    for (const id of [...S.done]) if (!C[id]) S.done.delete(id);
    Object.assign(S, emptyTranscript());
    if (S.pinned && !C[S.pinned]) S.pinned = null;
    if (S.selected && !C[S.selected]) closeDrawer();
    rebuild(before, 650);
    renderDock();
    scroller.target = 0;
  }

  // ---------------------------------------------------------------- adding and removing terms
  let newTerm = null;
  function rebuild(before, dur = 520) {
    const keep = S.selected;
    build(false);
    slideFrom(before, dur);
    save();
    S.selected = keep;
    paint();
    if (S.selected) renderDrawer();
    requestAnimationFrame(() => { updateSemnav(); loop.kick(); });
  }
  function nextRegular() {
    const regs = S.terms.filter(isRegular);
    const last = regs[regs.length - 1];
    return last.kind === 'fall' ? { kind: 'spring', year: last.year } : { kind: 'fall', year: last.year + 1 };
  }
  function addSummer(springIndex) {
    const before = snapshot();
    const t = { kind: 'summer', year: S.terms[springIndex].year };
    S.terms.splice(springIndex + 1, 0, t);
    S.plan.splice(springIndex + 1, 0, []);
    newTerm = t;
    rebuild(before);
    scroller.toColumn(Math.max(0, springIndex));
  }
  function addRegular() {
    const before = snapshot();
    const t = nextRegular();
    S.terms.push(t);
    S.plan.push([]);
    newTerm = t;
    rebuild(before);
    scroller.target = 1e9;
  }
  function removeTerm(i) {
    if (S.plan[i].length) return;
    const before = snapshot();
    S.terms.splice(i, 1);
    S.plan.splice(i, 1);
    rebuild(before);
  }

  // ---------------------------------------------------------------- adding your own course
  // pre: taken in an earlier term. co: same term or earlier. unlocks: catalog courses that need it.
  // UT course numbers start with the credit hours: CHE 379 is 3 hours, M 408D is 4.
  const parseCode = (text) => {
    const m = String(text).toUpperCase().replace(/\s+/g, ' ').trim().match(/^([A-Z][A-Z ]{0,5}?) ?(\d)(\d\d[A-Z]?)$/);
    return m ? { code: `${m[1].trim()} ${m[2]}${m[3]}`, hrs: Math.max(1, +m[2]) } : null;
  };
  const clean = (t) => String(t).replace(/[<>"&]/g, '').trim();

  // Add a course to a term, or edit one already in the plan (editId).
  function showCourseForm(sem, editId) {
    const editing = editId ? C[editId] : null;
    // Current links of the course being edited, as the form's starting selections.
    const linked = (type, dir) => !editId ? [] : ALL_EDGES
      .filter((e) => !e.any && e.type === type && (dir === 'in' ? e.to : e.from) === editId).map((e) => (dir === 'in' ? e.from : e.to));
    const sel = { acPre: linked('pre', 'in'), acCo: linked('co', 'in'), acPost: linked('pre', 'out') };
    // Checklist of every other course in the plan, grouped by term.
    const picker = (name) => S.plan.map((ids, i) => {
      ids = ids.filter((id) => id !== editId);
      return ids.length ? `<div class="ac-term"><small>${nameAt(i)}</small><div class="ac-chips">` +
        ids.map((id) => `<label class="ac-chip" style="--c:var(--${C[id].cat})"><input type="checkbox" name="${name}" value="${id}"${sel[name].includes(id) ? ' checked' : ''}><span>${C[id].code}</span></label>`).join('') +
        `</div></div>` : '';
    }).join('');
    const yesNo = (name, q, on) => `<div class="ac-q"><span>${q}</span><div class="ac-yn">` +
      `<label><input type="radio" name="${name}" value="no"${on ? '' : ' checked'}><span>No</span></label>` +
      `<label><input type="radio" name="${name}" value="yes"${on ? ' checked' : ''}><span>Yes</span></label></div></div>`;
    const hoursText = (code, hrs) => `${code}: ${hrs} credit hour${hrs === 1 ? '' : 's'}`;
    const defaultHint = editing ? hoursText(editing.code, editing.hrs) : 'Credit hours come from the first digit of the course number.';
    openModal(
      `<h2 id="modalTitle">${editing ? `Edit ${editing.code}` : `Add a course to ${nameAt(sem)}`}</h2>` +
      `<form class="ac-form" id="acForm" novalidate>` +
        `<label class="ac-field"><span>Degree requirement</span><select id="acCat">` +
          Object.entries(CATS).map(([k, v]) => `<option value="${k}"${editing && editing.cat === k ? ' selected' : ''}>${v.label}</option>`).join('') + `</select></label>` +
        `<div class="ac-row">` +
          `<label class="ac-field"><span>Course number</span><input id="acCode" placeholder="CHE 379" autocomplete="off" value="${editing ? esc(editing.code) : ''}"></label>` +
          `<label class="ac-field grow"><span>Course name</span><input id="acTitle" placeholder="Petroleum Refining" autocomplete="off" value="${editing ? esc(editing.title) : ''}"></label>` +
        `</div>` +
        `<p class="ac-hint" id="acHint">${defaultHint}</p>` +
        yesNo('acHasPre', 'Does it have prerequisites?', sel.acPre.length) +
        `<div class="ac-pick" id="acPrePick" hidden><p>Select the classes you need to take first.</p>${picker('acPre')}</div>` +
        yesNo('acHasCo', 'Does it have co-requisites?', sel.acCo.length) +
        `<div class="ac-pick" id="acCoPick" hidden><p>Select the classes to take in the same semester or earlier.</p>${picker('acCo')}</div>` +
        yesNo('acHasPost', 'Is it a prerequisite for other classes?', sel.acPost.length) +
        `<div class="ac-pick" id="acPostPick" hidden><p>Select the classes that need this course.</p>${picker('acPost')}</div>` +
        `<p class="ac-error" id="acError" hidden></p>` +
        `<div class="m-actions"><button type="button" class="btn ghost" id="acCancel">Cancel</button><button type="submit" class="btn primary">${editing ? 'Save changes' : 'Add course'}</button></div>` +
      `</form>`);
    const form = $('acForm');
    const norm = (t) => clean(t).toUpperCase().replace(/\s+/g, ' ');
    // An edited course keeps its code and hours unless the number is changed.
    const unchanged = () => editing && norm($('acCode').value) === norm(editing.code);
    const sync = () => {
      $('acPrePick').hidden = form.acHasPre.value !== 'yes';
      $('acCoPick').hidden = form.acHasCo.value !== 'yes';
      $('acPostPick').hidden = form.acHasPost.value !== 'yes';
      const pc = parseCode($('acCode').value);
      $('acHint').textContent = unchanged() ? defaultHint : pc ? hoursText(pc.code, pc.hrs) : 'Credit hours come from the first digit of the course number.';
    };
    sync();
    form.addEventListener('change', sync);
    $('acCode').addEventListener('input', sync);
    $('acCancel').addEventListener('click', closeModal);
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const err = (msg) => { $('acError').textContent = msg; $('acError').hidden = false; };
      const pc = unchanged() ? { code: editing.code, hrs: editing.hrs } : parseCode(clean($('acCode').value));
      if (!pc) return err('Enter a course number like CHE 379 or M 427L.');
      const id = editId || `X_${pc.code.replace(/ /g, '')}`;
      if ((!editId && C[id]) || Object.entries(C).some(([k, c]) => k !== editId && c.code === pc.code)) return err(`${pc.code} is already in your plan.`);
      const checked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((x) => x.value);
      const pre = form.acHasPre.value === 'yes' ? checked('acPre') : [];
      const co = form.acHasCo.value === 'yes' ? checked('acCo') : [];
      const unlocks = form.acHasPost.value === 'yes' ? checked('acPost') : [];
      if (form.acHasPre.value === 'yes' && !pre.length) return err('Select at least one prerequisite, or answer No.');
      if (form.acHasCo.value === 'yes' && !co.length) return err('Select at least one co-requisite, or answer No.');
      if (form.acHasPost.value === 'yes' && !unlocks.length) return err('Select at least one class that needs it, or answer No.');
      const twice = [...pre, ...co, ...unlocks].find((x, i, all) => all.indexOf(x) !== i);
      if (twice) return err(`${C[twice].code} is selected in more than one list. Pick it in only one.`);
      // Keep credit from outside the plan (like CH 301) that the checklist cannot show.
      const keepOutside = (list) => (list || []).filter((p) => !C[p]);
      saveCourse(sem, id, {
        code: pc.code, hrs: pc.hrs, cat: $('acCat').value,
        title: clean($('acTitle').value) || (editing ? editing.title : 'Added course'),
        pre: [...pre, ...keepOutside(editing && editing.pre)], co: [...co, ...keepOutside(editing && editing.co)], unlocks,
      });
      closeModal();
    });
    setTimeout(() => $('acCode').focus(), 50);
  }

  // Store an added or edited course. Added courses go in S.custom, catalog changes in S.edits.
  function saveCourse(sem, id, fields) {
    const before = snapshot();
    const isNew = !C[id];
    const custom = { ...S.custom }, edits = { ...S.edits };
    const put = (k, f) => { if ((isNew && k === id) || custom[k]) custom[k] = { ...custom[k], ...f }; else edits[k] = { ...edits[k], ...f }; };
    put(id, fields);
    // Courses with their own "leads to" list must agree with this course's prerequisites.
    for (const [k, c] of Object.entries(C)) {
      if (k === id || !c.unlocks) continue;
      const want = fields.pre.includes(k), has = c.unlocks.includes(id);
      if (want !== has) put(k, { unlocks: want ? [...c.unlocks, id] : c.unlocks.filter((t) => t !== id) });
    }
    applyCourses({ custom, edits, removed: S.removed });
    if (isNew) S.plan[sem].push(id);
    rebuild(before);
    if (isNew) focusCourse(id);
  }

  function confirmDelete(id) {
    const c = C[id];
    openModal(`<h2 id="modalTitle">Delete ${c.code}?</h2>` +
      `<p class="m-sub">${c.custom
        ? 'This removes the course you added from your plan.'
        : `${c.code} is part of the suggested degree plan. Deleting it also removes its prerequisite links. <b>Reset to suggested</b> brings it back.`}</p>` +
      `<div class="m-actions"><button class="btn ghost" id="cdCancel">Cancel</button><button class="btn danger" id="cdOk">${ICON.trash}Delete course</button></div>`);
    $('cdCancel').addEventListener('click', closeModal);
    $('cdOk').addEventListener('click', () => { closeModal(); deleteCourse(id); });
  }

  function deleteCourse(id) {
    const before = snapshot();
    const custom = { ...S.custom }, edits = { ...S.edits };
    let removed = S.removed;
    if (custom[id]) delete custom[id];
    else { delete edits[id]; removed = [...removed, id]; }
    // Drop it from any requirement lists the student set.
    for (const o of [custom, edits]) {
      for (const k of Object.keys(o)) {
        for (const f of ['pre', 'co', 'unlocks']) if (o[k][f] && o[k][f].includes(id)) o[k] = { ...o[k], [f]: o[k][f].filter((x) => x !== id) };
      }
    }
    for (const sem of S.plan) { const i = sem.indexOf(id); if (i >= 0) sem.splice(i, 1); }
    S.done.delete(id); S.credit.delete(id); S.fromTranscript.delete(id); delete S.taken[id];
    if (S.pinned === id) S.pinned = null;
    closeDrawer();
    applyCourses({ custom, edits, removed });
    rebuild(before);
  }

  // ---------------------------------------------------------------- completion + degree audit
  function toggleDone(id) {
    if (S.done.has(id)) S.done.delete(id); else S.done.add(id);
    const el = cardEl[id];
    el.classList.remove('just-done'); void el.offsetWidth;
    if (S.done.has(id)) el.classList.add('just-done');
    save();
    paint();
    if (S.selected) renderDrawer();
  }

  const tweens = {};
  function tweenText(elId, to, fmt) {
    const el = $(elId);
    const from = tweens[elId] ?? 0;
    tweens[elId] = to;
    if (from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 700;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      if (tweens[elId] !== to) return;
      el.textContent = fmt(Math.round(from + (to - from) * easeOut(t)));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(from);
    requestAnimationFrame(step);
    setTimeout(() => { if (tweens[elId] === to) el.textContent = fmt(to); }, dur + 50);
  }

  function renderAudit() {
    const REQUIRED = Object.keys(C).filter((id) => !C[id].optional);
    const REQ_HOURS = REQUIRED.reduce((n, id) => n + C[id].hrs, 0);
    const sumHrs = (ids) => ids.reduce((n, id) => n + C[id].hrs, 0);
    const doneReq = REQUIRED.filter((id) => S.done.has(id));
    const leftReq = REQUIRED.filter((id) => !S.done.has(id));
    const doneHrs = sumHrs(doneReq), leftHrs = REQ_HOURS - doneHrs;
    const frac = doneHrs / REQ_HOURS;
    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

    // Ring and headline numbers: required hours only (the optional CHE 102 is extra credit).
    $('ringFg').style.strokeDashoffset = (314.16 * (1 - frac)).toFixed(2);
    $('ringFg').classList.toggle('zero', doneHrs === 0);
    tweenText('auditPct', Math.floor(frac * 100), (v) => `${v}%`);
    if ($('app').classList.contains('panels-collapsed')) $('panelToggleText').textContent = `Show audit: ${Math.floor(frac * 100)}%`;
    tweenText('auditDoneHrs', doneHrs, (v) => `${v}`);
    tweenText('auditLeftHrs', leftHrs, (v) => `${v}`);
    const optDone = Object.keys(C).filter((id) => C[id].optional && S.done.has(id));
    $('auditDoneSub').textContent = `${plural(doneReq.length, 'course')} of ${REQUIRED.length}` +
      (optDone.length ? ` (+${sumHrs(optDone)} optional hr)` : '');
    $('auditLeftSub').textContent = plural(leftReq.length, 'course');

    // Next term: the first term that still has an unchecked required course.
    const nextIdx = S.plan.findIndex((sem) => sem.some((id) => !C[id].optional && !S.done.has(id)));
    if (nextIdx < 0) {
      $('auditNextTerm').textContent = 'Done';
      $('auditNextSub').textContent = 'All requirements met';
    } else {
      const left = S.plan[nextIdx].filter((id) => !C[id].optional && !S.done.has(id));
      const termsLeft = S.plan.filter((sem) => sem.some((id) => !C[id].optional && !S.done.has(id))).length;
      $('auditNextTerm').textContent = nameAt(nextIdx);
      $('auditNextSub').textContent = `${plural(left.length, 'course')} left, ${plural(termsLeft, 'term')} to go`;
    }

    const orphan = REQUIRED.filter((id) => S.done.has(id) &&
      [...(C[id].pre || []), ...(C[id].co || [])].some((p) => C[p] && !S.done.has(p)));
    $('auditWarn').hidden = !orphan.length;
    $('auditWarn').textContent = orphan.length
      ? `${orphan.map((id) => C[id].code).join(', ')} ${orphan.length === 1 ? 'is' : 'are'} checked off but ${orphan.length === 1 ? 'has' : 'have'} unchecked prerequisites.`
      : '';

    $('auditRows').innerHTML = Object.entries(CATS).map(([k, v]) => {
      const ids = REQUIRED.filter((id) => C[id].cat === k);
      const got = ids.filter((id) => S.done.has(id));
      const tot = sumHrs(ids), gotHrs = sumHrs(got);
      return `<div class="arow${got.length === ids.length ? ' full' : ''}" data-cat="${k}" role="row">` +
        `<span class="sw" style="background:var(--${k})"></span><span class="name">${v.label}</span>` +
        `<span class="abar"><i style="background:var(--${k}); width:${prevWidth[k] ?? 0}%"></i></span>` +
        `<span><b>${gotHrs}</b> / ${tot} hrs</span><span><b>${got.length}</b> of ${ids.length}</span></div>`;
    }).join('');
    // Animate bars from their previous width to the new one.
    requestAnimationFrame(() => {
      $('auditRows').querySelectorAll('.arow').forEach((row) => {
        const k = row.dataset.cat;
        // A course removed since this frame was queued is no longer in C.
        const ids = REQUIRED.filter((id) => C[id] && C[id].cat === k);
        const tot = sumHrs(ids), got = sumHrs(ids.filter((id) => S.done.has(id)));
        const w = tot ? (got / tot) * 100 : 0;
        row.querySelector('i').style.width = `${w}%`;
        prevWidth[k] = w;
      });
    });
  }
  const prevWidth = {};

  // ---------------------------------------------------------------- transcript import
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  function renderDock() {
    const t = S.transcript;
    const main = $('dockMain');
    if (!t) {
      main.innerHTML =
        `<div class="dock-icon">${ICON.doc}</div>` +
        `<div class="dock-text"><strong>Build your plan from a transcript</strong>` +
        `<span>Upload your UT transcript (PDF or text). It is read on this device and never uploaded.</span></div>` +
        `<div class="dock-actions"><button class="btn primary" id="dockUpload">${ICON.upload}Upload transcript</button>` +
        `<button class="btn ghost" id="dockPaste">Paste text</button></div>`;
    } else {
      const n = (st) => t.report.filter((x) => x.status === st).length;
      main.innerHTML =
        `<div class="dock-icon done">${ICON.doc}</div>` +
        `<div class="dock-text"><strong>Built from ${esc(t.name)}</strong>` +
        `<span>${n('applied')} applied, ${n('credit')} AP credit, ${n('progress')} in progress, ${n('ignored')} not applicable</span></div>` +
        `<div class="dock-actions"><button class="btn" id="dockDetails">View details</button>` +
        `<button class="btn" id="dockUpload">${ICON.upload}Upload another</button>` +
        `<button class="btn ghost" id="dockRevert">Revert to suggested</button></div>`;
      $('dockDetails').addEventListener('click', showReport);
      $('dockRevert').addEventListener('click', confirmReset);
    }
    $('dockUpload').addEventListener('click', () => $('transcriptFile').click());
    if ($('dockPaste')) $('dockPaste').addEventListener('click', showPaste);
  }

  $('transcriptFile').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (file) await importFile(file);
  });
  // Dropping a file anywhere on the dock imports it too.
  $('dock').addEventListener('dragover', (ev) => { ev.preventDefault(); $('dock').classList.add('drop'); });
  $('dock').addEventListener('dragleave', () => $('dock').classList.remove('drop'));
  $('dock').addEventListener('drop', async (ev) => {
    ev.preventDefault(); $('dock').classList.remove('drop');
    const file = ev.dataTransfer.files[0];
    if (file) await importFile(file);
  });

  async function importFile(file) {
    $('dock').classList.add('busy');
    try {
      const text = await window.Transcript.extractText(file);
      importText(text, file.name);
    } catch (err) {
      openModal(`<h2 id="modalTitle">Could not read that file</h2><p class="m-sub">${esc(err.message || err)}</p>`);
    } finally {
      $('dock').classList.remove('busy');
    }
  }

  function importText(text, name) {
    const courses = window.Transcript.parse(text);
    if (!courses.length) {
      openModal(`<h2 id="modalTitle">No courses found</h2><p class="m-sub">FourSight could not find any course lines (like "CH 302 ... 3.00 A") in ${esc(name)}. ` +
        `If this is a scanned PDF, try copying the text from your transcript and using Paste text.</p>`);
      return;
    }
    applyCourses({ custom: S.custom }); // the transcript is matched against the full catalog
    const r = window.Transcript.build(courses);
    const before = snapshot();
    for (const id of S.fromTranscript) S.done.delete(id);
    const oldPlan = S.plan;
    S.terms = r.terms; S.plan = r.plan;
    keepCustom(oldPlan);
    for (const id of r.done) S.done.add(id);
    S.fromTranscript = new Set(r.done);
    S.credit = r.credit; S.taken = r.taken; S.prior = r.prior;
    S.transcript = { name, report: r.report, scheduled: r.scheduled };
    S.selected = null; closeDrawer();
    rebuild(before, 700);
    renderDock();
    scroller.target = 0;
    showReport();
  }

  // Transcripts are often all caps; keep roman numerals and short acronyms as they are.
  const titleCase = (t) => String(t || '').toLowerCase().replace(/\b([a-z])([a-z']*)/g, (w, a, b) => {
    const up = w.toUpperCase();
    if (/^(I|II|III|IV|CHE|US|UT|AP|DNA)$/.test(up)) return up;
    if (/^(and|of|for|to|in|the|w|with|a)$/.test(w)) return w;
    return a.toUpperCase() + b;
  }).replace(/^./, (ch) => ch.toUpperCase());

  function showPaste() {
    openModal(
      `<h2 id="modalTitle">Paste your transcript</h2>` +
      `<p class="m-sub">Copy the course list from your transcript and paste it below. Each course line should include the course number and grade.</p>` +
      `<textarea id="pasteBox" spellcheck="false" placeholder="FALL 2025\nCH 302   PRINCIPLES OF CHEMISTRY II   3.00   A\nM 408D   SEQUENCES, SERIES, MULTIVAR CALC   4.00   B"></textarea>` +
      `<div class="m-actions"><button class="btn ghost" id="pasteCancel">Cancel</button><button class="btn primary" id="pasteGo">Build my plan</button></div>`);
    $('pasteBox').focus();
    $('pasteCancel').addEventListener('click', closeModal);
    $('pasteGo').addEventListener('click', () => {
      const text = $('pasteBox').value;
      if (!text.trim()) return;
      closeModal();
      importText(text, 'pasted transcript');
    });
  }

  const STATUS = {
    applied: ['Applied', 'Counted toward your degree and marked complete'],
    credit: ['AP credit (CR)', 'Credit by exam, shown in the AP / Credit by Exam column'],
    progress: ['In progress', 'Placed in its term, not yet marked complete'],
    notpassed: ['Not completed', 'Grade does not complete the requirement, so it is scheduled again'],
    duplicate: ['Repeat', 'Requirement was already complete'],
    ignored: ['Not applicable', 'Does not count toward this degree plan, left out of the flowchart'],
  };
  function showReport() {
    const t = S.transcript;
    if (!t) return;
    const groups = ['credit', 'applied', 'progress', 'notpassed', 'duplicate', 'ignored']
      .map((st) => [st, t.report.filter((x) => x.status === st)]).filter(([, rows]) => rows.length);
    const PILL = { applied: 'applied', credit: 'AP credit', progress: 'in progress', notpassed: 'not completed', duplicate: 'repeat', ignored: 'not applicable' };
    const counts = groups.map(([st, rows]) => `<span class="m-pill ${st}">${rows.length} ${PILL[st]}</span>`).join('');
    openModal(
      `<h2 id="modalTitle">Plan built from ${esc(t.name)}</h2>` +
      `<p class="m-sub">Only courses that apply to the ${esc(programName())} curriculum were added to your flowchart. ` +
      `${t.scheduled} remaining courses were scheduled into future terms in the department's suggested order, with every prerequisite respected.</p>` +
      `<div class="m-pills">${counts}</div>` +
      groups.map(([st, rows]) =>
        `<section class="m-group ${st}"><h3>${STATUS[st][0]}<small>${STATUS[st][1]}</small></h3><table>` +
        rows.map((x) => `<tr><td class="c">${esc(x.code)}</td><td class="t">${esc(titleCase(x.title))}</td><td class="when">${esc(x.term)}</td><td class="g">${esc(x.grade)}</td>` +
          `<td class="s">${x.slot && C[x.slot] && C[x.slot].code !== x.code ? `as ${esc(C[x.slot].code)}` : esc(x.status === 'ignored' || x.status === 'credit' ? (x.note && !x.slot ? x.note : '') : '')}</td></tr>`).join('') +
        `</table></section>`).join('') +
      `<div class="m-actions"><button class="btn ghost" id="mRevert">Revert to suggested plan</button><button class="btn primary" id="mDone">View my flowchart</button></div>`);
    $('mDone').addEventListener('click', closeModal);
    $('mRevert').addEventListener('click', confirmReset);
  }

  function openModal(html) {
    $('modalBody').innerHTML = html;
    $('modal').hidden = false;
    requestAnimationFrame(() => $('modal').classList.add('open'));
  }
  function closeModal() {
    $('modal').classList.remove('open');
    setTimeout(() => { if (!$('modal').classList.contains('open')) $('modal').hidden = true; }, 250);
  }
  $('modalClose').addEventListener('click', closeModal);
  $('modal').addEventListener('click', (ev) => { if (ev.target === $('modal')) closeModal(); });
  window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !$('modal').hidden) closeModal(); });

  // ---------------------------------------------------------------- minimize panels
  // Collapses the toolbar, audit and semester bar so only the flowchart shows.
  function setPanels(collapsed, animate = true) {
    const app = $('app');
    app.classList.toggle('no-anim', !animate);
    app.classList.toggle('panels-collapsed', collapsed);
    // Center right away when minimizing; when expanding, keep centering until the panels finish
    // opening so the chart glides up instead of jumping.
    if (collapsed || !animate) app.classList.toggle('center-chart', collapsed);
    followLayout(animate ? 650 : 0);
    if (!collapsed && animate) {
      // Fallback in case transitionend never fires (for example with reduced motion).
      setTimeout(() => {
        if ($('app').classList.contains('panels-collapsed')) return;
        $('app').classList.remove('center-chart'); drawLines();
      }, 700);
    }
    $('panelToggle').setAttribute('aria-expanded', !collapsed);
    $('panelToggle').title = collapsed ? 'Show the toolbar and degree audit' : 'Hide everything but the flowchart';
    updatePanelToggle();
    try { localStorage.setItem('dp.panels', collapsed ? 'min' : 'open'); } catch (_) { /* ignore */ }
    if (!animate) requestAnimationFrame(() => app.classList.remove('no-anim'));
  }
  function updatePanelToggle() {
    const collapsed = $('app').classList.contains('panels-collapsed');
    $('panelToggleText').textContent = collapsed ? `Show audit: ${$('auditPct').textContent}` : 'Minimize';
  }
  $('panelToggle').addEventListener('click', () => setPanels(!$('app').classList.contains('panels-collapsed')));
  $('panels').addEventListener('transitionend', (ev) => {
    if (ev.target !== $('panels')) return;
    if (!$('app').classList.contains('panels-collapsed')) $('app').classList.remove('center-chart');
    drawLines(); updateSemnav(); loop.kick();
  });
  // Redraw lines every frame while the chart is moving with the panels.
  function followLayout(ms) {
    const end = performance.now() + ms;
    const step = (now) => {
      if (!S.plan) return;
      drawLines(); updateSemnav();
      if (now < end) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  try { setPanels(localStorage.getItem('dp.panels') === 'min', false); } catch (_) { /* ignore */ }

  // ---------------------------------------------------------------- programs
  const programName = (p = P) => (p.concentration ? `${p.name}: ${p.concentration}` : p.name);

  // Options follow FS.order; ECE's concentrations share an option group.
  $('programSelect').innerHTML = window.FS.order.map((o) => (o.group
    ? `<optgroup label="${o.group}">${o.ids.map((id) => `<option value="${id}">ECE: ${FSP[id].concentration}</option>`).join('')}</optgroup>`
    : `<option value="${o.id}">${FSP[o.id].name}</option>`)).join('');
  $('programSelect').addEventListener('change', (ev) => selectProgram(ev.target.value));

  function selectProgram(id) {
    P = FSP[id] || FSP.che;
    CATS = Object.fromEntries(Object.entries(P.categories).map(([k, label]) => [k, { label }]));
    BASE = withOnTimeLimits(window.FS.clone(P.courses), defaultTerms().filter(isRegular).length);
    window.FS_PROGRAM = P; // transcript.js matches against the selected program
    S.catFocus = null;
    try { localStorage.setItem('dp.program', P.id); } catch (_) { /* ignore */ }
    $('programSelect').value = P.id;
    $('brandDept').textContent = P.dept;
    $('brandMeta').textContent = `${P.degree}, 2026-28 catalog: ${P.hours} hours`;
    loadPlan();
    buildLegend();
  }

  // Program notes: critical path, rules and caveats from the catalog review, plus source links.
  $('programInfo').addEventListener('click', () => {
    openModal(`<h2 id="modalTitle">${esc(programName())}</h2>` +
      `<p class="m-sub">${esc(P.degree)}, ${esc(P.dept)}. ${P.hours} hours under the 2026-28 catalog.</p>` +
      `<ul class="pn-notes">${(P.notes || []).map((n) => `<li>${esc(n)}</li>`).join('')}` +
      `<li>Prerequisites come from the 2025-26 course listings, because the 2026-27 listings leave prerequisite text out. ` +
      `Students may follow any catalog in effect while they were enrolled in Cockrell. Confirm your plan with the Interactive Degree Audit and your department's advising office.</li>` +
      `<li>FourSight is an independent student planning tool. It is not affiliated with or endorsed by The University of Texas at Austin, and it is not an official degree audit.</li></ul>` +
      `<h3 class="pn-h">Sources</h3><ul class="pn-links">${(P.links || []).map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>`);
  });

  // ---------------------------------------------------------------- boot
  let startProgram = 'che';
  try { startProgram = localStorage.getItem('dp.program') || 'che'; } catch (_) { /* ignore */ }
  selectProgram(startProgram);

  // Debug handle for testing.
  window.__dp = { importText, revertToSuggested, S, analyze, EDGES, ALL_EDGES, edgeBroken, rectOf, scroller, toggleDone, addSummer, addRegular, removeTerm, lateFrom };
})();
