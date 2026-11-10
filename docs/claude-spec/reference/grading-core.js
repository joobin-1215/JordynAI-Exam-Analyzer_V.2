/**
 * Processes exam results to generate DepEd-compliant reports.
 * @param {Object} answerKey - { "1": "A", "2": "B", ... }
 * @param {Array} studentData - [{ student_id, student_name, responses: { "1": "A", ... } }]
 * @param {string} gradeAndSection - e.g., "Grade 8 - Chico"
 * @param {number} [passMark=60] - percent needed to pass (60% raw = 75 transmuted)
 */
function generateDepEdReport(answerKey, studentData, gradeAndSection, passMark = 70) {
  const norm = v => String(v ?? "").trim().toUpperCase();
  const items = Object.keys(answerKey).sort((a, b) => Number(a) - Number(b));
  const key = Object.fromEntries(items.map(q => [q, norm(answerKey[q])]));
  const totalItems = items.length;

  const errors = Object.fromEntries(items.map(q => [q, 0]));
  const blanks = Object.fromEntries(items.map(q => [q, 0]));
  const warnings = [];

  const gradesheet = (studentData || []).map((s, idx) => {
    const id = norm(s.student_id);
    const responses = s.responses || {};
    let score = 0;
    items.forEach(q => {
      const ans = norm(responses[q]);
      if (ans === key[q]) score++;
      else { errors[q]++; if (!ans) blanks[q]++; }
    });
    const m = id.match(/^([BG])\s*-?\s*(\d+)$/);
    if (!m) warnings.push(`Row ${idx + 1}: ID "${s.student_id}" is not B-# or G-#; listed last.`);
    const percentage = totalItems ? (score / totalItems) * 100 : 0;
    return {
      student_id: m ? `${m[1]}-${Number(m[2])}` : id || `?-${idx + 1}`,
      initials: toInitials(s.student_name),
      gender: m ? (m[1] === "B" ? "Boy" : "Girl") : "Unknown",
      _num: m ? Number(m[2]) : Infinity,
      score,
      percentage: round(percentage),
      status: percentage >= passMark ? "Passed" : "Failed",
      proficiencyLevel: proficiency(percentage)
    };
  });

  const order = { Boy: 0, Girl: 1, Unknown: 2 };
  gradesheet.sort((a, b) => order[a.gender] - order[b.gender] || a._num - b._num);
  gradesheet.forEach(s => delete s._num);

  const n = gradesheet.length;
  const mean = n ? gradesheet.reduce((t, s) => t + s.score, 0) / n : 0;
  const sd = n ? Math.sqrt(gradesheet.reduce((t, s) => t + (s.score - mean) ** 2, 0) / n) : 0;
  const mps = totalItems ? (mean / totalItems) * 100 : 0;
  const passed = gradesheet.filter(s => s.status === "Passed").length;

  const itemAnalysis = items.map(q => {
    const errorRate = n ? (errors[q] / n) * 100 : 0;
    return {
      item: Number(q), key: key[q],
      frequencyOfErrors: errors[q], blanks: blanks[q],
      errorRate: round(errorRate),
      remark: errorRate > 50 ? "Critical Competency for Review"
            : errorRate > 25 ? "Least Mastered" : "Mastered"
    };
  });

  return {
    meta: {
      gradeAndSection, totalItems, totalStudents: n,
      boys: gradesheet.filter(s => s.gender === "Boy").length,
      girls: gradesheet.filter(s => s.gender === "Girl").length,
      meanScore: round(mean), standardDeviation: round(sd), mps: round(mps),
      proficiencyLevel: proficiency(mps),
      passMark, passed, failed: n - passed,
      highest: n ? Math.max(...gradesheet.map(s => s.score)) : 0,
      lowest: n ? Math.min(...gradesheet.map(s => s.score)) : 0
    },
    gradesheet,
    itemAnalysis,
    criticalItems: itemAnalysis.filter(i => i.remark === "Critical Competency for Review").map(i => i.item),
    warnings
  };
}

// "Dela Cruz, Juan" or "Juan Dela Cruz" -> "J.D.C." (first name(s) first, then last name)
function toInitials(full) {
  const str = String(full || "").trim();
  if (!str) return "";
  if (/^([A-Za-zÑñ]\.)+$/.test(str.replace(/\s/g, ""))) return str.replace(/\s/g, "").toUpperCase();
  let first = str, last = "";
  if (str.includes(",")) { const [l, ...f] = str.split(","); last = l; first = f.join(" "); }
  const letters = w => w.split(/[\s.-]+/).filter(Boolean).map(x => x[0].toUpperCase());
  return [...letters(first), ...letters(last)].map(c => c + ".").join("");
}

function round(x) { return Math.round(x * 100) / 100; }

// DepEd MPS descriptors
function proficiency(p) {
  if (p >= 96) return "Mastered";
  if (p >= 86) return "Closely Approximating Mastery";
  if (p >= 66) return "Moving Towards Mastery";
  if (p >= 35) return "Average Mastery";
  if (p >= 15) return "Low Mastery";
  if (p >= 5)  return "Very Low Mastery";
  return "Absolutely No Mastery";
}

/**
 * Builds a DepEd report CSV (gradesheet + summary + item analysis) from a report object.
 * Starts with a UTF-8 BOM so Excel shows Ñ and other characters correctly.
 */
function buildDepEdCSV(report, subject = "") {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const m = report.meta;
  const rows = [
    ["DepEd Term Exam Report"],
    ["Grade & Section", m.gradeAndSection],
    ["Subject / Learning Area", subject],
    ["Number of Items", m.totalItems],
    [],
    ["GRADESHEET"],
    ["Group", "Learner ID", "Initials", "Score", "Percent", "Status", "Proficiency Level"],
    ...report.gradesheet.map(s => [
      s.gender === "Boy" ? "Boys" : s.gender === "Girl" ? "Girls" : "Unsorted",
      s.student_id, s.initials, s.score, s.percentage.toFixed(2), s.status, s.proficiencyLevel
    ]),
    [],
    ["SUMMARY"],
    ["Total Learners", m.totalStudents], ["Boys", m.boys], ["Girls", m.girls],
    ["Passing Mark (%)", m.passMark], ["Passed", m.passed], ["Failed", m.failed],
    ["Class Mean", m.meanScore.toFixed(2)], ["Standard Deviation", m.standardDeviation.toFixed(2)],
    ["Class MPS (%)", m.mps.toFixed(2)], ["Proficiency Level", m.proficiencyLevel],
    ["Highest Score", m.highest], ["Lowest Score", m.lowest],
    [],
    ["ITEM ANALYSIS"],
    ["Item", "Key", "Frequency of Errors", "Blanks", "Error Rate (%)", "Remark"],
    ...report.itemAnalysis.map(i => [i.item, i.key, i.frequencyOfErrors, i.blanks, i.errorRate.toFixed(2), i.remark])
  ];
  return "\uFEFF" + rows.map(r => r.map(esc).join(",")).join("\r\n");
}

/**
 * Browser-only: saves the CSV with the native Blob API.
 * Inside a Claude artifact, plain downloads are blocked; use the artifact's
 * `downloads` capability first (see section 3.3) and keep a "Copy CSV" fallback.
 */
async function downloadDepEdCSV(csvText, filename = "DepEd_Report.csv") {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
    if (dl) { await dl.save({ filename, data: blob }); return "saved"; }
  } catch (e) { return "cancelled"; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "started";
}

if (typeof module !== "undefined") {
  module.exports = { generateDepEdReport, buildDepEdCSV, downloadDepEdCSV, toInitials, proficiency };
}
