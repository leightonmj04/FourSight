// B.S. Mechanical Engineering, 2026-28 catalog, 126 hours. Prerequisites from the 2025-26 M E and
// E M course listings. Lecture-lab pairs (M E 330 + 130L and so on) are separate cards taken
// together. The eight-semester arrangement is FourSight's, built to satisfy every prerequisite;
// the department's recommended timeline is on its undergraduate page.
FS.define({
  id: 'me',
  name: 'Mechanical Engineering',
  degree: 'BSME',
  dept: 'Walker Department of Mechanical Engineering',
  hours: 126,
  categories: { major: 'Mechanical Engineering', stem: 'Math and Science', core: 'Core Curriculum', alt: 'Math/Science Elective', tech: 'Career Gateway Electives' },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'M427L', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'CH301',
      'EM306', 'EM319', 'ES333T', 'RHE306'),
    ME302:   { code: 'M E 302',  title: 'Introduction to Engineering Design and Graphics', hrs: 3, cat: 'major' },
    ME316T:  { code: 'M E 316T', title: 'Thermodynamics', hrs: 3, cat: 'major', pre: ['CH301', 'M408D', 'PHY303K'] },
    ME314D:  { code: 'M E 314D', title: 'Dynamics', hrs: 3, cat: 'major', pre: ['EM306', 'M408D'] },
    ME318M:  { code: 'M E 318M', title: 'Programming and Engineering Computational Methods', hrs: 3, cat: 'major', pre: ['M427J'] },
    ME330:   { code: 'M E 330',  title: 'Fluid Mechanics', hrs: 3, cat: 'major', pre: ['EM306', 'M427J', 'ME316T'], co: ['ME130L'] },
    ME130L:  { code: 'M E 130L', title: 'Experimental Fluid Mechanics', hrs: 1, cat: 'major', co: ['ME330'] },
    ME334:   { code: 'M E 334',  title: 'Materials Engineering', hrs: 3, cat: 'major', pre: ['CH301'], co: ['PHY303L', 'PHY105N', 'EM319'] },
    ME134L:  { code: 'M E 134L', title: 'Materials Engineering Laboratory', hrs: 1, cat: 'major', co: ['ME334'] },
    ME335:   { code: 'M E 335',  title: 'Engineering Statistics', hrs: 3, cat: 'major', pre: ['M408D'] },
    ME338:   { code: 'M E 338',  title: 'Machine Elements', hrs: 3, cat: 'major', pre: ['EM319', 'ME334'] },
    ME339:   { code: 'M E 339',  title: 'Heat Transfer', hrs: 3, cat: 'major', pre: ['ME318M', 'ME330', 'ME130L'], co: ['ME139L'] },
    ME139L:  { code: 'M E 139L', title: 'Experimental Heat Transfer', hrs: 1, cat: 'major', co: ['ME339'] },
    ME340:   { code: 'M E 340',  title: 'Mechatronics', hrs: 3, cat: 'major', pre: ['ME318M', 'PHY303L', 'PHY105N'], co: ['ME140L'] },
    ME140L:  { code: 'M E 140L', title: 'Mechatronics Laboratory', hrs: 1, cat: 'major', co: ['ME340'] },
    ME344:   { code: 'M E 344',  title: 'Dynamic Systems and Controls', hrs: 3, cat: 'major', pre: ['M427J', 'ME318M', 'ME314D', 'ME340', 'ME140L'], co: ['ME144L'] },
    ME144L:  { code: 'M E 144L', title: 'Dynamic Systems and Controls Laboratory', hrs: 1, cat: 'major', co: ['ME344'] },
    ME353:   { code: 'M E 353',  title: 'Engineering Finance', hrs: 3, cat: 'major', pre: ['ME335'] },
    ME366J:  { code: 'M E 366J', title: 'Mechanical Engineering Design Methodology', hrs: 3, cat: 'major',
               pre: ['ME302', 'ME330', 'ME130L', 'ME335', 'ME338', 'ME339', 'ME139L', 'ME340', 'ME140L', 'ES333T'] },
    ME466E:  { code: 'M E 466E', title: 'Mechanical Engineering Capstone Design', hrs: 4, cat: 'major', pre: ['ME344', 'ME144L', 'ME353', 'ME366J'],
               note: 'M E 466E is not in the 2025-26 listings. The prerequisites shown are those of the capstone it replaces (M E 266K/266P): M E 344, 144L, 353 and 366J. Confirm in the course catalog.' },

    ...FS.pick('UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),

    MATHSCI: { code: 'Math/Science Elective', title: 'Approved math or natural science elective', hrs: 3, cat: 'alt', note: 'From the department\'s approved list.' },
    ...FS.slots('CGE', 4, { code: 'Career Gateway Elective', title: 'Career Gateway Elective', hrs: 3, cat: 'tech', pool: 'cge',
      note: 'Twelve hours in one technical track (earns a credential), up to two combined tracks, a specialty track, or a pre-approved custom track. Settle your track around when you register for M E 330 or 334; you can start CGEs once the undergraduate office records it. Tracks offered in 2026: Energy Systems; Nuclear and Radiation; Advanced Materials; Automotive and Vehicle Systems; Design and Manufacturing; Dynamics, Vibrations, Acoustics and Controls; Industrial Engineering and Management; Biomedical and Biomechanical; Humanitarian; Robotics and Mechatronics; Sustainable Engineering. Prerequisites depend on the course; most need M E 318M, 330, 334 or 340.' }),
  },
  plan: [
    ['M408C', 'CH301', 'ME302', 'UGS', 'GOV312'],
    ['RHE306', 'M408D', 'PHY303K', 'PHY105M', 'MATHSCI'],
    ['M427J', 'PHY303L', 'PHY105N', 'EM306', 'ME316T', 'ES333T'],
    ['M427L', 'ME318M', 'EM319', 'ME314D', 'ME330', 'ME130L'],
    ['E316', 'ME334', 'ME134L', 'ME339', 'ME139L', 'ME340', 'ME140L'],
    ['ME335', 'ME344', 'ME144L', 'ME338', 'VAPA', 'AMHIST'],
    ['ME353', 'CGE1', 'ME366J', 'CGE3', 'SBS'],
    ['GOV310L', 'CGE2', 'ME466E', 'CGE4', 'USHIST'],
  ],
  pools: {
    cge: { codes: ['M E 336', 'M E 336P', 'M E 337C', 'M E 337F', 'M E 337G', 'M E 343', 'M E 348F', 'M E 349', 'M E 350', 'M E 350R', 'M E 354M', 'M E 355K', 'M E 359', 'M E 361E', 'M E 363M', 'M E 364L', 'M E 365D', 'M E 366L', 'M E 367S', 'M E 368C', 'M E 369P', 'M E 371D', 'M E 374T', 'M E 376N', 'M E 378D', 'M E 378E', 'M E 378K', 'M E 379M', 'M E 379N', 'E S 277'] },
  },
  notes: [
    'Critical path, two zero-slack chains: M 427J, M E 318M, M E 340, M E 344, M E 466E; and M E 316T, M E 330, M E 339, M E 366J, M E 466E. Both run from the third semester straight through the eighth.',
    'Career Gateway Elective track lists here come from the department\'s spring and fall 2026 offering sheets, not the complete track lists.',
    'The suggested semester order here is FourSight\'s, built to meet every prerequisite and to spread engineering courses evenly across the four years. Compare it with the department\'s recommended BSME timeline.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/mechanical-engineering-bsme/' },
    { label: 'Recommended course timeline', url: 'https://me.utexas.edu/?p=5659' },
    { label: 'Career Gateway Electives', url: 'https://me.utexas.edu/academics/undergraduate-program/career-gateway-electives' },
  ],
});
