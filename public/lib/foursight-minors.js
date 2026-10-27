// foursight-minors.js — evaluate UT Austin minor requirements and prerequisite trees.
//
// FourSight copy. Changes from the original module, all in coursesStillNeeded():
//   1. An "or" no longer picks an unmet non-course condition ("M E 340 or the equivalent") over a real course just
//      because conditions cost nothing; unmet conditions now cost more than any course path.
//   2. It accepts `assume` (e.g. { conditional: { "engineering majors": true } }) like makeContext, so prerequisites
//      that differ by student group follow the student's group instead of always the first branch.
//   3. `conditions` lists only conditions on the alternatives it chose, not every alternative it looked at.
// Plain ES module, no dependencies. Works in a Chrome extension, React app, or Node 18+.
//
//   import courses from "../data/courses.json";          // the `db`
//   import minor from "../data/minors/robotics-minor.json";
//   import * as FM from "./foursight-minors.js";
//
//   FM.evaluatePrereq(FM.prerequisiteTree(courses, "CH 367C"), FM.makeContext(courses, student));
//   FM.evaluateMinor(minor, courses, student);
//   FM.coursesStillNeeded(courses, "MSE 360M", student);
//
// Student shape (only `courses` is required):
//   { courses: [{ code: "M 408C", grade: "B+", hours: 4, status: "completed" | "in-progress" | "planned",
//                 basis: "letter" | "pass-fail" | "credit-by-exam" | "transfer", topic: "18" }],
//     standing: "freshman" | "sophomore" | "junior" | "senior", hoursCompleted: 45, major: "Chemical Engineering" }
// Topic courses may be written "MAN 372T.18" or { code: "MAN 372T", topic: "18" }.

export const GRADE_POINTS = { "A": 4.0, "A-": 3.67, "B+": 3.33, "B": 3.0, "B-": 2.67, "C+": 2.33, "C": 2.0, "C-": 1.67, "D+": 1.33, "D": 1.0, "D-": 0.67, "F": 0 };
const NON_PASSING = new Set(["F", "NC", "W", "Q", "X", "I", "U"]);
const CREDIT_ONLY = new Set(["CR", "P", "S", "T"]);   // credit without a letter grade

/** true / false / null (= cannot be decided automatically, e.g. CR against a C- minimum) */
export function gradeMeets(grade, minGrade) {
  if (grade == null || grade === "") return null;
  const g = String(grade).toUpperCase().trim();
  if (NON_PASSING.has(g)) return false;
  if (CREDIT_ONLY.has(g)) return minGrade ? null : true;
  if (!(g in GRADE_POINTS)) return null;
  if (!minGrade) return g !== "F";
  return GRADE_POINTS[g] >= GRADE_POINTS[String(minGrade).toUpperCase()];
}

export function splitTopic(code) {
  const m = /^(.*\d{3}[A-Z]{0,2})\.(\d+)$/.exec(String(code).trim());
  return m ? { base: m[1], topic: m[2] } : { base: String(code).trim(), topic: null };
}

/** resolve hour-variant / retired numbers to the catalog record key (e.g. "CH 401" -> "CH 301", "ECE 311" -> "ECE 411") */
export function canonicalCode(db, code) {
  const { base, topic } = splitTopic(code);
  const c = db.courses[base] ? base : (db.aliases && db.aliases[base]) || base;
  return topic ? `${c}.${topic}` : c;
}

/** all codes that count as the same course: itself, aliases pointing at it, and catalog cross-listings ("Same as") */
export function equivalentCodes(db, code) {
  const { base, topic } = splitTopic(canonicalCode(db, code));
  const out = new Set([topic ? `${base}.${topic}` : base]);
  const rec = db.courses[base];
  if (rec) {
    const xl = topic ? (rec.topics?.[topic]?.crossListedWith || []) : (rec.crossListedWith || []);
    for (const x of xl) out.add(x);
  }
  if (!topic) for (const [alias, target] of Object.entries(db.aliases || {})) if (target === base) out.add(alias);
  return out;
}

function recordCode(r) { return r.topic ? `${splitTopic(r.code).base}.${r.topic}` : r.code; }

