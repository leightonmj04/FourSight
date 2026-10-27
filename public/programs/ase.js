// B.S. Aerospace Engineering, 2026-28 catalog, 127 hours. Prerequisites from the 2025-26 ASE,
// COE, E M and M E course listings. The eight-semester arrangement is FourSight's, built to satisfy
// every prerequisite; the department's own flowchart is in its Box folder.
FS.define({
  id: 'ase',
  name: 'Aerospace Engineering',
  degree: 'BSAsE',
  dept: 'Aerospace Engineering and Engineering Mechanics',
  hours: 127,
  categories: { major: 'Aerospace Engineering', stem: 'Math and Science', core: 'Core Curriculum', alt: 'Structures Elective', tech: 'Aerospace and Technical Electives' },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'M427L', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'CH301',
      'EM306', 'EM311M', 'EM319', 'ES333T', 'RHE306', 'COE301', 'COE311K', 'ME210', 'ME310T', 'ASE320', 'ASE330M', 'ASE375'),
    ASE120K: { code: 'ASE 120K', title: 'Low-Speed Aerodynamics Laboratory', hrs: 1, cat: 'major', pre: ['M427L'], co: ['ASE320', 'ES333T'] },
    ASE324L: { code: 'ASE 324L', title: 'Aerospace Materials Laboratory', hrs: 3, cat: 'major', pre: ['EM319'] },
    ASE362K: { code: 'ASE 362K', title: 'Compressible Flow', hrs: 3, cat: 'major', pre: ['ASE320'] },
    ASE366K: { code: 'ASE 366K', title: 'Spacecraft Dynamics', hrs: 3, cat: 'major', pre: ['COE311K', 'EM311M', 'M427J'] },
    ASE367K: { code: 'ASE 367K', title: 'Flight Dynamics', hrs: 3, cat: 'major', pre: ['ASE320'] },
    ASE370C: { code: 'ASE 370C', title: 'Feedback Control Systems', hrs: 3, cat: 'major', pre: ['ASE330M'] },
    ASE376K: { code: 'ASE 376K', title: 'Propulsion', hrs: 3, cat: 'major', pre: ['ASE362K'] },
    ASE374D: { code: 'ASE 374D', title: 'Aerospace Systems Senior Design I', hrs: 3, cat: 'major', co: ['ASE366K', 'ASE367K'] },
    ASE374E: { code: 'ASE 374E', title: 'Aerospace Systems Senior Design II', hrs: 3, cat: 'major', pre: ['ASE374D'] },
    ASELAB:  { code: 'ASE 162M or 166M', title: 'High-Speed Aerodynamics Lab or Spacecraft Systems Lab', hrs: 1, cat: 'major',
               pre: [['ASE362K', 'ASE366K']], alias: ['ASE 162M', 'ASE 166M'],
               note: 'ASE 162M needs ASE 362K; ASE 166M needs ASE 366K. Either lab satisfies the requirement.' },

    ...FS.pick('UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),

    STRUCT:  { code: 'Structures Elective', title: 'Approved structures elective', hrs: 3, cat: 'alt', pre: ['EM319'], pool: 'struct',
               note: 'One of: ASE 339 or E M 339 Advanced Strength of Materials (E M 319); ASE 357 Mechanics of Composite Materials (E M 319); ASE 365 Structural Dynamics (E M 319); COE 321K Computational Methods for Structural Analysis (COE 311K, E M 319).' },
    ...FS.slots('ASEEL', 3, { code: 'ASE Elective', title: 'Approved aerospace elective', hrs: 3, cat: 'tech', pool: 'ase',
      note: 'Nine hours from the department\'s approved list (in its Box folder). The pool includes ASE 339, 346, 355, 357, 364, 365, 366L, 372K, 372N, 376C, 376D, 376F, 376G, 379K, 379L and 479W. Prerequisites depend on the course; most need ASE 320, ASE 330M, ASE 366K or E M 319.' }),
    TECHEL:  { code: 'Technical Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech',
               note: 'Approved by aerospace faculty before you enroll. Three ASE 128 project-lab credits combine into one technical elective, as does one ASE 128 plus a two-hour co-op.' },
  },
  plan: [
    ['M408C', 'CH301', 'COE301', 'GOV310L', 'GOV312'],
    ['ME210', 'RHE306', 'M408D', 'PHY303K', 'PHY105M', 'UGS'],
    ['M427J', 'PHY303L', 'PHY105N', 'EM306', 'COE311K', 'ES333T'],
    ['ME310T', 'M427L', 'EM311M', 'EM319', 'SBS'],
    ['ASE320', 'ASE120K', 'ASE324L', 'AMHIST', 'STRUCT', 'ASEEL2'],
    ['E316', 'ASE362K', 'ASE367K', 'ASE366K', 'ASEEL1'],
    ['VAPA', 'ASE330M', 'ASE374D', 'ASE376K', 'ASELAB', 'TECHEL'],
    ['ASE375', 'ASE370C', 'USHIST', 'ASE374E', 'ASEEL3'],
  ],
  pools: {
    struct: { codes: ['ASE 339', 'E M 339', 'ASE 357', 'ASE 365', 'COE 321K'] },
    ase: { codes: ['ASE 339', 'ASE 346', 'ASE 355', 'ASE 357', 'ASE 364', 'ASE 365', 'ASE 366L', 'ASE 372K', 'ASE 372N', 'ASE 376C', 'ASE 376D', 'ASE 376F', 'ASE 376G', 'ASE 379K', 'ASE 379L', 'ASE 479W'] },
  },
  notes: [
    'Critical path: M 408C, M 408D, M 427L, ASE 320, ASE 367K, ASE 374D, ASE 374E. M E 310T must also be done before ASE 320. A second chain runs E M 306, E M 311M, ASE 330M, ASE 370C.',
    'Every degree course needs a C- or better, letter-graded.',
    'The suggested semester order here is FourSight\'s, built to meet every prerequisite and to spread engineering courses evenly across the four years. Compare it with the department flowchart in the Box folder.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/aerospace-engineering-bsase/' },
    { label: 'Flowcharts and elective lists (Box)', url: 'https://utexas.app.box.com/v/degree-plan-flow-charts' },
  ],
});
