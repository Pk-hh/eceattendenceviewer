# Student Attendance Portal | GIITS ECE

A modern, professional, mobile-first Attendance Display System built for **GONNA INSTITUTE OF INFORMATION TECHNOLOGY & SCIENCES** — **Department of Electronics and Communication Engineering**.

---

## 🏛️ Official College Branding

- **Left Logo**: Official College Emblem (`assets/college-logo.png`)
- **Right Logo**: ECE Department Logo (`assets/dept-logo.png`)
- **Header Details**:
  - `GONNA INSTITUTE OF INFORMATION TECHNOLOGY & SCIENCES`
  - `(Approved by AICTE, New Delhi, Affiliated to JNTU GURAJADA, VIZIANAGARAM)`
  - `Gonnavanipalem, Parwada madalam, Anakapalli – 530 053`
  - `Department of Electronics and Communication Engineering`

---

## 📱 Features

1. **Student Search Portal (`index.html`)**:
   - Clean, focused search page.
   - Enter Roll Number to look up attendance record.
   - Zero admin/staff login options shown.

2. **Student Attendance Display (`attendance.html`)**:
   - Student Name & Roll Number prominence.
   - Hero Circular Attendance Percentage Ring with dynamic stroke animations.
   - Color-coded status thresholds:
     - 🟢 **≥ 75%** → Emerald Green (`Attendance Satisfactory`)
     - 🟠 **65%–74%** → Amber Orange (`Attendance Warning`)
     - 🔴 **< 65%** → Rose Red (`Attendance Shortage`)
   - 2-Column Responsive Stat Boxes: Working Days & Days Present.
   - Last Updated timestamp.

3. **Firebase Firestore Integration (`js/firebase-config.js`)**:
   - Connects to live Firestore database (`giitseceattendence`).
   - Real-time attendance updates & fallback local persistence.

---

## 🚀 How to Run

1. Open `index.html` in any web browser to search for a student's attendance.
2. Direct link format: `attendance.html?roll=23A81A04XX`