/** does transcript record r count as `code`?  Prerequisite codes without a topic accept any topic. */
export function recordMatches(db, r, code) {
  const want = equivalentCodes(db, code);
  const rc = canonicalCode(db, recordCode(r));
  if (want.has(rc)) return true;
  const { base: rb, topic: rt } = splitTopic(rc);
  const { topic: wt } = splitTopic(code);
  if (!wt && rt) {               // record has a topic, requirement doesn't
    for (const w of want) if (canonicalCode(db, w) === rb || w === rb) return true;
  }
  // cross-listed partner may itself carry the record's code
  for (const w of want) if (canonicalCode(db, w) === rc) return true;
  return false;
}

function recordHours(db, r) {
  if (r.hours != null) return Number(r.hours);
  const rec = db.courses[splitTopic(canonicalCode(db, r.code)).base];
  if (rec && rec.hoursMin != null && rec.hoursMin === rec.hoursMax) return rec.hoursMin;
  const m = /\s(\d)\d\d[A-Z]{0,2}$/.exec(splitTopic(r.code).base);   // UT numbering: first digit = credit hours
  return m && Number(m[1]) > 0 ? Number(m[1]) : (rec?.hoursMin ?? 3);
}

const STANDING_RANK = { freshman: 1, sophomore: 2, junior: 3, senior: 4 };
const NUMBER_WORDS = { six: 6, nine: 9, twelve: 12, fifteen: 15, eighteen: 18, "twenty-four": 24, thirty: 30, "forty-five": 45, "fifty-four": 54, sixty: 60, "sixty-five": 65 };

/** Build an evaluation context. `completed` = records finished before the term being planned; `sameTerm` = taken concurrently. */
export function makeContext(db, student = {}, { sameTerm = [], includePlanned = false, assume = {} } = {}) {
  const completed = (student.courses || []).filter(r => (r.status || "completed") === "completed" || (includePlanned && r.status !== "dropped"));
  return { db, completed, sameTerm, standing: student.standing, hoursCompleted: student.hoursCompleted, major: student.major, assume };
}

/**
 * Evaluate a prerequisite tree (from courses.json) for a student.
 * Returns { status: "met" | "not-met" | "unknown", missing: string[], review: string[] }.
 * "unknown" means a non-course condition (consent, placement score, major-specific branch, CR grade) needs a human/UI answer;
 * supply answers through ctx.assume, e.g. { consent: true, exam: true, conditional: { "engineering majors": true } }.
 */
export function evaluatePrereq(tree, ctx) {
  if (!tree) return { status: "met", missing: [], review: [] };
  switch (tree.type) {
    case "course": {
      const recs = ctx.completed.filter(r => recordMatches(ctx.db, r, tree.code));
      let unknown = false;
      for (const r of recs) {
        const ok = gradeMeets(r.grade ?? (r.basis === "credit-by-exam" ? "CR" : null), tree.minGrade);
        if (ok === true) return { status: "met", missing: [], review: [] };
        if (ok === null) unknown = true;
      }
      if (tree.concurrent && ctx.sameTerm.some(r => recordMatches(ctx.db, r, tree.code)))
        return { status: "met", missing: [], review: [] };
      const label = tree.code + (tree.minGrade ? ` (min ${tree.minGrade})` : "") + (tree.concurrent ? " (or take concurrently)" : "");
      if (unknown) return { status: "unknown", missing: [], review: [`${label}: grade on record cannot be compared automatically`] };
      return { status: "not-met", missing: [label], review: [] };
    }
    case "req": return evaluateCondition(tree, ctx);
    case "and": {
      const parts = tree.items.map(i => evaluatePrereq(i, ctx));
      const status = parts.some(p => p.status === "not-met") ? "not-met" : parts.some(p => p.status === "unknown") ? "unknown" : "met";
      return { status, missing: parts.flatMap(p => p.missing), review: parts.flatMap(p => p.review) };
    }
    case "or": {
      const parts = tree.items.map(i => evaluatePrereq(i, ctx));
      if (parts.some(p => p.status === "met")) return { status: "met", missing: [], review: [] };
      if (parts.every(p => p.status === "not-met"))
        return { status: "not-met", missing: ["one of: " + tree.items.map(describeTree).join(" | ")], review: [] };
      return { status: "unknown", missing: [], review: parts.flatMap(p => p.review).concat(["one of: " + tree.items.map(describeTree).join(" | ")]) };
    }
    case "conditional": {
      const answers = ctx.assume.conditional || {};
      for (const b of tree.branches) if (answers[b.when] === true) return evaluatePrereq(b.req, ctx);
      const results = tree.branches.map(b => ({ when: b.when, r: evaluatePrereq(b.req, ctx) }));
      if (results.every(x => x.r.status === "met")) return { status: "met", missing: [], review: [] };
      return { status: "unknown", missing: [], review: [`Depends on student group: ${results.map(x => `if ${x.when}: ${x.r.status}`).join("; ")}`] };
    }
    default: return { status: "unknown", missing: [], review: [`unrecognised node ${tree.type}`] };
  }
}

