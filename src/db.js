import Dexie from 'dexie';

export const db = new Dexie('EisenhowerDB');

db.version(1).stores({
  tasks: 'id, quadrant, goalId, done',
  goals: 'id',
  pomodoro: 'id',
  notifications: 'id, timestamp, read'
});

// Migration from localStorage (one-time)
export async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem('eisenhower-migrated');
  if (migrated) return;

  // Tasks
  const tasks = JSON.parse(localStorage.getItem('eisenhower-tasks') || '[]');
  if (tasks.length) await db.tasks.bulkPut(tasks);

  // Goals
  const goals = JSON.parse(localStorage.getItem('eisenhower-goals') || '[]');
  if (goals.length) await db.goals.bulkPut(goals);

  // Pomodoro
  const pomodoro = JSON.parse(localStorage.getItem('eisenhower-pomodoro') || '{}');
  if (Object.keys(pomodoro).length) await db.pomodoro.put({ id: 'state', ...pomodoro });

  // Notifications
  const notifications = JSON.parse(localStorage.getItem('eisenhower-notifications') || '[]');
  if (notifications.length) await db.notifications.bulkPut(notifications);

  // AI API Key - keep in localStorage (more secure than IndexedDB for sensitive data)

  localStorage.setItem('eisenhower-migrated', 'true');
}

// Helper functions
export async function getTasks() {
  return db.tasks.toArray();
}

export async function saveTasks(tasks) {
  await db.tasks.clear();
  await db.tasks.bulkPut(tasks);
}

export async function getGoals() {
  return db.goals.toArray();
}

export async function saveGoals(goals) {
  await db.goals.clear();
  await db.goals.bulkPut(goals);
}

export async function getPomodoro() {
  return db.pomodoro.get('state');
}

export async function savePomodoro(state) {
  await db.pomodoro.put({ id: 'state', ...state });
}

export async function getNotifications() {
  return db.notifications.orderBy('timestamp').reverse().toArray();
}

export async function saveNotifications(notifications) {
  await db.notifications.clear();
  await db.notifications.bulkPut(notifications);
}
