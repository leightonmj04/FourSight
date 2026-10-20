// Checks every program in public/programs against its own rules:
//   - every course is placed exactly once in the suggested plan
//   - planned hours (without optional courses) equal the program total
//   - every prerequisite and co-requisite names a real course (or a listed outside prerequisite)
//   - the suggested plan satisfies every prerequisite, co-requisite and offered-term limit
//   - each regular term carries 12 to 18 hours
// It also prints each program's longest prerequisite chain, to compare with the catalog's
// critical path. Run: node tools/validate-programs.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pub = path.join(__dirname, '..', 'public');
const ctx = { window: {} };
ctx.window.window = ctx.window;
vm.createContext(ctx);
const run = (file) => vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
run(path.join(pub, 'data.js'));
ctx.FS = ctx.window.FS;
const index = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const files = [...index.matchAll(/src="(programs\/[^"]+\.js)"/g)].map((m) => m[1]);
for (const f of fs.readdirSync(path.join(pub, 'programs'))) {
  if (!files.includes(`programs/${f}`)) console.log(`WARN programs/${f} is not loaded by index.html`);
}
for (const f of files) run(path.join(pub, f));

const FS = ctx.window.FS;
let failures = 0;
for (const { id, ids } of FS.order.flatMap((o) => (o.group ? o.ids.map((x) => ({ id: x })) : [o]))) {
  const p = FS.programs[id];
  const errs = [], warns = [];
  const C = p.courses;
  const terms = p.terms || Array.from({ length: 8 }, (_, i) => ({ kind: i % 2 ? 'spring' : 'fall', year: Math.floor(i / 2) + 1 }));
  if (terms.length !== p.plan.length) errs.push(`plan has ${p.plan.length} terms but terms lists ${terms.length}`);

  const sem = {};
  p.plan.forEach((s, i) => s.forEach((cid) => {
    if (!C[cid]) errs.push(`plan term ${i} has unknown course ${cid}`);
    if (cid in sem) errs.push(`${cid} is placed twice`);
    sem[cid] = i;
  }));
  for (const cid of Object.keys(C)) if (!(cid in sem)) errs.push(`${cid} is not placed in the plan`);

  const total = Object.entries(C).reduce((n, [, c]) => n + (c.optional ? 0 : c.hrs), 0);
  if (total !== p.hours) errs.push(`courses total ${total} hours, program is ${p.hours}`);

  for (const [cid, c] of Object.entries(C)) {
    if (!p.categories[c.cat]) errs.push(`${cid} has category ${c.cat}, which the program does not name`);
    for (const type of ['pre', 'co']) {
      for (const req of c[type] || []) {
        const opts = Array.isArray(req) ? req : [req];
        for (const o of opts) if (!C[o] && !(p.prior && p.prior[o])) errs.push(`${cid} ${type} ${o} is neither a course nor a listed outside prerequisite`);
        const inPlan = opts.filter((o) => C[o]);
        if (!inPlan.length) continue;
        const ok = inPlan.some((o) => (type === 'pre' ? sem[o] < sem[cid] : sem[o] <= sem[cid]));
        if (!ok) errs.push(`plan breaks ${cid} ${type} ${opts.join(' or ')} (terms ${inPlan.map((o) => sem[o]).join('/')} vs ${sem[cid]})`);
      }
    }
    for (const t of c.unlocks || []) if (!C[t]) errs.push(`${cid} unlocks unknown ${t}`);
    if (c.offered && terms[sem[cid]] && terms[sem[cid]].kind !== c.offered) errs.push(`${cid} is ${c.offered}-only but planned in a ${terms[sem[cid]].kind}`);
  }

  const loads = p.plan.map((s) => s.reduce((n, cid) => n + (C[cid] ? C[cid].hrs : 0), 0));
  loads.forEach((h, i) => {
    if (terms[i].kind === 'summer') return;
    if (h < 12 || h > 18) warns.push(`term ${i} carries ${h} hours`);
  });

  // Longest chain of strict prerequisites (one-of groups count through any option).
  const next = {};
  for (const [cid, c] of Object.entries(C)) for (const req of c.pre || []) for (const o of [].concat(req)) if (C[o]) (next[o] ||= []).push(cid);
  const memo = {};
  const longest = (cid) => memo[cid] || (memo[cid] = [cid, ...(next[cid] || []).map(longest).sort((a, b) => b.length - a.length)[0] || []]);
  const chain = Object.keys(C).map(longest).sort((a, b) => b.length - a.length)[0];

  failures += errs.length;
  console.log(`\n${p.name}${p.concentration ? `: ${p.concentration}` : ''} (${id}) ${errs.length ? 'FAIL' : 'ok'}  ${total} hrs  [${loads.join(' ')}]`);
  console.log(`  longest chain (${chain.length}): ${chain.map((x) => C[x].code).join(' > ')}`);
  for (const e of errs) console.log(`  ERROR ${e}`);
  for (const w of warns) console.log(`  warn  ${w}`);
}
console.log(failures ? `\n${failures} error(s)` : '\nAll programs pass.');
process.exit(failures ? 1 : 0);
