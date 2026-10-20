// Transcript import for FourSight. Everything runs in the browser: the file never leaves the device.
//
//   extractText(file)  -> plain text (PDF via pdf.js, otherwise read as text)
//   parse(text)        -> [{ code, subj, num, title, hrs, grade, term }]
//   build(courses)     -> { terms, plan, done, credit, taken, prior, report }
//
// Matching rules: a transcript course is only used when it fills a slot in the selected program
// (a required course, a core area, or an elective slot whose pool lists it). Anything else (for
// example KIN 310) is reported as ignored and left out of the flowchart.
// A CR grade means credit by exam (AP and similar); those courses go in an "AP / Credit by Exam"
// column before Fall 1.
(() => {
  'use strict';

  const C = window.COURSES;   // the selected program's live catalog (see app.js)
  const MAX_HOURS = 17;

  // ------------------------------------------------------------------ text extraction
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFJS;
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; resolve(window.pdfjsLib); };
      s.onerror = () => reject(new Error('Could not load the PDF reader. Check your internet connection, or paste the transcript text instead.'));
      document.head.appendChild(s);
    });
  }

  async function extractText(file) {
    const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
    if (!isPdf) return await file.text();
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const lines = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      // Rebuild visual lines: group text runs by their baseline, then order them left to right.
      const rows = new Map();
      for (const it of content.items) {
        if (!it.str || !it.str.trim()) continue;
        const y = Math.round(it.transform[5] / 2) * 2;
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push({ x: it.transform[4], w: it.width || 0, s: it.str });
      }
      [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, runs]) => {
        runs.sort((a, b) => a.x - b.x);
        let line = '', end = null;
        for (const r of runs) {
          if (end !== null) line += r.x - end > 12 ? '   ' : (r.x - end > 1 ? ' ' : '');
          line += r.s; end = r.x + r.w;
        }
        lines.push(line);
      });
    }
    return lines.join('\n');
  }

  // ------------------------------------------------------------------ parsing
  const GRADES = new Set(['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'CR', 'NC', 'P', 'S', 'U', 'W', 'Q', 'X', 'I']);
  const PASSING = new Set(['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'CR', 'P', 'S']);
  const SEASON = { FALL: 'fall', SPRING: 'spring', SUMMER: 'summer' };

  function parse(text) {
    const out = [];
    let term = null;
    for (let raw of text.split(/\r?\n/)) {
      let line = raw.replace(/\t|,|\|/g, '   ').replace(/\s+$/, '');
      if (!line.trim()) continue;

      // Section headers.
      const t = line.match(/\b(FALL|SPRING|SUMMER)\s+(?:SEMESTER\s+|TERM\s+)?((?:19|20)\d{2})\b/i) ||
                line.match(/\b((?:19|20)\d{2})\s+(FALL|SPRING|SUMMER)\b/i);
      const isCredit = /credit\s+by\s+exam|advanced\s+placement|\bAP\s+credit|test\s+credit|examination\s+credit|\bexam\s+credit/i.test(line);
      const course = line.match(/^\s*([A-Z]{1,4}(?:\s[A-Z]{1,2})?)\s?(\d{3}[A-Z]{0,2})\b(.*)$/);
      let lineTerm = null;
      if (t) {
        const [season, year] = /^\d/.test(t[1]) ? [t[2], t[1]] : [t[1], t[2]];
        lineTerm = { kind: SEASON[season.toUpperCase()], year: +year };
      }
      if (!course) {
        if (isCredit) term = { kind: 'credit' };
        else if (lineTerm) term = lineTerm;
        continue;
      }

      const subj = course[1].replace(/\s+/g, ' ').trim();
      const num = course[2];
      const rest = course[3];
      // Grade: the token right after the credit hours. Without an hours column, only a short
      // token set off by a wide gap counts, so a title ending in "I" (Organic Chemistry I) is
      // not mistaken for an Incomplete.
      const toks = rest.trim().split(/\s+/);
      const hIdx = toks.findIndex((x) => /^\d{1,2}(?:\.\d{1,2})?$/.test(x));
      let grade = null, hrs = null;
      if (hIdx >= 0) {
        hrs = Math.round(+toks[hIdx]);
        const g = (toks[hIdx + 1] || '').toUpperCase();
        if (GRADES.has(g)) grade = g;
      } else {
        const m = rest.match(/\s{2,}([A-Za-z][+-]?|CR|NC)\s*$/);
        if (m && GRADES.has(m[1].toUpperCase())) grade = m[1].toUpperCase();
      }
      if (!hrs) hrs = +num[0] || null;
      const title = (hIdx >= 0 ? toks.slice(0, hIdx) : toks.filter((x, i) => !(grade && i === toks.length - 1 && x.toUpperCase() === grade)))
        .join(' ').trim();
      out.push({
        code: `${subj} ${num}`, subj, num, title, hrs, grade,
        term: lineTerm || (grade === 'CR' ? { kind: 'credit' } : term),
      });
    }
    return out;
  }

  // ------------------------------------------------------------------ matching
  // Core areas are matched the same way in every program.
  const CORE_ALIASES = {
    'E 316K': 'E316', 'E 316L': 'E316', 'E 316M': 'E316', 'E 316N': 'E316', 'E 316P': 'E316',
    'UGS 302': 'UGS', 'UGS 303': 'UGS',
    'GOV 306C': 'GOV312', 'GOV 312L': 'GOV312', 'GOV 312P': 'GOV312',
  };
  const US_HISTORY = new Set(['HIS 314K', 'HIS 315G', 'HIS 315K', 'HIS 315L', 'HIS 317L', 'HIS 320R', 'HIS 333L', 'HIS 355N', 'HIS 356K', 'AMS 310', 'AMS 315']);
  const VAPA_SUBJ = new Set(['ARH', 'ART', 'ARD', 'MUS', 'T D', 'TD', 'F A', 'DAN', 'AET', 'RTF']);
  const SBS_SUBJ = new Set(['ANT', 'ECO', 'PSY', 'SOC', 'GRG', 'LIN']);
  const isUpperMath = (c) => c.subj === 'M' && +c.num.slice(1, 3) >= 20 && !['M 427J', 'M 427L'].includes(c.code);

  // What the selected program accepts: course codes (and "X or Y" aliases), outside prerequisites
  // and elective slots grouped by pool.
  function matcher(P) {
    const direct = {};
    for (const [id, c] of Object.entries(C)) {
      if (/^[A-Z ]+ \d{3}[A-Z]?$/.test(c.code)) direct[c.code] = id;
      for (const a of c.alias || []) direct[a] = direct[a] || id;
    }
    for (const [code, id] of Object.entries(CORE_ALIASES)) if (C[id]) direct[code] = id;
    const prior = new Set(Object.keys(P.prior || {}).map((id) => id.replace(/^([A-Z]+)(\d)/, '$1 $2')));
    const slots = {};
    for (const [id, c] of Object.entries(C)) if (c.pool && P.pools && P.pools[c.pool]) (slots[c.pool] ||= []).push(id);
    const pools = {};
    for (const [name, spec] of Object.entries(P.pools || {})) {
      pools[name] = { codes: new Set(spec.codes || []), upperMath: !!spec.upperMath, research: new Set(spec.research || []) };
    }
    return { direct, prior, slots, pools };
  }

  // Which plan slot a transcript course fills, given the slots already filled. Required courses
  // win first, then core areas, then elective pools.
  function slotFor(M, c, used, flags) {
    const d = M.direct[c.code];
    if (d) return C[d].code === c.code ? { id: d } : { id: d, as: c.code };
    if (M.prior.has(c.code)) return { prior: true };
    const freeOf = (...ids) => ids.find((id) => C[id] && !used.has(id));
    if (US_HISTORY.has(c.code)) { const h = freeOf('AMHIST', 'USHIST'); if (h) return { id: h, as: c.code }; }
    if (VAPA_SUBJ.has(c.subj) && freeOf('VAPA')) return { id: 'VAPA', as: c.code };
    if (SBS_SUBJ.has(c.subj) && freeOf('SBS')) return { id: 'SBS', as: c.code };
    let full = false;
    for (const [name, ids] of Object.entries(M.slots)) {
      const pool = M.pools[name];
      const math = pool.upperMath && isUpperMath(c) && !flags.math;
      if (!pool.codes.has(c.code) && !math) continue;
      if (pool.research.has(c.code) && flags.research) continue;
      const free = ids.find((id) => !used.has(id));
      if (!free) { full = true; continue; }
      if (math && !pool.codes.has(c.code)) flags.math = true;
      if (pool.research.has(c.code)) flags.research = true;
      return { id: free, as: c.code };
    }
    return full ? { full: true } : null;
  }

  // ------------------------------------------------------------------ building the plan
  const SEASON_ORDER = { spring: 0, summer: 1, fall: 2 };
  const acadYear = (t) => (t.kind === 'fall' ? t.year : t.year - 1);
  const termKey = (t) => (t.kind === 'credit' ? 'credit' : `${t.kind}-${t.year}`);
  const label = (t) => (!t ? 'Undated' : t.kind === 'credit' ? 'Credit by exam' : `${t.kind[0].toUpperCase()}${t.kind.slice(1)} ${t.year}`);

  function build(courses) {
    const P = window.FS_PROGRAM;
    const M = matcher(P);
    const SUGGESTED = P.plan;
    const isRegular = (t) => t.kind === 'fall' || t.kind === 'spring';
    // Suggested-plan index -> regular-term ordinal; a planned summer maps to the next fall.
    const sugTerms = P.terms || null;
    const regIndex = (s) => (sugTerms ? sugTerms.slice(0, s).filter(isRegular).length : s);
    const lastRegular = (sugTerms ? sugTerms.filter(isRegular).length : 8) - 1;
    const report = [];
    const dated = courses.filter((c) => c.term && c.term.kind !== 'credit');
    dated.sort((a, b) => a.term.year - b.term.year || SEASON_ORDER[a.term.kind] - SEASON_ORDER[b.term.kind]);
    const ordered = courses.filter((c) => !c.term || c.term.kind === 'credit').concat(dated);

    // 1. Decide which slot each transcript course fills.
    const used = new Set(), flags = {};
    const placedAt = {};          // course id -> term (from transcript)
    const done = new Set(), credit = new Set(), taken = {}, prior = [];
    for (const c of ordered) {
      const passing = c.grade && PASSING.has(c.grade);
      const inProgress = !c.grade;
      const entry = { code: c.code, title: c.title, term: label(c.term), grade: c.grade || 'In progress' };
      const slot = slotFor(M, c, new Set([...used].filter((id) => done.has(id) || placedAt[id])), flags);
      if (!slot) { report.push({ ...entry, status: 'ignored', note: 'Does not apply to this degree plan' }); continue; }
      if (slot.full) { report.push({ ...entry, status: 'ignored', note: 'Every elective slot it could fill is already filled' }); continue; }
      if (slot.prior) {
        if (passing || inProgress) prior.push({ code: c.code, title: c.title, term: c.term, grade: c.grade });
        report.push({ ...entry, status: c.grade === 'CR' ? 'credit' : passing ? 'applied' : inProgress ? 'progress' : 'notpassed', note: `Prerequisite credit (not part of the ${P.hours} hours)` });
        continue;
      }
      const id = slot.id;
      if (done.has(id)) { report.push({ ...entry, status: 'duplicate', slot: id, note: `${C[id].code} is already complete` }); continue; }
      if (!passing && !inProgress) {
        report.push({ ...entry, status: 'notpassed', slot: id, note: `Grade does not complete ${C[id].code}; it is scheduled again` });
        continue;
      }
      used.add(id);
      placedAt[id] = c.term && c.term.kind ? c.term : null;
      if (slot.as) taken[id] = slot.as;
      if (passing) done.add(id);
      if (c.grade === 'CR') credit.add(id);
      report.push({ ...entry, status: c.grade === 'CR' ? 'credit' : passing ? 'applied' : 'progress', slot: id });
    }

    // 2. Terms: AP column (if any credit), then every fall and spring from the first transcript
    //    year on, plus any summer the transcript actually has.
    const hasCredit = credit.size > 0 || prior.some((p) => p.grade === 'CR') ||
      Object.values(placedAt).some((t) => t && t.kind === 'credit');
    const datedTerms = [...Object.values(placedAt), ...prior.map((p) => p.term)].filter((t) => t && t.kind !== 'credit');
    const firstAcad = datedTerms.length ? Math.min(...datedTerms.map(acadYear)) : null;
    const lastAcad = datedTerms.length ? Math.max(...datedTerms.map(acadYear)) : null;
    const summers = new Set(datedTerms.filter((t) => t.kind === 'summer').map((t) => t.year));
    const terms = [];
    if (hasCredit) terms.push({ kind: 'credit', year: 0 });
    const yearOf = (acad) => (firstAcad === null ? 1 : acad - firstAcad + 1);
    const span = firstAcad === null ? 4 : Math.max(4, lastAcad - firstAcad + 1);
    for (let y = 1; y <= span; y++) {
      terms.push({ kind: 'fall', year: y }, { kind: 'spring', year: y });
      if (firstAcad !== null && summers.has(firstAcad + y)) terms.push({ kind: 'summer', year: y });
    }
    const indexOfTranscriptTerm = (t) => {
      if (!t || t.kind === 'credit') return hasCredit ? 0 : -1;
      const y = yearOf(acadYear(t));
      return terms.findIndex((x) => x.kind === t.kind && x.year === y);
    };

    // 3. Place transcript courses. Undated credit falls into the AP column, other undated
    //    courses into the first term.
    const pos = {};
    for (const [id, t] of Object.entries(placedAt)) {
      let i = indexOfTranscriptTerm(t);
      if (i < 0) i = terms.findIndex((x) => x.kind === 'fall');
      pos[id] = i;
    }
    for (const p of prior) p.index = Math.max(0, indexOfTranscriptTerm(p.term));
    const lastUsed = Math.max(-1, ...Object.values(pos), ...prior.map((p) => p.index));

    // 4. Schedule everything else from the first term after the transcript, keeping the
    //    department's suggested order, then push forward until every prerequisite holds and no
    //    future term goes over MAX_HOURS.
    const ensure = (i) => {
      while (terms.length <= i) {
        const regs = terms.filter(isRegular);
        const last = regs[regs.length - 1];
        terms.push(last.kind === 'fall' ? { kind: 'spring', year: last.year } : { kind: 'fall', year: last.year + 1 });
      }
    };
    const regularAtOrAfter = (i) => { ensure(i); while (!isRegular(terms[i])) { i++; ensure(i); } return i; };
    const ordinal = (n) => {
      let seen = -1;
      for (let i = 0; ; i++) { ensure(i); if (isRegular(terms[i]) && ++seen === n) return i; }
    };
    const firstFuture = regularAtOrAfter(lastUsed + 1);
    const order = {};
    SUGGESTED.forEach((sem, s) => sem.forEach((id, k) => { order[id] = s * 100 + k; }));
    const movable = new Set();
    SUGGESTED.forEach((sem, s) => sem.forEach((id) => {
      if (id in pos) return;
      // Optional first-semester course: if the transcript has no record of it, leave it out.
      if (C[id].optional && lastUsed >= 0) return;
      movable.add(id);
      pos[id] = Math.max(ordinal(regIndex(s)), firstFuture);
    }));

    const ALL = [];
    // A one-of requirement schedules after its first option, which is the safe choice.
    const first = (p) => (Array.isArray(p) ? p.find((o) => C[o]) : p);
    for (const [id, c] of Object.entries(C)) {
      for (const p of (c.pre || []).map(first)) if (C[p]) ALL.push({ from: p, to: id, type: 'pre' });
      for (const p of (c.co || []).map(first)) if (C[p]) ALL.push({ from: p, to: id, type: 'co' });
    }
    const settle = () => {
      for (let guard = 0, changed = true; changed && guard < 500; guard++) {
        changed = false;
        for (const e of ALL) {
          if (!movable.has(e.to)) continue;
          const need = e.type === 'pre' ? pos[e.from] + 1 : pos[e.from];
          if (pos[e.to] < need) { pos[e.to] = regularAtOrAfter(Math.max(need, firstFuture)); changed = true; }
        }
      }
    };
    settle();
    const outdeg = (id) => ALL.filter((e) => e.from === id).length;
    const slack = (id) => (C[id].latest ?? 7) * 10 + (['core', 'tech', 'alt'].includes(C[id].cat) ? 5 : 0) - outdeg(id);
    for (let guard = 0; guard < 400; guard++) {
      const load = {};
      for (const [id, i] of Object.entries(pos)) load[i] = (load[i] || 0) + C[id].hrs;
      const over = Object.keys(load).map(Number).filter((i) => i >= firstFuture && load[i] > MAX_HOURS).sort((a, b) => a - b)[0];
      if (over === undefined) break;
      const bump = Object.keys(pos).filter((id) => pos[id] === over && movable.has(id)).sort((a, b) => slack(b) - slack(a))[0];
      if (!bump) break;
      pos[bump] = regularAtOrAfter(over + 1);
      settle();
    }

    // 5. Drop empty trailing terms past Spring 4 and assemble the plan in suggested order.
    const lastNeeded = Math.max(...Object.values(pos), ...prior.map((p) => p.index), ordinal(lastRegular));
    terms.length = lastNeeded + 1;
    const plan = terms.map(() => []);
    Object.keys(pos).sort((a, b) => (order[a] ?? 999) - (order[b] ?? 999)).forEach((id) => plan[pos[id]].push(id));

    return {
      terms, plan, done, credit, taken,
      prior: prior.map((p) => ({ code: p.code, title: p.title, index: p.index, grade: p.grade })),
      report, scheduled: movable.size,
    };
  }

  window.Transcript = { extractText, parse, build, PASSING };
})();
