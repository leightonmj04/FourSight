// B.S. Geosystems Engineering (offered with the Jackson School of Geosciences), 2026-28 catalog,
// 132 hours. Prerequisites from the 2025-26 PGE listing, several of which still name courses the
// 2026-28 BSGE no longer requires; those are listed under `prior` so they show as notes. The
// eight-semester arrangement (with the summer field course) is FourSight's; the department's
// current flowcharts are still the 2024-26 ones.
FS.define({
  id: 'ge',
  name: 'Geosystems Engineering',
  degree: 'BSGE',
  dept: 'Hildebrand Department of Petroleum and Geosystems Engineering',
  hours: 132,
  categories: { major: 'Geosystems Engineering', stem: 'Math and Science', core: 'Core Curriculum', alt: 'Geosciences', tech: 'Engineering and Geoscience Electives' },
  terms: [
    { kind: 'fall', year: 1 }, { kind: 'spring', year: 1 }, { kind: 'fall', year: 2 }, { kind: 'spring', year: 2 },
    { kind: 'fall', year: 3 }, { kind: 'spring', year: 3 }, { kind: 'summer', year: 3 }, { kind: 'fall', year: 4 }, { kind: 'spring', year: 4 },
  ],
  prior: {
    GEO416M: 'GEO 416M or 316P: named as a prerequisite in the 2025-26 PGE listing but not part of the 2026-28 BSGE. Confirm with PGE advising.',
    PGE427: 'PGE 427 (Properties of Petroleum Fluids): named as a prerequisite in the 2025-26 listing but not part of the 2026-28 BSGE. Confirm with PGE advising.',
    PGE301: 'PGE 301 (Engineering, Energy, and the Environment): named as a prerequisite in the 2025-26 listing but not part of the 2026-28 BSGE. Confirm with PGE advising.',
    PGE323L: 'PGE 323L (Reservoir Engineering II): named as a prerequisite in the 2025-26 listing but not required in the 2026-28 BSGE (it is a Section I elective). Confirm with PGE advising.',
    PGE362: 'PGE 362 (Production Technology and Design): named as a prerequisite in the 2025-26 listing but not required in the 2026-28 BSGE (it is a Section I elective). Confirm with PGE advising.',
  },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'CH301', 'CH302', 'EM306', 'EM319', 'RHE306',
      'PGE311', 'PGE326', 'PGE322K', 'PGE333T', 'PGE430'),
    PGE424:  { code: 'PGE 424', title: 'Petrophysics', hrs: 4, cat: 'major', pre: ['GEO416M', 'PGE333T', 'PHY303L'], co: ['PGE322K'] },
    PGE323K: { code: 'PGE 323K', title: 'Reservoir Engineering I: Primary Recovery', hrs: 3, cat: 'major', pre: ['PGE311', 'PGE326', 'PGE427'], co: ['PGE322K', 'PGE424'] },
    PGE334:  { code: 'PGE 334', title: 'Reservoir Geomechanics', hrs: 3, cat: 'major', pre: ['EM319', 'PGE301', 'PGE424'] },
    PGE358:  { code: 'PGE 358', title: 'Principles of Formation Evaluation', hrs: 3, cat: 'major', pre: ['GEO416M', 'PHY303L', 'PHY105N', 'PGE424'] },
    PGE365:  { ...FS.SHARED.PGE365, note: 'Listed as petroleum majors only in 2025-26; Geosystems students may need department clearance.' },
    PGE373L: { code: 'PGE 373L', title: 'Geosystems Engineering Design and Analysis', hrs: 3, cat: 'major', pre: ['PGE323K', 'PGE323L', 'PGE362', 'PGE358'],
               note: 'The listing accepts PGE 358 or 368; PGE 358 is the one in this degree.' },
    GEO303:  { ...FS.SHARED.GEO303, cat: 'alt' },
    GEO416E: { code: 'GEO 416E', title: 'Solid Earth Processes', hrs: 4, cat: 'alt' },
    GEO416S: { code: 'GEO 416S', title: 'Earth and Planetary Processes Through Time', hrs: 4, cat: 'alt' },
    GEO416W: { code: 'GEO 416W', title: 'Climate, Water, and the Environment', hrs: 4, cat: 'alt' },
    GEO476K: { code: 'GEO 476K', title: 'Groundwater Hydrology', hrs: 4, cat: 'alt' },
    GEO420K: { code: 'GEO 420K', title: 'Introduction to Field and Stratigraphic Methods', hrs: 4, cat: 'alt' },
    GEO376L: { code: 'GEO 376L', title: 'Field Methods in Groundwater Hydrology', hrs: 3, cat: 'alt', offered: 'summer',
               note: 'A summer field course, taken between junior and senior year in the plan of study.' },

    ...FS.pick('UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),

    ...FS.slots('GEENG', 2, { code: 'Engineering Elective', title: 'Approved engineering elective (Section I)', hrs: 3, cat: 'tech', pool: 'eng',
      note: 'Section I: E S 369N; PGE 323L, 323M, 338, 362, 364, 376; PGE 379 topics (geothermal, carbon capture and storage, energy and the environment, subsurface machine learning, EOR, high-performance computing, hydraulic fracturing, applied subsurface geology, advanced well construction, global carbon monitoring, unconventional resources). Take at least two Section I and two Section II courses; one Section III course can replace either. PGE and geology faculty approve electives before you register.' }),
    ...FS.slots('GEOSCI', 2, { code: 'Geoscience Elective', title: 'Approved geoscience elective (Section II)', hrs: 3, cat: 'tech', pool: 'geo',
      note: 'Section II: GEO 320S, 325K, 325M, 327G, 328W, 428, 330K, 338J, 341, 346C, 347D, 347G, 455S, 660A, 365Q, 468K, 370E, 371C, 371T topics, 376S, 377K. Section III (one, in place of a I or II course): M 340L, 341, 346, 348, 368K, 427L; C E 370K; C S 323E, 367; CHE 359; FIN 320F and similar. One-course caps apply to some topic groups.' }),
  },
  plan: [
    ['M408C', 'CH301', 'GEO303', 'RHE306', 'UGS'],
    ['M408D', 'CH302', 'PHY303K', 'PHY105M', 'GEO416E'],
    ['M427J', 'PHY303L', 'PHY105N', 'EM306', 'PGE311', 'PGE333T'],
    ['EM319', 'PGE326', 'PGE322K', 'GEO416S', 'GOV310L'],
    ['PGE424', 'PGE323K', 'PGE430', 'GEO416W', 'USHIST'],
    ['PGE358', 'PGE334', 'PGE365', 'GEO476K', 'GEO420K'],
    ['GEO376L'],
    ['PGE373L', 'GEENG1', 'GEOSCI1', 'E316', 'VAPA'],
    ['GEENG2', 'GEOSCI2', 'AMHIST', 'GOV312', 'SBS'],
  ],
  pools: {
    eng: { codes: ['E S 369N', 'PGE 323L', 'PGE 323M', 'PGE 338', 'PGE 362', 'PGE 364', 'PGE 376', 'PGE 379', 'PGE 679HA', 'PGE 679HB', 'M 340L', 'M 341', 'M 346', 'M 348', 'M 368K', 'M 427L', 'C E 370K', 'C S 323E', 'C S 367', 'CHE 359'] },
    geo: { codes: ['GEO 320S', 'GEO 325K', 'GEO 325M', 'GEO 327G', 'GEO 328W', 'GEO 428', 'GEO 330K', 'GEO 338J', 'GEO 341', 'GEO 346C', 'GEO 347D', 'GEO 347G', 'GEO 455S', 'GEO 660A', 'GEO 365Q', 'GEO 468K', 'GEO 370E', 'GEO 371C', 'GEO 371T', 'GEO 376S', 'GEO 377K'] },
  },
  notes: [
    'Critical path: M 408D, PGE 326, PGE 323K, PGE 365; and a GEO course with PGE 333T, then PGE 424, PGE 358, PGE 373L. GEO 376L, a summer field course, sits between junior and senior year.',
    'Prerequisite mismatch: several PGE prerequisites in the 2025-26 listings name courses the 2026-28 BSGE no longer requires (PGE 301 and 427 for 334 and 323K; PGE 323L and 362 for 373L; GEO 416M or 316P for 424 and 358). PGE 365 is also listed as petroleum-majors only. Either the 2026-28 listings changed or Geosystems students get department clearance; confirm with PGE advising. These show as notes in each course\'s details, not as lines.',
    'The department\'s degree requirements page still lists 2024-26 flowcharts and elective lists as current. The suggested semester order here is FourSight\'s, built to meet every prerequisite in the plan.',
  ],
  links: [
    { label: 'Catalog page', url: 'https://catalog.utexas.edu/undergraduate/programs/geosystems-engineering-bsge/' },
    { label: 'Degree requirements page', url: 'https://www.pge.utexas.edu/?p=790' },
    { label: 'Approved electives (2024-26)', url: 'https://pge.utexas.edu/wp-content/uploads/Geosystems-Engineering-Approved-Technical-Electives-24-26.pdf' },
  ],
});
