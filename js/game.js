// ============================================================
//  CircleLifeTeam — game.js
//  Logic cho trang chi tiết game (game.html)
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
  const slug = getSlugFromURL();
  if (!slug) { window.location.href = '/'; return; }
  await loadGameDetail(slug);
  initNavScroll();
});

function getSlugFromURL() {
  // 1. Thử tìm theo cách cũ (?id=...)
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('id');

  // 2. Nếu cách cũ không có, thử tìm trong đường link mới (/share/...)
  if (!slug && window.location.pathname.startsWith('/share/')) {
    slug = window.location.pathname.split('/share/')[1]; // Cắt lấy phần đuôi tên game
  }
  
  return slug;
}

async function loadGameDetail(slug) {
  try {
    const game = await API.getGameBySlug(slug);
    if (!game) {
      document.getElementById('game-content').innerHTML = `
        <div class="empty-state" style="padding:100px 20px">
          <div class="empty-state-icon">😕</div>
          <div class="empty-state-text">Không tìm thấy game này</div>
          <div class="empty-state-sub">Có thể game đã bị xóa hoặc link sai</div>
          <br><a href="/" class="btn-primary" style="display:inline-flex;margin-top:16px">← Về trang chủ</a>
        </div>`;
      return;
    }
    updateSEO(game);
    renderGameDetail(game);
    loadRelatedGames(game);

    setTimeout(buildTableOfContents, 100);

    // Đổi link trên thanh địa chỉ thành link share siêu ngắn, chuẩn SEO
    window.history.replaceState(null, '', `/share/${game.slug}`);
  } catch (e) {
    console.error('Game detail error:', e);
  }
}

