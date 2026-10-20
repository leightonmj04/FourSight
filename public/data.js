// FourSight course data: shared courses and the program registry. Each file in programs/ defines
// one Cockrell School of Engineering B.S. program with FS.define().
//
// Course fields:
//   code, title, hrs, cat     cat is one of the category keys below (major, stem, core, alt, tech)
//   pre: [...]                must be completed in an EARLIER term. An inner array is a one-of
//                             group: ['ECE312', 'ECE313'] means either course satisfies it.
//   co:  [...]                may be taken earlier or in the SAME term (co-requisite); groups allowed
//   latest                    last regular term index (0 = Fall 1 ... 7 = Spring 4) the course can be
//                             taken and still graduate in four years. Programs without department
//                             figures get it computed from the prerequisite chain.
//   offered                   'fall', 'spring' or 'summer' when the course is only offered then
//   alias: [...]              transcript codes that fill this slot (for "X or Y" and elective slots)
//   pool                      elective pool name in the program's pools, for transcript matching
//   note, optional
//
// Prerequisites outside a program's plan (like CH 301 for ChE) are listed in the program's
// `prior` map with an explanation, so they show up as information instead of a line.
//
// Sources: 2026-28 Undergraduate Catalog for requirements; 2025-26 course listings for
// prerequisites (the 2026-27 listings omit them). ChE uses the department's 2026-28 flowchart.

window.COURSES = {};    // the live catalog for the selected program (filled by app.js)

