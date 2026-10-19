// Transcript import for FourSight. Everything runs in the browser: the file never leaves the device.
//
//   extractText(file)  -> plain text (PDF via pdf.js, otherwise read as text)
//   parse(text)        -> [{ code, subj, num, title, hrs, grade, term }]
//   build(courses)     -> { terms, plan, done, credit, taken, prior, report }
//
// Matching rules: a transcript course is only used when it fills a slot in the McKetta ChE
// curriculum (a required course, a core area, the chemistry elective or a tech elective).
// Anything else (for example KIN 310) is reported as ignored and left out of the flowchart.
// A CR grade means credit by exam (AP and similar); those courses go in an "AP / Credit by Exam"
// column before Fall 1.
(() => {
  'use strict';

  const C = window.COURSES;
  const SUGGESTED = window.SUGGESTED_PLAN;
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
  const DIRECT = {};
  for (const [id, c] of Object.entries(C)) if (/^[A-Z ]+ \d{3}[A-Z]?$/.test(c.code)) DIRECT[c.code] = id;
  Object.assign(DIRECT, {
    'E 316K': 'E316', 'E 316L': 'E316', 'E 316M': 'E316', 'E 316N': 'E316', 'E 316P': 'E316',
    'UGS 302': 'UGS', 'UGS 303': 'UGS',
    'GOV 306C': 'GOV312', 'GOV 312L': 'GOV312', 'GOV 312P': 'GOV312',
  });
  const PRIOR = { 'CH 301': 'Principles of Chemistry I' };
  const CHEM_ELECTIVE = new Set(['CH 431', 'CH 455', 'BCH 339F', 'BCH 369', 'CH 354', 'CH 354L', 'CH 354M', 'CH 367L', 'CH 371K', 'CH 367C', 'CH 368', 'CH 369K']);
  const US_HISTORY = new Set(['HIS 314K', 'HIS 315G', 'HIS 315K', 'HIS 315L', 'HIS 317L', 'HIS 320R', 'HIS 333L', 'HIS 355N', 'HIS 356K', 'AMS 310', 'AMS 315']);
  const VAPA_SUBJ = new Set(['ARH', 'ART', 'ARD', 'MUS', 'T D', 'TD', 'F A', 'DAN', 'AET', 'RTF']);
  const SBS_SUBJ = new Set(['ANT', 'ECO', 'PSY', 'SOC', 'GRG', 'LIN']);
  // From "McKetta Technical Electives, 2020-2028 catalogs".
  const TECH = new Set((
    'CHE 322M,CHE 323,CHE 337,CHE 339,CHE 339P,CHE 339T,CHE 341,CHE 342,CHE 343,CHE 344,CHE 355,CHE 356,CHE 357,CHE 359,' +
    'CHE 364S,CHE 376K,CHE 377K,CHE 377L,CHE 379,CHE 679HA,CHE 679HB,' +
    'ARE 323K,BME 352,BME 353,BME 365R,BME 377T,C E 341,C E 342,C E 364,C E 369L,C E 370K,ECE 334K,E E 334K,ECE 339,E E 339,' +
    'ECE 370K,E E 370K,ECE 374K,E E 374K,ECE 379K,E E 379K,E S 321G,E S 369N,M E 334,M E 335,M E 336P,M E 337C,M E 337G,' +
    'M E 348F,M E 349,M E 353,M E 354,M E 359,M E 361E,M E 363M,M E 366L,M E 374F,M E 374S,M E 379M,PGE 301,PGE 323K,' +
    'PGE 365,PGE 379,PGE 430,ACC 310F,BCH 339F,BCH 339J,BCH 339M,BCH 339N,BCH 364C,BCH 369,BCH 370,BIO 325,BIO 339,' +
    'CH 341,CH 354,CH 354L,CH 368,CH 376K,ECO 304K,ECO 304L,ECO 328,ECO 339K,ECO 351K,FIN 357,GEO 303E,I B 378,INB 365S,' +
    'BIO 365S,MAN 327,MBS 320,BIO 320,MBS 326R,BIO 326R,MIS 302F,MKT 320F,MKT 460,PHY 338K,PHY 355,PHY 375S'
  ).split(','));
  const RESEARCH = new Set(['CHE 377K', 'CHE 377L', 'E S 321G']);
  const isUpperMath = (c) => c.subj === 'M' && +c.num.slice(1, 3) >= 20 && !['M 427J', 'M 427L'].includes(c.code);

  // Which plan slot a transcript course fills, given the slots already filled. Required courses
  // win first, then core and chemistry elective slots, then tech electives.
  function slotFor(c, used, flags) {
    if (DIRECT[c.code]) return { id: DIRECT[c.code] };
    if (PRIOR[c.code]) return { prior: true };
    if (CHEM_ELECTIVE.has(c.code) && !used.has('CHEMEL')) return { id: 'CHEMEL', as: c.code };
    if (US_HISTORY.has(c.code)) {
      if (!used.has('AMHIST')) return { id: 'AMHIST', as: c.code };
      if (!used.has('USHIST')) return { id: 'USHIST', as: c.code };
    }
    if (VAPA_SUBJ.has(c.subj) && !used.has('VAPA')) return { id: 'VAPA', as: c.code };
    if (SBS_SUBJ.has(c.subj) && !used.has('SBS')) return { id: 'SBS', as: c.code };
    const tech = TECH.has(c.code) || (isUpperMath(c) && !flags.math);
    if (tech && !(RESEARCH.has(c.code) && flags.research)) {
      const free = ['TECH1', 'TECH2', 'TECH3', 'TECH4'].find((t) => !used.has(t));
      if (free) {
        if (isUpperMath(c)) flags.math = true;
        if (RESEARCH.has(c.code)) flags.research = true;
        return { id: free, as: c.code };
      }
      return { full: 'tech' };
    }
    return null;
  }

  // ------------------------------------------------------------------ building the plan
  const SEASON_ORDER = { spring: 0, summer: 1, fall: 2 };
  const acadYear = (t) => (t.kind === 'fall' ? t.year : t.year - 1);
  const termKey = (t) => (t.kind === 'credit' ? 'credit' : `${t.kind}-${t.year}`);
  const label = (t) => (!t ? 'Undated' : t.kind === 'credit' ? 'Credit by exam' : `${t.kind[0].toUpperCase()}${t.kind.slice(1)} ${t.year}`);

  function build(courses) {
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
      const slot = slotFor(c, new Set([...used].filter((id) => done.has(id) || placedAt[id])), flags);
      if (!slot) { report.push({ ...entry, status: 'ignored', note: 'Does not apply to the ChE degree plan' }); continue; }
      if (slot.full) { report.push({ ...entry, status: 'ignored', note: 'All four tech elective slots are already filled' }); continue; }
      if (slot.prior) {
        if (passing || inProgress) prior.push({ code: c.code, title: c.title || PRIOR[c.code], term: c.term, grade: c.grade });
        report.push({ ...entry, status: c.grade === 'CR' ? 'credit' : passing ? 'applied' : inProgress ? 'progress' : 'notpassed', note: 'Prerequisite for CH 302 (not part of the 129 hours)' });
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
    const isRegular = (t) => t.kind === 'fall' || t.kind === 'spring';
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
      pos[id] = Math.max(ordinal(s), firstFuture);
    }));

    const ALL = [];
    for (const [id, c] of Object.entries(C)) {
      for (const p of c.pre || []) if (C[p]) ALL.push({ from: p, to: id, type: 'pre' });
      for (const p of c.co || []) if (C[p]) ALL.push({ from: p, to: id, type: 'co' });
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
    const slack = (id) => (C[id].latest ?? 7) * 10 + (['core', 'tech', 'chem'].includes(C[id].cat) ? 5 : 0) - outdeg(id);
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
    const lastNeeded = Math.max(...Object.values(pos), ...prior.map((p) => p.index), ordinal(7));
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
