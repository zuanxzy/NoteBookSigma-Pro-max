// ==================== CONFIG ====================
const CLIENT_ID = '726427588085-hfike74omovhv4igp1ku8epql58hrjpj.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// ==================== ELEMENTS ====================
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDateInput');
const prioritySelect = document.getElementById('prioritySelect');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const clearSearchButton = document.getElementById('clearSearchButton');
const hideCompletedCheckbox = document.getElementById('hideCompletedCheckbox');
const clearAllButton = document.getElementById('clearAllButton');
const notificationDiv = document.getElementById('notification');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const statsDiv = document.querySelector('.stats');

let isGoogleLoggedIn = false;

// ==================== GOOGLE API ====================
function gapiLoaded() {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            clientId: CLIENT_ID,
            discoveryDocs: [DISCOVERY_DOC],
            scope: SCOPES
        }).then(() => {
            const auth = gapi.auth2.getAuthInstance();
            isGoogleLoggedIn = auth.isSignedIn.get();
            updateGoogleUI();
            auth.isSignedIn.listen(updateGoogleUI);
    });
}

googleLoginBtn.addEventListener('click', () => {
    gapi.auth2.getAuthInstance().signIn()
        .then(() => { isGoogleLoggedIn = true; updateGoogleUI(); showNotification('Login Google OK', 1500); })
<<<<<<< HEAD
        .catch(() => showNotification('Gagal login Google', 3000));
=======
>>>>>>> 299ad436f58af712c8c2245b23904f4093ce59be
});

function updateGoogleUI() {
    googleLoginBtn.style.display = isGoogleLoggedIn ? 'none' : 'block';
    loadTasks();
}

// ==================== SYNC CALENDAR ====================
async function addToGoogleCalendar(taskText, dueDate) {
    if (!dueDate) return;
    const event = { summary: taskText, start: { date: dueDate }, end: { date: dueDate } };
    try {
        await gapi.client.calendar.events.insert({ calendarId: 'primary', resource: event });
        showNotification('Disync!', 1500);
    } catch (err) {
}

// ==================== NOTIFICATION ====================
function showNotification(msg, dur = 2000) {
    notificationDiv.textContent = msg;
    notificationDiv.classList.add('show');
    clearTimeout(notificationDiv.timeoutId);
    notificationDiv.timeoutId = setTimeout(() => notificationDiv.classList.remove('show'), dur);
}

// ==================== TASK DOM ====================
function addTaskToDOM(text, dueDate = '', priority = 'medium', checked = false) {
    const li = document.createElement('li');
    li.classList.add(`priority-${priority}`);
    if (checked) li.classList.add('checked');
    li.dataset.dueDate = dueDate;

    const span = document.createElement('span');
    span.classList.add('task-text');
    span.textContent = text;
    li.appendChild(span);

    if (dueDate) {
        const countdown = document.createElement('small');
        countdown.classList.add('countdown');
        li.appendChild(countdown);
        updateCountdown(countdown, dueDate);
    }

    if (dueDate && isGoogleLoggedIn) {
        const syncBtn = document.createElement('button');
        syncBtn.textContent = 'Sync';
        syncBtn.classList.add('sync-btn');
        syncBtn.onclick = () => addToGoogleCalendar(text.split(' (')[0], dueDate);
        li.appendChild(syncBtn);
    }

    const del = document.createElement('span');
    del.innerHTML = 'X';
    del.classList.add('delete-btn');
    li.appendChild(del);

    taskList.appendChild(li);
    updateStats();
}

// Countdown
function updateCountdown(el, dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    if (diff < 0) el.textContent = 'Tamat!';
    else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        el.textContent = days === 0 ? 'Hari ini!' : `${days} hari lagi`;
    }
}
setInterval(() => document.querySelectorAll('.countdown').forEach(el => {
    const due = el.parentElement.dataset.dueDate;
    if (due) updateCountdown(el, due);
}), 60000);

// ==================== STORAGE ====================
function saveTasks() {
    const tasks = Array.from(taskList.children).map(li => ({
        text: li.querySelector('.task-text').textContent,
        dueDate: li.dataset.dueDate || '',
        priority: li.classList.contains('priority-high') ? 'high' : li.classList.contains('priority-low') ? 'low' : 'medium',
        checked: li.classList.contains('checked')
    }));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (!saved) return;
    taskList.innerHTML = '';
    JSON.parse(saved).forEach(t => addTaskToDOM(t.text, t.dueDate, t.priority, t.checked));
    applyFilters(); updateStats();
}

// ==================== ADD TASK ====================
function addTask() {
    const val = taskInput.value.trim();
    if (!val) return showNotification('Isi tugasan!', 2000);
    const due = dueDateInput.value;
    const priority = prioritySelect.value;
    const displayText = due ? `${val} (Tarikh Akhir: ${due})` : val;

    addTaskToDOM(displayText, due, priority);
    taskInput.value = ''; dueDateInput.value = '';
    saveTasks();
    showNotification('Tugasan ditambah!', 1500);

    if (due && isGoogleLoggedIn && confirm('Sync ke Google Calendar?')) {
        addToGoogleCalendar(val, due);
    }
}

// ==================== FILTERS & STATS ====================
function applyFilters() {
    const term = searchInput.value.toLowerCase().trim();
    const hide = hideCompletedCheckbox.checked;
    let found = false;

    taskList.querySelectorAll('li').forEach(li => {
        const txt = li.querySelector('.task-text').textContent.toLowerCase();
        const checked = li.classList.contains('checked');
        const show = txt.includes(term) && !(hide && checked);
        li.style.display = show ? 'flex' : 'none';
        if (txt.includes(term)) found = true;
    });
    if (term && !found) showNotification('Tiada tugasan.', 2000);
    updateStats();
}

function updateStats() {
    const total = taskList.children.length;
    const completed = Array.from(taskList.children).filter(li => li.classList.contains('checked')).length;
    statsDiv.textContent = `${total} tugasan • ${completed} selesai`;
}

// ==================== EXPORT / IMPORT ====================
exportBtn.addEventListener('click', () => {
    const data = localStorage.getItem('tasks');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notebooksigma-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup dimuat turun!', 2000);
});

importFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            localStorage.setItem('tasks', ev.target.result);
            loadTasks();
            showNotification('Backup dipulihkan!', 2000);
        } catch (err) {
            showNotification('Fail backup tidak sah.', 3000);
        }
    };
    reader.readAsText(file);
});

// ==================== DARK MODE ====================
darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeBtn.textContent = isDark ? 'Sun' : 'Moon';
});
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = 'Sun';
}

// ==================== EVENTS ====================
addTaskButton.addEventListener('click', addTask);
taskList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    if (e.target.classList.contains('delete-btn')) {
        li.remove(); saveTasks(); showNotification('Dipadam.', 1000); updateStats();
    } else if (!e.target.classList.contains('sync-btn')) {
        li.classList.toggle('checked'); saveTasks(); updateStats();
    }
});
taskInput.addEventListener('keypress', e => e.key === 'Enter' && addTask());
searchInput.addEventListener('keypress', e => e.key === 'Enter' && applyFilters());
searchButton.addEventListener('click', applyFilters);
clearSearchButton.addEventListener('click', () => { searchInput.value = ''; applyFilters(); });
hideCompletedCheckbox.addEventListener('change', applyFilters);
clearAllButton.addEventListener('click', () => {
    if (confirm('Padam SEMUA?')) {
        taskList.innerHTML = ''; localStorage.removeItem('tasks');
        showNotification('Semua dipadam!', 2000); updateStats();
    }
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    gapiLoaded();

});
