/**
 * Direct Admin Roster Management Script with Monthly Batch Upload Engine
 */

let editingRoll = null;

async function loadRosterTable() {
  const tbody = document.getElementById("adminTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="py-6 text-center text-xs text-slate-400 font-medium">
        Loading student roster database...
      </td>
    </tr>
  `;

  if (!window.AttendanceDB) return;

  const recordsObj = await window.AttendanceDB.getAllStudents();
  const students = Object.values(recordsObj || {});

  if (!students || students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-6 text-center text-xs text-slate-400 font-medium">
          No student records found in database. Click "+ Add Single Student Record" or use Monthly Batch Upload.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const pct = calculatePercentage(s.presentDays, s.workingDays);
    let badgeClass = "bg-emerald-100 text-emerald-800";
    if (pct < 65) badgeClass = "bg-rose-100 text-rose-800";
    else if (pct < 75) badgeClass = "bg-amber-100 text-amber-800";

    const monthLabel = s.latestMonth || "October 2026";

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition text-xs">
        <td class="py-3 px-3 font-mono font-bold text-[#0b192e]">${s.rollNumber}</td>
        <td class="py-3 px-3 font-semibold text-slate-800">${s.studentName}</td>
        <td class="py-3 px-3 text-center">
          <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            ${monthLabel}
          </span>
        </td>
        <td class="py-3 px-3 text-center font-bold text-slate-600">${s.workingDays}</td>
        <td class="py-3 px-3 text-center font-bold text-slate-600">${s.presentDays}</td>
        <td class="py-3 px-3 text-center">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${badgeClass}">
            ${pct}%
          </span>
        </td>
        <td class="py-3 px-3 text-center space-x-1">
          <button onclick="editStudent('${s.rollNumber}')" class="px-2 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">Edit</button>
          <button onclick="deleteStudent('${s.rollNumber}')" class="px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition">Delete</button>
          <a href="attendance.html?roll=${encodeURIComponent(s.rollNumber)}" target="_blank" class="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">View</a>
        </td>
      </tr>
    `;
  }).join("");
}

function downloadSampleCSV() {
  const sampleText = `RollNumber,StudentName,PresentDays\n23A81A04XX,Pradeep Kumar,22\n23A81A0412,Anitha Sharma,18\n23A81A0455,Rajesh Varma,12`;
  const blob = new Blob([sampleText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "GIITS_ECE_Monthly_Attendance_Template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function loadSampleTemplateToTextarea() {
  const sampleText = `RollNumber, StudentName, PresentDays\n23A81A04XX, Pradeep Kumar, 22\n23A81A0412, Anitha Sharma, 18\n23A81A0455, Rajesh Varma, 12`;
  const textarea = document.getElementById("csvTextArea");
  if (textarea) {
    textarea.value = sampleText;
    textarea.focus();
    alert("Sample attendance template data loaded into Option B text area!");
  }
}

function toggleModal(show) {
  const modal = document.getElementById("adminModal");
  if (!modal) return;
  if (show) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  } else {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function openAddModal() {
  editingRoll = null;
  document.getElementById("modalTitle").textContent = "Add Single Student Record";
  document.getElementById("formRollNumber").readOnly = false;
  document.getElementById("formRollNumber").value = "";
  document.getElementById("formStudentName").value = "";
  document.getElementById("formWorkingDays").value = 120;
  document.getElementById("formPresentDays").value = 108;
  toggleModal(true);
}

async function editStudent(rollNumber) {
  if (!window.AttendanceDB) return;
  const s = await window.AttendanceDB.getStudentByRoll(rollNumber);
  if (!s) return;

  editingRoll = rollNumber;
  document.getElementById("modalTitle").textContent = `Edit Student: ${rollNumber}`;
  document.getElementById("formRollNumber").value = s.rollNumber;
  document.getElementById("formRollNumber").readOnly = true;
  document.getElementById("formStudentName").value = s.studentName;
  document.getElementById("formWorkingDays").value = s.workingDays;
  document.getElementById("formPresentDays").value = s.presentDays;
  toggleModal(true);
}

async function deleteStudent(rollNumber) {
  if (!confirm(`Are you sure you want to delete attendance record for ${rollNumber}?`)) return;
  if (window.AttendanceDB) {
    await window.AttendanceDB.deleteStudent(rollNumber);
    loadRosterTable();
  }
}

function parseCSVContent(csvText, monthWorkingDays) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const parsedRecords = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim());
    if (cols.length === 0) continue;

    // Skip Header line if present
    const firstColLower = cols[0].toLowerCase();
    if (firstColLower.includes("roll") || firstColLower.includes("s.no") || firstColLower.includes("student")) {
      continue;
    }

    const rollNumber = cols[0].toUpperCase();
    let studentName = "Student";
    let presentDays = 0;
    let workingDays = monthWorkingDays;

    if (cols.length >= 3) {
      if (isNaN(cols[1])) {
        studentName = cols[1];
        presentDays = parseInt(cols[2]) || 0;
      } else {
        workingDays = parseInt(cols[1]) || monthWorkingDays;
        presentDays = parseInt(cols[2]) || 0;
      }
    } else if (cols.length === 2) {
      if (isNaN(cols[1])) {
        studentName = cols[1];
      } else {
        presentDays = parseInt(cols[1]) || 0;
      }
    }

    if (rollNumber) {
      parsedRecords.push({
        rollNumber,
        studentName,
        workingDays,
        presentDays
      });
    }
  }

  return parsedRecords;
}

