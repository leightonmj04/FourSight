// B.S. Environmental Engineering, 2026-28 catalog, 125 hours. Prerequisites from the 2025-26 EVE,
// C E, ARE, E M and M E course listings. EnvE takes CH 401 and 402, which stand in for the CH 301
// and 302 named in other departments' prerequisites. The eight-semester arrangement is FourSight's,
// built to satisfy every prerequisite; the CAEE flowchart is in its Box folder.
FS.define({
  id: 'eve',
  name: 'Environmental Engineering',
  degree: 'BSEnvE',
  dept: 'Civil, Architectural and Environmental Engineering',
  hours: 125,
  categories: { major: 'Environmental Engineering', stem: 'Math and Science', core: 'Core Curriculum', alt: 'Math, Science and Engineering Electives', tech: 'Environmental and Design Electives' },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'EM306', 'ES333T',
      'CH401', 'CH402', ['CH328M', { pre: ['CH402'] }], 'BIO311C', 'GEO303',
      'ARE323K', 'CE311K', 'CE311S', 'CE319F', 'CE356'),
    EVE103:  { code: 'EVE 103', title: 'First-Year Seminar', hrs: 1, cat: 'major' },
    EVE302:  { code: 'EVE 302', title: 'Foundations of Environmental Engineering', hrs: 3, cat: 'major', co: ['CH402'],
               note: 'The listing names CH 302 (co); CH 402 is the EnvE equivalent.' },
    EVE310:  { code: 'EVE 310', title: 'Sustainable Systems Engineering', hrs: 3, cat: 'major', co: ['PHY303L'] },
    EVE312:  { code: 'EVE 312', title: 'Environmental Engineering and Science', hrs: 3, cat: 'major', pre: ['EVE302', 'M427J'], co: ['ES333T'] },
    THERMO:  { code: 'M E 310T, 316T or CH 353', title: 'Thermodynamics option', hrs: 3, cat: 'major', pre: ['CH401', 'M408D', 'PHY303K'],
               alias: ['M E 310T', 'M E 316T', 'CH 353'],
               note: 'Prerequisites shown are for M E 310T and 316T (CH 301, here CH 401; M 408D; PHY 303K). Check the chemistry listing for CH 353.' },

    ...FS.pick('RHE306', 'UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),

    ...FS.slots('EVEEL', 5, { code: 'EnvE Elective', title: 'Environmental engineering elective', hrs: 3, cat: 'tech', pool: 'eve',
      note: 'Fifteen hours, at least 6 from a single area: 1. Climate and energy (ARE 346N, 346P, 370, 371, 372, 377K; C E 369L, 369R, 370L). 2. Sustainable water systems (C E 342, 346; EVE 350). 3. Water resources and the environment (C E 357, 358, 374K, 374N, 374U). 4. Contaminant fate and transport (C E 342; CHE 319, 322; ask the CAEE office how EnvE students get into these CHE courses). The undergraduate advisor can approve courses not listed.' }),
    DESIGN:  { code: 'Design Elective', title: 'Approved design elective', hrs: 3, cat: 'tech', pool: 'design', alias: ['EVE 360', 'EVE 370'],
               note: 'The catalog\'s design-focused EVE courses: EVE 360 (C E 319F; 333T; C E 369L or 369R; M E 320 or 326) and EVE 370 (C E 342 or 369L). Both build on the environmental electives, so this sits in the final semester.' },
    MATHSCI: { code: 'Math/Science Elective', title: 'Approved math or science elective', hrs: 3, cat: 'alt', note: 'From the undergraduate office\'s list.' },
    ...FS.slots('ENGEL', 2, { code: 'Engineering Elective', title: 'Approved engineering elective', hrs: 3, cat: 'alt', note: 'Six hours from the undergraduate office\'s list.' }),
  },
  plan: [
    ['M408C', 'CH401', 'EVE103', 'RHE306', 'UGS'],
    ['M408D', 'CH402', 'EVE302', 'PHY303K', 'PHY105M'],
    ['M427J', 'PHY303L', 'PHY105N', 'EM306', 'CH328M', 'EVE310'],
    ['EVE312', 'ES333T', 'CE311K', 'CE319F', 'THERMO', 'BIO311C'],
    ['CE356', 'CE311S', 'ARE323K', 'GEO303', 'EVEEL1'],
    ['EVEEL2', 'EVEEL3', 'MATHSCI', 'GOV310L', 'E316'],
    ['EVEEL4', 'EVEEL5', 'ENGEL1', 'VAPA', 'AMHIST'],
    ['DESIGN', 'ENGEL2', 'GOV312', 'USHIST', 'SBS'],
  ],
  pools: {
    eve: { codes: ['ARE 346N', 'ARE 346P', 'ARE 370', 'ARE 371', 'ARE 372', 'ARE 377K', 'C E 369L', 'C E 369R', 'C E 370L', 'C E 342', 'C E 346', 'EVE 350', 'C E 357', 'C E 358', 'C E 374K', 'C E 374N', 'C E 374U', 'CHE 319', 'CHE 322'] },
    design: { codes: ['EVE 360', 'EVE 370'] },
  },
  notes: [
    'Critical path: CH 401, CH 402 (EVE 302 alongside), EVE 302, EVE 312, C E 342 or 369L, EVE 370 (design). A second chain runs E M 306, C E 319F, C E 356, C E 374K.',
    'The catalog asks EnvE students to pick Visual and Performing Arts (050) and Social and Behavioral Sciences (080) courses that also meet ABET criteria. GOV 310L and 312L are the plan\'s government courses.',
    'The suggested semester order here is FourSight\'s, built to meet every prerequisite. Compare it with the CAEE flowchart in the Box folder.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/environmental-engineering-bsenve/' },
    { label: 'Flowcharts and elective lists (Box)', url: 'https://utexas.box.com/s/u8net0m4kxxmzsz0r5v0sv4rb086gl9t' },
  ],
});
