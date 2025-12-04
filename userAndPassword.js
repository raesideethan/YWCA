'use strict';

// --- CONSTANTS ---
const theUsername = "YWCAAdmin1115";
const thePassword = "123";
const AUTH_KEY = 'isLoggedIn_demo';
const OLD_PDF_KEY = 'ywcaOldRecipesPdfList_v1'; // stores an array of PDFs
const CURRENT_PDF_KEY = 'ywcaCurrentRecipePdf_v1'; // stores a single PDF
const RECENTLY_ADDED_FOODS_KEY = 'ywcaRecentlyAddedFoodsPdf_v1'; // single PDF

// --- SHORTCUT ---
const qs = s => document.querySelector(s);

// --- LOGIN ---
function isLoggedIn() { return sessionStorage.getItem(AUTH_KEY) === '1'; }
function setLoggedIn(val) { sessionStorage.setItem(AUTH_KEY, val ? '1' : '0'); }

function initLoginPage() {
  const form = qs('#loginForm');
  if (!form) return;

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const user = qs('#username').value.trim();
    const pass = qs('#password').value;
    const msg = qs('#msg');

    if (user === theUsername && pass === thePassword) {
      setLoggedIn(true);
      window.location.href = 'admin.html';
    } else {
      msg.textContent = 'Invalid credentials';
      setLoggedIn(false);
    }
  });
}

// --- STORAGE HELPERS (Old Recipes) ---
function readPdfList() {
  const data = localStorage.getItem(OLD_PDF_KEY);
  return data ? JSON.parse(data) : [];
}

function savePdfList(list) {
  localStorage.setItem(OLD_PDF_KEY, JSON.stringify(list));
}

function addPdf(dataUrl, name) {
  const list = readPdfList();
  list.push({ dataUrl, name, uploadedAt: new Date().toISOString() });
  savePdfList(list);
}

function deleteAllPdfs() {
  localStorage.removeItem(OLD_PDF_KEY);
}

// --- STORAGE HELPERS (Current Recipe) ---
function saveCurrentRecipePdf(dataUrl, name) {
  localStorage.setItem(CURRENT_PDF_KEY, JSON.stringify({ dataUrl, name, uploadedAt: new Date().toISOString() }));
}

function readCurrentRecipePdf() {
  const data = localStorage.getItem(CURRENT_PDF_KEY);
  return data ? JSON.parse(data) : null;
}

function deleteCurrentRecipePdf() {
  localStorage.removeItem(CURRENT_PDF_KEY);
}

// --- STORAGE HELPERS (Recently Added Foods) ---
function saveRecentlyAddedFoodsPdf(dataUrl, name) {
  localStorage.setItem(RECENTLY_ADDED_FOODS_KEY, JSON.stringify({
    dataUrl,
    name,
    uploadedAt: new Date().toISOString()
  }));
}

function readRecentlyAddedFoodsPdf() {
  const data = localStorage.getItem(RECENTLY_ADDED_FOODS_KEY);
  return data ? JSON.parse(data) : null;
}

function deleteRecentlyAddedFoodsPdf() {
  localStorage.removeItem(RECENTLY_ADDED_FOODS_KEY);
}

