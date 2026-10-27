// Builds public/data/minors.json, the minors data FourSight loads, from the full catalog extract in
// data/ut-minors-data.json (UT Austin 2026-27 catalog: 45 minors, 701 courses with prerequisite trees).
// It keeps what the app and lib/foursight-minors.js use and drops the rest (Mermaid flowcharts,
// raw catalog text, parse metadata), which roughly halves the file.
// Run: node tools/build-minors-data.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'data', 'ut-minors-data.json'), 'utf8'));

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const COURSE_FIELDS = ['code', 'title', 'hoursMin', 'hoursMax', 'level', 'gradingBasis', 'restrictions', 'creditExclusions',
  'prerequisiteText', 'prerequisite', 'topics', 'crossListedWith', 'coreCode', 'earliestSemester'];
const MINOR_FIELDS = ['id', 'name', 'shortName', 'college', 'catalogYear', 'sourceUrl', 'totalHours', 'collegeRequirementsLink',
  'eligibility', 'rules', 'policyRefs', 'requirements', 'notes', 'warnings', 'substitutions', 'track', 'governingCollegeNote'];

const out = {
  about: pick(src.about, ['description', 'catalogYear', 'catalogEdition', 'extractedOn']),
  index: src.index.minors.map((m) => pick(m, ['id', 'name', 'shortName', 'college', 'totalHours', 'applicationRequired', 'openTo', 'allowedMajors', 'sourceUrl'])),
  minors: Object.fromEntries(Object.entries(src.minors).map(([id, m]) => [id, pick(m, MINOR_FIELDS)])),
  courses: {
    aliases: src.courses.aliases,
    notInCatalog: src.courses.notInCatalog,
    courses: Object.fromEntries(Object.entries(src.courses.courses).map(([code, c]) => [code, pick(c, COURSE_FIELDS)])),
  },
  policies: src.policies,
};

// Every course a minor names must exist in the course table, or the planner cannot place it.
const missing = new Set();
// Topic courses ("MAN 372T.18") are looked up by their base number, as lib/foursight-minors.js does.
const known = (c) => { const base = c.replace(/\.\d+$/, ''); return out.courses.courses[base] || out.courses.aliases[base]; };
const walk = (n) => {
  for (const c of n.oneOf || []) if (!known(c)) missing.add(c);
  for (const o of n.options || []) for (const c of o.courses || []) if (!known(c)) missing.add(c);
  for (const a of n.areas || []) for (const o of a.options) for (const c of o.courses || []) if (!known(c)) missing.add(c);
  for (const s of n.sequences || []) s.requirements.forEach(walk);
  if (n.then) walk(n.then);
};
Object.values(out.minors).forEach((m) => m.requirements.forEach(walk));

const dest = path.join(root, 'public', 'data', 'minors.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`Wrote ${path.relative(root, dest)}: ${Object.keys(out.minors).length} minors, ${Object.keys(out.courses.courses).length} courses, ` +
  `${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
if (missing.size) console.log(`Courses named by minors but not in the course table (shown as "not in catalog"): ${[...missing].join(', ')}`);