function evaluateCondition(node, ctx) {
  const t = node.text.toLowerCase();
  const a = ctx.assume || {};
  if (a[node.kind] === true || a[node.text] === true) return { status: "met", missing: [], review: [] };
  if (a[node.kind] === false || a[node.text] === false) return { status: "not-met", missing: [node.text], review: [] };
  if (node.kind === "standing" && ctx.standing) {
    const rank = STANDING_RANK[String(ctx.standing).toLowerCase()];
    let need = null;
    if (/upper[- ]division/.test(t)) need = 3; else if (/senior/.test(t)) need = 4; else if (/junior/.test(t)) need = 3; else if (/sophomore/.test(t)) need = 2;
    if (/graduate standing/.test(t)) return { status: "not-met", missing: [node.text], review: [] };
    if (need && rank) return rank >= need ? { status: "met", missing: [], review: [] } : { status: "not-met", missing: [node.text], review: [] };
  }
  if (node.kind === "hours" && ctx.hoursCompleted != null) {
    const m = /^(?:a minimum of |completion of )?([a-z-]+|\d+) semester (?:credit )?hours of (?:college |undergraduate )?(?:coursework|credit)$/.exec(t.trim());
    if (m) {
      const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1]];
      if (n) return ctx.hoursCompleted >= n ? { status: "met", missing: [], review: [] } : { status: "not-met", missing: [node.text], review: [] };
    }
  }
  return { status: "unknown", missing: [], review: [node.text] };
}

export function describeTree(t) {
  if (!t) return "";
  if (t.type === "course") return (t.concurrent ? "~" : "") + t.code + (t.minGrade ? "@" + t.minGrade : "");
  if (t.type === "req") return `{${t.text}}`;
  if (t.type === "and") return "(" + t.items.map(describeTree).join(" & ") + ")";
  if (t.type === "or") return "(" + t.items.map(describeTree).join(" | ") + ")";
  if (t.type === "conditional") return t.branches.map(b => `if ${b.when}: ${describeTree(b.req)}`).join("; ");
  return "?";
}

/** Course prerequisite tree, including the topic's additional prerequisite when `code` names a topic (e.g. "MAN 372T.18"). */
export function prerequisiteTree(db, code) {
  const { base, topic } = splitTopic(canonicalCode(db, code));
  const rec = db.courses[base];
  if (!rec) return null;
  const extra = topic ? rec.topics?.[topic]?.additionalPrerequisite : null;
  if (rec.prerequisite && extra) return { type: "and", items: [rec.prerequisite, extra] };
  return extra || rec.prerequisite || null;
}

/** Can the student register for `code` given completed work (and courses in the same term)? */
export function canTake(db, code, student, opts = {}) {
  const ctx = makeContext(db, student, opts);
  const res = evaluatePrereq(prerequisiteTree(db, code), ctx);
  const { base } = splitTopic(canonicalCode(db, code));
  const restrictions = db.courses[base]?.restrictions || null;
  return { ...res, restrictions };
}

/** every course that appears anywhere upstream of `code` (all alternatives) */
export function prerequisiteClosure(db, code) {
  const seen = new Set(); const stack = [code];
  while (stack.length) {
    const c = stack.pop();
    walkCodes(prerequisiteTree(db, c), x => { const k = canonicalCode(db, x); if (!seen.has(k)) { seen.add(k); stack.push(k); } });
  }
  return [...seen].sort();
}
function walkCodes(t, f) {
  if (!t) return;
  if (t.type === "course") f(t.code);
  else if (t.type === "and" || t.type === "or") t.items.forEach(i => walkCodes(i, f));
  else if (t.type === "conditional") t.branches.forEach(b => walkCodes(b.req, f));
}

