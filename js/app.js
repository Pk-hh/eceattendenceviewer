/**
 * GIITS Institutional Attendance Portal Script with Robust Skeleton Loading Flow
 */

function calculatePercentage(present, total) {
  if (!total || total <= 0) return 0;
  const pct = (present / total) * 100;
  return Number.isInteger(pct) ? pct : parseFloat(pct.toFixed(2));
}

function getInitials(name) {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAttendanceTheme(percentage) {
  if (percentage >= 75) {
    return {
      statusTitle: "Attendance Satisfactory",
      statusSubtitle: "Eligible for End Examinations as per University Regulations",
      colorCode: "#10b981", // Emerald Green
      glowClass: "ring-glow-emerald",
      bgStyle: "bg-emerald-50 border-emerald-200 text-emerald-950",
      textClass: "text-emerald-900",
      icon: `<svg class="w-6 h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`
    };
  } else if (percentage >= 65) {
    return {
      statusTitle: "Attendance Warning",
      statusSubtitle: "Borderline Eligibility (Condonation Application Required)",
      colorCode: "#f59e0b", // Amber Orange
      glowClass: "ring-glow-amber",
      bgStyle: "bg-amber-50 border-amber-200 text-amber-950",
      textClass: "text-amber-900",
      icon: `<svg class="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
    };
  } else {
    return {
      statusTitle: "Attendance Shortage",
      statusSubtitle: "Below 65% Cutoff - Not Eligible. Contact HOD Immediately",
      colorCode: "#ef4444", // Rose Red
      glowClass: "ring-glow-rose",
      bgStyle: "bg-rose-50 border-rose-200 text-rose-950",
      textClass: "text-rose-900",
      icon: `<svg class="w-6 h-6 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };
  }
}

function renderNotFoundState(rollNumber) {
  const skeleton = document.getElementById("skeletonLoaderCard");
  const notFoundBox = document.getElementById("notFoundBox");
  const cardContent = document.getElementById("studentCardContent");

  if (skeleton) skeleton.classList.add("hidden");
  if (cardContent) cardContent.classList.add("hidden");
  if (notFoundBox) {
    notFoundBox.classList.remove("hidden");
    const textEl = document.getElementById("notFoundRollText");
    if (textEl) {
      textEl.textContent = `No attendance record found for Roll Number "${rollNumber}" in database. Please check roll number or contact ECE Admin.`;
    }
  }
}

function renderStudentView(data, rollNumber) {
  const skeleton = document.getElementById("skeletonLoaderCard");
  const notFoundBox = document.getElementById("notFoundBox");
  const cardContent = document.getElementById("studentCardContent");

  if (!data) {
    renderNotFoundState(rollNumber);
    return;
  }

  if (skeleton) skeleton.classList.add("hidden");
  if (notFoundBox) notFoundBox.classList.add("hidden");
  if (cardContent) cardContent.classList.remove("hidden");

  const pct = calculatePercentage(data.presentDays, data.workingDays);
  const theme = getAttendanceTheme(pct);

  document.getElementById("studentNameDisplay").textContent = data.studentName || "Student Name";
  document.getElementById("rollNumberDisplay").textContent = data.rollNumber || rollNumber || "N/A";
  document.getElementById("workingDaysDisplay").textContent = data.workingDays !== undefined ? data.workingDays : 0;
  document.getElementById("presentDaysDisplay").textContent = data.presentDays !== undefined ? data.presentDays : 0;
  document.getElementById("lastUpdatedDisplay").textContent = data.lastUpdated || new Date().toLocaleDateString('en-GB');

  const avatar = document.getElementById("studentAvatarInitials");
  if (avatar) avatar.textContent = getInitials(data.studentName);

  const pctStr = `${pct}%`;
  const pctText = document.getElementById("percentageDisplay");
  pctText.textContent = pctStr;
  pctText.style.color = theme.colorCode;

  // Dynamic font sizing so 5-6 char percentages (e.g. 88.89%) fit inside ring cleanly
  if (pctStr.length > 5) {
    pctText.className = "text-2xl sm:text-3xl font-black tracking-tight transition-all duration-300";
  } else if (pctStr.length > 4) {
    pctText.className = "text-3xl sm:text-4xl font-black tracking-tight transition-all duration-300";
  } else {
    pctText.className = "text-4xl sm:text-5xl font-black tracking-tight transition-all duration-300";
  }

  const circle = document.getElementById("progressRing");
  if (circle) {
    const r = 50;
    const c = 2 * Math.PI * r;
    circle.style.strokeDasharray = `${c} ${c}`;
    const clamped = Math.min(Math.max(pct, 0), 100);
    const offset = c - (clamped / 100) * c;
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = theme.colorCode;
    circle.className = `progress-ring-circle ${theme.glowClass}`;
  }

  const statusBox = document.getElementById("statusBox");
  if (statusBox) {
    statusBox.className = `p-4 rounded-2xl border flex items-start space-x-3.5 transition-all ${theme.bgStyle}`;
    document.getElementById("statusIcon").innerHTML = theme.icon;
    document.getElementById("statusTitle").textContent = theme.statusTitle;
    document.getElementById("statusTitle").className = `font-extrabold text-sm ${theme.textClass}`;
    document.getElementById("statusSubtitle").textContent = theme.statusSubtitle;
    document.getElementById("statusSubtitle").className = `text-xs ${theme.textClass} opacity-90 mt-0.5 font-medium`;
  }

  renderMonthlyBreakdown(data.monthlyHistory);
}

function renderMonthlyBreakdown(history) {
  const container = document.getElementById("monthlyHistoryBox");
  if (!container) return;

  if (!history || Object.keys(history).length === 0) {
    container.innerHTML = "";
    return;
  }

  const entries = Object.entries(history);
  container.innerHTML = `
    <div class="space-y-2 mt-2">
      <div class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
        <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        MONTHLY BREAKDOWN HISTORY
      </div>
      <div class="grid grid-cols-1 gap-2">
        ${entries.map(([month, stats]) => {
          const mPct = calculatePercentage(stats.presentDays, stats.workingDays);
          let mBadge = "bg-emerald-100 text-emerald-800";
          if (mPct < 65) mBadge = "bg-rose-100 text-rose-800";
          else if (mPct < 75) mBadge = "bg-amber-100 text-amber-800";

          return `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span class="font-extrabold text-xs text-[#0b192e] block">${month}</span>
                <span class="text-[11px] text-slate-500 font-medium">Working: ${stats.workingDays}d | Present: ${stats.presentDays}d</span>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-black ${mBadge}">
                ${mPct}%
              </span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const rollParam = (urlParams.get("roll") || "").trim().toUpperCase();

  if (!rollParam) {
    renderNotFoundState("N/A");
    return;
  }

  // Ensure Skeleton Loader is active while initializing connection
  const skeleton = document.getElementById("skeletonLoaderCard");
  const notFoundBox = document.getElementById("notFoundBox");
  const cardContent = document.getElementById("studentCardContent");

  if (skeleton) skeleton.classList.remove("hidden");
  if (notFoundBox) notFoundBox.classList.add("hidden");
  if (cardContent) cardContent.classList.add("hidden");

  if (window.AttendanceDB) {
    const student = await window.AttendanceDB.getStudentByRoll(rollParam);
    renderStudentView(student, rollParam);

    window.AttendanceDB.subscribeUpdates(rollParam, (updated) => {
      if (updated !== undefined) {
        renderStudentView(updated, rollParam);
      }
    });
  } else {
    renderNotFoundState(rollParam);
  }
});
