/**
 * Universal Firebase Firestore Database Engine with Monthly Attendance Support
 * GONNA INSTITUTE OF INFORMATION TECHNOLOGY & SCIENCES
 * Department of Electronics and Communication Engineering
 */

// Firebase Live Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdYHUpeCONmcrsCfKNuBa5C1lGVuUSYSw",
  authDomain: "giitseceattendence.firebaseapp.com",
  projectId: "giitseceattendence",
  storageBucket: "giitseceattendence.firebasestorage.app",
  messagingSenderId: "995176971364",
  appId: "1:995176971364:web:9af0ae14513fde714eb371",
  measurementId: "G-LV9G67L0L7"
};

// Global Firebase Firestore Instance
let dbInstance = null;

function getDb() {
  if (!dbInstance && typeof firebase !== "undefined") {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      dbInstance = firebase.firestore();
    } catch (e) {
      console.warn("Firebase initialization notice:", e);
    }
  }
  return dbInstance;
}

const STUDENTS_COLLECTION = "students";

// Initial Default Seed Data
const DEFAULT_RECORDS = {
  "23A81A04XX": {
    studentName: "Pradeep Kumar",
    rollNumber: "23A81A04XX",
    workingDays: 120,
    presentDays: 108,
    lastUpdated: "02/10/2026",
    latestMonth: "October 2026",
    monthlyHistory: {
      "October 2026": { workingDays: 24, presentDays: 22 },
      "September 2026": { workingDays: 25, presentDays: 23 },
      "August 2026": { workingDays: 24, presentDays: 21 },
      "July 2026": { workingDays: 23, presentDays: 21 },
      "June 2026": { workingDays: 24, presentDays: 21 }
    }
  },
  "23A81A0412": {
    studentName: "Anitha Sharma",
    rollNumber: "23A81A0412",
    workingDays: 120,
    presentDays: 84,
    lastUpdated: "02/10/2026",
    latestMonth: "October 2026",
    monthlyHistory: {
      "October 2026": { workingDays: 24, presentDays: 16 },
      "September 2026": { workingDays: 25, presentDays: 18 },
      "August 2026": { workingDays: 24, presentDays: 17 },
      "July 2026": { workingDays: 23, presentDays: 16 },
      "June 2026": { workingDays: 24, presentDays: 17 }
    }
  },
  "23A81A0455": {
    studentName: "Rajesh Varma",
    rollNumber: "23A81A0455",
    workingDays: 120,
    presentDays: 60,
    lastUpdated: "02/10/2026",
    latestMonth: "October 2026",
    monthlyHistory: {
      "October 2026": { workingDays: 24, presentDays: 12 },
      "September 2026": { workingDays: 25, presentDays: 12 },
      "August 2026": { workingDays: 24, presentDays: 12 },
      "July 2026": { workingDays: 23, presentDays: 12 },
      "June 2026": { workingDays: 24, presentDays: 12 }
    }
  }
};

