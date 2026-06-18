import { classifyTask, classifyWithAI } from './classifier.js';
import { migrateFromLocalStorage, getTasks, saveTasks, getGoals as dbGetGoals, saveGoals as dbSaveGoals, getPomodoro, savePomodoro, getNotifications, saveNotifications } from './db.js';
import { enableSync, pushTasks, pushGoals, pushPomodoro, pushNotifications, isFirebaseConfigured, readCache, syncOnce, isMobile } from './firebase.js';

// Initialize notification plugin (non-blocking)
async function initNotifications() {
  try {
    const mod = await import('@tauri-apps/plugin-notification');
    window.__notificationPlugin = mod;
    console.log('Notification plugin loaded');
    if (mod && mod.requestPermission) {
      const result = await mod.requestPermission();
      console.log('Notification permission:', result);
    }
  } catch (e) {
    console.log('Notification plugin not available:', e);
    window.__notificationPlugin = null;
  }
}
initNotifications();

console.log('main.js loaded');

const AI_API_KEY_STORAGE = 'eisenhower-ai-key';

const GOAL_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#d946ef'
];

// State
let tasks = [];
let goals = [];
let selectedTaskId = null;
let selectedGoalId = null;
let isRendering = false;
let aiApiKey = localStorage.getItem(AI_API_KEY_STORAGE) || '';

// Pomodoro Timer State
let pomodoroState = {
  duration: 25, // minutes
  remaining: 25 * 60, // seconds
  isRunning: false,
  intervalId: null
};

// Notification State
let notifications = [];
let notificationPanelVisible = false;

// DOM refs
const input = document.getElementById('task-input');
const resetBtn = document.getElementById('reset-btn');
const lists = {};
document.querySelectorAll('.task-list').forEach(el => {
  lists[el.dataset.quadrant] = el;
});

// Get goal by id
function getGoalById(id) {
  return goals.find(g => g.id === id);
}

// Get tasks for a goal
function getTasksForGoal(goalId) {
  return tasks.filter(t => t.goalId === goalId);
}

// Random color for goal
function getRandomColor() {
  return GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)];
}

// Build task DOM element
function buildTaskEl(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  if (task.done) li.classList.add('done');

  // Tick button
  const tickBtn = document.createElement('button');
  tickBtn.className = 'task-btn tick-btn';
  tickBtn.innerHTML = task.done ? '✓' : '○';
  tickBtn.title = task.done ? 'Chưa hoàn thành' : 'Hoàn thành';
  tickBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleTaskDone(task.id);
  });
  li.appendChild(tickBtn);

  // Task text
  const content = document.createElement('span');
  content.className = 'task-text';
  content.textContent = task.text;
  li.appendChild(content);

  // Toggle description button
  if (task.description) {
    const descToggle = document.createElement('button');
    descToggle.className = 'task-btn desc-toggle-btn';
    descToggle.innerHTML = '▼';
    descToggle.title = 'Xem mô tả';
    descToggle.style.fontSize = '10px';
    descToggle.style.padding = '2px 4px';

    const descEl = document.createElement('div');
    descEl.className = 'task-description';
    descEl.textContent = task.description;
    descEl.style.display = 'none';

    descToggle.addEventListener('click', e => {
      e.stopPropagation();
      const isHidden = descEl.style.display === 'none';
      descEl.style.display = isHidden ? 'block' : 'none';
      descToggle.innerHTML = isHidden ? '▲' : '▼';
      descToggle.title = isHidden ? 'Ẩn mô tả' : 'Xem mô tả';
    });

    li.appendChild(descToggle);
    li.appendChild(descEl);
  }

  // Goal tag (if linked)
  if (task.goalId) {
    const goal = getGoalById(task.goalId);
    if (goal) {
      const tag = document.createElement('span');
      tag.className = 'task-goal-tag';
      tag.style.backgroundColor = goal.color;
      tag.textContent = goal.text;
      tag.title = 'Thuộc mục tiêu';
      li.appendChild(tag);
    }
  }

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'task-btn edit-btn';
  editBtn.innerHTML = '✎';
  editBtn.title = 'Sửa';
  editBtn.addEventListener('click', e => {
    e.stopPropagation();
    editTask(task.id);
  });
  li.appendChild(editBtn);

  // Delete button
  const delBtn = document.createElement('button');
  delBtn.className = 'task-btn delete-btn';
  delBtn.innerHTML = '✕';
  delBtn.title = 'Xóa';
  delBtn.addEventListener('click', e => {
    e.stopPropagation();
    deleteTask(task.id);
  });
  li.appendChild(delBtn);

  // Click to select for moving
  li.addEventListener('click', e => {
    if (e.target.closest('.task-btn')) return;
    selectTask(task.id);
  });

  return li;
}

