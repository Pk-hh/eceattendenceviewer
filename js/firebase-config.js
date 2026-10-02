/**
 * Universal Firebase Firestore Database Engine with Robust Async Loading & Zero Mock Data
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

// Wait for Firebase SDK Initialization helper
async function waitForDb(maxWaitMs = 4000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const db = getDb();
    if (db) return db;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return getDb();
}

const STUDENTS_COLLECTION = "students";

window.AttendanceDB = {
  // Fetch student record by Roll Number with connection retry
  getStudentByRoll: async function(rollNumber) {
    if (!rollNumber) return null;
    const roll = rollNumber.trim().toUpperCase();

    // Check local storage cache first for instant response if available
    let cached = null;
    const stored = localStorage.getItem(`giits_roll_${roll}`);
    if (stored) {
      try { cached = JSON.parse(stored); } catch (e) {}
    }

    const db = await waitForDb(3500);

    if (db) {
      try {
        const docRef = db.collection(STUDENTS_COLLECTION).doc(roll);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          const data = docSnap.data();
          localStorage.setItem(`giits_roll_${roll}`, JSON.stringify(data));
          return data;
        } else {
          return null; // Record explicitly confirmed as not existing in Firestore
        }
      } catch (err) {
        console.warn("Firestore fetch notice, using cached store:", err);
      }
    }

    // Return cached fallback if offline or network slow
    return cached;
  },

  // Fetch all student records for Admin Portal
  getAllStudents: async function() {
    const db = await waitForDb(3500);
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

    return {};
  },

  // Save or update student record in Firestore & Local Storage
  saveStudent: async function(studentData) {
    const roll = studentData.rollNumber.trim().toUpperCase();
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

    const db = await waitForDb(3500);
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
    const db = await waitForDb(3500);
    const all = await window.AttendanceDB.getAllStudents();

    for (const r of recordsArray) {
      const roll = r.rollNumber.trim().toUpperCase();
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
    const roll = rollNumber.trim().toUpperCase();
    localStorage.removeItem(`giits_roll_${roll}`);

    const all = await window.AttendanceDB.getAllStudents();
    if (all[roll]) {
      delete all[roll];
      localStorage.setItem("giits_all_records", JSON.stringify(all));
    }

    const db = await waitForDb(3500);
    if (db) {
      try {
        await db.collection(STUDENTS_COLLECTION).doc(roll).delete();
      } catch (err) {
        console.error("Firestore delete notice:", err);
      }
    }
  },

  // Real-time Firestore Listener with async db wait
  subscribeUpdates: async function(rollNumber, callback) {
    if (!rollNumber) return;
    const roll = rollNumber.trim().toUpperCase();
    const db = await waitForDb(3500);

    if (db) {
      try {
        return db.collection(STUDENTS_COLLECTION).doc(roll).onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data();
            localStorage.setItem(`giits_roll_${roll}`, JSON.stringify(data));
            callback(data);
          } else {
            callback(null);
          }
        }, err => {
          console.warn("Firestore snapshot error:", err);
        });
      } catch (e) {
        console.warn("Realtime listener notice:", e);
      }
    }
  }
};
