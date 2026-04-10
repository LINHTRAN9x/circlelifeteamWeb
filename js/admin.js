// ============================================================
//  CircleLifeTeam — admin.js
//  Logic cho trang admin (admin.html)
// ============================================================

const ADMIN_SESSION_KEY = 'clt_admin_token';

let quillEditor;


const FIXED_TAGS = [
  // ── Thể loại gốc (Việt hóa) ──
  "Thế Giới Mở", "Souls-like", "Kinh Dị", "Sinh Tồn",
  "Cốt Truyện Hay", "Giải Đố", "Co-op", "Nhập Vai",
  "Đồ họa Pixel", "Gia Đình", "Anime", "Thể Thao",

  // ── Action / Combat ──
  "Action", "Beat 'em Up", "Fighting", "Hack and Slash",
  "Metroidvania", "Roguelike", "Shoot 'em Up", "Bullet Hell",
  "Tower Defense", "Stealth", "Battle Royale",

  // ── Shooter ──
  "First-Person Shooter", "Third-Person Shooter", "Tactical Shooter",
  "Hero Shooter", "Looter Shooter",

  // ── Role-Playing ──
  "RPG", "JRPG", "MMORPG", "CRPG", "Dungeon Crawler",
  "Tactical RPG", "Deck Builder",

  // ── Strategy ──
  "Real-Time Strategy", "Turn-Based Strategy", "Grand Strategy",
  "4X", "City Builder", "Colony Sim", "Auto Battler", "Wargame",

  // ── Simulation / Management ──
  "Life Sim", "Farming Sim", "Flight Sim", "Driving Sim",
  "Space Sim", "Tycoon", "Sandbox", "God Game",

  // ── Adventure / Narrative ──
  "Adventure", "Point and Click", "Visual Novel",
  "Walking Simulator", "Interactive Fiction",

  // ── Puzzle ──
  "Physics Puzzle", "Logic Puzzle", "Escape Room", "Hidden Object",

  // ── Platformer ──
  "2D Platformer", "3D Platformer", "Precision Platformer", "Run and Gun",

  // ── Horror ──
  "Survival Horror", "Psychological Horror",

  // ── Sports / Racing ──
  "Racing", "Soccer", "Basketball", "Baseball", "Motorsport",
  "Skateboarding", "Fishing",

  // ── Multiplayer / Social ──
  "PvP", "PvE", "Local Co-op", "Party Game",
  "Social Deduction", "Asymmetric",

  // ── Casual / Indie ──
  "Casual", "Indie", "Cozy", "Idle / Clicker", "Endless Runner",

  // ── Music / Rhythm ──
  "Rhythm", "Dance",

  // ── Setting / Theme ──
  "Sci-Fi", "Fantasy", "Cyberpunk", "Post-Apocalyptic",
  "Steampunk", "Historical", "Mythology", "Noir", "Western",

  // ── Other ──
  "Crafting", "Exploration", "Extraction Shooter",
  "Card Game", "Board Game", "Educational", "VR",
];
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
    email = "tranvanlinh99xx@gmail.com";
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
            <div style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="cursor:pointer;color:var(--blue-vivid);" onclick="postToFBConfirm('${g.id}', '${g.title.replace(/'/g, "\\'")}')" title="Click để đăng bài lên Facebook">
                ${g.title}
              </span>
              ${g.isPostedToFB ? '<span class="badge" style="background:#1877F2;color:#fff;padding:2px 6px;font-size:9px;border:none;box-shadow:none"><i class="fa-solid fa-check"></i></span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--text-muted);font-style:italic">
              ${g.titleVi || ''}
              <span class="admin-view-count" data-slug="${g.slug}" style="margin-left:8px; color:var(--blue-vivid); font-weight:800;">
                <i class="fa-regular fa-eye"></i> <span class="num">...</span>
              </span>
            </div>
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
        ${g.isLocked ? '<span class="badge" style="background:var(--accent-red);color:#fff;margin-left:4px" title="Đã bị khóa"><i class="fa-solid fa-lock"></i></span>' : ''}
      </td>
      <td>
        <div class="admin-table-actions">
          ${ 
            // 🚀 LOGIC KHÓA NÚT: Nếu là Editor VÀ Game đang bị khóa -> Làm mờ & vô hiệu hóa nút
            (sessionStorage.getItem('clt_admin_role') === 'editor' && g.isLocked) 
            ? `<button class="btn-action btn-edit" disabled style="opacity:0.4; cursor:not-allowed;" title="Admin đã khóa game này">🔒 Sửa</button>
               <button class="btn-action btn-delete" disabled style="opacity:0.4; cursor:not-allowed;" title="Admin đã khóa game này">🔒 Xóa</button>`
            : `<button class="btn-action btn-edit" onclick="editGame('${g.id}')">✏️ Sửa</button>
               <button class="btn-action btn-delete" onclick="deleteGameConfirm('${g.id}', '${g.title.replace(/'/g, "\\'")}')">🗑️ Xóa</button>`
          }
        </div>
      </td>
    </tr>
  `).join('');
  fetchAdminViewCounts();
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
  // Khởi tạo Quill Editor nếu chưa có
  if (!quillEditor && document.getElementById('quill-editor')) {
    quillEditor = new Quill('#quill-editor', {
      theme: 'snow',
      modules: { toolbar: '#quill-toolbar' },
      placeholder: 'Nội dung giới thiệu vào đây...'
    });
  }
  const modal = document.getElementById('game-modal');
  const openBtn = document.getElementById('add-game-btn');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('game-form');

  openBtn?.addEventListener('click', async () => {
    editingId = null;
    resetGameForm();
    document.getElementById('modal-title').textContent = 'Thêm Game Mới';
    
    // 🚀 LẤY LINK DISCORD TỪ CÀI ĐẶT VÀ KHÓA Ô NHẬP LẠI
    const settings = await API.getSettings();
    const dlInput = document.getElementById('form-downloadLink');
    if (dlInput) {
      dlInput.value = settings.discordLink || '';
      dlInput.readOnly = true; // Khóa không cho gõ
      dlInput.style.backgroundColor = 'var(--bg-dark)'; // Bôi xám nền
      dlInput.style.cursor = 'not-allowed'; // Đổi trỏ chuột thành dấu cấm
      dlInput.style.color = 'var(--text-dim)';
    }

    modal?.classList.add('open');
  });
  closeBtn?.addEventListener('click', () => modal?.classList.remove('open'));
  //modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    await saveGameFromForm();
  });


  const tagContent = document.getElementById('tag-dropdown-content');
  const tagBtn = document.getElementById('tag-dropdown-btn');

  // In danh sách checkbox từ FIXED_TAGS
  if (tagContent) {
    tagContent.innerHTML = FIXED_TAGS.map(tag => `
      <label class="tag-cb-label">
        <input type="checkbox" value="${tag}" name="game_tags"> ${tag}
      </label>
    `).join('');
  }

  // Xử lý bật/tắt dropdown
  tagBtn?.addEventListener('click', () => {
    const isHidden = tagContent.style.display === 'none';
    tagContent.style.display = isHidden ? 'flex' : 'none';
  });

  // Đóng dropdown khi click ra ngoài
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-multi-select')) {
      if(tagContent) tagContent.style.display = 'none';
    }
  });

  // Cập nhật text trên nút khi tick chọn
  document.querySelectorAll('input[name="game_tags"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const selected = Array.from(document.querySelectorAll('input[name="game_tags"]:checked')).map(el => el.value);
      const textEl = document.getElementById('selected-tags-text');
      if (selected.length > 0) {
        // Rút gọn text nếu chọn nhiều quá (VD: Thế Giới Mở, +2 tags)
        textEl.textContent = selected.length > 2 ? `${selected[0]}, +${selected.length - 1} tags` : selected.join(', ');
      } else {
        textEl.textContent = 'Chọn tags...';
      }
    });
  });
}

function resetGameForm() {
  const f = document.getElementById('game-form');
  if (f) f.reset();
  document.getElementById('form-id').value = '';

  // 🚀 BỔ SUNG: Dọn sạch nội dung trong khung soạn thảo Quill Editor
  if (typeof quillEditor !== 'undefined') {
    quillEditor.root.innerHTML = '';
  }
}

async function editGame(id) {
  const games = await API.getGames();
  const game = games.find(g => g.id === id);
  if (!game) return;

  if (game.isLocked && sessionStorage.getItem('clt_admin_role') === 'editor') {
    showToast('❌ Game này đã được Admin khóa, bạn không thể sửa!', 'error');
    return;
  }

  editingId = id;
  document.getElementById('modal-title').textContent = 'Chỉnh Sửa Game';
  await fillGameForm(game); // Thêm chữ await vào dòng này
  document.getElementById('game-modal')?.classList.add('open');
}

async function fillGameForm(game) {
  const fields = ['id', 'slug', 'title', 'titleVi', 'description',
    'coverImage','bannerImage', 'youtubeId', 'genre', 'platform', 'releaseDate',
    'version', 'translator', 'status', 'rating', 'price'];
  fields.forEach(f => {
    const el = document.getElementById(`form-${f}`);
    if (el) el.value = game[f] || '';
  });

  // 🚀 LẤY LINK DISCORD TỪ CÀI ĐẶT & KHÓA LẠI KHI SỬA GAME
  const settings = await API.getSettings();
  const dlInput = document.getElementById('form-downloadLink');
  if (dlInput) {
    dlInput.value = settings.discordLink || ''; 
    dlInput.readOnly = true;
    dlInput.style.backgroundColor = 'var(--bg-dark)';
    dlInput.style.cursor = 'not-allowed';
    dlInput.style.color = 'var(--text-dim)';
  }

  if (game.descriptionVi) {
    quillEditor.root.innerHTML = game.descriptionVi;
  } else {
    quillEditor.root.innerHTML = '';
  }
  document.getElementById('form-isNew').checked = !!game.isNew;
  document.getElementById('form-isFeatured').checked = !!game.isFeatured;

  document.getElementById('form-isLocked').checked = !!game.isLocked;
  const role = sessionStorage.getItem('clt_admin_role');
  const lockWrapper = document.getElementById('wrapper-isLocked');
  if (lockWrapper) {
    lockWrapper.style.display = role === 'superadmin' ? 'flex' : 'none';
  }
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

  // (Bên dưới đoạn load platform cũ)
  document.querySelectorAll('input[name="game_tags"]').forEach(cb => cb.checked = false);
  if (game.tags && Array.isArray(game.tags)) {
    game.tags.forEach(t => {
      const cb = document.querySelector(`input[name="game_tags"][value="${t}"]`);
      if(cb) cb.checked = true;
    });
  }
  // Kích hoạt thủ công 1 event để cập nhật lại chữ trên nút Dropdown
  document.querySelector('input[name="game_tags"]')?.dispatchEvent(new Event('change'));

  // Đổ dữ liệu trạng thái FB vào form ẩn
  const elFb = document.getElementById('form-isPostedToFB');
  if (elFb) elFb.value = game.isPostedToFB ? 'true' : 'false';
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
    descriptionVi: quillEditor.root.innerHTML === '<p><br></p>' ? '' : quillEditor.root.innerHTML,
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
    price: document.getElementById('form-price')?.value.trim() || '',
    isNew: document.getElementById('form-isNew').checked,
    isFeatured: document.getElementById('form-isFeatured').checked,
    isLocked: document.getElementById('form-isLocked').checked,
    tags: Array.from(document.querySelectorAll('input[name="game_tags"]:checked')).map(cb => cb.value),
    updatedAt: Date.now(),
    isPostedToFB: document.getElementById('form-isPostedToFB')?.value === 'true',
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

    // 🚀 BƯỚC 4: BẮN THÔNG BÁO DISCORD NẾU LÀ GAME MỚI
    // Biến editingId bị null nghĩa là bác đang Thêm Mới (chứ không phải Sửa)
    if (!editingId) {
      sendDiscordNotification(game);
    }

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
// ── Tự động Format Giá Tiền (VNĐ) ──
document.getElementById('form-price')?.addEventListener('input', function (e) {
  // Bỏ hết các ký tự không phải là số (kể cả chữ 'đ' hay dấu '.')
  let rawValue = this.value.replace(/\D/g, '');
  
  if (rawValue) {
    // Tự động chấm phần ngàn và thêm chữ 'đ' ở đuôi
    this.value = new Intl.NumberFormat('vi-VN').format(rawValue) + 'đ';
  } else {
    this.value = ''; // Xóa trắng nếu không có số nào
  }
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


// Hàm tự động tạo nội dung Sitemap từ dữ liệu thực tế (ĐÃ UPDATE CHUẨN SEO + HÌNH ẢNH)
// Hàm tự động tạo nội dung Sitemap từ dữ liệu thực tế (BẢN CẬP NHẬT SẠCH DỮ LIỆU)
async function generateSitemap() {
  const games = await API.getGames();
  const baseUrl = CONFIG.SITE_URL.replace(/\/$/, ''); 
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  
  // 1. Khai báo Namespace cho chuẩn SEO Hình ảnh và Video
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 2. Trang chủ (Độ ưu tiên cao nhất)
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>1.0</priority>\n    <changefreq>daily</changefreq>\n  </url>\n`;

  // 3. Link chuyên mục SEO (Nền tảng & Thể loại)
  const platforms = [...new Set(games.flatMap(g => (g.platform || 'PS5').split(',').map(p => p.trim())))];
  platforms.forEach(p => {
    xml += `  <url>\n    <loc>${baseUrl}/category.html?platform=${encodeURIComponent(p)}</loc>\n    <priority>0.9</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  });

  // 4. Link trang chi tiết Game
  games.forEach(game => {
    if (!game.slug) return;
    
    // 🔥 CẢI TIẾN: Lấy updatedAt để làm lastmod. 
    // Nếu bác vừa sửa điểm đánh giá hay link tải, Google sẽ biết trang này vừa "mới" lại để vào crawl ngay.
    let lastMod = today;
    if (game.updatedAt) {
      lastMod = new Date(game.updatedAt).toISOString().split('T')[0];
    } else if (game.releaseDate) {
      lastMod = new Date(game.releaseDate).toISOString().split('T')[0];
    }
    
    // 🔥 CẢI TIẾN: Game mới hoặc Game 5 sao thì ưu tiên cao hơn (0.8), game cũ hơn thì 0.6
    let priority = game.isNew || (game.rating >= 4) ? "0.8" : "0.6";

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/game.html?id=${game.slug}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <priority>${priority}</priority>\n`;

    // CHÈN DỮ LIỆU ẢNH (Giúp Google Image Search index ảnh bìa đẹp hơn)
    if (game.coverImage) {
      const safeTitle = `${game.title} Việt Hóa`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeImgUrl = game.coverImage.replace(/&/g, '&amp;');

      xml += `    <image:image>\n`;
      xml += `      <image:loc>${safeImgUrl}</image:loc>\n`;
      xml += `      <image:title>${safeTitle}</image:title>\n`;
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  const blob = new Blob([xml], { type: 'text/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'sitemap.xml';
  link.click();
  showToast('🚀 Đã xuất Sitemap sạch (Dựa trên updatedAt) thành công!', 'success');
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


// ============================================================
// ── TÍNH NĂNG: ĐĂNG BÀI LÊN FACEBOOK BẰNG TAY ──
// ============================================================
async function postToFBConfirm(id, title) {
  // 1. Chặn nếu tài khoản chỉ là Editor
  if (sessionStorage.getItem('clt_admin_role') === 'editor') {
    showToast('Bạn không có quyền đăng bài!', 'error');
    return;
  }

  // 2. Tìm thông tin game
  const games = await API.getGames();
  const game = games.find(g => g.id === id);
  if (!game) return;

  // 3. Hỏi xác nhận kép (Nếu đã đăng rồi thì cảnh báo)
  if (game.isPostedToFB) {
    if (!confirm(`⚠️ Game "${title}" ĐÃ ĐƯỢC ĐĂNG lên Facebook trước đó.\nBạn có chắc chắn muốn đăng trùng lại một lần nữa không?`)) return;
  } else {
    if (!confirm(`Bạn có chắc muốn bắn game "${title}" lên Fanpage Facebook ngay bây giờ?`)) return;
  }

  try {
    // ⚠️ QUAN TRỌNG: BÁC NHỚ DÁN LẠI CÁI LINK WEBHOOK CỦA MAKE.COM VÀO ĐÂY NHÉ
    const webhookUrl = 'https://hook.eu1.make.com/gfbb8wkq2hiogglanea9cghknnnt2el4';
    
    showToast('🚀 Đang đẩy bài lên Facebook...', 'info');
    
    // Bắn sang Make.com
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game)
    });

    // 4. Lưu dấu ấn "Đã đăng" vào Database
    game.isPostedToFB = true;
    await API.saveGame(game);
    
    localStorage.removeItem('clt_cache_data');
    showToast(`✅ Đã đăng "${title}" lên Facebook thành công!`, 'success');
    
    // Load lại bảng để cục Tem màu xanh hiện lên
    await loadGamesTable(); 
    
  } catch(e) { 
    console.error('Lỗi Webhook:', e); 
    showToast('❌ Lỗi kết nối đến Make.com', 'error');
  }
}
window.postToFBConfirm = postToFBConfirm; // Kích hoạt hàm ra toàn cục



// ============================================================
// TẢI NGẦM SỐ LƯỢT XEM TỪNG GAME CHO BẢNG ADMIN (Đã fix CORS + Chống kẹt mạng)
// ============================================================
async function fetchAdminViewCounts() {
  const badges = document.querySelectorAll('.admin-view-count');
  
  // ⚠️ QUAN TRỌNG: Đổi sang vòng lặp for...of để tải lần lượt từng game một.
  // Tránh việc "nã" 50 request cùng lúc làm cháy máy chủ Proxy.
  for (const badge of badges) {
    const slug = badge.dataset.slug;
    const targetUrl = `https://api.counterapi.dev/v1/clt_game_views/${slug}`;
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`;

    try {
      const res = await fetch(proxyUrl);
      const data = await res.json();
      badge.querySelector('.num').textContent = (data.count || 0).toLocaleString('vi-VN');
    } catch (e) {
      badge.querySelector('.num').textContent = 'Lỗi';
    }
    
    // Nghỉ ngơi 300ms (0.3 giây) rồi mới tải số view của game tiếp theo
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}



// ============================================================
// HỆ THỐNG THÔNG BÁO DISCORD TỰ ĐỘNG
// ============================================================
async function sendDiscordNotification(game) {
  const webhookUrl = typeof CONFIG !== 'undefined' ? CONFIG.DISCORD_WEBHOOK_URL : null;
  if (!webhookUrl || webhookUrl.trim() === "") return; // Bỏ qua nếu chưa cài Webhook

  // 🚀 BƯỚC DỌN RÁC HTML CHO DISCORD
  let rawDesc = game.descriptionVi || game.description || "Đang cập nhật mô tả...";
  // Lệnh Regex này sẽ gọt sạch sành sanh các thẻ <p>, <br>, <strong>... để lấy chữ thuần
  let cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').trim(); 
  
  // Nếu mô tả dài quá thì cắt bớt cho đẹp khung Discord (khoảng 200 ký tự)
  if (cleanDesc.length > 300) {
    cleanDesc = cleanDesc.substring(0, 300) + "...";
  }

  // Thiết kế nội dung tin nhắn (Embed)
  const payload = {
    content: "🎉 **CÓ VIỆT HÓA MỚI NÈ ANH EM ƠI!**",
    embeds: [{
      title: `🎮 ${game.title || game.titleVi} Việt Hóa`,
      url: `${typeof CONFIG !== 'undefined' ? CONFIG.SITE_URL : 'https://circlelifeteam.top'}/game.html?id=${game.slug}`,
      description: cleanDesc, // 🚀 Bơm mô tả đã được làm sạch vào đây
      color: 16761600, // Mã màu Vàng đặc trưng của web bác (#FFC312)
      image: { 
        url: game.bannerImage || game.coverImage || "https://i.ibb.co/j90KpF3x/gdyt4q4jhynd1-1.png" 
      },
      fields: [
        { name: "💻 Nền Tảng", value: game.platform || "PC", inline: true },
        // Tiện tay fix luôn hiển thị thể loại cho nó đẹp, không bị lỗi mảng
        { name: "🏷️ Thể Loại", value: (game.tags && game.tags.length > 0) ? game.tags.join(', ') : "Chưa rõ", inline: true },
        { name: "🔥 Tiến Độ", value: game.status || "Hoàn thành 100%", inline: true }
      ],
      footer: { text: "CircleLifeTeam - Đam mê Việt hóa" },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("Đã bắn thông báo lên Discord!");
  } catch (error) {
    console.error("Lỗi gửi Discord Webhook:", error);
  }
}