// Render all tasks
function render() {
  isRendering = true;
  Object.keys(lists).forEach(q => {
    lists[q].innerHTML = '';
  });
  tasks.forEach(task => {
    const li = buildTaskEl(task);
    if (task.id === selectedTaskId) {
      li.classList.add('selected');
    }
    lists[task.quadrant].appendChild(li);
  });
  save();
  setTimeout(() => { isRendering = false; }, 50);
}

// Render goals sidebar
function renderGoals() {
  const container = document.getElementById('goals-container');
  if (!container) return;

  container.innerHTML = '';

  if (goals.length === 0) {
    container.innerHTML = '<p class="no-goals">Chưa có mục tiêu nào.<br/>Thêm mục tiêu để liên kết với task.</p>';
    return;
  }

  goals.forEach(goal => {
    const goalTasks = getTasksForGoal(goal.id);
    const doneTasks = goalTasks.filter(t => t.done).length;
    const totalTasks = goalTasks.length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'goal-card';
    if (goal.id === selectedGoalId) card.classList.add('selected');
    card.style.borderLeftColor = goal.color;

    // Build task list HTML
    const taskListHtml = goalTasks.map(t => `
      <div class="goal-task-item ${t.done ? 'done' : ''}">
        <span class="goal-task-check">${t.done ? '✓' : '○'}</span>
        <span class="goal-task-text">${t.text}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="goal-card-header">
        <span class="goal-name" style="color: ${goal.color}">${goal.text}</span>
        <button class="goal-remove" data-id="${goal.id}">✕</button>
      </div>
      <div class="goal-progress">
        <div class="goal-progress-bar" style="width: ${progress}%; background: ${goal.color}"></div>
      </div>
      <div class="goal-stats">${doneTasks}/${totalTasks} task • ${progress}%</div>
      ${goalTasks.length > 0 ? `<div class="goal-task-list">${taskListHtml}</div>` : ''}
    `;

    // Click goal name to filter
    card.querySelector('.goal-name').addEventListener('click', () => {
      selectedGoalId = selectedGoalId === goal.id ? null : goal.id;
      renderGoals();
      render();
    });

    // Remove goal
    card.querySelector('.goal-remove').addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`Xóa mục tiêu "${goal.text}" và tất cả task liên kết?`)) {
        tasks = tasks.filter(t => t.goalId !== goal.id);
        goals = goals.filter(g => g.id !== goal.id);
        dbSaveGoals(goals);
        pushGoals(goals);
        save();
        selectedGoalId = null;
        renderGoals();
        render();
      }
    });

    container.appendChild(card);
  });
}

// Toggle task done
function toggleTaskDone(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.done = !task.done;
  save();
  render();
  renderGoals(); // Update progress
}

// Select task for moving
function selectTask(id) {
  if (selectedTaskId === id) {
    selectedTaskId = null;
  } else {
    selectedTaskId = id;
  }
  render();
}

// Move selected task to quadrant
function moveToQuadrant(q) {
  if (!selectedTaskId) return;
  const task = tasks.find(t => t.id === selectedTaskId);
  if (task && task.quadrant !== q) {
    task.quadrant = q;
    save();
  }
  selectedTaskId = null;
  render();
}

