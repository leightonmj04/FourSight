// Curriculum and flowchart import for FourSight: reads a degree plan from any school and lays its courses out by
// semester, and reads a prerequisite flowchart into prerequisite chains. Everything runs in the browser; files
// never leave the device.
//
//   read(file)               -> rows: one array of cells { x, text } per line (PDF, text, CSV or TSV)
//   rowsFromText(text)       -> the same for pasted or plain text
//   parse(rows, opts)        -> { courses, plan, terms, school, program, count, hours, checks, ... }
//   readFlowchart(file|text) -> { relations: [{ from, to, type: 'pre' | 'co' | null }], codes }
//   parseMinor(rows)         -> a minor's name, total hours and requirement groups (see "minors" below)
//
// Curriculum files:
//   layout              catalog pages set in two newspaper columns are read one column at a time; superscript
//                       footnote markers ("Engineering Mathematics II ¹") are dropped; table cells that wrap onto
//                       a second line ("ENGL 103 / or ENGL 104", long titles) are joined back together
//   course numbers      "CHEM 1311", "CS 61A", "MATH-221", "C S 312", "M 408C", "Math 2413"; a number inside a
//                       sentence or footnote ("students take CHEM 119") is a mention, not a course
//   credit hours        "3", "(3)", "3 hrs", "3-4" (the larger), after the course
//   term headings       "Fall Semester", "First Year" + "Fall", "Semester 3", "Fall 2026", quarters, side-by-side
//                       columns; a "Semester Credit Hours 16" line closes its term
//   choices             "Select one of the following: 4" with its options becomes one course slot
//   totals              each term's stated hours fill in hours the file leaves out (CHEN 399 is 0 hours) and are
//                       checked against the courses found, as is "Total Program Hours 128"
//   prerequisites       "Prerequisite: MATH 2413", "Co-req: CHEM 1111", a Prerequisites column
//   electives           name-only lines inside a term, like "Technical Elective 3" or "University Core Curriculum"
// A file without term headings is spread evenly across eight semesters, each course after its prerequisites; a
// term over 21 hours is evened out the same way.
//
// Flowcharts: course boxes with the related course numbers in small shapes under them (the shape kinds are read
// from the chart's legend: PRE-REQ, CO-REQ), boxes joined by lines or arrows, and text such as
// "Prerequisite: CHEN 204", "CHEN 204 -> CHEN 205" or a Prerequisites column.
(() => {
  'use strict';

  const SEASON = { fall: 'fall', autumn: 'fall', winter: 'winter', spring: 'spring', summer: 'summer' };
  const SEASON_ORDER = { fall: 0, winter: 1, spring: 2, summer: 3 };
  const ORDINAL = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
    eleventh: 11, twelfth: 12,
  };
  const CLASS_YEAR = { freshman: 1, sophomore: 2, junior: 3, senior: 4 };
  const ordinal = (w) => {
    w = String(w).toLowerCase();
    if (ORDINAL[w]) return ORDINAL[w];
    const m = /^(\d{1,2})(?:st|nd|rd|th)?$/.exec(w);
    return m ? +m[1] : null;
  };
  const isPdf = (file) => /\.pdf$/i.test(file.name || '') || file.type === 'application/pdf';

  // ------------------------------------------------------------------ reading files
  const CHAR_W = 6; // plain text has no positions; columns of text line up by character, about 6 points each

  // Plain text: cells are separated by tabs or runs of two or more spaces.
  function rowsFromText(text) {
    return String(text).split(/\r?\n/).map((line) => {
      const cells = [];
      const re = /[^\t ]+(?: [^\t ]+)*/g;
      let m;
      while ((m = re.exec(line.replace(/\t/g, '    ')))) cells.push({ x: m.index * CHAR_W, text: m[0] });
      return cells;
    }).filter((cells) => cells.length);
  }

  // CSV and TSV: each column is a cell, spaced far enough apart that columns never merge.
  function rowsFromTable(text, sep) {
    const rows = [];
    let row = [], cell = '', quoted = false;
    const push = () => { row.push(cell); cell = ''; };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
      } else if (ch === '"' && !cell) quoted = true;
      else if (ch === sep) push();
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; push(); rows.push(row); row = []; }
      else cell += ch;
    }
    if (cell || row.length) { push(); rows.push(row); }
    return rows.map((r) => r.map((t, i) => ({ x: i * 200, text: t.trim() })).filter((c) => c.text)).filter((r) => r.length);
  }

  // Lines of positioned text runs, top to bottom. Runs on one baseline join into cells; a gap wider than about
  // three word spaces starts a new cell. Cells keep their left and right edges, baseline and type size.
  function buildRows(items) {
    const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    for (const it of sorted) {
      const row = rows[rows.length - 1];
      if (row && Math.abs(row.y - it.y) <= Math.max(1.5, it.h * 0.2)) row.items.push(it);
      else rows.push({ y: it.y, items: [it] });
    }
    return rows.map((r) => {
      r.items.sort((a, b) => a.x - b.x);
      const cells = [];
      let end = null;
      for (const it of r.items) {
        const gap = end === null ? Infinity : it.x - end;
        if (gap > Math.max(6, it.h * 0.8)) cells.push({ x: it.x, end: it.x + it.w, y: r.y, h: it.h, text: it.s });
        else {
          const c = cells[cells.length - 1];
          c.text += (gap > Math.max(1, it.h * 0.12) && !/\s$/.test(c.text) && !/^\s/.test(it.s) ? ' ' : '') + it.s;
          c.end = Math.max(c.end, it.x + it.w);
          c.h = Math.max(c.h, it.h);
        }
        end = Math.max(end ?? -Infinity, it.x + it.w);
      }
      for (const c of cells) c.text = c.text.replace(/\s+/g, ' ').trim();
      return cells.filter((c) => c.text);
    }).filter((cells) => cells.length);
  }

  // Footnote markers are small raised numbers ("1,4" after a title); they would read as credit hours.
  function dropFootnoteMarks(items) {
    const byHeight = {};
    for (const it of items) byHeight[it.h.toFixed(1)] = (byHeight[it.h.toFixed(1)] || 0) + it.s.length;
    const body = +Object.entries(byHeight).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    return items.filter((it) => !(it.h && it.h < body * 0.85 && /^[\d,*†‡§\s]{1,7}$/.test(it.s)));
  }

  // Catalog pages are often set in two columns of text. A clear vertical gutter in the middle of the page splits
  // it, and the left column is read before the right. Side-by-side semester tables ("Fall Semester | Spring
  // Semester" on one line) are one table, not two columns, and stay together.
  function splitColumns(items, width) {
    if (items.length < 30) return [items];
    // Bands of x positions in the middle of the page that almost no text crosses.
    const bands = [];
    let band = null;
    const room = Math.max(1, items.length * 0.01);
    for (let g = Math.round(width * 0.3); g <= Math.round(width * 0.7); g++) {
      const cross = items.filter((it) => it.x < g - 0.5 && it.x + it.w > g + 0.5).length;
      if (cross <= room) band = band ? { a: band.a, b: g } : { a: g, b: g };
      else if (band) { bands.push(band); band = null; }
    }
    if (band) bands.push(band);
    const rows = buildRows(items);
    const chars = (xs) => xs.reduce((n, it) => n + it.s.length, 0), total = chars(items);
    const isNum = (t) => /^\d{1,2}(?:\.\d)?(?:\s*[-–]\s*\d{1,2})?$/.test(t);
    // The gutter is the widest band that leaves real text on both sides, never splits a course from its hours
    // (the space between a title column and an hours column is not a gutter), and does not run through a
    // side-by-side semester table.
    for (const b of bands.filter((q) => q.b - q.a >= 4).sort((p, q) => (q.b - q.a) - (p.b - p.a))) {
      const g = (b.a + b.b) / 2;
      const left = items.filter((it) => it.x + it.w / 2 < g), right = items.filter((it) => it.x + it.w / 2 >= g);
      if (chars(left) < total * 0.2 || chars(right) < total * 0.2) continue;
      const both = rows.filter((r) => r.some((c) => c.end <= g) && r.some((c) => c.x >= g));
      const splitsHours = both.filter((r) => isNum(r.find((c) => c.x >= g).text)).length;
      if (both.length && splitsHours > both.length * 0.2) continue;
      if (rows.some((r) => r.some((c) => c.end <= g && heading(c.text)) && r.some((c) => c.x >= g && heading(c.text)))) return [items];
      return [left, right];
    }
    return [items];
  }

  // Running headers and footers ("Chemical Engineering - BS   1" at the top of every page) sit in the page
  // margins; they are not part of the plan.
  const inMargin = (it, pg) => it.y > pg.height - 46 || it.y < 30;

  function rowsFromPages(pages) {
    const out = [];
    for (const pg of pages) {
      const items = dropFootnoteMarks(pg.items.filter((it) => !inMargin(it, pg)));
      for (const part of splitColumns(items, pg.width)) out.push(...buildRows(part));
    }
    return out;
  }

  // Table cells that wrap onto a second line are joined back to the line above when every cell of the new line
  // sits under a cell above and the new line:
  //   finishes a course number   "CHEM" over "1310", "ENGR 216/" over "PHYS 216", "ENGL 103" over "or ENGL 104"
  //   continues titles           no course number or hours of its own, under a line that has hours, or under a
  //                              title that ends mid-phrase ("... Structure and" / "Function") or mid-parenthesis
  function joinWrapped(rows) {
    const out = [];
    const isNum = (t) => /^\d{1,2}(?:\.\d{1,2})?(?:\s*[-–]\s*\d{1,2})?$/.test(t.trim());
    const open = (t) => (t.match(/\(/g) || []).length > (t.match(/\)/g) || []).length;
    for (const row of rows) {
      const prev = out[out.length - 1];
      const under = prev && row.map((c) => prev.find((p) => c.x >= p.x - 6 && c.x <= (p.end ?? p.x) + 6));
      let join = false;
      if (under && under.every(Boolean)) {
        const rowNum = row.some((c) => isNum(c.text)), rowCode = row.some((c) => findCodes(c.text).length);
        const rowHead = row.some((c) => heading(c.text));
        const finishesCode = row.some((c, i) => /^\d{1,4}[A-Z]{0,2}$/.test(c.text.trim()) && /^[A-Z]{1,5}(?: [A-Z])?$/.test(under[i].text.trim()));
        const joinsCode = !rowNum && (row.some((c) => /^(or|&|and)\s/i.test(c.text.trim())) || under.some((p) => /[/&]$|\bor$/.test(p.text.trim())));
        const midPhrase = under.every((p) => !isNum(p.text)) && under.some((p) => open(p.text) || /\b(and|of|for|to|in|the|with|&)$|[-,/(]$/i.test(p.text.trim()));
        const lower = row.every((c) => /^[a-z(]/.test(c.text.trim()));
        const continuesTitles = !rowNum && !rowCode && !rowHead && (prev.some((p) => isNum(p.text)) || midPhrase || lower);
        join = finishesCode || joinsCode || continuesTitles;
      }
      if (join) {
        row.forEach((c, i) => {
          const p = under[i];
          p.text = /[a-z]-$/.test(p.text) ? p.text.slice(0, -1) + c.text : `${p.text} ${c.text}`;
          p.end = Math.max(p.end ?? p.x, c.end ?? c.x);
        });
      } else out.push(row.map((c) => ({ ...c })));
    }
    return out;
  }

  // A PDF can mix a drawn flowchart page with a semester table page (UT's "Suggested Arrangement of Courses"):
  // the table gives the plan and the chart its prerequisites. A PDF that is only a chart gives both. The rows
  // carry what else the file says: chart prerequisites (rows.relations) and where it is from (rows.utAustin,
  // rows.texas) for credit hours the file does not print.
  async function readPdf(file) {
    const pages = await window.Transcript.pdfPages(file, { shapes: true });
    const models = pages.map(chartModel);
    const text = pages.map((pg) => pg.items.map((it) => it.s).join(' ')).join(' ');
    const tables = pages.filter((pg, i) => !models[i].boxed && findCodes(pg.items.map((it) => it.s).join(' ')).length >= 5);
    let rows;
    if (tables.length) {
      rows = joinWrapped(rowsFromPages(tables));
      // A chart beside the table can name slots the table leaves out (its text may only carry course numbers).
      const extra = pages.flatMap((pg, i) => (models[i].boxed ? chartRows(models[i]) : []));
      if (extra.length) rows.supplement = extra;
    }
    else if (models.some((m) => m.boxed)) rows = pages.flatMap((pg, i) => (models[i].boxed ? chartRows(models[i]) : []));
    else rows = joinWrapped(rowsFromPages(pages));
    const codes = new Set();
    rows.relations = pages.flatMap((pg, i) => (models[i].boxed ? chartRelations(pg, codes, models[i]) : []));
    rows.fromChart = !tables.length && models.some((m) => m.boxed);
    rows.utAustin = /utexas\.edu|University of Texas at Austin|\bUT Austin\b|Cockrell/i.test(text);
    rows.texas = /\bTexas\b/i.test(text);
    return rows;
  }

  async function readRows(file) {
    const name = file.name || '';
    if (isPdf(file)) return rowsFromPages(await window.Transcript.pdfPages(file));
    if (/\.(docx?|pages|xlsx?|numbers|pptx?|key)$/i.test(name)) {
      throw new Error('FourSight reads PDF, text and CSV files. Save or export the file as a PDF or CSV and try again.');
    }
    if (/\.(png|jpe?g|gif|heic|webp)$/i.test(name) || /^image\//.test(file.type)) {
      throw new Error('That is a picture, and FourSight can only read text. Use the PDF from your department’s website, or paste the course list as text.');
    }
    const text = await file.text();
    if (/\.csv$/i.test(name) || file.type === 'text/csv') return rowsFromTable(text, ',');
    if (/\.tsv$/i.test(name)) return rowsFromTable(text, '\t');
    return rowsFromText(text);
  }
  // Only PDFs wrap table cells onto extra lines; a text or CSV line is already whole.
  const read = async (file) => (isPdf(file) ? readPdf(file) : readRows(file));

  // ------------------------------------------------------------------ course numbers
  // Subject: 2-5 capital letters (CHEM), spaced letters (C S, E M), a capitalized word (Math), or one capital
  // letter before a three-digit number (M 408C). Number: 1-4 digits with up to two letters (61A, 408C, 1311H, MATH 1A,
  // PWR 1); a single digit only after a capitalized subject.
  const CODE_RE = /(?<![A-Za-z0-9])([A-Z]{2,5}|[A-Z](?: [A-Z]){1,2}|[A-Z][a-z]{2,4}|[A-Z])(?:[  ]?[-.]?[  ]?)(\d{1,4}[A-Z]{0,2})(?![A-Za-z0-9])/g;
  // Words that look like a subject in front of a number but are not one ("Fall 2026", "Total 16", "Page 2").
  const NOT_SUBJECT = new Set(('FALL SPRING SUMMER WINTER AUTUMN YEAR YEARS YR TERM TERMS SEMESTER SEMESTERS QUARTER SESSION ' +
    'TOTAL TOTALS SUBTOTAL PAGE PG HOURS HOUR HRS HR CREDIT CREDITS CR UNITS UNIT SCH ROOM RM GPA AND OR OF THE FOR TO IN ' +
    'AT BY ON WITH FROM SECTION SEC STEP LEVEL GRADE CATALOG VERSION REV REVISED UPDATED EDITION MIN MAX MINIMUM ' +
    'MAXIMUM CUM NO NUM NUMBER PHONE FAX SUITE BOX ZIP AP IB SAT ACT WEEK WEEKS DAY DAYS ITEM FIGURE FIG TABLE ' +
    'CHAPTER PART OPTION PLAN GROUP LIST TRACK BLOCK SCORE EXAM AGE CLASS OF JAN FEB MAR APR MAY JUN JUL AUG SEP SEPT ' +
    'OCT NOV DEC JANUARY FEBRUARY MARCH APRIL JUNE JULY AUGUST SEPTEMBER OCTOBER NOVEMBER DECEMBER MON TUE WED THU ' +
    'FRI SAT SUN TEL EXT ID NOTE NOTES SEE ABOUT OVER UNDER ONLY ALL ANY EACH TAKE TAKEN USE US UT TX PO ST AVE RD ' +
    'FOOTNOTE APPENDIX ROW COLUMN COL LAB LEC II III IV VI VII VIII IX XI XII').split(' ')); // roman numerals end titles: "Calculus II 4"

  function findCodes(text) {
    const out = [];
    CODE_RE.lastIndex = 0;
    let m;
    while ((m = CODE_RE.exec(text))) {
      const subj = m[1], num = m[2];
      const upper = subj.toUpperCase();
      if (NOT_SUBJECT.has(upper.replace(/ /g, ''))) continue;
      const digits = num.replace(/[A-Z]+$/, '');
      if (subj.length === 1 && !/^\d{3}[A-Z]?$/.test(num)) continue;            // M 408C, not "A 12"
      if (/[a-z]/.test(subj) && digits.length < 3) continue;                     // "Math 2413", not "Page 12"
      if (digits.length === 1 && !/^[A-Z]{2,5}$/.test(subj)) continue;          // MATH 1A and PWR 1, not "Year 1"
      out.push({ index: m.index, end: m.index + m[0].length, code: `${upper.replace(/\s+/g, ' ')} ${num}`, subj: upper, num });
    }
    return out;
  }
  const normCode = (c) => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '');

  // ------------------------------------------------------------------ term headings
  // A heading is a short cell made only of term words: "Fall Semester", "First Year - Spring", "Semester 3",
  // "Fall 2026", "Freshman Year". Anything else ("Senior Design", "Summer field camp") is not a heading.
  const HEADING_WORDS = new Set(['fall', 'autumn', 'winter', 'spring', 'summer', 'semester', 'term', 'quarter', 'session',
    'year', 'yr', 'freshman', 'sophomore', 'junior', 'senior', 'of', 'the', 'academic', 'level', 'first-year', 'i', 'ii', 'iii', 'iv']);
  function heading(text) {
    const t = String(text).toLowerCase()
      .replace(/\(?\b\d{1,2}(?:\.\d)?\s*(?:-\s*\d{1,2}\s*)?(?:semester |credit |sch )?(?:hours?|hrs?\.?|credits?|units?|sch|cr)\b\.?\)?/g, ' ')
      .replace(/[–—:|(),.\-/]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t || t.split(' ').length > 6) return null;
    if (!/\b(fall|autumn|winter|spring|summer|semester|term|quarter|year|freshman|sophomore|junior|senior)\b/.test(t)) return null;
    const leftover = t.split(' ').filter((w) => !HEADING_WORDS.has(w) && ordinal(w) == null && !/^(19|20)\d{2}$/.test(w));
    if (leftover.length) return null;
    const h = { text: t, kind: null, year: null, cal: null, n: null, quarter: /\bquarter\b/.test(t) };
    let m;
    if ((m = t.match(/\b(fall|autumn|winter|spring|summer)\b/))) h.kind = SEASON[m[1]];
    if ((m = t.match(/\b((?:19|20)\d{2})\b/))) h.cal = +m[1];
    if ((m = t.match(/\b(?:year|yr) (\d)\b/)) || (m = t.match(/\b(\w+) year\b/))) h.year = ordinal(m[1]);
    if ((m = t.match(/\b(freshman|sophomore|junior|senior)\b/)) || (m = t.match(/\b(first)-year\b/))) h.year = CLASS_YEAR[m[1]] || 1;
    if (h.kind && !h.year && !h.cal && (m = t.match(/^(?:\w+ )?([1-8])$|^([1-8]) \w+$/))) h.year = +(m[1] || m[2]); // "Fall 1", "1 Fall"
    if ((m = t.match(/\b(?:semester|term|quarter) (\d{1,2})\b/)) || (m = t.match(/\b(\w+) (?:semester|term|quarter)\b/))) {
      const n = ordinal(m[1]);
      if (n && !h.kind) h.n = n;
    }
    if (h.year && h.year > 8) h.year = null;
    return h.kind || h.n || h.year ? h : null;
  }

  // Turns headings into terms ({ kind, year }), inferring years the file leaves out: a fall after a spring
  // starts a new year, "Fall 2026" counts from the first calendar year seen, "Semester 3" is Fall of year 2.
  function termTracker() {
    const terms = [];
    let yearCtx = null, last = null, baseCal = null, lastText = null, lastIndex = null;
    const indexOf = (kind, year) => {
      let i = terms.findIndex((t) => t.kind === kind && t.year === year);
      if (i < 0) { terms.push({ kind, year }); i = terms.length - 1; }
      last = { kind, year };
      return i;
    };
    return {
      terms,
      // Returns a term index, or null for a heading that only sets the year ("Sophomore Year").
      add(h) {
        // A table that repeats the term on every row ("Fall 1", "Fall 1", ...) stays in that term.
        if (h.text === lastText && lastIndex != null) return lastIndex;
        lastText = h.text;
        return (lastIndex = this.resolve(h));
      },
      resolve(h) {
        if (h.n && h.year && h.n <= (h.quarter ? 3 : 2)) {
          // "Year 2, Semester 1": the semester within that year.
          return indexOf(h.quarter ? ['fall', 'winter', 'spring'][h.n - 1] : (h.n === 2 ? 'spring' : 'fall'), h.year);
        }
        if (h.n) {
          const per = h.quarter ? 3 : 2, i = h.n - 1;
          const kind = per === 3 ? ['fall', 'winter', 'spring'][i % 3] : (i % 2 ? 'spring' : 'fall');
          return indexOf(kind, Math.floor(i / per) + 1);
        }
        if (!h.kind) { yearCtx = h.year; last = null; lastText = null; return null; }
        let year;
        if (h.year) year = h.year;
        else if (h.cal) {
          const start = h.kind === 'fall' ? h.cal : h.cal - 1; // the academic year that term belongs to
          if (baseCal == null) baseCal = start;
          year = Math.max(1, start - baseCal + 1);
        } else if (yearCtx && !(last && last.year === yearCtx && SEASON_ORDER[h.kind] <= SEASON_ORDER[last.kind])) year = yearCtx;
        else {
          year = last ? last.year : (yearCtx || 1);
          if (last && SEASON_ORDER[h.kind] <= SEASON_ORDER[last.kind]) year++;
          yearCtx = null;
        }
        return indexOf(h.kind, year);
      },
      // Courses listed right under a year heading with no season ("Freshman Year" then courses) go in a
      // whole-year block, split into fall and spring at the end.
      yearBlock() { return yearCtx ? indexOf('year', yearCtx) : null; },
    };
  }

  // ------------------------------------------------------------------ course lines
  const PREREQ_RE = /\b(pre-?req(?:uisite)?s?|co-?req(?:uisite)?s?|requires?|concurrent(?:ly)?(?: enrollment)?(?: in)?)\b\.?:?/i;
  const JUNK_RE = /\b(total|subtotal|summary|page|catalog|revised|updated|notes?|see|must|should|students?|advis\w*|minimum|maximum|gpa|graduation|degree|sequence|chart|flowchart|recommended|footnote|legend|key|semester hours|credit hours|hours|credits|units)\b/i;
  const NAME_ONLY_RE = /\b(electives?|core|curriculum|gen(?:eral)? ?ed(?:ucation)?|humanities|social|behavioral|history|government|politic\w*|arts?|literature|writing|composition|language|culture|cultural|diversity|ethics|communication|speech|science|lab|seminar|requirement|options?|selection|approved|free|capstone|design|internship|co-?op|wellness|physical education|kinesiology|signature|first-year|experience)\b/i;
  const HEADER_WORD_RE = /^(course|courses|course no\.?|course number|course #|number|no\.|title|course title|name|course name|description|hours|hrs|credits?|credit hours|semester credit hours|units|sch|cr|grade|prerequisites?|pre-?reqs?|co-?requisites?|co-?reqs?|semester|term|year|notes?|subject)$/i;
  const CHOICE_RE = /\b(?:select|choose|pick|take|complete)\b[^.]{0,30}?\b(?:one|1|two|2)\b|\bone of the following\b/i;
  const TOTAL_RE = /\b(total|subtotal)\b|^(?:semester|term|quarter|year)?\s*(?:credit|semester|sch)?\s*hours\b/i;

  // The number at the end of a cell; a range ("3-4", "15-16") counts as its larger end.
  const lastNumber = (text) => {
    const m = /(\d{1,3}(?:\.\d{1,2})?)(?:\s*[-–]\s*(\d{1,3}(?:\.\d{1,2})?))?\s*$/.exec(String(text).trim());
    return m ? Math.max(+m[1], +(m[2] || 0)) : null;
  };

  // Credit hours in a piece of text: "(3)", "3 hrs", "4 credits", "3-4", or a number at the end.
  function takeHours(text) {
    const pats = [
      /\(\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:cr\.?|credits?|hrs?\.?|hours?|units?|sch)?\s*\)/i,
      /(?:^|\s)(\d{1,2}(?:\.\d{1,2})?)\s*(?:-\s*\d{1,2}\s*)?(?:credit hours?|semester hours?|credits?|cr\.?|hrs?\.?|hours?|units?|sch|s\.c\.h\.)(?=\s|$|[.,;)])/i,
      /(?:^|\s)(\d{1,2})\s*[-–]\s*(\d{1,2})\s*$/,
      /(?:^|\s)(\d{1,2}(?:\.\d{1,2})?)\s*$/,
    ];
    for (const re of pats) {
      const m = re.exec(text);
      if (!m) continue;
      const hrs = Math.max(+m[1], +(m[2] || 0));
      if (hrs >= 0 && hrs <= 12) return { hrs, rest: (text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)).trim() };
    }
    return { hrs: null, rest: text };
  }
  const tidyTitle = (t) => String(t || '').replace(/^[\s\-–—:|.,;*•·]+|[\s\-–—:|.,;*•·]+$/g, '').replace(/\s+/g, ' ').trim();
  // Links in titles ("University Core Curriculum (https://catalog...)") are not part of the name.
  const stripLinks = (t) => String(t).replace(/\([^()]*(?::\/\/|www\.)[^()]*\)?/gi, ' ').replace(/\b(?:https?:\/\/|www\.)\S+/gi, ' ');

  // One cell -> tokens: code, text, num (credit hours), kw (a prerequisite keyword) and conn ("or", "/", "&").
  // A course number inside a sentence ("students take CHEM 119 or CHEM 107") is marked as a mention.
  function tokenize(cell) {
    const toks = [];
    const text = stripLinks(cell.text);
    const codes = findCodes(text);
    const pushText = (piece, offset) => {
      if (!piece.trim()) return;
      const conn = /^\s*(or|\/|&|and|either)\s*$/i.exec(piece);
      if (conn) { toks.push({ type: 'conn', and: /^(&|and)$/i.test(conn[1]), x: cell.x + offset * CHAR_W }); return; }
      const kw = PREREQ_RE.exec(piece);
      if (kw) {
        pushText(piece.slice(0, kw.index), offset);
        toks.push({ type: 'kw', co: /co-?req|concurrent/i.test(kw[0]), x: cell.x + (offset + kw.index) * CHAR_W });
        pushText(piece.slice(kw.index + kw[0].length), offset + kw.index + kw[0].length);
        return;
      }
      const { hrs, rest } = takeHours(piece);
      const t = tidyTitle(rest);
      if (t && /[A-Za-z]/.test(t)) toks.push({ type: 'text', text: t, x: cell.x + offset * CHAR_W });
      if (hrs != null) toks.push({ type: 'num', value: hrs, x: cell.x + offset * CHAR_W });
    };
    let at = 0, prevMention = false;
    codes.forEach((c, i) => {
      const before = text.slice(at, c.index);
      const words = before.replace(/\b(or|and|either)\b|[&/,;:()]/gi, ' ').trim().split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w));
      const hasHours = takeHours(before).hrs != null;
      const mention = i === 0 ? words.length >= 2 : (prevMention && !words.length) || (words.length >= 3 && !hasHours && !PREREQ_RE.test(before));
      pushText(before, at);
      toks.push({ type: 'code', code: c.code, subj: c.subj, num: c.num, mention, x: cell.x + c.index * CHAR_W });
      prevMention = mention;
      at = c.end;
      // "CHEM 1311/1111": a bare number right after a course number is part of it.
      const extra = /^\s*([/&+])\s*(\d{3,4}[A-Z]?)\b/.exec(text.slice(at));
      if (extra) { toks[toks.length - 1].code += `/${extra[2]}`; at += extra[0].length; }
      // "E 316L/M/N/P": the other letters of a numbered family are part of the number too.
      const family = /^(\/[A-Z])+(?![A-Za-z])/.exec(text.slice(at));
      if (family) { toks[toks.length - 1].code += family[0]; at += family[0].length; }
    });
    pushText(text.slice(at), at);
    return toks;
  }

  // "CHEM 227 & CHEM 237" -> "CHEM 227 & 237": a lecture and lab taken together as one slot.
  const joinAnd = (a, b) => {
    const sa = a.replace(/\s+\S+$/, ''), sb = b.replace(/\s+\S+$/, '');
    return sa === sb ? `${a} & ${b.slice(sb.length + 1)}` : `${a} & ${b}`;
  };

  // ------------------------------------------------------------------ parsing a curriculum
  function parse(rows, { ut = false } = {}) {
    ut = ut || !!rows.utAustin;
    const tracker = termTracker();
    const items = [];
    let columns = null;   // [{ x, term }] while side-by-side term columns are active
    let closed = false;   // after a term's total line and before the next heading: footnotes, not courses
    let group = null;     // a "Select one of the following" slot collecting its options
    const lastIn = {};    // column -> last item, for prerequisite lines under a course
    const preCols = [];   // x of "Prerequisites" / "Co-requisites" table columns: { x, co }
    const head = [];      // text near the top, for the school and program names
    const termTotals = {};
    let programTotal = null;

    const columnFor = (x) => {
      if (closed) return { col: 0, term: null };
      if (!columns) return { col: 0, term: tracker.yearBlock() };
      let best = 0;
      columns.forEach((c, i) => { if (c.x <= x + 40) best = i; });
      return { col: best, term: columns[best].term };
    };
    // A choice becomes one course: its first option with a course number, the others as alternatives.
    const closeGroup = () => {
      if (!group) return;
      const g = group;
      group = null;
      const opts = g.options.filter((o) => o.code || o.title);
      const first = opts.find((o) => o.code) || opts[0];
      const item = first ? { ...first, alts: [...first.alts], pre: [...first.pre], co: [...first.co] }
        : { code: '', alts: [], title: 'Choose one course', pre: [], co: [], nameOnly: true };
      for (const o of opts) if (o !== first) item.alts.push(o.code || tidyTitle(o.title));
      Object.assign(item, { term: g.term, col: g.col, hrs: g.hrs ?? (first && first.hrs), choice: true });
      items.push(item);
      lastIn[g.col] = item;
    };

    rows.forEach((cells, rowIndex) => {
      if (rowIndex < 40) head.push(cells.map((c) => c.text).join(' '));
      const rowText = cells.map((c) => c.text).join(' ').replace(/\s+/g, ' ').trim();
      const heads = cells.map((c) => ({ c, h: findCodes(c.text).length ? null : heading(c.text) })).filter((x) => x.h);
      const hasCode = cells.some((c) => findCodes(stripLinks(c.text)).length);

      // A table header row ("Course | Title | Credits | Prerequisites") marks its prerequisite columns.
      if (!hasCode && !heads.length && cells.filter((c) => HEADER_WORD_RE.test(c.text.trim())).length >= 2) {
        closeGroup();
        preCols.length = 0;
        for (const c of cells) if (/^(pre|co)-?req/i.test(c.text.trim())) preCols.push({ x: c.x, co: /^co/i.test(c.text.trim()) });
        return;
      }
      if (heads.length >= 2) {
        // Side-by-side terms: "Fall Semester    Spring Semester". Year-only cells ("Year 1   Year 2") just set context.
        closeGroup();
        closed = false;
        const cols = heads.map(({ c, h }) => ({ x: c.x, term: tracker.add(h) })).filter((c) => c.term != null);
        if (cols.length >= 2) columns = cols;
        else if (cols.length === 1) columns = [{ x: -Infinity, term: cols[0].term }];
        return;
      }
      if (heads.length === 1) {
        closeGroup();
        closed = false;
        const term = tracker.add(heads[0].h);
        if (term != null) columns = [{ x: -Infinity, term }];
        else columns = null; // a year heading: wait for its seasons
        if (cells.length === 1) return; // otherwise the rest of the row is a course ("Fall 1, , Reading and Composition, 4")
      }
      // "Semester Credit Hours 16" states its term's hours and ends the term; "Total Program Hours 128" the degree's.
      if (!hasCode && !heads.length && TOTAL_RE.test(rowText) && !(NAME_ONLY_RE.test(rowText) && !/\btotal\b/i.test(rowText)) && lastNumber(rowText) != null) {
        closeGroup();
        const values = cells.map((c) => ({ x: c.x, v: lastNumber(c.text) })).filter((v) => v.v != null);
        if (/\b(program|degree|graduat\w*|overall|grand|required for)\b/i.test(rowText)) programTotal = Math.max(programTotal || 0, ...values.map((v) => v.v));
        else for (const { x, v } of values) { const { term } = columnFor(x); if (v <= 24 && term != null && termTotals[term] == null) termTotals[term] = v; }
        closed = true;
        return;
      }
      // "Actual credit hours for the degree is 129", "129 credit hours" on its own.
      if (!hasCode && /\b(credit hours|semester hours|hours|credits|units)\b/i.test(rowText) && (/\b(degree|program|graduat\w*)\b/i.test(rowText) || /^\d{2,3}\s+(credit|semester)?\s*(hours|credits|units)$/i.test(rowText))) {
        const v = Math.max(...(rowText.match(/\b\d{2,3}\b/g) || []).map(Number).filter((n) => n >= 60 && n <= 200), 0);
        if (v) { programTotal = Math.max(programTotal || 0, v); return; }
      }
      // "Select one of the following: 3-4" starts a choice; the lines under it without hours are its options.
      if (!hasCode && CHOICE_RE.test(rowText)) {
        closeGroup();
        const { col, term } = columnFor(cells[0].x);
        const hrs = cells.map((c) => lastNumber(c.text)).filter((v) => v != null && v <= 12);
        group = { hrs: hrs.length ? Math.max(...hrs) : null, col, term, options: [] };
        return;
      }

      // Course cells. A sentence ("ME 2202 Dynamics of Rigid Bodies. Prerequisite: COE 2001.") describes a course
      // rather than placing one: its courses only add details to the same course in the plan.
      const prose = cells.length === 1 && cells[0].text.trim().split(/\s+/).length >= 6 && /[a-z)]\.(\s|$)/.test(cells[0].text);
      const cellToks = cells.filter((c) => !(heads.length === 1 && c === heads[0].c)).map((c) => ({ c, toks: tokenize(c) }));
      if (group && cellToks.some(({ toks }) => toks.some((t) => t.type === 'num'))) closeGroup();
      const sink = group ? group.options : items;
      let cur = null, kw = null, connector = null;
      for (const { c: cell, toks } of cellToks) {
        // A prerequisite keyword reaches the courses after it in its cell, or in the next cell when it stands
        // alone ("Prerequisite:" | "MATH 2413"); the next course cell after that is a new course.
        if (kw && (kw.used || columnFor(cell.x).col !== kw.col)) kw = null;
        const pc = preCols.find((q) => Math.abs(q.x - cell.x) < 40);
        if (pc) kw = { co: pc.co, col: columnFor(cell.x).col, used: false, target: cur };
        for (const tok of toks) {
          const { col, term: placedTerm } = columnFor(tok.x);
          const term = prose ? null : placedTerm;
          if (tok.type === 'kw') { kw = { co: tok.co, col, used: false, target: cur || lastIn[col] }; continue; }
          if (tok.type === 'conn') { connector = tok; continue; }
          if (tok.type === 'code') {
            if (kw && kw.target) { (kw.co ? kw.target.co : kw.target.pre).push(tok.code); kw.used = true; continue; }
            if (tok.mention) { connector = null; continue; }
            if (connector && cur && !cur.title) {
              if (connector.and) cur.code = joinAnd(cur.code, tok.code); else cur.alts.push(tok.code);
              connector = null;
              continue;
            }
            cur = { code: tok.code, subj: tok.subj, num: tok.num, alts: [], title: '', hrs: null, pre: [], co: [], term, col, row: rowIndex, prose };
            sink.push(cur);
            if (sink === items) lastIn[col] = cur;
            connector = null;
            continue;
          }
          if (tok.type === 'num') {
            if (cur && cur.hrs == null) cur.hrs = tok.value;
            continue;
          }
          // text
          const text = tok.text;
          connector = null;
          if (kw) continue; // words inside a prerequisite note ("and", "with a grade of C")
          if (cur && !cur.title && cur.hrs == null && !HEADER_WORD_RE.test(text)) { cur.title = text; continue; }
          if (JUNK_RE.test(text) && !NAME_ONLY_RE.test(text)) { cur = null; continue; }
          // A name-only course inside a term: "Technical Elective   3", "University Core Curriculum   3".
          const words = text.split(/\s+/).length;
          if (term != null && words <= 8 && !HEADER_WORD_RE.test(text) && (NAME_ONLY_RE.test(text) || (cur === null && /^[A-Z]/.test(text)))) {
            cur = { code: '', alts: [], title: text, hrs: null, pre: [], co: [], term, col, row: rowIndex, nameOnly: true, box: !!cells.box };
            sink.push(cur);
            if (sink === items) lastIn[col] = cur;
            continue;
          }
          if (cur && cur.title && cur.hrs == null && words <= 6) cur.title += ` ${text}`;
        }
      }
    });
    closeGroup();

    // Name-only lines need hours or a course-like name; anything else was a note.
    const kept = items.filter((it) => !it.nameOnly || it.box || it.hrs != null || NAME_ONLY_RE.test(it.title));

    // The same course mentioned again outside the semester layout (a course list or description section) adds
    // its details to the placed one instead of becoming a second card.
    const placed = kept.filter((it) => it.term != null);
    const byCode = new Map();
    for (const it of placed) if (it.code && !byCode.has(it.code)) byCode.set(it.code, it);
    const loose = [];
    for (const it of kept.filter((x) => x.term == null)) {
      const twin = it.code && byCode.get(it.code);
      if (twin) {
        twin.pre.push(...it.pre); twin.co.push(...it.co);
        if (!twin.title && it.title) twin.title = it.title;
        if (twin.hrs == null && it.hrs != null) twin.hrs = it.hrs;
      } else loose.push(it);
    }

    let terms = tracker.terms, skipped = [], list, byOrder = false;
    if (placed.length && placed.length >= loose.length) {
      list = placed;
      // Courses listed with hours outside every semester; mentions in sentences are not courses.
      skipped = loose.filter((it) => it.code && it.hrs != null && !it.prose).map((it) => it.code);
    } else {
      // No usable term headings: every course goes in, spread over eight semesters in the file's order.
      list = [];
      const seen = new Set();
      for (const it of kept) {
        if (it.prose) continue;
        const key = it.code || `#${it.title}`;
        if (it.code && seen.has(key)) continue;
        seen.add(key); it.term = null; list.push(it);
      }
      terms = [];
      byOrder = true;
    }

    // Hours: UT numbers carry them (CHE 333T is 3 hours); a term's stated total fills in the rest (a term listing
    // 17 hours of courses and a total of 17 makes CHEN 399 a 0-hour course); anything still unknown gets 3.
    for (const it of list) if (it.hrs == null && ut && /^\d{3}[A-Z]{0,2}$/.test(it.num || '')) it.hrs = Math.max(1, +it.num[0]);
    // Texas Common Course Numbering: the second digit of a four-digit number is the credit hours (CHEM 1311 is 3).
    const coded = list.filter((it) => it.num);
    if (rows.texas && coded.filter((it) => /^\d[1-6]\d\d[A-Z]?$/.test(it.num)).length >= coded.length * 0.6) {
      for (const it of coded) if (it.hrs == null && /^\d[1-6]\d\d[A-Z]?$/.test(it.num)) { it.hrs = +it.num[1]; it.fromNumber = true; }
    }
    for (const [t, total] of Object.entries(termTotals)) {
      const inTerm = list.filter((it) => it.term === +t);
      const missing = inTerm.filter((it) => it.hrs == null);
      const known = inTerm.reduce((n, it) => n + (it.hrs || 0), 0);
      const each = missing.length ? (total - known) / missing.length : null;
      if (missing.length && each >= 0 && each <= 6 && Number.isInteger(each * 2)) for (const it of missing) { it.hrs = each; it.fromTotal = true; }
    }
    let assumed = 0;
    for (const it of list) if (it.hrs == null) { it.hrs = 3; it.assumed = true; assumed++; }
    const checks = Object.entries(termTotals).map(([t, total]) => ({
      term: +t, file: total, found: list.filter((it) => it.term === +t).reduce((n, it) => n + it.hrs, 0),
    }));

    // Ids and course types.
    const courses = {}, idOf = new Map();
    for (const it of list) {
      const base = `F_${(it.code || it.title).toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 24) || 'COURSE'}`;
      let id = base;
      for (let n = 2; courses[id]; n++) id = `${base}_${n}`;
      it.id = id;
      const lead = it.code && findCodes(it.code)[0];
      for (const code of [it.code, lead && lead.code, ...String(it.code).split(/\s*&\s*|\//).slice(1).map((n) => (/^\d/.test(n) ? `${it.code.replace(/\s+\S+$/, '')} ${n}` : n)), ...it.alts]) {
        if (code && findCodes(code).length && !idOf.has(normCode(code))) idOf.set(normCode(code), id);
      }
      let title = tidyTitle(stripLinks(it.title));
      if (it.alts.length) title = `${title.replace(/\s+or\s+.*$/i, '')}${title ? ' ' : ''}(or ${it.alts.map((a) => tidyTitle(stripLinks(a))).join(', ')})`;
      const label = it.code || title;
      courses[id] = { code: label, title: it.code ? titleCase(title) : '', hrs: it.hrs, cat: category(it) };
      const aliases = [...it.alts.filter((a) => findCodes(a).length)];
      if (aliases.length) courses[id].aliases = aliases;
      if (it.assumed) courses[id].note = 'The credit hours were not in the file, so FourSight assumed 3. Click Edit to change them.';
      else if (it.fromTotal) courses[id].note = `The file gives no hours for this course; ${it.hrs} hours makes its semester match the file's total.`;
    }
    // Prerequisites: courses in the plan become lines; others are listed on the course as outside the plan.
    const prior = {};
    let prereqs = 0;
    for (const it of list) {
      const c = courses[it.id];
      for (const [field, codes] of [['pre', it.pre], ['co', it.co]]) {
        const ids = [];
        for (const code of new Set(codes)) {
          let ref = idOf.get(normCode(code));
          if (ref === it.id) continue;
          if (!ref) { ref = `EXT_${normCode(code)}`; prior[ref] = `${code}: not in this plan`; }
          if (!ids.includes(ref)) { ids.push(ref); prereqs++; }
        }
        if (ids.length) c[field] = ids;
      }
    }

    // Prerequisites drawn on a flowchart in the same file.
    for (const r of rows.relations || []) {
      const to = idOf.get(normCode(r.to)), from = idOf.get(normCode(r.from));
      if (!to || to === from) continue;
      const ref = from || `EXT_${normCode(r.from)}`;
      if (!from) prior[ref] = `${r.from}: not in this plan`;
      const field = r.type === 'co' ? 'co' : 'pre';
      const c = courses[to];
      if (!(c.pre || []).includes(ref) && !(c.co || []).includes(ref)) { (c[field] ||= []).push(ref); prereqs++; }
    }

    const out = layout(list, terms, courses, byOrder);
    const supplemented = supplement(rows, { ut, courses, out, idOf });
    const termIndex = new Map(out.order.map((orig, k) => [orig, k]));
    const meta = names(head);
    return {
      courses, plan: out.plan, terms: out.terms, prior, school: meta.school, program: meta.program,
      skipped: [...new Set(skipped)], assumed: assumed + supplemented.assumed, prereqs, count: list.length + supplemented.count,
      byOrder, balanced: out.balanced, fromChart: !!rows.fromChart, supplemented: supplemented.count,
      hours: Object.values(courses).reduce((n, c) => n + c.hrs, 0), programTotal,
      checks: checks.filter((c) => termIndex.has(c.term)).map((c) => ({ ...c, term: termIndex.get(c.term) })),
    };
  }

  // Courses from a chart in the same file that the table did not list ("SBS Core", "VAPA"), added to the same
  // season and year.
  function supplement(rows, { ut, courses, out, idOf }) {
    const res = { count: 0, assumed: 0 };
    if (!rows.supplement || !out.terms.length) return res;
    const sub = parse(Object.assign(rows.supplement, { utAustin: rows.utAustin, texas: rows.texas }), { ut });
    // "UGS 302/303" in the table and "UGS 302" on the chart are the same slot.
    const first = (code) => normCode(String(code).split(/\s*(?:\/|&|\bor\b)\s*/)[0]);
    const numbered = (c) => findCodes(c.code).length > 0;
    const have = new Set(Object.values(courses).filter(numbered).map((c) => first(c.code)));
    // Named slots can repeat (two Technical Electives): add as many as the table is short of.
    const slots = {};
    for (const c of Object.values(courses)) if (!numbered(c)) slots[c.code.toLowerCase()] = (slots[c.code.toLowerCase()] || 0) + 1;
    sub.plan.forEach((ids, k) => {
      const t = sub.terms[k];
      const at = out.terms.findIndex((x) => x.kind === t.kind && x.year === t.year);
      if (at < 0) return;
      for (const id of ids) {
        const c = sub.courses[id];
        if (!numbered(c)) { const k = c.code.toLowerCase(); if (slots[k] > 0) { slots[k]--; continue; } }
        else if (have.has(first(c.code))) {
          // The chart can name a course the table only numbers.
          const twin = Object.values(courses).find((q) => numbered(q) && first(q.code) === first(c.code));
          if (twin && !twin.title && c.title) twin.title = c.title;
          continue;
        }
        let nid = id;
        for (let n = 2; courses[nid]; n++) nid = `${id}_${n}`;
        const map = (list) => (list || []).map((p) => (sub.courses[p] ? idOf.get(normCode(sub.courses[p].code)) || p : p)).filter((p) => courses[p] || /^EXT_/.test(p));
        courses[nid] = { ...c, pre: map(c.pre), co: map(c.co) };
        if (!courses[nid].pre.length) delete courses[nid].pre;
        if (!courses[nid].co.length) delete courses[nid].co;
        out.plan[at].push(nid);
        have.add(first(c.code));
        res.count++;
        if (/assumed 3/.test(c.note || '')) res.assumed++;
      }
    });
    return res;
  }

  // Terms in time order with each course placed. Whole-year blocks split into fall and spring; files without
  // terms fill eight semesters of about equal hours, never before a course's prerequisites. Any semester over 21
  // hours is evened out with its neighbors (see balance).
  function layout(list, terms, courses, byOrder) {
    if (!byOrder && terms.length) {
      for (const t of terms) {
        if (t.kind !== 'year') continue;
        const inBlock = list.filter((it) => terms[it.term] === t);
        const total = inBlock.reduce((n, it) => n + it.hrs, 0);
        let run = 0;
        const fall = terms.findIndex((x) => x.kind === 'fall' && x.year === t.year);
        const spring = terms.findIndex((x) => x.kind === 'spring' && x.year === t.year);
        const fi = fall >= 0 ? fall : terms.push({ kind: 'fall', year: t.year }) - 1;
        const si = spring >= 0 ? spring : terms.push({ kind: 'spring', year: t.year }) - 1;
        for (const it of inBlock) { it.term = run < total / 2 ? fi : si; run += it.hrs; }
      }
      const order = terms.map((t, i) => ({ t, i })).filter(({ t }) => t.kind !== 'year')
        .sort((a, b) => a.t.year - b.t.year || SEASON_ORDER[a.t.kind] - SEASON_ORDER[b.t.kind]);
      const remap = new Map(order.map(({ i }, k) => [i, k]));
      const plan = order.map(() => []);
      for (const it of list) plan[remap.get(it.term)].push(it.id);
      // Drop empty terms at the end (a heading with nothing under it), but keep at least the first.
      while (plan.length > 1 && !plan[plan.length - 1].length) { plan.pop(); order.pop(); }
      const outTerms = order.map(({ t }) => ({ kind: t.kind, year: t.year }));
      const regular = outTerms.map((t) => t.kind !== 'summer');
      const balanced = plan.some((ids, i) => regular[i] && hoursOf(ids, courses) > 21) ? balance(plan, courses, 18, regular) : 0;
      return { terms: outTerms, plan, order: order.map(({ i }) => i), balanced };
    }
    const total = list.reduce((n, it) => n + it.hrs, 0);
    const target = Math.min(18, Math.max(12, Math.ceil(total / 8)));
    const plan = [];
    const termOf = {};
    for (const it of list) {
      const c = courses[it.id];
      let i = 0;
      for (const p of c.pre || []) if (termOf[p] != null) i = Math.max(i, termOf[p] + 1);
      for (const p of c.co || []) if (termOf[p] != null) i = Math.max(i, termOf[p]);
      // The first term after its prerequisites with room for it.
      while (plan[i] && plan[i].length && hoursOf(plan[i], courses) + c.hrs > target) i++;
      while (plan.length <= i) plan.push([]);
      plan[i].push(it.id);
      termOf[it.id] = i;
    }
    while (plan.length < 8) plan.push([]);
    const balanced = balance(plan, courses, target, plan.map(() => true));
    return { terms: plan.map((_, i) => ({ kind: i % 2 ? 'spring' : 'fall', year: Math.floor(i / 2) + 1 })), plan, order: [], balanced };
  }
  const hoursOf = (ids, courses) => ids.reduce((n, id) => n + courses[id].hrs, 0);

  // Moves courses out of the heaviest semester into the lightest semester they can go in without breaking a
  // prerequisite (after everything they need, before everything that needs them), until no semester is over
  // `cap` hours or nothing can move. Returns how many courses moved.
  function balance(plan, courses, cap, regular) {
    const termOf = {};
    plan.forEach((ids, i) => ids.forEach((id) => { termOf[id] = i; }));
    const needs = {};
    for (const [id, c] of Object.entries(courses)) {
      for (const p of c.pre || []) (needs[p] ||= []).push([id, 1]);
      for (const p of c.co || []) (needs[p] ||= []).push([id, 0]);
    }
    let moved = 0;
    for (let pass = 0; pass < 400; pass++) {
      const order = plan.map((ids, i) => i).filter((i) => regular[i]).sort((a, b) => hoursOf(plan[b], courses) - hoursOf(plan[a], courses));
      let done = false;
      for (const i of order) {
        if (hoursOf(plan[i], courses) <= cap) break;
        for (const id of plan[i].slice().sort((a, b) => courses[b].hrs - courses[a].hrs)) {
          const c = courses[id];
          let lo = 0, hi = plan.length - 1;
          for (const p of c.pre || []) if (termOf[p] != null) lo = Math.max(lo, termOf[p] + 1);
          for (const p of c.co || []) if (termOf[p] != null) lo = Math.max(lo, termOf[p]);
          for (const [d, strict] of needs[id] || []) if (termOf[d] != null) hi = Math.min(hi, termOf[d] - strict);
          let best = -1;
          for (let j = lo; j <= hi; j++) {
            if (j === i || !regular[j] || hoursOf(plan[j], courses) + c.hrs > cap) continue;
            if (best < 0 || hoursOf(plan[j], courses) < hoursOf(plan[best], courses)) best = j;
          }
          if (best < 0) continue;
          plan[i].splice(plan[i].indexOf(id), 1);
          plan[best].push(id);
          termOf[id] = best;
          moved++;
          done = true;
          break;
        }
        if (done) break;
      }
      if (!done) break;
    }
    return moved;
  }

  // Course types: math and science by subject, general education by subject or name, electives by name,
  // everything else is a major course.
  const STEM_SUBJ = /^(MATH|MTH|MAT|MA|M|CALC|STAT|STA|STATS|SDS|PHYS|PHY|PH|CHEM|CHM|CH|BIOL|BIO|BI|BIOS|BCH|BIOC|GEOL|GEO|ASTR|AST|ASTRO|ENVS|EVS)$/;
  const CORE_SUBJ = /^(ENGL|ENG|EN|RHE|E|WRIT|WRT|WR|COMM|COM|CMST|SPCH|SPC|HIST|HIS|HST|GOVT|GOV|POLS|PSCI|POL|PS|PSY|PSYC|SOC|SOCI|ECON|ECO|EC|PHIL|PHL|ART|ARTS|ARTH|ARH|MUS|MUSI|MUSC|THEA|THE|DRAM|DANC|DAN|LIT|HUM|HUMN|ANTH|ANT|GEOG|GRG|SPAN|SPN|FREN|FRN|GERM|GER|CHIN|JAPN|LATN|UGS|FYS|FYE|CORE|GE|GEN|RELI|REL|RS|CLAS|AFAM|AMS|WGS|ETHN|KIN|PE|PHED|HLTH)$/;
  function category(it) {
    if (it.nameOnly) {
      if (/elective/i.test(it.title) && !/(core|gen|humanit|social|history|government|arts|literature)/i.test(it.title)) return /math|science/i.test(it.title) ? 'stem' : 'tech';
      if (/math|science|physics|chemistry|biology|lab/i.test(it.title) && !/social|political|computer/i.test(it.title)) return 'stem';
      if (/elective|technical|free|approved|option|specialty/i.test(it.title)) return 'tech';
      return 'core';
    }
    const subj = (it.subj || '').replace(/ /g, '');
    if (STEM_SUBJ.test(subj)) return 'stem';
    if (CORE_SUBJ.test(subj)) return 'core';
    return 'major';
  }

  // All-caps titles read better in title case; roman numerals and short acronyms stay as they are.
  function titleCase(t) {
    if (!t || /[a-z]/.test(t)) return t;
    return t.toLowerCase().replace(/\b([a-z])([a-z']*)/g, (w, a, b) => {
      const up = w.toUpperCase();
      if (/^(I|II|III|IV|V|VI|US|UT|AP|DNA|CAD|CS|EE|ME|CE|GIS|AI|ML|BS|BA)$/.test(up)) return up;
      if (/^(and|of|for|to|in|the|w|with|a|an|on)$/.test(w)) return w;
      return a.toUpperCase() + b;
    }).replace(/^./, (ch) => ch.toUpperCase());
  }

  // The school and program from the first lines of the file, when it names them.
  function names(lines) {
    let school = null, program = null;
    for (const raw of lines) {
      const line = raw.replace(/\s+/g, ' ').trim();
      if (!school) {
        const found = [
          /((?:The )?(?:University|College|Institute|Polytechnic|School) of [A-Z][\w&'.-]*(?: (?:[A-Z][\w&'.-]*|at|of|and|the))*)/.exec(line),
          /((?:[A-Z][\w&'.-]* ){1,4}(?:University|College|Institute of Technology|Polytechnic Institute|Community College|State University)(?: (?:at|of) [A-Z][\w&'.-]*(?: (?:[A-Z][\w&'.-]*|at))*)?)/.exec(line),
        ].filter(Boolean).map((m) => m[1].replace(/(\s+(at|of|and|the))+$/i, '').trim()).sort((a, b) => b.length - a.length);
        if (found.length && !/\b(Core|Curriculum)\b/.test(found[0])) school = found[0];
      }
      if (!program) {
        const m = /\b((?:Bachelor|Master|Associate) of (?:Science|Arts|Engineering|Applied Science|Fine Arts)(?: in [A-Z][\w&,' -]*)?|B\.?S\.? (?:in )?[A-Z][\w&' -]*|B\.?A\.? (?:in )?[A-Z][\w&' -]*)/.exec(line);
        // Catalog page titles: "Chemical Engineering - BS", "MECHANICAL ENGINEERING, B.S.".
        const t = /^([A-Z][A-Za-z&' ]{3,60}?)\s*[-–—,]\s*(B\.?S\.?E?|B\.?A\.?|BSE|BBA|BFA|B\.?Eng\.?)(?=\s|$)/.exec(line);
        if (m) program = m[1].replace(/\s+\b(degree|plan|curriculum|flowchart|catalog)\b.*$/i, '').replace(/\s+[-–—:|].*$/, '').replace(/[\s,-]+$/, '').slice(0, 70);
        else if (t) program = `${titleCase(t[1].trim())}, ${t[2].replace(/\./g, '').toUpperCase()}`;
      }
    }
    return { school: school && school.slice(0, 70), program };
  }

  // ------------------------------------------------------------------ minors
  // A minor's requirements from its catalog page: its name ("Minor in Business Administration"), its total hours,
  // and its requirement groups, each either every course listed ('all') or a choice ('choose': "Choose two of the
  // following", "Select 6 hours from"). Courses keep their hours, titles, alternatives and prerequisites.
  //   parseMinor(rows) -> { name, shortName, totalHours, statedTotal, groups: [{ label, type, count, hours, courses }], count }
  const COUNT_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  const GROUP_RE = /^(required|requirements?|core|electives?|choose|select|complete|take|pick|group|option|area|list|track|foundation|foundational|advanced|upper|lower|additional|supporting|prerequisite courses|courses? (?:required|list)|one of|two of|three of|any)\b/i;

  function minorName(text) {
    let t = String(text).replace(/\(.*?\)/g, ' ').replace(/\s+[-–—|:]\s+.*$/, '').replace(/\s+/g, ' ').trim();
    if (!/[a-z]/.test(t)) t = titleCase(t);
    return t.slice(0, 70);
  }

  // The courses on one line: number, title, hours, "or" alternatives, "&" pairs and prerequisite notes.
  function rowItems(cells, last, preCols = []) {
    const out = [];
    let cur = null, kw = null, connector = null;
    for (const cell of cells) {
      if (kw && kw.used) kw = null;
      const pc = preCols.find((q) => Math.abs(q.x - cell.x) < 40);
      if (pc) kw = { co: pc.co, used: false, target: cur };
      for (const tok of tokenize(cell)) {
        if (tok.type === 'kw') { kw = { co: tok.co, used: false, target: cur || last }; continue; }
        if (tok.type === 'conn') { connector = tok; continue; }
        if (tok.type === 'code') {
          if (kw && kw.target) { (kw.co ? kw.target.co : kw.target.pre).push(tok.code); kw.used = true; continue; }
          if (tok.mention) { connector = null; continue; }
          if (connector && cur && !cur.title) {
            if (connector.and) cur.code = joinAnd(cur.code, tok.code); else cur.alts.push(tok.code);
            connector = null;
            continue;
          }
          cur = { code: tok.code, subj: tok.subj, num: tok.num, alts: [], title: '', hrs: null, pre: [], co: [] };
          out.push(cur);
          connector = null;
          continue;
        }
        if (tok.type === 'num') { if (cur && cur.hrs == null) cur.hrs = tok.value; continue; }
        connector = null;
        if (kw) continue;
        if (cur && !cur.title && cur.hrs == null && !HEADER_WORD_RE.test(tok.text)) cur.title = tok.text;
      }
    }
    return out;
  }

  function parseMinor(rows, { ut = false } = {}) {
    ut = ut || !!rows.utAustin;
    const groups = [];
    let group = null, name = null, stated = null, last = null, preCols = [];
    const seen = new Set();
    const isHeader = (t) => HEADER_WORD_RE.test(t) || /^requirements?$/i.test(t);
    for (const cells of rows) {
      const text = cells.map((c) => stripLinks(c.text)).join(' ').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const words = text.split(' ').length;
      const codes = findCodes(text);
      // The minor's name: a short line that says "minor".
      if (!name && /\bminor\b/i.test(text) && words <= 12 && !codes.length && !/\b(students?|may|must|should|will|can)\b/i.test(text)) {
        name = minorName(text);
        const h = /(\d{1,2})\s*(?:semester |credit )?(?:hours|hrs|credits|units)\b/i.exec(text);
        if (h) stated = +h[1];
        continue;
      }
      if (!codes.length) {
        // A table header row; its Prerequisites column holds prerequisites.
        if (cells.filter((c) => isHeader(c.text.trim())).length >= 2) {
          preCols = cells.filter((c) => /^(pre|co)-?req/i.test(c.text.trim())).map((c) => ({ x: c.x, co: /^co/i.test(c.text.trim()) }));
          continue;
        }
        if (cells.every((c) => isHeader(c.text.trim()))) continue;
        // "Total Hours 18", "The minor requires 18 credit hours."
        if (/\btotal\b/i.test(text) || /\b(minor|requires?)\b/i.test(text)) {
          const h = /\btotal\b/i.test(text) ? lastNumber(text) : (/(\d{1,2})\s*(?:semester |credit )?(?:hours|hrs|credits|units)\b/i.exec(text) || [])[1];
          if (h && +h >= 6 && +h <= 40) { stated = +h; continue; }
        }
        // A group heading: "Required Courses (12 hours)", "Choose two of the following:", "Select 6 hours from".
        if ((GROUP_RE.test(text) || CHOICE_RE.test(text)) && words <= 16) {
          group = startGroup(text, cells);
          groups.push(group);
          continue;
        }
        continue;
      }
      // A table that names each course's group in a column ("Required", "Choose one of the following").
      const lead = cells.find((c) => !findCodes(c.text).length && (GROUP_RE.test(c.text.trim()) || CHOICE_RE.test(c.text.trim())));
      if (lead && (!group || group.raw !== lead.text.trim())) {
        group = startGroup(lead.text.trim(), [lead]);
        groups.push(group);
      }
      for (const it of rowItems(cells.filter((c) => c !== lead), last, preCols)) {
        if (seen.has(it.code)) continue;
        seen.add(it.code);
        if (!group) { group = { label: 'Required courses', type: 'all', count: null, hours: null, courses: [] }; groups.push(group); }
        group.courses.push(it);
        last = it;
      }
    }
    function startGroup(text, cells) {
      const count = /\b(?:choose|select|take|complete|pick)\s+(?:any\s+)?(one|two|three|four|five|six|seven|eight|\d)\b(?!\s*(?:semester |credit )?(?:hours|hrs|credits|units))/i.exec(text) ||
        /^(one|two|three|four|five|six|\d)\s+(?:of|courses?)\b/i.exec(text);
      const hrsM = /(\d{1,2})\s*(?:-\s*\d{1,2}\s*)?(?:semester |credit )?(?:hours|hrs|credits|units)\b/i.exec(text);
      const tail = cells.length > 1 ? lastNumber(cells[cells.length - 1].text) : null;
      const hours = hrsM ? +hrsM[1] : tail != null && tail <= 30 ? tail : null;
      const n = count ? (COUNT_WORDS[count[1].toLowerCase()] || +count[1]) : null;
      const choose = !!n || /\b(choose|select|pick|one of|two of|from the following|from:|electives?)\b/i.test(text) && !/^required\b/i.test(text);
      const label = text.replace(/\(.*?\)/g, ' ').replace(/[:.]?\s*\d{1,2}(?:\s*[-–]\s*\d{1,2})?\s*$/, '').replace(/\s+/g, ' ').replace(/:$/, '').trim();
      return { label: label.slice(0, 90) || text, raw: text, type: choose ? 'choose' : 'all', count: n, hours, courses: [] };
    }
    for (const g of groups) {
      for (const it of g.courses) {
        if (it.hrs == null && ut && /^\d{3}[A-Z]{0,2}$/.test(it.num || '')) it.hrs = Math.max(1, +it.num[0]);
        if (it.hrs == null && rows.texas && /^\d[1-6]\d\d[A-Z]?$/.test(it.num || '')) it.hrs = +it.num[1];
        if (it.hrs == null) { it.hrs = 3; it.assumed = true; }
        it.title = titleCase(tidyTitle(stripLinks(it.title)).replace(/\s+or\s+.*$/i, ''));
      }
    }
    const kept = groups.filter((g) => g.courses.length);
    for (const g of kept) {
      const avg = g.courses.reduce((n, c) => n + c.hrs, 0) / g.courses.length;
      if (g.type === 'all' && g.hours == null) g.hours = g.courses.reduce((n, c) => n + c.hrs, 0);
      if (g.type === 'choose' && g.hours == null) g.hours = g.count ? Math.round(g.count * avg) : Math.round(avg);
      if (g.type === 'all' && g.hours < g.courses.reduce((n, c) => n + c.hrs, 0)) g.type = 'choose'; // "Required (6 hours)" over three courses
    }
    const sum = kept.reduce((n, g) => n + g.hours, 0);
    const clean = (n) => (n ? n.replace(/^(?:the\s+)?/i, '') : null);
    const nm = clean(name) || 'Minor';
    return {
      name: /\bminor\b/i.test(nm) ? nm : `${nm} Minor`,
      shortName: nm.replace(/^minor\s+(?:in|of)\s+/i, '').replace(/\s+minor$/i, '').replace(/^minor:?\s*/i, '') || 'Minor',
      totalHours: stated || sum, statedTotal: stated, groupHours: sum,
      groups: kept.map((g) => ({ ...g, courses: g.courses.map((c) => ({ code: c.code, alts: c.alts, title: c.title, hrs: c.hrs, pre: c.pre, co: c.co, assumed: !!c.assumed, num: c.num, subj: c.subj })) })),
      count: kept.reduce((n, g) => n + g.courses.length, 0),
    };
  }

  // ------------------------------------------------------------------ prerequisite flowcharts
  // Relations found in a flowchart: { from, to, type } where `from` must come before `to` ('pre'), may come in the
  // same term ('co'), or type null when a line joins two boxes without showing which way it goes (the caller
  // decides from where the courses sit in the plan).
  async function readFlowchart(src) {
    const relations = [];
    const codes = new Set();
    if (typeof src !== 'string' && isPdf(src)) {
      const pages = await window.Transcript.pdfPages(src, { shapes: true });
      for (const pg of pages) {
        relations.push(...chartRelations(pg, codes));
        relations.push(...textRelations(joinWrapped(buildRows(dropFootnoteMarks(pg.items))), codes));
      }
    } else {
      const rows = typeof src === 'string' ? rowsFromText(src) : await readRows(src);
      relations.push(...textRelations(joinWrapped(rows), codes));
    }
    const seen = new Set();
    const out = relations.filter((r) => {
      if (!r.from || !r.to || normCode(r.from) === normCode(r.to)) return false;
      const key = `${normCode(r.from)}>${normCode(r.to)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { relations: out, codes: [...codes] };
  }

  // Text: "CHEN 205 ... Prerequisite: CHEN 204 and MATH 251; corequisite: MATH 308", "CHEN 204 -> CHEN 205",
  // "CHEN 205: CHEN 204, MATH 251", and tables with a Prerequisites column.
  function textRelations(rows, codesSeen) {
    const out = [];
    let cur = null, preCols = [];
    for (const cells of rows) {
      const text = cells.map((c) => stripLinks(c.text)).join('   ');
      const codes = findCodes(text);
      codes.forEach((c) => codesSeen.add(c.code));
      if (!codes.length) {
        if (cells.filter((c) => HEADER_WORD_RE.test(c.text.trim())).length >= 2) {
          preCols = cells.filter((c) => /^(pre|co)-?req/i.test(c.text.trim())).map((c) => ({ x: c.x, co: /^co/i.test(c.text.trim()) }));
        }
        continue;
      }
      // Arrows between course numbers.
      for (let i = 0; i + 1 < codes.length; i++) {
        if (/^\s*(→|->|=>|⟶|➔|➜|>)\s*$/.test(text.slice(codes[i].end, codes[i + 1].index))) out.push({ from: codes[i].code, to: codes[i + 1].code, type: 'pre' });
      }
      // A line that starts with a course number is about that course.
      if (codes[0].index <= 4 && /^[\s•·*\-–\d.)]*$/.test(text.slice(0, codes[0].index))) cur = codes[0].code;
      if (!cur) continue;
      // Keywords: each reaches the course numbers after it, up to the next keyword.
      const kws = [];
      const re = new RegExp(PREREQ_RE.source, 'gi');
      let m;
      while ((m = re.exec(text))) kws.push({ at: m.index + m[0].length, co: /co-?req|concurrent/i.test(m[0]) });
      kws.forEach((k, i) => {
        const stop = i + 1 < kws.length ? kws[i + 1].at : Infinity;
        for (const c of codes) if (c.index >= k.at && c.index < stop) out.push({ from: c.code, to: cur, type: k.co ? 'co' : 'pre' });
      });
      // "CHEN 205: CHEN 204, MATH 251" or a Prerequisites column.
      if (!kws.length && codes[0].code === cur && /^\s*[:|]/.test(text.slice(codes[0].end))) {
        for (const c of codes.slice(1)) out.push({ from: c.code, to: cur, type: 'pre' });
      }
      for (const pc of preCols) {
        const cell = cells.find((c) => Math.abs(c.x - pc.x) < 40);
        if (cell) for (const c of findCodes(cell.text)) out.push({ from: c.code, to: cur, type: pc.co ? 'co' : 'pre' });
      }
    }
    return out;
  }

  // The course boxes on a page. `boxed` is true for a drawn chart: course numbers in their own small boxes, much
  // narrower than the page (a table's shaded rows run the full width and are not boxes).
  function chartModel(pg) {
    const cells = buildRows(pg.items).flat();
    const found = [];
    for (const cell of cells) {
      const codes = findCodes(cell.text);
      // A course number inside a box title ("Lab for PHY 303L") names the box, not a related course.
      const words = cell.text.replace(CODE_RE, ' ').replace(/\b(or|and|with|credit)\b|[&/,;:()–-]/gi, ' ').trim().split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w));
      for (const c of codes) {
        const w = cell.end - cell.x, n = cell.text.length || 1;
        const x = cell.x + (c.index / n) * w, x2 = cell.x + (c.end / n) * w;
        found.push({ code: c.code, x, x2, y: cell.y, h: cell.h, cx: (x + x2) / 2, cy: cell.y + cell.h * 0.35, inTitle: words.length >= 1 });
      }
    }
    const model = { pg, cells, nodes: [], notes: [], boxed: false, closedShapes: [] };
    if (found.length < 3) return model;
    const maxH = Math.max(...found.map((f) => f.h));
    const nodes = found.filter((f) => f.h >= maxH * 0.8);
    const notes = found.filter((f) => f.h < maxH * 0.7 && !f.inTitle);
    const closedShapes = pg.shapes.filter((s) => s.kind !== 'line');
    const area = (b) => (b[2] - b[0]) * (b[3] - b[1]);
    const inside = (b, x, y, pad = 0) => x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad;
    const pageArea = pg.width * pg.height;
    // Each course box: the smallest closed shape around its number, or an area around the number itself.
    for (const n of nodes) {
      const around = closedShapes.filter((s) => inside(s.box, n.cx, n.cy) && area(s.box) < pageArea / 15).sort((a, b) => area(a.box) - area(b.box));
      n.box = around.length ? around[0].box : [n.x - 8, n.y - n.h * 3, n.x2 + 8, n.y + n.h * 1.2];
      n.shaped = !!around.length;
    }
    const widths = nodes.filter((n) => n.shaped).map((n) => n.box[2] - n.box[0]).sort((a, b) => a - b);
    const boxed = widths.length >= 4 && widths.length >= nodes.length * 0.5 && widths[Math.floor(widths.length / 2)] < pg.width * 0.25;
    // The legend's sample box is not a course.
    const key = cells.find((c) => /^(legend|key)$/i.test(c.text.trim()));
    const frame = key && closedShapes.filter((q) => inside(q.box, (key.x + key.end) / 2, key.y + key.h * 0.35) && area(q.box) < pageArea / 4).sort((a, b) => area(b.box) - area(a.box))[0];
    const inLegend = (n) => frame && inside(frame.box, n.cx, n.cy);
    return Object.assign(model, { found, nodes: nodes.filter((n) => !inLegend(n)), notes: notes.filter((n) => !inLegend(n)), boxed, closedShapes, maxH, inLegend });
  }

  // A chart read as a plan: term labels ("Fall", "Spring") in reading order, each with the boxes beside it (labels
  // down the side: boxes in the same band of height; labels across the top: boxes in the same band of width).
  function chartRows(model) {
    const { cells, nodes, pg, closedShapes } = model;
    // Term labels are in the chart's larger type; "First-Year" in a title ("First-Year Signature Course") is not one.
    const labels = cells.filter((c) => c.h >= model.maxH * 0.8 && !findCodes(c.text).length && heading(c.text)).map((c) => ({ c, cx: (c.x + c.end) / 2, cy: c.y }));
    if (!labels.length) return [];
    const spreadX = Math.max(...labels.map((l) => l.cx)) - Math.min(...labels.map((l) => l.cx));
    const spreadY = Math.max(...labels.map((l) => l.cy)) - Math.min(...labels.map((l) => l.cy));
    const down = spreadY >= spreadX;
    labels.sort((a, b) => (down ? b.cy - a.cy : a.cx - b.cx));
    // Boxes named in words ("SBS Core", "VAPA") are courses too.
    const area = (b) => (b[2] - b[0]) * (b[3] - b[1]);
    // A name can run over two lines ("Technical" / "Elective"): the words in one box make one name.
    const byBox = new Map();
    for (const c of cells) {
      if (c.h < model.maxH * 0.8 || findCodes(c.text).length || heading(c.text) || !/[A-Za-z]{2,}/.test(c.text)) continue;
      const cx = (c.x + c.end) / 2, cy = c.y + c.h * 0.35;
      const box = closedShapes.filter((q) => area(q.box) < pg.width * pg.height / 15 && cx >= q.box[0] && cx <= q.box[2] && cy >= q.box[1] && cy <= q.box[3])
        .sort((p, q) => area(p.box) - area(q.box))[0];
      if (!box) continue;
      if (!byBox.has(box)) byBox.set(box, []);
      byBox.get(box).push(c);
    }
    const named = [...byBox.entries()].map(([box, cs]) => {
      cs.sort((p, q) => q.y - p.y || p.x - q.x);
      return { code: '', name: cs.map((c) => c.text).join(' '), cx: (box.box[0] + box.box[2]) / 2, cy: (box.box[1] + box.box[3]) / 2, x: box.box[0], x2: box.box[2] };
    }).filter((n) => !(model.inLegend && model.inLegend(n)));
    const all = [...nodes, ...named];
    const bins = labels.map(() => []);
    for (const n of all) {
      let best = 0;
      labels.forEach((l, i) => { if (Math.abs(down ? l.cy - n.cy : l.cx - n.cx) < Math.abs(down ? labels[best].cy - n.cy : labels[best].cx - n.cx)) best = i; });
      bins[best].push(n);
    }
    const rows = [];
    labels.forEach((l, i) => {
      rows.push([{ x: 0, text: l.c.text }]);
      bins[i].sort((a, b) => (down ? a.cx - b.cx : b.cy - a.cy));
      for (const n of bins[i]) {
        // Its title: the smaller words inside its box.
        const title = n.box ? cells.filter((c) => c.h < model.maxH * 0.7 && !findCodes(c.text).length && c.x >= n.box[0] - 1 && c.end <= n.box[2] + 1 && c.y >= n.box[1] && c.y < n.cy - 1)
          .sort((a, b) => b.y - a.y || a.x - b.x).map((c) => c.text).join(' ') : '';
        // Every box is a course, even one named only in words ("VAPA").
        rows.push(Object.assign(n.code ? [{ x: 0, text: n.code }, { x: 120, text: title || ' ' }] : [{ x: 0, text: n.name }], { box: true }));
      }
    });
    return rows.map((r) => Object.assign(r.filter((c) => c.text.trim()), { box: r.box }));
  }

  // A drawn chart: course boxes (course numbers in the chart's larger type) with related courses in smaller type
  // in shapes under or inside them, or boxes joined by lines. The legend ("PRE-REQ" in an oval, "CO-REQ" in a
  // hexagon) says what each shape means; without one, a related course is a prerequisite.
  function chartRelations(pg, codesSeen, model = chartModel(pg)) {
    const { cells, nodes, notes, boxed, closedShapes, found } = model;
    if (!found || !nodes.length) return [];
    found.forEach((f) => codesSeen.add(f.code));
    const area = (b) => (b[2] - b[0]) * (b[3] - b[1]);
    const inside = (b, x, y, pad = 0) => x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad;
    const pageArea = pg.width * pg.height;
    if (!boxed && !notes.length) return [];
    const dist = (b, x, y) => Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3]));
    const shapeSig = (x, y, skip) => {
      const s = closedShapes.filter((q) => q.box !== skip && inside(q.box, x, y, 1) && area(q.box) < pageArea / 40).sort((a, b) => area(a.box) - area(b.box))[0];
      return s ? (s.kind === 'poly' ? `poly${s.n}` : s.kind) : null;
    };
    // The legend: which shape holds "PRE-REQ" and which holds "CO-REQ".
    const legend = {};
    for (const cell of cells) {
      const t = cell.text.trim();
      const type = /^pre-?req/i.test(t) ? 'pre' : /^co-?req/i.test(t) ? 'co' : null;
      if (!type) continue;
      const sig = shapeSig((cell.x + cell.end) / 2, cell.y + cell.h * 0.35);
      if (sig && !legend[sig]) legend[sig] = type;
    }
    const out = [];
    // Small course numbers belong to the nearest box; a stack of them under a box belongs to that box too (each
    // takes the owner of the number right next to it).
    for (const a of notes) {
      let best = Infinity;
      for (const n of nodes) {
        const d = dist(n.box, a.cx, a.cy);
        if (d < best) { best = d; a.owner = n; }
      }
      if (best > 18) a.owner = null;
    }
    for (let changed = true; changed;) {
      changed = false;
      for (const a of notes) {
        if (a.owner) continue;
        const b = notes.find((q) => q.owner && Math.abs(q.cx - a.cx) < 25 && Math.abs(q.cy - a.cy) < 14);
        if (b) { a.owner = b.owner; changed = true; }
      }
    }
    for (const a of notes) {
      if (!a.owner || a.owner.code === a.code) continue;
      const sig = shapeSig(a.cx, a.cy, a.owner.box);
      out.push({ from: a.code, to: a.owner.code, type: (sig && legend[sig]) || 'pre' });
    }
    // Lines between boxes. Segments that meet are followed as one connector; an arrowhead (a small filled
    // triangle) at an end marks the course that needs the other.
    if (boxed) {
      const lines = pg.shapes.filter((s) => s.kind === 'line' && s.pts.length >= 2);
      const ends = lines.map((s) => [s.pts[0], s.pts[s.pts.length - 1]]);
      const parent = lines.map((_, i) => i);
      const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
      const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5;
      for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
        if (ends[i].some((p) => ends[j].some((q) => near(p, q)))) parent[find(i)] = find(j);
      }
      const heads = pg.shapes.filter((s) => s.filled && (s.kind === 'poly' && s.n <= 4) && area(s.box) < 80);
      const groups = {};
      lines.forEach((_, i) => (groups[find(i)] ||= []).push(i));
      for (const members of Object.values(groups)) {
        // Every end that touches a course box (two arrows can leave a box from one point).
        const touched = [];
        for (const p of members.flatMap((i) => ends[i])) {
          const n = nodes.filter((q) => q.shaped || boxed).map((q) => ({ q, d: dist(q.box, p[0], p[1]) })).sort((a, b) => a.d - b.d)[0];
          if (!n || n.d > 10) continue;
          const arrow = heads.some((h) => dist(h.box, p[0], p[1]) < 4);
          const seen = touched.find((t) => t.node === n.q);
          if (seen) seen.arrow = seen.arrow || arrow; else touched.push({ node: n.q, arrow });
        }
        if (touched.length < 2) continue;
        const targets = touched.filter((t) => t.arrow), sources = touched.filter((t) => !t.arrow);
        if (targets.length && sources.length) {
          for (const s of sources) for (const t of targets) out.push({ from: s.node.code, to: t.node.code, type: 'pre' });
        } else if (touched.length === 2) {
          out.push({ from: touched[0].node.code, to: touched[1].node.code, type: null });
        }
      }
    }
    return out;
  }

  window.Curriculum = { read, rowsFromText, rowsFromTable, joinWrapped, parse, parseMinor, heading, findCodes, readFlowchart, normCode };
})();
