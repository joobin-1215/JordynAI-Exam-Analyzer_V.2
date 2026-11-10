const { generateDepEdReport, buildDepEdCSV } = require("./grading-core.js");
const key = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "A" };
const st = [
  { student_id: "G-1", student_name: "Amor, Maria", responses: { "1": "A", "2": "C", "3": "C", "4": "D", "5": "B" } },
  { student_id: "B-10", student_name: "Juan Dela Cruz", responses: { "1": "a", "2": "B", "3": "C", "4": "D", "5": "A" } },
  { student_id: "b2", student_name: "Abad, Pedro", responses: { "1": "B", "2": "B", "3": "A", "4": "", "5": "A" } },
  { student_id: "X-1", student_name: "Bad Id", responses: {} }
];
const r = generateDepEdReport(key, st, "Grade 8 - Chico");
console.log(r.gradesheet.map(s => `${s.student_id} ${s.initials} ${s.score}`).join(" | "));
console.log(r.meta, r.criticalItems, r.warnings);
console.log(buildDepEdCSV(r, "MAPEH").split("\r\n").slice(0, 12).join("\n"));