// Add task
async function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Determine goal
  let goalId = selectedGoalId;
  if (!goalId) {
    // Try to match with existing goal by keyword
    const lower = trimmed.toLowerCase();
    for (const goal of goals) {
      const goalText = typeof goal === 'string' ? goal : goal.text;
      const goalLower = goalText.toLowerCase();
      const goalWords = goalLower.split(/\s+/);
      const matchCount = goalWords.filter(w => w.length > 2 && lower.includes(w)).length;
      if (matchCount >= Math.ceil(goalWords.length * 0.5)) {
        goalId = goal.id;
        break;
      }
    }
  }

  // Try AI first if available
  if (aiApiKey) {
    const aiQ = await classifyWithAI(trimmed, aiApiKey);
    if (aiQ !== null) {
      tasks.push({ id: Date.now().toString(), text: trimmed, quadrant: aiQ, goalId: goalId || null, done: false });
      render();
      renderGoals();
      input.value = '';
      return;
    }
  }

  // Fall back to keyword
  const quadrant = classifyTask(trimmed);
  if (quadrant === 0) {
    showQuadrantSelector(trimmed, goalId);
    return;
  }

  tasks.push({ id: Date.now().toString(), text: trimmed, quadrant, goalId: goalId || null, done: false });
  render();
  renderGoals();
  input.value = '';
}

// Show quadrant selector
function showQuadrantSelector(text, goalId = null) {
  const existing = document.getElementById('quadrant-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'quadrant-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <p>Chọn ô cho task:</p>
      <p class="modal-task-text">"${text}"</p>
      <div class="modal-buttons">
        <button data-q="1" class="q-btn q1-btn">Q1 - Làm ngay</button>
        <button data-q="2" class="q-btn q2-btn">Q2 - Lên lịch</button>
        <button data-q="3" class="q-btn q3-btn">Q3 - Ủy thác</button>
        <button data-q="4" class="q-btn q4-btn">Q4 - Loại bỏ</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelectorAll('.q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = parseInt(btn.dataset.q);
      tasks.push({ id: Date.now().toString(), text, quadrant: q, goalId: goalId || null, done: false });
      modal.remove();
      render();
      renderGoals();
      input.value = '';
    });
  });

  document.body.appendChild(modal);
}

// Edit task
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  showEditModal(task);
}

