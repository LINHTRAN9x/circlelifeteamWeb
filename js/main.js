// ============================================================
//  CircleLifeTeam — main.js
//  Logic cho trang chủ (index.html)
// ============================================================
// ============================================================
//  Khởi tạo cuộn mượt Lenis (Dán lên đầu file)
// ============================================================
const lenis = new Lenis({
  duration: 1.2, /* Độ dài của quán tính (tăng để trượt dài hơn) */
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), /* Gia tốc trượt */
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false, /* Tắt trên điện thoại vì đt cuộn cảm ứng vốn đã mượt */
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Bắt sự kiện click vào các thẻ <a> (Menu) để cuộn mượt theo chuẩn Lenis
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const currentHref = this.getAttribute('href');
    
    // Nếu href đã bị đổi thành link web thật (không còn bắt đầu bằng #), 
    // thì bỏ qua để trình duyệt mở link bình thường, không cuộn nữa!
    if (!currentHref.startsWith('#')) return;

    e.preventDefault();
    if (currentHref.length > 1) {
      lenis.scrollTo(currentHref, { offset: -100 });
    }
  });
});
// ============================================================


document.addEventListener('DOMContentLoaded', async () => {
  await initHomePage();
  initSearch();
  initNavScroll();
  initMobileMenu();
  initTheme();
});

// ── Khởi tạo trang chủ ──
async function initHomePage() {
  try {
    showSkeletons();
    const [games, settings] = await Promise.all([
      API.getGames(),
      API.getSettings()
    ]);
    renderHeroSettings(settings);
    renderNewReleases(games);
    renderFeaturedGames(games);
    renderAllGames(games);
    updateHeroStats(games);
    renderPremiumShowcase(games);

    setTimeout(() => {
      document.getElementById('ps5-loader')?.classList.add('hidden');
    }, 400);
  } catch (e) {
    console.error('Init error:', e);
    document.getElementById('ps5-loader')?.classList.add('hidden');
  }
}

// ── Hero settings ──
function renderHeroSettings(settings) {
  const title = document.getElementById('hero-title');
  const sub = document.getElementById('hero-sub');
  if (title && settings.heroTitle) title.innerHTML = settings.heroTitle.replace(/(PS5|Việt Hóa)/gi, '<span>$1</span>');
  if (sub && settings.heroSubtitle) sub.textContent = settings.heroSubtitle;

  // Ảnh background hero
  if (settings.heroBgImage && settings.heroBgImage.trim()) {
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
      heroBg.style.backgroundImage = `url(${settings.heroBgImage})`;
      heroBg.style.backgroundSize = 'cover';
      heroBg.style.backgroundPosition = 'center';
      heroBg.style.opacity = '0.18'; // giữ tối để chữ vẫn đọc được
    }
  }

  // Map setting key → danh sách element ID cần cập nhật
  const linkMap = {
    discordLink:  ['footer-discord'],
    facebookLink: ['footer-fb'],
    facebookPageLink: ['footer-fb-page'], 
    facebookGroupLink: ['footer-fb-group'],
    youtubeLink:  ['footer-yt'],
  };

  Object.entries(linkMap).forEach(([key, ids]) => {
    if (!settings[key] || settings[key] === '#') return;
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.href = settings[key];
    });
  });

  // Footer social buttons (💬 👥 ▶) — theo đúng thứ tự trong HTML
  const socialBtns = document.querySelectorAll('.footer-social .social-btn');
  const socialOrder = [settings.discordLink, settings.facebookLink, settings.facebookPageLink, settings.facebookGroupLink, settings.youtubeLink];
  socialBtns.forEach((btn, i) => {
    if (socialOrder[i] && socialOrder[i] !== '#') btn.href = socialOrder[i];
  });
}

function updateHeroStats(games) {
  const totalEl = document.getElementById('stat-total');
  const doneEl = document.getElementById('stat-done');
  const newEl = document.getElementById('stat-new');
  if (totalEl) totalEl.textContent = games.length;
  if (doneEl) doneEl.textContent = games.filter(g => g.status && g.status.includes('100%')).length;
  if (newEl) newEl.textContent = games.filter(g => g.isNew).length;
}

// ── New Releases ──
function renderNewReleases(games) {
  const container = document.getElementById('new-releases-scroll');
  if (!container) return;
  const newGames = games.filter(g => g.isNew).slice(0, 10);
  if (!newGames.length) {
    container.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:12px">Chưa có game mới.</p>';
    return;
  }
  container.innerHTML = newGames.map(g => newCardHTML(g)).join('');
  container.querySelectorAll('.new-card').forEach(card => {
    card.addEventListener('click', () => navigateToGame(card.dataset.slug));
  });
}

