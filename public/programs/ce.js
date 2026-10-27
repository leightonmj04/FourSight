// B.S. Civil Engineering, 2026-28 catalog, 124 hours. Prerequisites from the 2025-26 C E, ARE,
// E M and M E course listings. The eight-semester arrangement is FourSight's, built to satisfy every
// prerequisite; the CAEE flowchart is in its Box folder.
FS.define({
  id: 'ce',
  name: 'Civil Engineering',
  degree: 'BSCE',
  dept: 'Civil, Architectural and Environmental Engineering',
  hours: 124,
  categories: { major: 'Civil Engineering', stem: 'Math and Science', core: 'Core Curriculum', alt: 'Science Elective', tech: 'Technical Electives' },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'CH301', 'CH302',
      'EM306', 'EM319', 'ES333T', 'ARE217', 'ARE323K', 'CE311K', 'CE311S', 'CE319F', 'CE324P', 'CE329', 'CE341', 'CE356', 'CE357'),
    CE301:   { code: 'C E 301',  title: 'Civil Engineering Systems', hrs: 3, cat: 'major' },
    CE321:   { code: 'C E 321',  title: 'Transportation Systems', hrs: 3, cat: 'major', pre: ['CE311S'] },
    DYN:     { code: 'E M 311M or M E 310T', title: 'Dynamics or Applied Thermodynamics', hrs: 3, cat: 'major', pre: ['M408D'],
               alias: ['E M 311M', 'M E 310T'],
               note: 'E M 311M needs E M 306 and M 408D. M E 310T needs CH 301, M 408D and PHY 303K. Only the prerequisite both share is checked here.' },
    CE370P:  { code: 'C E 370P', title: 'Engineering Professionalism', hrs: 3, cat: 'major',
               pre: ['ARE323K', 'CE321', 'CE324P', 'CE329', 'CE341', 'CE356', 'CE357', 'CETECH1', 'CETECH2', 'CETECH3'],
               note: 'Needs the six base-level courses (C E 321, 329, 341, 356, 357 and ARE 323K) plus C E 324P and any three technical electives completed.' },

    ...FS.pick('RHE306', 'UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),

    SCIEL:   { code: 'Science Elective', title: 'Approved science elective', hrs: 3, cat: 'alt', note: 'From the department\'s approved list.' },
    ...FS.slots('CETECH', 6, { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', pool: 'tech',
      note: 'Eighteen hours from the CE and ArchE technical electives, with at least one course in each of three different areas: construction and project management (ARE 335, 358, 366, 376); infrastructure materials (C E 351, 366K); environmental (ARE 346N, C E 342, 346, 364, 369L, 369R, 370K, 370L); geotechnical (C E 360K fall only, C E 375 spring only); structural (ARE 345K, 362L, C E 331, 335, 362M, 362N, 363); transportation (C E 367G, 367P, 367R, 367T); water resources (C E 358, 374K, 374N, 374U). One 3-hour course from the approved math, science or engineering list can replace one of these, but it does not count toward the three-area rule.' }),
  },
  plan: [
    ['M408C', 'CH301', 'CE301', 'RHE306', 'SCIEL'],
    ['ARE217', 'M408D', 'PHY303K', 'PHY105M', 'CH302', 'UGS'],
    ['GOV310L', 'M427J', 'PHY303L', 'PHY105N', 'EM306', 'CE311K'],
    ['E316', 'EM319', 'CE311S', 'CE319F', 'USHIST'],
    ['ES333T', 'CE321', 'CE341', 'VAPA', 'CETECH5'],
    ['CE329', 'CE357', 'CETECH2', 'CETECH3', 'SBS'],
    ['CE324P', 'CE356', 'ARE323K', 'CETECH1', 'AMHIST'],
    ['DYN', 'CETECH4', 'GOV312', 'CE370P', 'CETECH6'],
  ],
  pools: {
    tech: { codes: ['ARE 335', 'ARE 358', 'ARE 366', 'ARE 376', 'C E 351', 'C E 366K', 'ARE 346N', 'C E 342', 'C E 346', 'C E 364', 'C E 369L', 'C E 369R', 'C E 370K', 'C E 370L', 'C E 360K', 'C E 375', 'ARE 345K', 'ARE 362L', 'C E 331', 'C E 335', 'C E 362M', 'C E 362N', 'C E 363', 'C E 367G', 'C E 367P', 'C E 367R', 'C E 367T', 'C E 358', 'C E 374K', 'C E 374N', 'C E 374U'] },
  },
  notes: [
    'Critical path: M 408C, M 408D, E M 306, E M 319, C E 329, C E 331, C E 362M. C E 370P closes the degree: it needs all six base-level courses plus three technical electives already completed.',
    'No track is declared. Technical electives must cover at least three different areas; the department chair can approve other substitutions in writing.',
    'The suggested semester order here is FourSight\'s, built to meet every prerequisite and to spread engineering courses evenly across the four years. Compare it with the CAEE flowchart in the Box folder.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/civil-engineering-bsce/' },
    { label: 'Flowcharts and elective lists (Box)', url: 'https://utexas.box.com/s/u8net0m4kxxmzsz0r5v0sv4rb086gl9t' },
  ],
});
