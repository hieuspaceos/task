import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

let app = null;
let db = null;

// Sync state
let syncEnabled = false;
let unsubscribers = [];

// Local cache keys
const CACHE_KEYS = {
  tasks: 'eisenhower_tasks_cache',
  goals: 'eisenhower_goals_cache',
  pomodoro: 'eisenhower_pomodoro_cache',
  notifications: 'eisenhower_notifications_cache'
};

// Read from local cache (no Firestore cost)
function readCache(key) {
  try {
    const cached = localStorage.getItem(CACHE_KEYS[key]);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

// Write to local cache
function writeCache(key, data) {
  try {
    localStorage.setItem(CACHE_KEYS[key], JSON.stringify(data));
  } catch {}
}

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

// Enable sync - listen to Firestore changes (with cache-first approach)
export function enableSync(onTasksSync, onGoalsSync, onPomodoroSync, onNotificationsSync) {
  if (syncEnabled) return;
  initFirebase();
  if (!db) return;

  syncEnabled = true;

  // Helper to sync with cache
  function syncWithCache(key, data, callback) {
    if (callback) {
      // First load from cache (instant, no Firestore cost)
      const cached = readCache(key);
      if (cached) callback(cached);
    }
    // Then enable real-time listener
    const unsub = onSnapshot(doc(db, 'user_data', key), (snap) => {
      if (snap.exists()) {
        const newData = snap.data()[key] || snap.data();
        writeCache(key, newData);
        if (callback) callback(newData);
      }
    }, (err) => {
      console.error(`${key} sync error:`, err);
    });
    unsubscribers.push(unsub);
  }

  // Listen to tasks
  syncWithCache('tasks', null, onTasksSync);

  // Listen to goals
  syncWithCache('goals', null, onGoalsSync);

  // Listen to pomodoro
  syncWithCache('pomodoro', null, onPomodoroSync);

  // Listen to notifications
  syncWithCache('notifications', null, onNotificationsSync);

  console.log('Firebase sync enabled');
}

// Disable sync
export function disableSync() {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  syncEnabled = false;
  console.log('Firebase sync disabled');
}

// Push local changes to Firestore (also updates local cache)
export async function pushTasks(tasks) {
  // Always update local cache first
  writeCache('tasks', tasks);
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
  writeCache('goals', goals);
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
  writeCache('pomodoro', state);
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
  writeCache('notifications', notifications);
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

export { isFirebaseConfigured, readCache };