function newCardHTML(game) {
  const img = game.coverImage
    ? `<img src="${game.coverImage}" alt="${game.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'new-card-thumb-placeholder\\'>🎮</div>'">`
    : '<div class="new-card-thumb-placeholder">🎮</div>';
  const date = game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('vi-VN') : '';
  
  // Đổi <div> thành thẻ <a> chuẩn SEO
  return `
    <a href="/game.html?id=${game.slug}" class="new-card" data-slug="${game.slug}">
      <div class="new-card-thumb">${img}</div>
      <div class="new-card-body">
        <div class="new-card-title">${game.title}</div>
        ${date ? `<div class="new-card-date"><i class="fa-regular fa-calendar"></i> ${date}</div>` : ''}
      </div>
    </a>`;
}



// ── Featured Games ──
function renderFeaturedGames(games) {
  const container = document.getElementById('featured-games');
  if (!container) return;
  
  // Sắp xếp game theo updatedAt (ưu tiên mới nhất lên đầu)
  // Nếu game cũ chưa từng được update (không có updatedAt) thì dùng ngày phát hành (releaseDate)
  const recentlyUpdated = [...games].sort((a, b) => {
    const timeA = a.updatedAt || new Date(a.releaseDate || 0).getTime();
    const timeB = b.updatedAt || new Date(b.releaseDate || 0).getTime();
    return timeB - timeA;
  }).slice(0, 4); // Chỉ lấy 4 game trên cùng

  if (!recentlyUpdated.length) {
    container.closest('.section').style.display = 'none';
    return;
  }
  
  container.innerHTML = recentlyUpdated.map((g, i) =>
    gameCardHTML(g, i === 0 ? 'game-card-featured' : '')
  ).join('');
  
  bindGameCards(container);
}

// ── All Games ──
// ── All Games & Load More & Filters ──
let allGamesCache = [];
let displayLimit = 12;

function renderAllGames(games) {
  allGamesCache = games;
  initFilters(games);
  applyFilters();
  initLoadMoreBtn();
}


function normalizeGenre(text) {
  if (!text) return '';
  // Tách từ bằng dấu cách hoặc gạch ngang (Gộp Action-RPG và Action RPG làm một)
  let words = text.toLowerCase().trim().split(/[\s-]+/);

  let finalWord = words.map((word, index) => {
    // 1. Viết hoa toàn bộ các từ khóa đặc biệt
    if (['rpg', 'jrpg', 'fps', 'vr', '2d', '3d'].includes(word)) return word.toUpperCase();
    // 2. Không viết hoa các từ nối (trừ khi nó đứng đầu)
    if (['and', 'or', 'of', 'in'].includes(word) && index !== 0) return word.toLowerCase();
    // 3. Viết hoa chữ cái đầu cho các chữ bình thường
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  // Trả lại dấu gạch ngang cho các từ chuyên ngành để sát chuẩn quốc tế
  return finalWord.replace('Souls Like', 'Souls-like')
                  .replace('Co Op', 'Co-op')
                  .replace('Sci Fi', 'Sci-Fi')
                  .replace('Turn Based', 'Turn-Based')
                  .replace('First Person', 'First-Person')
                  .replace('Third Person', 'Third-Person');
}

function initFilters(games) {
  // 1. Tự động tạo danh sách Thể Loại thông minh từ kho game
  const genreSelect = document.getElementById('filter-genre');
  if (genreSelect) {
    let allGenres = [];
    games.forEach(g => {
      if (g.genre) {
        // Tách các thể loại bị dính chùm bởi dấu "/" hoặc ","
        const parts = g.genre.split(/[\/,]/).map(p => p.trim()).filter(Boolean);
        // Đưa qua "máy lọc" trước khi nhét vào danh sách
        parts.forEach(p => allGenres.push(normalizeGenre(p)));
      }
    });

    // Lọc trùng lặp và sắp xếp theo bảng chữ cái A-Z
    const uniqueGenres = [...new Set(allGenres)].sort();

    genreSelect.innerHTML = `<option value="all">Tất Cả</option>` + 
      uniqueGenres.map(g => `<option value="${g}">${g}</option>`).join('');
  }

  // 2. PHỤC HỒI TRÍ NHỚ: Lấy lại các bộ lọc khách đã chọn trước khi sang trang khác
  const savedGenre = sessionStorage.getItem('clt_filter_genre');
  const savedPlatform = sessionStorage.getItem('clt_filter_platform');
  const savedStatus = sessionStorage.getItem('clt_filter_status');
  const savedSort = sessionStorage.getItem('clt_filter_sort');

  // Nếu có trí nhớ, tự động gán lại vào các ô Select
  if (savedGenre) document.getElementById('filter-genre').value = savedGenre;
  if (savedPlatform) document.getElementById('filter-platform').value = savedPlatform;
  if (savedStatus) document.getElementById('filter-status').value = savedStatus;
  if (savedSort) document.getElementById('filter-sort').value = savedSort;

  // 3. CÀI CẢM BIẾN: Khi khách đổi bộ lọc -> Vừa lọc game, vừa lưu trí nhớ mới
  ['filter-genre', 'filter-platform', 'filter-status', 'filter-sort'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      displayLimit = 12; // Reset lại số lượng hiển thị về 12
      
      // Lưu lựa chọn mới vào SessionStorage
      const filterKey = id.replace('filter-', 'clt_filter_');
      sessionStorage.setItem(filterKey, e.target.value);
      
      applyFilters(); // Tiến hành lọc game
    });
  });
}

