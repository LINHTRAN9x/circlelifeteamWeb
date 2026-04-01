// ============================================================
//  CircleLifeTeam — category.js
//  Logic cho trang Chuyên Mục (category.html)
// ============================================================

// 1. Khởi tạo Lenis (Cuộn mượt)
// const lenis = new Lenis({ duration: 1.2, smooth: true });
// function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
// requestAnimationFrame(raf);

document.addEventListener('DOMContentLoaded', async () => {
  initUI(); 
  
  const params = new URLSearchParams(window.location.search);
  const platform = params.get('platform');
  const genre = params.get('genre');
  const tag = params.get('tag');
  // Lấy số trang từ thanh địa chỉ (Mặc định là 1 nếu không có)
  const page = parseInt(params.get('page')) || 1; 

  // Truyền thêm page vào hàm load
  await loadCategoryData(platform, genre, tag, page); 
});

// Biến toàn cục để lưu trữ dữ liệu phân trang
let catFilteredGames = [];
let catCurrentPage = 1;
const CAT_ITEMS_PER_PAGE = 12; // Số game trên 1 trang (Bác có thể sửa tùy ý)

async function loadCategoryData(platform, genre, tag, initialPage = 1) { 
  try {
    const allGames = await API.getGames();
    let filteredGames = allGames;
    let pageTitle = "Tất cả Game Việt Hóa";
    let pageDesc = "Tổng hợp toàn bộ danh sách game việt hóa chất lượng cao từ CircleLifeTeam.";
    let breadcrumbText = "Tất cả game";

    // Lọc dữ liệu & Set Title (Giữ nguyên logic cũ của bác)
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
      filteredGames = allGames.filter(g => g.tags && Array.isArray(g.tags) && g.tags.includes(tag));
      pageTitle = `Game có từ khóa: ${tag}`;
      pageDesc = `Tuyển tập các tựa game mang yếu tố ${tag} siêu hay, việt hóa chất lượng cao bởi CircleLifeTeam.`;
      breadcrumbText = `#${tag}`;
      document.getElementById('cat-eyebrow').innerHTML = `<i class="fa-solid fa-hashtag"></i> Từ Khóa`;
      
    } else {
      document.getElementById('cat-eyebrow').style.display = 'none';
    }

    // Cập nhật DOM tiêu đề
    document.getElementById('cat-title').textContent = pageTitle;
    document.getElementById('cat-desc').textContent = pageDesc;
    document.getElementById('bc-category').textContent = breadcrumbText;
    document.title = `${pageTitle} – Tải Patch Tiếng Việt | CircleLifeTeam`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if(metaDesc) metaDesc.content = pageDesc;

    // Sắp xếp game mới nhất lên đầu và nạp vào Biến toàn cục
    catFilteredGames = filteredGames.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    // Khởi động render Trang 1
    renderCategoryPage(initialPage);

  } catch (error) {
    console.error("Lỗi:", error);
    document.getElementById('category-games-grid').innerHTML = `<p>Lỗi tải dữ liệu. Vui lòng tải lại trang.</p>`;
  }
}