/**
 * Courses the student still has to take before (or with) `code`, choosing for every "or" the alternative already
 * satisfied, else the one needing the fewest new courses (ties: fewest semesters, then catalog order; honors avoided).
 * Returns [{ code, semesterOffset, concurrentWith?: string }] sorted by offset; offset 0 = can be taken now, and `code`
 * itself is the last entry. Non-course conditions encountered are listed in `conditions`.
 */
export function coursesStillNeeded(db, code, student, { avoidHonors = true, assume = {} } = {}) {
  const ctx = makeContext(db, student, { assume });
  const memo = new Map();
  const isHonors = c => /\d{3}[A-Z]?H$/.test(splitTopic(c).base);
  // An unmet non-course condition ("the equivalent", consent, standing) costs more than any course path, so an
  // "or" prefers a real course the student can plan for; it still beats an alternative not in the catalog.
  const UNMET_CONDITION = 1000;
  const none = () => ({ set: new Map(), cost: 0, depth: 0, conds: new Set() });
  function plan(tree) {     // -> { set: Map(code -> {conc}), cost, depth, conds: Set of unmet conditions on this path }
    if (!tree) return none();
    switch (tree.type) {
      case "course": {
        const st = evaluatePrereq(tree, ctx).status;
        if (st === "met") return none();
        const c = canonicalCode(db, tree.code);
        if (!db.courses[splitTopic(c).base]) return { ...none(), cost: 1e6 };
        const sub = planCourse(c);
        const set = new Map(sub.set); set.set(c, { conc: !!tree.concurrent });
        return { set, cost: sub.cost + 1 + (avoidHonors && isHonors(c) ? 100 : 0), depth: sub.depth + (tree.concurrent ? 0 : 1), conds: new Set(sub.conds) };
      }
      case "req": {
        const r = evaluateCondition(tree, ctx);
        return r.status === "met" ? none() : { ...none(), cost: UNMET_CONDITION, conds: new Set([tree.text]) };
      }
      case "and": {
        const parts = tree.items.map(plan); const set = new Map(); const conds = new Set();
        for (const p of parts) { for (const [k, v] of p.set) set.set(k, v); p.conds.forEach(x => conds.add(x)); }
        return { set, cost: parts.reduce((s, p) => s + p.cost, 0), depth: Math.max(0, ...parts.map(p => p.depth)), conds };
      }
      case "or": {
        const parts = tree.items.map(plan);
        let best = parts[0];
        for (const p of parts.slice(1)) if (p.cost < best.cost || (p.cost === best.cost && p.depth < best.depth)) best = p;
        return best;
      }
      case "conditional": {
        const ans = ctx.assume.conditional || {};
        const b = tree.branches.find(x => ans[x.when] === true);
        if (b) return plan(b.req);
        const r = plan(tree.branches[0].req);
        return { ...r, conds: new Set([...r.conds, "depends on student group: " + tree.branches.map(x => x.when).join(" / ")]) };
      }
    }
    return none();
  }
  function planCourse(c) {
    if (memo.has(c)) return memo.get(c);
    memo.set(c, none());   // cycle guard (concurrent pairs)
    const r = plan(prerequisiteTree(db, c));
    memo.set(c, r);
    return r;
  }
  const target = canonicalCode(db, code);
  const p = planCourse(target);
  const all = new Map(p.set); all.set(target, { conc: false });
  // semester offsets: longest chain of completed-before edges inside the chosen set
  const offset = new Map();
  function off(c, guard = new Set()) {
    if (offset.has(c)) return offset.get(c);
    if (guard.has(c)) return 0;
    guard.add(c);
    let o = 0;
    const tree = prerequisiteTree(db, c);
    (function visit(t) {
      if (!t) return;
      if (t.type === "course") { const k = canonicalCode(db, t.code); if (all.has(k)) o = Math.max(o, off(k, guard) + (t.concurrent ? 0 : 1)); }
      else if (t.type === "and" || t.type === "or") t.items.forEach(visit);
      else if (t.type === "conditional") t.branches.forEach(b => visit(b.req));
    })(tree);
    guard.delete(c); offset.set(c, o); return o;
  }
  const list = [...all.keys()].map(c => ({ code: c, semesterOffset: off(c) }));
  list.sort((a, b) => a.semesterOffset - b.semesterOffset || (a.code === target) - (b.code === target) || a.code.localeCompare(b.code));
  return { courses: list, conditions: [...p.conds] };
}