function showEditModal(task) {
  const existing = document.getElementById('edit-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-modal';
  modal.className = 'modal-overlay';

  const goalsOptions = goals.map(g =>
    `<option value="${g.id}" ${task.goalId === g.id ? 'selected' : ''}>${g.text}</option>`
  ).join('');

  modal.innerHTML = `
    <div class="modal-content edit-modal-content">
      <h3>Sửa task</h3>
      <div class="edit-field">
        <label>Nội dung:</label>
        <input type="text" id="edit-task-text" value="${task.text}" />
      </div>
      <div class="edit-field">
        <label>Quadrant:</label>
        <select id="edit-task-quadrant">
          <option value="1" ${task.quadrant === 1 ? 'selected' : ''}>Q1 - Làm ngay</option>
          <option value="2" ${task.quadrant === 2 ? 'selected' : ''}>Q2 - Lên lịch</option>
          <option value="3" ${task.quadrant === 3 ? 'selected' : ''}>Q3 - Ủy thác</option>
          <option value="4" ${task.quadrant === 4 ? 'selected' : ''}>Q4 - Loại bỏ</option>
        </select>
      </div>
      <div class="edit-field">
        <label>Mục tiêu:</label>
        <select id="edit-task-goal">
          <option value="">-- Không có --</option>
          ${goalsOptions}
        </select>
      </div>
      <div class="edit-field">
        <label>Mô tả:</label>
        <textarea id="edit-task-description" rows="3" placeholder="Thêm mô tả chi tiết...">${task.description || ''}</textarea>
      </div>
      <div class="edit-buttons">
        <button id="edit-save-btn" class="save-btn">Lưu</button>
        <button id="edit-cancel-btn" class="cancel-btn">Hủy</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#edit-cancel-btn').addEventListener('click', () => modal.remove());
  modal.querySelector('#edit-save-btn').addEventListener('click', () => {
    const newText = document.getElementById('edit-task-text').value.trim();
    const newQ = parseInt(document.getElementById('edit-task-quadrant').value);
    const newGoalId = document.getElementById('edit-task-goal').value || null;
    const newDesc = document.getElementById('edit-task-description').value.trim();

    if (newText) {
      task.text = newText;
      task.quadrant = newQ;
      task.goalId = newGoalId;
      task.description = newDesc || null;
      save();
      render();
      renderGoals();
    }
    modal.remove();
  });

  document.body.appendChild(modal);

  // Focus on text input
  setTimeout(() => {
    document.getElementById('edit-task-text').focus();
  }, 50);
}

function showQuadrantSelectorForEdit(task) {
  // Reuse the edit modal with current quadrant
  showEditModal(task);
}

// Delete task
function deleteTask(id) {
  if (id === selectedTaskId) selectedTaskId = null;
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
  renderGoals();
}

// Save to IndexedDB
async function save() {
  try {
    await saveTasks(tasks);
    pushTasks(tasks);
  } catch (err) {
    console.error('Failed to save tasks to IndexedDB:', err);
  }
}

// Reset all
async function reset() {
  if (tasks.length === 0 && goals.length === 0) return;
  if (!confirm('Xóa tất cả task?')) return;
  tasks = [];
  selectedTaskId = null;
  await save();
  render();
}

// Setup quadrant clicks
function setupQuadrantClicks() {
  document.querySelectorAll('.quadrant').forEach(q => {
    q.addEventListener('click', e => {
      if (isRendering) return;
      if (e.target.closest('.task-btn') || e.target.closest('.task-text') || e.target.closest('.task-goal-tag')) return;
      const qNum = parseInt(q.dataset.quadrant);
      moveToQuadrant(qNum);
    });
  });
}

// Add goal
function addGoal(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (goals.some(g => g.text.toLowerCase() === trimmed.toLowerCase())) return;
  goals.push({ id: Date.now().toString(), text: trimmed, color: getRandomColor() });
  dbSaveGoals(goals);
  pushGoals(goals);
  renderGoals();
  document.getElementById('goals-input').value = '';
}

// Setup goals UI
function setupGoalsUI() {
  const goalsInput = document.getElementById('goals-input');
  const goalsAddBtn = document.getElementById('goals-add-btn');
  const apiKeyInput = document.getElementById('api-key-input');
  const apiKeySaveBtn = document.getElementById('api-key-save-btn');

  if (goalsAddBtn) {
    goalsAddBtn.addEventListener('click', () => addGoal(goalsInput.value));
  }
  if (goalsInput) {
    goalsInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addGoal(goalsInput.value);
    });
  }
  if (apiKeySaveBtn) {
    apiKeySaveBtn.addEventListener('click', () => {
      if (apiKeyInput) {
        aiApiKey = apiKeyInput.value.trim();
        localStorage.setItem(AI_API_KEY_STORAGE, aiApiKey);
        alert('API Key đã lưu!');
      }
    });
  }

  const apiKeyToggle = document.getElementById('api-key-toggle');
  const apiKeySection = document.getElementById('api-key-section');
  if (apiKeyToggle && apiKeySection) {
    apiKeyToggle.addEventListener('click', () => {
      apiKeySection.style.display = apiKeySection.style.display === 'none' ? 'block' : 'none';
    });
  }
}

// Event listeners
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask(input.value);
});
resetBtn.addEventListener('click', reset);

// ============ POMODORO TIMER ============

async function savePomodoroState() {
  try {
    await savePomodoro(pomodoroState);
    pushPomodoro(pomodoroState);
  } catch (err) {
    console.error('Failed to save pomodoro state:', err);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updatePomodoroDisplay() {
  const display = document.getElementById('pomodoro-display');
  const progress = document.getElementById('pomodoro-progress');
  const fabDisplay = document.getElementById('pomodoro-fab-display');
  const popupDisplay = document.getElementById('pomodoro-popup-display');

  const timeStr = formatTime(pomodoroState.remaining);

  if (display) {
    display.textContent = timeStr;
  }
  if (fabDisplay) {
    fabDisplay.textContent = timeStr;
  }
  if (popupDisplay) {
    popupDisplay.textContent = timeStr;
  }
  if (progress) {
    const total = pomodoroState.duration * 60;
    const percent = (pomodoroState.remaining / total) * 100;
    progress.style.width = `${percent}%`;
  }
}

function playAlarm() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);

    // Beep 3 times
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 800;
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.5);
    }, 600);
    setTimeout(() => {
      const osc3 = audioCtx.createOscillator();
      osc3.connect(gainNode);
      osc3.frequency.value = 800;
      osc3.start(audioCtx.currentTime);
      osc3.stop(audioCtx.currentTime + 0.5);
    }, 1200);
  } catch (e) {
    console.error('Audio failed:', e);
  }
}

async function sendNativeNotification(title, body) {
  // Only send native notifications when running inside Tauri
  if (!window.__TAURI__) {
    console.log('Not in Tauri context, skipping native notification');
    return;
  }
  try {
    const plugin = window.__notificationPlugin;
    if (!plugin) {
      console.log('Notification plugin not loaded yet');
      return;
    }

    const { isPermissionGranted, requestPermission, sendNotification } = plugin;

    let permitted = await isPermissionGranted();
    if (!permitted) {
      const result = await requestPermission();
      permitted = result === 'granted';
    }

    if (permitted) {
      await sendNotification({ title, body });
      console.log('System notification sent:', title);
    } else {
      console.log('Notification permission denied');
    }
  } catch (e) {
    console.error('System notification error:', e);
  }
}

async function sendNotification(title, body, type = 'success') {
  // Add to in-app notification center
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'pomodoro' ? '🍅' : '🔔';
  addNotification(title, body, type, icon);

  // Also try system notification
  await sendNativeNotification(title, body);
}

function onPomodoroComplete() {
  pomodoroState.isRunning = false;
  clearInterval(pomodoroState.intervalId);
  pomodoroState.intervalId = null;
  playAlarm();
  sendNotification('🍅 Pomodoro Complete!', 'Đã hoàn thành phiên làm việc. Nghỉ ngơi một chút!', 'pomodoro');
  updatePomodoroButtons();
  savePomodoroState();
}

function tickPomodoro() {
  if (pomodoroState.remaining > 0) {
    pomodoroState.remaining--;
    updatePomodoroDisplay();
    savePomodoroState();
  } else {
    onPomodoroComplete();
  }
}

function startPomodoro() {
  if (pomodoroState.isRunning) return;
  pomodoroState.isRunning = true;
  pomodoroState.intervalId = setInterval(tickPomodoro, 1000);
  updatePomodoroButtons();
  savePomodoroState();
}

function pausePomodoro() {
  if (!pomodoroState.isRunning) return;
  pomodoroState.isRunning = false;
  clearInterval(pomodoroState.intervalId);
  pomodoroState.intervalId = null;
  updatePomodoroButtons();
  savePomodoroState();
}

function resetPomodoro() {
  pausePomodoro();
  pomodoroState.remaining = pomodoroState.duration * 60;
  updatePomodoroDisplay();
  savePomodoroState();
}

function updatePomodoroButtons() {
  const startBtn = document.getElementById('pomodoro-start');
  const pauseBtn = document.getElementById('pomodoro-pause');
  if (startBtn) startBtn.style.display = pomodoroState.isRunning ? 'none' : 'inline-block';
  if (pauseBtn) pauseBtn.style.display = pomodoroState.isRunning ? 'inline-block' : 'none';
}

// ============ NOTIFICATION CENTER ============

async function saveNotificationsState() {
  try {
    await saveNotifications(notifications);
    pushNotifications(notifications);
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

function getUnreadCount() {
  return notifications.filter(n => !n.read).length;
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

function addNotification(title, message, type = 'info', icon = '🔔') {
  const notification = {
    id: Date.now().toString(),
    title,
    message,
    type,
    icon,
    timestamp: Date.now(),
    read: false
  };
  notifications.unshift(notification);
  // Keep max 50 notifications
  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50);
  }
  saveNotificationsState();
  updateNotificationBadge();
  renderNotificationList();
  return notification;
}

function markNotificationRead(id) {
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    saveNotificationsState();
    updateNotificationBadge();
    renderNotificationList();
  }
}

function markAllNotificationsRead() {
  notifications.forEach(n => n.read = true);
  saveNotificationsState();
  updateNotificationBadge();
  renderNotificationList();
}

function dismissNotification(id) {
  notifications = notifications.filter(n => n.id !== id);
  saveNotificationsState();
  updateNotificationBadge();
  renderNotificationList();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  const unreadCount = getUnreadCount();
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

function renderNotificationList() {
  const list = document.getElementById('notification-list');
  if (!list) return;

  if (notifications.length === 0) {
    list.innerHTML = '<div class="notification-empty">Không có thông báo nào</div>';
    return;
  }

  list.innerHTML = notifications.map(n => `
    <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <div class="notification-item-icon ${n.type}">${n.icon}</div>
      <div class="notification-item-content">
        <div class="notification-item-title">${n.title}</div>
        <div class="notification-item-time">${formatTimeAgo(n.timestamp)}</div>
      </div>
      <div class="notification-item-actions">
        <button class="notification-dismiss" data-dismiss="${n.id}" title="Xóa">✕</button>
      </div>
    </div>
  `).join('');

  // Click to mark as read
  list.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('.notification-dismiss')) return;
      markNotificationRead(item.dataset.id);
    });
  });

  // Dismiss button
  list.querySelectorAll('.notification-dismiss').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      dismissNotification(btn.dataset.dismiss);
    });
  });
}

function toggleNotificationPanel() {
  const panel = document.getElementById('notification-panel');
  notificationPanelVisible = !notificationPanelVisible;

  if (notificationPanelVisible) {
    // Create overlay if not exists
    let overlay = document.querySelector('.notification-panel-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'notification-panel-overlay';
      overlay.addEventListener('click', toggleNotificationPanel);
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    panel.style.display = 'flex';
    renderNotificationList();
    // Mark as read when opening
    markAllNotificationsRead();
  } else {
    panel.style.display = 'none';
    const overlay = document.querySelector('.notification-panel-overlay');
    if (overlay) overlay.style.display = 'none';
  }
}

function setupNotificationUI() {
  const notifBtn = document.getElementById('notification-btn');
  const markAllBtn = document.getElementById('mark-all-read-btn');

  if (notifBtn) {
    notifBtn.addEventListener('click', toggleNotificationPanel);
  }
  if (markAllBtn) {
    markAllBtn.addEventListener('click', e => {
      e.stopPropagation();
      markAllNotificationsRead();
    });
  }

  updateNotificationBadge();
}

// ============ POMODORO ============

function setupPomodoroUI() {
  const startBtn = document.getElementById('pomodoro-start');
  const pauseBtn = document.getElementById('pomodoro-pause');
  const resetBtnEl = document.getElementById('pomodoro-reset');
  const durationInput = document.getElementById('pomodoro-duration');

  if (startBtn) {
    startBtn.addEventListener('click', startPomodoro);
  }
  if (pauseBtn) {
    pauseBtn.addEventListener('click', pausePomodoro);
  }
  if (resetBtnEl) {
    resetBtnEl.addEventListener('click', resetPomodoro);
  }
  if (durationInput) {
    durationInput.value = pomodoroState.duration;
    durationInput.addEventListener('change', () => {
      const val = parseInt(durationInput.value);
      if (val > 0 && val <= 120) {
        pomodoroState.duration = val;
        if (!pomodoroState.isRunning) {
          pomodoroState.remaining = val * 60;
          updatePomodoroDisplay();
        }
        savePomodoroState();
      }
    });
  }

  // Mobile FAB setup
  const fab = document.getElementById('pomodoro-fab');
  const popup = document.getElementById('pomodoro-popup');
  const popupClose = document.getElementById('pomodoro-popup-close');

  if (fab && popup) {
    fab.addEventListener('click', () => {
      popup.classList.add('show');
    });
  }
  if (popupClose) {
    popupClose.addEventListener('click', () => {
      popup.classList.remove('show');
    });
  }
  if (popup) {
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        popup.classList.remove('show');
      }
    });
  }

  updatePomodoroDisplay();
  updatePomodoroButtons();
}

// ============ INIT ============

async function init() {
  try {
    await migrateFromLocalStorage();

    // Load from Firebase cache first (instant, no Firestore reads)
    if (isFirebaseConfigured()) {
      const cachedTasks = readCache('tasks');
      const cachedGoals = readCache('goals');
      const cachedPomodoro = readCache('pomodoro');
      const cachedNotifications = readCache('notifications');

      if (cachedTasks) tasks = cachedTasks;
      if (cachedGoals) goals = cachedGoals;
      if (cachedPomodoro) {
        pomodoroState = { ...pomodoroState, ...cachedPomodoro };
        pomodoroState.intervalId = null;
        pomodoroState.isRunning = false;
      }
      if (cachedNotifications) notifications = cachedNotifications || [];
    }

    // Fallback to IndexedDB if no Firebase cache
    if (!isFirebaseConfigured() || !readCache('tasks')) {
      tasks = await getTasks();
    }
    if (!isFirebaseConfigured() || !readCache('goals')) {
      goals = await dbGetGoals();
    }
    if (!isFirebaseConfigured() || !readCache('pomodoro')) {
      const savedPomodoro = await getPomodoro();
      if (savedPomodoro) {
        pomodoroState = { ...pomodoroState, ...savedPomodoro };
        pomodoroState.intervalId = null;
        pomodoroState.isRunning = false;
      }
    }
    if (!isFirebaseConfigured() || !readCache('notifications')) {
      notifications = await getNotifications() || [];
    }

    setupQuadrantClicks();
    setupGoalsUI();
    setupPomodoroUI();
    setupNotificationUI();

    renderGoals();
    render();

    if (isFirebaseConfigured()) {
      if (isMobile()) {
        // Mobile: one-time sync only (no real-time listeners = less battery)
        syncOnce(
          (syncedTasks) => { tasks = syncedTasks; render(); },
          (syncedGoals) => { goals = syncedGoals; dbSaveGoals(goals); renderGoals(); },
          (syncedPomodoro) => {
            pomodoroState = { ...pomodoroState, ...syncedPomodoro };
            pomodoroState.intervalId = null;
            pomodoroState.isRunning = false;
            updatePomodoroDisplay();
            updatePomodoroButtons();
          },
          (syncedNotifications) => { notifications = syncedNotifications; renderNotificationList(); updateNotificationBadge(); }
        );
      } else {
        // Desktop: real-time sync
        enableSync(
          (syncedTasks) => { tasks = syncedTasks; render(); },
          (syncedGoals) => { goals = syncedGoals; dbSaveGoals(goals); renderGoals(); },
          (syncedPomodoro) => {
            pomodoroState = { ...pomodoroState, ...syncedPomodoro };
            pomodoroState.intervalId = null;
            pomodoroState.isRunning = false;
            updatePomodoroDisplay();
            updatePomodoroButtons();
          },
          (syncedNotifications) => { notifications = syncedNotifications; renderNotificationList(); updateNotificationBadge(); }
        );
      }
    }
  } catch (err) {
    console.error('init() error:', err);
  }
}

// Start app
init();