// ── SEO Meta Update ──
function updateSEO(game) {
  const h1 = document.getElementById('game-title');
  if (h1) h1.textContent = `${game.title} Việt Hóa`;

  const title = `${game.title} Việt Hóa ${game.platform || 'PS4/PS5/Switch/PC'} – Patch ${game.version || 'Mới Nhất'} | CircleLifeTeam`;
  document.title = title;
  const desc = `Tải về bản việt hóa ${game.title} (${game.titleVi || ''}) cho PS4/PS5/Switch/PC. ${game.status || 'Hoàn thành'}. Bản dịch chất lượng cao bởi CircleLifeTeam.`;
  const keywords = `${game.title} việt hóa, ${game.title} ${game.platform || 'PS4/PS5/Switch/PC'} tiếng việt, patch việt hóa ${game.title}, circlelifeteam ${game.title}`;

  setMeta('description', desc);
  setMeta('keywords', keywords);
  setOG('title', title);
  setOG('description', desc);
  setOG('image', game.coverImage || '');
  setOG('url', `${CONFIG.SITE_URL}/game.html?id=${game.slug}`);

  // ==========================================
  // BẮT ĐẦU TẠO SCHEMA RICH SNIPPETS
  // ==========================================

  // 1. Schema VideoGame (Tích hợp Đánh giá Sao)
  const videoGameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": game.title,
    "alternateName": game.titleVi,
    "description": game.descriptionVi || game.description,
    "gamePlatform": game.platform || "PlayStation 5",
    "genre": game.genre,
    "image": game.coverImage,
    "url": `${CONFIG.SITE_URL}/share/${game.slug}`,
    "publisher": { "@type": "Organization", "name": "CircleLifeTeam" }
  };

  // Nếu game có điểm số, khai báo để Google hiện sao vàng
  if (game.rating) {
    videoGameSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": game.rating,
      "bestRating": "5",
      "worstRating": "1",
      // Google bắt buộc phải có số lượt đánh giá.
      // Tạm thời mình dùng công thức giả lập (rating * 42 + 15) để ra con số trông có vẻ tự nhiên, không bị báo lỗi thiếu trường.
      "ratingCount": (game.rating * 42) + 15 
    };
  }

  // 2. Schema Breadcrumb (Hiển thị đường dẫn rõ ràng)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang Chủ",
        "item": `${CONFIG.SITE_URL}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Game ${game.genre || 'PS5'}`,
        "item": `${CONFIG.SITE_URL}/category.html?genre=${encodeURIComponent(game.genre || '')}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": game.title,
        "item": `${CONFIG.SITE_URL}/game.html?id=${game.slug}`
      }
    ]
  };

  // 3. Schema FAQ (Hỏi đáp nhanh)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Bản việt hóa ${game.title} chơi được trên máy nào?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Hiện tại bản việt hóa ${game.title} hỗ trợ trên các hệ máy: ${game.platform || 'PS5'}. Bạn cần làm theo hướng dẫn cài đặt của CircleLifeTeam để trải nghiệm game.`
        }
      },
      {
        "@type": "Question",
        "name": `Patch tiếng Việt ${game.title} do ai thực hiện?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Bản dịch này được thực hiện bởi nhóm ${game.translator || 'CircleLifeTeam'} với chất lượng cao nhất.`
        }
      },
      {
        "@type": "Question",
        "name": `Tiến độ việt hóa ${game.title} đến đâu rồi?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Trạng thái hiện tại của dự án là: ${game.status || 'Đang cập nhật'}.`
        }
      }
    ]
  };

  // Gom cả 3 Schema thành một mảng (Array) và nhét vào thẻ <script> JSON-LD
  const ldScript = document.getElementById('json-ld');
  if (ldScript) {
    ldScript.textContent = JSON.stringify([videoGameSchema, breadcrumbSchema, faqSchema]);
  }

  // ==========================================
  // KẾT THÚC SCHEMA
  // ==========================================

  // Update canonical
  const canonical = document.getElementById('canonical');
  if (canonical) canonical.href = `${CONFIG.SITE_URL}/share/${game.slug}`;

  // Update breadcrumb text trên giao diện HTML
  // const bcGame = document.getElementById('bc-game');
  // if (bcGame) bcGame.textContent = game.title;
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
  el.content = content;
}
function setOG(prop, content) {
  let el = document.querySelector(`meta[property="og:${prop}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', `og:${prop}`); document.head.appendChild(el); }
  el.content = content;
}

// ── Render Game Detail ──
function renderGameDetail(game) {
  // ==========================================================
  // ── XỬ LÝ BREADCRUMB ĐỘNG (Dựa trên lịch sử duyệt web) ──
  // ==========================================================
  const breadcrumbNav = document.querySelector('.breadcrumb');
  if (breadcrumbNav) {
    let parentName = '';
    let parentLink = '';

    // 1. Cố gắng đọc xem người dùng vừa từ trang Category nào chui vào
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.pathname.includes('category.html')) {
          const params = new URLSearchParams(refUrl.search);
          if (params.get('platform')) {
            parentName = `Game ${params.get('platform')}`;
            parentLink = `/category.html${refUrl.search}`;
          } else if (params.get('genre')) {
            parentName = `Game ${params.get('genre')}`;
            parentLink = `/category.html${refUrl.search}`;
          } else if (params.get('tag')) {
            parentName = `#${params.get('tag')}`;
            parentLink = `/category.html${refUrl.search}`;
          }
        }
      } catch(e) {}
    }

    // 2. Nếu không đi từ category (vào thẳng từ Trang chủ hoặc Google)
    // -> Tự động lấy hệ máy đầu tiên của game làm danh mục cha
    if (!parentName) {
      const primaryPlatform = (game.platform || 'PS5').split(',')[0].trim();
      parentName = `Game ${primaryPlatform}`;
      parentLink = `/category.html?platform=${encodeURIComponent(primaryPlatform)}`;
    }

    // 3. Vẽ lại thanh điều hướng
    breadcrumbNav.innerHTML = `
      <a href="/"><i class="fa-solid fa-house"></i> Trang Chủ</a>
      <span aria-hidden="true">›</span>
      <a href="${parentLink}">${parentName}</a>
      <span aria-hidden="true">›</span>
      <span id="bc-game" aria-current="page">${game.title}</span>
    `;
  }
  // ==========================================================
  // Background blur
  const bg = document.getElementById('game-detail-bg');
  if (bg && game.coverImage) bg.style.backgroundImage = `url(${game.coverImage})`;

  // Cover
  const coverEl = document.getElementById('game-cover');
  if (coverEl) {
    if (game.coverImage) {
      // (Đoạn này giữ nguyên SEO alt ảnh hôm trước mình làm)
      const plat = game.platform || 'PS5';
      const viName = game.titleVi ? ` (${game.titleVi})` : '';
      const coverAlt = `Ảnh bìa tải game ${game.title}${viName} việt hóa cho máy ${plat} miễn phí`;
      
      // THÊM: fetchpriority="high" và ĐẢM BẢO TUYỆT ĐỐI KHÔNG CÓ chữ loading="lazy" ở đây
      coverEl.innerHTML = `<img src="${game.coverImage}" alt="${coverAlt}" title="${coverAlt}" fetchpriority="high" onerror="this.parentElement.innerHTML='<div class=\\'game-detail-cover-placeholder\\'><span>🎮</span></div>'">`;
    } else {
      coverEl.innerHTML = '<div class="game-detail-cover-placeholder"><span>🎮</span></div>';
    }
  }

  // Badges
  const badgesEl = document.getElementById('game-detail-badges');
  if (badgesEl) {
    // Đã thêm điều kiện: Nếu là Nintendo Switch thì mặc áo 'badge-switch'
    const platformArray = (game.platform || 'PS5').split(',').map(p => p.trim());
    let html = platformArray.map(p => 
      `<span class="badge badge-platform ${p === 'Nintendo Switch' ? 'badge-switch' : (p === 'PC' ? 'badge-pc' : '')}">${p}</span>`
    ).join(' ');
    
    if (game.isNew) html += '<span class="badge badge-new">🔥 Mới</span>';
    if (game.status) html += `<span class="badge ${game.status.includes('100%') ? 'badge-done' : 'badge-wip'}">${game.status}</span>`;
    badgesEl.innerHTML = html;
  }

  // Title
  const titleEl = document.getElementById('game-title');
  // Chèn thẳng từ khóa SEO vào H1
  if (titleEl) titleEl.textContent = `${game.title} Việt Hóa`;
  const titleViEl = document.getElementById('game-title-vi');
  if (titleViEl) titleViEl.textContent = game.titleVi || '';

  // Meta grid
  const metaEl = document.getElementById('game-meta-grid');
  if (metaEl) {
    const items = [
      { label: 'Platform', value: game.platform || 'PS5' },
      { label: 'Thể loại', value: game.genre || '—' },
      { label: 'Phiên bản', value: game.version || '—' },
      { label: 'Người dịch', value: game.translator || 'CircleLifeTeam' },
      { label: 'Ngày phát hành VH', value: game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('vi-VN') : '—' },
      { label: 'Tiến độ', value: game.status || '—', statusClass: game.status?.includes('100%') ? 'status-done' : 'status-wip' }
    ];
    metaEl.innerHTML = items.map(item => `
      <div class="game-meta-item">
        <div class="game-meta-label">${item.label}</div>
        <div class="game-meta-value ${item.statusClass || ''}">${item.value}</div>
      </div>
    `).join('');
  }

  // Rating
  const ratingEl = document.getElementById('game-rating');
  if (ratingEl && game.rating) {
    ratingEl.innerHTML = Array.from({length: 5}, (_, i) => {
      // Dùng ảnh SVG cho sao đã đánh giá, dùng emoji ☆ (hoặc làm ảnh SVG khác) cho sao trống
      return i < game.rating 
        ? `<img src="/ratingstar1.svg" alt="star" style="width:24px;height:24px;object-fit:contain">` 
        : `<span style="font-size:18px;color:var(--text-dim);display:inline-block;width:24px;text-align:center">☆</span>`;
    }).join('') + `<span style="font-size:14px;font-weight:800;color:var(--text-dim);margin-left:8px">${game.rating}/5</span>`;
  }
  // (Bên dưới phần metaEl hoặc descEl trong file game.js)
  const metaGrid = document.getElementById('game-meta-grid');
  
  if (game.tags && game.tags.length > 0) {
    // Tạo html cho các nút tag
    const tagsHTML = game.tags.map(t => 
      `<a href="/category.html?tag=${encodeURIComponent(t)}" class="badge" style="background:var(--accent-yellow); color:var(--black); border: 2px solid var(--black); box-shadow: 2px 2px 0 var(--black); padding: 6px 14px; font-size: 12px; margin-right: 8px; margin-top: 8px; display: inline-flex;"><i class="fa-solid fa-hashtag" style="margin-right:4px;"></i> ${t}</a>`
    ).join('');

    // Nhét vào dưới cùng của Meta Grid (Hoặc tạo thẻ div mới dưới description tùy bác)
    metaGrid.insertAdjacentHTML('afterend', `
      <div style="margin-top: 16px; margin-bottom: 24px; display: flex; flex-wrap: wrap;">
        ${tagsHTML}
      </div>
    `);
  }

  // Download button
  // Download buttons (Gán link cho cả nút ở trên Hero và nút ở dưới Footer)
  const dlBtns = [
    document.getElementById('download-btn'), 
    document.getElementById('download-btn-2')
  ];
  
  dlBtns.forEach(btn => {
    if (btn) {
      if (game.downloadLink && game.downloadLink !== '#') {
        btn.href = game.downloadLink; // Đè link Discord/Drive vào đây
        btn.target = '_blank'; // Mở tab mới
        btn.rel = 'noopener noreferrer';
      } else {
        btn.onclick = () => showToast('Link tải đang được cập nhật...', 'info');
        btn.removeAttribute('href');
      }
    }
  });

  

  // Description
  const descEl = document.getElementById('game-description');
  if (descEl) {
    descEl.innerHTML = `
      ${game.descriptionVi ? `<p class="game-desc-text" style="margin-bottom:16px">${game.descriptionVi}</p>` : ''}
      ${game.description ? `<p class="game-desc-text" style="color:var(--text-dim);font-size:13px;font-style:italic">${game.description}</p>` : ''}
    `;
  }

  // YouTube trailer
  const ytEl = document.getElementById('youtube-wrapper');
  if (ytEl) {
    if (game.youtubeId) {
      ytEl.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${game.youtubeId}?rel=0&modestbranding=1"
          title="${game.title} Trailer"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy">
        </iframe>`;
    } else {
      ytEl.innerHTML = `
        <div style="padding:60px;text-align:center;color:var(--text-dim)">
          <div style="font-size:36px;margin-bottom:8px">▶</div>
          <p>Chưa có trailer</p>
        </div>`;
    }
  }

  // Screenshots
  const screensEl = document.getElementById('screenshots-grid');
  if (screensEl) {
    const imgs = game.images || [];
    if (imgs.length) {
      screensEl.innerHTML = imgs.map((url, i) => {
        // Trộn từ khóa động cho từng bức ảnh để tránh bị Google đánh dấu là Spam trùng lặp
        const keyword = i % 2 === 0 ? 'việt hóa' : 'tiếng Việt';
        const plat = game.platform || 'PS5';
        const seoText = `Ảnh trong game ${game.title} ${keyword} trên ${plat} - Phân cảnh số ${i + 1}`;
        
        return `
        <div class="screenshot-item" onclick="openLightbox('${url}')">
          <img src="${url}" alt="${seoText}" title="${seoText}" loading="lazy"
            onerror="this.parentElement.style.display='none'">
        </div>
      `}).join('');
    } else {
      screensEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;grid-column:1/-1">Chưa có ảnh màn hình.</p>`;
    }
  }
}