// --- ADMIN PANEL ---
function initAdminPage() {
  if (!isLoggedIn()) {
    window.location.href = 'loginPage.html';
    return;
  }

  const logoutBtn = qs('#logoutBtn');
  const pdfInput = qs('#pdfInput');
  const pdfPreview = qs('#pdfPreview');
  const uploadBtn = qs('#uploadPdfBtn');
  const deleteBtn = qs('#deletePdfBtn');

  const currentInput = qs('#currentRecipePdfInput');
  const currentUploadBtn = qs('#uploadCurrentRecipePdfBtn');
  const currentPreview = qs('#currentRecipePdfPreview');

  const recentInput = qs('#recentlyAddedFoodsInput');
  const recentUploadBtn = qs('#uploadRecentlyAddedFoodsPdfBtn');
  const recentPreview = qs('#recentlyAddedFoodsPreview');

  // --- Old Recipes Section ---
  function renderPdfPreview() {
    pdfPreview.innerHTML = '';
    const list = readPdfList();

    if (list.length === 0) {
      pdfPreview.innerHTML = '<p class="muted">No PDFs uploaded yet.</p>';
      deleteBtn.style.display = 'none';
      return;
    }

    list.forEach((pdf, i) => {
      const item = document.createElement('div');
      item.style.margin = '8px 0';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '10px';

      const link = document.createElement('a');
      link.href = pdf.dataUrl;
      link.download = pdf.name || `Old_Recipes_${i + 1}.pdf`;
      link.textContent = `📄 ${pdf.name || 'Old Recipes PDF'} (Uploaded ${new Date(pdf.uploadedAt).toLocaleString()})`;
      link.style.color = '#0077cc';
      link.style.textDecoration = 'underline';
      link.style.flex = '1';

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️ Delete';
      delBtn.style.background = '#cc0000';
      delBtn.style.color = 'white';
      delBtn.style.border = 'none';
      delBtn.style.padding = '4px 8px';
      delBtn.style.cursor = 'pointer';
      delBtn.style.borderRadius = '4px';
      delBtn.addEventListener('click', () => {
        if (confirm(`Delete "${pdf.name}"?`)) {
          const newList = readPdfList().filter((_, idx) => idx !== i);
          savePdfList(newList);
          renderPdfPreview();
        }
      });

      item.appendChild(link);
      item.appendChild(delBtn);
      pdfPreview.appendChild(item);
    });

    deleteBtn.style.display = 'inline-block';
  }

  // Upload (append new old recipe PDF)
  uploadBtn?.addEventListener('click', () => {
    const file = pdfInput.files[0];
    if (!file) return alert('Select a PDF first.');
    if (file.type !== 'application/pdf') return alert('Please select a PDF file.');

    const reader = new FileReader();
    reader.onload = () => {
      addPdf(reader.result, file.name);
      renderPdfPreview();
      pdfInput.value = '';
      alert('✅ PDF added!');
    };
    reader.readAsDataURL(file);
  });

  // Delete all old recipe PDFs
  deleteBtn?.addEventListener('click', () => {
    if (!confirm('Delete ALL uploaded PDFs?')) return;
    deleteAllPdfs();
    renderPdfPreview();
    alert('🗑️ All PDFs deleted.');
  });

  // --- Current Recipe Section ---
  function renderCurrentRecipePreview() {
    currentPreview.innerHTML = '';
    const pdf = readCurrentRecipePdf();

    if (!pdf) {
      currentPreview.innerHTML = '<p class="muted">No current recipe uploaded yet.</p>';
      return;
    }

    const link = document.createElement('a');
    link.href = pdf.dataUrl;
    link.download = pdf.name || 'Current_Recipe.pdf';
    link.textContent = `📄 ${pdf.name || 'Current Recipe PDF'} (Uploaded ${new Date(pdf.uploadedAt).toLocaleString()})`;
    link.style.color = '#0077cc';
    link.style.textDecoration = 'underline';
    link.style.display = 'block';
    link.style.marginBottom = '6px';

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️ Delete Current Recipe';
    delBtn.style.background = '#cc0000';
    delBtn.style.color = 'white';
    delBtn.style.border = 'none';
    delBtn.style.padding = '4px 8px';
    delBtn.style.cursor = 'pointer';
    delBtn.style.borderRadius = '4px';
    delBtn.addEventListener('click', () => {
      if (confirm('Delete the current recipe PDF?')) {
        deleteCurrentRecipePdf();
        renderCurrentRecipePreview();
        alert('🗑️ Current recipe deleted.');
      }
    });

    currentPreview.appendChild(link);
    currentPreview.appendChild(delBtn);
  }

  // Upload Current Recipe
  currentUploadBtn?.addEventListener('click', () => {
    const file = currentInput.files[0];
    if (!file) return alert('Select a PDF first.');
    if (file.type !== 'application/pdf') return alert('Please select a PDF file.');

    const reader = new FileReader();
    reader.onload = () => {
      saveCurrentRecipePdf(reader.result, file.name);
      renderCurrentRecipePreview();
      currentInput.value = '';
      alert('✅ Current recipe uploaded!');
    };
    reader.readAsDataURL(file);
  });

  // --- Recently Added Foods Section ---
  function renderRecentlyAddedFoodsPreview() {
    recentPreview.innerHTML = '';
    const pdf = readRecentlyAddedFoodsPdf();

    if (!pdf) {
      recentPreview.innerHTML = '<p class="muted">No "Recently Added Foods" PDF uploaded yet.</p>';
      return;
    }

    const link = document.createElement('a');
    link.href = pdf.dataUrl;
    link.download = pdf.name || 'Recently_Added_Foods.pdf';
    link.textContent = `📄 ${pdf.name || 'Recently Added Foods PDF'} (Uploaded ${new Date(pdf.uploadedAt).toLocaleString()})`;
    link.style.color = '#0077cc';
    link.style.textDecoration = 'underline';
    link.style.display = 'block';
    link.style.marginBottom = '6px';

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️ Delete Recently Added Foods';
    delBtn.style.background = '#cc0000';
    delBtn.style.color = 'white';
    delBtn.style.border = 'none';
    delBtn.style.padding = '4px 8px';
    delBtn.style.cursor = 'pointer';
    delBtn.style.borderRadius = '4px';
    delBtn.addEventListener('click', () => {
      if (confirm('Delete the Recently Added Foods PDF?')) {
        deleteRecentlyAddedFoodsPdf();
        renderRecentlyAddedFoodsPreview();
        alert('🗑️ Recently Added Foods PDF deleted.');
      }
    });

    recentPreview.appendChild(link);
    recentPreview.appendChild(delBtn);
  }

  // Upload Recently Added Foods PDF
  recentUploadBtn?.addEventListener('click', () => {
    const file = recentInput.files[0];
    if (!file) return alert('Select a PDF first.');
    if (file.type !== 'application/pdf') return alert('Please select a PDF file.');

    const reader = new FileReader();
    reader.onload = () => {
      saveRecentlyAddedFoodsPdf(reader.result, file.name);
      renderRecentlyAddedFoodsPreview();
      recentInput.value = '';
      alert('✅ Recently Added Foods PDF uploaded!');
    };
    reader.readAsDataURL(file);
  });

  // Logout
  logoutBtn?.addEventListener('click', () => {
    setLoggedIn(false);
    window.location.href = 'loginPage.html';
  });

  // Initialize previews
  renderPdfPreview();
  renderCurrentRecipePreview();
  renderRecentlyAddedFoodsPreview();
}