// HÀM IN LƯỚI GAME THEO TRANG
function renderCategoryPage(page) {
  catCurrentPage = page;
  const grid = document.getElementById('category-games-grid');
  const totalItems = catFilteredGames.length;
  const totalPages = Math.ceil(totalItems / CAT_ITEMS_PER_PAGE);

  // Xử lý nếu danh mục trống
  if (totalItems === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1; padding: 60px;">
        <div class="empty-state-icon" style="font-size: 40px; margin-bottom: 16px;">😕</div>
        <div class="empty-state-text" style="font-family: var(--font-display); font-size: 20px; font-weight: 800;">Chưa có game nào thuộc chuyên mục này</div>
        <div class="empty-state-sub" style="color: var(--text-dim);">Team đang cố gắng cập nhật thêm. Bạn quay lại sau nhé!</div>
      </div>`;
    document.getElementById('pagination-container').innerHTML = ''; // Giấu phân trang
    return;
  }

  // Cắt mảng (Ví dụ: Trang 2 -> Lấy từ index 12 đến 24)
  const startIndex = (page - 1) * CAT_ITEMS_PER_PAGE;
  const endIndex = startIndex + CAT_ITEMS_PER_PAGE;
  const pageData = catFilteredGames.slice(startIndex, endIndex);

  // In HTML
  grid.innerHTML = pageData.map(g => gameCardHTML(g)).join('');

  // Gắn sự kiện click
  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `game.html?id=${card.dataset.slug}`;
    });
  });

  // Vẽ nút phân trang
  renderCategoryPagination(totalPages);

  // Cuộn mượt màn hình lên đầu danh sách khi chuyển trang (Trừ lúc mới load lần đầu)
  if (page > 1 || event) {
    const topElement = document.getElementById('cat-title');
    if (topElement && typeof lenis !== 'undefined') {
      lenis.scrollTo(topElement, { offset: -100 });
    }
  }
}

// HÀM VẼ NÚT PHÂN TRANG THÔNG MINH (Dạng 1 2 3 ... 10)
// HÀM VẼ NÚT PHÂN TRANG THÔNG MINH (Chuẩn SEO với thẻ <a href>)
function renderCategoryPagination(totalPages) {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = ''; 
    return;
  }

  // Lấy URL hiện tại để giữ nguyên các bộ lọc (platform, genre, tag) khi chuyển trang
  const currentUrl = new URL(window.location.href);
  const createPageLink = (pageNum) => {
    currentUrl.searchParams.set('page', pageNum);
    return currentUrl.toString();
  };

  let html = '';
  
  // Nút Prev (Trái)
  if (catCurrentPage > 1) {
    html += `<a href="${createPageLink(catCurrentPage - 1)}" class="page-btn"><i class="fa-solid fa-chevron-left"></i></a>`;
  } else {
    html += `<button class="page-btn" disabled><i class="fa-solid fa-chevron-left"></i></button>`;
  }

  // In các số trang (Thay thế button bằng the a)
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages <= 5) {
      html += `<a href="${createPageLink(i)}" class="page-btn ${i === catCurrentPage ? 'active' : ''}">${i}</a>`;
    } else {
      if (i === 1 || i === totalPages || (i >= catCurrentPage - 1 && i <= catCurrentPage + 1)) {
        html += `<a href="${createPageLink(i)}" class="page-btn ${i === catCurrentPage ? 'active' : ''}">${i}</a>`;
      } else if (i === 2 && catCurrentPage > 3) {
        html += `<span style="font-weight: 800; padding: 0 4px; color: var(--text-dim);">...</span>`;
      } else if (i === totalPages - 1 && catCurrentPage < totalPages - 2) {
        html += `<span style="font-weight: 800; padding: 0 4px; color: var(--text-dim);">...</span>`;
      }
    }
  }

  // Nút Next (Phải)
  if (catCurrentPage < totalPages) {
    html += `<a href="${createPageLink(catCurrentPage + 1)}" class="page-btn"><i class="fa-solid fa-chevron-right"></i></a>`;
  } else {
    html += `<button class="page-btn" disabled><i class="fa-solid fa-chevron-right"></i></button>`;
  }

  container.innerHTML = html;
}

// Hàm render Game Card chuẩn Neo-Brutalist (bê nguyên từ main.js)
function gameCardHTML(game, extraClass = '') {
  // 1. Đã fix lỗi mất dấu '"> ở cuối thẻ img
  const img = game.coverImage
    ? `<img src="${game.coverImage}" alt="${game.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'game-card-thumb-placeholder\\'><span>🎮</span><p>No Image</p></div>'">`
    : '<div class="game-card-thumb-placeholder"><span>🎮</span><p>No Image</p></div>';

  const badgeNew = game.isNew ? '<span class="badge badge-new">🔥 Mới</span>' : '';
  const platformArray = (game.platform || 'PS5').split(',').map(p => p.trim());
  const badgePlatform = platformArray.map(p => 
    `<span class="badge badge-platform ${p === 'Nintendo Switch' ? 'badge-switch' : (p === 'PC' ? 'badge-pc' : '')}">${p}</span>`
  ).join(' ');
  
  const statusBadge = game.status
    ? `<span class="badge ${game.status.includes('100%') ? 'badge-done' : 'badge-wip'}">${game.status}</span>`
    : '';

  const stars = game.rating
    ? Array.from({length: 5}, (_, i) => {
        return i < game.rating 
          ? `<img src="/ratingstar1.svg" alt="star" style="width:16px;height:16px;object-fit:contain">` 
          : `<span style="font-size:14px;color:var(--text-dim);display:inline-block;width:16px;text-align:center">☆</span>`;
      }).join('')
    : '';

  const isFeatured = extraClass.includes('featured');
  const descHTML = isFeatured && game.descriptionVi
    ? `<div class="game-card-desc">${game.descriptionVi}</div>`
    : '';
    
  // Nút xem chi tiết (khi là game nổi bật) đổi thành thẻ span để không lỗi HTML
  const ctaHTML = isFeatured
    ? `<span class="btn-primary" style="font-size:13px;padding:10px 20px">Xem chi tiết <i class="fa-solid fa-arrow-right"></i></span>`
    : '';

  // 2. Đã đổi thẻ bao quanh ngoài cùng từ <div onclick="..."> thành <a href="...">
  return `
    <a href="/game.html?id=${game.slug}" class="game-card ${extraClass}" data-slug="${game.slug}">
      <div class="game-card-thumb">
        ${img}
        <div class="game-card-badges">
          ${badgeNew}
          ${badgePlatform}
        </div>
        <div class="game-card-overlay">
          <div class="game-card-play-btn">Xem chi tiết</div>
        </div>
      </div>
      <div class="game-card-body">
        <div class="game-card-title">${game.title}</div>
        ${game.titleVi ? `<div class="game-card-title-vi">${game.titleVi}</div>` : ''}
        ${descHTML}
        <div class="game-card-meta">
          ${game.genre ? `<span class="game-card-genre">${game.genre}</span>` : ''}
          ${statusBadge}
          ${stars ? `<div class="game-card-stars">${stars}</div>` : ''}
        </div>
        ${ctaHTML}
      </div>
    </a>`;
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