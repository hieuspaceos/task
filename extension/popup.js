// Chrome Extension Popup Script
// Uses chrome.storage.local for extension-specific data
// Syncs with Firebase when available

const QUADRANT_NAMES = ['Q1', 'Q2', 'Q3', 'Q4'];

// Load tasks from storage
async function loadTasks() {
  const result = await chrome.storage.local.get(['tasks', 'lastSync']);
  return result.tasks || [];
}

// Save tasks to storage
async function saveTasks(tasks) {
  await chrome.storage.local.set({
    tasks,
    lastSync: Date.now()
  });
}

// Add quick task
async function addQuickTask(text) {
  if (!text.trim()) return;

  const tasks = await loadTasks();
  const quadrant = classifyTask(text);

  tasks.push({
    id: Date.now().toString(),
    text: text.trim(),
    quadrant,
    goalId: null,
    done: false
  });

  await saveTasks(tasks);
  renderTasks();
}

// Classify task by keywords
function classifyTask(text) {
  const lower = text.toLowerCase();

  const q1Keywords = ['gấp', 'khẩn', 'urgent', 'deadline', 'hôm nay', 'ngay', 'important', 'critical'];
  const q2Keywords = ['học', 'project', 'mục tiêu', 'plan', 'schedule', 'learn', 'build', 'code'];
  const q3Keywords = ['email', 'mail', 'gọi', 'message', 'reply', 'phone', 'zalo'];

  if (q1Keywords.some(k => lower.includes(k))) return 1;
  if (q2Keywords.some(k => lower.includes(k))) return 2;
  if (q3Keywords.some(k => lower.includes(k))) return 3;
  return 4;
}

// Render tasks in mini quadrants
function renderTasks() {
  loadTasks().then(tasks => {
    for (let q = 1; q <= 4; q++) {
      const list = document.getElementById(`q${q}-tasks`);
      if (!list) continue;

      list.innerHTML = '';

      tasks
        .filter(t => t.quadrant === q && !t.done)
        .slice(0, 3)
        .forEach(task => {
          const li = document.createElement('li');
          if (task.done) li.classList.add('done');
          li.textContent = task.text;
          li.title = task.text;
          list.appendChild(li);
        });
    }
  });
}

// Toggle task done
async function toggleTask(taskId) {
  const tasks = await loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.done = !task.done;
    await saveTasks(tasks);
    renderTasks();
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();

  // Quick add
  const input = document.getElementById('quick-task-input');
  const addBtn = document.getElementById('add-quick-task');

  addBtn.addEventListener('click', () => {
    addQuickTask(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      addQuickTask(input.value);
      input.value = '';
    }
  });

  // Open full app
  document.getElementById('open-full-app').addEventListener('click', () => {
    chrome.tabs.create({ url: 'index.html' });
  });
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TASKS_UPDATED') {
    renderTasks();
  }
});
