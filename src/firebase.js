import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

let app = null;
let db = null;

// Sync state
let syncEnabled = false;
let unsubscribers = [];

// Check if Firebase is configured
function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

// Initialize Firebase
function initFirebase() {
  if (app) return;
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured - sync disabled');
    return;
  }
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase initialized');
  } catch (err) {
    console.error('Firebase init error:', err);
  }
}

// Enable sync - listen to Firestore changes
export function enableSync(onTasksSync, onGoalsSync, onPomodoroSync, onNotificationsSync) {
  if (syncEnabled) return;
  initFirebase();
  if (!db) return;

  syncEnabled = true;

  // Listen to tasks
  unsubscribers.push(
    onSnapshot(doc(db, 'user_data', 'tasks'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.tasks && onTasksSync) {
          onTasksSync(data.tasks);
        }
      }
    }, (err) => {
      console.error('Tasks sync error:', err);
    })
  );

  // Listen to goals
  unsubscribers.push(
    onSnapshot(doc(db, 'user_data', 'goals'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.goals && onGoalsSync) {
          onGoalsSync(data.goals);
        }
      }
    }, (err) => {
      console.error('Goals sync error:', err);
    })
  );

  // Listen to pomodoro
  unsubscribers.push(
    onSnapshot(doc(db, 'user_data', 'pomodoro'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (onPomodoroSync) {
          onPomodoroSync(data);
        }
      }
    }, (err) => {
      console.error('Pomodoro sync error:', err);
    })
  );

  // Listen to notifications
  unsubscribers.push(
    onSnapshot(doc(db, 'user_data', 'notifications'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.notifications && onNotificationsSync) {
          onNotificationsSync(data.notifications);
        }
      }
    }, (err) => {
      console.error('Notifications sync error:', err);
    })
  );

  console.log('Firebase sync enabled');
}

// Disable sync
export function disableSync() {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  syncEnabled = false;
  console.log('Firebase sync disabled');
}

// Push local changes to Firestore
export async function pushTasks(tasks) {
  if (!db || !isFirebaseConfigured()) return;
  try {
    await setDoc(doc(db, 'user_data', 'tasks'), {
      tasks,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to push tasks:', err);
  }
}

export async function pushGoals(goals) {
  if (!db || !isFirebaseConfigured()) return;
  try {
    await setDoc(doc(db, 'user_data', 'goals'), {
      goals,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to push goals:', err);
  }
}

export async function pushPomodoro(state) {
  if (!db || !isFirebaseConfigured()) return;
  try {
    await setDoc(doc(db, 'user_data', 'pomodoro'), {
      ...state,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to push pomodoro:', err);
  }
}

export async function pushNotifications(notifications) {
  if (!db || !isFirebaseConfigured()) return;
  try {
    await setDoc(doc(db, 'user_data', 'notifications'), {
      notifications,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to push notifications:', err);
  }
}

export { isFirebaseConfigured };