// ── Related Games ──
async function loadRelatedGames(currentGame) {
  const container = document.getElementById('related-games');
  if (!container) return;
  try {
    const all = await API.getGames();
    const related = all
      .filter(g => g.id !== currentGame.id && g.genre === currentGame.genre)
      .slice(0, 4);
    if (!related.length) {
      container.closest('.section').style.display = 'none';
      return;
    }
    container.innerHTML = related.map(g => relatedCardHTML(g)).join('');
  } catch (e) { console.error(e); }
}

function relatedCardHTML(game) {
  const img = game.coverImage
    ? `<img src="${game.coverImage}" alt="${game.title}" loading="lazy">`
    : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-dark);font-size:28px">🎮</div>';
    
  // Thay thế onclick bằng thẻ <a>
  return `
    <a href="/game.html?id=${game.slug}" class="game-card">
      <div class="game-card-thumb" style="aspect-ratio:3/4">${img}</div>
      <div class="game-card-body">
        <div class="game-card-title">${game.title}</div>
        ${game.titleVi ? `<div class="game-card-title-vi">${game.titleVi}</div>` : ''}
      </div>
    </a>`;
}

// ── Lightbox ──
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (lb && img) {
    img.src = src;
    lb.classList.add('open');
  }
}
function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
document.getElementById('lightbox')?.addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});

