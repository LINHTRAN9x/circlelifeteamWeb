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
async function login(pass) {
  const hash = md5(pass);
  
  let email = null;
  let role = null;

  if (hash === CONFIG.ADMIN_PASS_HASH) {
    email = "tranvanlinh99xx@gmail.com"; // tài khoản bạn tạo trong Firebase Auth
    role = 'superadmin';
  } else if (hash === CONFIG.EDITOR_PASS_HASH) {
    email = "phuocle@gmail.com";
    role = 'editor';
  } else {
    return false;
  }

  try {
    await firebase.auth().signInWithEmailAndPassword(email, pass);
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    sessionStorage.setItem('clt_admin_role', role);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
function logout() {
  firebase.auth().signOut();
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem('clt_admin_role'); // ← thêm
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
document.getElementById('login-form')?.addEventListener('submit', async e => {  // thêm async
  e.preventDefault();
  const pass = document.getElementById('admin-pass').value;
  const err = document.getElementById('login-error');
  if (await login(pass)) {    // ✅ thêm await
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
  initAdminSearch();

  if (sessionStorage.getItem('clt_admin_role') === 'editor') {
    document.querySelector('[data-target="settings"]')?.remove();
  }
}

function initAdminSearch() {
  const searchInput = document.getElementById('admin-search-input');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    // Đợi 300ms sau khi người dùng ngừng gõ thì mới gọi API lọc bảng
    // giúp web không bị giật lag khi gõ nhanh
    debounceTimer = setTimeout(() => {
      loadGamesTable(e.target.value);
    }, 300);
  });
}

// ── Stats ──
async function loadDashboardStats() {
  const games = await API.getGames();
  const el = id => document.getElementById(id);
  if (el('stat-total')) el('stat-total').textContent = games.length;
  if (el('stat-done')) el('stat-done').textContent = games.filter(g => g.status?.includes('100%')).length;
  if (el('stat-new')) el('stat-new').textContent = games.filter(g => g.isNew).length;
  if (el('stat-wip')) el('stat-wip').textContent = games.filter(g => !g.status?.includes('100%')).length;

  // --- LẤY SỐ LƯỢT KHÁCH TỪ COUNTER API ---
  try {
    const res = await fetch('https://api.codetabs.com/v1/proxy?quest=https://api.counterapi.dev/v1/circlelifeteam_top/unique_visitors');
    const data = await res.json();
    if (el('stat-views')) el('stat-views').textContent = data.count || 0;
  } catch (err) {
    if (el('stat-views')) el('stat-views').textContent = 'Lỗi';
    console.error('Lỗi lấy số lượt khách:', err);
  }
}

// ── Games Table ──
// ── Games Table ──
// Thêm tham số searchQuery vào hàm
async function loadGamesTable(searchQuery = '') {
  const tbody = document.getElementById('games-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-dim)">Đang tải...</td></tr>';

  let games = await API.getGames();

  // LỌC DỮ LIỆU NẾU CÓ TỪ KHÓA TÌM KIẾM
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    games = games.filter(g => 
      g.title.toLowerCase().includes(q) || 
      (g.titleVi || '').toLowerCase().includes(q) || 
      (g.genre || '').toLowerCase().includes(q)
    );
  }

  if (!games.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-dim)">Không tìm thấy game nào phù hợp</td></tr>';
    return;
  }

  // Đoạn tbody.innerHTML = games.map(g => ... bên dưới giữ nguyên không đổi
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
    'coverImage','bannerImage', 'youtubeId', 'downloadLink', 'genre', 'platform', 'releaseDate',
    'version', 'translator', 'status', 'rating'];
  fields.forEach(f => {
    const el = document.getElementById(`form-${f}`);
    if (el) el.value = game[f] || '';
  });
  document.getElementById('form-isNew').checked = !!game.isNew;
  document.getElementById('form-isFeatured').checked = !!game.isFeatured;
  document.getElementById('form-images').value = (game.images || []).join('\n');
  // Bỏ tick tất cả trước khi hiển thị
  document.querySelectorAll('input[name="platform"]').forEach(cb => cb.checked = false);
  // Tick lại các nền tảng của game này
  if (game.platform) {
    game.platform.split(',').forEach(p => {
      const cb = document.querySelector(`input[name="platform"][value="${p.trim()}"]`);
      if (cb) cb.checked = true;
    });
  }
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
    bannerImage: document.getElementById('form-bannerImage')?.value.trim(),
    images: document.getElementById('form-images').value.trim().split('\n').map(s => s.trim()).filter(Boolean),
    youtubeId: document.getElementById('form-youtubeId').value.trim(),
    downloadLink: document.getElementById('form-downloadLink').value.trim(),
    genre: document.getElementById('form-genre').value.trim(),
    platform: Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(cb => cb.value).join(', ') || 'PS5',
    releaseDate: document.getElementById('form-releaseDate').value,
    version: document.getElementById('form-version').value.trim(),
    translator: document.getElementById('form-translator').value.trim() || 'CircleLife Team',
    status: document.getElementById('form-status').value.trim(),
    rating: parseInt(document.getElementById('form-rating').value) || 0,
    isNew: document.getElementById('form-isNew').checked,
    isFeatured: document.getElementById('form-isFeatured').checked,
    updatedAt: Date.now(),
  };

  if (!game.title) {
    showToast('Vui lòng nhập tên game', 'error');
    if (submitBtn) { submitBtn.textContent = 'Lưu Game'; submitBtn.disabled = false; }
    return;
  }

  const ok = await API.saveGame(game);
  if (ok) {
    localStorage.removeItem('clt_cache_data');
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

  if (sessionStorage.getItem('clt_admin_role') === 'editor') { // ← thêm
    showToast('Bạn không có quyền xóa game', 'error');          // ← thêm
    return;                                                      // ← thêm
  }  
  if (!confirm(`Bạn có chắc muốn xóa game "${title}"?`)) return;
  const ok = await API.deleteGame(id);
  if (ok) {
    localStorage.removeItem('clt_cache_data');
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
  const fields = ['heroBgImage', 'heroTitle', 'heroSubtitle', 'discordLink', 'facebookPageLink', 'facebookGroupLink', 'youtubeLink'];
  
  fields.forEach(f => {
    const el = document.getElementById(`setting-${f}`);
    if (el) el.value = settings[f] || '';
  });

  // Tìm form và thêm sự kiện submit
  const form = document.getElementById('settings-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault(); // CHẶN LOAD LẠI TRANG - Cực kỳ quan trọng
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '⌛ Đang lưu...';
      submitBtn.disabled = true;

      const newSettings = {};
      fields.forEach(f => {
        newSettings[f] = document.getElementById(`setting-${f}`)?.value.trim() || '';
      });

      const ok = await API.saveSettings(newSettings);
      
      if (ok) {
        // Xóa cache localStorage để trang chủ nhận diện thay đổi ngay lập tức
        localStorage.removeItem('clt_cache_data'); 
        showToast('Đã lưu cài đặt thành công!', 'success');
      } else {
        showToast('Lưu thất bại! Hãy kiểm tra API Key trong config.js', 'error');
      }
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    };
  }
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


// Hàm tự động tạo nội dung Sitemap từ dữ liệu thực tế (ĐÃ UPDATE CHUẨN SEO)
async function generateSitemap() {
  const games = await API.getGames();
  // Loại bỏ dấu gạch chéo ở cuối baseUrl (nếu có) để tránh bị lỗi 2 dấu gạch //
  const baseUrl = CONFIG.SITE_URL.replace(/\/$/, ''); 
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Thêm trang chủ (Đã bỏ đuôi index.html)
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>1.0</priority>\n  </url>\n`;

  // 2. Thêm danh sách game (Đã dùng link /share/ siêu ngắn)
  games.forEach(game => {
    // Ép kiểu ngày phát hành về đúng chuẩn YYYY-MM-DD của Google
    let lastMod = today;
    if (game.releaseDate) {
      try {
        lastMod = new Date(game.releaseDate).toISOString().split('T')[0];
      } catch (e) {
        lastMod = today; // Nếu ngày bị lỗi thì lấy ngày hôm nay
      }
    }
    
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/game.html?id=${game.slug}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  // Hiển thị ra console để dễ debug
  console.log("%c--- NỘI DUNG SITEMAP.XML CHUẨN SEO ---", "color: #009AC7; font-weight: bold;");
  console.log(xml);
  
  // Tự động tải file về máy
  const blob = new Blob([xml], { type: 'text/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'sitemap.xml';
  link.click();
  
  showToast('Đã tạo và tải xuống sitemap.xml chuẩn SEO mới!', 'success');
}


// ============================================================
// ── TRẠM KÉO THẢ & UPLOAD ẢNH IMGBB ──
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initImageDropzones();
});

function initImageDropzones() {
  const wrappers = document.querySelectorAll('.dropzone-wrapper');
  
  wrappers.forEach(wrapper => {
    const dropzone = wrapper.querySelector('.dropzone-area');
    const fileInput = wrapper.querySelector('.dropzone-file');
    const targetInput = wrapper.querySelector('.target-input'); // Là ô input hoặc textarea
    
    if (!dropzone || !fileInput || !targetInput) return;

    // 1. Kích hoạt nút bấm chọn file
    dropzone.addEventListener('click', () => fileInput.click());

    // 2. Xử lý sự kiện kéo thả (Drag & Drop)
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesUpload(e.dataTransfer.files, dropzone, targetInput);
      }
    });

    // 3. Xử lý khi chọn file bằng cửa sổ duyệt
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesUpload(e.target.files, dropzone, targetInput);
      }
      fileInput.value = ''; // Reset lại ô input để lần sau chọn trùng file vẫn nhận
    });

    // 4. MỞ KHÓA TÍNH NĂNG PASTE (CTRL+V) TỪ CLIPBOARD
    targetInput.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let files = [];
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file') {
          files.push(item.getAsFile());
        }
      }
      if (files.length > 0) {
        e.preventDefault(); // Chặn paste text chữ, bắt đầu paste ảnh
        handleFilesUpload(files, dropzone, targetInput);
      }
    });
  });
}

// Gọi API ImgBB
async function handleFilesUpload(files, dropzone, targetInput) {
  // Lấy API Key từ config (Hoặc hardcode thẳng vào đây nếu bạn chưa làm file config)
  const apiKey = typeof CONFIG !== 'undefined' ? CONFIG.IMGBB_API_KEY : ''; 
  if (!apiKey) {
    showToast('Thiếu ImgBB API Key trong config.js', 'error');
    return;
  }

  const originalText = dropzone.innerHTML;
  dropzone.classList.add('is-uploading');
  dropzone.innerHTML = '⏳ Đang tải lên...';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue; // Bỏ qua nếu không phải ảnh

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      
      if (result.success) {
        const imgUrl = result.data.url;
        // Điền vào form
        if (targetInput.tagName.toLowerCase() === 'textarea') {
          // Nếu là textarea (Ảnh màn hình nhiều ảnh), nối URL vào dòng mới
          targetInput.value += (targetInput.value ? '\n' : '') + imgUrl;
        } else {
          // Nếu là input URL (Ảnh bìa/Banner), ghi đè URL
          targetInput.value = imgUrl;
        }
        showToast(`Đã tải lên: ${file.name}`, 'success');
      } else {
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error(err);
      showToast(`Lỗi tải lên ${file.name}: ${err.message}`, 'error');
    }
  }

  dropzone.classList.remove('is-uploading');
  dropzone.innerHTML = originalText;
}