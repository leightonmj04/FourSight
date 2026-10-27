// Rebalances the suggested semester plans in public/programs so engineering courses are spread as evenly as the
// prerequisite chains allow, with core courses and electives spread through the four years instead of piled at
// the end. The ChE plan is the department's own arrangement and is left as it is (it is the model).
//
// Hard rules (never broken):
//   - every prerequisite (earlier term), co-requisite (same term or earlier) and one-of requirement
//   - fall-, spring- or summer-only courses stay in such a term; summer courses stay in their summer
//   - math and science courses (course type "stem", or a math, science or geology course number under another
//     type, like Geosystems' required GEO courses) keep their terms: they are the backbone the chains hang on
//   - 12 to 18 hours in every fall and spring; a 1-hour lab stays with its same-subject lecture (ASE 120K with ASE 320)
//   - courses with an on-time limit (the Signature Course: first year) stay within it, and RHE 306 stays in the
//     first year, as in every department plan
//   - technical, engineering and concentration electives stay in years 3 and 4, as in the ChE plan
//   - upper-division engineering courses (UT numbers with middle digits 20 and up, like E S 333T) wait for the
//     second year
// Strong preference (hard where hours allow; Environmental's sophomore year cannot fit them all): lower-division
// engineering courses (middle digits under 20, like C E 311K or E M 319) finish by the end of the second year.
// Goal, in order of weight: even engineering hours per term, even total hours (17 or fewer), core courses spread
// across the years.
//
// Run: node tools/balance-plans.js                 (prints before/after for every program)
//      node tools/balance-plans.js --json=FILE       (also saves the new plans as JSON)
//      node tools/balance-plans.js --write           (also writes the new plans into public/programs/*.js)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pub = path.join(__dirname, '..', 'public');
const ctx = { window: {} };
ctx.window.window = ctx.window;
vm.createContext(ctx);
const run = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
run(path.join(pub, 'data.js'));
ctx.FS = ctx.window.FS;
const files = [...fs.readFileSync(path.join(pub, 'index.html'), 'utf8').matchAll(/src="(programs\/[^"]+\.js)"/g)].map((m) => m[1]);
for (const f of files) run(path.join(pub, f));
const FS = ctx.window.FS;
const WRITE = process.argv.includes('--write');
const KEEP = new Set(['che']);

const ENG = /^(ECE|ASE|ARE|BME|C E|COE|CHE|EVE|E M|M E|PGE|E S)\b/;
const isEng = (c) => c.cat === 'major' || ENG.test(c.code);

