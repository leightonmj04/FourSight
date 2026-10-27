// B.S. Architectural Engineering, 2026-28 catalog, 126 hours. Prerequisites from the 2025-26 ARE,
// C E, E M and M E course listings. The eight-semester arrangement is FourSight's, built to satisfy
// every prerequisite and the fall/spring-only courses; the CAEE flowchart is in its Box folder.
FS.define({
  id: 'are',
  name: 'Architectural Engineering',
  degree: 'BSArchE',
  dept: 'Civil, Architectural and Environmental Engineering',
  hours: 126,
  categories: { major: 'Architectural Engineering', stem: 'Math and Science', core: 'Core Curriculum', alt: 'Arch History and Math/Science', tech: 'Technical Electives' },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'CH301', 'GEO303',
      'EM306', 'EM319', 'ES333T', 'ME310T', 'ARE217', 'ARE323K', 'CE311K', 'CE311S', 'CE319F', 'CE324P', 'CE329', 'CE357'),
    ARE102:  { code: 'ARE 102',  title: 'Introduction to Architectural Engineering', hrs: 1, cat: 'major', offered: 'fall',
               note: 'For architectural engineering and architecture majors. Offered in the fall only.' },
    ARE320K: { code: 'ARE 320K', title: 'Introduction to Design I', hrs: 3, cat: 'major', pre: ['ARE217'], co: ['EM319'], offered: 'fall' },
    ARE320L: { code: 'ARE 320L', title: 'Introduction to Design II', hrs: 3, cat: 'major', pre: ['ARE320K'], co: ['CE329'], offered: 'spring' },
    ARE335:  { code: 'ARE 335',  title: 'Materials and Methods of Building Construction', hrs: 3, cat: 'major', pre: ['CE324P'] },
    ARE346N: { code: 'ARE 346N', title: 'Building Environmental Systems', hrs: 3, cat: 'major', pre: ['PHY303L', 'PHY105N', 'ME310T'] },
    ARE346P: { code: 'ARE 346P or 371', title: 'HVAC Design or Energy Simulation in Building Design', hrs: 3, cat: 'major', pre: ['ARE346N'],
               alias: ['ARE 346P', 'ARE 371'], note: 'Either course satisfies the requirement; the other can count as a technical elective.' },
    ARE366:  { code: 'ARE 366',  title: 'Contracts, Liability, and Ethics', hrs: 3, cat: 'major', pre: ['ARE323K'] },
    ARE465:  { code: 'ARE 465',  title: 'Integrated Design Project', hrs: 4, cat: 'major', pre: ['ARE320L', 'ARE346N', 'CE331', 'CE357'], co: ['ARE335'] },
    CE331:   { code: 'C E 331 or 335', title: 'Reinforced Concrete Design or Elements of Steel Design', hrs: 3, cat: 'major', pre: ['CE324P', 'CE329'],
               alias: ['C E 331', 'C E 335'], note: 'Either course satisfies the requirement; the other can count as a structural technical elective.' },

    ...FS.pick(['RHE306', {}], 'E316', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS', 'UGS'),

    ARCHHIST: { code: 'Arch History', title: 'Approved architectural history course', hrs: 3, cat: 'alt',
                note: 'From the department\'s approved list. It also fills the Visual and Performing Arts (050) core requirement.' },
    MATHSCI:  { code: 'Math/Science Elective', title: 'Approved math or science elective', hrs: 3, cat: 'alt', note: 'From the department\'s approved list.' },
    ...FS.slots('TECH', 3, { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', pool: 'tech',
      note: 'Nine hours from three areas: building energy and environments (ARE 346P/371, ARE 370, C E 341, C E 370L, M E 339, M E 374F, M E 374S, M E 379N); construction and materials (ARE 358, ARE 376, C E 351, M E 349, M E 378K, M E 378P); structural (ARE 345K, ARE 362L, C E 331/335, C E 360K fall only, C E 362M, C E 362N, C E 363, C E 375 spring only, E M 339). M E-prefix electives carry prerequisites written for ME majors; check with the CAEE undergraduate office. Current lists are in the Box folder.' }),
  },
  plan: [
    ['M408C', 'CH301', 'ARE102', 'RHE306', 'GOV310L', 'ARCHHIST'],
    ['ARE217', 'UGS', 'M408D', 'PHY303K', 'PHY105M', 'GEO303'],
    ['M427J', 'PHY303L', 'PHY105N', 'EM306', 'ME310T', 'CE311S'],
    ['CE311K', 'EM319', 'CE319F', 'AMHIST', 'MATHSCI'],
    ['E316', 'ES333T', 'ARE320K', 'CE329', 'TECH3'],
    ['CE324P', 'CE357', 'ARE323K', 'ARE320L', 'GOV312'],
    ['CE331', 'ARE346N', 'ARE366', 'TECH1', 'SBS'],
    ['ARE335', 'ARE465', 'ARE346P', 'TECH2', 'USHIST'],
  ],
  pools: {
    tech: { codes: ['ARE 346P', 'ARE 371', 'ARE 370', 'C E 341', 'C E 370L', 'M E 339', 'M E 374F', 'M E 374S', 'M E 379N', 'ARE 358', 'ARE 376', 'C E 351', 'M E 349', 'M E 378K', 'M E 378P', 'ARE 345K', 'ARE 362L', 'C E 331', 'C E 335', 'C E 360K', 'C E 362M', 'C E 362N', 'C E 363', 'C E 375', 'E M 339'] },
  },
  notes: [
    'Critical path: M 408C, M 408D, E M 306, E M 319, C E 324P, C E 331 or 335, ARE 465. Feeder chains: C E 311K, C E 329, C E 331/335; and ARE 217, ARE 320K (fall only), ARE 320L (spring only), ARE 465.',
    'RHE 306 fills the 010 core area here, and the architectural history course fills Visual and Performing Arts (050).',
    'The suggested semester order here is FourSight\'s, built to meet every prerequisite and to spread engineering courses evenly across the four years. Compare it with the CAEE flowchart, which marks co- and prerequisites.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/architectural-engineering-bsarche/' },
    { label: 'Flowcharts and elective lists (Box)', url: 'https://utexas.box.com/s/u8net0m4kxxmzsz0r5v0sv4rb086gl9t' },
  ],
});
