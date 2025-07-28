// Recurring daily tasks
const recurringTasks = [
  "Kaggle",
  "GitHub",
  "Vibe-coding",
  "Algo project",
  "Family",
  "Other"
];

const TODO_KEY = "todo_items";
const DONE_KEY = "todo_done";
const TODAY_KEY = "todo_date";
const HISTORY_KEY = "todo_history";

function getToday() {
  // Returns YYYY-MM-DD
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function loadTasks() {
  let stored = JSON.parse(localStorage.getItem(TODO_KEY) || "null");
  if (!stored) {
    stored = recurringTasks.slice();
    localStorage.setItem(TODO_KEY, JSON.stringify(stored));
  }
  return stored;
}

function saveTasks(tasks) {
  localStorage.setItem(TODO_KEY, JSON.stringify(tasks));
}

function loadDone() {
  const today = getToday();
  const storedDate = localStorage.getItem(TODAY_KEY);
  if (storedDate !== today) {
    localStorage.setItem(TODAY_KEY, today);
    localStorage.setItem(DONE_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(localStorage.getItem(DONE_KEY) || "[]");
}

function saveDone(done) {
  localStorage.setItem(DONE_KEY, JSON.stringify(done));
}

function saveHistory(date, done, tasks) {
  // Save completion state for a date
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
  history[date] = {
    done,
    tasks
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function exportCSV() {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
  // Collect all unique tasks ever used
  let allTasks = new Set();
  Object.values(history).forEach(entry => {
    (entry.tasks || []).forEach(task => allTasks.add(task));
  });
  allTasks = Array.from(allTasks);
  // CSV header
  let csv = ['Date,' + allTasks.map(t => '"' + t.replace(/"/g,'""') + '"').join(',')];
  // Each day: mark 1/0 for completed/not
  Object.entries(history).sort().forEach(([date, entry]) => {
    let row = [date];
    allTasks.forEach((task, idx) => {
      // Find task index in entry.tasks
      const taskIdx = entry.tasks.indexOf(task);
      row.push(taskIdx !== -1 && entry.done.includes(taskIdx) ? '1' : '0');
    });
    csv.push(row.join(','));
  });
  // Download
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'todo_history.csv';
  a.click();
}

function renderList() {
  const tasks = loadTasks();
  const done = loadDone();
  const ul = document.getElementById("todo-list");
  ul.innerHTML = "";
  tasks.forEach((task, idx) => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = done.includes(idx);
    cb.addEventListener("change", () => {
      const updated = loadDone();
      if (cb.checked) {
        if (!updated.includes(idx)) updated.push(idx);
      } else {
        const ix = updated.indexOf(idx);
        if (ix !== -1) updated.splice(ix, 1);
      }
      saveDone(updated);
      renderList();
    });
    const span = document.createElement("span");
    span.textContent = task;
    if (done.includes(idx)) span.className = "completed";
    li.appendChild(cb);
    li.appendChild(span);
    ul.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderList();

  document.getElementById("add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("new-task");
    const val = input.value.trim();
    if (val) {
      const tasks = loadTasks();
      tasks.push(val);
      saveTasks(tasks);
      input.value = "";
      renderList();
    }
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    // Save today's completion to history before resetting
    const today = getToday();
    const done = loadDone();
    const tasks = loadTasks();
    saveHistory(today, done, tasks);
    localStorage.setItem(DONE_KEY, JSON.stringify([]));
    localStorage.setItem(TODAY_KEY, today);
    renderList();
  });

  document.getElementById("export-btn").addEventListener("click", exportCSV);
});
