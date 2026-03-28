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
  } catch (e) {
    console.error('Init error:', e);
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
  return `
    <div class="new-card" data-slug="${game.slug}">
      <div class="new-card-thumb">${img}</div>
      <div class="new-card-body">
        <div class="new-card-title">${game.title}</div>
        ${date ? `<div class="new-card-date"><i class="fa-regular fa-calendar"></i> ${date}</div>` : ''}
      </div>
    </div>`;
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
let currentGenre = 'all';
let allGamesCache = [];

function renderAllGames(games) {
  allGamesCache = games;
  renderGenreFilter(games);
  filterAndRenderGames('all');
}

function renderGenreFilter(games) {
  const container = document.getElementById('genre-filter');
  if (!container) return;
  const genres = ['all', ...new Set(games.map(g => g.genre).filter(Boolean))];
  container.innerHTML = genres.map(g =>
    `<button class="genre-btn ${g === 'all' ? 'active' : ''}" data-genre="${g}">
      ${g === 'all' ? '🎮 Tất cả' : g}
    </button>`
  ).join('');
  container.querySelectorAll('.genre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterAndRenderGames(btn.dataset.genre);
    });
  });
}

function filterAndRenderGames(genre) {
  currentGenre = genre;
  const container = document.getElementById('all-games-grid');
  if (!container) return;
  const filtered = genre === 'all'
    ? allGamesCache
    : allGamesCache.filter(g => g.genre === genre);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">Không có game nào</div>
        <div class="empty-state-sub">Thể loại này chưa có bản việt hóa</div>
      </div>`;
    return;
  }
  container.innerHTML = filtered.map(g => gameCardHTML(g)).join('');
  bindGameCards(container);
}

// ── Game Card HTML ──
function gameCardHTML(game, extraClass = '') {
  const img = game.coverImage
    ? `<img src="${game.coverImage}" alt="${game.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"game-card-thumb-placeholder\\"><span>🎮</span><p>No Image</p></div>`
    : '<div class="game-card-thumb-placeholder"><span>🎮</span><p>No Image</p></div>';

  const badgeNew = game.isNew ? '<span class="badge badge-new">🔥 Mới</span>' : '';
  // Đã thêm điều kiện chèn class 'badge-switch'
  const badgePlatform = `<span class="badge badge-platform ${game.platform === 'Nintendo Switch' ? 'badge-switch' : ''}">${game.platform || 'PS5'}</span>`;
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
  const ctaHTML = isFeatured
    ? `<a href="#" class="btn-primary" data-slug="${game.slug}" style="font-size:13px;padding:10px 20px">Xem chi tiết →</a>`
    : '';

  return `
    <div class="game-card ${extraClass}" data-slug="${game.slug}" onclick="navigateToGame('${game.slug}')">
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
    </div>`;
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
    list.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Không tìm thấy game</div></div>';
    return;
  }
  list.innerHTML = results.map(g => `
    <div class="search-result-item" onclick="navigateToGame('${g.slug}')">
      ${g.coverImage
        ? `<img class="search-result-thumb" src="${g.coverImage}" alt="${g.title}" onerror="this.src=''">`
        : '<div class="search-result-thumb" style="background:var(--bg-dark);display:flex;align-items:center;justify-content:center">🎮</div>'}
      <div class="search-result-info">
        <div class="search-result-title">${g.title}</div>
        <div class="search-result-sub">${g.titleVi || ''} · ${g.platform || 'PS5'} · ${g.status || ''}</div>
      </div>
      <span style="color:var(--text-dim);font-size:12px">→</span>
    </div>
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
function initMobileMenu() {
  const toggle = document.querySelector('.nav-mobile-toggle');
  const links = document.querySelector('.nav-links');
  toggle?.addEventListener('click', () => {
    links?.classList.toggle('mobile-open');
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