// ------------------------------------------------------------------ minor progress

function filterMatches(db, filter, r) {
  if (!filter) return false;
  const { base } = splitTopic(canonicalCode(db, recordCode(r)));
  const subj = base.replace(/\s\d{3}[A-Z]{0,2}$/, "");
  if (filter.subjects && !filter.subjects.includes(subj)) return false;
  if (filter.exclude && filter.exclude.some(x => recordMatches(db, r, x))) return false;
  if (filter.upperDivision) {
    const lvl = db.courses[base]?.level;
    const num = Number(/\d(\d\d)[A-Z]{0,2}$/.exec(base)?.[1]);
    const upper = lvl ? lvl === "Upper Division" : (num >= 20 && num <= 79);
    if (!upper) return false;
  }
  if (filter.coreCode && db.courses[base]?.coreCode !== filter.coreCode) return false;
  return true;
}

function optionMatches(db, opt, r) {
  if (opt.courses) return opt.courses.some(c => recordMatches(db, r, c));
  if (opt.open) return filterMatches(db, opt.open.filter, r);
  return false;
}

/**
 * Evaluate progress toward a minor. Courses are applied greedily in catalog order (single-course requirements first),
 * never counting one transcript entry twice. Returns per-requirement status plus rule checks.
 * opts: { includePlanned: false, conditions: { "R2": false } } — conditions answers conditional requirements by id.
 */