// Deterministic random numbers, so a run always gives the same plans.
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function balance(p) {
  const C = p.courses;
  const terms = p.terms || Array.from({ length: 8 }, (_, i) => ({ kind: i % 2 ? 'spring' : 'fall', year: Math.floor(i / 2) + 1 }));
  const regular = terms.map((t, i) => (t.kind !== 'summer' ? i : -1)).filter((i) => i >= 0);
  const ordinal = (i) => regular.indexOf(i);   // regular-term number of a term index
  const ids = Object.keys(C);
  const start = {};
  p.plan.forEach((sem, i) => sem.forEach((id) => { start[id] = i; }));
  const order = {};
  p.plan.forEach((sem, i) => sem.forEach((id, k) => { order[id] = i * 100 + k; }));

  // Lab with its lecture: a 1-hour course whose co-requisites are a single course of the same subject.
  const subject = (c) => c.code.replace(/\s\d{3}.*$/, '');
  const pairOf = {};
  for (const id of ids) {
    const c = C[id], co = (c.co || []).filter((x) => typeof x === 'string' && C[x] && subject(C[x]) === subject(c));
    if (c.hrs === 1 && co.length >= 1) pairOf[id] = co[0];
  }
  const science = (c) => c.cat === 'stem' || /^(M|PHY|CH|BIO|BCH|GEO|SDS|STA) \d/.test(c.code);
  const movable = ids.filter((id) => !science(C[id]) && terms[start[id]].kind !== 'summer' && !pairOf[id]);

  // Terms each course may use.
  const allowed = {};
  for (const id of ids) {
    const c = C[id];
    if (!movable.includes(id)) { allowed[id] = [start[id]]; continue; }
    allowed[id] = regular.filter((i) => {
      if (c.offered && terms[i].kind !== c.offered) return false;
      if (c.latest != null && ordinal(i) > c.latest) return false;
      if (c.code === 'RHE 306' && ordinal(i) > 1) return false;
      const lateElective = c.cat === 'tech' || (/Elective/.test(c.code) && !/Math|Science/.test(c.code));
      if (lateElective && ordinal(i) < 4) return false;
      const num = isEng(c) && /\s\d(\d)\d/.exec(c.code);
      if (num && +num[1] >= 2 && ordinal(i) < 2) return false;
      return true;
    });
  }

  const lower = movable.filter((id) => { const m = isEng(C[id]) && /\s\d(\d)\d/.exec(C[id].code); return m && +m[1] < 2; });

  // Requirement list: { to, opts: [ids], strict }.
  const reqs = [];
  for (const id of ids) {
    for (const [list, strict] of [[C[id].pre || [], true], [C[id].co || [], false]]) {
      for (const r of list) {
        const opts = (Array.isArray(r) ? r : [r]).filter((x) => C[x]);
        if (opts.length) reqs.push({ to: id, opts, strict });
      }
    }
  }
  const feasible = (pos) => {
    for (const r of reqs) if (!r.opts.some((o) => (r.strict ? pos[o] < pos[r.to] : pos[o] <= pos[r.to]))) return false;
    for (const [lab, lec] of Object.entries(pairOf)) if (pos[lab] !== pos[lec]) return false;
    const load = new Array(terms.length).fill(0);
    for (const id of ids) load[pos[id]] += C[id].hrs;
    for (const i of regular) if (load[i] < 12 || load[i] > 18) return false;
    return true;
  };

  const sum = (pos, f) => {
    const a = new Array(terms.length).fill(0);
    for (const id of ids) if (f(C[id])) a[pos[id]] += C[id].hrs;
    return regular.map((i) => a[i]);
  };
  const variance = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return a.reduce((s, x) => s + (x - m) ** 2, 0); };
  const cost = (pos) => {
    const eng = sum(pos, isEng), all = sum(pos, () => true), core = sum(pos, (c) => c.cat === 'core');
    // A course outside its allowed terms (only possible in the starting plan) costs far more than anything else.
    const misplaced = ids.filter((id) => !allowed[id].includes(pos[id])).length;
    const lateLower = lower.reduce((s, id) => s + Math.max(0, ordinal(pos[id]) - 3) ** 2, 0);
    return 1e6 * misplaced + 3 * lateLower + 4 * variance(eng) + 1.5 * Math.max(...eng) ** 2 / 4 + variance(all) + all.reduce((s, h) => s + Math.max(0, h - 17) ** 2 * 6, 0) + 1.2 * variance(core);
  };

  // Simulated annealing over single moves and swaps, from several seeds; keep the best plan found.
  let best = { ...start }, bestCost = cost(start);
  for (let seed = 1; seed <= 24; seed++) {
    const rand = rng(seed * 7919);
    let pos = { ...start }, cur = cost(pos);
    const steps = 40000;
    for (let s = 0; s < steps; s++) {
      const temp = 30 * (1 - s / steps) + 0.05;
      const next = { ...pos };
      const a = movable[Math.floor(rand() * movable.length)];
      if (rand() < 0.5) {
        next[a] = allowed[a][Math.floor(rand() * allowed[a].length)];
      } else {
        const b = movable[Math.floor(rand() * movable.length)];
        if (!allowed[a].includes(pos[b]) || !allowed[b].includes(pos[a])) continue;
        next[a] = pos[b]; next[b] = pos[a];
      }
      for (const [lab, lec] of Object.entries(pairOf)) next[lab] = next[lec];
      if (!feasible(next)) continue;
      const c = cost(next);
      if (c < cur || rand() < Math.exp((cur - c) / temp)) { pos = next; cur = c; }
      if (cur < bestCost - 1e-9) { best = { ...pos }; bestCost = cur; }
    }
  }
  const bad = ids.filter((id) => !allowed[id].includes(best[id]));
  if (bad.length || !feasible(best)) throw new Error(`${p.id}: no plan meets every rule (${bad.join(', ') || 'requirements'})`);
  const plan = terms.map(() => []);
  ids.slice().sort((x, y) => order[x] - order[y]).forEach((id) => plan[best[id]].push(id));
  return { plan, before: { eng: sum(start, isEng), core: sum(start, (c) => c.cat === 'core'), all: sum(start, () => true) },
    after: { eng: sum(best, isEng), core: sum(best, (c) => c.cat === 'core'), all: sum(best, () => true) } };
}

const fmt = (a) => a.map((x) => String(x).padStart(2)).join(' ');
const results = {};
for (const [id, p] of Object.entries(FS.programs)) {
  if (KEEP.has(id)) continue;
  const r = balance(p);
  results[id] = r.plan;
  console.log(`${id.padEnd(9)} engineering ${fmt(r.before.eng)}  ->  ${fmt(r.after.eng)}   (max ${Math.max(...r.before.eng)} -> ${Math.max(...r.after.eng)})`);
  console.log(`${''.padEnd(9)} core        ${fmt(r.before.core)}  ->  ${fmt(r.after.core)}`);
  console.log(`${''.padEnd(9)} all hours   ${fmt(r.before.all)}  ->  ${fmt(r.after.all)}`);
}

const jsonArg = process.argv.find((a) => a.startsWith('--json='));
if (jsonArg) fs.writeFileSync(jsonArg.slice(7), JSON.stringify(results, null, 1));

if (WRITE) {
  const lit = (plan, indent) => `[\n${plan.map((t) => `${indent}  [${t.map((x) => `'${x}'`).join(', ')}],`).join('\n')}\n${indent}]`;
  for (const f of files) {
    const file = path.join(pub, f);
    let src = fs.readFileSync(file, 'utf8');
    const ids = Object.keys(results).filter((id) => (id.startsWith('ece-') ? f.endsWith('ece.js') : f.endsWith(`/${id}.js`)));
    for (const id of ids) {
      // Single-program files have one "  plan: [ ... ]," block; ece.js has one per concentration, after its id.
      const re = id.startsWith('ece-')
        ? new RegExp(`(id: '${id.slice(4)}',[\\s\\S]*?\\n)(    )plan: \\[[\\s\\S]*?\\n    \\],`)
        : /(^)(  )plan: \[[\s\S]*?\n  \],/m;
      if (!re.test(src)) throw new Error(`No plan block for ${id} in ${f}`);
      src = src.replace(re, (m, head, indent) => `${head}${indent}plan: ${lit(results[id], indent)},`);
    }
    if (ids.length) fs.writeFileSync(file, src);
  }
  console.log('\nWrote the new plans. Run node tools/validate-programs.js to check them.');
}