function applyFilters(isLoadMore = false) {
  const container = document.getElementById('all-games-grid');
  const loadMoreContainer = document.getElementById('load-more-container');
  if (!container) return;

  // Thu thập yêu cầu từ 4 ô chọn
  const genre = document.getElementById('filter-genre')?.value || 'all';
  const platform = document.getElementById('filter-platform')?.value || 'all';
  const status = document.getElementById('filter-status')?.value || 'all';
  const sort = document.getElementById('filter-sort')?.value || 'newest';

  let filtered = [...allGamesCache];

  // 1. Máy chém Thể loại
  if (genre !== 'all') {
    filtered = filtered.filter(g => {
      if (!g.genre) return false;
      // Tách và làm sạch thể loại của từng game y như lúc tạo menu
      const gameGenres = g.genre.split(/[\/,]/).map(p => normalizeGenre(p.trim()));
      return gameGenres.includes(genre); // So sánh đồ sạch với đồ sạch
    });
  }

  // 2. Máy chém Nền tảng (Vì 1 game có nhiều nền tảng nên dùng includes)
  if (platform !== 'all') filtered = filtered.filter(g => (g.platform || '').includes(platform));

  // 3. Máy chém Tiến độ
  if (status === 'done') {
    filtered = filtered.filter(g => g.status && g.status.includes('100%'));
  } else if (status === 'wip') {
    filtered = filtered.filter(g => !g.status || !g.status.includes('100%'));
  }

  // 4. Thuật toán Sắp xếp
  if (sort === 'newest') {
    filtered.sort((a, b) => {
      const timeA = a.updatedAt || new Date(a.releaseDate || 0).getTime();
      const timeB = b.updatedAt || new Date(b.releaseDate || 0).getTime();
      return timeB - timeA;
    });
  } else if (sort === 'a-z') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  // Render ra màn hình
  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div class="empty-state-text">Không tìm thấy game nào phù hợp</div>
        <div class="empty-state-sub">Hãy thử thay đổi tiêu chí lọc nhé</div>
      </div>`;
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    return;
  }

  const gamesToShow = filtered.slice(0, displayLimit);
  container.innerHTML = gamesToShow.map(g => gameCardHTML(g)).join('');
  bindGameCards(container);

  // Xử lý ẩn/hiện nút "Tải Thêm"
  if (loadMoreContainer) {
    loadMoreContainer.style.display = filtered.length > displayLimit ? 'block' : 'none';
  }
}

function initLoadMoreBtn() {
  const loadMoreBtn = document.getElementById('load-more-btn');
  // Xóa listener cũ (nếu có) để tránh click đúp
  const newBtn = loadMoreBtn.cloneNode(true);
  loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
  
  newBtn?.addEventListener('click', () => {
    displayLimit += 12;
    applyFilters(true);
  });
}

// ── Game Card HTML ──
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

function bindGameCards(container) {
  container.querySelectorAll('.game-card').forEach(card => {
    card.querySelector('.btn-primary')?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToGame(e.currentTarget.dataset.slug);
    });
  });
}

// ── Navigate to game detail ──
function navigateToGame(slug) {
  window.location.href = `game.html?id=${slug}`;
}

// ── Search ──
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input-main');
  const closeBtn = document.getElementById('search-close');
  const navSearch = document.querySelector('.nav-search input');
  const searchIcon = document.querySelector('.nav-search-icon');

  const menuSearchBtn = document.getElementById('menu-search-btn');

  function openSearch(e) {
    if(e) e.preventDefault(); // Chặn thẻ <a> nhảy trang lung tung
    if (overlay) {
      overlay.classList.add('open');
      setTimeout(() => input?.focus(), 100);
    }
  }
  function closeSearch() { overlay?.classList.remove('open'); }

  navSearch?.addEventListener('focus', openSearch);
  searchIcon?.addEventListener('click', openSearch);
  
  // THÊM: Bấm chữ Tìm kiếm trong menu sẽ mở bảng
  menuSearchBtn?.addEventListener('click', openSearch);

  closeBtn?.addEventListener('click', closeSearch);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });

  function openSearch() {
    if (overlay) {
      overlay.classList.add('open');
      setTimeout(() => input?.focus(), 100);
    }
  }
  function closeSearch() { overlay?.classList.remove('open'); }

  navSearch?.addEventListener('focus', openSearch);
  searchIcon?.addEventListener('click', openSearch);
  closeBtn?.addEventListener('click', closeSearch);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  });

  let debounceTimer;
  input?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(input.value), 200);
  });
}

async function performSearch(query) {
  const list = document.getElementById('search-results-list');
  if (!list) return;
  const q = query.trim().toLowerCase();
  if (!q) { list.innerHTML = ''; return; }

  const games = await API.getGames();
  const results = games.filter(g =>
    g.title.toLowerCase().includes(q) ||
    (g.titleVi || '').toLowerCase().includes(q) ||
    (g.genre || '').toLowerCase().includes(q)
  ).slice(0, 6);

  if (!results.length) {
    list.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-text">Không tìm thấy game</div></div>';
    return;
  }
  list.innerHTML = results.map(g => `
    <a href="/game.html?id=${g.slug}" class="search-result-item">
      ${g.coverImage
        ? `<img class="search-result-thumb" src="${g.coverImage}" alt="${g.title}" onerror="this.src=''">`
        : '<div class="search-result-thumb" style="background:var(--bg-dark);display:flex;align-items:center;justify-content:center">🎮</div>'}
      <div class="search-result-info">
        <div class="search-result-title">${g.title}</div>
        <div class="search-result-sub">${g.titleVi || ''} · ${g.platform || 'PS5'} · ${g.status || ''}</div>
      </div>
      <span style="color:var(--text-dim);font-size:12px"><i class="fa-solid fa-arrow-right-long"></i></span>
    </a>
  `).join('');
}

// ── Nav scroll effect ──
function initNavScroll() {
  const nav = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  });
}

// ── Mobile menu ──
// ── Mobile menu ──
function initMobileMenu() {
  const toggle = document.querySelector('.nav-mobile-toggle');
  const links = document.querySelector('.nav-links');
  const body = document.body;
  // Lấy danh sách tất cả các thẻ <a> bên trong menu
  const menuItems = document.querySelectorAll('.nav-links a');

  if (!toggle || !links) return;

  // Tạo một hàm đóng menu dùng chung
  const closeMenu = () => {
    links.classList.remove('mobile-open');
    toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    body.style.overflow = ''; // Mở khóa cuộn trang
  };

  // 1. Xử lý khi bấm nút Hamburger / X
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('mobile-open');
    if (isOpen) {
      toggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      body.style.overflow = 'hidden'; // Khóa cuộn trang
    } else {
      closeMenu(); // Gọi hàm đóng
    }
  });

  // 2. Tự động đóng khi bấm vào bất kỳ link nào trong menu
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      // Chỉ đóng nếu menu trên mobile đang mở
      if (links.classList.contains('mobile-open')) {
        closeMenu();
      }
    });
  });
}

// ── Skeletons ──
function showSkeletons() {
  const newContainer = document.getElementById('new-releases-scroll');
  if (newContainer) {
    newContainer.innerHTML = Array(5).fill(0).map(() =>
      '<div class="skeleton" style="min-width:180px;height:280px;border-radius:14px;flex-shrink:0"></div>'
    ).join('');
  }
  const allContainer = document.getElementById('all-games-grid');
  if (allContainer) {
    allContainer.innerHTML = Array(8).fill(0).map(() =>
      '<div class="skeleton skeleton-card"></div>'
    ).join('');
  }
}

// ============================================================
// ── Bộ đếm lượt khách (Chỉ đếm 1 lần mỗi thiết bị) ──
// ============================================================
window.addEventListener('load', () => {
  const hasVisited = localStorage.getItem('clt_has_visited');
  
  if (!hasVisited) {
    fetch('https://api.codetabs.com/v1/proxy?quest=https://api.counterapi.dev/v1/circlelifeteam_top/unique_visitors/up')
      .then(res => res.json())
      .then(data => {
        // Đánh dấu là máy này đã vào rồi để không đếm trùng nữa
        localStorage.setItem('clt_has_visited', 'true');
      })
      .catch(err => console.error('Lỗi đếm truy cập:', err));
  }
});



// ============================================================
// ── CHẾ ĐỘ BAN ĐÊM (DARK MODE) ──
// ============================================================
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  
  const icon = toggleBtn.querySelector('i');
  
  // Kiểm tra trạng thái lúc vừa load web để hiển thị đúng Icon (Mặt trăng hay Mặt trời)
  if (document.body.classList.contains('dark-mode')) {
    icon.className = 'fa-solid fa-sun';
  }
  
  // Khi bấm nút
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    // 1. Đổi icon Mặt trăng <-> Mặt trời
    icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    
    // 2. Lưu vào trí nhớ của trình duyệt (LocalStorage)
    localStorage.setItem('clt_theme', isDark ? 'dark' : 'light');
  });
}


// ============================================================
// ── PREMIUM SHOWCASE (SLIDER CÓ THUMBNAILS - NGẪU NHIÊN 6 GAME) ──
// ============================================================
let premiumSlideTimer;
let currentPremiumIndex = 0;

function renderPremiumShowcase(games) {
  const mainContainer = document.getElementById('showcase-main-slides');
  const thumbContainer = document.getElementById('showcase-thumbnails');
  if (!mainContainer || !thumbContainer || !games.length) return;

  clearInterval(premiumSlideTimer);

  // Xáo trộn ngẫu nhiên toàn bộ danh sách game và cắt lấy 6 game đầu tiên
  const shuffledGames = [...games].sort(() => 0.5 - Math.random());
  const showcaseGames = shuffledGames.slice(0, 6);

  // 1. In ảnh to
  mainContainer.innerHTML = showcaseGames.map((g, i) => {
    // Ưu tiên dùng bannerImage ngang, nếu không có thì dùng coverImage
    const mainImg = g.bannerImage || g.coverImage || 'https://i.ibb.co/j90KpF3x/gdyt4q4jhynd1-1.png';
    
    // TỐI ƯU CORE WEB VITALS: 
    // Ảnh đầu tiên (i=0) hiện ra ngay -> Buff tải nhanh nhất.
    // Các ảnh sau bị ẩn đi -> Cho tải chậm (lazy) để đỡ tốn mạng.
    const priorityAttr = i === 0 ? 'fetchpriority="high"' : 'loading="lazy"';

    return `
      <div class="p-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
        <img src="${mainImg}" alt="Cover ${g.title}" ${priorityAttr}>
        
        <div class="p-slide-info">
          <h3>${g.title}</h3>
          <a href="game.html?id=${g.slug}" class="p-btn-view">XEM THÊM</a>
        </div>
      </div>
    `;
  }).join('');

  // 2. In ảnh thu nhỏ
  thumbContainer.innerHTML = showcaseGames.map((g, i) => `
    <div class="thumb-item ${i === 0 ? 'active' : ''}" data-index="${i}">
      <img src="${g.coverImage || 'https://i.ibb.co/j90KpF3x/gdyt4q4jhynd1-1.png'}" alt="Thumb">
    </div>
  `).join('');

  // 3. Xử lý click Thumbnails
  const thumbs = thumbContainer.querySelectorAll('.thumb-item');
  const slides = mainContainer.querySelectorAll('.p-slide');

  const switchSlide = (index) => {
    currentPremiumIndex = index;
    slides.forEach(s => s.classList.remove('active'));
    thumbs.forEach(t => t.classList.remove('active'));
    
    slides[index].classList.add('active');
    thumbs[index].classList.add('active');
  };

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      switchSlide(i);
      resetPremiumTimer(slides.length, switchSlide);
    });
  });

  resetPremiumTimer(slides.length, switchSlide);
}

function resetPremiumTimer(totalSlides, switchFn) {
  clearInterval(premiumSlideTimer);
  premiumSlideTimer = setInterval(() => {
    currentPremiumIndex = (currentPremiumIndex + 1) % totalSlides;
    switchFn(currentPremiumIndex);
  }, 8000); 
}