export function evaluateMinor(minor, db, student, opts = {}) {
  const records = (student.courses || []).filter(r => (r.status || "completed") === "completed" || (opts.includePlanned && r.status !== "dropped"));
  const rules = minor.rules?.program || {};
  const review = [];
  const eligible = records.map(r => {
    const g = r.grade;
    if (rules.letterGradeOnly && (r.basis === "pass-fail" || CREDIT_ONLY.has(String(g || "").toUpperCase()))) return { r, ok: false, why: "not taken on the letter-grade basis" };
    if (rules.creditByExamAllowed === false && r.basis === "credit-by-exam") return { r, ok: false, why: "credit by exam not accepted" };
    if (rules.minGradeEachCourse && g && gradeMeets(g, rules.minGradeEachCourse) === false) return { r, ok: false, why: `grade below ${rules.minGradeEachCourse}` };
    if (g && gradeMeets(g, null) === false) return { r, ok: false, why: "not passed" };
    return { r, ok: true };
  });
  const used = new Set();
  const pool = () => eligible.map((e, i) => ({ ...e, i })).filter(e => e.ok && !used.has(e.i));
  const results = new Map();

  function take(i) { used.add(i); return records[i]; }
  function applied(rs) { return rs.map(r => ({ code: recordCode(r), grade: r.grade ?? null, hours: recordHours(db, r) })); }

  function evalNode(n) {
    switch (n.type) {
      case "course": {
        const hit = pool().find(e => n.oneOf.some(c => recordMatches(db, e.r, c)));
        const rs = hit ? [take(hit.i)] : [];
        return { id: n.id, type: n.type, status: rs.length ? "complete" : "not-started", hoursRequired: n.hours, hoursApplied: rs.reduce((s, r) => s + recordHours(db, r), 0), applied: applied(rs), stillNeed: rs.length ? [] : [n.oneOf.join(" or ")] };
      }
      case "open": {
        const rs = []; let h = 0;
        for (const e of pool()) { if (h >= n.hours) break; if (filterMatches(db, n.filter, e.r)) { rs.push(take(e.i)); h += recordHours(db, e.r); } }
        return { id: n.id, type: n.type, status: h >= n.hours ? "complete" : h ? "partial" : "not-started", hoursRequired: n.hours, hoursApplied: h, applied: applied(rs), stillNeed: h >= n.hours ? [] : [`${n.hours - h} more hours: ${n.catalogText}`] };
      }
      case "choose": {
        const rs = []; let h = 0; const usedOpt = new Map(); let mccombs = 0;
        const need = n.hours ?? 0;
        for (const e of pool()) {
          if (need && h >= need) break;
          const oi = n.options.findIndex(o => optionMatches(db, o, e.r));
          if (oi < 0) continue;
          const o = n.options[oi];
          const sameTopicTwice = o.anyTopic && (usedOpt.get(oi) || []).some(x => recordCode(x) === recordCode(e.r));
          if (usedOpt.has(oi) && !o.anyTopic && !o.open) continue;
          if (sameTopicTwice) continue;
          if (n.maxMcCombsCourses != null) {
            const subj = splitTopic(canonicalCode(db, recordCode(e.r))).base.replace(/\s\d{3}[A-Z]{0,2}$/, "");
            if ((n.mcCombsSubjects || []).includes(subj)) { if (mccombs >= n.maxMcCombsCourses) continue; mccombs++; }
          }
          usedOpt.set(oi, [...(usedOpt.get(oi) || []), e.r]);
          rs.push(take(e.i)); h += recordHours(db, e.r);
        }
        const done = need ? h >= need : rs.length > 0;
        if (n.sameConcentrationAs) review.push(`${n.id}: confirm the topics courses are in the same concentration as the introduction course and are two different topics.`);
        return { id: n.id, type: n.type, status: done ? "complete" : h ? "partial" : "not-started", hoursRequired: n.hours, hoursApplied: h, applied: applied(rs), stillNeed: done ? [] : [`${need - h} more hours from ${n.id} options`] };
      }
      case "sequence": {
        let best = null;
        for (const s of n.sequences) {
          const snapshot = new Set(used);
          const sub = s.requirements.map(evalNode);
          const h = sub.reduce((a, x) => a + x.hoursApplied, 0);
          const complete = sub.every(x => x.status === "complete");
          const cand = { label: s.label, sub, h, complete, usedAfter: new Set(used) };
          used.clear(); snapshot.forEach(x => used.add(x));
          if (!best || (cand.complete && !best.complete) || (cand.complete === best.complete && cand.h > best.h)) best = cand;
        }
        best.usedAfter.forEach(x => used.add(x));
        return { id: n.id, type: n.type, status: best.complete ? "complete" : best.h ? "partial" : "not-started", hoursRequired: n.hours, hoursApplied: best.h, chosenSequence: best.label, requirements: best.sub, applied: best.sub.flatMap(x => x.applied), stillNeed: best.complete ? [] : best.sub.flatMap(x => x.stillNeed) };
      }
      case "distribution": {
        const cands = pool().map(e => ({ e, areas: n.areas.map((a, ai) => a.options.some(o => optionMatches(db, o, e.r)) ? ai : -1).filter(x => x >= 0) })).filter(x => x.areas.length);
        let bestPick = [];
        (function search(k, usedAreas, pick) {
          if (pick.length > bestPick.length) bestPick = [...pick];
          if (pick.length >= n.courses || k >= cands.length) return;
          for (const a of cands[k].areas) if (!usedAreas.has(a)) { usedAreas.add(a); pick.push({ c: cands[k], area: a }); search(k + 1, usedAreas, pick); pick.pop(); usedAreas.delete(a); }
          search(k + 1, usedAreas, pick);
        })(0, new Set(), []);
        const rs = bestPick.map(p => take(p.c.e.i));
        const h = rs.reduce((s, r) => s + recordHours(db, r), 0);
        const done = bestPick.length >= n.courses;
        return { id: n.id, type: n.type, status: done ? "complete" : rs.length ? "partial" : "not-started", hoursRequired: n.hours, hoursApplied: h, applied: applied(rs).map((x, i) => ({ ...x, area: n.areas[bestPick[i].area].label })), stillNeed: done ? [] : [`${n.courses - bestPick.length} more course(s), each from a content area not yet used`] };
      }
      case "conditional": {
        let applies = opts.conditions?.[n.id];
        if (applies == null && n.unlessCompletedAny) {
          const has = n.unlessCompletedAny.filter(c => records.some(r => recordMatches(db, r, c)));
          applies = has.length === 0;
          if (has.length && has.every(c => c === n.then?.oneOf?.[0])) review.push(`${n.id}: the student has ${has.join(", ")}; whether it counts toward the minor or triggers the extra-track-hours rule depends on when it was taken — confirm with the program.`);
        }
        if (applies == null) { applies = true; review.push(`${n.id}: assumed to apply (${n.when}).`); }
        if (!applies) return { id: n.id, type: n.type, status: "not-applicable", hoursRequired: 0, hoursApplied: 0, applied: [], stillNeed: [], note: n.otherwise?.text };
        const r = evalNode(n.then);
        return { ...r, id: n.id, type: n.type, conditionApplies: true };
      }
      default: return { id: n.id, type: n.type, status: "unknown", hoursRequired: n.hours, hoursApplied: 0, applied: [], stillNeed: [] };
    }
  }

  const order = { course: 0, conditional: 1, sequence: 2, choose: 3, distribution: 4, open: 5 };
  [...minor.requirements].sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9)).forEach(n => results.set(n.id, evalNode(n)));
  const reqResults = minor.requirements.map(n => results.get(n.id));
  const appliedAll = reqResults.flatMap(r => r.applied);
  const hoursApplied = appliedAll.reduce((s, x) => s + x.hours, 0);
  const graded = appliedAll.filter(x => x.grade && x.grade in GRADE_POINTS);
  const gpa = graded.length ? graded.reduce((s, x) => s + GRADE_POINTS[x.grade] * x.hours, 0) / graded.reduce((s, x) => s + x.hours, 0) : null;
  const ruleChecks = [];
  if (rules.minCombinedGpa != null) ruleChecks.push({ rule: "minCombinedGpa", required: rules.minCombinedGpa, actual: gpa == null ? null : Math.round(gpa * 1000) / 1000, ok: gpa == null ? null : gpa >= rules.minCombinedGpa - 1e-9 });
  const upperHours = appliedAll.filter(x => db.courses[splitTopic(canonicalCode(db, x.code)).base]?.level === "Upper Division").reduce((s, x) => s + x.hours, 0);
  ruleChecks.push({ rule: "upperDivisionMinHours", required: 6, actual: upperHours, ok: upperHours >= 6 ? true : null });
  ruleChecks.push({ rule: "notUsedForMajorMinHours", required: 9, ok: null, note: "Needs the major's degree audit: at least 9 minor hours must not also satisfy major requirements." });
  ruleChecks.push({ rule: "residenceMinFraction", required: 0.5, ok: null, note: "At least half the minor's hours must be taken in residence at UT Austin." });
  const rejected = eligible.filter(e => !e.ok && minor.requirements.some(n => nodeMentions(n, db, e.r))).map(e => ({ code: recordCode(e.r), why: e.why }));
  const complete = reqResults.every(r => r.status === "complete" || r.status === "not-applicable") && ruleChecks.every(c => c.ok !== false);
  return { minorId: minor.id, complete, hoursRequired: minor.totalHours, hoursApplied, gpa, requirements: reqResults, ruleChecks, rejectedCourses: rejected, review, warnings: minor.warnings || [] };
}

