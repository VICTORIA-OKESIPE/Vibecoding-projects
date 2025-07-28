const STORAGE_KEY = 'vibeLitReviewEntries';
const form = document.getElementById('entryForm');
const tableBody = document.querySelector('#entriesTable tbody');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const advancedExportBtn = document.getElementById('advancedExportBtn');
const userTypeSelect = document.getElementById('userTypeSelect');
const userTypeOtherInput = document.getElementById('userTypeOtherInput');

let editIndex = null;

function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderTable(entries) {
  tableBody.innerHTML = '';
  if (entries.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 16;
    cell.textContent = 'No entries yet.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }
  entries.forEach((entry, idx) => {
    const row = document.createElement('tr');
    [
      'title','apaCitation','year','paperType','venue','userType','objectives','questions','constructs','theories',
      'experimentalDesign','analysis','limitations','future','findings','notes'
    ].forEach(key => {
      const cell = document.createElement('td');
      cell.textContent = entry[key] || '';
      row.appendChild(cell);
    });
    // Edit button
    const editCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.onclick = () => loadEntryForEdit(idx);
    editCell.appendChild(editBtn);
    row.appendChild(editCell);
    // Delete button
    const deleteCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => deleteEntry(idx);
    deleteCell.appendChild(deleteBtn);
    row.appendChild(deleteCell);
    tableBody.appendChild(row);
  });
  updateEntryCount(entries);
}

function updateEntryCount(entries) {
  const entryCount = document.getElementById('entryCount');
  const historyMsg = document.getElementById('historyMsg');
  if (entryCount) entryCount.textContent = `Entries: ${entries.length}`;
  if (historyMsg) {
    if (entries.length === 0) {
      historyMsg.textContent = "No entries yet. Start coding your literature!";
    } else {
      historyMsg.textContent = "Your coded literature will appear below. Edit or delete any entry at any time.";
    }
  }
}

function deleteEntry(idx) {
  let entries = getEntries();
  entries.splice(idx, 1);
  saveEntries(entries);
  renderTable(filterEntries(entries, searchInput.value));
  form.reset();
  editIndex = null;
  form.querySelector('button[type="submit"]').textContent = 'Add Entry';
  userTypeOtherInput.style.display = 'none';
}


function filterEntries(entries, query) {
  if (!query.trim()) return entries;
  const q = query.toLowerCase();
  return entries.filter(entry =>
    Object.values(entry).some(val => (val || '').toLowerCase().includes(q))
  );
}

function handleFormSubmit(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  let userType = data.userType;
  if (userType === 'Other') {
    userType = data.userTypeOther || 'Other';
  }
  const entry = {
    title: data.title || '',
    apaCitation: data.apaCitation || '',
    year: data.year || '',
    paperType: data.paperType || '',
    venue: data.venue || '',
    userType,
    objectives: data.objectives || '',
    questions: data.questions || '',
    constructs: data.constructs || '',
    theories: data.theories || '',
    experimentalDesign: data.experimentalDesign || '',
    analysis: data.analysis || '',
    limitations: data.limitations || '',
    future: data.future || '',
    findings: data.findings || '',
    notes: data.notes || ''
  };
  let entries = getEntries();
  if (editIndex !== null) {
    entries[editIndex] = entry;
    editIndex = null;
    form.querySelector('button[type="submit"]').textContent = 'Add Entry';
  } else {
    entries = [entry, ...entries];
  }
  saveEntries(entries);
  renderTable(filterEntries(entries, searchInput.value));
  form.reset();
  userTypeOtherInput.style.display = 'none';
  updateEntryCount(entries);
}

function loadEntryForEdit(idx) {
  const entries = getEntries();
  const entry = entries[idx];
  form.title.value = entry.title;
  form.apaCitation.value = entry.apaCitation || '';
  form.year.value = entry.year || '';
  form.paperType.value = entry.paperType || '';
  form.venue.value = entry.venue || '';
  form.userType.value = ['Novice','Expert'].includes(entry.userType) ? entry.userType : 'Other';
  form.userTypeOther.value = (!['Novice','Expert'].includes(entry.userType)) ? entry.userType : '';
  userTypeOtherInput.style.display = (!['Novice','Expert'].includes(entry.userType)) ? '' : 'none';
  form.objectives.value = entry.objectives || '';
  form.questions.value = entry.questions || '';
  form.constructs.value = entry.constructs || '';
  form.theories.value = entry.theories || '';
  form.experimentalDesign.value = entry.experimentalDesign || '';
  form.analysis.value = entry.analysis || '';
  form.limitations.value = entry.limitations || '';
  form.future.value = entry.future || '';
  form.findings.value = entry.findings || '';
  form.notes.value = entry.notes || '';
  editIndex = idx;
  form.querySelector('button[type="submit"]').textContent = 'Save Changes';
  form.scrollIntoView({behavior:'smooth'});
}

function handleSearchInput() {
  const entries = getEntries();
  renderTable(filterEntries(entries, searchInput.value));
}

function handleExport() {
  const entries = getEntries();
  if (!entries.length) return alert('No entries to export!');
  const csvRows = [];
  const headers = ['Paper Title','APA Citation','Year','Type of Paper','Venue','User Type','Objectives','Questions','Constructs','Theories','Experimental Design','Analysis','Limitations','Future','Findings','Notes'];
  const keys = ['title','apaCitation','year','paperType','venue','userType','objectives','questions','constructs','theories','experimentalDesign','analysis','limitations','future','findings','notes'];
  csvRows.push(headers.join(','));
  for (const entry of entries) {
    const row = keys.map(key => {
      let val = (entry[key] || '').replace(/"/g, '""');
      if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1 || val.indexOf('\n') !== -1) {
        val = '"' + val + '"';
      }
      return val;
    });
    csvRows.push(row.join(','));
  }
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vibe_lit_review.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

form.addEventListener('submit', handleFormSubmit);
searchInput.addEventListener('input', handleSearchInput);
exportBtn.addEventListener('click', handleExport);

advancedExportBtn.addEventListener('click', handleAdvancedExport);

async function handleAdvancedExport() {
  const entries = getEntries();
  if (!entries.length) return alert('No entries to export!');
  const headers = ['Paper Title','APA Citation','Year','Type of Paper','Venue','User Type','Objectives','Questions','Constructs','Theories','Analysis','Limitations','Future','Findings','Notes'];
  const keys = ['title','apaCitation','year','paperType','venue','userType','objectives','questions','constructs','theories','analysis','limitations','future','findings','notes'];
  const csvRows = [headers.join(',')];
  for (const entry of entries) {
    const row = keys.map(key => {
      let val = (entry[key] || '').replace(/"/g, '""');
      if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1 || val.indexOf('\n') !== -1) {
        val = '"' + val + '"';
      }
      return val;
    });
    csvRows.push(row.join(','));
  }
  const csv = csvRows.join('\n');

  // Use File System Access API if available
  if (window.showSaveFilePicker) {
    try {
      const opts = {
        suggestedName: 'vibe_lit_review.csv',
        types: [{
          description: 'CSV file',
          accept: {'text/csv': ['.csv']}
        }]
      };
      const handle = await window.showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      await writable.write(csv);
      await writable.close();
      alert('Exported successfully!');
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert('Export failed: ' + err.message);
      }
    }
  } else {
    // Fallback to standard download
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vibe_lit_review.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    alert('Your browser does not support folder selection. File was downloaded as usual.');
  }
}

userTypeSelect.addEventListener('change', function() {
  if (this.value === 'Other') {
    userTypeOtherInput.style.display = '';
    userTypeOtherInput.required = true;
  } else {
    userTypeOtherInput.style.display = 'none';
    userTypeOtherInput.required = false;
    userTypeOtherInput.value = '';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderTable(getEntries());
  updateEntryCount(getEntries());
});
