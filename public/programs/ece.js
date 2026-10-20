// B.S. Electrical and Computer Engineering, 2026-28 catalog, 125 hours in every concentration:
// a 61-hour degree core, a 26-hour concentration, 11 free-elective hours and 27 core hours.
// Prerequisites from the 2025-26 ECE course listing. Each concentration is its own entry in the
// program list because their required courses differ. Slots that offer a choice ("ECE 445S or
// 471C") check the first option's prerequisites; the note lists the others. The eight-semester
// arrangement is FourSight's, built to satisfy every prerequisite; the department's 2026-28
// flowchart is linked from its curriculum page.
(() => {
  const P = FS.pick;
  const ece = (code, title, hrs, extra = {}) => ({ code, title, hrs, cat: 'alt', ...extra });

  // Degree core shared by all eight concentrations. `labs` are the core lab(s) in a concentration.
  function core(labs) {
    return {
      ...P('M408C', 'M408D', 'M427J', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'RHE306', 'M340L'),
      ECE302:  { code: 'ECE 302',  title: 'Introduction to Electrical Engineering', hrs: 3, cat: 'major', co: ['M408C'], alias: ['ECE 302H'],
                 note: 'ECE 302H also counts. ECE 302 counts toward Natural Science and Technology, Part II (093).' },
      ECE306:  { code: 'ECE 306',  title: 'Introduction to Computing', hrs: 3, cat: 'major', co: ['M408C'] },
      ECE319K: { code: 'ECE 319K', title: 'Introduction to Embedded Systems', hrs: 3, cat: 'major', pre: ['ECE306'], alias: ['ECE 319H'] },
      ECE411:  { code: 'ECE 411',  title: 'Circuit Theory', hrs: 4, cat: 'major', pre: ['ECE302'], co: ['M427J', 'PHY303L', 'PHY105N'] },
      ECE312:  { code: 'ECE 312',  title: 'Software Design and Implementation I', hrs: 3, cat: 'major', pre: ['ECE306', 'ECE319K'], alias: ['ECE 312H'] },
      ECE313:  { code: 'ECE 313',  title: 'Linear Systems and Signals', hrs: 3, cat: 'major', pre: ['ECE302', 'M427J'], co: ['M340L'] },
      ECE333T: { code: 'ECE 333T', title: 'Engineering Communication', hrs: 3, cat: 'major', pre: ['RHE306', 'ECE319K', ['ECE312', 'ECE313']],
                 note: 'Needs ECE 312 or ECE 313 with a C- first. The same rule applies to ECE 160/260/360/460 and ECE 379K.' },
      ECE351K: { code: 'ECE 351K', title: 'Probability and Random Processes', hrs: 3, cat: 'major', pre: ['M427J'] },
      ECE364D: { code: 'ECE 364D or 364E', title: 'Introduction to Engineering Design or Interdisciplinary Entrepreneurship', hrs: 3, cat: 'major',
                 pre: ['ECE333T'], co: [labs], alias: ['ECE 364D', 'ECE 364E'],
                 note: 'Needs one core lab completed or taken the same semester: ECE 438, 440, 445L, 445S, 460J, 461L, 462L, 368L/468L or 471C.' },
      ECE464:  { code: 'ECE 464 Senior Design', title: 'Senior design project (464K, G, H, R or S)', hrs: 4, cat: 'major', pre: ['ECE364D', labs],
                 alias: ['ECE 464K', 'ECE 464G', 'ECE 464H', 'ECE 464R', 'ECE 464S'],
                 note: 'Needs ECE 364D plus one core lab completed.' },
      ADVTECH: { code: 'Adv Technical Elective', title: 'Advanced technical elective', hrs: 3, cat: 'tech',
                 note: 'Any upper-division ECE course, or ECE 316. Two semesters of ECE co-op or one ECE 125S internship can substitute.' },

      ...P('UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),
      CORE9:   { code: 'Core Course', title: 'Remaining core curriculum course', hrs: 3, cat: 'core',
                 note: 'The ECE department lists 11 free-elective hours and 27 remaining core hours for 2026-28, but four concentration pages in the catalog still show 14 free and 24 core hours. This slot covers the 3-hour difference; confirm which applies to you with ECE advising.' },

      ...FS.slots('FREE', 3, { code: 'Free Elective', title: 'Free elective', hrs: 3, cat: 'tech', note: FREE_NOTE }),
      FREE4:   { code: 'Free Elective', title: 'Free elective', hrs: 2, cat: 'tech', note: FREE_NOTE },
    };
  }
  const FREE_NOTE = 'Eleven free-elective hours in all. They must include at least one 3-hour advanced math or basic science course, with no more than 3 lower-division hours, all counting toward a major in the offering department, taken in residence (up to 3 transfer hours with approval), and no duplicates.';

  // Courses every concentration draws on.
  const C = {
    M325K:   { ...FS.SHARED.M325K, cat: 'alt' },
    M427L:   { ...FS.SHARED.M427L, cat: 'alt' },
    ECE316:  ece('ECE 316',  'Digital Logic Design', 3, { pre: ['ECE306'] }),
    ECE460N: ece('ECE 460N', 'Computer Architecture', 4, { pre: ['ECE306', 'ECE312', 'ECE319K'] }),
    ECE445L: ece('ECE 445L', 'Embedded Systems Design Laboratory', 4, { pre: ['ECE312', 'ECE319K', 'ECE411', 'ECE313'], co: ['ECE333T'] }),
    ECE360C: ece('ECE 360C', 'Algorithms', 3, { pre: ['ECE312', 'M325K'] }),
    ECE461P: ece('ECE 461P', 'Data Science Principles', 4, { pre: ['M340L', 'ECE313', 'ECE351K'] }),
    ECE460J: ece('ECE 460J', 'Data Science Laboratory', 4, { pre: ['ECE313', 'ECE351K', 'M340L'], co: ['ECE333T'] }),
    ECE351M: ece('ECE 351M', 'Digital Signal Processing', 3, { pre: ['ECE313'], co: ['ECE351K'] }),
    ECE422C: ece('ECE 422C', 'Software Design and Implementation II', 4, { pre: ['ECE312'] }),
    ECE461L: ece('ECE 461L', 'Software Engineering and Design Laboratory', 4, { pre: ['ECE422C', 'M325K'], co: ['ECE333T'] }),
    ECE325:  ece('ECE 325',  'Electromagnetic Engineering', 3, { pre: ['ECE411', 'M427J', 'PHY303L', 'PHY105N'], co: ['M427L'] }),
    ECE339:  ece('ECE 339',  'Solid-State Electronic Devices', 3, { pre: ['M427J', 'PHY303L', 'PHY105N'] }),
    ECE438:  ece('ECE 438',  'Fundamentals of Electronic Circuits I Laboratory', 4, { pre: ['ECE411'], co: ['ECE333T'] }),
    ECE440:  ece('ECE 440',  'Integrated Circuit Nanomanufacturing Techniques', 4, { pre: ['M427J', 'PHY303L', 'PHY105N'], co: ['ECE333T'] }),
    ECE362K: ece('ECE 362K', 'Introduction to Automatic Control', 3, { pre: ['ECE313', 'M340L'], note: 'Also needs upper-division standing.' }),
  };
  const pick = (...ids) => Object.fromEntries(ids.map((id) => [id, FS.clone(C[id])]));

  // Concentration elective slots.
  const choices = (n, options) => FS.slots('CHOICE', n, {
    code: 'Concentration Elective', title: 'Concentration elective', hrs: 3, cat: 'alt', pool: 'conc',
    note: `Choose ${n * 3} hours from: ${options.join(', ')}. Courses here must be letter-graded; 4-hour courses add an hour.`,
  });

  // The first three terms and the degree-core courses after them are the same in every
  // concentration; a, b, c and d are the concentration's courses for terms 4 to 7.
  function plan({ a, b, c, d }) {
    return [
      ['M408C', 'ECE302', 'ECE306', 'RHE306', 'UGS'],
      ['M408D', 'PHY303K', 'PHY105M', 'ECE319K', 'M340L', 'GOV310L'],
      ['M427J', 'PHY303L', 'PHY105N', 'ECE411', 'ECE312'],
      ['ECE313', 'ECE351K', 'ECE333T', ...a],
      [...b, 'VAPA', 'AMHIST'],
      [...c, 'ADVTECH', 'FREE1', 'GOV312'],
      ['ECE364D', ...d, 'FREE2', 'USHIST', 'E316'],
      ['ECE464', 'FREE3', 'FREE4', 'SBS', 'CORE9'],
    ];
  }

  const NOTES = [
    'ECE 333T, ECE 160/260/360/460 and ECE 379K need ECE 312 or 313 with a C- first.',
    'ECE 364D needs one core lab completed or concurrent; senior design needs ECE 364D plus one core lab completed. Core labs: ECE 438, 440, 445L, 445S, 460J, 461L, 462L, 368L/468L, 471C.',
    'No more than 25 hours of transfer ECE coursework count. All concentration courses must be letter-graded.',
    'The 2026-28 flowchart applies only to students starting ECE in fall 2026 or later; earlier students use the 2022-24 or 2024-26 flowcharts on the curriculum page.',
    'The suggested semester order here is FourSight\'s, built to meet every prerequisite. Compare it with the department flowchart.',
  ];
  const CATALOG = 'https://catalog.utexas.edu/undergraduate/programs/electrical-computer-engineering-';
  const links = (slug) => [
    { label: 'Catalog page', url: `${CATALOG}${slug}-bsece/` },
    { label: 'ECE curriculum page', url: 'https://ece.utexas.edu/academics/undergraduate/curriculum' },
    { label: '2026-28 flowchart', url: 'https://utexas.box.com/s/tqiylly5fehaapl4nebza8v0shgwpzlz' },
  ];

  function concentration({ id, name, short, slug, path, labs, courses, options, n, critical }) {
    FS.define({
      id: `ece-${id}`,
      group: 'Electrical and Computer Engineering',
      name: 'Electrical and Computer Engineering',
      concentration: name,
      degree: 'BSECE',
      dept: 'Chandra Family Department of Electrical and Computer Engineering',
      hours: 125,
      categories: { major: 'ECE Degree Core', stem: 'Math and Science', core: 'Core Curriculum', alt: `Concentration: ${short}`, tech: 'Free and Technical Electives' },
      courses: { ...core(labs), ...courses, ...choices(n, options) },
      plan: plan(path),
      pools: { conc: { codes: options } },
      notes: [critical, ...NOTES],
      links: links(slug),
    });
  }

  concentration({
    id: 'cae', name: 'Computer Architecture and Embedded Systems', short: 'Architecture/Embedded', slug: 'computer-architecture-embedded-systems',
    labs: ['ECE445L'],
    courses: pick('ECE316', 'ECE460N', 'ECE445L', 'ECE360C', 'M325K'),
    n: 3, options: ['ECE 422C', 'ECE 445M', 'ECE 445S', 'ECE 460M', 'ECE 360P', 'ECE 460R', 'ECE 362K', 'C S 375'],
    path: { a: ['M325K', 'ECE316'], b: ['ECE460N', 'ECE445L', 'ECE360C'], c: ['CHOICE1', 'CHOICE2'], d: ['CHOICE3'] },
    critical: 'Computer-side critical path: ECE 306, ECE 319K, ECE 312, then the concentration labs (ECE 445L) before ECE 364D and senior design.',
  });
  concentration({
    id: 'dsip', name: 'Data Science and Information Processing', short: 'Data Science', slug: 'data-science-information-processing',
    labs: ['ECE460J'],
    courses: pick('ECE461P', 'ECE360C', 'ECE460J', 'ECE351M', 'M325K'),
    n: 3, options: ['ECE 422C', 'ECE 445S', 'ECE 360P', 'ECE 361C', 'ECE 462L', 'ECE 362K', 'ECE 471C', 'ECE 371Q'],
    path: { a: ['M325K', 'CHOICE1'], b: ['ECE461P', 'ECE460J', 'ECE351M'], c: ['ECE360C', 'CHOICE2'], d: ['CHOICE3'] },
    critical: 'Electrical-side critical path: ECE 302, ECE 411, then a core lab (ECE 460J here), ECE 364D and senior design.',
  });
  concentration({
    id: 'sed', name: 'Software Engineering and Design', short: 'Software', slug: 'software-engineering-design',
    labs: ['ECE461L'],
    courses: pick('ECE422C', 'ECE360C', 'ECE461L', 'M325K'),
    n: 4, options: ['ECE 316', 'ECE 445L', 'ECE 445M', 'ECE 360F', 'ECE 460N', 'ECE 360P', 'ECE 361Q', 'ECE 372N', 'ECE 360T', 'ECE 461P'],
    path: { a: ['M325K', 'ECE422C'], b: ['ECE360C', 'ECE461L', 'CHOICE1'], c: ['CHOICE2', 'CHOICE3'], d: ['CHOICE4'] },
    critical: 'Critical path, seven straight semesters: ECE 306, ECE 319K, ECE 312, ECE 422C, ECE 461L, ECE 364D, ECE 464K.',
  });
  concentration({
    id: 'csp', name: 'Communications, Signal Processing, Networks, and Systems', short: 'Comms/Signal Processing', slug: 'communications-signal-processing-networks-systems',
    labs: ['CSP445S'],
    courses: {
      ...pick('M427L'),
      CSP325:  ece('ECE 325 or 351M', 'Electromagnetic Engineering or Digital Signal Processing', 3, {
        pre: ['ECE411', 'M427J', 'PHY303L', 'PHY105N'], co: ['M427L'], alias: ['ECE 325', 'ECE 351M'],
        note: 'Prerequisites shown are for ECE 325. ECE 351M needs ECE 313, with ECE 351K completed or concurrent.' }),
      CSP362K: ece('ECE 362K, 371Q or 360K', 'Automatic Control, Digital Image Processing or Digital Communications', 3, {
        pre: ['ECE313', 'M340L'], alias: ['ECE 362K', 'ECE 371Q', 'ECE 360K'],
        note: 'Prerequisites shown are for ECE 362K (also needs upper-division standing). ECE 371Q needs ECE 313 and 351K. ECE 360K needs ECE 351K and 313, with ECE 351M or 445S completed or concurrent.' }),
      CSP445S: ece('ECE 445S or 471C', 'Real-Time DSP Laboratory or Wireless Communications Laboratory', 4, {
        pre: ['ECE312', 'ECE319K', 'ECE313'], co: ['ECE333T', 'ECE351K'], alias: ['ECE 445S', 'ECE 471C'],
        note: 'Prerequisites shown are for ECE 445S. ECE 471C needs ECE 445S and ECE 351M or 360K, with engineering communication completed or concurrent. Either one is a core lab.' }),
    },
    n: 4, options: ['ECE 325', 'ECE 325K', 'ECE 445S', 'ECE 351M', 'ECE 360C', 'ECE 460J', 'ECE 360K', 'ECE 461P', 'ECE 362K', 'ECE 363M', 'ECE 471C', 'ECE 371Q', 'M 325K', 'M 362M', 'M 365C'],
    path: { a: ['M427L', 'CSP325'], b: ['CSP362K', 'CSP445S', 'CHOICE1'], c: ['CHOICE2', 'CHOICE3'], d: ['CHOICE4'] },
    critical: 'Electrical-side critical path: ECE 302, ECE 411, then a core lab (ECE 445S or 471C here), ECE 364D and senior design.',
  });
  concentration({
    id: 'eic', name: 'Electronics and Integrated Circuits', short: 'Electronics/ICs', slug: 'electronics-integrated-circuits',
    labs: ['ECE438'],
    courses: pick('ECE325', 'ECE339', 'ECE438', 'ECE316', 'M427L'),
    n: 3, options: ['ECE 321K', 'ECE 438K', 'ECE 338L', 'ECE 440', 'ECE 445L', 'ECE 445S', 'ECE 460M', 'ECE 460N', 'ECE 460R', 'ECE 360S', 'ECE 361R', 'ECE 363M', 'ECE 374K', 'ECE 374L'],
    path: { a: ['M427L', 'ECE325'], b: ['ECE339', 'ECE438', 'ECE316'], c: ['CHOICE1', 'CHOICE2'], d: ['CHOICE3'] },
    critical: 'Electrical-side critical path: ECE 302, ECE 411, ECE 438, ECE 364D, senior design.',
  });
  concentration({
    id: 'esre', name: 'Energy Systems and Renewable Energy', short: 'Energy', slug: 'energy-systems-renewable-energy',
    labs: ['ESRE462L'],
    courses: {
      ...pick('ECE325', 'ECE362K', 'M427L'),
      ESRE369:  ece('ECE 369 or 468L', 'Power Systems Engineering or Power Systems Apparatus and Lab', 3, {
        pre: ['ECE411'], alias: ['ECE 369', 'ECE 468L'],
        note: 'Prerequisites shown are for ECE 369. ECE 468L (4 hours) needs ECE 411 with engineering communication completed or concurrent. The 26-hour total assumes ECE 369 here and a lab in the other slot.' }),
      ESRE462L: ece('ECE 462L or 468L', 'Power Electronics Laboratory or Power Systems Apparatus and Lab', 4, {
        pre: ['ECE411'], co: ['ECE333T'], alias: ['ECE 462L', 'ECE 468L'],
        note: 'Either one is a core lab. If you take ECE 468L in the other slot, take ECE 462L here.' }),
    },
    n: 3, options: ['ECE 339', 'ECE 339S', 'ECE 341', 'ECE 362Q', 'ECE 362R', 'ECE 362S', 'ECE 368L', 'ECE 369', 'M E 337C'],
    path: { a: ['M427L', 'ECE325'], b: ['ESRE369', 'ESRE462L', 'ECE362K'], c: ['CHOICE1', 'CHOICE2'], d: ['CHOICE3'] },
    critical: 'Electrical-side critical path: ECE 302, ECE 411, then a power lab (ECE 462L or 468L), ECE 364D and senior design.',
  });
  concentration({
    id: 'fwem', name: 'Fields, Waves, and Electromagnetic Systems', short: 'Fields/Waves', slug: 'fields-waves-electromagnetic-systems',
    labs: ['FW438'],
    courses: {
      ...pick('ECE325', 'ECE339', 'M427L'),
      FW438:  ece('ECE 438, 462L or 468L', 'Electronic Circuits, Power Electronics or Power Systems Lab', 4, {
        pre: ['ECE411'], co: ['ECE333T'], alias: ['ECE 438', 'ECE 462L', 'ECE 468L'],
        note: 'All three need ECE 411 with engineering communication completed or concurrent. Each is a core lab.' }),
      FW325K: ece('ECE 325K or 363M', 'Antennas and Wireless Propagation or Microwave and RF Engineering', 3, {
        pre: ['ECE325'], alias: ['ECE 325K', 'ECE 363M'], note: 'Both need ECE 325.' }),
    },
    n: 3, options: ['ECE 321K', 'ECE 325K', 'ECE 334K', 'ECE 341', 'ECE 347', 'ECE 348', 'ECE 361R', 'ECE 363M', 'ECE 363N', 'ECE 369', 'ECE 374K', 'ECE 374L'],
    path: { a: ['M427L', 'ECE325'], b: ['ECE339', 'FW438', 'FW325K'], c: ['CHOICE1', 'CHOICE2'], d: ['CHOICE3'] },
    critical: 'Critical path: ECE 302, ECE 411, ECE 325 (with M 427L), ECE 325K or 363M; the core lab (ECE 438, 462L or 468L) gates ECE 364D and senior design.',
  });
  concentration({
    id: 'nano', name: 'Nanoelectronics and Nanotechnology', short: 'Nano', slug: 'nanoelectronics-nanotechnology',
    labs: ['ECE440'],
    courses: pick('ECE325', 'ECE339', 'ECE440', 'M427L'),
    n: 4, options: ['ECE 334K', 'ECE 438', 'ECE 338L', 'ECE 339S', 'ECE 347', 'ECE 348', 'ECE 360S', 'ECE 460R'],
    path: { a: ['M427L', 'ECE325'], b: ['ECE339', 'ECE440', 'CHOICE1'], c: ['CHOICE2', 'CHOICE3'], d: ['CHOICE4'] },
    critical: 'Electrical-side critical path: ECE 302, ECE 411, ECE 325; ECE 440 is the core lab that gates ECE 364D and senior design.',
  });
})();