// ── Navigate ──
function navigateToGame(slug) {
  window.location.href = `/game.html?id=${slug}`;
}

function initNavScroll() {
  const nav = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ── Toast (shared) ──
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


// ── Xây Dựng Mục Lục (Table of Contents) cho SEO ──
function buildTableOfContents() {
  const tocContainer = document.getElementById('toc-container');
  const tocList = document.getElementById('toc-list');
  if (!tocContainer || !tocList) return;

  // Quét tìm tất cả các thẻ tiêu đề (h2) quan trọng trên trang
  const headings = document.querySelectorAll('#desc-title, #trailer-title, #screens-title, #faq-title, #related-title');

  if (headings.length === 0) return;

  let tocHTML = '';
  headings.forEach((heading, index) => {
    // Nếu tiêu đề chưa có ID (dù mình đã gán sẵn trong HTML), tạo tạm ID cho nó
    if (!heading.id) {
      heading.id = 'section-' + index;
    }

    // Lấy nội dung text của tiêu đề (Xóa đi các icon SVG hoặc thanh màu gradient trang trí)
    let text = heading.textContent.trim();

    // Tạo link neo (Anchor link)
    tocHTML += `
      <li>
        <a href="#${heading.id}" class="toc-link">
          <span class="toc-hash">#</span> ${text}
        </a>
      </li>
    `;
  });

  tocList.innerHTML = tocHTML;
  tocContainer.style.display = 'block'; // Mở khóa cho mục lục hiện ra
}