// --- RECIPES PAGE ---
function renderPdf() {
  const container = qs('#pdfContainer');
  if (!container) return;

  const list = readPdfList();
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p class="muted">No PDFs uploaded yet.</p>';
    return;
  }

  // Reverse so newest uploads appear first
  list.slice().reverse().forEach((pdf, i) => {
    const link = document.createElement('a');
    link.href = pdf.dataUrl;
    link.download = pdf.name || `Old_Recipes_${i + 1}.pdf`;
    link.textContent = `📄 Download ${pdf.name || 'Old Recipes PDF'}`;
    link.style.fontSize = '1.1em';
    link.style.textDecoration = 'none';
    link.style.color = '#ffffff';
    link.style.display = 'block';
    link.style.margin = '12px 0'; 
    link.classList.add('pdf-link');
    link.style.fontFamily = "'Rubik', sans-serif";
    container.appendChild(link);
  });

  // No results message for search filtering
  const noResultsMsg = document.createElement('p');
  noResultsMsg.textContent = 'No PDFs match your search.';
  noResultsMsg.className = 'no-results';
  noResultsMsg.style.display = 'none';
  container.appendChild(noResultsMsg);

  // Update search logic to handle "no results" message
  const searchInput = qs('#searchInput');
  if (searchInput) {
    const pdfLinks = container.querySelectorAll('.pdf-link');
    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase();
      let anyVisible = false;
      pdfLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        const visible = text.includes(filter);
        link.style.display = visible ? 'block' : 'none';
        if (visible) anyVisible = true;
      });
      noResultsMsg.style.display = anyVisible ? 'none' : 'block';
    });
  }
}


// --- CURRENT RECIPE PAGE ---
function renderCurrentRecipe() {
  const container = qs('#currentRecipePdfContainer');
  if (!container) return;

  const pdf = readCurrentRecipePdf();
  container.innerHTML = '';

  if (!pdf) {
    container.innerHTML = '<p class="muted">No current recipe uploaded yet.</p>';
    return;
  }

  const link = document.createElement('a');
  link.href = pdf.dataUrl;
  link.download = pdf.name || 'Current_Recipe.pdf';
  link.textContent = '📄 Download Current Recipe of the Week';
  link.style.fontSize = '1.2em';
  link.style.textDecoration = 'underline';
  link.style.color = '#0077cc';
  container.appendChild(link);
}

// --- RECENTLY ADDED FOODS PAGE ---
function renderRecentlyAddedFoods() {
  const container = qs('#recentlyAddedFoodsPdfContainer');
  if (!container) return;

  const pdf = readRecentlyAddedFoodsPdf();
  container.innerHTML = '';

  if (!pdf) {
    container.innerHTML = '<p class="muted">No "Recently Added Foods" PDF uploaded yet.</p>';
    return;
  }

  const link = document.createElement('a');
  link.href = pdf.dataUrl;
  link.download = pdf.name || 'Recently_Added_Foods.pdf';
  link.textContent = '📄 Download Recently Added Foods PDF';
  link.style.fontSize = '1.2em';
  link.style.textDecoration = 'underline';
  link.style.color = '#0077cc';
  container.appendChild(link);
}

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  if (qs('#loginForm')) initLoginPage();
  if (qs('#pdfInput')) initAdminPage();
  if (qs('#pdfContainer')) renderPdf();
  if (qs('#currentRecipePdfContainer')) renderCurrentRecipe();
  if (qs('#recentlyAddedFoodsPdfContainer')) renderRecentlyAddedFoods();
});


const searchInput = document.getElementById('searchInput');
const pdfLinks = document.querySelectorAll('.pdf-link');

  searchInput.addEventListener('input', () => {
    const filter = searchInput.value.toLowerCase();
    pdfLinks.forEach(link => {
      const text = link.textContent.toLowerCase();
      link.style.display = text.includes(filter) ? 'block' : 'none';
    });
  });
