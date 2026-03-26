// ============================================================
//  CircleLifeTeam — admin.js
//  Logic cho trang admin (admin.html)
// ============================================================

const ADMIN_SESSION_KEY = 'clt_admin_token';

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showDashboard();
    initDashboard();
  } else {
    showLogin();
  }
});

// ── Auth ──
function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
}
function login(pass) {
  const hash = md5(pass);
  if (hash === CONFIG.ADMIN_PASS_HASH) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    return true;
  }
  return false;
}
function logout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  API.clearCache();
  showLogin();
}

function showLogin() {
  document.getElementById('login-section').style.display = 'flex';
  document.getElementById('dashboard-section').style.display = 'none';
  document.querySelector('.navbar').style.display = 'none';
}
function showDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'grid';
  document.querySelector('.navbar').style.display = 'flex';
}

// Login form
document.getElementById('login-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const pass = document.getElementById('admin-pass').value;
  const err = document.getElementById('login-error');
  if (login(pass)) {
    showDashboard();
    initDashboard();
  } else {
    if (err) { err.textContent = '❌ Mật khẩu không đúng'; err.style.display = 'flex'; }
    document.getElementById('admin-pass').value = '';
  }
});

document.getElementById('logout-btn')?.addEventListener('click', logout);

// ── Dashboard ──
async function initDashboard() {
  await loadDashboardStats();
  await loadGamesTable();
  initAdminNav();
  initGameModal();
  initSettingsForm();
}

// ── Stats ──
async function loadDashboardStats() {
  const games = await API.getGames();
  const el = id => document.getElementById(id);
  if (el('stat-total')) el('stat-total').textContent = games.length;
  if (el('stat-done')) el('stat-done').textContent = games.filter(g => g.status?.includes('100%')).length;
  if (el('stat-new')) el('stat-new').textContent = games.filter(g => g.isNew).length;
  if (el('stat-wip')) el('stat-wip').textContent = games.filter(g => !g.status?.includes('100%')).length;
}

// ── Games Table ──
async function loadGamesTable() {
  const tbody = document.getElementById('games-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-dim)">Đang tải...</td></tr>';

  const games = await API.getGames();
  if (!games.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-dim)">Chưa có game nào</td></tr>';
    return;
  }

  tbody.innerHTML = games.map(g => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          ${g.coverImage
            ? `<img class="admin-table-thumb" src="${g.coverImage}" alt="${g.title}" onerror="this.style.display='none'">`
            : '<div class="admin-table-thumb" style="display:flex;align-items:center;justify-content:center;background:var(--bg-dark)">🎮</div>'}
          <div>
            <div style="font-weight:700;font-size:13px">${g.title}</div>
            <div style="font-size:11px;color:var(--text-muted);font-style:italic">${g.titleVi || ''}</div>
          </div>
        </div>
      </td>
      <td>${g.genre || '—'}</td>
      <td>
        <span class="badge ${g.status?.includes('100%') ? 'badge-done' : 'badge-wip'}">
          ${g.status || '—'}
        </span>
      </td>
      <td>${g.version || '—'}</td>
      <td>
        ${g.isNew ? '<span class="badge badge-new">Mới</span>' : ''}
        ${g.isFeatured ? '<span class="badge badge-platform" style="margin-left:4px">Nổi bật</span>' : ''}
      </td>
      <td>
        <div class="admin-table-actions">
          <button class="btn-action btn-edit" onclick="editGame('${g.id}')">✏️ Sửa</button>
          <button class="btn-action btn-delete" onclick="deleteGameConfirm('${g.id}', '${g.title.replace(/'/g, "\\'")}')">🗑️ Xóa</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Admin Nav ──
function initAdminNav() {
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));
      document.getElementById(`page-${target}`)?.classList.remove('hidden');
    });
  });
}

// ── Game Modal ──
let editingId = null;

function initGameModal() {
  const modal = document.getElementById('game-modal');
  const openBtn = document.getElementById('add-game-btn');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('game-form');

  openBtn?.addEventListener('click', () => {
    editingId = null;
    resetGameForm();
    document.getElementById('modal-title').textContent = 'Thêm Game Mới';
    modal?.classList.add('open');
  });
  closeBtn?.addEventListener('click', () => modal?.classList.remove('open'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    await saveGameFromForm();
  });
}

function resetGameForm() {
  const f = document.getElementById('game-form');
  if (f) f.reset();
  document.getElementById('form-id').value = '';
}

async function editGame(id) {
  const games = await API.getGames();
  const game = games.find(g => g.id === id);
  if (!game) return;

  editingId = id;
  document.getElementById('modal-title').textContent = 'Chỉnh Sửa Game';
  fillGameForm(game);
  document.getElementById('game-modal')?.classList.add('open');
}