window.AttendanceDB = {
  // Fetch student record by Roll Number
  getStudentByRoll: async function(rollNumber) {
    const roll = (rollNumber || "23A81A04XX").toUpperCase();
    const db = getDb();

    if (db) {
      try {
        const docRef = db.collection(STUDENTS_COLLECTION).doc(roll);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const data = docSnap.data();
          localStorage.setItem(`giits_roll_${roll}`, JSON.stringify(data));
          return data;
        } else {
          // Seed initial default record if doc does not exist
          const seedData = DEFAULT_RECORDS[roll] || {
            studentName: "Student Name",
            rollNumber: roll,
            workingDays: 120,
            presentDays: 108,
            lastUpdated: new Date().toLocaleDateString('en-GB'),
            latestMonth: "October 2026",
            monthlyHistory: {
              "October 2026": { workingDays: 24, presentDays: 22 }
            }
          };
          await docRef.set(seedData);
          localStorage.setItem(`giits_roll_${roll}`, JSON.stringify(seedData));
          return seedData;
        }
      } catch (err) {
        console.warn("Firestore fetch notice, using cached store:", err);
      }
    }

    // Local Storage Fallback
    const cached = localStorage.getItem(`giits_roll_${roll}`);
    if (cached) return JSON.parse(cached);
    return DEFAULT_RECORDS[roll] || DEFAULT_RECORDS["23A81A04XX"];
  },

  // Fetch all student records for Admin Portal
  getAllStudents: async function() {
    const db = getDb();
    let result = {};

    if (db) {
      try {
        const snapshot = await db.collection(STUDENTS_COLLECTION).get();
        snapshot.forEach(doc => {
          result[doc.id] = doc.data();
        });

        if (Object.keys(result).length > 0) {
          localStorage.setItem("giits_all_records", JSON.stringify(result));
          return result;
        }
      } catch (err) {
        console.warn("Firestore fetch all notice:", err);
      }
    }

    // Local Storage Fallback
    const stored = localStorage.getItem("giits_all_records");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }

    // Initialize Local Storage with default records
    localStorage.setItem("giits_all_records", JSON.stringify(DEFAULT_RECORDS));
    return DEFAULT_RECORDS;
  },

  // Save or update student record in Firestore & Local Storage
  saveStudent: async function(studentData) {
    const roll = studentData.rollNumber.toUpperCase();
    const existing = (await window.AttendanceDB.getAllStudents())[roll] || {};

    const payload = {
      studentName: studentData.studentName,
      rollNumber: roll,
      workingDays: parseInt(studentData.workingDays) || 0,
      presentDays: parseInt(studentData.presentDays) || 0,
      attendancePercentage: Math.round(((parseInt(studentData.presentDays) || 0) / (parseInt(studentData.workingDays) || 1)) * 100),
      lastUpdated: studentData.lastUpdated || new Date().toLocaleDateString('en-GB'),
      latestMonth: studentData.latestMonth || existing.latestMonth || "October 2026",
      monthlyHistory: studentData.monthlyHistory || existing.monthlyHistory || {}
    };

    // Save to Local Storage immediately
    localStorage.setItem(`giits_roll_${roll}`, JSON.stringify(payload));
    
    // Save to all records cache
    const all = await window.AttendanceDB.getAllStudents();
    all[roll] = payload;
    localStorage.setItem("giits_all_records", JSON.stringify(all));

    const db = getDb();
    if (db) {
      try {
        await db.collection(STUDENTS_COLLECTION).doc(roll).set(payload, { merge: true });
      } catch (err) {
        console.error("Firestore save notice:", err);
      }
    }

    return payload;
  },

  // Save Bulk Monthly Attendance Batch
  saveMonthlyBatch: async function(monthName, recordsArray) {
    const db = getDb();
    const all = await window.AttendanceDB.getAllStudents();

    for (const r of recordsArray) {
      const roll = r.rollNumber.toUpperCase();
      const existing = all[roll] || {
        rollNumber: roll,
        studentName: r.studentName || "Student",
        monthlyHistory: {}
      };

      const history = existing.monthlyHistory || {};
      history[monthName] = {
        workingDays: parseInt(r.workingDays) || 0,
        presentDays: parseInt(r.presentDays) || 0,
        updatedAt: new Date().toLocaleDateString('en-GB')
      };

      // Calculate total cumulative working days & present days across all months
      let totalWorking = 0;
      let totalPresent = 0;
      Object.values(history).forEach(m => {
        totalWorking += parseInt(m.workingDays) || 0;
        totalPresent += parseInt(m.presentDays) || 0;
      });

      if (Object.keys(history).length === 0) {
        totalWorking = parseInt(r.workingDays) || 0;
        totalPresent = parseInt(r.presentDays) || 0;
      }

      const updatedDoc = {
        rollNumber: roll,
        studentName: r.studentName || existing.studentName || "Student",
        workingDays: totalWorking,
        presentDays: totalPresent,
        attendancePercentage: Math.round((totalPresent / (totalWorking || 1)) * 100),
        lastUpdated: new Date().toLocaleDateString('en-GB'),
        latestMonth: monthName,
        monthlyHistory: history
      };

      all[roll] = updatedDoc;
      localStorage.setItem(`giits_roll_${roll}`, JSON.stringify(updatedDoc));

      if (db) {
        try {
          await db.collection(STUDENTS_COLLECTION).doc(roll).set(updatedDoc, { merge: true });
        } catch (e) {
          console.warn("Firestore batch upload notice:", e);
        }
      }
    }

    localStorage.setItem("giits_all_records", JSON.stringify(all));
    return all;
  },

  // Delete student record from Firestore & Local Storage
  deleteStudent: async function(rollNumber) {
    const roll = rollNumber.toUpperCase();
    localStorage.removeItem(`giits_roll_${roll}`);

    const all = await window.AttendanceDB.getAllStudents();
    if (all[roll]) {
      delete all[roll];
      localStorage.setItem("giits_all_records", JSON.stringify(all));
    }

    const db = getDb();
    if (db) {
      try {
        await db.collection(STUDENTS_COLLECTION).doc(roll).delete();
      } catch (err) {
        console.error("Firestore delete notice:", err);
      }
    }
  },

  // Real-time Firestore Listener
  subscribeUpdates: function(rollNumber, callback) {
    const roll = (rollNumber || "23A81A04XX").toUpperCase();
    const db = getDb();

    if (db) {
      try {
        return db.collection(STUDENTS_COLLECTION).doc(roll).onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data();
            localStorage.setItem(`giits_roll_${roll}`, JSON.stringify(data));
            callback(data);
          }
        });
      } catch (e) {
        console.warn("Realtime listener notice:", e);
      }
    }
  }
};
