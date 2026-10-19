// McKetta Department of Chemical Engineering, 2026-2028 catalog (129 credit hours).
// Sources: "2026-2028 CHE Suggested Arrangement of Courses", "CHE Prerequisite Flowchart",
// "Latest You Can Take Courses With Prereqs" and "Approved 4-hr Chemistry Electives".
//
// pre: must be completed in an EARLIER semester.
// co:  may be taken earlier or in the SAME semester (co-requisite).
// latest: last semester index (0 = Fall 1 ... 7 = Spring 4) the course can be taken
//         and still graduate in four years.
// Prerequisites outside the plan (CH 301) are treated as incoming credit.

window.CATEGORIES = {
  che:  { label: 'Chemical Engineering', short: 'ChE' },
  stem: { label: 'Math and Science',     short: 'STEM' },
  core: { label: 'Core Curriculum',      short: 'Core' },
  chem: { label: 'Chemistry Elective',   short: 'Chem' },
  tech: { label: 'Tech Elective',        short: 'Tech' },
};

window.PRIOR_CREDIT = { 'CH301': 'CH 301 (Principles of Chemistry I): AP or prior credit assumed' };

window.COURSES = {
  // Chemical Engineering
  CHE102:  { code: 'CHE 102',  title: 'Intro to Chemical Engineering', hrs: 1, cat: 'che', optional: true, latest: 7 },
  CHE210:  { code: 'CHE 210',  title: 'Introduction to Computing', hrs: 2, cat: 'che', latest: 2 },
  CHE317:  { code: 'CHE 317',  title: 'Intro to ChE Analysis', hrs: 3, cat: 'che', pre: ['CHE210', 'CH302', 'M408D'], latest: 3 },
  CHE319:  { code: 'CHE 319',  title: 'Transport Phenomena', hrs: 3, cat: 'che', pre: ['CHE317', 'M427J'], latest: 4 },
  CHE322:  { code: 'CHE 322',  title: 'Thermodynamics', hrs: 3, cat: 'che', pre: ['CHE210', 'CHE317', 'CH353', 'M427J'], latest: 5 },
  CHE253K: { code: 'CHE 253K', title: 'Applied Statistics', hrs: 2, cat: 'che', pre: ['CHE210', 'M427J'], co: ['CHE317'], latest: 5 },
  CHE354:  { code: 'CHE 354',  title: 'Transport Processes', hrs: 3, cat: 'che', pre: ['CHE319'], latest: 5 },
  CHE348:  { code: 'CHE 348',  title: 'Numerical Methods in ChE', hrs: 3, cat: 'che', pre: ['CHE210', 'CHE317', 'M427J'], latest: 5 },
  ES333T:  { code: 'E S 333T', title: 'Engineering Communication', hrs: 3, cat: 'che', pre: ['RHE306'], latest: 5 },
  CHE253M: { code: 'CHE 253M', title: 'Measurement, Control and Data Lab', hrs: 2, cat: 'che', pre: ['ES333T', 'CHE319', 'CHE253K'], latest: 6 },
  CHE363:  { code: 'CHE 363',  title: 'Separations and Mass Transfer', hrs: 3, cat: 'che', pre: ['CHE319', 'CHE322'], latest: 6 },
  CHE372:  { code: 'CHE 372',  title: 'Chemical Reactor Design', hrs: 3, cat: 'che', pre: ['CHE322', 'CHE348', 'CHE354'], latest: 6 },
  CHE350:  { code: 'CHE 350',  title: 'Chemical Engineering Materials', hrs: 3, cat: 'che', pre: ['CH353'], latest: 7 },
  CHE264:  { code: 'CHE 264',  title: 'Process and Projects Lab', hrs: 2, cat: 'che', pre: ['CHE253M', 'CHE363'], latest: 7 },
  CHE338:  { code: 'CHE 338',  title: 'Biochemical Engineering', hrs: 3, cat: 'che', pre: ['CHE317'], latest: 7 },
  CHE360:  { code: 'CHE 360',  title: 'Process Control', hrs: 3, cat: 'che', pre: ['CHE322', 'CHE253M', 'CHE354'], latest: 7 },
  CHE473K: { code: 'CHE 473K', title: 'Process Design and Operations', hrs: 4, cat: 'che', pre: ['CHE354', 'CHE363', 'CHE372'], latest: 7 },

  // Math and Science
  CH302:   { code: 'CH 302',   title: 'Principles of Chemistry II', hrs: 3, cat: 'stem', pre: ['CH301'], latest: 2 },
  CH104M:  { code: 'CH 104M',  title: 'Intro to Chemical Practice', hrs: 1, cat: 'stem', co: ['CH301'], latest: 4 },
  CH104N:  { code: 'CH 104N',  title: 'Intro to Chemical Practice II', hrs: 1, cat: 'stem', pre: ['CH104M'], co: ['CH302'], latest: 5 },
  M408C:   { code: 'M 408C',   title: 'Differential and Integral Calculus', hrs: 4, cat: 'stem', latest: 1 },
  M408D:   { code: 'M 408D',   title: 'Sequences, Series, Multivariable Calc', hrs: 4, cat: 'stem', pre: ['M408C'], latest: 2 },
  PHY303K: { code: 'PHY 303K', title: 'Engineering Physics I', hrs: 3, cat: 'stem', pre: ['M408C'], co: ['M408D'], latest: 2 },
  PHY105M: { code: 'PHY 105M', title: 'Lab for PHY 303K', hrs: 1, cat: 'stem', co: ['PHY303K'], latest: 2 },
  CH328M:  { code: 'CH 328M',  title: 'Organic Chemistry I', hrs: 3, cat: 'stem', pre: ['CH302'], latest: 6 },
  CH128K:  { code: 'CH 128K',  title: 'Organic Chemistry Lab', hrs: 1, cat: 'stem', pre: ['CH104N'], co: ['CH328M'], latest: 6 },
  M427J:   { code: 'M 427J',   title: 'Differential Equations w/ Linear Algebra', hrs: 4, cat: 'stem', pre: ['M408D'], latest: 3 },
  PHY303L: { code: 'PHY 303L', title: 'Engineering Physics II', hrs: 3, cat: 'stem', pre: ['PHY303K', 'PHY105M', 'M408D'], co: ['PHY105N'], latest: 3 },
  PHY105N: { code: 'PHY 105N', title: 'Lab for PHY 303L', hrs: 1, cat: 'stem', pre: ['PHY105M'], co: ['PHY303L'], latest: 3 },
  CH328N:  { code: 'CH 328N',  title: 'Organic Chemistry II', hrs: 3, cat: 'stem', pre: ['CH328M'], latest: 7 },
  CH128L:  { code: 'CH 128L',  title: 'Organic Chemistry Lab II', hrs: 1, cat: 'stem', pre: ['CH128K'], co: ['CH328N'], latest: 7 },
  CH353:   { code: 'CH 353',   title: 'Physical Chemistry I', hrs: 3, cat: 'stem', pre: ['M408D', 'CH302', 'PHY303L', 'PHY105N'], latest: 4 },
  M427L:   { code: 'M 427L',   title: 'Advanced Calculus for Applications II', hrs: 4, cat: 'stem', pre: ['M408D'], latest: 7 },
  CH153K:  { code: 'CH 153K',  title: 'Physical Chemistry Laboratory', hrs: 1, cat: 'stem', pre: ['CH353'], latest: 7 },

  // Core Curriculum
  RHE306:  { code: 'RHE 306',  title: 'Rhetoric and Writing', hrs: 3, cat: 'core', latest: 4 },
  SBS:     { code: 'SBS Core', title: 'Social and Behavioral Science', hrs: 3, cat: 'core', latest: 7 },
  UGS:     { code: 'UGS 302/303', title: 'First-Year Signature Course', hrs: 3, cat: 'core', latest: 1,
             note: 'Can be taken after Spring 1 without delaying graduation, with approval from the Signature Course department.' },
  GOV310L: { code: 'GOV 310L', title: 'American Government', hrs: 3, cat: 'core', latest: 7 },
  E316:    { code: 'E 316L/M/N/P', title: 'Humanities Core', hrs: 3, cat: 'core', pre: ['RHE306'], latest: 7 },
  AMHIST:  { code: 'American History', title: 'History Core', hrs: 3, cat: 'core', latest: 7 },
  VAPA:    { code: 'VAPA', title: 'Visual and Performing Arts Core', hrs: 3, cat: 'core', latest: 7 },
  GOV312:  { code: 'GOV 306C or 312L/P', title: 'Topics in Government', hrs: 3, cat: 'core', latest: 7 },
  USHIST:  { code: 'US History', title: 'Approved US History Course', hrs: 3, cat: 'core', latest: 7 },

  // Electives
  CHEMEL:  { code: 'Chemistry Elective', title: '4-hr chemistry elective with lab', hrs: 4, cat: 'chem', latest: 7,
             note: 'Option 1: CH 431 or CH 455. Option 2: a course such as BCH 339F, BCH 369, CH 354, CH 354L or CH 367L, plus an approved lab experience (for example CH 154K, BIO 206L or undergraduate research).' },
  TECH1:   { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7 },
  TECH2:   { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7 },
  TECH3:   { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7 },
  TECH4:   { code: 'Tech Elective', title: 'Approved technical elective', hrs: 3, cat: 'tech', latest: 7 },
};

for (const id of ['TECH1', 'TECH2', 'TECH3', 'TECH4']) {
  window.COURSES[id].note = 'Four tech electives are required. Approved options depend on your technical area option.';
}

// The department's suggested eight-semester arrangement.
window.SUGGESTED_PLAN = [
  ['CH302', 'CH104M', 'CHE102', 'CHE210', 'M408C', 'RHE306', 'SBS'],
  ['CH104N', 'M408D', 'PHY303K', 'PHY105M', 'UGS', 'GOV310L'],
  ['CH328M', 'CH128K', 'CHE317', 'M427J', 'PHY303L', 'PHY105N'],
  ['CH328N', 'CH128L', 'CH353', 'CHE319', 'E316', 'M427L'],
  ['CH153K', 'CHE322', 'ES333T', 'CHE253K', 'CHE354', 'CHE348'],
  ['CHE253M', 'CHE363', 'CHE372', 'AMHIST', 'VAPA', 'TECH1'],
  ['CHE350', 'CHE264', 'CHE338', 'GOV312', 'TECH2', 'TECH3'],
  ['CHE360', 'CHE473K', 'USHIST', 'TECH4', 'CHEMEL'],
];