function fillGameForm(game) {
  const fields = ['id', 'slug', 'title', 'titleVi', 'description', 'descriptionVi',
    'coverImage', 'youtubeId', 'downloadLink', 'genre', 'platform', 'releaseDate',
    'version', 'translator', 'status', 'rating'];
  fields.forEach(f => {
    const el = document.getElementById(`form-${f}`);
    if (el) el.value = game[f] || '';
  });
  document.getElementById('form-isNew').checked = !!game.isNew;
  document.getElementById('form-isFeatured').checked = !!game.isFeatured;
  document.getElementById('form-images').value = (game.images || []).join('\n');
}

async function saveGameFromForm() {
  const submitBtn = document.getElementById('form-submit');
  if (submitBtn) { submitBtn.textContent = 'Đang lưu...'; submitBtn.disabled = true; }

  const game = {
    id: document.getElementById('form-id').value.trim() || generateId(),
    slug: document.getElementById('form-slug').value.trim() || slugify(document.getElementById('form-title').value),
    title: document.getElementById('form-title').value.trim(),
    titleVi: document.getElementById('form-titleVi').value.trim(),
    description: document.getElementById('form-description').value.trim(),
    descriptionVi: document.getElementById('form-descriptionVi').value.trim(),
    coverImage: document.getElementById('form-coverImage').value.trim(),
    images: document.getElementById('form-images').value.trim().split('\n').map(s => s.trim()).filter(Boolean),
    youtubeId: document.getElementById('form-youtubeId').value.trim(),
    downloadLink: document.getElementById('form-downloadLink').value.trim(),
    genre: document.getElementById('form-genre').value.trim(),
    platform: document.getElementById('form-platform').value || 'PS5',
    releaseDate: document.getElementById('form-releaseDate').value,
    version: document.getElementById('form-version').value.trim(),
    translator: document.getElementById('form-translator').value.trim() || 'CircleLife Team',
    status: document.getElementById('form-status').value.trim(),
    rating: parseInt(document.getElementById('form-rating').value) || 0,
    isNew: document.getElementById('form-isNew').checked,
    isFeatured: document.getElementById('form-isFeatured').checked,
  };

  if (!game.title) {
    showToast('Vui lòng nhập tên game', 'error');
    if (submitBtn) { submitBtn.textContent = 'Lưu Game'; submitBtn.disabled = false; }
    return;
  }

  const ok = await API.saveGame(game);
  if (ok) {
    showToast(`Đã ${editingId ? 'cập nhật' : 'thêm'} game: ${game.title}`, 'success');
    document.getElementById('game-modal')?.classList.remove('open');
    await loadGamesTable();
    await loadDashboardStats();
  } else {
    showToast('Lưu thất bại. Kiểm tra lại JSONBin config.', 'error');
  }
  if (submitBtn) { submitBtn.textContent = 'Lưu Game'; submitBtn.disabled = false; }
}

async function deleteGameConfirm(id, title) {
  if (!confirm(`Bạn có chắc muốn xóa game "${title}"?`)) return;
  const ok = await API.deleteGame(id);
  if (ok) {
    showToast(`Đã xóa: ${title}`, 'success');
    await loadGamesTable();
    await loadDashboardStats();
  } else {
    showToast('Xóa thất bại', 'error');
  }
}

// ── Settings Form ──
async function initSettingsForm() {
  const settings = await API.getSettings();
  const fields = ['heroTitle', 'heroSubtitle', 'discordLink', 'facebookLink', 'youtubeLink'];
  fields.forEach(f => {
    const el = document.getElementById(`setting-${f}`);
    if (el) el.value = settings[f] || '';
  });

  document.getElementById('settings-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const newSettings = {};
    fields.forEach(f => {
      newSettings[f] = document.getElementById(`setting-${f}`)?.value.trim() || '';
    });
    const ok = await API.saveSettings(newSettings);
    showToast(ok ? 'Đã lưu cài đặt!' : 'Lưu thất bại', ok ? 'success' : 'error');
  });
}

// ── Helpers ──
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function slugify(text) {
  return text.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Auto-slug ──
document.getElementById('form-title')?.addEventListener('input', function () {
  const slugEl = document.getElementById('form-slug');
  if (slugEl && (!slugEl.value || slugEl.dataset.auto !== 'false')) {
    slugEl.value = slugify(this.value);
    slugEl.dataset.auto = 'true';
  }
  const idEl = document.getElementById('form-id');
  if (idEl && !editingId && (!idEl.value || idEl.dataset.auto !== 'false')) {
    idEl.value = slugify(this.value);
    idEl.dataset.auto = 'true';
  }
});
document.getElementById('form-slug')?.addEventListener('input', function () {
  this.dataset.auto = 'false';
});

// ── Toast ──
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Make functions global
window.editGame = editGame;
window.deleteGameConfirm = deleteGameConfirm;