document.addEventListener("DOMContentLoaded", () => {
  loadRosterTable();

  // Handle Monthly Batch Upload Form Submit
  const monthlyForm = document.getElementById("monthlyUploadForm");
  if (monthlyForm) {
    monthlyForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const selectedMonth = document.getElementById("selectUploadMonth").value;
      const monthWorkingDays = parseInt(document.getElementById("inputMonthWorkingDays").value) || 24;
      const fileInput = document.getElementById("csvFileInput");
      const textArea = document.getElementById("csvTextArea");

      let rawContent = "";

      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        rawContent = await file.text();
      } else if (textArea && textArea.value.trim().length > 0) {
        rawContent = textArea.value.trim();
      } else {
        alert("Please select a CSV file or paste monthly CSV data.");
        return;
      }

      const records = parseCSVContent(rawContent, monthWorkingDays);

      if (records.length === 0) {
        alert("No valid student records found in the provided CSV data. Check format!");
        return;
      }

      if (window.AttendanceDB) {
        await window.AttendanceDB.saveMonthlyBatch(selectedMonth, records);
        alert(`Successfully processed and updated monthly attendance for ${records.length} students for ${selectedMonth}!`);
        if (fileInput) fileInput.value = "";
        if (textArea) textArea.value = "";
        loadRosterTable();
      }
    });
  }

  // Handle Single Student Modal Save
  const form = document.getElementById("adminForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const rollNumber = document.getElementById("formRollNumber").value.trim().toUpperCase();
      const studentName = document.getElementById("formStudentName").value.trim();
      const workingDays = parseInt(document.getElementById("formWorkingDays").value) || 0;
      const presentDays = parseInt(document.getElementById("formPresentDays").value) || 0;

      if (!rollNumber || !studentName) {
        alert("Please fill in all required fields.");
        return;
      }

      if (presentDays > workingDays) {
        alert("Days present cannot exceed total working days.");
        return;
      }

      const record = {
        rollNumber,
        studentName,
        workingDays,
        presentDays,
        lastUpdated: new Date().toLocaleDateString('en-GB')
      };

      if (window.AttendanceDB) {
        await window.AttendanceDB.saveStudent(record);
        toggleModal(false);
        loadRosterTable();
      }
    });
  }
});
