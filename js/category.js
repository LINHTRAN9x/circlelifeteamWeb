// ============================================================
//  CircleLifeTeam — category.js
//  Logic cho trang Chuyên Mục (category.html)
// ============================================================

// 1. Khởi tạo Lenis (Cuộn mượt)
const lenis = new Lenis({ duration: 1.2, smooth: true });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

document.addEventListener('DOMContentLoaded', async () => {
  initUI(); // Khởi tạo Menu, Darkmode, Search
  
  const params = new URLSearchParams(window.location.search);
  const platform = params.get('platform');
  const genre = params.get('genre');
  const tag = params.get('tag'); // Đã hứng tag ở đây

  // Chạy hàm load với đủ 3 tham số
  await loadCategoryData(platform, genre, tag); 
});

async function loadCategoryData(platform, genre, tag) { 
  try {
    const allGames = await API.getGames();
    let filteredGames = allGames;
    let pageTitle = "Tất cả Game Việt Hóa";
    let pageDesc = "Tổng hợp toàn bộ danh sách game việt hóa chất lượng cao từ CircleLifeTeam.";
    let breadcrumbText = "Tất cả game";

    // Lọc dữ liệu & Set Title
    if (platform) {
      filteredGames = allGames.filter(g => (g.platform || '').includes(platform));
      pageTitle = `Game ${platform} Việt Hóa`;
      pageDesc = `Danh sách các tựa game trên hệ máy ${platform} đã được việt hóa hoàn chỉnh hoặc đang trong quá trình dịch thuật bởi CircleLifeTeam.`;
      breadcrumbText = platform;
      document.getElementById('cat-eyebrow').innerHTML = `<i class="fa-brands fa-playstation"></i> Nền Tảng`;
      
    } else if (genre) {
      filteredGames = allGames.filter(g => g.genre === genre);
      pageTitle = `Game ${genre} Việt Hóa`;
      pageDesc = `Tuyển tập các tựa game thuộc thể loại ${genre} cốt truyện cực hay, được việt hóa 100% chuẩn xác.`;
      breadcrumbText = genre;
      document.getElementById('cat-eyebrow').innerHTML = `<i class="fa-solid fa-tags"></i> Thể Loại`;
      
    } else if (tag) { 
      // Xử lý Lọc theo Tag
      filteredGames = allGames.filter(g => g.tags && Array.isArray(g.tags) && g.tags.includes(tag));
      pageTitle = `Game có từ khóa: ${tag}`;
      pageDesc = `Tuyển tập các tựa game mang yếu tố ${tag} siêu hay, việt hóa chất lượng cao bởi CircleLifeTeam.`;
      breadcrumbText = `#${tag}`;
      document.getElementById('cat-eyebrow').innerHTML = `<i class="fa-solid fa-hashtag"></i> Từ Khóa`;
      
    } else {
      document.getElementById('cat-eyebrow').style.display = 'none';
    }

    // Cập nhật DOM
    document.getElementById('cat-title').textContent = pageTitle;
    document.getElementById('cat-desc').textContent = pageDesc;
    document.getElementById('bc-category').textContent = breadcrumbText;

    // Cập nhật thẻ SEO (Cực kỳ quan trọng)
    document.title = `${pageTitle} – Tải Patch Tiếng Việt | CircleLifeTeam`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if(metaDesc) metaDesc.content = pageDesc;

    // Render lưới Game
    const grid = document.getElementById('category-games-grid');
    if (filteredGames.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1; padding: 60px;">
          <div class="empty-state-icon" style="font-size: 40px; margin-bottom: 16px;">😕</div>
          <div class="empty-state-text" style="font-family: var(--font-display); font-size: 20px; font-weight: 800;">Chưa có game nào thuộc chuyên mục này</div>
          <div class="empty-state-sub" style="color: var(--text-dim);">Team đang cố gắng cập nhật thêm. Bạn quay lại sau nhé!</div>
        </div>`;
      return;
    }

    // Sắp xếp game mới nhất lên đầu
    filteredGames.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    grid.innerHTML = filteredGames.map(g => gameCardHTML(g)).join('');

    // Bắt sự kiện Click vào Card
    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = `game.html?id=${card.dataset.slug}`;
      });
    });

  } catch (error) {
    console.error("Lỗi:", error);
    document.getElementById('category-games-grid').innerHTML = `<p>Lỗi tải dữ liệu. Vui lòng tải lại trang.</p>`;
  }
}

// Hàm render Game Card chuẩn Neo-Brutalist (bê nguyên từ main.js)
function gameCardHTML(game) {
  const img = game.coverImage ? `<img src="${game.coverImage}" alt="${game.title}" loading="lazy">` : '<div class="game-card-thumb-placeholder"><span>🎮</span></div>';
  const badgeNew = game.isNew ? '<span class="badge badge-new">🔥 Mới</span>' : '';
  
  const platformArray = (game.platform || 'PS5').split(',').map(p => p.trim());
  const badgePlatform = platformArray.map(p => `<span class="badge badge-platform ${p === 'Nintendo Switch' ? 'badge-switch' : (p === 'PC' ? 'badge-pc' : '')}">${p}</span>`).join(' ');
  
  const statusBadge = game.status ? `<span class="badge ${game.status.includes('100%') ? 'badge-done' : 'badge-wip'}">${game.status}</span>` : '';
  const stars = game.rating ? Array.from({length: 5}, (_, i) => i < game.rating ? `<img src="/ratingstar1.svg" style="width:16px;height:16px;">` : `<span style="font-size:14px;color:var(--text-dim);width:16px;text-align:center">☆</span>`).join('') : '';

  return `
    <div class="game-card" data-slug="${game.slug}">
      <div class="game-card-thumb">
        ${img}
        <div class="game-card-badges">${badgeNew} ${badgePlatform}</div>
        <div class="game-card-overlay"><div class="game-card-play-btn">Xem chi tiết</div></div>
      </div>
      <div class="game-card-body">
        <div class="game-card-title">${game.title}</div>
        ${game.titleVi ? `<div class="game-card-title-vi">${game.titleVi}</div>` : ''}
        <div class="game-card-meta">
          ${game.genre ? `<span class="game-card-genre">${game.genre}</span>` : ''}
          ${statusBadge}
          ${stars ? `<div class="game-card-stars">${stars}</div>` : ''}
        </div>
      </div>
    </div>`;
}

// ==========================================
// CÁC HÀM UI CƠ BẢN (Dùng chung cho Layout)
// ==========================================
function initUI() {
  // 1. Dark mode
  const toggleBtn = document.getElementById('theme-toggle');
  const icon = toggleBtn?.querySelector('i');
  if (document.body.classList.contains('dark-mode') && icon) icon.className = 'fa-solid fa-sun';
  toggleBtn?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    localStorage.setItem('clt_theme', isDark ? 'dark' : 'light');
  });

  // 2. Mobile Menu
  const mobileToggle = document.querySelector('.nav-mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  mobileToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('mobile-open');
    mobileToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '☰';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // 3. Search Overlay
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('search-input-main');
  const openSearch = (e) => { if(e) e.preventDefault(); searchOverlay?.classList.add('open'); setTimeout(() => searchInput?.focus(), 100); };
  const closeSearch = () => searchOverlay?.classList.remove('open');
  
  document.querySelector('.nav-search-icon')?.addEventListener('click', openSearch);
  document.getElementById('nav-search-input')?.addEventListener('focus', openSearch);
  document.getElementById('menu-search-btn')?.addEventListener('click', openSearch);
  document.getElementById('search-close')?.addEventListener('click', closeSearch);
  
  // Hàm tìm kiếm cơ bản
  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const q = searchInput.value.trim().toLowerCase();
      const list = document.getElementById('search-results-list');
      if (!q) { list.innerHTML = ''; return; }
      const games = await API.getGames();
      const results = games.filter(g => g.title.toLowerCase().includes(q) || (g.titleVi || '').toLowerCase().includes(q)).slice(0, 6);
      if (!results.length) { list.innerHTML = '<div style="padding:24px">Không tìm thấy game</div>'; return; }
      list.innerHTML = results.map(g => `
        <div class="search-result-item" onclick="window.location.href='game.html?id=${g.slug}'">
          <img class="search-result-thumb" src="${g.coverImage || ''}" onerror="this.src='logo.png'">
          <div class="search-result-info">
            <div class="search-result-title">${g.title}</div>
            <div style="font-size:12px; color:var(--text-dim)">${g.platform || 'PS5'}</div>
          </div>
        </div>
      `).join('');
    }, 200);
  });

  // 4. Highlight Menu Đang Active
  function highlightMenu() {
    const currentUrl = new URL(window.location.href);
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
      link.classList.remove('active');
      const hrefAttr = link.getAttribute('href');
      if (!hrefAttr || hrefAttr.startsWith('#')) return;

      const linkUrl = new URL(link.href, window.location.origin);

      if (currentUrl.pathname === linkUrl.pathname && currentUrl.search === linkUrl.search) {
        link.classList.add('active');
      }
    });
  }
  
  // Chạy hàm highlight
  highlightMenu();
}