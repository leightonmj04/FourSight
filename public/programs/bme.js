// B.S. Biomedical Engineering, 2026-28 catalog, 132 hours in all four concentrations. The degree
// core is shared; concentrations differ only in their 12 elective hours. Prerequisites from the
// 2025-26 BME course listing. No public BME flowchart was found, so the eight-semester arrangement
// follows the catalog's plan of study and is built to satisfy every prerequisite.
FS.define({
  id: 'bme',
  name: 'Biomedical Engineering',
  degree: 'BSBiomedE',
  dept: 'Biomedical Engineering',
  hours: 132,
  categories: { major: 'Biomedical Engineering', stem: 'Math and Science', core: 'Core Curriculum', tech: 'Concentration Electives' },
  courses: {
    ...FS.pick('M408C', 'M408D', 'M427J', 'PHY303K', 'PHY105M', 'PHY303L', 'PHY105N', 'ES333T', 'RHE306',
      'CH401', 'CH402', 'BIO311C', 'BIO206L'),
    ORGO:    { code: 'CH 320M or 328M', title: 'Organic Chemistry I', hrs: 3, cat: 'stem', pre: ['CH402'], alias: ['CH 320M', 'CH 328M'] },
    BCH369:  { ...FS.SHARED.BCH369, pre: ['ORGO'],
               note: 'The BCH 369 listing requires organic chemistry (CH 320M or 328M) first; confirm current prerequisites in the course catalog.' },
    BME303:  { code: 'BME 303',  title: 'Introduction to Computing', hrs: 3, cat: 'major', note: 'BME majors only.' },
    BME303L: { code: 'BME 303L', title: 'Introduction to Biomedical Engineering Design', hrs: 3, cat: 'major', note: 'BME majors only.' },
    BME214L: { code: 'BME 214L', title: 'Computational Fundamentals of BME Design', hrs: 2, cat: 'major',
               pre: ['BME303', 'BME303L', 'PHY303K', 'PHY105M'], co: ['BME311', 'M427J', 'PHY303L', 'PHY105N'] },
    BME311:  { code: 'BME 311',  title: 'Network Analysis in Biomedical Engineering', hrs: 3, cat: 'major', pre: ['PHY303K'], co: ['M427J', 'PHY303L'] },
    BME313L: { code: 'BME 313L', title: 'Introduction to Numerical Methods in BME', hrs: 3, cat: 'major', pre: ['BME303', 'BME303L', 'M427J'] },
    BME335:  { code: 'BME 335',  title: 'Engineering Probability and Statistics', hrs: 3, cat: 'major', pre: ['BME303', 'M408D'] },
    BME344:  { code: 'BME 344',  title: 'Biomechanics', hrs: 3, cat: 'major', pre: ['BME303L', 'M427J', 'PHY303K'] },
    BME343:  { code: 'BME 343',  title: 'BME Signal and Systems Analysis', hrs: 3, cat: 'major', pre: ['BME311', 'BME313L', 'M427J'] },
    BME245L: { code: 'BME 245L', title: 'Experimental Principles of BME Design', hrs: 2, cat: 'major', pre: ['BIO206L', 'BME214L', 'BME335', 'BME344', 'ES333T'] },
    BME349:  { code: 'BME 349',  title: 'Biomedical Instrumentation', hrs: 3, cat: 'major', pre: ['BME343'] },
    BME352:  { code: 'BME 352',  title: 'Engineering Biomaterials', hrs: 3, cat: 'major', pre: ['BCH369', 'BME344'] },
    BME353:  { code: 'BME 353',  title: 'Transport Phenomena in Living Systems', hrs: 3, cat: 'major', pre: ['BME311', 'BME214L', 'M427J', 'PHY303L', 'PHY105N'] },
    BME355:  { code: 'BME 355',  title: 'Molecular Engineering', hrs: 3, cat: 'major', pre: ['BCH369', 'BIO311C', 'M427J', 'PHY303L', 'PHY105N'] },
    BME365R: { code: 'BME 365R', title: 'Quantitative Engineering Physiology I', hrs: 3, cat: 'major', pre: ['BIO311C', 'BME214L', 'PHY303L', 'PHY105N'], co: ['BCH369', 'BME343'] },
    BME365S: { code: 'BME 365S', title: 'Quantitative Engineering Physiology II', hrs: 3, cat: 'major', pre: ['BME365R'] },
    BME261L: { code: 'BME 261L', title: 'Development and Analysis in BME Design', hrs: 2, cat: 'major', pre: ['BME343', 'BME245L'] },
    BME370:  { code: 'BME 370',  title: 'BME Capstone Design I', hrs: 3, cat: 'major', pre: ['BME349', 'BME352', 'BME353', 'BME261L', 'BME365S'] },
    BME371:  { code: 'BME 371',  title: 'BME Capstone Design II', hrs: 3, cat: 'major', pre: ['BME370'] },

    ...FS.pick('UGS', 'E316', 'VAPA', 'AMHIST', 'USHIST', 'GOV310L', 'GOV312', 'SBS'),

    ...FS.slots('CONC', 4, { code: 'Concentration Elective', title: 'Approved concentration elective', hrs: 3, cat: 'tech', pool: 'conc',
      note: 'Twelve hours from your concentration\'s list, at least 6 of them engineering courses; the advising office approves technical courses before you register. Imaging and Instrumentation: BME 336, 337, 347, 350, 357, 358M, 368, 374D (imaging) or BME 306, 322, 354, 363, 374K, 374L, ECE 312, 319K, 438, 445L, 445M, 445S, 351M (instrumentation). Cellular and Biomolecular: BIO 325, BME 322, 336, 344C, 356, 359, 362C, 363, 364, 365, 366, 369C, 373, 375, 376, 379, CH 320N/328N, MBS 320, 326M, PHM 338 (biomaterials) or BME 337, 346, 348P, 354, 356, 358M, 359, CHE 339P (nanotechnology). Computational: BME 306, 322, 336, 345, 346, 347, 348P, 350, 357, 358M, 368, 372P, 373, ECE 312, 319K, 422C, 360C, 371Q, M 325K, 340L. Molecular, Cellular and Tissue Biomechanics: BME 322, 336, 342, 346, 347, 354, 358M, 359, 365, 372P, 373, 376, CHE 339P, KIN 326K, M E 314D, 344, 354, 372J. Pick a concentration by the end of sophomore year.' }),
  },
  plan: [
    ['M408C', 'BME303', 'BME303L', 'CH401', 'RHE306'],
    ['M408D', 'PHY303K', 'PHY105M', 'CH402', 'BIO311C', 'UGS'],
    ['M427J', 'PHY303L', 'PHY105N', 'BME311', 'BME214L', 'BME335'],
    ['BME313L', 'BME344', 'ORGO', 'BIO206L', 'ES333T', 'BME353'],
    ['BME343', 'BME245L', 'BCH369', 'BME365R', 'GOV310L', 'E316'],
    ['BME349', 'BME352', 'BME355', 'BME365S', 'BME261L', 'VAPA'],
    ['BME370', 'CONC1', 'CONC2', 'AMHIST', 'GOV312'],
    ['BME371', 'CONC3', 'CONC4', 'USHIST', 'SBS'],
  ],
  pools: {
    conc: { codes: ['BME 306', 'BME 322', 'BME 336', 'BME 337', 'BME 342', 'BME 344C', 'BME 345', 'BME 346', 'BME 347', 'BME 348P', 'BME 350', 'BME 354', 'BME 356', 'BME 357', 'BME 358M', 'BME 359', 'BME 362C', 'BME 363', 'BME 364', 'BME 365', 'BME 366', 'BME 368', 'BME 369C', 'BME 372P', 'BME 373', 'BME 374D', 'BME 374K', 'BME 374L', 'BME 375', 'BME 376', 'BME 379', 'ECE 312', 'ECE 319K', 'ECE 351M', 'ECE 360C', 'ECE 371Q', 'ECE 422C', 'ECE 438', 'ECE 445L', 'ECE 445M', 'ECE 445S', 'ECE 347', 'BIO 325', 'CH 320N', 'CH 328N', 'MBS 320', 'MBS 326M', 'PHM 338', 'CHE 339P', 'KIN 326K', 'M 325K', 'M 340L', 'M E 314D', 'M E 344', 'M E 354', 'M E 372J'] },
  },
  notes: [
    'Critical path with no slack: M 408C, M 408D, M 427J, BME 313L, BME 343, BME 349, BME 370, BME 371. That is eight courses for eight semesters, so a delay anywhere on it pushes graduation.',
    'The four concentrations (Imaging and Instrumentation; Cellular and Biomolecular; Computational; Molecular, Cellular, and Tissue Biomechanics) share this degree core and differ only in their 12 elective hours.',
    'No public BME flowchart was found; the catalog\'s plan of study is the closest published sequence. Current elective lists are on the BME advising office website.',
  ],
  links: [
    { label: 'Catalog: Imaging and Instrumentation', url: 'https://catalog.utexas.edu/undergraduate/programs/biomedical-engineering-biomedical-imaging-instrumentation-bsbiomede/' },
    { label: 'Catalog: Cellular and Biomolecular', url: 'https://catalog.utexas.edu/undergraduate/programs/biomedical-engineering-cellular-biomolecular-engineering-bsbiomede/' },
    { label: 'Catalog: Computational', url: 'https://catalog.utexas.edu/undergraduate/programs/biomedical-engineering-computational-biomedical-engineering-bsbiomede/' },
    { label: 'Catalog: Molecular, Cellular, and Tissue Biomechanics', url: 'https://catalog.utexas.edu/undergraduate/programs/biomedical-engineering-molecular-cellular-tissue-biomechanics-bsbiomede/' },
  ],
});