function nodeMentions(n, db, r) {
  if (n.oneOf) return n.oneOf.some(c => recordMatches(db, r, c));
  if (n.options) return n.options.some(o => optionMatches(db, o, r));
  if (n.filter) return filterMatches(db, n.filter, r);
  if (n.sequences) return n.sequences.some(s => s.requirements.some(x => nodeMentions(x, db, r)));
  if (n.areas) return n.areas.some(a => a.options.some(o => optionMatches(db, o, r)));
  if (n.then) return nodeMentions(n.then, db, r);
  return false;
}

/** Admission course prerequisites of a minor (e.g. MSE: M 408C, 408D, 427J, CH 301, PHY 303K/L with C-). */
export function checkMinorAdmission(minor, db, student, opts = {}) {
  const e = minor.eligibility || {};
  const out = { applicationRequired: e.applicationRequired ?? null, allowedMajors: e.allowedMajors || null, majorOk: null, coursePrereqs: null, minUniversityGpa: e.minUniversityGpa ?? null };
  if (e.allowedMajors && student.major) out.majorOk = e.allowedMajors.some(m => m.toLowerCase().includes(String(student.major).toLowerCase()) || String(student.major).toLowerCase().includes(m.toLowerCase()));
  if (e.excludedMajors && student.major && e.excludedMajors.some(m => m.toLowerCase() === String(student.major).toLowerCase())) out.majorOk = false;
  if (e.coursePrereqs) out.coursePrereqs = evaluatePrereq(e.coursePrereqs, makeContext(db, student, opts));
  return out;
}