window.FS = (() => {
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const SHARED = {
    // Math and physics foundation
    M408C:   { code: 'M 408C',   title: 'Differential and Integral Calculus', hrs: 4, cat: 'stem' },
    M408D:   { code: 'M 408D',   title: 'Sequences, Series, Multivariable Calc', hrs: 4, cat: 'stem', pre: ['M408C'] },
    M427J:   { code: 'M 427J',   title: 'Differential Equations w/ Linear Algebra', hrs: 4, cat: 'stem', pre: ['M408D'] },
    M427L:   { code: 'M 427L',   title: 'Advanced Calculus for Applications II', hrs: 4, cat: 'stem', pre: ['M408D'] },
    M340L:   { code: 'M 340L',   title: 'Matrices and Matrix Calculations', hrs: 3, cat: 'stem' },
    M325K:   { code: 'M 325K',   title: 'Discrete Mathematics', hrs: 3, cat: 'stem' },
    PHY303K: { code: 'PHY 303K', title: 'Engineering Physics I', hrs: 3, cat: 'stem', pre: ['M408C'], co: ['M408D'] },
    PHY105M: { code: 'PHY 105M', title: 'Lab for PHY 303K', hrs: 1, cat: 'stem', co: ['PHY303K'] },
    PHY303L: { code: 'PHY 303L', title: 'Engineering Physics II', hrs: 3, cat: 'stem', pre: ['PHY303K', 'PHY105M', 'M408D'], co: ['PHY105N'] },
    PHY105N: { code: 'PHY 105N', title: 'Lab for PHY 303L', hrs: 1, cat: 'stem', pre: ['PHY105M'], co: ['PHY303L'] },

    // Chemistry, biology and geology
    CH301:   { code: 'CH 301',   title: 'Principles of Chemistry I', hrs: 3, cat: 'stem' },
    CH302:   { code: 'CH 302',   title: 'Principles of Chemistry II', hrs: 3, cat: 'stem', pre: ['CH301'] },
    CH401:   { code: 'CH 401',   title: 'Principles of Chemistry I', hrs: 4, cat: 'stem' },
    CH402:   { code: 'CH 402',   title: 'Principles of Chemistry II', hrs: 4, cat: 'stem', pre: ['CH401'] },
    CH328M:  { code: 'CH 328M',  title: 'Organic Chemistry I', hrs: 3, cat: 'stem', pre: ['CH302'] },
    BIO311C: { code: 'BIO 311C', title: 'Introductory Biology I', hrs: 3, cat: 'stem' },
    BIO206L: { code: 'BIO 206L', title: 'Introductory Biology Lab', hrs: 2, cat: 'stem' },
    BCH369:  { code: 'BCH 369',  title: 'Fundamentals of Biochemistry', hrs: 3, cat: 'stem' },
    GEO303:  { code: 'GEO 303',  title: 'Introduction to Geology', hrs: 3, cat: 'stem' },

    // Engineering foundation
    RHE306:  { code: 'RHE 306',  title: 'Rhetoric and Writing', hrs: 3, cat: 'core' },
    ES333T:  { code: 'E S 333T', title: 'Engineering Communication', hrs: 3, cat: 'major', pre: ['RHE306'] },
    EM306:   { code: 'E M 306',  title: 'Statics', hrs: 3, cat: 'major', pre: ['M408D', 'PHY303K'] },
    EM311M:  { code: 'E M 311M', title: 'Dynamics', hrs: 3, cat: 'major', pre: ['EM306', 'M408D'] },
    EM319:   { code: 'E M 319',  title: 'Mechanics of Solids', hrs: 3, cat: 'major', pre: ['EM306', 'M408D'] },
    ME210:   { code: 'M E 210',  title: 'Engineering Design Graphics', hrs: 2, cat: 'major', co: ['M408C'] },
    ME310T:  { code: 'M E 310T', title: 'Applied Thermodynamics', hrs: 3, cat: 'major', pre: ['CH301', 'M408D', 'PHY303K'] },
    COE301:  { code: 'COE 301',  title: 'Introduction to Computer Programming', hrs: 3, cat: 'major' },
    COE311K: { code: 'COE 311K', title: 'Engineering Computation', hrs: 3, cat: 'major', pre: ['COE301'], co: ['M427J'] },
    ASE320:  { code: 'ASE 320',  title: 'Low-Speed Aerodynamics', hrs: 3, cat: 'major', pre: ['M427L', 'ME310T'] },
    ASE330M: { code: 'ASE 330M', title: 'Linear System Analysis', hrs: 3, cat: 'major', pre: ['EM311M', 'M427J'], co: ['COE311K'] },
    ASE375:  { code: 'ASE 375',  title: 'Electromechanical Systems', hrs: 3, cat: 'major', pre: ['EM319', 'PHY303L'] },
    CE311K:  { code: 'C E 311K', title: 'Introduction to Computer Methods', hrs: 3, cat: 'major', pre: ['M408D'] },
    CE311S:  { code: 'C E 311S', title: 'Probability and Statistics for Civil Engineers', hrs: 3, cat: 'major', pre: ['M408D'] },
    CE319F:  { code: 'C E 319F', title: 'Elementary Mechanics of Fluids', hrs: 3, cat: 'major', pre: ['EM306'] },
    CE324P:  { code: 'C E 324P', title: 'Properties and Behavior of Engineering Materials', hrs: 3, cat: 'major', pre: ['CH301', 'ES333T', 'EM319'] },
    CE329:   { code: 'C E 329',  title: 'Structural Analysis', hrs: 3, cat: 'major', pre: ['EM319', 'CE311K'] },
    CE341:   { code: 'C E 341',  title: 'Introduction to Environmental Engineering', hrs: 3, cat: 'major', pre: ['CH302', 'CE319F'] },
    CE356:   { code: 'C E 356',  title: 'Elements of Hydraulic Engineering', hrs: 3, cat: 'major', pre: ['CE319F'] },
    CE357:   { code: 'C E 357',  title: 'Geotechnical Engineering', hrs: 3, cat: 'major', pre: ['CE319F'] },
    ARE217:  { code: 'ARE 217',  title: 'Computer-Aided Design and Graphics', hrs: 2, cat: 'major' },
    ARE323K: { code: 'ARE 323K', title: 'Project Management and Economics', hrs: 3, cat: 'major', pre: ['ES333T', 'M408D'] },

    // Petroleum and Geosystems (shared by both PGE degrees)
    PGE311:  { code: 'PGE 311',  title: 'Numerical Methods and Programming', hrs: 3, cat: 'major', pre: ['PHY303K', 'PHY105M'], co: ['M427J'] },
    PGE326:  { code: 'PGE 326',  title: 'Thermodynamics and Phase Behavior', hrs: 3, cat: 'major', pre: ['CH302', 'PHY303K', 'PHY105M', 'M408D'] },
    PGE322K: { code: 'PGE 322K', title: 'Transport Phenomena in Geosystems', hrs: 3, cat: 'major', pre: ['EM306', 'M427J'] },
    PGE333T: { code: 'PGE 333T', title: 'Engineering Communication', hrs: 3, cat: 'major', pre: ['RHE306'] },
    PGE430:  { code: 'PGE 430',  title: 'Drilling and Well Completions', hrs: 4, cat: 'major', pre: ['EM319'], co: ['PGE322K'] },
    PGE365:  { code: 'PGE 365',  title: 'Resource Economics and Valuation', hrs: 3, cat: 'major', pre: ['PGE311', 'PGE323K'] },

    // Core curriculum
    UGS:     { code: 'UGS 302/303', title: 'First-Year Signature Course', hrs: 3, cat: 'core', latest: 1,
               note: 'Can be taken after Spring 1 without delaying graduation, with approval from the Signature Course department.' },
    E316:    { code: 'E 316L/M/N/P', title: 'Humanities Core', hrs: 3, cat: 'core', pre: ['RHE306'] },
    VAPA:    { code: 'VAPA', title: 'Visual and Performing Arts Core', hrs: 3, cat: 'core' },
    AMHIST:  { code: 'American History', title: 'History Core', hrs: 3, cat: 'core' },
    USHIST:  { code: 'US History', title: 'Approved US History Course', hrs: 3, cat: 'core' },
    GOV310L: { code: 'GOV 310L', title: 'American Government', hrs: 3, cat: 'core' },
    GOV312:  { code: 'GOV 306C or 312L/P', title: 'Topics in Government', hrs: 3, cat: 'core' },
    SBS:     { code: 'SBS Core', title: 'Social and Behavioral Science', hrs: 3, cat: 'core' },
  };

  // The eight core-curriculum courses every program has left after major courses double-count.
  const CORE = ['UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'];

  const programs = {};
  const order = [];       // selector order: { id } or { group, ids }

  // Copies of shared courses, optionally changed: pick('M408C', ['CH328M', { pre: ['CH402'] }])
  function pick(...items) {
    const out = {};
    for (const it of items) {
      const [id, over] = Array.isArray(it) ? it : [it, null];
      if (!SHARED[id]) throw new Error(`Unknown shared course ${id}`);
      out[id] = { ...clone(SHARED[id]), ...(over || {}) };
    }
    return out;
  }

  // Numbered elective slots: slots('TECH', 4, { code: 'Tech Elective', ... }) -> TECH1..TECH4
  function slots(prefix, n, def) {
    const out = {};
    for (let i = 1; i <= n; i++) out[`${prefix}${i}`] = clone(def);
    return out;
  }

  function define(p) {
    programs[p.id] = p;
    if (p.group) {
      const g = order.find((o) => o.group === p.group);
      if (g) g.ids.push(p.id); else order.push({ group: p.group, ids: [p.id] });
    } else {
      order.push({ id: p.id });
    }
  }

  return { SHARED, CORE, programs, order, pick, slots, define, clone };
})();

// Course type keys and their colors (see --major ... --tech in styles.css). Each program names
// the types it uses.
window.CATEGORY_KEYS = ['major', 'stem', 'core', 'alt', 'tech'];
