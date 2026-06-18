// Chrome Extension Background Service Worker
// Handles extension lifecycle and message passing

// Open full app when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: 'index.html' });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TASKS') {
    chrome.storage.local.get(['tasks'], (result) => {
      sendResponse({ tasks: result.tasks || [] });
    });
    return true; // Keep channel open for async response
  }

  if (msg.type === 'ADD_TASK') {
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      tasks.push(msg.task);
      chrome.storage.local.set({ tasks });
      // Notify popup of update
      chrome.runtime.sendMessage({ type: 'TASKS_UPDATED' });
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Eisenhower Task extension installed:', details.reason);
});
