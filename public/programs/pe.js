// B.S. Petroleum Engineering, 2026-28 catalog, 128 hours. Prerequisites from the 2025-26 PGE
// listing. The eight-semester arrangement is FourSight's, built to satisfy every prerequisite;
// the department's current flowcharts are still the 2024-26 ones.
FS.define({
  id: 'pe',
  name: 'Petroleum Engineering',
  degree: 'BSPE',
  dept: 'Hildebrand Department of Petroleum and Geosystems Engineering',
  hours: 128,
  categories: { major: 'Petroleum Engineering', stem: 'Math, Science and Geology', core: 'Core Curriculum', tech: 'Technical Area Electives' },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'CH301', 'CH302', 'EM306', 'EM319', 'RHE306', 'GEO303',
      'PGE311', 'PGE326', 'PGE322K', 'PGE333T', 'PGE430', 'PGE365'),
    PGE301:  { code: 'PGE 301', title: 'Engineering, Energy, and the Environment', hrs: 3, cat: 'major', co: ['GEO303'], note: 'For beginning PGE students.' },
    PGE427:  { code: 'PGE 427', title: 'Properties of Petroleum Fluids', hrs: 4, cat: 'major', pre: ['CH302', 'PGE326'] },
    PGE424:  { code: 'PGE 424', title: 'Petrophysics', hrs: 4, cat: 'major', pre: ['GEO316P', 'PGE333T', 'PHY303L'], co: ['PGE322K'] },
    PGE323K: { code: 'PGE 323K', title: 'Reservoir Engineering I: Primary Recovery', hrs: 3, cat: 'major', pre: ['PGE311', 'PGE326', 'PGE427'], co: ['PGE322K', 'PGE424'] },
    PGE323L: { code: 'PGE 323L', title: 'Reservoir Engineering II: Secondary and Tertiary Recovery', hrs: 3, cat: 'major', pre: ['M427J', 'PGE311', 'PGE322K', 'PGE323K', 'PGE424'] },
    PGE358:  { code: 'PGE 358', title: 'Principles of Formation Evaluation', hrs: 3, cat: 'major', pre: ['GEO316P', 'PHY303L', 'PHY105N', 'PGE424'] },
    PGE362:  { code: 'PGE 362', title: 'Production Technology and Design', hrs: 3, cat: 'major', pre: ['PGE430'] },
    PGE338:  { code: 'PGE 338', title: 'Geostatistics and Data Analysis', hrs: 3, cat: 'major', pre: ['M408D', 'PGE311'] },
    PGE334:  { code: 'PGE 334', title: 'Reservoir Geomechanics', hrs: 3, cat: 'major', pre: ['EM319', 'PGE301', 'PGE424'] },
    PGE373L: { code: 'PGE 373L', title: 'Geosystems Engineering Design and Analysis', hrs: 3, cat: 'major', pre: ['PGE323K', 'PGE323L', 'PGE362', 'PGE358'] },
    GEO316P: { code: 'GEO 316P', title: 'Sedimentary Rocks', hrs: 3, cat: 'stem' },

    ...FS.pick('UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),

    ...FS.slots('PETE', 4, { code: 'Technical Elective', title: 'Approved technical area elective', hrs: 3, cat: 'tech', pool: 'tech',
      note: 'Twelve hours: two to four Section I courses (E S 369N; PGE 323M, 364, 376; PGE 379 topics such as artificial lift, facilities management, EOR, hydraulic fracturing, geothermal, carbon capture and storage, subsurface machine learning), up to two Section II courses (related technical: C E 370K, 374K; COE 321K; C S 323E, 367; GEO 330K, 346C, 347D, 376L, 376S, 377K, 420K, 468K, 476K; M 340L, 341, 346, 348, 368K, 427L; PGE 379.8, 363, 371), and at most one Section III course (CHE 359; FIN, I B, LEB or MAN 320F; M E 363M). Only one oil-and-gas-law topic counts, and only one of PGE 363 or 371. The PGE undergraduate advisor approves electives before you enroll.' }),
  },
  plan: [
    ['M408C', 'CH301', 'GEO303', 'PGE301', 'RHE306'],
    ['M408D', 'CH302', 'PHY303K', 'PHY105M', 'UGS', 'GOV310L'],
    ['M427J', 'PHY303L', 'PHY105N', 'EM306', 'PGE326', 'PGE311'],
    ['EM319', 'PGE427', 'PGE322K', 'PGE333T', 'GEO316P'],
    ['PGE424', 'PGE323K', 'PGE430', 'PGE338', 'E316'],
    ['PGE323L', 'PGE358', 'PGE362', 'PGE334', 'PGE365'],
    ['PGE373L', 'PETE1', 'PETE2', 'VAPA', 'AMHIST'],
    ['PETE3', 'PETE4', 'GOV312', 'USHIST', 'SBS'],
  ],
  pools: {
    tech: { codes: ['E S 369N', 'PGE 323M', 'PGE 364', 'PGE 376', 'PGE 379', 'PGE 679HA', 'PGE 679HB', 'C E 370K', 'C E 374K', 'COE 321K', 'C S 323E', 'C S 367', 'GEO 330K', 'GEO 346C', 'GEO 347D', 'GEO 376L', 'GEO 376S', 'GEO 377K', 'GEO 420K', 'GEO 468K', 'GEO 476K', 'GEO 371T', 'M 340L', 'M 341', 'M 346', 'M 348', 'M 368K', 'M 427L', 'PGE 363', 'PGE 371', 'CHE 359', 'FIN 320F', 'I B 320F', 'LEB 320F', 'MAN 320F', 'M E 363M'] },
  },
  notes: [
    'Critical path: PGE 326, PGE 427, PGE 323K, PGE 323L, PGE 373L. Two feeder chains join the capstone: E M 306, E M 319, PGE 430, PGE 362; and GEO 316P with PGE 333T, then PGE 424, PGE 358.',
    'Every degree course must be letter-graded with a C- or better.',
    'The department\'s degree requirements page still lists 2024-26 flowcharts and elective lists as current. The suggested semester order here is FourSight\'s, built to meet every prerequisite.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/petroleum-engineering-bspe/' },
    { label: 'Degree requirements page', url: 'https://www.pge.utexas.edu/?p=790' },
    { label: 'Approved electives (2024-26)', url: 'https://pge.utexas.edu/wp-content/uploads/Petroleum-Engineering-Approved-Technical-Electives-24-26.pdf' },
  ],
});
