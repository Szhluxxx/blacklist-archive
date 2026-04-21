const ADMIN_PASSWORD = 'admin123';
const STORAGE_KEY = 'blacklist_data';
let isLoggedIn = false;
let currentTab = 'blacklist';
const emptyData = { blacklist: [], archive: [], lastUpdated: new Date().toISOString() };

function getData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : emptyData;
}

function saveData(data) {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render();
}

function addEntry(name, reason, severity, contact) {
    const data = getData();
    const entry = {
        id: Date.now().toString(),
        name: name,
        reason: reason,
        severity: severity,
        contact: contact,
        evidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    data.blacklist.push(entry);
    saveData(data);
    clearForm();
}

function updateEntry(id, name, reason, severity, contact) {
    const data = getData();
    const entry = data.blacklist.find(e => e.id === id);
    if (entry) {
        entry.name = name;
        entry.reason = reason;
        entry.severity = severity;
        entry.contact = contact;
        entry.updatedAt = new Date().toISOString();
        saveData(data);
    }
}

function deleteEntry(id) {
    if (!confirm('Wirklich löschen?')) return;
    const data = getData();
    data.blacklist = data.blacklist.filter(e => e.id !== id);
    saveData(data);
}

function archiveEntry(id) {
    const data = getData();
    const entry = data.blacklist.find(e => e.id === id);
    if (entry) {
        entry.archivedAt = new Date().toISOString();
        data.archive.push(entry);
        data.blacklist = data.blacklist.filter(e => e.id !== id);
        saveData(data);
    }
}

function restoreEntry(id) {
    const data = getData();
    const entry = data.archive.find(e => e.id === id);
    if (entry) {
        delete entry.archivedAt;
        data.blacklist.push(entry);
        data.archive = data.archive.filter(e => e.id !== id);
        saveData(data);
    }
}

function deleteArchiveEntry(id) {
    if (!confirm('Wirklich endgültig löschen?')) return;
    const data = getData();
    data.archive = data.archive.filter(e => e.id !== id);
    saveData(data);
}

function addEvidence(entryId, file) {
    const data = getData();
    const entry = data.blacklist.find(e => e.id === entryId);
    if (entry && file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const evidence = {
                id: Date.now().toString(),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                data: e.target.result
            };
            entry.evidence.push(evidence);
            saveData(data);
        };
        reader.readAsDataURL(file);
    }
}

function removeEvidence(entryId, evidenceId) {
    const data = getData();
    const entry = data.blacklist.find(e => e.id === entryId);
    if (entry) {
        entry.evidence = entry.evidence.filter(e => e.id !== evidenceId);
        saveData(data);
    }
}

