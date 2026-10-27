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
    palette: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1-1.6-1-2.7 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/></svg>',
    minor: '<svg viewBox="0 0 24 24"><path d="M4 19.5V6a2 2 0 0 1 2-2h12v13H6a2 2 0 0 0-2 2.5Z"/><path d="M4 19.5A2 2 0 0 0 6 21.5h12V17"/><path d="M9 8h5"/></svg>',
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
    minor: null,           // the minor this plan includes: { id, name, shortName, totalHours } (see minors section)
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
    for (const [id, c] of Object.entries(custom)) {
      C[id] = { ...c, custom: true };
      if (c.catalogCode) C[id].code = c.code.replace(/\.\d+$/, '');
      Object.assign(OUTSIDE, c.refNames || {});
    }
    // Minor cards keep only prerequisites inside the plan or inside the minor (see translatePrereq); this also
    // trims cards saved before that rule.
    for (const c of Object.values(C)) {
      if (!c.custom || !c.minor) continue;
      const keep = new Set(c.keepRefs || []);
      const ok = (p) => (Array.isArray(p) ? p : [p]).some((o) => C[o] || keep.has(o));
      c.pre = (c.pre || []).filter(ok);
      c.co = (c.co || []).filter(ok);
    }
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
  const KIND = { fall: 'Fall', winter: 'Winter', spring: 'Spring', summer: 'Summer' };
  const termName = (t) => (t.kind === 'credit' ? 'AP / Credit by Exam' : `${KIND[t.kind]} ${t.year}`);
  // Winter terms come from quarter-system curricula (fall, winter, spring); they count like falls and springs.
  const isRegular = (t) => t.kind === 'fall' || t.kind === 'spring' || t.kind === 'winter';
  // The regular term after `last`: fall -> spring -> next fall, or fall -> winter -> spring on quarters.
  const regularAfter = (last, quarters) => (last.kind === 'fall' ? { kind: quarters ? 'winter' : 'spring', year: last.year }
    : last.kind === 'winter' ? { kind: 'spring', year: last.year } : { kind: 'fall', year: last.year + 1 });
  const nameAt = (i) => (S.terms[i] ? termName(S.terms[i]) : '');
  // A program's suggested terms: eight falls and springs unless it plans a summer (Geosystems).
  function defaultTerms() {
    if (P.terms) return P.terms.map((t) => ({ ...t }));
    const t = [];
    for (let y = 1; y <= 4; y++) t.push({ kind: 'fall', year: y }, { kind: 'spring', year: y });
    return t;
  }
  // "latest" in the data counts only the eight standard fall/spring terms (0 = Fall 1).
  const latestName = (n) => {
    const regs = defaultTerms().filter(isRegular);
    return regs[n] ? termName(regs[n]) : `${n % 2 ? 'Spring' : 'Fall'} ${Math.floor(n / 2) + 1}`;
  };
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
      S.minor = (saved && saved.minor) || null;
      CATS = programCats();
      applyCourses(saved ? { custom: saved.custom || {}, edits: saved.edits || {}, removed: saved.removed || [] } : {});
      if (validState(saved)) {
        const upgraded = upgradeUntouchedPlan(saved);
        return {
          terms: saved.terms, plan: upgraded || saved.plan, done: new Set(saved.done || []), upgraded: !!upgraded,
          credit: new Set(saved.credit || []), taken: saved.taken || {}, prior: saved.prior || [],
          fromTranscript: new Set(saved.fromTranscript || []), transcript: saved.transcript || null,
        };
      }
    } catch (_) { /* storage unavailable */ }
    applyCourses({});
    return { terms: defaultTerms(), plan: clone(P.plan), done: new Set(), ...emptyTranscript() };
  }
  const emptyTranscript = () => ({ credit: new Set(), taken: {}, prior: [], fromTranscript: new Set(), transcript: null });

  // Suggested plans get rearranged now and then (on 2026-10-26 every plan but ChE was rebalanced to spread
  // engineering courses across the four years). A saved plan the student never rearranged still matches the
  // suggestion it started from; such a plan moves to the current suggestion, keeping check-offs and added courses.
  // A plan the student changed is left as it is.
  const planHash = (plan) => {
    let h = 5381;
    const str = JSON.stringify(plan);
    for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  };
  // Fingerprints of the suggested plans before the 2026-10-26 rebalance (saves from then have no "suggested" field).
  const EARLIER_SUGGESTIONS = {
    are: '1q4zh7u', ase: 'a5uw1v', bme: '6bx9gz', ce: '1lwxnui', coe: '1tgmopx', 'ece-cae': '1one70i', 'ece-dsip': 'aepg8i',
    'ece-sed': '1dwxxhj', 'ece-csp': '19ovd86', 'ece-eic': '6xbesh', 'ece-esre': 'vcjc9b', 'ece-fwem': '1v3rnnu',
    'ece-nano': '13jpa3q', eve: '22ryfx', ge: '15q9g19', me: '1l2zb79', pe: 'sqz7m1',
  };
  function upgradeUntouchedPlan(saved) {
    const current = planHash(P.plan);
    if (JSON.stringify(saved.terms) !== JSON.stringify(defaultTerms())) return null; // terms were added or removed
    const own = new Set(Object.keys(saved.custom || {}));
    const core = saved.plan.map((sem) => sem.filter((id) => !own.has(id)));
    const h = planHash(core);
    if (h === current) return null;
    if (h !== saved.suggested && h !== EARLIER_SUGGESTIONS[P.id]) return null; // the student rearranged it
    const plan = clone(P.plan);
    saved.plan.forEach((sem, i) => sem.forEach((id) => { if (own.has(id)) plan[Math.min(i, plan.length - 1)].push(id); }));
    return plan;
  }

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
        minor: S.minor, suggested: planHash(P.plan),
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
    // missing: minor courses whose catalog prerequisites are not in the plan at all (id -> readable names).
    const missing = new Map();
    plan.forEach((sem) => sem.forEach((id) => {
      const c = C[id];
      if (!c || !c.refNames || S.done.has(id)) return;
      const lacks = [];
      for (const p of [...(c.pre || []), ...(c.co || [])]) {
        const opts = Array.isArray(p) ? p : [p];
        if (opts.some((o) => C[o])) continue;
        const named = opts.filter((o) => c.refNames[o]);
        if (named.length) lacks.push(named.map((o) => c.refNames[o]).join(' or '));
      }
      if (lacks.length) missing.set(id, lacks);
    }));
    plan.forEach((sem, i) => sem.forEach((id) => {
      if (i >= lateFrom(C[id].latest)) late.add(id);
      const t = S.terms[i];
      if (C[id].offered && t && t.kind !== 'credit' && t.kind !== C[id].offered && !S.done.has(id)) offTerm.add(id);
    }));
    return { broken, badCourses, late, offTerm, missing };
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
    if (st.upgraded) {
      save();
      toast(`Your ${esc(programName())} plan now uses the updated suggested arrangement, with engineering courses spread across all four years. Your check-offs and added courses are kept.`);
    }
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
        `<div class="td-menu" id="tdMenu" role="listbox">${items.join('')}` +
          `<button class="td-colors" id="tdColors">${ICON.palette}Customize colors</button></div>` +
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
    $('tdColors').addEventListener('click', () => { setOpen(false); showColors(); });
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
        `<span class="col-hours"></span><button class="term-check" aria-pressed="false">${ICON.tick}</button>` +
        `${removable ? `<button class="term-remove" title="Remove term" aria-label="Remove ${termName(t)}">${ICON.close}</button>` : ''}</div>` +
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
      col.querySelector('.term-check').addEventListener('click', () => toggleTerm(i));
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
      el.className = 'card' + (c.optional ? ' optional' : '') + (!c.title && !S.taken[id] ? ' nameonly' : '') + (S.credit.has(id) ? ' cr' : '');
      el.dataset.id = id;
      el.dataset.cat = c.cat;
      el.innerHTML =
        `<div class="row"><span class="code">${esc(c.code)}${c.optional ? '<span class="opt">Optional</span>' : ''}</span>` +
        `<span class="right"><button class="pin" aria-label="Pin ${c.code} chain">${ICON.pin}</button><span class="hrs">${c.hrs} hr</span><button class="check" aria-label="Mark ${c.code} complete">${ICON.tick}</button></span></div>` +
        `<div class="title">${esc(S.taken[id] ? `Taken as ${S.taken[id]}` : c.title)}</div><span class="flag">${ICON.alert}</span>`;
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
    const { broken, badCourses, late, offTerm, missing } = analyze(S.plan);
    // A pinned chain stays lit while swiping, ahead of whatever the pointer passes over.
    const focusId = S.pinned || S.hover || S.selected;
    // The whole chain stays highlighted; arrows show only one step each way from the course.
    const lit = focusId ? chainOf(focusId) : null;

    const cat = !lit && S.catFocus;
    for (const [id, el] of Object.entries(cardEl)) {
      el.classList.toggle('bad', badCourses.has(id));
      el.classList.toggle('late', late.has(id) || offTerm.has(id) || missing.has(id));
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
      const tc = colEl[i].querySelector('.term-check');
      const all = sem.length > 0 && sem.every((id) => S.done.has(id));
      tc.classList.toggle('on', all);
      tc.disabled = !sem.length;
      tc.setAttribute('aria-pressed', all);
      tc.title = tc.ariaLabel = all ? `Mark ${termName(S.terms[i])} not complete` : `Mark every course in ${termName(S.terms[i])} complete`;
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
    } else if (missing.size) {
      st.className = 'status bad';
      st.innerHTML = `${ICON.alert}${missing.size} course${missing.size === 1 ? '' : 's'} missing a prerequisite`;
    } else {
      st.className = 'status ok';
      st.innerHTML = `${ICON.ok}All prerequisites satisfied`;
    }
    if (!$('issues').hidden) renderIssues();
    renderAudit();
    renderMinorStrip();
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
      const text = pc ? `${pc.code}: ${pc.grade === 'CR' ? 'AP credit (CR)' : pc.grade ? `grade ${pc.grade}` : 'in progress'} on your transcript` : ((P.prior && P.prior[reqId]) || (OUTSIDE[reqId] && `${OUTSIDE[reqId]}: not in your plan`) || reqId);
      return `<li class="ext">${ICON.info}<span>${esc(text)}</span></li>`;
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
    const lacks = analyze(S.plan).missing.get(id);
    if (lacks) {
      alerts += `<div class="d-alert warn"><strong>Missing prerequisite.</strong> ${esc(lacks.join('; '))} ${lacks.length === 1 ? 'isn\'t' : 'aren\'t'} in your plan. ` +
        `Add ${lacks.length === 1 ? 'it' : 'them'} or confirm another way in (such as instructor consent).` +
        `${c.cat === 'minor' && c.catalogCode && S.minor ? ` <button class="d-remove" id="dAddPre">Add missing prerequisites</button>` : ''}</div>`;
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
    if (c.note) alerts += `<div class="d-alert note">${esc(c.note)}</div>`;
    if (c.custom) alerts += `<div class="d-alert note">You added this course.</div>`;
    else if (S.edits[id]) alerts += `<div class="d-alert note">You edited this course. Reset to suggested restores the original.</div>`;

    $('drawerBody').innerHTML =
      `<div class="d-cat" style="color:var(--${c.cat}-ink)"><i style="background:var(--${c.cat})"></i>${CATS[c.cat].label}</div>` +
      `<div class="d-code">${esc(c.code)}</div><p class="d-title">${esc(c.title)}</p>` +
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
    if ($('dAddPre')) {
      $('dAddPre').addEventListener('click', () => loadMinors().then(() => {
        const code = C[id].catalogCode;
        addMinorCourses(prereqPlan(code).extra, code);
      }));
    }
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
    const { late, offTerm, missing } = analyze(S.plan);
    for (const id of late) {
      items.push(`<li class="warn"><button data-go="${id}"><b>${C[id].code}</b> is planned for ${nameAt(semOf(S.plan, id))}. Take it by ${latestName(C[id].latest)} to stay on a four-year track.</button></li>`);
    }
    for (const id of offTerm) {
      items.push(`<li class="warn"><button data-go="${id}"><b>${C[id].code}</b> is offered in the ${C[id].offered} only, but it is planned for ${nameAt(semOf(S.plan, id))}.</button></li>`);
    }
    for (const [id, lacks] of missing) {
      items.push(`<li class="warn"><button data-go="${id}"><b>${esc(C[id].code)}</b> needs ${esc(lacks.join('; '))}, which ${lacks.length === 1 ? 'isn\'t' : 'aren\'t'} in your plan.</button></li>`);
    }
    $('issuesList').innerHTML = items.join('') || '<li class="empty">No conflicts.</li>';
    $('issuesList').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => focusCourse(b.dataset.go, true)));
  }

  // ---------------------------------------------------------------- reset
  $('resetBtn').addEventListener('click', confirmReset);

  // Spell out what a reset undoes; completions and added courses are the student's choice.
  function confirmReset() {
    if (P.own && !P.def.source) return confirmClear();
    const marked = [...S.done].filter((id) => !S.fromTranscript.has(id) && !isMinorCard(id)).length;
    const added = Object.keys(S.custom).filter((id) => !isMinorCard(id)).length;
    const minorCards = Object.keys(S.custom).filter(isMinorCard).length;
    const keep = (id, text) => `<label class="rs-keep"><input type="checkbox" id="${id}" checked><span>${text}</span></label>`;
    openModal(`<h2 id="modalTitle">${P.own ? `Reset to ${esc(P.def.source)}?` : 'Reset to the suggested plan?'}</h2>` +
      `<p class="m-sub">Every course goes back to ${P.own ? 'the semester the file put it in' : 'its suggested semester'} and extra terms are removed. ` +
      `Edited and deleted courses are restored, and anything from an imported transcript is cleared.` +
      `${S.minor ? ` The ${esc(S.minor.name)}${minorCards ? ` and the ${minorCards} course${minorCards === 1 ? '' : 's'} added for it` : ''} ${minorCards ? 'are' : 'is'} removed.` : ''}</p>` +
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

  // A blank plan has nothing to go back to: clearing removes every course.
  function confirmClear() {
    const n = S.plan.flat().length;
    openModal(`<h2 id="modalTitle">Clear this plan?</h2>` +
      `<p class="m-sub">${n ? `All ${n} course${n === 1 ? '' : 's'} and any extra terms are removed${S.minor ? `, along with the ${esc(S.minor.name)}` : ''}. This can\u2019t be undone.` : 'Your plan is already empty.'}</p>` +
      `<div class="m-actions"><button class="btn ghost" id="rsCancel">Cancel</button>${n ? '<button class="btn danger" id="rsOk">Clear plan</button>' : ''}</div>`);
    $('rsCancel').addEventListener('click', closeModal);
    if (n) $('rsOk').addEventListener('click', () => { closeModal(); revertToSuggested({ keepDone: false, keepAdded: false }); });
  }

  // Courses added for the minor (current or saved before the minor flag existed).
  const isMinorCard = (id) => !!(S.custom[id] && (S.custom[id].minor || S.custom[id].cat === 'minor'));

  function revertToSuggested({ keepDone = true, keepAdded = true } = {}) {
    const before = snapshot();
    const oldPlan = S.plan;
    // The minor goes too: the suggested plan is the degree alone. Courses added by hand stay if asked.
    const hadMinor = !!S.minor;
    const custom = keepAdded ? Object.fromEntries(Object.entries(S.custom).filter(([id]) => !isMinorCard(id))) : {};
    S.minor = null;
    CATS = programCats();
    // Brings back deleted and edited catalog courses.
    applyCourses({ custom });
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
    if (hadMinor) buildLegend();
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
    return regularAfter(regs[regs.length - 1], S.terms.some((t) => t.kind === 'winter'));
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
  // UT course numbers start with the credit hours: CHE 379 is 3 hours, M 408D is 4. The add-course form uses this
  // only to suggest hours; any course number or name is accepted, so students at other schools can use it.
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
        ids.map((id) => `<label class="ac-chip" style="--c:var(--${C[id].cat}); --i:var(--${C[id].cat}-ink)"><input type="checkbox" name="${name}" value="${id}"${sel[name].includes(id) ? ' checked' : ''}><span>${C[id].code}</span></label>`).join('') +
        `</div></div>` : '';
    }).join('');
    const yesNo = (name, q, on) => `<div class="ac-q"><span>${q}</span><div class="ac-yn">` +
      `<label><input type="radio" name="${name}" value="no"${on ? '' : ' checked'}><span>No</span></label>` +
      `<label><input type="radio" name="${name}" value="yes"${on ? ' checked' : ''}><span>Yes</span></label></div></div>`;
    openModal(
      `<h2 id="modalTitle">${editing ? `Edit ${editing.code}` : `Add a course to ${nameAt(sem)}`}</h2>` +
      `<form class="ac-form" id="acForm" novalidate>` +
        `<label class="ac-field"><span>Degree requirement</span><select id="acCat">` +
          Object.entries(CATS).map(([k, v]) => `<option value="${k}"${editing && editing.cat === k ? ' selected' : ''}>${v.label}</option>`).join('') + `</select></label>` +
        `<div class="ac-row">` +
          `<label class="ac-field"><span>Course number</span><input id="acCode" placeholder="CHEM 1311" maxlength="40" autocomplete="off" value="${editing ? esc(editing.code) : ''}"></label>` +
          `<label class="ac-field grow"><span>Course name</span><input id="acTitle" placeholder="General Chemistry I" maxlength="80" autocomplete="off" value="${editing ? esc(editing.title) : ''}"></label>` +
          `<label class="ac-field ac-hrs"><span>Credit hours</span><input id="acHrs" type="number" inputmode="decimal" min="0" max="12" step="0.5" value="${editing ? editing.hrs : 3}"></label>` +
        `</div>` +
        `<p class="ac-hint" id="acHint">Use your school's course number and name, or just a name. The course number is optional.</p>` +
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
    const tidy = (t) => clean(t).replace(/\s+/g, ' ');
    const sync = () => {
      $('acPrePick').hidden = form.acHasPre.value !== 'yes';
      $('acCoPick').hidden = form.acHasCo.value !== 'yes';
      $('acPostPick').hidden = form.acHasPost.value !== 'yes';
    };
    sync();
    form.addEventListener('change', sync);
    // A UT-style number ("CHE 379") suggests its hours until the student sets the hours themselves.
    let hoursSet = !!editing;
    $('acHrs').addEventListener('input', () => { hoursSet = true; });
    $('acCode').addEventListener('input', () => {
      const pc = !hoursSet && parseCode($('acCode').value);
      if (pc) $('acHrs').value = pc.hrs;
    });
    $('acCancel').addEventListener('click', closeModal);
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const err = (msg) => { $('acError').textContent = msg; $('acError').hidden = false; };
      const number = tidy($('acCode').value), name = tidy($('acTitle').value);
      if (!number && !name) return err('Enter a course number or a course name.');
      const hrs = Number($('acHrs').value);
      if ($('acHrs').value === '' || !Number.isFinite(hrs) || hrs < 0 || hrs > 12) return err('Enter credit hours from 0 to 12.');
      // The card's bold line is the course number, or the name when there is no number.
      const code = number || name;
      if (number && Object.entries(C).some(([k, c]) => k !== editId && c.code.toUpperCase() === number.toUpperCase())) return err(`${number} is already in your plan.`);
      let id = editId;
      if (!id) {
        const base = `X_${code.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 24) || 'COURSE'}`;
        id = base;
        for (let n = 2; C[id]; n++) id = `${base}_${n}`;
      }
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
        code, hrs, cat: $('acCat').value,
        title: number ? name || (editing ? editing.title : 'Added course') : '',
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
  // The semester check: marks every course in a term complete, or, when they all are, clears them.
  function toggleTerm(i) {
    const sem = S.plan[i];
    if (!sem.length) return;
    const all = sem.every((id) => S.done.has(id));
    for (const id of sem) {
      const el = cardEl[id];
      if (all) { S.done.delete(id); continue; }
      if (S.done.has(id)) continue;
      S.done.add(id);
      el.classList.remove('just-done'); void el.offsetWidth; el.classList.add('just-done');
    }
    save();
    paint();
    if (S.selected) renderDrawer();
  }

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

  // Hours a minor adds to the degree: its total, less hours from degree-plan courses that also count toward it
  // (they are already in the degree's hours). Before the minor data loads, the full total is used.
  function minorHours() {
    if (!S.minor) return null;
    const cards = Object.keys(C).filter((id) => C[id].cat === 'minor');
    const cardsDone = cards.filter((id) => S.done.has(id));
    let total = S.minor.totalHours || 0, shared = 0, doneMinor = null;
    if (S.minor.own) {
      const ev = evaluateOwnMinor();
      shared = Math.min(total, ev.shared);
      doneMinor = ev.done;
    } else if (MN && MN.data.minors[S.minor.id]) {
      const ev = evaluateMinor();
      total = ev.minor.totalHours;
      for (const a of ev.planned.requirements.flatMap((r) => r.applied || [])) {
        const id = planIdFor(a.code);
        if (id && C[id].cat !== 'minor') shared += a.hours;
      }
      doneMinor = ev.done.hoursApplied;
    }
    const extra = Math.max(0, total - shared);
    const doneExtra = Math.min(extra, cardsDone.reduce((n, id) => n + C[id].hrs, 0));
    return { total, extra, doneExtra, doneMinor: doneMinor ?? doneExtra, cards: cards.length, cardsDone: cardsDone.length };
  }

  function renderAudit() {
    // Degree courses are counted course by course; a minor adds its own hours (see minorHours).
    const REQUIRED = Object.keys(C).filter((id) => !C[id].optional && C[id].cat !== 'minor');
    const mh = minorHours();
    const REQ_HOURS = REQUIRED.reduce((n, id) => n + C[id].hrs, 0) + (mh ? mh.extra : 0);
    const sumHrs = (ids) => ids.reduce((n, id) => n + C[id].hrs, 0);
    const doneReq = REQUIRED.filter((id) => S.done.has(id));
    const leftReq = REQUIRED.filter((id) => !S.done.has(id));
    const doneHrs = sumHrs(doneReq) + (mh ? mh.doneExtra : 0), leftHrs = REQ_HOURS - doneHrs;
    const frac = REQ_HOURS ? doneHrs / REQ_HOURS : 0;
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
    $('auditLeftSub').textContent = plural(leftReq.length, 'course') + (mh && mh.extra > mh.doneExtra ? ` + ${mh.extra - mh.doneExtra} minor hrs` : '');

    // Next term: the first term that still has an unchecked required course.
    const nextIdx = S.plan.findIndex((sem) => sem.some((id) => !C[id].optional && !S.done.has(id)));
    if (!REQUIRED.length) {
      $('auditNextTerm').textContent = nameAt(0);
      $('auditNextSub').textContent = 'Add courses to get started';
    } else if (nextIdx < 0) {
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

    // Own plans list only the course types they use.
    const shownCats = Object.entries(CATS).filter(([k]) => k !== 'minor' && (!P.own || REQUIRED.some((id) => C[id].cat === k)));
    $('auditRows').innerHTML = (P.own && !shownCats.length && !mh ? `<div class="arow empty" role="row"><span></span><span class="name">No courses yet. Use + Add course in any semester${P.def.source ? '' : ', or upload your curriculum below'}.</span></div>` : '') +
      shownCats.map(([k, v]) => {
      const ids = REQUIRED.filter((id) => C[id].cat === k);
      const got = ids.filter((id) => S.done.has(id));
      const tot = sumHrs(ids), gotHrs = sumHrs(got);
      return `<div class="arow${got.length === ids.length ? ' full' : ''}" data-cat="${k}" role="row">` +
        `<button class="sw" style="background:var(--${k})" title="Change color" aria-label="Change the ${v.label} color"></button><span class="name">${v.label}</span>` +
        `<span class="abar"><i style="background:var(--${k}); width:${prevWidth[k] ?? 0}%"></i></span>` +
        `<span><b>${gotHrs}</b> / ${tot} hrs</span><span><b>${got.length}</b> of ${ids.length}</span></div>`;
    }).join('') + (mh ? `<div class="arow${mh.doneMinor >= mh.total ? ' full' : ''}" data-cat="minor" data-w="${mh.total ? Math.min(100, (mh.doneMinor / mh.total) * 100) : 0}" role="row">` +
        `<button class="sw" style="background:var(--minor)" title="Change color" aria-label="Change the minor color"></button><span class="name">${esc(CATS.minor.label)}</span>` +
        `<span class="abar"><i style="background:var(--minor); width:${prevWidth.minor ?? 0}%"></i></span>` +
        `<span><b>${mh.doneMinor}</b> / ${mh.total} hrs</span><span><b>${mh.cardsDone}</b> of ${mh.cards}</span></div>` : '');
    // Animate bars from their previous width to the new one.
    requestAnimationFrame(() => {
      $('auditRows').querySelectorAll('.arow:not(.empty)').forEach((row) => {
        const k = row.dataset.cat;
        if (row.dataset.w != null) { row.querySelector('i').style.width = `${row.dataset.w}%`; prevWidth[k] = +row.dataset.w; return; }
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
    // Own plans fill from a curriculum file instead of a UT transcript.
    if (P.own) {
      const src = P.def.source;
      main.innerHTML =
        `<div class="dock-icon${src ? ' done' : ''}">${ICON.doc}</div>` +
        `<div class="dock-text"><strong>${src ? `Built from ${esc(src)}` : 'Fill this plan from your curriculum'}</strong>` +
        `<span>${src ? `${P.def.report.count} courses read from the file. Upload another file to replace them.` : 'Upload your degree plan or flowchart (PDF, text or CSV). It is read on this device and never uploaded.'}</span></div>` +
        `<div class="dock-actions">${src ? `<button class="btn" id="dockDetails">View details</button><button class="btn" id="dockFlow">${P.def.flowchart ? 'Add another flowchart' : 'Add prerequisite flowchart'}</button>` : ''}` +
        `<button class="btn${src ? '' : ' primary'}" id="dockUpload">${ICON.upload}${src ? 'Upload another' : 'Upload curriculum'}</button>` +
        `<button class="btn ghost" id="dockPaste">Paste text</button></div>`;
      if (src) $('dockDetails').addEventListener('click', showCurriculumReport);
      if (src) $('dockFlow').addEventListener('click', pickFlowchart);
      $('dockUpload').addEventListener('click', () => confirmReplaceOwn(() => pickCurriculum(P.id)));
      $('dockPaste').addEventListener('click', () => confirmReplaceOwn(() => showCurriculumPaste(P.id)));
      return;
    }
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
    if (file && P.own) confirmReplaceOwn(() => importCurriculum(file, P.id));
    else if (file) await importFile(file);
  });
  // A new curriculum file replaces an own plan's courses; ask first once it has any.
  function confirmReplaceOwn(then) {
    const n = S.plan.flat().length;
    if (!n) return then();
    openModal(`<h2 id="modalTitle">Replace this plan?</h2>` +
      `<p class="m-sub">The courses from the new file replace the ${n} course${n === 1 ? '' : 's'} in this plan, along with their check-offs.</p>` +
      `<div class="m-actions"><button class="btn ghost" id="roCancel">Cancel</button><button class="btn primary" id="roOk">Choose a file</button></div>`);
    $('roCancel').addEventListener('click', closeModal);
    $('roOk').addEventListener('click', () => { closeModal(); then(); });
  }

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
  const programName = (p = P) => (p.concentration ? `${p.name}: ${p.concentration}` : p.own ? (p.def.source ? p.name : 'own') : p.name);

  // ---- your own plans
  // Plans that are not a UT degree template: an empty plan, or one built from a curriculum file (curriculum.js).
  // Each is a program made on this device and saved under dp.own.<id>: 'mine-ut' for UT Austin students and
  // 'mine' for students anywhere else. Its courses are the file's courses (empty for a blank plan); the student's
  // changes are saved like any other plan's.
  const OWN_IDS = ['mine-ut', 'mine'];
  const OWN_CATS = { major: 'Major courses', stem: 'Math and science', core: 'General education', tech: 'Electives' };
  const ownKey = (id) => `dp.own.${id}`;
  const isOwnId = (id) => OWN_IDS.includes(id);

  // Terms through at least year 4, so a file covering two years still leaves room to plan the rest.
  function fullYears(terms, plan) {
    terms = (terms && terms.length ? terms : [{ kind: 'fall', year: 1 }]).map((t) => ({ ...t }));
    plan = terms.map((_, i) => ((plan && plan[i]) || []).slice());
    const quarters = terms.some((t) => t.kind === 'winter');
    while (terms.filter(isRegular).length < (quarters ? 12 : 8)) {
      const regs = terms.filter(isRegular);
      terms.push(regularAfter(regs[regs.length - 1], quarters));
      plan.push([]);
    }
    return { terms, plan };
  }
  function ownProgram(id, def = {}) {
    const { terms, plan } = fullYears(def.terms, def.plan);
    const standard = terms.length === 8 && terms.every((t, i) => t.kind === (i % 2 ? 'spring' : 'fall') && t.year === Math.floor(i / 2) + 1);
    const courses = def.courses || {};
    const ut = id === 'mine-ut';
    const r = def.report;
    return {
      id, own: true, ut, def,
      name: def.program || (def.source ? 'My plan' : 'Blank plan'),
      degree: def.source ? `Built from ${def.source}` : 'Your own courses',
      dept: def.school || (ut ? 'The University of Texas at Austin' : def.program || 'My degree plan'),
      hours: Object.values(courses).reduce((n, c) => n + c.hrs, 0),
      categories: { ...OWN_CATS },
      courses, plan, terms: standard ? undefined : terms,
      prior: def.prior || {}, pools: {}, links: [],
      notes: def.source ? [
        `Built from ${def.source}: ${r.count} course${r.count === 1 ? '' : 's'} in ${r.terms} term${r.terms === 1 ? '' : 's'}` +
          `${r.prereqs ? `, with ${r.prereqs} prerequisite link${r.prereqs === 1 ? '' : 's'}` : ''}.`,
        r.placedByOrder ? 'The file had no semester headings, so courses were spread across the semesters in the file’s order, each after its prerequisites.'
          : 'Courses are in the semesters the file lists them under.',
        ...(r.assumed ? [`${r.assumed} course${r.assumed === 1 ? '' : 's'} had no credit hours in the file and were given 3 hours.`] : []),
        'Course types (major, math and science, general education, electives) were guessed from course numbers and names. Click a course and choose Edit to change it.',
        ...(def.flowchart ? [`Prerequisite chains: ${def.flowchart.added} links from ${def.flowchart.source}.`] : []),
        'Reset to file puts every course back where the file had it.',
      ] : ['Add a course with the + button at the bottom of any semester. Give it a course number, a name or both, its credit hours, and any prerequisites in your plan.'],
    };
  }
  function loadOwn(id) {
    let def = null;
    try { def = JSON.parse(localStorage.getItem(ownKey(id)) || 'null'); } catch (_) { /* ignore */ }
    return (FSP[id] = ownProgram(id, def || {}));
  }
  // Starts a new own plan, replacing the saved one and its progress.
  function startOwn(id, def) {
    try {
      localStorage.setItem(ownKey(id), JSON.stringify(def));
      localStorage.removeItem(`dp.plan.${id}`);
    } catch (_) { /* storage unavailable: the plan still works until the page closes */ }
    FSP[id] = ownProgram(id, def);
    selectProgram(id);
  }
  // Courses in a saved own plan (for "you already have a plan" checks).
  function ownCourseCount(id) {
    try {
      const saved = JSON.parse(localStorage.getItem(`dp.plan.${id}`) || 'null');
      const def = JSON.parse(localStorage.getItem(ownKey(id)) || 'null');
      if (saved && saved.plan) return saved.plan.flat().length;
      return def && def.courses ? Object.keys(def.courses).length : 0;
    } catch (_) { return 0; }
  }

  // Options follow FS.order; ECE's concentrations share an option group. UT students can also keep their own plan.
  function fillProgramSelect() {
    $('programSelect').innerHTML = window.FS.order.map((o) => (o.group
      ? `<optgroup label="${o.group}">${o.ids.map((id) => `<option value="${id}">ECE: ${FSP[id].concentration}</option>`).join('')}</optgroup>`
      : `<option value="${o.id}">${FSP[o.id].name}</option>`)).join('') +
      `<optgroup label="Your own plan"><option value="mine-ut">${FSP['mine-ut'] && FSP['mine-ut'].def.source ? esc(`Built from ${FSP['mine-ut'].def.source}`) : 'Your own courses (no template)'}</option></optgroup>`;
    if (P) $('programSelect').value = P.id;
  }
  $('programSelect').addEventListener('change', (ev) => selectProgram(ev.target.value));

  function selectProgram(id, { remember = true } = {}) {
    P = isOwnId(id) ? (FSP[id] || loadOwn(id)) : (FSP[id] || FSP.che);
    S.minor = null; // each program saves its own minor; loadPlan reads it
    CATS = programCats();
    BASE = withOnTimeLimits(window.FS.clone(P.courses), defaultTerms().filter(isRegular).length);
    window.FS_PROGRAM = P; // transcript.js matches against the selected program
    S.catFocus = null;
    applyColors();
    try { if (remember) localStorage.setItem('dp.program', P.id); } catch (_) { /* ignore */ }
    fillProgramSelect();
    // A plan from outside UT has no UT degree plans or minors to offer.
    $('programSelect').closest('.program-picker').hidden = P.own && !P.ut;
    $('minorBtn').hidden = false; // UT plans pick from UT's minors; other schools upload their minor's requirements
    $('resetLabel').textContent = !P.own ? 'Reset to suggested' : P.def.source ? 'Reset to file' : 'Clear plan';
    $('brandDept').textContent = P.own && !P.ut ? P.dept : P.own ? 'The University of Texas at Austin' : P.dept;
    $('brandMeta').textContent = P.own ? (P.def.source && P.def.program && P.def.school ? `${P.def.program}, from ${P.def.source}` : P.degree) : `${P.degree}, 2026-28 catalog: ${P.hours} hours`;
    loadPlan();
    buildLegend();
  }

  // Program notes: critical path, rules and caveats from the catalog review, plus source links.
  $('programInfo').addEventListener('click', () => {
    if (P.own) {
      openModal(`<h2 id="modalTitle">${esc(P.def.source ? P.name : 'Your own plan')}</h2>` +
        `<p class="m-sub">${esc(P.own && P.def.school ? `${P.def.school}. ` : '')}${esc(P.degree)}.</p>` +
        `<ul class="pn-notes">${P.notes.map((n) => `<li>${esc(n)}</li>`).join('')}` +
        `<li>FourSight is an independent student planning tool and not an official degree audit. Confirm your plan with your school's advising office.</li></ul>`);
      return;
    }
    openModal(`<h2 id="modalTitle">${esc(programName())}</h2>` +
      `<p class="m-sub">${esc(P.degree)}, ${esc(P.dept)}. ${P.hours} hours under the 2026-28 catalog.</p>` +
      `<ul class="pn-notes">${(P.notes || []).map((n) => `<li>${esc(n)}</li>`).join('')}` +
      `<li>Prerequisites come from the 2025-26 course listings, because the 2026-27 listings leave prerequisite text out. ` +
      `Students may follow any catalog in effect while they were enrolled in Cockrell. Confirm your plan with the Interactive Degree Audit and your department's advising office.</li>` +
      `<li>FourSight is an independent student planning tool. It is not affiliated with or endorsed by The University of Texas at Austin, and it is not an official degree audit.</li></ul>` +
      `<h3 class="pn-h">Sources</h3><ul class="pn-links">${(P.links || []).map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>`);
  });

  // ---------------------------------------------------------------- minors
  // UT Austin minors (data/minors.json: 45 minors and 701 courses with prerequisite trees, 2026-27 catalog) and
  // their evaluation engine (lib/foursight-minors.js) load the first time a minor is shown. A plan can include one
  // minor. Its courses become cards of the "minor" course type with their catalog prerequisites; courses already in
  // the degree plan count toward the minor wherever the minor accepts them.
  let MN = null, mnLoading = null;
  const OUTSIDE = {};   // ids of catalog prerequisites that are not in the plan -> readable name
  // Every FourSight program is in the Cockrell School, so prerequisites that differ by student group follow the
  // engineering branch.
  const ASSUME = { conditional: { 'engineering majors': true, others: true } };

  function loadMinors() {
    if (MN) return Promise.resolve(MN);
    if (!mnLoading) {
      mnLoading = Promise.all([
        fetch('data/minors.json').then((r) => { if (!r.ok) throw new Error(`Minor data did not load (${r.status}).`); return r.json(); }),
        import('./lib/foursight-minors.js'),
      ]).then(([data, FM]) => { MN = { data, FM, db: data.courses }; return MN; })
        .catch((err) => { mnLoading = null; throw err; });
    }
    return mnLoading;
  }

  function programCats() {
    const cats = Object.fromEntries(Object.entries(P.categories).map(([k, label]) => [k, { label }]));
    if (S.minor) cats.minor = { label: `Minor: ${S.minor.shortName}` };
    return cats;
  }

  let toastTimer = null;
  function toast(html) {
    let el = $('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = html;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
  }

  // ---- the plan as the engine sees it
  const REAL_CODE = /^[A-Z][A-Z ]{0,5}\d{3}[A-Z]{0,2}$/;
  // Catalog codes a card stands for: its transcript course, a minor card's exact catalog code, its own code, or the
  // options of an "X or Y" card.
  function codesOf(id) {
    const c = C[id];
    if (!c) return [];
    if (S.taken[id]) return [S.taken[id]];
    const out = [];
    if (c.catalogCode) out.push(c.catalogCode);
    if (REAL_CODE.test(c.code) && !out.includes(c.code)) out.push(c.code);
    for (const a of c.alias || []) if (!out.includes(a)) out.push(a);
    return out;
  }
  function studentFromPlan() {
    const grades = {};
    for (const r of (S.transcript && S.transcript.report) || []) if (['applied', 'credit'].includes(r.status) && r.grade) grades[r.code] = r.grade;
    const courses = [];
    let hoursCompleted = 0;
    S.plan.forEach((sem) => sem.forEach((id) => {
      const done = S.done.has(id);
      if (done) hoursCompleted += C[id].hrs;
      const code = codesOf(id)[0];
      if (!code) return;
      courses.push({ code, hours: C[id].hrs, status: done ? 'completed' : 'planned', grade: done ? grades[code] || null : null,
        basis: S.credit.has(id) ? 'credit-by-exam' : 'letter' });
    }));
    for (const pc of S.prior) if (pc.grade) courses.push({ code: pc.code, status: 'completed', grade: pc.grade, basis: pc.grade === 'CR' ? 'credit-by-exam' : 'letter' });
    const standing = hoursCompleted >= 90 ? 'senior' : hoursCompleted >= 60 ? 'junior' : hoursCompleted >= 30 ? 'sophomore' : 'freshman';
    return { courses, hoursCompleted, standing, major: P.name };
  }
  // For prerequisite planning, every course in the plan counts as passed: placement keeps them in order.
  const planAsPassed = () => S.plan.flat().flatMap((id) => codesOf(id).slice(0, 1)).map((code) => ({ code, grade: 'A', status: 'completed' }));

  function planIdFor(code) {
    const { FM, db } = MN;
    const want = FM.equivalentCodes(db, code);
    for (const id of Object.keys(C)) {
      for (const x of codesOf(id)) if (want.has(x) || want.has(FM.canonicalCode(db, x))) return id;
    }
    return null;
  }
  // Topic courses are listed as "MAN 372T.2" (topic 2). Students see the course number alone; the topic's title
  // names the course, and the full code stays on the card for matching.
  const displayCode = (code) => String(code).replace(/\.\d+$/, '');
  const minorCardId = (code) => `MN_${MN.FM.canonicalCode(MN.db, code).replace(/[\s.]+/g, '')}`;
  function courseRec(code) {
    const { FM, db } = MN;
    const { base, topic } = FM.splitTopic(FM.canonicalCode(db, code));
    const rec = db.courses[base];
    return rec ? { rec, base, topic, topicRec: topic && rec.topics ? rec.topics[topic] : null } : null;
  }
  const courseTitle = (code) => { const r = courseRec(code); return r ? (r.topicRec && r.topicRec.title) || r.rec.title : ''; };
  function courseHours(code) {
    const r = courseRec(code);
    if (r && r.rec.hoursMin != null && r.rec.hoursMin === r.rec.hoursMax) return r.rec.hoursMin;
    const m = /\s(\d)\d\d[A-Z]{0,2}/.exec(code); // UT numbering: first digit = credit hours
    return m && +m[1] ? +m[1] : (r && r.rec.hoursMin) || 3;
  }

  // A prerequisite tree as a sentence.
  function readable(t) {
    if (!t) return '';
    switch (t.type) {
      case 'course': return `${t.code}${t.minGrade ? ` (${t.minGrade} or better)` : ''}${t.concurrent ? ' (can be taken at the same time)' : ''}`;
      case 'req': return t.text;
      case 'and': return t.items.map((i) => (i.type === 'or' ? `(${readable(i)})` : readable(i))).join('; ');
      case 'or': return t.items.map((i) => (i.type === 'and' ? `(${readable(i)})` : readable(i))).join(' or ');
      case 'conditional': return t.branches.map((b) => `for ${b.when}: ${readable(b.req)}`).join('; ');
      default: return '';
    }
  }

  // Catalog prerequisite tree -> FourSight pre/co lists. Course codes map to plan cards when the plan has them, and
  // otherwise to the id the course's minor card would get (named in OUTSIDE until it is added). Conditions such as
  // standing or consent become notes.
  // Courses outside both the plan and the minor (like C S 429 for Longhorn Startup) are left out: the student is
  // planning the minor, not every catalog chain. They still appear in the card's catalog prerequisite text.
  function translatePrereq(tree) {
    const { FM, db } = MN;
    const pre = [], co = [], notes = [], names = {};
    const inScope = (code) => !!planIdFor(code) || inMinor(code);
    const passed = FM.makeContext(db, { courses: planAsPassed(), standing: 'senior', hoursCompleted: 999 }, { assume: ASSUME });
    // Every course the tree names gets a readable name, so a prerequisite that is (or later becomes) missing from
    // the plan can still be shown and flagged after a reload.
    const ref = (code) => {
      const id = planIdFor(code) || minorCardId(code);
      names[id] = `${displayCode(code)}${courseTitle(code) ? ` (${courseTitle(code)})` : ''}`;
      if (!C[id]) OUTSIDE[id] = names[id];
      return id;
    };
    const count = (t) => (t.type === 'course' ? 1 : t.items ? t.items.reduce((n, i) => n + count(i), 0) : 0);
    const walk = (t) => {
      if (!t) return;
      if (t.type === 'course') { if (inScope(t.code)) (t.concurrent ? co : pre).push(ref(t.code)); return; }
      if (t.type === 'and') { t.items.forEach(walk); return; }
      if (t.type === 'req') { notes.push(t.text); return; }
      if (t.type === 'conditional') {
        const b = t.branches.find((x) => ASSUME.conditional[x.when]);
        if (b) walk(b.req); else notes.push(readable(t));
        return;
      }
      if (t.type === 'or') {
        const simple = t.items.filter((i) => i.type === 'course');
        if (simple.length === t.items.length && simple.every((i) => !!i.concurrent === !!simple[0].concurrent)) {
          const ids = [...new Set(simple.filter((i) => inScope(i.code)).map((i) => ref(i.code)))];
          if (ids.length) (simple[0].concurrent ? co : pre).push(ids.length === 1 ? ids[0] : ids);
          return;
        }
        // Mixed alternatives: follow one the plan already meets, else the smallest one that names a course in the
        // plan or the minor (so "M E 340 or the equivalent" uses the plan's M E 340).
        const scoped = (i) => (i.type === 'course' ? (inScope(i.code) ? 1 : 0) : (i.items || []).reduce((n, x) => n + scoped(x), 0));
        const met = t.items.find((i) => FM.evaluatePrereq(i, passed).status === 'met');
        const pick = met || t.items.filter((i) => scoped(i) > 0).sort((a, b) => count(a) - count(b))[0] || null;
        if (pick) walk(pick);
      }
    };
    walk(tree);
    return { pre, co, notes, names };
  }

  // Every course the current minor names, by catalog code (with cross-listed equivalents).
  let minorSetCache = { id: null, set: null };
  function inMinor(code) {
    const { FM, db, data } = MN;
    if (!S.minor || !data.minors[S.minor.id]) return false;
    if (minorSetCache.id !== S.minor.id) {
      const set = new Set();
      const walk = (n) => {
        const add = (c) => FM.equivalentCodes(db, c).forEach((x) => set.add(FM.canonicalCode(db, x)));
        (n.oneOf || []).forEach(add);
        (n.options || []).forEach((o) => (o.courses || []).forEach(add));
        (n.areas || []).forEach((a) => a.options.forEach((o) => (o.courses || []).forEach(add)));
        (n.sequences || []).forEach((q) => q.requirements.forEach(walk));
        if (n.then) walk(n.then);
      };
      data.minors[S.minor.id].requirements.forEach(walk);
      minorSetCache = { id: S.minor.id, set };
    }
    return [...FM.equivalentCodes(db, code)].some((x) => minorSetCache.set.has(FM.canonicalCode(db, x)));
  }

  // Prerequisites of a minor course that are themselves courses in the minor and not yet in the plan, in the order
  // to take them (MAN 327 before MAN 327E). Where the catalog accepts one of several, an option already in the plan
  // means nothing is added; otherwise the first non-honors option in the minor is used.
  function minorPrereqs(code) {
    const { FM, db } = MN;
    const order = [], seen = new Set();
    const canon = (c) => FM.canonicalCode(db, c);
    const has = (c) => !!planIdFor(c) || seen.has(canon(c));
    const honors = (c) => /\d{3}[A-Z]?H$/.test(FM.splitTopic(canon(c)).base);
    const need = (c) => {
      if (!inMinor(c) || has(c)) return;
      seen.add(canon(c));
      visit(FM.prerequisiteTree(db, c));
      order.push(c);
    };
    const visit = (t) => {
      if (!t) return;
      if (t.type === 'course') { need(t.code); return; }
      if (t.type === 'and') { t.items.forEach(visit); return; }
      if (t.type === 'conditional') { const b = t.branches.find((x) => ASSUME.conditional[x.when]); if (b) visit(b.req); return; }
      if (t.type === 'or') {
        if (t.items.some((i) => i.type === 'course' && has(i.code))) return;
        const opt = t.items.filter((i) => i.type === 'course' && inMinor(i.code)).sort((a, b) => honors(a.code) - honors(b.code))[0];
        if (opt) need(opt.code);
      }
    };
    visit(FM.prerequisiteTree(db, code));
    return order.filter((c) => canon(c) !== canon(code));
  }

  // ---- placement
  const NUMBER_WORDS = { six: 6, nine: 9, twelve: 12, fifteen: 15, eighteen: 18, thirty: 30, 'forty-five': 45, sixty: 60, ninety: 90 };
  // Hours a condition needs: standing (30/60/90 hours) or "N semester hours of coursework".
  function hoursForCondition(text) {
    const t = text.toLowerCase();
    if (/upper[- ]division standing|junior standing/.test(t)) return 60;
    if (/senior standing/.test(t)) return 90;
    if (/sophomore standing/.test(t)) return 30;
    const m = /([a-z]+(?:-[a-z]+)?|\d+) semester (?:credit )?hours of (?:college |undergraduate )?(?:coursework|credit)/.exec(t);
    if (m) return /^\d+$/.test(m[1]) ? +m[1] : NUMBER_WORDS[m[1]] || 0;
    return 0;
  }
  // Earliest term a new card can go in: after its prerequisites, with its co-requisites or later, once the plan
  // has the hours its standing needs, and not before the first term the student is still working on.
  function earliestTerm(req, placed, placedLoad) {
    const semAt = (id) => (placed.has(id) ? placed.get(id) : semOf(S.plan, id));
    const firstOpen = S.plan.findIndex((sem) => sem.some((id) => !S.done.has(id)));
    let min = firstOpen < 0 ? S.plan.length - 1 : firstOpen;
    const after = (list, step) => {
      for (const p of list) {
        const sems = (Array.isArray(p) ? p : [p]).map(semAt).filter((s) => s >= 0);
        if (sems.length) min = Math.max(min, Math.min(...sems) + step);
      }
    };
    after(req.pre, 1);
    after(req.co, 0);
    // Upper-division courses wait for sophomore standing (30 hours) even when the catalog asks only for consent.
    const need = req.notes.reduce((n, text) => Math.max(n, hoursForCondition(text)), req.upper ? 30 : 0);
    if (need) {
      let total = 0, i = 0;
      while (i < S.plan.length && total < need) { total += hours(S.plan[i]) + (placedLoad[i] || 0); i++; }
      min = Math.max(min, i);
    }
    return min;
  }
  function chooseTerm(min, hrs, placedLoad) {
    const load = (i) => hours(S.plan[i]) + (placedLoad[i] || 0);
    for (let i = Math.max(0, min); i < S.terms.length; i++) if (isRegular(S.terms[i]) && load(i) + hrs <= 18) return i;
    // Every allowed term would go over 18 hours: use the lightest (the earliest of equals).
    let best = -1;
    for (let i = Math.max(0, min); i < S.terms.length; i++) if (isRegular(S.terms[i]) && (best < 0 || load(i) < load(best))) best = i;
    return best >= 0 ? best : S.terms.length - 1;
  }

  // Prerequisites to add with a minor course: only those that are part of the minor (see minorPrereqs).
  const prereqPlan = (code) => ({ extra: minorPrereqs(code) });

  // The card for one catalog course. It keeps the number the student picked (CH 401 stays CH 401, with its own
  // hours) and takes title and prerequisites from the catalog record that number belongs to.
  function makeMinorCard(code, forCode) {
    const { FM, db } = MN;
    const r = courseRec(code);
    const { pre, co, notes, names } = translatePrereq(FM.prerequisiteTree(db, code));
    const keepRefs = Object.keys(names);
    const prereqText = r ? [r.rec.prerequisiteText, r.topicRec && r.topicRec.additionalPrerequisiteText].filter(Boolean).join(' ') : '';
    const restrictions = r ? [r.rec.restrictions, r.topicRec && r.topicRec.restrictions].filter(Boolean).join(' ') : '';
    // Notes the catalog sentence already says are left out.
    const extra = notes.filter((n) => !prereqText.toLowerCase().includes(n.toLowerCase()));
    const upper = !!(r && r.rec.level === 'Upper Division');
    return {
      code: displayCode(code), catalogCode: code, title: courseTitle(code) || 'Minor course', hrs: courseHours(code), cat: 'minor', pre, co,
      refNames: names, keepRefs, reqNotes: notes, upper, minor: S.minor.id,
      note: `${forCode ? `Prerequisite for ${displayCode(forCode)}, in` : 'For'} the ${S.minor.name}. ` +
        `Catalog prerequisite: ${prereqText || 'none'}${restrictions ? ` Restrictions: ${restrictions}` : ''}` +
        `${extra.length ? ` Planning notes: ${extra.join('; ')}.` : ''}`,
    };
  }

  // Put minor courses in the plan, in order (prerequisites before the courses that need them), each in the earliest
  // term that works. `target` is the course the student asked for; if it is already a card and now gains its
  // prerequisites, it moves later when it sat before them.
  function addMinorCourses(codes, target) {
    const before = snapshot();
    const custom = { ...S.custom };
    const placed = new Map(), placedLoad = {}, added = [];
    for (const code of codes) {
      const id = minorCardId(code);
      if (custom[id] || planIdFor(code)) continue;
      const card = makeMinorCard(code, code === target ? null : target);
      const sem = chooseTerm(earliestTerm({ pre: card.pre, co: card.co, notes: card.reqNotes, upper: card.upper }, placed, placedLoad), card.hrs, placedLoad);
      placed.set(id, sem);
      placedLoad[sem] = (placedLoad[sem] || 0) + card.hrs;
      custom[id] = card;
      added.push({ id, sem, code });
    }
    let moved = null;
    const tid = minorCardId(target);
    if (custom[tid] && !placed.has(tid) && semOf(S.plan, tid) >= 0) {
      const c = custom[tid], cur = semOf(S.plan, tid);
      const min = earliestTerm({ pre: c.pre || [], co: c.co || [], notes: c.reqNotes || [], upper: c.upper }, placed, placedLoad);
      if (cur < min) {
        const sem = chooseTerm(min, c.hrs, placedLoad);
        S.plan[cur].splice(S.plan[cur].indexOf(tid), 1);
        S.plan[sem].push(tid);
        moved = sem;
      }
    }
    if (!added.length && moved == null) return;
    applyCourses({ custom, edits: S.edits, removed: S.removed });
    for (const a of added) S.plan[a.sem].push(a.id);
    rebuild(before);
    const main = added.find((a) => a.code === target);
    const pre = added.filter((a) => a.code !== target);
    const where = (a) => `<b>${esc(displayCode(a.code))}</b> (${esc(nameAt(a.sem))})`;
    const t = esc(displayCode(target));
    toast((main ? `Added <b>${t}</b> ${esc(courseTitle(target))} to ${esc(nameAt(main.sem))}` : `Added prerequisites for <b>${t}</b>`) +
      (pre.length ? `${main ? ', plus ' : ': '}${pre.map(where).join(', ')}${main ? `, which ${t} requires and which ${pre.length === 1 ? 'is' : 'are'} part of the minor` : ''}` : '') +
      `.${moved != null ? ` ${t} moved to ${esc(nameAt(moved))} to come after ${pre.length === 1 ? 'it' : 'them'}.` : ''}` +
      [...new Set(added.map((a) => a.sem).concat(moved != null ? [moved] : []))].filter((i) => hours(S.plan[i]) > 18)
        .map((i) => ` ${esc(nameAt(i))} now has ${hours(S.plan[i])} hours; you may want to move a course.`).join(''));
  }

  // What happens when a course is picked in the minor planner: it is added along with any prerequisites that are
  // part of the minor; prerequisites outside the minor are not added.
  // Take a course added for the minor back out of the plan. Other minor courses keep their link to it, so one that
  // needs it shows it as missing, and the arrow returns if it is added again. Undo puts it back where it was.
  function removeMinorCard(id) {
    const card = S.custom[id];
    if (!card) return;
    const before = snapshot();
    const sem = semOf(S.plan, id), wasDone = S.done.has(id);
    const custom = { ...S.custom };
    delete custom[id];
    if (sem >= 0) S.plan[sem].splice(S.plan[sem].indexOf(id), 1);
    S.done.delete(id);
    if (S.pinned === id) S.pinned = null;
    if (S.selected === id) closeDrawer();
    applyCourses({ custom, edits: S.edits, removed: S.removed });
    rebuild(before);
    toast(`Removed <b>${esc(displayCode(card.code))}</b> ${esc(card.title)} from ${esc(nameAt(sem))}. <button class="toast-undo" id="toastUndo">Undo</button>`);
    $('toastUndo').addEventListener('click', () => {
      if (S.custom[id]) return;
      const back = snapshot();
      applyCourses({ custom: { ...S.custom, [id]: card }, edits: S.edits, removed: S.removed });
      S.plan[Math.max(0, Math.min(sem, S.plan.length - 1))].push(id);
      if (wasDone) S.done.add(id);
      rebuild(back);
      $('toast').classList.remove('show');
      if ($('mnPlanner')) showMinorPlanner();
    });
  }

  function requestMinorCourse(code) {
    const existing = planIdFor(code);
    if (existing) { toast(`${esc(C[existing].code)} is already in your plan (${esc(nameAt(semOf(S.plan, existing)))}).`); showMinorPlanner(); return; }
    addMinorCourses([...minorPrereqs(code), code], code);
    showMinorPlanner();
  }

  // ---- eligibility for the selected program
  const normMajor = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\b(and|bs|majors?)\b/g, ' ').replace(/[^a-z]+/g, ' ').trim();
  function eligibilityFor(entry) {
    const me = normMajor(P.name), t = entry.openTo || '';
    // An own plan has no declared major, so major-specific minors need checking by the student.
    if (P.own && (entry.allowedMajors || /^([A-Z][A-Za-z ]+?) majors\b/.test(t))) return { ok: null, text: 'Check eligibility' };
    // One version of the minor per major ("Chemical Engineering majors (by application)").
    const own = /^([A-Z][A-Za-z ]+?) majors\b/.exec(t);
    if (own && entry.allowedMajors && entry.allowedMajors.some((m) => normMajor(m) === normMajor(own[1]))) {
      return normMajor(own[1]) === me ? { ok: true, text: `For ${P.name} majors` } : { ok: false, text: `For ${own[1]} majors` };
    }
    if (entry.allowedMajors) {
      return entry.allowedMajors.some((m) => normMajor(m) === me) ? { ok: true, text: 'Open to your major' } : { ok: false, text: `Not open to ${P.name}` };
    }
    if (/\(BBA\) students only|^Declared business majors/i.test(t)) return { ok: false, text: 'Business majors only' };
    if (/^Declared economics majors/i.test(t)) return { ok: false, text: 'Economics majors only' };
    if (/all undergraduates|any major|non-business|UT Austin undergraduates|non-geosciences|business and non-business/i.test(t)) return { ok: true, text: 'Open to your major' };
    return { ok: null, text: 'Check eligibility' };
  }
  const eligTag = (el) => `<span class="tagp ${el.ok === true ? 'ok' : el.ok === false ? 'no' : 'maybe'}">${esc(el.text)}</span>`;
  const safeUrl = (u) => (/^https:\/\/[^\s"<>]+$/.test(u || '') ? u : null);

  // ---- choosing a minor
  function showMinorPicker() {
    if (P.own && !P.ut) { showOwnMinorPicker(); return; } // other schools: the minor comes from a file
    openModal('<h2 id="modalTitle">Add a minor</h2><p class="m-sub">Loading minors…</p>');
    loadMinors().then(() => {
      const items = MN.data.index.map((e) => ({ e, el: eligibilityFor(e) }));
      openModal(`<h2 id="modalTitle">Add a minor</h2>` +
        `<p class="m-sub">${MN.data.index.length} UT Austin minors from the ${esc(MN.data.about.catalogYear || '2026-27')} catalog. Pick one to see its requirements and add its courses to your ${esc(programName())} plan.</p>` +
        `<input class="mp-search" id="mpSearch" type="search" placeholder="Search minors, like robotics or business" aria-label="Search minors">` +
        `<label class="mp-filter"><input type="checkbox" id="mpOpen" checked> Only show minors open to ${P.own ? 'your major' : `${esc(P.name)} majors`}</label>` +
        `<div id="mpList"></div>`);
      const draw = () => {
        const q = $('mpSearch').value.trim().toLowerCase(), onlyOpen = $('mpOpen').checked;
        const shown = items.filter(({ e, el }) => (!onlyOpen || el.ok !== false) && (!q || `${e.name} ${e.college}`.toLowerCase().includes(q)));
        const colleges = [...new Set(shown.map(({ e }) => e.college))];
        $('mpList').innerHTML = colleges.map((col) => `<section class="mp-group"><h3>${esc(col)}</h3>` +
          shown.filter(({ e }) => e.college === col).map(({ e, el }) => `<button class="mp-item" data-minor="${esc(e.id)}">` +
            `<span class="mp-name">${esc(e.name)}<small>${e.totalHours} hours · ${esc(e.openTo || '')}</small></span>` +
            `<span class="mp-tags">${eligTag(el)}${e.applicationRequired ? '<span class="tagp">Application required</span>' : ''}</span></button>`).join('') +
          `</section>`).join('') || `<p class="mp-empty">No minors match. ${onlyOpen ? 'Try unchecking “Only show minors open to your major”.' : ''}</p>`;
        $('mpList').querySelectorAll('[data-minor]').forEach((b) => b.addEventListener('click', () => chooseMinor(b.dataset.minor)));
      };
      $('mpSearch').addEventListener('input', draw);
      $('mpOpen').addEventListener('change', draw);
      draw();
      $('mpSearch').focus();
    }).catch((err) => openModal(`<h2 id="modalTitle">Minors unavailable</h2><p class="m-sub">${esc(err.message)}</p>`));
  }
  function chooseMinor(id) {
    const m = MN.data.minors[id];
    if (!m) return;
    S.minor = { id, name: m.name, shortName: m.shortName || m.name, totalHours: m.totalHours };
    CATS = programCats();
    save();
    buildLegend();
    paint();
    showMinorPlanner();
  }
  function removeMinor(dropCourses) {
    const before = snapshot();
    const custom = { ...S.custom };
    for (const [id, c] of Object.entries(custom)) {
      if (c.cat !== 'minor') continue;
      if (dropCourses) {
        delete custom[id];
        for (const sem of S.plan) { const i = sem.indexOf(id); if (i >= 0) sem.splice(i, 1); }
        S.done.delete(id);
        if (S.pinned === id) S.pinned = null;
      } else {
        custom[id] = { ...c, cat: P.categories.tech ? 'tech' : 'major' };
        delete custom[id].minor;
      }
    }
    S.minor = null;
    CATS = programCats();
    closeDrawer();
    applyCourses({ custom, edits: S.edits, removed: S.removed });
    rebuild(before);
    buildLegend();
  }
  function confirmRemoveMinor() {
    const n = Object.values(S.custom).filter((c) => c.cat === 'minor').length;
    openModal(`<h2 id="modalTitle">Remove the ${esc(S.minor.name)}?</h2>` +
      `<p class="m-sub">Courses from your degree plan stay where they are.</p>` +
      (n ? `<label class="rs-keep"><input type="checkbox" id="rmDrop" checked><span>Also remove the ${n} course${n === 1 ? '' : 's'} added for this minor</span></label>` : '') +
      `<div class="m-actions"><button class="btn ghost" id="rmCancel">Cancel</button><button class="btn danger" id="rmOk">Remove minor</button></div>`);
    $('rmCancel').addEventListener('click', showMinorPlanner);
    $('rmOk').addEventListener('click', () => { const drop = !$('rmDrop') || $('rmDrop').checked; closeModal(); removeMinor(drop); });
  }

  // ---- progress
  let minorCache = { key: '', value: null };
  function evaluateMinor() {
    const minor = MN.data.minors[S.minor.id];
    const key = JSON.stringify([S.minor.id, S.plan, [...S.done], S.taken, S.prior.length, Object.keys(S.custom)]);
    if (minorCache.key === key) return minorCache.value;
    const st = studentFromPlan();
    const done = MN.FM.evaluateMinor(minor, MN.db, st);
    const planned = MN.FM.evaluateMinor(minor, MN.db, st, { includePlanned: true });
    // University rule: at least 9 minor hours may not also count toward the major. Minor cards are the courses
    // outside the degree plan.
    let outside = 0;
    for (const a of planned.requirements.flatMap((r) => r.applied || [])) {
      const id = planIdFor(a.code);
      if (id && C[id].cat === 'minor') outside += a.hours;
    }
    minorCache = { key, value: { minor, done, planned, outside } };
    return minorCache.value;
  }

  function renderMinorStrip() {
    const btn = $('minorBtn'), strip = $('minorStrip');
    btn.classList.toggle('on', !!S.minor);
    btn.innerHTML = `${ICON.minor}<span>${S.minor ? `Minor: ${esc(S.minor.shortName)}` : 'Add a minor'}</span>`;
    strip.hidden = !S.minor;
    if (!S.minor) return;
    if (S.minor.own) {
      const ev = evaluateOwnMinor(), total = S.minor.totalHours || 1;
      const pct = (h) => Math.min(100, (h / total) * 100);
      const left = ev.groups.filter((x) => x.planned < x.g.hours).length;
      strip.innerHTML = `<div class="ms-label"><small>Minor</small><strong>${esc(S.minor.name)}</strong></div>` +
        `<div class="ms-bar"><div class="ms-track"><i class="planned" style="width:${pct(ev.planned)}%"></i><i class="done" style="width:${pct(ev.done)}%"></i></div>` +
        `<div class="ms-nums"><b>${ev.planned}</b> of ${total} hrs planned · <b>${ev.done}</b> completed · ` +
        `${left ? `${left} requirement${left === 1 ? '' : 's'} still open` : 'every requirement is planned'}</div></div>` +
        `<div class="ms-actions"><button class="btn" id="msOpen">Open minor planner</button></div>`;
      $('msOpen').addEventListener('click', showMinorPlanner);
      return;
    }
    if (!MN) {
      strip.innerHTML = `<div class="ms-label"><small>Minor</small><strong>${esc(S.minor.name)}</strong></div><div class="ms-nums">Loading requirements…</div>`;
      loadMinors().then(() => { if (S.minor) paint(); }).catch(() => {});
      return;
    }
    if (!MN.data.minors[S.minor.id]) { strip.innerHTML = `<div class="ms-nums">${esc(S.minor.name)} is not in the current minor data.</div>`; return; }
    const { minor, done, planned } = evaluateMinor();
    const total = minor.totalHours || S.minor.totalHours || 1;
    const pct = (h) => Math.min(100, (h / total) * 100);
    const left = planned.requirements.filter((r) => r.status !== 'complete' && r.status !== 'not-applicable').length;
    strip.innerHTML = `<div class="ms-label"><small>Minor</small><strong>${esc(minor.name)}</strong></div>` +
      `<div class="ms-bar"><div class="ms-track"><i class="planned" style="width:${pct(planned.hoursApplied)}%"></i><i class="done" style="width:${pct(done.hoursApplied)}%"></i></div>` +
      `<div class="ms-nums"><b>${Math.min(planned.hoursApplied, total)}</b> of ${total} hrs planned · <b>${done.hoursApplied}</b> completed · ` +
      `${left ? `${left} requirement${left === 1 ? '' : 's'} still open` : 'every requirement is planned'}</div></div>` +
      `<div class="ms-actions"><button class="btn" id="msOpen">Open minor planner</button></div>`;
    $('msOpen').addEventListener('click', showMinorPlanner);
  }
  $('minorBtn').addEventListener('click', () => (S.minor ? showMinorPlanner() : showMinorPicker()));

  // ---- the minor planner
  function showMinorPlanner() {
    if (!S.minor) { showMinorPicker(); return; }
    if (S.minor.own) { showOwnMinorPlanner(); return; }
    if (!MN) { openModal('<h2 id="modalTitle">Minor planner</h2><p class="m-sub">Loading…</p>'); loadMinors().then(showMinorPlanner); return; }
    const keepScroll = !$('modal').hidden && $('mnPlanner') ? document.querySelector('.modal').scrollTop : 0;
    const { minor, done, planned, outside } = evaluateMinor();
    const index = MN.data.index.find((e) => e.id === minor.id) || {};
    const el = eligibilityFor(index);
    const e = minor.eligibility || {};
    const total = minor.totalHours;
    const pct = (h) => Math.min(100, (h / total) * 100);

    const chip = (code) => {
      const id = planIdFor(code);
      const title = courseTitle(code);
      // A cross-listed twin (ADV 324 / P R 324) or another number for the same course is not the course the
      // student picked: it is shown as taken by that course, and only one of them can count.
      if (id && !codesOf(id).some((x) => x === code || displayCode(x) === displayCode(code))) {
        return `<button class="mn-chip same" disabled title="${esc(displayCode(code))} is the same course as ${esc(C[id].code)}, which is in your plan. Only one of them can count.">` +
          `${esc(displayCode(code))}<small>same as ${esc(C[id].code)}</small></button>`;
      }
      if (id) {
        const isDone = S.done.has(id);
        const when = isDone ? 'completed' : nameAt(semOf(S.plan, id));
        // Courses added for the minor come out again with a second click; degree-plan courses only open their card.
        if (C[id].cat === 'minor') {
          return `<button class="mn-chip inplan minorcard${isDone ? ' done' : ''}" data-remove="${esc(id)}" title="Remove ${esc(displayCode(code))} from your plan">` +
            `${ICON.tick}${esc(displayCode(code))}<small class="when">${esc(when)}</small><small class="rm">Remove</small></button>`;
        }
        return `<button class="mn-chip inplan${isDone ? ' done' : ''}" data-go="${esc(id)}" title="${esc(title)}: part of your degree plan">${ICON.tick}${esc(displayCode(code))}<small>${esc(when)}</small></button>`;
      }
      if (!courseRec(code)) return `<button class="mn-chip" disabled title="Not in the 2026-27 catalog">${esc(displayCode(code))}<small>not offered</small></button>`;
      return `<button class="mn-chip add" data-add="${esc(code)}" title="Add ${esc(displayCode(code))}${title ? `: ${esc(title)}` : ''}">${ICON.plus}${esc(displayCode(code))}` +
        `${code !== displayCode(code) && title ? `<small>${esc(title)}</small>` : ''}</button>`;
    };
    const chips = (codes) => `<div class="mn-chips">${[...new Set(codes)].map(chip).join('')}</div>`;
    const openBox = (filter, text) => `<div class="mn-open" data-filter="${esc(JSON.stringify(filter || {}))}"><input placeholder="Course number" aria-label="${esc(text || 'Course number')}"><button class="btn">Add</button><p class="ac-error" hidden></p></div>`;

    const statusTag = (rp, rd) => {
      if (rd && rd.status === 'complete') return '<span class="tagp ok">Complete</span>';
      if (rp.status === 'not-applicable') return '<span class="tagp">Not needed</span>';
      if (rp.status === 'complete') return '<span class="tagp ok">Planned</span>';
      if (rp.hoursApplied) return `<span class="tagp maybe">${rp.hoursApplied} of ${rp.hoursRequired} hrs planned</span>`;
      return '<span class="tagp no">Still needed</span>';
    };
    const optionsOf = (n) => {
      switch (n.type) {
        case 'course': return chips(n.oneOf);
        case 'choose': {
          const courses = n.options.flatMap((o) => o.courses || []);
          return (courses.length ? chips(courses) : '') +
            n.options.filter((o) => o.open).map((o) => `<p>${esc(o.open.catalogText || 'Any course matching this description')}</p>${openBox(o.open.filter, o.open.catalogText)}`).join('');
        }
        case 'distribution': return n.areas.map((a) => `<div class="mn-sub"><b>${esc(a.label)}</b>${chips(a.options.flatMap((o) => o.courses || []))}</div>`).join('');
        case 'sequence': return n.sequences.map((s) => `<div class="mn-sub"><b>${esc(s.label)}</b>${s.requirements.map((r) => `${r.catalogText ? `<p>${esc(r.catalogText)}</p>` : ''}${optionsOf(r)}`).join('')}</div>`).join('');
        case 'open': return openBox(n.filter, n.catalogText);
        case 'conditional': return n.then ? optionsOf(n.then) : '';
        default: return '';
      }
    };
    const reqBlock = (n, i) => {
      const rp = planned.requirements[i], rd = done.requirements[i];
      const title = n.label || n.area || (n.type === 'course' ? 'Required course' : n.type === 'distribution' ? 'Distribution' : 'Elective hours');
      const applied = (rp.applied || []).map((a) => esc(displayCode(a.code))).join(', ');
      return `<div class="mn-req"><div class="mn-req-head"><h3>${esc(title)}<small>${n.hours != null ? `${n.hours} hrs` : ''}</small></h3>${statusTag(rp, rd)}</div>` +
        (n.type === 'conditional' ? `<p>Applies if the ${esc(n.when)}.${rp.status === 'not-applicable' && n.otherwise && n.otherwise.text ? ` ${esc(n.otherwise.text)}` : ''}</p>` : '') +
        (n.catalogText && n.type !== 'open' ? `<p>${esc(n.catalogText)}</p>` : '') +
        (n.note ? `<p>${esc(n.note)}</p>` : '') +
        (applied ? `<p>Counting: <b>${applied}</b></p>` : '') +
        optionsOf(n) + `</div>`;
    };

    const rule = (ok, text) => `<li class="${ok === true ? 'ok' : ok === false ? 'no' : 'info'}">${ok === true ? ICON.ok : ok === false ? ICON.x : ICON.info}<span>${text}</span></li>`;
    const gpaCheck = done.ruleChecks.find((c) => c.rule === 'minCombinedGpa');
    const upper = planned.ruleChecks.find((c) => c.rule === 'upperDivisionMinHours');
    const rules = [
      gpaCheck ? rule(gpaCheck.ok, `Combined GPA of at least ${gpaCheck.required.toFixed(2)} in minor courses${gpaCheck.actual != null ? `: currently ${gpaCheck.actual.toFixed(2)}` : ' (no grades yet)'}.`) : '',
      upper ? rule(upper.actual >= 6 ? true : null, `At least 6 upper-division hours: ${upper.actual} planned.`) : '',
      rule(outside >= 9 ? true : null, `At least 9 minor hours can't also count toward your major: ${outside} planned in courses outside your degree plan.`),
      rule(null, 'At least half the minor\'s hours must be taken in residence at UT Austin.'),
      minor.rules && minor.rules.program && minor.rules.program.letterGradeOnly ? rule(null, 'Minor courses must be taken on the letter-grade basis.') : '',
      minor.rules && minor.rules.program && minor.rules.program.minGradeEachCourse ? rule(null, `Each minor course needs a ${esc(minor.rules.program.minGradeEachCourse)} or better.`) : '',
    ].join('');
    const notes = [...new Set([...(e.notes || []), ...(minor.notes || [])])];
    const cautions = [...(minor.warnings || []), ...planned.review, ...planned.rejectedCourses.map((r) => `${displayCode(r.code)} can't count: ${r.why}.`)];
    const src = safeUrl(minor.sourceUrl);

    openModal(`<div id="mnPlanner"><h2 id="modalTitle">${esc(minor.name)}</h2>` +
      `<div class="mn-head"><p class="m-sub">${esc(minor.college)} · ${total} hours${src ? ` · <a href="${src}" target="_blank" rel="noopener">Catalog page</a>` : ''}</p>` +
        `<div class="mn-progress"><div class="ms-track"><i class="planned" style="width:${pct(planned.hoursApplied)}%"></i><i class="done" style="width:${pct(done.hoursApplied)}%"></i></div>` +
        `<div class="ms-nums"><b>${Math.min(planned.hoursApplied, total)}</b> of ${total} hrs planned · <b>${done.hoursApplied}</b> completed</div></div></div>` +
      `<div class="mn-box ${el.ok === true ? 'ok' : el.ok === false ? 'no' : ''}"><b>${esc(el.text)}.</b> ${esc(e.openTo || '')}` +
        `${e.applicationRequired ? ' Application required.' : ''}${e.timing ? ` ${esc(e.timing)}` : ''}` +
        `${notes.length ? `<ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</div>` +
      `<h3 class="mn-h">Requirements</h3>` +
      `<p class="m-sub">Add a course with <b>+</b>: it goes in the earliest semester that works, after any prerequisite that is part of this minor (that prerequisite is added too). ` +
      `Click a pink course again to take it back out. Green courses are part of your degree plan and count toward the minor too.</p>` +
      minor.requirements.map(reqBlock).join('') +
      `<h3 class="mn-h">Rules</h3><ul class="mn-rules">${rules}</ul>` +
      (cautions.length ? `<div class="mn-box" style="margin-top:14px"><b>Check with the program:</b><ul>${cautions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>` : '') +
      `<div class="m-actions"><button class="btn ghost" id="mnRemove">Remove minor</button><button class="btn ghost" id="mnChange">Change minor</button><button class="btn primary" id="mnDone">Done</button></div></div>`);

    const body = $('modalBody');
    body.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => requestMinorCourse(b.dataset.add)));
    body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { closeModal(); focusCourse(b.dataset.go, true); }));
    body.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => { removeMinorCard(b.dataset.remove); showMinorPlanner(); }));
    body.querySelectorAll('.mn-open').forEach((box) => {
      const input = box.querySelector('input'), err = box.querySelector('.ac-error');
      const filter = JSON.parse(box.dataset.filter);
      const add = () => {
        const code = input.value.toUpperCase().replace(/\s+/g, ' ').trim().replace(/^([A-Z]+)(\d)/, '$1 $2');
        const r = code && courseRec(code);
        const subj = r ? r.base.replace(/\s\d{3}[A-Z]{0,2}$/, '') : '';
        const msg = !r ? `${code || 'That'} isn't in the 2026-27 catalog data. Use a number like ${filter.subjects ? `${filter.subjects[0]} 3xx` : 'MKT 337'}.`
          : filter.subjects && !filter.subjects.includes(subj) ? `This requirement takes ${filter.subjects.join(', ')} courses.`
          : filter.upperDivision && r.rec.level !== 'Upper Division' ? 'This requirement takes upper-division courses.'
          : filter.coreCode && r.rec.coreCode !== filter.coreCode ? `This requirement takes courses that count for ${filter.coreArea || `core area ${filter.coreCode}`}.` : '';
        if (msg) { err.textContent = msg; err.hidden = false; return; }
        requestMinorCourse(r.topic ? `${r.base}.${r.topic}` : code);
      };
      box.querySelector('button').addEventListener('click', add);
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') add(); });
    });
    $('mnRemove').addEventListener('click', confirmRemoveMinor);
    $('mnChange').addEventListener('click', () => {
      const n = Object.values(S.custom).filter((c) => c.cat === 'minor').length;
      if (n) { confirmRemoveMinor(); return; }
      removeMinor(true);
      showMinorPicker();
    });
    $('mnDone').addEventListener('click', closeModal);
    if (keepScroll) document.querySelector('.modal').scrollTop = keepScroll;
  }

  // ---------------------------------------------------------------- minors from other schools
  // Students outside UT add a minor from its catalog page: a PDF, text or CSV that curriculum.js (parseMinor) reads
  // into requirement groups, each either every course listed or a choice ("Choose two of the following"). The
  // requirements are saved with the plan (S.minor.groups, own: true). Courses already in the plan count toward the
  // minor; the planner adds others as minor cards, placed like UT minor courses: after their prerequisites, in the
  // earliest semester with room. A course's prerequisites that are part of the minor are added with it.
  const ownKeyOf = (code) => window.Curriculum.normCode(code);
  const keysOf = (label) => [ownKeyOf(label), ...window.Curriculum.findCodes(String(label)).map((m) => ownKeyOf(m.code))];
  const ownCardId = (code) => `MN_${ownKeyOf(code)}`;
  // The plan course a minor course matches: the same number or one of its alternatives, on any card.
  function ownPlanIdFor(course) {
    const want = new Set([course.code, ...(course.alts || [])].flatMap(keysOf));
    for (const [id, c] of Object.entries(C)) {
      if ([c.code, ...(c.aliases || []), ...(c.alias || [])].some((l) => keysOf(l).some((k) => want.has(k)))) return id;
    }
    return null;
  }
  const isUpperNumber = (code) => {
    const m = window.Curriculum.findCodes(code)[0];
    const d = m ? m.num.replace(/\D/g, '') : '';
    return d.length === 3 ? +d >= 300 : d.length === 4 ? +d >= 3000 : false;
  };

  // Hours each group has in the plan. A course counts toward one group only; completed courses count first.
  function evaluateOwnMinor() {
    const m = S.minor, used = new Set();
    const groups = m.groups.map((g) => {
      const inPlan = g.courses.map((c) => ({ c, id: ownPlanIdFor(c) })).filter((x) => x.id && !used.has(x.id))
        .sort((a, b) => (S.done.has(b.id) - S.done.has(a.id)) || (semOf(S.plan, a.id) - semOf(S.plan, b.id)));
      let planned = 0, done = 0;
      const applied = [];
      for (const x of inPlan) {
        if (g.type === 'choose' && planned >= g.hours) break;
        used.add(x.id);
        applied.push(x.id);
        planned += C[x.id].hrs;
        if (S.done.has(x.id)) done += C[x.id].hrs;
      }
      return { g, applied, planned: Math.min(planned, g.hours), done: Math.min(done, g.hours) };
    });
    const sum = (k) => groups.reduce((n, x) => n + x[k], 0);
    const shared = groups.flatMap((x) => x.applied).filter((id) => C[id].cat !== 'minor').reduce((n, id) => n + C[id].hrs, 0);
    return { groups, planned: Math.min(sum('planned'), m.totalHours), done: Math.min(sum('done'), m.totalHours), shared };
  }

  function addOwnMinorCourse(course) {
    const all = S.minor.groups.flatMap((g) => g.courses);
    const byKey = new Map(all.map((c) => [ownKeyOf(c.code), c]));
    // The course and, before it, its prerequisites that are part of the minor and not yet planned.
    const chain = [];
    const visit = (c, depth) => {
      for (const p of c.pre || []) {
        const pc = byKey.get(ownKeyOf(p));
        if (pc && !ownPlanIdFor(pc) && !chain.includes(pc) && depth < 6) { visit(pc, depth + 1); chain.push(pc); }
      }
    };
    visit(course, 0);
    chain.push(course);
    const before = snapshot();
    const custom = { ...S.custom };
    const placed = new Map(), placedLoad = {}, added = [];
    // A prerequisite leaves a later semester free for each course after it in the chain that needs it.
    const lastRegular = S.terms.reduce((n, t, i) => (isRegular(t) ? i : n), S.terms.length - 1);
    const after = (c) => chain.slice(chain.indexOf(c) + 1).filter((d) => (d.pre || []).some((p) => ownKeyOf(p) === ownKeyOf(c.code)));
    const depth = (c, seen = 0) => (seen > 6 ? 0 : Math.max(0, ...after(c).map((d) => 1 + depth(d, seen + 1))));
    for (const c of chain) {
      const id = ownCardId(c.code);
      if (custom[id] || ownPlanIdFor(c)) continue;
      const refNames = {};
      const link = (codes) => codes.map((p) => {
        const pid = ownPlanIdFor({ code: p }) || (custom[ownCardId(p)] ? ownCardId(p) : null);
        if (pid) return pid;
        const ext = `EXT_${ownKeyOf(p)}`;
        refNames[ext] = p;
        return ext;
      });
      const pre = link(c.pre || []), co = link(c.co || []);
      const outside = Object.values(refNames);
      const card = {
        code: c.code, title: c.title + (c.alts && c.alts.length ? ` (or ${c.alts.join(', ')})` : ''), hrs: c.hrs, cat: 'minor', minor: S.minor.id,
        aliases: c.alts || [], pre, co, refNames, keepRefs: Object.keys(refNames), upper: isUpperNumber(c.code),
        note: `For the ${S.minor.name}.${c.assumed ? ' The minor’s file gives no hours for this course, so FourSight assumed 3.' : ''}` +
          `${outside.length ? ` Prerequisite outside your plan: ${outside.join(', ')}.` : ''}`,
      };
      const min = earliestTerm({ pre, co, notes: [], upper: card.upper }, placed, placedLoad);
      const max = Math.max(min, lastRegular - depth(c));
      const load = (i) => hours(S.plan[i]) + (placedLoad[i] || 0);
      let sem = -1;
      for (let i = min; i <= max && sem < 0; i++) if (isRegular(S.terms[i]) && load(i) + card.hrs <= 18) sem = i;
      if (sem < 0) for (let i = min; i <= max; i++) if (isRegular(S.terms[i]) && (sem < 0 || load(i) < load(sem))) sem = i;
      if (sem < 0) sem = chooseTerm(min, card.hrs, placedLoad);
      placed.set(id, sem);
      placedLoad[sem] = (placedLoad[sem] || 0) + card.hrs;
      custom[id] = card;
      added.push({ id, sem, c });
    }
    if (!added.length) return;
    applyCourses({ custom, edits: S.edits, removed: S.removed });
    for (const a of added) S.plan[a.sem].push(a.id);
    rebuild(before);
    const main = added.find((a) => a.c === course), pre = added.filter((a) => a.c !== course);
    toast(`Added <b>${esc(course.code)}</b> ${esc(course.title)} to ${esc(nameAt(main ? main.sem : pre[0].sem))}` +
      (pre.length ? `, plus ${pre.map((a) => `<b>${esc(a.c.code)}</b> (${esc(nameAt(a.sem))})`).join(', ')}, which it requires and which ${pre.length === 1 ? 'is' : 'are'} part of the minor` : '') + '.' +
      [...new Set(added.map((a) => a.sem))].filter((i) => hours(S.plan[i]) > 18).map((i) => ` ${esc(nameAt(i))} now has ${hours(S.plan[i])} hours; you may want to move a course.`).join(''));
  }

  // ---- choosing a minor file
  function showOwnMinorPicker(error) {
    openModal(`<h2 id="modalTitle">Add a minor</h2>` +
      `<p class="m-sub">Upload your minor’s requirements from your school’s catalog: a PDF, text or CSV file. FourSight lists its required courses and choices, ` +
      `and you pick which go in your plan. Courses already in your plan count toward the minor.</p>` +
      (error ? `<p class="m-check warn">${ICON.alert}<span>${esc(error)}</span></p>` : '') +
      `<div class="om-drop" id="omDrop">${ICON.upload}<b>Drop the minor’s file here</b><span>or</span><button class="btn primary" id="omPick">Choose a file</button></div>` +
      `<details class="om-paste"><summary>Paste the text instead</summary>` +
      `<textarea id="omBox" spellcheck="false" placeholder="${esc('Minor in Business Administration (18 hours)\nRequired Courses\nACCT 2301   Principles of Financial Accounting   3\nECON 2301   Principles of Macroeconomics   3\nChoose two of the following:\nFIN 3312   Business Finance   3   Prerequisite: ACCT 2301\nMKT 3343   Principles of Marketing   3')}"></textarea>` +
      `<div class="m-actions"><button class="btn primary" id="omGo">Read minor</button></div></details>`);
    $('omPick').addEventListener('click', () => $('minorFile').click());
    $('omGo').addEventListener('click', () => { const t = $('omBox').value; if (t.trim()) importOwnMinor(t); });
    const drop = $('omDrop');
    drop.addEventListener('dragover', (ev) => { ev.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (ev) => { ev.preventDefault(); drop.classList.remove('over'); const f = ev.dataTransfer.files[0]; if (f) importOwnMinor(f); });
  }
  $('minorFile').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (file) importOwnMinor(file);
  });

  async function importOwnMinor(src) {
    const name = typeof src === 'string' ? 'pasted text' : src.name;
    openModal(`<h2 id="modalTitle">Reading ${esc(name)}…</h2><p class="m-sub">Finding the minor’s requirements and courses.</p>`);
    try {
      const rows = typeof src === 'string' ? window.Curriculum.rowsFromText(src) : await window.Curriculum.read(src);
      const m = window.Curriculum.parseMinor(rows);
      if (!m.count) throw new Error(`FourSight could not find any courses in ${name}. It looks for course numbers like “ACCT 2301” under headings like “Required Courses” or “Choose two of the following”. If this is a scanned PDF, paste its text instead.`);
      // A file without a title is named after itself ("data-science-minor.pdf").
      let full = m.name, short = m.shortName;
      if (short === 'Minor' && typeof src !== 'string') {
        short = name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\bminor\b/i, '').trim()
          .replace(/\b([a-z])([a-z]*)/gi, (w, a, b) => (w.length <= 3 ? w.toUpperCase() : a.toUpperCase() + b)) || 'Minor';
        full = `${short} Minor`;
      }
      S.minor = {
        id: `own-${Date.now().toString(36)}`, own: true, name: full, shortName: short, totalHours: m.totalHours,
        statedTotal: m.statedTotal, groupHours: m.groupHours, source: name, groups: m.groups,
      };
      CATS = programCats();
      save();
      buildLegend();
      paint();
      showOwnMinorPlanner();
    } catch (err) {
      showOwnMinorPicker(err && err.message ? err.message : String(err));
    }
  }

  // ---- the planner for a minor from a file
  function showOwnMinorPlanner() {
    const m = S.minor;
    const keepScroll = !$('modal').hidden && $('mnPlanner') ? document.querySelector('.modal').scrollTop : 0;
    const ev = evaluateOwnMinor();
    const total = m.totalHours || 1;
    const pct = (h) => Math.min(100, (h / total) * 100);
    const chip = (c, gi, ci) => {
      const id = ownPlanIdFor(c);
      if (id) {
        const isDone = S.done.has(id), when = isDone ? 'completed' : nameAt(semOf(S.plan, id));
        if (C[id].cat === 'minor') {
          return `<button class="mn-chip inplan minorcard${isDone ? ' done' : ''}" data-remove="${esc(id)}" title="Remove ${esc(c.code)} from your plan">` +
            `${ICON.tick}${esc(c.code)}<small class="when">${esc(when)}</small><small class="rm">Remove</small></button>`;
        }
        return `<button class="mn-chip inplan${isDone ? ' done' : ''}" data-go="${esc(id)}" title="${esc(c.title)}: part of your degree plan">${ICON.tick}${esc(C[id].code)}<small>${esc(when)}</small></button>`;
      }
      return `<button class="mn-chip add" data-own="${gi}:${ci}" title="Add ${esc(c.code)}${c.title ? `: ${esc(c.title)}` : ''}">${ICON.plus}${esc(c.code)}<small>${esc(c.title)}${c.hrs !== 3 ? `, ${c.hrs} hr` : ''}</small></button>`;
    };
    const block = (x, gi) => {
      const { g } = x;
      const tag = x.done >= g.hours ? '<span class="tagp ok">Complete</span>' : x.planned >= g.hours ? '<span class="tagp ok">Planned</span>'
        : x.planned ? `<span class="tagp maybe">${x.planned} of ${g.hours} hrs planned</span>` : '<span class="tagp no">Still needed</span>';
      const rule = g.type === 'all' ? 'Take every course' : g.count ? `Choose ${g.count} course${g.count === 1 ? '' : 's'}` : `Choose ${g.hours} hours`;
      return `<div class="mn-req"><div class="mn-req-head"><h3>${esc(g.label)}<small>${g.hours} hrs</small></h3>${tag}</div><p>${rule}.</p>` +
        `<div class="mn-chips">${g.courses.map((c, ci) => chip(c, gi, ci)).join('')}</div></div>`;
    };
    const missingRequired = ev.groups.some((x) => x.g.type === 'all' && x.g.courses.some((c) => !ownPlanIdFor(c)));
    const totalNote = m.statedTotal && m.groupHours && m.statedTotal !== m.groupHours
      ? `<p class="m-check warn">${ICON.alert}<span>${esc(m.source)} says the minor is ${m.statedTotal} hours, but the requirements FourSight found add up to ${m.groupHours}. Check the catalog for requirements it didn’t list, and add those courses with + Add course.</span></p>` : '';
    openModal(`<div id="mnPlanner"><h2 id="modalTitle">${esc(m.name)}</h2>` +
      `<div class="mn-head"><p class="m-sub">From ${esc(m.source)} · ${m.totalHours} hours</p>` +
        `<div class="mn-progress"><div class="ms-track"><i class="planned" style="width:${pct(ev.planned)}%"></i><i class="done" style="width:${pct(ev.done)}%"></i></div>` +
        `<div class="ms-nums"><b>${ev.planned}</b> of ${m.totalHours} hrs planned · <b>${ev.done}</b> completed</div></div></div>` +
      totalNote +
      `<h3 class="mn-h">Requirements</h3>` +
      `<p class="m-sub">Add a course with <b>+</b>: it goes in the earliest semester that works, after any prerequisite that is part of this minor (that prerequisite is added too). ` +
      `Click a pink course again to take it back out. Green courses are already in your plan and count toward the minor.</p>` +
      ev.groups.map(block).join('') +
      `<h3 class="mn-h">Rules</h3><ul class="mn-rules"><li class="info">${ICON.info}<span>Check your school’s rules for this minor: minimum grades, courses that must be taken at your school, and how many minor hours may also count toward your major.</span></li></ul>` +
      `<div class="m-actions"><button class="btn ghost" id="mnRemove">Remove minor</button><button class="btn ghost" id="mnChange">Use a different file</button>` +
      `${missingRequired ? '<button class="btn" id="mnAllReq">Add all required courses</button>' : ''}<button class="btn primary" id="mnDone">Done</button></div></div>`);
    const body = $('modalBody');
    const courseAt = (key) => { const [gi, ci] = key.split(':').map(Number); return m.groups[gi].courses[ci]; };
    body.querySelectorAll('[data-own]').forEach((b) => b.addEventListener('click', () => { addOwnMinorCourse(courseAt(b.dataset.own)); showOwnMinorPlanner(); }));
    body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { closeModal(); focusCourse(b.dataset.go, true); }));
    body.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => { removeMinorCard(b.dataset.remove); showOwnMinorPlanner(); }));
    if ($('mnAllReq')) $('mnAllReq').addEventListener('click', () => {
      for (const g of m.groups) if (g.type === 'all') for (const c of g.courses) if (!ownPlanIdFor(c)) addOwnMinorCourse(c);
      showOwnMinorPlanner();
    });
    $('mnRemove').addEventListener('click', confirmRemoveMinor);
    $('mnChange').addEventListener('click', () => {
      if (Object.values(S.custom).some((c) => c.cat === 'minor')) { confirmRemoveMinor(); return; }
      removeMinor(true);
      showOwnMinorPicker();
    });
    $('mnDone').addEventListener('click', closeModal);
    if (keepScroll) document.querySelector('.modal').scrollTop = keepScroll;
  }

  // ---------------------------------------------------------------- course type colors
  // Students can recolor each degree requirement. Colors are saved per program, since programs
  // name their requirements differently. Every color gets a pale tint for card backgrounds and a
  // dark "ink" for text on that tint, so any choice stays readable.
  const DEFAULT_COLORS = { major: '#E0731A', stem: '#2C9A57', core: '#2E77CC', alt: '#8A4FD3', tech: '#0D8C80', minor: '#C2418E' };
  const DEFAULT_TINTS = { major: '#FDEFE2', stem: '#E4F4EA', core: '#E4EEFA', alt: '#F0E8FC', tech: '#DFF3F0', minor: '#F9E9F3' };
  const PALETTE = [
    ['#E0731A', 'Orange'], ['#BF5700', 'Burnt orange'], ['#D6455D', 'Red'], ['#C2418E', 'Magenta'], ['#8A4FD3', 'Purple'], ['#4F5BD5', 'Indigo'],
    ['#2E77CC', 'Blue'], ['#0D8C80', 'Teal'], ['#2C9A57', 'Green'], ['#7A9A1F', 'Olive'], ['#C98A00', 'Gold'], ['#5B6B7F', 'Slate'],
  ];
  const HEX = /^#[0-9a-f]{6}$/i;
  const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const hexOf = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  // Darken (like the old brightness(.8) filter) until text reaches 4.5:1 on the tint and white.
  function inkFor(hex, tint) {
    let ink = rgbOf(hex).map((v) => v * 0.8);
    for (let i = 0; i < 40 && (contrast(ink, rgbOf(tint)) < 4.5 || contrast(ink, [255, 255, 255]) < 4.5); i++) ink = ink.map((v) => v * 0.92);
    return hexOf(ink);
  }
  const colorKey = () => `dp.colors.${P.id}`;
  function savedColors() {
    try { return JSON.parse(localStorage.getItem(colorKey()) || '{}') || {}; } catch (_) { return {}; }
  }
  const colorOf = (k, saved = savedColors()) => (HEX.test(saved[k] || '') ? saved[k].toUpperCase() : DEFAULT_COLORS[k]);
  function applyColors() {
    const saved = savedColors(), root = document.documentElement.style;
    for (const k of window.CATEGORY_KEYS) {
      const c = colorOf(k, saved);
      const tint = c === DEFAULT_COLORS[k] ? DEFAULT_TINTS[k] : hexOf(rgbOf(c).map((v) => v * 0.11 + 255 * 0.89));
      root.setProperty(`--${k}`, c);
      root.setProperty(`--${k}-tint`, tint);
      root.setProperty(`--${k}-ink`, inkFor(c, tint));
    }
  }
  function setColor(k, hex) {
    const saved = savedColors();
    if (!hex || hex.toUpperCase() === DEFAULT_COLORS[k]) delete saved[k]; else saved[k] = hex.toUpperCase();
    try { localStorage.setItem(colorKey(), JSON.stringify(saved)); } catch (_) { /* ignore */ }
    applyColors();
  }

  function showColors() {
    const row = ([k, v]) => {
      const cur = colorOf(k);
      return `<div class="cc-row" data-cat="${k}">` +
        `<div class="cc-name"><i style="background:var(--${k})"></i>${esc(v.label)}</div>` +
        `<div class="cc-swatches" role="radiogroup" aria-label="${esc(v.label)} color">` +
          PALETTE.map(([hex, name]) => `<button class="cc-sw" style="background:${hex}" data-hex="${hex}" role="radio" aria-checked="${hex === cur}" aria-label="${name}" title="${name}"></button>`).join('') +
          `<label class="cc-custom${PALETTE.some(([hex]) => hex === cur) ? '' : ' on'}" title="Pick any color">` +
            `<input type="color" value="${cur.toLowerCase()}" aria-label="Custom ${esc(v.label)} color"><span>Custom</span></label>` +
        `</div></div>`;
    };
    openModal(`<h2 id="modalTitle">Course type colors</h2>` +
      `<p class="m-sub">Pick a color for each degree requirement. Cards, the course type menu and the degree audit update right away. Colors are saved for ${P.own ? 'this plan' : esc(programName())} on this computer.</p>` +
      `<div class="cc-list">${Object.entries(CATS).map(row).join('')}</div>` +
      `<div class="m-actions"><button class="btn ghost" id="ccReset">Restore default colors</button><button class="btn primary" id="ccDone">Done</button></div>`);
    const sync = () => {
      document.querySelectorAll('.cc-row').forEach((r) => {
        const cur = colorOf(r.dataset.cat);
        r.querySelectorAll('.cc-sw').forEach((b) => b.setAttribute('aria-checked', b.dataset.hex === cur));
        r.querySelector('.cc-custom').classList.toggle('on', !PALETTE.some(([hex]) => hex === cur));
        r.querySelector('input[type=color]').value = cur.toLowerCase();
      });
    };
    document.querySelectorAll('.cc-row').forEach((r) => {
      const k = r.dataset.cat;
      r.querySelectorAll('.cc-sw').forEach((b) => b.addEventListener('click', () => { setColor(k, b.dataset.hex); sync(); }));
      r.querySelector('input[type=color]').addEventListener('input', (ev) => { setColor(k, ev.target.value); sync(); });
    });
    $('ccReset').addEventListener('click', () => {
      try { localStorage.removeItem(colorKey()); } catch (_) { /* ignore */ }
      applyColors(); sync();
    });
    $('ccDone').addEventListener('click', closeModal);
  }
  $('auditRows').addEventListener('click', (ev) => { if (ev.target.closest('.sw')) showColors(); });

  // ---------------------------------------------------------------- welcome
  // FourSight has no accounts. The first screen asks where the student studies, then how to start:
  //   UT Austin  -> load a degree template (pick a major; its suggested plan loads) or start with an empty plan
  //   elsewhere  -> upload a curriculum file (read on this device by curriculum.js) or start with a blank plan
  // It opens on first launch and from New plan; returning students go straight to their plan.
  const WICON = {
    tower: '<svg viewBox="0 0 24 24"><path d="M12 2.5v2.5M10 5h4v3.5h-4zM9 8.5h6V21H9zM5.5 21h13M11 12h2M11 15.5h2M6.5 21v-6l2.5-1.5M17.5 21v-6L15 13.5"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z"/></svg>',
    template: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M8.5 4v16M15.5 4v16"/><path d="M4.8 8h2M4.8 11h2M10.3 8h3.4M10.3 11h3.4M10.3 14h3.4M17.3 8h2M17.3 11h2M17.3 14h2M17.3 17h2"/></svg>',
    blank: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M8.5 4v16M15.5 4v16" opacity=".55"/><path d="M12 9.5v5M9.5 12h5"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M12 17.5v-6M9.5 14 12 11.5l2.5 2.5"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    flow: '<svg viewBox="0 0 24 24"><rect x="3" y="3.5" width="8" height="5.5" rx="1.6"/><rect x="13" y="15" width="8" height="5.5" rx="1.6"/><path d="M7 9v5.2a1.6 1.6 0 0 0 1.6 1.6H13"/><path d="m10.6 13.4 2.4 2.4-2.4 2.4"/></svg>',
    flowSmall: '<svg viewBox="0 0 24 24"><rect x="3" y="3.5" width="8" height="5.5" rx="1.6"/><rect x="13" y="15" width="8" height="5.5" rx="1.6"/><path d="M7 9v5.2a1.6 1.6 0 0 0 1.6 1.6H13"/></svg>',
    link: '<svg viewBox="0 0 24 24"><rect x="3" y="3.5" width="8" height="5.5" rx="1.6"/><rect x="13" y="15" width="8" height="5.5" rx="1.6"/><path d="M7 9v6.8h4" stroke-dasharray="1.8 2.2"/><path d="m16.6 4.2 3.2 3.2-6 6H10.6v-3.2Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  };
  const W = { trail: [], ownFor: null, after: null };
  const choice = (go, icon, title, text, extra = '') =>
    `<button class="wc-choice" data-go="${go}"><span class="wc-ico">${icon}</span><span class="wc-copy"><strong>${title}</strong><span>${text}</span>${extra}</span><span class="wc-arrow">${WICON.arrow}</span></button>`;
  const backBtn = () => `<button class="wc-back" data-back>${WICON.back}Back</button>`;

  function showWelcome({ first = false } = {}) {
    W.trail = []; W.step = null; W.chains = null;
    $('wcClose').hidden = first;
    $('welcome').hidden = false;
    document.body.classList.add('welcoming');
    requestAnimationFrame(() => $('welcome').classList.add('open'));
    wcGo('school');
  }
  function hideWelcome() {
    try { localStorage.setItem('dp.started', '1'); } catch (_) { /* ignore */ }
    $('welcome').classList.remove('open');
    document.body.classList.remove('welcoming');
    setTimeout(() => { if (!$('welcome').classList.contains('open')) $('welcome').hidden = true; }, 350);
    requestAnimationFrame(() => { drawLines(); updateSemnav(); loop.kick(); });
  }
  $('wcClose').addEventListener('click', hideWelcome);
  $('newPlanBtn').addEventListener('click', () => showWelcome());
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('welcome').hidden && !$('wcClose').hidden && $('modal').hidden) hideWelcome();
  });

  function wcGo(step, { back = false, data = {} } = {}) {
    if (!back && W.step && W.step !== step && !['reading'].includes(W.step)) W.trail.push(W.step);
    W.step = step;
    const stage = $('wcStage');
    stage.innerHTML = WSTEPS[step](data);
    stage.classList.remove('in', 'in-back');
    void stage.offsetWidth;
    stage.classList.add(back ? 'in-back' : 'in');
    stage.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => wcChoose(b.dataset.go)));
    stage.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', wcBack));
    stage.querySelectorAll('[data-major]').forEach((b) => b.addEventListener('click', () => { hideWelcome(); selectProgram(b.dataset.major); }));
    // Keyboard users start on the heading; the paste box takes focus so they can type right away.
    const box = stage.querySelector('textarea');
    if (box) box.focus({ preventScroll: true });
    else { const h = $('wcTitle'); h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  function wcBack() {
    const prev = W.trail.pop();
    if (prev) wcGo(prev, { back: true });
  }

  function wcChoose(go) {
    switch (go) {
      case 'ut': case 'other': case 'major': case 'paste': return wcGo(go);
      case 'ut-blank': return startBlank('mine-ut');
      case 'blank': return startBlank('mine');
      case 'upload': return askReplace('mine', () => wcGo('chains'));
      case 'chains-file': W.chains = 'file'; return pickCurriculum('mine');
      case 'chains-self': W.chains = 'self'; return pickCurriculum('mine');
      case 'pick-flowchart': return pickFlowchart();
      case 'skip-flowchart':
        P.def.chains = 'self'; saveOwnDef();
        hideWelcome(); return showCurriculumReport();
      case 'open-own': hideWelcome(); return selectProgram(W.ownFor);
      case 'replace': return W.after();
      case 'retry': return pickCurriculum(W.ownFor || 'mine');
      default: return null;
    }
  }
  // An own plan that already has courses is opened or replaced, never overwritten without asking.
  function askReplace(id, then) {
    const n = ownCourseCount(id);
    if (!n) return then();
    W.ownFor = id; W.after = then;
    wcGo('existing', { data: { n, id } });
  }
  function startBlank(id) {
    askReplace(id, () => { hideWelcome(); startOwn(id, {}); });
  }

  // ---- curriculum files
  function pickCurriculum(id) {
    W.ownFor = id;
    $('curriculumFile').dataset.for = id;
    $('curriculumFile').click();
  }
  $('curriculumFile').addEventListener('change', (ev) => {
    const file = ev.target.files[0], id = ev.target.dataset.for || 'mine';
    ev.target.value = '';
    if (file) importCurriculum(file, id);
  });

  // Reads a file (or pasted text) into a new own plan. From the welcome screen, progress and errors show there;
  // from the dock, in a dialog.
  async function importCurriculum(src, id) {
    const fromWelcome = !$('welcome').hidden;
    const name = typeof src === 'string' ? 'pasted text' : src.name;
    if (fromWelcome) wcGo('reading', { data: { name } });
    else openModal(`<h2 id="modalTitle">Reading ${esc(name)}…</h2><p class="m-sub">FourSight is finding the courses and semesters in your file.</p>`);
    try {
      const rows = typeof src === 'string' ? window.Curriculum.rowsFromText(src) : await window.Curriculum.read(src);
      const r = window.Curriculum.parse(rows, { ut: id === 'mine-ut' });
      if (!r.count) throw new Error(`FourSight could not find any courses in ${name}. It looks for course numbers like “CHEM 1311” or “CS 61A”, ideally under semester headings like “Fall Semester” or “Year 1 Spring”. If this is a scanned PDF, copy the text from it and paste it instead.`);
      startOwn(id, {
        source: name, school: r.school, program: r.program, courses: r.courses, plan: r.plan, terms: r.terms, prior: r.prior,
        chains: fromWelcome ? W.chains || 'self' : null,
        report: {
          count: r.count, terms: r.plan.filter((t) => t.length).length, assumed: r.assumed, prereqs: r.prereqs, skipped: r.skipped,
          placedByOrder: r.byOrder, hours: r.hours, programTotal: r.programTotal, checks: r.checks, balanced: r.balanced,
          fromChart: r.fromChart, supplemented: r.supplemented,
        },
      });
      // A student who chose to upload a flowchart adds it next.
      if (fromWelcome && W.chains === 'file') return wcGo('flowchart', { data: { count: r.count } });
      if (fromWelcome) hideWelcome();
      showCurriculumReport();
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (fromWelcome) wcGo('failed', { data: { msg } });
      else openModal(`<h2 id="modalTitle">Could not build a plan from that file</h2><p class="m-sub">${esc(msg)}</p>` +
        `<div class="m-actions"><button class="btn ghost" id="cfPaste">Paste text instead</button><button class="btn primary" id="cfRetry">Choose another file</button></div>`);
      if (!fromWelcome) {
        $('cfRetry').addEventListener('click', () => { closeModal(); pickCurriculum(id); });
        $('cfPaste').addEventListener('click', () => showCurriculumPaste(id));
      }
    }
  }

  // ---- prerequisite flowcharts
  // A flowchart adds prerequisite and co-requisite links between the courses already in an uploaded plan
  // (curriculum.js readFlowchart). Links are matched by course number; a course on the chart that is not in the plan
  // is noted on the course that needs it.
  function pickFlowchart() {
    $('flowchartFile').click();
  }
  $('flowchartFile').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (file) importFlowchart(file);
  });
  function saveOwnDef() {
    try { localStorage.setItem(ownKey(P.id), JSON.stringify(P.def)); } catch (_) { /* ignore */ }
  }

  async function importFlowchart(src) {
    const fromWelcome = !$('welcome').hidden;
    const name = src.name || 'pasted text';
    if (fromWelcome) wcGo('reading', { data: { name, flowchart: true } });
    else openModal(`<h2 id="modalTitle">Reading ${esc(name)}\u2026</h2><p class="m-sub">FourSight is finding which courses lead to which.</p>`);
    try {
      const fc = await window.Curriculum.readFlowchart(src);
      if (!fc.relations.length) {
        throw new Error(`FourSight found no prerequisite links in ${name}. It reads course boxes with their prerequisites listed under them (and a legend for prerequisites and co-requisites), lines or arrows between course boxes, and text like \u201cPrerequisite: CHEM 1311\u201d.`);
      }
      const res = applyFlowchart(fc, name);
      if (!res.added && !res.already) {
        throw new Error(`${name} has ${fc.relations.length} prerequisite link${fc.relations.length === 1 ? '' : 's'}, but none of them lead to a course in your plan. Check that the flowchart is for the same degree as your curriculum.`);
      }
      if (fromWelcome) hideWelcome();
      showCurriculumReport();
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (fromWelcome) wcGo('flowchart', { data: { count: Object.keys(P.courses).length, error: msg } });
      else {
        openModal(`<h2 id="modalTitle">No prerequisite chains added</h2><p class="m-sub">${esc(msg)}</p>` +
          `<div class="m-actions"><button class="btn ghost" id="fcClose">Close</button><button class="btn primary" id="fcRetry">Choose another file</button></div>`);
        $('fcClose').addEventListener('click', closeModal);
        $('fcRetry').addEventListener('click', () => { closeModal(); pickFlowchart(); });
      }
    }
  }

  // Adds a flowchart's links to the own plan's courses and reloads the plan (check-offs and moves are kept).
  // A line without a direction runs from the earlier course in the plan to the later one, or is a co-requisite
  // when both share a semester. A link that would make a loop is skipped.
  function applyFlowchart(fc, name) {
    const def = P.def, courses = def.courses;
    const norm = window.Curriculum.normCode;
    const index = new Map();
    for (const [id, c] of Object.entries(courses)) {
      for (const label of [c.code, ...(c.aliases || [])]) {
        for (const m of window.Curriculum.findCodes(label)) if (!index.has(norm(m.code))) index.set(norm(m.code), id);
        if (!index.has(norm(label))) index.set(norm(label), id);
      }
    }
    const needs = (a, b, seen = new Set()) => { // does a (through its chain) need b?
      if (a === b) return true;
      if (seen.has(a) || !courses[a]) return false;
      seen.add(a);
      return [...(courses[a].pre || []), ...(courses[a].co || [])].flat().some((p) => needs(p, b, seen));
    };
    let added = 0, cos = 0, outside = 0, unmatched = 0, already = 0;
    for (const r of fc.relations) {
      let from = index.get(norm(r.from)), to = index.get(norm(r.to)), type = r.type;
      if (type == null) {
        if (!from || !to) { unmatched++; continue; }
        const a = semOf(S.plan, from), b = semOf(S.plan, to);
        if (a === b) type = 'co'; else { type = 'pre'; if (a > b) [from, to] = [to, from]; }
      }
      if (!to) { unmatched++; continue; }
      if (from === to) continue;
      const ref = from || `EXT_${norm(r.from)}`;
      const c = courses[to];
      if ([...(c.pre || []), ...(c.co || [])].flat().includes(ref)) { already++; continue; }
      if (from && needs(from, to)) { already++; continue; }
      if (!from) { (def.prior ||= {})[ref] = `${r.from}: not in this plan`; outside++; }
      (c[type === 'co' ? 'co' : 'pre'] ||= []).push(ref);
      added++;
      if (type === 'co') cos++;
    }
    def.chains = 'file';
    def.flowchart = { source: name, added, cos, outside, unmatched, already, total: fc.relations.length };
    saveOwnDef();
    FSP[P.id] = ownProgram(P.id, def);
    selectProgram(P.id);
    return def.flowchart;
  }

  // What was read: every course by term, so the student can check it against the file.
  function showCurriculumReport() {
    const r = P.def.report, fc = P.def.flowchart;
    const assumedIds = new Set(Object.keys(P.courses).filter((id) => /assumed 3/.test(P.courses[id].note || '')));
    const links = Object.values(P.courses).reduce((n, c) => n + [...(c.pre || []), ...(c.co || [])].length, 0);
    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    // Hours: checked against the file's own totals when it states them.
    const checks = r.checks || [];
    const off = checks.filter((c) => c.file !== c.found);
    const hoursNote = r.programTotal
      ? (r.programTotal === P.hours
        ? `<p class="m-check ok">${ICON.ok}<span><b>${P.hours} credit hours</b>, the same as the ${r.programTotal}-hour total in the file${checks.length && !off.length ? `, and every semester matches the hours the file lists for it` : ''}.</span></p>`
        : `<p class="m-check warn">${ICON.alert}<span>The file says the degree is <b>${r.programTotal} hours</b>; FourSight read <b>${P.hours}</b>. ${P.hours < r.programTotal ? `The other ${r.programTotal - P.hours} hours may be printed as pictures, which FourSight can\u2019t read. Add those courses with + Add course.` : 'Some courses may be optional or listed twice; delete any extras.'}</span></p>`)
      : checks.length ? (off.length
        ? `<p class="m-check warn">${ICON.alert}<span>${off.map((c) => `${esc(nameAt(c.term))}: the file lists ${c.file} hours, FourSight found ${c.found}`).join('; ')}. Check those semesters against your file.</span></p>`
        : `<p class="m-check ok">${ICON.ok}<span>Every semester matches the hours the file lists for it.</span></p>`) : '';
    const chainsNote = fc
      ? `<p class="m-check ok">${ICON.ok}<span><b>${plural(fc.added, 'prerequisite link')}</b> added from ${esc(fc.source)}${fc.cos ? ` (${fc.cos} co-requisite${fc.cos === 1 ? '' : 's'})` : ''}${fc.already ? `; ${fc.already} more ${fc.already === 1 ? 'was' : 'were'} already in your plan` : ''}.` +
        `${fc.outside ? ` ${fc.outside} lead${fc.outside === 1 ? 's' : ''} from courses outside your plan, noted on the course that needs them.` : ''}` +
        `${fc.unmatched ? ` ${fc.unmatched} link${fc.unmatched === 1 ? '' : 's'} on the flowchart involve courses that aren\u2019t in your plan and were left out.` : ''} Hover a course to see its chain.</span></p>`
      : P.def.chains === 'self'
        ? `<p class="m-check">${ICON.info}<span>${links ? `Your file listed ${plural(links, 'prerequisite link')}, already drawn. ` : ''}To add a prerequisite chain, click a course, choose <b>Edit</b>, and pick the courses that must come before it.</span></p>`
        : links ? `<p class="m-check ok">${ICON.ok}<span><b>${plural(links, 'prerequisite link')}</b> read from the file.</span></p>` : '';
    openModal(`<h2 id="modalTitle">Your plan is ready</h2>` +
      `<p class="m-sub">FourSight found <b>${plural(r.count, 'course')}</b> in ${esc(P.def.source)}` +
      `${P.def.school ? ` from ${esc(P.def.school)}` : ''}${r.fromChart ? ', read from its flowchart,' : ''} and placed ${r.placedByOrder ? 'them across the semesters in the file\u2019s order, each after its prerequisites' : 'them in the semesters the file lists'}. ` +
      `Check them against your file: click any course to fix its number, name, hours or prerequisites, and drag courses to move them.</p>` +
      hoursNote + chainsNote +
      (r.balanced ? `<p class="m-check">${ICON.info}<span>${plural(r.balanced, 'course')} moved so no semester is over 18 hours, without breaking any prerequisite.</span></p>` : '') +
      `<div class="m-pills"><span class="m-pill applied">${r.count} courses</span><span class="m-pill progress">${P.hours} credit hours</span>` +
      `${links ? `<span class="m-pill">${plural(links, 'prerequisite link')}</span>` : ''}` +
      `${r.assumed ? `<span class="m-pill notpassed">${r.assumed} given 3 hours (not in file)</span>` : ''}</div>` +
      S.plan.map((ids, i) => {
        const own = ids.filter((id) => P.courses[id]);
        if (!own.length) return '';
        return `<section class="m-group"><h3>${esc(nameAt(i))}<small>${own.reduce((n, id) => n + C[id].hrs, 0)} hours</small></h3><table class="cr-table">` +
          own.map((id) => `<tr><td class="c">${esc(C[id].title ? C[id].code : '')}</td><td class="t">${esc(C[id].title || C[id].code)}</td>` +
            `<td class="g">${C[id].hrs} hr${assumedIds.has(id) ? '<span class="cr-assumed" title="Not in the file">?</span>' : ''}</td></tr>`).join('') + `</table></section>`;
      }).join('') +
      (r.skipped && r.skipped.length ? `<p class="m-note">Also mentioned in the file but not under any semester, so left out: ${esc(r.skipped.slice(0, 12).join(', '))}${r.skipped.length > 12 ? ` and ${r.skipped.length - 12} more` : ''}. Add any you need with + Add course.</p>` : '') +
      `<div class="m-actions"><button class="btn primary" id="crDone">View my plan</button></div>`);
    $('crDone').addEventListener('click', closeModal);
  }

  function showCurriculumPaste(id) {
    openModal(`<h2 id="modalTitle">Paste your curriculum</h2>` +
      `<p class="m-sub">Copy the course list from your degree plan and paste it below. Semester headings help FourSight place each course.</p>` +
      `<textarea id="cfBox" spellcheck="false" placeholder="${esc(PASTE_EXAMPLE)}"></textarea>` +
      `<div class="m-actions"><button class="btn ghost" id="cfCancel">Cancel</button><button class="btn primary" id="cfGo">Build my plan</button></div>`);
    $('cfBox').focus();
    $('cfCancel').addEventListener('click', closeModal);
    $('cfGo').addEventListener('click', () => { const text = $('cfBox').value; if (text.trim()) importCurriculum(text, id); });
  }
  const PASTE_EXAMPLE = 'Fall Semester\nCHEM 1311   General Chemistry I   3\nMATH 2413   Calculus I   4\n\nSpring Semester\nMATH 2414   Calculus II   4   Prerequisite: MATH 2413';

  // ---- the steps
  const WSTEPS = {
    school: () =>
      `<p class="wc-kicker">Plan every semester in one view</p>` +
      `<h1 id="wcTitle">Do you attend the University of Texas at Austin?</h1>` +
      `<div class="wc-choices">` +
      choice('ut', WICON.tower, 'Yes, I’m at UT Austin', 'Start from your major’s degree plan, or build your own.') +
      choice('other', WICON.globe, 'No, I go to another school', 'Bring your school’s curriculum, or start from scratch.') +
      `</div>`,
    ut: () => backBtn() +
      `<p class="wc-kicker">UT Austin</p><h1 id="wcTitle">How would you like to start?</h1>` +
      `<div class="wc-choices">` +
      choice('major', WICON.template, 'Load a degree template', 'Your major’s suggested eight-semester plan, with every required course and prerequisite already in place.') +
      choice('ut-blank', WICON.blank, 'Start with an empty plan', 'Eight empty semesters. Add your own courses and arrange them however you like.') +
      `</div>`,
    major: () => {
      const saved = (id) => { try { return !!localStorage.getItem(`dp.plan.${id}`); } catch (_) { return false; } };
      const tag = (id) => (saved(id) ? '<span class="wc-saved">Saved plan</span>' : '');
      return backBtn() +
        `<p class="wc-kicker">Cockrell School of Engineering · 2026–28 catalog</p><h1 id="wcTitle">Which degree are you pursuing?</h1>` +
        `<div class="wc-majors">` + window.FS.order.map((o) => (o.group
          ? `<div class="wc-major wc-group"><strong>${esc(o.group)}</strong><small>${FSP[o.ids[0]].hours} hours · choose a concentration</small><div class="wc-concs">` +
            o.ids.map((id) => `<button class="wc-conc" data-major="${id}">${esc(FSP[id].concentration)}${tag(id)}</button>`).join('') + `</div></div>`
          : `<button class="wc-major" data-major="${o.id}"><strong>${esc(FSP[o.id].name)}</strong><small>${FSP[o.id].hours} hours</small>${tag(o.id)}</button>`)).join('') +
        `</div>`;
    },
    other: () => backBtn() +
      `<p class="wc-kicker">Any college or university</p><h1 id="wcTitle">How would you like to start?</h1>` +
      `<div class="wc-choices">` +
      choice('upload', WICON.upload, 'Upload your curriculum', 'A PDF, text or CSV file of your degree plan. FourSight reads it on this device and lays out your courses by semester.',
        '<em class="wc-drop">or drop the file anywhere on this page</em>') +
      choice('blank', WICON.blank, 'Start with a blank plan', 'Eight empty semesters. Add each course with its number, name and credit hours.') +
      `</div><button class="wc-link" data-go="paste">Or paste the text of your curriculum</button>`,
    paste: () => backBtn() +
      `<h1 id="wcTitle">Paste your curriculum</h1>` +
      `<p class="wc-sub">Copy the course list from your degree plan. Semester headings like “Fall Semester” or “Year 2 Spring” help FourSight place each course.</p>` +
      `<textarea class="wc-paste" id="wcPaste" spellcheck="false" placeholder="${esc(PASTE_EXAMPLE)}"></textarea>` +
      `<div class="wc-actions"><button class="btn primary wc-go" id="wcPasteGo">Build my plan</button></div>`,
    chains: () => backBtn() +
      `<p class="wc-kicker">Prerequisite chains</p><h1 id="wcTitle">How should FourSight connect your prerequisites?</h1>` +
      `<div class="wc-choices">` +
      choice('chains-file', WICON.flow, 'Upload a prerequisite flowchart', 'After your curriculum, add your department\u2019s prerequisite flowchart or course descriptions. FourSight reads which courses lead to which and draws the chains.') +
      choice('chains-self', WICON.link, 'Build the chains yourself', 'Your courses go in place first. Link each course to the ones it needs from its Edit menu.') +
      `</div><p class="wc-note">Either way, you\u2019ll choose your curriculum file next. Prerequisites written in the curriculum itself are always used.</p>`,
    flowchart: ({ count, error }) =>
      `<p class="wc-kicker">Step 2 of 2</p><h1 id="wcTitle">${error ? 'That flowchart didn\u2019t work' : 'Now add your prerequisite flowchart'}</h1>` +
      `<p class="wc-sub">${error ? esc(error) : `Your ${count} courses are in place. Choose the flowchart that shows which courses lead to which: a PDF of course boxes with arrows or prerequisite notes, or course descriptions with \u201cPrerequisite:\u201d lines.`}</p>` +
      `<div class="wc-actions"><button class="btn" data-go="skip-flowchart">Skip, I\u2019ll build them myself</button>` +
      `<button class="btn primary wc-go" data-go="pick-flowchart">${WICON.flowSmall}Choose flowchart file</button></div>` +
      `<p class="wc-note right">or drop the file anywhere on this page</p>`,
    reading: ({ name, flowchart }) =>
      `<div class="wc-reading"><span class="wc-spin" aria-hidden="true"></span><h1 id="wcTitle">Reading ${esc(name)}…</h1>` +
      `<p class="wc-sub">${flowchart ? 'Finding which courses lead to which' : 'Finding courses, credit hours, prerequisites and semesters'}. Nothing leaves your device.</p></div>`,
    failed: ({ msg }) => backBtn() +
      `<h1 id="wcTitle">That file didn’t work</h1><p class="wc-sub">${esc(msg)}</p>` +
      `<div class="wc-actions"><button class="btn" data-go="paste">Paste text instead</button><button class="btn" data-go="blank">Start with a blank plan</button>` +
      `<button class="btn primary wc-go" data-go="retry">Choose another file</button></div>`,
    existing: ({ n, id }) => backBtn() +
      `<h1 id="wcTitle">You already have a plan here</h1>` +
      `<p class="wc-sub">Your saved ${id === 'mine-ut' ? 'UT ' : ''}plan has ${n} course${n === 1 ? '' : 's'}` +
      `${FSP[id] && FSP[id].def && FSP[id].def.source ? ` from ${esc(FSP[id].def.source)}` : ''}. Starting over replaces it, including its check-offs.</p>` +
      `<div class="wc-actions"><button class="btn" data-go="replace">Start over</button><button class="btn primary wc-go" data-go="open-own">Open my saved plan</button></div>`,
  };
  // The paste step's button is wired here because it reads the textarea.
  $('wcStage').addEventListener('click', (ev) => {
    if (ev.target.closest('#wcPasteGo')) {
      const text = $('wcPaste').value;
      if (text.trim()) askReplace('mine', () => importCurriculum(text, 'mine'));
    }
  });
  // Dropping a file on the welcome screen uploads it as a curriculum.
  $('welcome').addEventListener('dragover', (ev) => { ev.preventDefault(); $('welcome').classList.add('drop'); });
  $('welcome').addEventListener('dragleave', (ev) => { if (ev.target === $('welcome')) $('welcome').classList.remove('drop'); });
  $('welcome').addEventListener('drop', (ev) => {
    ev.preventDefault(); $('welcome').classList.remove('drop');
    const file = ev.dataTransfer.files[0];
    if (!file) return;
    if (W.step === 'flowchart') return importFlowchart(file);
    const id = W.step === 'ut' || W.step === 'major' ? 'mine-ut' : 'mine';
    askReplace(id, () => importCurriculum(file, id));
  });

  // ---------------------------------------------------------------- boot
  // First launch (nothing saved yet) opens the welcome screen over ChE; it is only remembered once the student
  // picks a starting point.
  let startProgram = null, started = false;
  try { startProgram = localStorage.getItem('dp.program'); started = !!localStorage.getItem('dp.started'); } catch (_) { /* ignore */ }
  const firstRun = !startProgram && !started;
  selectProgram(startProgram || 'che', { remember: !firstRun });
  if (firstRun) showWelcome({ first: true });
  else try { localStorage.setItem('dp.started', '1'); } catch (_) { /* ignore */ }

  // Debug handle for testing.
  window.__dp = { importText, revertToSuggested, showWelcome, importCurriculum, startOwn, selectProgram, S, analyze, EDGES, ALL_EDGES, edgeBroken, rectOf, scroller, toggleDone, addSummer, addRegular, removeTerm, lateFrom,
    toggleTerm, minors: { removeCard: removeMinorCard, load: loadMinors, choose: chooseMinor, request: requestMinorCourse, add: addMinorCourses, prereqPlan, planIdFor, remove: removeMinor, data: () => MN } };
})();
