// ChE Degree Planner prototype.
//
// Geometry note: every position used for drawing lines is in TRACK-LOCAL coordinates, built from
// offsetLeft/offsetTop plus the animation offsets this file applies itself (FLIP slides and the
// elastic column drift). Nothing reads getBoundingClientRect for line drawing, so transforms never
// knock the lines out of alignment with the cards.
(() => {
  'use strict';

  const C = window.COURSES;
  const CATS = window.CATEGORIES;
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
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
  };

  // ---------------------------------------------------------------- state
  const S = {
    role: null,
    studentId: null,
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
    drag: null,
  };

  const ALL_EDGES = [];    // every requirement in the catalog: { id, from, to, type: 'pre' | 'co' }
  for (const [id, c] of Object.entries(C)) {
    for (const p of c.pre || []) if (C[p]) ALL_EDGES.push({ id: `${p}>${id}`, from: p, to: id, type: 'pre' });
    for (const p of c.co || []) if (C[p]) ALL_EDGES.push({ id: `${p}~${id}`, from: p, to: id, type: 'co' });
  }

  // Lines actually drawn: the transitive reduction. A requirement A -> C is left out when a chain
  // A -> B -> ... -> C already implies it. A strict prerequisite is only implied by a chain that
  // contains at least one strict prerequisite (a chain of co-requisites allows the same semester).
  // Because the chain implies the hidden requirement, the hidden one can never break unless a line
  // on its chain breaks too, so conflicts always show up as a red line somewhere.
  // Edges are removed one at a time and each check only uses lines still kept, so the drawn
  // set always implies everything hidden (this matters for co-requisite pairs, which form loops).
  // Strict prerequisites are considered before co-requisites so the short co-req links stay.
  const EDGES = (() => {
    const kept = ALL_EDGES.slice();
    const order = ALL_EDGES.slice().sort((a, b) => (a.type === b.type ? 0 : a.type === 'pre' ? -1 : 1));
    for (const e of order) {
      const others = kept.filter((f) => f !== e);
      if (impliedByChain(e, others)) kept.splice(kept.indexOf(e), 1);
    }
    return ALL_EDGES.filter((e) => kept.includes(e));
  })();
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
  function defaultTerms() {
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

  function stateFor(studentId) {
    try {
      const saved = JSON.parse(localStorage.getItem(`dp.plan.${studentId}`) || 'null');
      if (validState(saved)) {
        return {
          terms: saved.terms, plan: saved.plan, done: new Set(saved.done || []),
          credit: new Set(saved.credit || []), taken: saved.taken || {}, prior: saved.prior || [],
          fromTranscript: new Set(saved.fromTranscript || []), transcript: saved.transcript || null,
        };
      }
    } catch (_) { /* storage unavailable */ }
    const plan = clone(window.SUGGESTED_PLAN);
    const demo = window.DEMO_STUDENTS.find((d) => d.id === studentId);
    for (const [id, sem] of demo ? demo.moves : []) moveCourse(plan, id, sem, plan[sem].length);
    const done = new Set(plan.slice(0, demo ? demo.doneTerms || 0 : 0).flat());
    return { terms: defaultTerms(), plan, done, ...emptyTranscript() };
  }
  const emptyTranscript = () => ({ credit: new Set(), taken: {}, prior: [], fromTranscript: new Set(), transcript: null });
  function validState(st) {
    if (!st || !Array.isArray(st.terms) || !Array.isArray(st.plan) || st.terms.length !== st.plan.length) return false;
    const ids = st.plan.flat();
    // Every required course must be placed once; the optional CHE 102 may be left out.
    return ids.every((id) => C[id]) && new Set(ids).size === ids.length &&
      Object.keys(C).every((id) => C[id].optional || ids.includes(id));
  }
  function save() {
    try {
      localStorage.setItem(`dp.plan.${S.studentId}`, JSON.stringify({
        terms: S.terms, plan: S.plan, done: [...S.done], credit: [...S.credit], taken: S.taken, prior: S.prior,
        fromTranscript: [...S.fromTranscript], transcript: S.transcript,
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
  function edgeBroken(plan, e) {
    const a = semOf(plan, e.from), b = semOf(plan, e.to);
    return e.type === 'pre' ? a >= b : a > b;
  }
  function analyze(plan) {
    const broken = new Set(), badCourses = new Set(), late = new Set();
    for (const e of EDGES) if (edgeBroken(plan, e)) { broken.add(e.id); badCourses.add(e.to); }
    plan.forEach((sem, i) => sem.forEach((id) => { if (i >= lateFrom(C[id].latest)) late.add(id); }));
    return { broken, badCourses, late };
  }
  const hours = (sem) => sem.reduce((n, id) => n + C[id].hrs, 0);

  // ---------------------------------------------------------------- DOM refs
  const viewport = $('viewport'), track = $('track'), columnsEl = $('columns'), edgesG = $('edges');
  const svg = $('lines'), svgTop = $('linesTop'), edgesTopG = $('edgesTop'), bandsEl = $('bands');
  const cardEl = {};       // id -> element
  const colEl = [];        // column elements
  const pathEl = {};       // edge id -> path

  // ---------------------------------------------------------------- login
  document.querySelectorAll('.role').forEach((b) => b.addEventListener('click', () => signIn(b.dataset.role)));
  $('signOut').addEventListener('click', () => {
    try { sessionStorage.removeItem('dp.role'); } catch (_) { /* ignore */ }
    closeDrawer(); $('issues').hidden = true;
    $('app').hidden = true; $('login').hidden = false;
  });

  function signIn(role) {
    S.role = role;
    try { sessionStorage.setItem('dp.role', role); } catch (_) { /* ignore */ }
    $('login').hidden = true; $('app').hidden = false;
    $('rolePill').textContent = role === 'advisor' ? 'Advisor' : 'Student';
    $('studentPicker').hidden = role !== 'advisor';
    if (role === 'advisor') {
      const sel = $('studentSelect');
      sel.innerHTML = window.DEMO_STUDENTS.map((d) => `<option value="${d.id}">${d.name} (${d.year})</option>`).join('');
      loadStudent(sel.value);
    } else {
      loadStudent('me');
    }
  }
  $('studentSelect').addEventListener('change', (e) => loadStudent(e.target.value));

  function loadStudent(id) {
    S.studentId = id;
    const st = stateFor(id);
    S.terms = st.terms; S.plan = st.plan; S.done = st.done;
    S.credit = st.credit; S.taken = st.taken; S.prior = st.prior; S.fromTranscript = st.fromTranscript; S.transcript = st.transcript;
    renderDock();
    S.selected = null; closeDrawer(); $('issues').hidden = true;
    $('who').innerHTML = S.role === 'advisor' ? '' : 'Your plan: <strong>B.S. Chemical Engineering</strong>';
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
        `<span><svg viewBox="0 0 26 10"><path d="M1 5h22" stroke="var(--bad)" stroke-width="2.4" stroke-dasharray="6 4"/></svg>Broken chain</span>` +
      `</div>`;

    const drop = $('typedrop'), btn = $('tdBtn');
    const setOpen = (open) => { drop.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', (ev) => { ev.stopPropagation(); setOpen(!drop.classList.contains('open')); });
    document.addEventListener('click', (ev) => { if (!drop.contains(ev.target)) setOpen(false); });
    window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') setOpen(false); });
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
          `<div class="prior-chip" title="Counts as a prerequisite, not toward the 129 hours">` +
          `<b>${pc.code}</b><span>${pc.grade === 'CR' ? 'AP credit (CR)' : pc.grade ? `Grade ${pc.grade}` : 'In progress'}: prerequisite credit</span></div>`).join('');
      if (t.kind === 'spring' && (!S.terms[i + 1] || S.terms[i + 1].kind !== 'summer')) {
        const add = document.createElement('button');
        add.className = 'add-summer';
        add.innerHTML = `${ICON.plus}Summer ${t.year}`;
        add.title = `Add a summer term after ${termName(t)}`;
        add.addEventListener('click', () => addSummer(i));
        col.appendChild(add);
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
        `<span class="right"><span class="hrs">${c.hrs} hr</span><button class="check" aria-label="Mark ${c.code} complete">${ICON.tick}</button></span></div>` +
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
      el.addEventListener('mouseenter', () => { if (!S.drag) { S.hover = id; paint(); } });
      el.addEventListener('mouseleave', () => { if (S.hover === id) { S.hover = null; paint(); } });
      cardEl[id] = el;
      delay = Math.max(delay, si * 70 + k * 35);
    }));

    for (const e of EDGES) {
      const p = document.createElementNS(svgNS, 'path');
      p.classList.add('edge', e.type);
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
      sem.forEach((id) => body.appendChild(cardEl[id]));
    });
  }

  // Classes and counters that depend on the plan's validity or on hover.
  function paint() {
    const { broken, badCourses, late } = analyze(S.plan);
    const lit = S.hover || S.selected ? chainOf(S.hover || S.selected) : null;

    const cat = !lit && S.catFocus;
    for (const [id, el] of Object.entries(cardEl)) {
      el.classList.toggle('bad', badCourses.has(id));
      el.classList.toggle('late', late.has(id));
      el.classList.toggle('dim', lit ? !lit.cards.has(id) : !!cat && C[id].cat !== cat);
      el.classList.toggle('lit', !!lit && lit.cards.has(id));
      el.classList.toggle('selected', S.selected === id);
      el.classList.toggle('done', S.done.has(id));
      el.querySelector('.check').setAttribute('aria-pressed', S.done.has(id));
    }
    for (const e of EDGES) {
      const p = pathEl[e.id];
      const bad = broken.has(e.id);
      const isLit = !!lit && lit.edges.has(e.id);
      p.classList.toggle('bad', bad);
      p.classList.toggle('lit', isLit && !bad);
      p.classList.toggle('dim', lit ? !isLit : !!cat && !(C[e.from].cat === cat && C[e.to].cat === cat));
      p.setAttribute('marker-end', `url(#${bad ? 'arrowBad' : isLit ? 'arrowLit' : 'arrow'})`);
      // Broken edges move to a layer above the cards so they are never hidden.
      const layer = bad ? edgesTopG : edgesG;
      if (p.parentNode !== layer) layer.appendChild(p);
    }

    S.plan.forEach((sem, i) => {
      const h = hours(sem);
      const el = colEl[i].querySelector('.col-hours');
      el.textContent = `${h} hrs`;
      el.classList.toggle('heavy', h > (S.terms[i].kind === 'summer' ? 14 : 18));
      const rm = colEl[i].querySelector('.term-remove');
      if (rm) { rm.disabled = sem.length > 0; rm.title = sem.length ? 'Move its courses out first' : 'Remove term'; }
      el.title = h > 18 ? 'Heavier than the suggested load' : '';
    });
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
    } else {
      st.className = 'status ok';
      st.innerHTML = `${ICON.ok}All prerequisites satisfied`;
    }
    if (!$('issues').hidden) renderIssues();
    renderAudit();
  }

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

    // Spread line endpoints over each card's edge so bundles do not stack on one pixel.
    const outPorts = {}, inPorts = {};
    for (const e of EDGES) {
      (outPorts[e.from] ||= []).push(e);
      (inPorts[e.to] ||= []).push(e);
    }
    const portY = (list, e, id, otherKey) => {
      const r = rects[id];
      const sorted = list.slice().sort((a, b) => rects[a[otherKey]].y - rects[b[otherKey]].y);
      const n = sorted.length, i = sorted.indexOf(e);
      const step = n > 1 ? Math.min(9, (r.h * 0.6) / (n - 1)) : 0;
      return r.y + r.h / 2 + (i - (n - 1) / 2) * step;
    };

    for (const e of EDGES) {
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
    if ($('app').hidden || ev.target.closest('select, input')) return;
    const colStep = colEl[1] ? localPos(colEl[1]).x - localPos(colEl[0]).x : 264;
    if (ev.key === 'ArrowRight') { scroller.target = scroller.target + colStep; ev.preventDefault(); }
    if (ev.key === 'ArrowLeft') { scroller.target = scroller.target - colStep; ev.preventDefault(); }
    if (ev.key === 'Escape') { closeDrawer(); $('issues').hidden = true; S.selected = null; paint(); }
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
    ghost.classList.remove('intro', 'dim', 'lit', 'placeholder', 'selected', 'pulse');
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
      const text = pc ? `${pc.code}: ${pc.grade === 'CR' ? 'AP credit (CR)' : pc.grade ? `grade ${pc.grade}` : 'in progress'} on your transcript` : (window.PRIOR_CREDIT[reqId] || reqId);
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
    const pre = (c.pre || []).map((p) => reqItem(p, !C[p] || semOf(S.plan, p) < sem));
    const co = (c.co || []).map((p) => reqItem(p, !C[p] || semOf(S.plan, p) <= sem, 'co-req'));
    const unlocks = ALL_EDGES.filter((e) => e.from === id).map((e) => {
      const ok = !edgeBroken(S.plan, e);
      return `<li class="${ok ? 'ok' : 'bad'}">${ok ? ICON.check : ICON.x}<button data-go="${e.to}">${C[e.to].code}</button>` +
        `${e.type === 'co' ? '<span class="tag">co-req</span>' : ''}<span class="sem">${nameAt(semOf(S.plan, e.to))}</span></li>`;
    });
    const badPre = (c.pre || []).filter((p) => C[p] && semOf(S.plan, p) >= sem);
    const badCo = (c.co || []).filter((p) => C[p] && semOf(S.plan, p) > sem);
    let alerts = '';
    if (badPre.length || badCo.length) {
      const parts = [];
      if (badPre.length) parts.push(`${badPre.map((p) => C[p].code).join(', ')} must be completed in an earlier semester`);
      if (badCo.length) parts.push(`${badCo.map((p) => C[p].code).join(', ')} must be taken in the same semester or earlier`);
      alerts += `<div class="d-alert bad"><strong>Prerequisite chain broken.</strong> ${parts.join('; ')}.</div>`;
    }
    if (sem >= lateFrom(c.latest)) {
      alerts += `<div class="d-alert warn"><strong>Past the on-time limit.</strong> To graduate in four years, take ${c.code} no later than ${latestName(c.latest)}.</div>`;
    }
    const openPre = [...(c.pre || []), ...(c.co || [])].filter((p) => C[p] && !S.done.has(p));
    if (S.done.has(id) && openPre.length) {
      alerts += `<div class="d-alert warn">Marked complete, but ${openPre.map((p) => C[p].code).join(', ')} ${openPre.length === 1 ? 'is' : 'are'} not checked off yet.</div>`;
    }
    if (S.credit.has(id)) alerts += `<div class="d-alert credit"><strong>AP credit.</strong> Your transcript shows ${S.taken[id] || c.code} with a grade of CR (credit by exam), so this requirement is complete.</div>`;
    if (S.taken[id] && !S.credit.has(id)) alerts += `<div class="d-alert note">Filled by <strong>${S.taken[id]}</strong> from your transcript.</div>`;
    if (c.note) alerts += `<div class="d-alert note">${c.note}</div>`;
    if (c.optional) alerts += `<div class="d-alert note">Optional course. Students who skip it take 16 hours in their first fall instead.</div>`;

    $('drawerBody').innerHTML =
      `<div class="d-cat" style="color:var(--${c.cat})"><i style="background:var(--${c.cat})"></i>${CATS[c.cat].label}</div>` +
      `<div class="d-code">${c.code}</div><p class="d-title">${c.title}</p>` +
      `<button class="d-done${S.done.has(id) ? ' on' : ''}" id="dDone">${S.done.has(id) ? `${ICON.ok}Completed` : `${ICON.check}Mark as completed`}</button>` +
      `<div class="d-meta"><span>${c.hrs} credit hours</span><span>Planned: ${nameAt(sem)}</span><span>Latest on track: ${latestName(c.latest)}</span></div>` +
      alerts +
      `<h3>Requires</h3>${pre.length || co.length ? `<ul class="req">${pre.join('')}${co.join('')}</ul>` : '<p class="empty">No prerequisites.</p>'}` +
      `<h3>Leads to</h3>${unlocks.length ? `<ul class="req">${unlocks.join('')}</ul>` : '<p class="empty">Not a prerequisite for other required courses.</p>'}`;
    $('drawerBody').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => focusCourse(b.dataset.go, true)));
    $('dDone').addEventListener('click', () => toggleDone(id));
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
      items.push(`<li><button data-go="${e.to}"><b>${b.code}</b> needs <b>${a.code}</b>: ${e.type === 'pre' && sa === sb ? `they ${why}` : why}.</button></li>`);
    }
    const { late } = analyze(S.plan);
    for (const id of late) {
      items.push(`<li class="warn"><button data-go="${id}"><b>${C[id].code}</b> is planned for ${nameAt(semOf(S.plan, id))}. Take it by ${latestName(C[id].latest)} to stay on a four-year track.</button></li>`);
    }
    $('issuesList').innerHTML = items.join('') || '<li class="empty">No conflicts.</li>';
    $('issuesList').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => focusCourse(b.dataset.go, true)));
  }

  // ---------------------------------------------------------------- reset
  $('resetBtn').addEventListener('click', () => {
    revertToSuggested();
  });
  function revertToSuggested() {
    const before = snapshot();
    S.terms = defaultTerms();
    S.plan = clone(window.SUGGESTED_PLAN);
    // Undo everything the transcript set; check-offs made by hand stay.
    for (const id of S.fromTranscript) S.done.delete(id);
    Object.assign(S, emptyTranscript());
    rebuild(before, 650);
    renderDock();
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

  const REQUIRED = Object.keys(C).filter((id) => !C[id].optional);
  const REQ_HOURS = REQUIRED.reduce((n, id) => n + C[id].hrs, 0);

  function renderAudit() {
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
        const ids = REQUIRED.filter((id) => C[id].cat === k);
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
      $('dockRevert').addEventListener('click', () => { revertToSuggested(); });
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
    const r = window.Transcript.build(courses);
    const before = snapshot();
    for (const id of S.fromTranscript) S.done.delete(id);
    S.terms = r.terms; S.plan = r.plan;
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
    ignored: ['Not applicable', 'Does not count toward the ChE degree plan, left out of the flowchart'],
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
      `<p class="m-sub">Only courses that apply to the McKetta Chemical Engineering curriculum were added to your flowchart. ` +
      `${t.scheduled} remaining courses were scheduled into future terms in the department's suggested order, with every prerequisite respected.</p>` +
      `<div class="m-pills">${counts}</div>` +
      groups.map(([st, rows]) =>
        `<section class="m-group ${st}"><h3>${STATUS[st][0]}<small>${STATUS[st][1]}</small></h3><table>` +
        rows.map((x) => `<tr><td class="c">${esc(x.code)}</td><td class="t">${esc(titleCase(x.title))}</td><td class="when">${esc(x.term)}</td><td class="g">${esc(x.grade)}</td>` +
          `<td class="s">${x.slot && C[x.slot] && C[x.slot].code !== x.code ? `as ${esc(C[x.slot].code)}` : esc(x.status === 'ignored' || x.status === 'credit' ? (x.note && !x.slot ? x.note : '') : '')}</td></tr>`).join('') +
        `</table></section>`).join('') +
      `<div class="m-actions"><button class="btn ghost" id="mRevert">Revert to suggested plan</button><button class="btn primary" id="mDone">View my flowchart</button></div>`);
    $('mDone').addEventListener('click', closeModal);
    $('mRevert').addEventListener('click', () => { closeModal(); revertToSuggested(); });
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

  // ---------------------------------------------------------------- boot
  buildLegend();
  let savedRole = null;
  try { savedRole = sessionStorage.getItem('dp.role'); } catch (_) { /* ignore */ }
  if (savedRole === 'student' || savedRole === 'advisor') signIn(savedRole);

  // Debug handle for testing.
  window.__dp = { importText, revertToSuggested, S, analyze, EDGES, ALL_EDGES, edgeBroken, rectOf, scroller, toggleDone, addSummer, addRegular, removeTerm, lateFrom };
})();