function downloadEvidence(entryId, evidenceId) {
    const data = getData();
    const entry = data.blacklist.find(e => e.id === entryId);
    if (entry) {
        const evidence = entry.evidence.find(e => e.id === evidenceId);
        if (evidence) {
            const link = document.createElement('a');
            link.href = evidence.data;
            link.download = evidence.name;
            link.click();
        }
    }
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function clearForm() {
    document.getElementById('entryForm').reset();
}

function handleLogin() {
    const password = document.getElementById('loginPassword').value;
    if (password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        render();
    } else {
        alert('❌ Falsches Passwort!');
    }
}

function handleLogout() {
    if (confirm('Wirklich abmelden?')) {
        isLoggedIn = false;
        render();
    }
}

function switchTab(tab) {
    currentTab = tab;
    render();
}

function render() {
    const app = document.getElementById('app');
    if (!isLoggedIn) {
        app.innerHTML = `<div class=\"login-container\"><div class=\"login-box\"><h1>🔐 Blacklist Archive</h1><p>Admin-Zugang erforderlich</p><input type=\"password\" id=\"loginPassword\" placeholder=\"Passwort\" /><button onclick=\"handleLogin()\">Login</button></div></div>`;
        document.getElementById('loginPassword').focus();
    } else {
        const data = getData();
        app.innerHTML = `<div class=\"admin-container\"><header><h1>🔐 Blacklist Archive Admin</h1><button onclick=\"handleLogout()\" class=\"logout-btn\">🚪 Logout</button></header><nav class=\"tabs\"><button class=\"tab ${currentTab === 'blacklist' ? 'active' : ''}\" onclick=\"switchTab('blacklist')\">📋 Blacklist (${data.blacklist.length})</button><button class=\"tab ${currentTab === 'archive' ? 'active' : ''}\" onclick=\"switchTab('archive')\">📦 Archiv (${data.archive.length})</button><button class=\"tab ${currentTab === 'add' ? 'active' : ''}\" onclick=\"switchTab('add')\">➕ Neu hinzufügen</button></nav><div class=\"content\">${currentTab === 'blacklist' ? renderBlacklist(data.blacklist) : ''}${currentTab === 'archive' ? renderArchive(data.archive) : ''}${currentTab === 'add' ? renderAddForm() : ''}</div></div>`;
    }
}

function renderBlacklist(entries) {
    if (entries.length === 0) {
        return '<p class=\"empty\">Keine Einträge</p>';
    }
    return entries.map(entry => `<div class=\"entry-card\"><div class=\"entry-header\"><h3>${entry.name}</h3><span class=\"severity ${entry.severity}\">${entry.severity}</span></div><p><strong>Grund:</strong> ${entry.reason}</p><p><strong>Kontakt:</strong> ${entry.contact}</p><p class=\"date\">Hinzugefügt: ${formatDate(entry.createdAt)}</p><p class=\"evidence-count\">📎 ${entry.evidence.length} Beweise</p><div class=\"entry-evidence\">${entry.evidence.map(e => `<div class=\"evidence-item\"><span>${e.name}</span><button onclick=\"downloadEvidence('${entry.id}', '${e.id}')\">⬇️</button><button onclick=\"removeEvidence('${entry.id}', '${e.id}')\">❌</button></div>`).join('')}</div><div class=\"evidence-upload\"><input type=\"file\" id=\"file-${entry.id}\" onchange=\"addEvidence('${entry.id}', this.files[0])\"><label for=\"file-${entry.id}\">📁 Beweis hochladen</label></div><div class=\"entry-actions\"><button class=\"btn-edit\" onclick=\"switchTab('edit-${entry.id}')\">✏️ Bearbeiten</button><button class=\"btn-archive\" onclick=\"archiveEntry('${entry.id}')\">📤 Archivieren</button><button class=\"btn-delete\" onclick=\"deleteEntry('${entry.id}')\">🗑️ Löschen</button></div></div>`).join('');
}

function renderArchive(entries) {
    if (entries.length === 0) {
        return '<p class=\"empty\">Archiv ist leer</p>';
    }
    return entries.map(entry => `<div class=\"entry-card archived\"><div class=\"entry-header\"><h3>${entry.name}</h3><span class=\"severity ${entry.severity}\">${entry.severity}</span></div><p><strong>Grund:</strong> ${entry.reason}</p><p><strong>Kontakt:</strong> ${entry.contact}</p><p class=\"date\">Archiviert: ${formatDate(entry.archivedAt)}</p><p class=\"evidence-count\">📎 ${entry.evidence.length} Beweise</p><div class=\"entry-evidence\">${entry.evidence.map(e => `<div class=\"evidence-item\"><span>${e.name}</span><button onclick=\"downloadEvidence('${entry.id}', '${e.id}')\">⬇️</button></div>`).join('')}</div><div class=\"entry-actions\"><button class=\"btn-restore\" onclick=\"restoreEntry('${entry.id}')\">↩️ Wiederherstellen</button><button class=\"btn-delete\" onclick=\"deleteArchiveEntry('${entry.id}')\">🗑️ Löschen</button></div></div>`).join('');
}

function renderAddForm() {
    return `<div class=\"form-container\"><h2>Neuer Eintrag</h2><form id=\"entryForm\" onsubmit=\"event.preventDefault(); addEntry(document.getElementById('name').value, document.getElementById('reason').value, document.getElementById('severity').value, document.getElementById('contact').value)\"><input type=\"text\" id=\"name\" placeholder=\"Name/Identifier\" required><textarea id=\"reason\" placeholder=\"Grund für Eintrag\" required></textarea><select id=\"severity\" required><option value=\"\">Schweregrad wählen</option><option value=\"Kritisch\">🔴 Kritisch</option><option value=\"Hoch\">🟠 Hoch</option><option value=\"Mittel\">🟡 Mittel</option><option value=\"Niedrig\">🟢 Niedrig</option></select><input type=\"email\" id=\"contact\" placeholder=\"Kontakt (optional)\"><button type=\"submit\">➕ Hinzufügen</button></form></div>`;
}

window.addEventListener('DOMContentLoaded', render);