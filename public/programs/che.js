// B.S. Chemical Engineering (McKetta Department of Chemical Engineering), 2026-28 catalog, 129 hours.
// Sources: "2026-2028 CHE Suggested Arrangement of Courses", "CHE Prerequisite Flowchart",
// "Latest You Can Take Courses With Prereqs" and "Approved 4-hr Chemistry Electives". The on-time
// limits (latest) are the department's own figures.
FS.define({
  id: 'che',
  name: 'Chemical Engineering',
  degree: 'BSChE',
  dept: 'McKetta Department of Chemical Engineering',
  hours: 129,
  categories: { major: 'Chemical Engineering', stem: 'Math and Science', core: 'Core Curriculum', alt: 'Chemistry Elective', tech: 'Tech Elective' },
  prior: { CH301: 'CH 301 (Principles of Chemistry I): AP or prior credit assumed' },
  courses: {
    // Chemical Engineering
    CHE102:   { code: 'CHE 102', title: 'Intro to Chemical Engineering', hrs: 1, cat: 'major', optional: true, latest: 7, note: 'Optional course. Students who skip it take 16 hours in their first fall instead.' },
    CHE210:   { code: 'CHE 210', title: 'Introduction to Computing', hrs: 2, cat: 'major', latest: 2 },
    CHE317:   { code: 'CHE 317', title: 'Intro to ChE Analysis', hrs: 3, cat: 'major', pre: ['CHE210', 'CH302', 'M408D'], latest: 3 },
    CHE319:   { code: 'CHE 319', title: 'Transport Phenomena', hrs: 3, cat: 'major', pre: ['CHE317', 'M427J'], latest: 4 },
    CHE322:   { code: 'CHE 322', title: 'Thermodynamics', hrs: 3, cat: 'major', pre: ['CHE210', 'CHE317', 'CH353', 'M427J'], latest: 5 },
    CHE253K:  { code: 'CHE 253K', title: 'Applied Statistics', hrs: 2, cat: 'major', pre: ['CHE210', 'M427J'], co: ['CHE317'], latest: 5 },
    CHE354:   { code: 'CHE 354', title: 'Transport Processes', hrs: 3, cat: 'major', pre: ['CHE319'], latest: 5 },
    CHE348:   { code: 'CHE 348', title: 'Numerical Methods in ChE', hrs: 3, cat: 'major', pre: ['CHE210', 'CHE317', 'M427J'], latest: 5 },
    ES333T:   { code: 'E S 333T', title: 'Engineering Communication', hrs: 3, cat: 'major', pre: ['RHE306'], latest: 5 },
    CHE253M:  { code: 'CHE 253M', title: 'Measurement, Control and Data Lab', hrs: 2, cat: 'major', pre: ['ES333T', 'CHE319', 'CHE253K'], latest: 6 },
    CHE363:   { code: 'CHE 363', title: 'Separations and Mass Transfer', hrs: 3, cat: 'major', pre: ['CHE319', 'CHE322'], latest: 6 },
    CHE372:   { code: 'CHE 372', title: 'Chemical Reactor Design', hrs: 3, cat: 'major', pre: ['CHE322', 'CHE348', 'CHE354'], latest: 6 },
    CHE350:   { code: 'CHE 350', title: 'Chemical Engineering Materials', hrs: 3, cat: 'major', pre: ['CH353'], latest: 7 },
    CHE264:   { code: 'CHE 264', title: 'Process and Projects Lab', hrs: 2, cat: 'major', pre: ['CHE253M', 'CHE363'], latest: 7 },
    CHE338:   { code: 'CHE 338', title: 'Biochemical Engineering', hrs: 3, cat: 'major', pre: ['CHE317'], latest: 7 },
    CHE360:   { code: 'CHE 360', title: 'Process Control', hrs: 3, cat: 'major', pre: ['CHE322', 'CHE253M', 'CHE354'], latest: 7 },
    CHE473K:  { code: 'CHE 473K', title: 'Process Design and Operations', hrs: 4, cat: 'major', pre: ['CHE354', 'CHE363', 'CHE372'], latest: 7 },

    // Math and Science
    CH302:    { code: 'CH 302', title: 'Principles of Chemistry II', hrs: 3, cat: 'stem', pre: ['CH301'], latest: 2 },
    CH104M:   { code: 'CH 104M', title: 'Intro to Chemical Practice', hrs: 1, cat: 'stem', co: ['CH301'], latest: 4 },
    CH104N:   { code: 'CH 104N', title: 'Intro to Chemical Practice II', hrs: 1, cat: 'stem', pre: ['CH104M'], co: ['CH302'], latest: 5 },
    M408C:    { code: 'M 408C', title: 'Differential and Integral Calculus', hrs: 4, cat: 'stem', latest: 1 },
    M408D:    { code: 'M 408D', title: 'Sequences, Series, Multivariable Calc', hrs: 4, cat: 'stem', pre: ['M408C'], latest: 2 },
    PHY303K:  { code: 'PHY 303K', title: 'Engineering Physics I', hrs: 3, cat: 'stem', pre: ['M408C'], co: ['M408D'], latest: 2 },
    PHY105M:  { code: 'PHY 105M', title: 'Lab for PHY 303K', hrs: 1, cat: 'stem', co: ['PHY303K'], latest: 2 },
    CH328M:   { code: 'CH 328M', title: 'Organic Chemistry I', hrs: 3, cat: 'stem', pre: ['CH302'], latest: 6 },
    CH128K:   { code: 'CH 128K', title: 'Organic Chemistry Lab', hrs: 1, cat: 'stem', pre: ['CH104N'], co: ['CH328M'], latest: 6 },
    M427J:    { code: 'M 427J', title: 'Differential Equations w/ Linear Algebra', hrs: 4, cat: 'stem', pre: ['M408D'], latest: 3 },
    PHY303L:  { code: 'PHY 303L', title: 'Engineering Physics II', hrs: 3, cat: 'stem', pre: ['PHY303K', 'PHY105M', 'M408D'], co: ['PHY105N'], latest: 3 },
    PHY105N:  { code: 'PHY 105N', title: 'Lab for PHY 303L', hrs: 1, cat: 'stem', pre: ['PHY105M'], co: ['PHY303L'], latest: 3 },
    CH328N:   { code: 'CH 328N', title: 'Organic Chemistry II', hrs: 3, cat: 'stem', pre: ['CH328M'], latest: 7 },
    CH128L:   { code: 'CH 128L', title: 'Organic Chemistry Lab II', hrs: 1, cat: 'stem', pre: ['CH128K'], co: ['CH328N'], latest: 7 },
    CH353:    { code: 'CH 353', title: 'Physical Chemistry I', hrs: 3, cat: 'stem', pre: ['M408D', 'CH302', 'PHY303L', 'PHY105N'], latest: 4 },
    M427L:    { code: 'M 427L', title: 'Advanced Calculus for Applications II', hrs: 4, cat: 'stem', pre: ['M408D'], latest: 7 },
    CH153K:   { code: 'CH 153K', title: 'Physical Chemistry Laboratory', hrs: 1, cat: 'stem', pre: ['CH353'], latest: 7 },

    // Core Curriculum
    RHE306:   { code: 'RHE 306', title: 'Rhetoric and Writing', hrs: 3, cat: 'core', latest: 4 },
    SBS:      { code: 'SBS Core', title: 'Social and Behavioral Science', hrs: 3, cat: 'core', latest: 7 },
    UGS:      { code: 'UGS 302/303', title: 'First-Year Signature Course', hrs: 3, cat: 'core', latest: 1, note: 'Can be taken after Spring 1 without delaying graduation, with approval from the Signature Course department.' },
    GOV310L:  { code: 'GOV 310L', title: 'American Government', hrs: 3, cat: 'core', latest: 7 },
    E316:     { code: 'E 316L/M/N/P', title: 'Humanities Core', hrs: 3, cat: 'core', pre: ['RHE306'], latest: 7 },
    AMHIST:   { code: 'American History', title: 'History Core', hrs: 3, cat: 'core', latest: 7 },
    VAPA:     { code: 'VAPA', title: 'Visual and Performing Arts Core', hrs: 3, cat: 'core', latest: 7 },
    GOV312:   { code: 'GOV 306C or 312L/P', title: 'Topics in Government', hrs: 3, cat: 'core', latest: 7 },
    USHIST:   { code: 'US History', title: 'Approved US History Course', hrs: 3, cat: 'core', latest: 7 },

    // Electives
    CHEMEL:   { code: 'Chemistry Elective', title: '4-hr chemistry elective with lab', hrs: 4, cat: 'alt', latest: 7, note: 'Option 1: CH 431 or CH 455. Option 2: a course such as BCH 339F, BCH 369, CH 354, CH 354L or CH 367L, plus an approved lab experience (for example CH 154K, BIO 206L or undergraduate research).', pool: 'chem' },
    TECH1:    { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7, note: 'Four tech electives are required: 12 hours in one technical area, or 6 hours in each of two. At least two must be engineering courses and at least one of those CHE. Approved options are on the department\'s 2026-28 technical elective list.', pool: 'tech' },
    TECH2:    { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7, note: 'Four tech electives are required: 12 hours in one technical area, or 6 hours in each of two. At least two must be engineering courses and at least one of those CHE. Approved options are on the department\'s 2026-28 technical elective list.', pool: 'tech' },
    TECH3:    { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7, note: 'Four tech electives are required: 12 hours in one technical area, or 6 hours in each of two. At least two must be engineering courses and at least one of those CHE. Approved options are on the department\'s 2026-28 technical elective list.', pool: 'tech' },
    TECH4:    { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7, note: 'Four tech electives are required: 12 hours in one technical area, or 6 hours in each of two. At least two must be engineering courses and at least one of those CHE. Approved options are on the department\'s 2026-28 technical elective list.', pool: 'tech' },
  },
  // The department's suggested eight-semester arrangement.
  plan: [
    ['CH302', 'CH104M', 'CHE102', 'CHE210', 'M408C', 'RHE306', 'SBS'],
    ['CH104N', 'M408D', 'PHY303K', 'PHY105M', 'UGS', 'GOV310L'],
    ['CH328M', 'CH128K', 'CHE317', 'M427J', 'PHY303L', 'PHY105N'],
    ['CH328N', 'CH128L', 'CH353', 'CHE319', 'E316', 'M427L'],
    ['CH153K', 'CHE322', 'ES333T', 'CHE253K', 'CHE354', 'CHE348'],
    ['CHE253M', 'CHE363', 'CHE372', 'AMHIST', 'VAPA', 'TECH1'],
    ['CHE350', 'CHE264', 'CHE338', 'GOV312', 'TECH2', 'TECH3'],
    ['CHE360', 'CHE473K', 'USHIST', 'TECH4', 'CHEMEL'],
  ],
  pools: {
    chem: { codes: ['CH 431', 'CH 455', 'BCH 339F', 'BCH 369', 'CH 354', 'CH 354L', 'CH 354M', 'CH 367L', 'CH 371K', 'CH 367C', 'CH 368', 'CH 369K'] },
    // From "McKetta Technical Electives, 2020-2028 catalogs". Upper-division math counts once;
    // only one undergraduate research course counts.
    tech: {
      upperMath: true,
      research: ['CHE 377K', 'CHE 377L', 'E S 321G'],
      codes: (
        'CHE 322M,CHE 323,CHE 337,CHE 339,CHE 339P,CHE 339T,CHE 341,CHE 342,CHE 343,CHE 344,CHE 355,CHE 356,CHE 357,CHE 359,' +
        'CHE 364S,CHE 376K,CHE 377K,CHE 377L,CHE 379,CHE 679HA,CHE 679HB,' +
        'ARE 323K,BME 352,BME 353,BME 365R,BME 377T,C E 341,C E 342,C E 364,C E 369L,C E 370K,ECE 334K,E E 334K,ECE 339,E E 339,' +
        'ECE 370K,E E 370K,ECE 374K,E E 374K,ECE 379K,E E 379K,E S 321G,E S 369N,M E 334,M E 335,M E 336P,M E 337C,M E 337G,' +
        'M E 348F,M E 349,M E 353,M E 354,M E 359,M E 361E,M E 363M,M E 366L,M E 374F,M E 374S,M E 379M,PGE 301,PGE 323K,' +
        'PGE 365,PGE 379,PGE 430,ACC 310F,BCH 339F,BCH 339J,BCH 339M,BCH 339N,BCH 364C,BCH 369,BCH 370,BIO 325,BIO 339,' +
        'CH 341,CH 354,CH 354L,CH 368,CH 376K,ECO 304K,ECO 304L,ECO 328,ECO 339K,ECO 351K,FIN 357,GEO 303E,I B 378,INB 365S,' +
        'BIO 365S,MAN 327,MBS 320,BIO 320,MBS 326R,BIO 326R,MIS 302F,MKT 320F,MKT 460,PHY 338K,PHY 355,PHY 375S'
      ).split(','),
    },
  },
  notes: [
    'Critical path: CHE 210 and M 408D, then CHE 317, CHE 319, CHE 354, CHE 372 and CHE 473K. Feeder chains: CH 353, CHE 322, CHE 363, CHE 264; and CHE 319 + CHE 253K, CHE 253M, CHE 360.',
    'Some upper-division CHE courses require a C- or better in CHE 210, 317 and 319 plus CH 353, M 427J, PHY 303L and PHY 105N.',
    'All courses need a C- or better.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/chemical-engineering-bsche/' },
    { label: '2026-28 flowchart', url: 'https://utexas.app.box.com/s/utfzqqs8yezowuxi6ky8vxe98hedy3pb' },
    { label: '2026-28 degree plan', url: 'https://utexas.app.box.com/s/3sp60jatfeg78mi4flhzyjlm83i7m40k' },
    { label: 'Approved technical electives', url: 'https://utexas.app.box.com/s/q8mxetnsqg80m5ugyh7bf4e6xavqmda5' },
  ],
});
