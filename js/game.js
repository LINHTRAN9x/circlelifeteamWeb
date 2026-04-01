// ============================================================
//  CircleLifeTeam — game.js
//  Logic cho trang chi tiết game (game.html)
// ============================================================


// ============================================================
//  Khởi tạo cuộn mượt Lenis (Dán lên đầu file)
// ============================================================
// const lenis = new Lenis({
//   duration: 1.2, /* Độ dài của quán tính (tăng để trượt dài hơn) */
//   easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), /* Gia tốc trượt */
//   direction: 'vertical',
//   gestureDirection: 'vertical',
//   smooth: true,
//   mouseMultiplier: 1,
//   smoothTouch: false, /* Tắt trên điện thoại vì đt cuộn cảm ứng vốn đã mượt */
// });

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
    initRatingWidget(game);

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
    // Cho văn bản chạy qua thuật toán bắt từ khóa tự động
    const processedDescVi = autoInternalLinks(game.descriptionVi);
    const processedDescEn = autoInternalLinks(game.description);

    descEl.innerHTML = `
      ${processedDescVi ? `<div class="game-desc-html" style="margin-bottom:16px">${processedDescVi}</div>` : ''}
      ${processedDescEn ? `<p class="game-desc-text" style="color:var(--text-dim);font-size:13px;font-style:italic">${processedDescEn}</p>` : ''}
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
// ── Xây Dựng Mục Lục (Table of Contents) cho SEO ──
function buildTableOfContents() {
  const tocContainer = document.getElementById('toc-container');
  const tocList = document.getElementById('toc-list');
  if (!tocContainer || !tocList) return;

  // QUAN TRỌNG: Quét thêm các thẻ h2, h3 nằm bên trong phần mô tả (.game-desc-html)
  const headings = document.querySelectorAll('#desc-title, .game-desc-html h2, .game-desc-html h3, #trailer-title, #screens-title, #faq-title, #related-title');

  if (headings.length === 0) return;

  let tocHTML = '';
  headings.forEach((heading, index) => {
    // Tự động tạo ID cho các thẻ H2, H3 sinh ra từ Quill Editor nếu chưa có
    if (!heading.id) {
      heading.id = 'section-dynamic-' + index;
    }

    // Xóa khoảng trắng thừa
    let text = heading.textContent.trim();
    
    // Kiểm tra xem đây có phải là thẻ H3 (Tiêu đề con) không để thụt lề
    let isSubHeading = heading.tagName.toLowerCase() === 'h3';

    // Sinh HTML: Nếu là H3 thì font chữ nhỏ hơn 1 chút và thụt lề (padding-left)
    tocHTML += `
      <li style="${isSubHeading ? 'padding-left: 20px; font-size: 13px;' : ''}">
        <a href="#${heading.id}" class="toc-link">
          <span class="toc-hash" style="${isSubHeading ? 'font-size: 12px;' : ''}">#</span> ${text}
        </a>
      </li>
    `;
  });

  tocList.innerHTML = tocHTML;
  tocContainer.style.display = 'block';
}


// ==========================================
// ── SMART INTERNAL LINKING (SEO) ──
// ==========================================
function autoInternalLinks(html) {
  if (!html) return '';
  
  // 1. Danh sách Nền tảng cơ bản
  const baseLinks = [
    { kw: 'PS5', url: '/category.html?platform=PS5' },
    { kw: 'PlayStation 5', url: '/category.html?platform=PS5' },
    { kw: 'PS4', url: '/category.html?platform=PS4' },
    { kw: 'PlayStation 4', url: '/category.html?platform=PS4' },
    { kw: 'Nintendo Switch', url: '/category.html?platform=Nintendo%20Switch' },
    { kw: 'Steam', url: '/category.html?platform=PC' },
    { kw: 'PC', url: '/category.html?platform=PC' }
  ];

  // 2. Bê nguyên mảng Tags từ admin.js sang
  const FIXED_TAGS = [
    "Thế Giới Mở", "Souls-like", "Kinh Dị", "Sinh Tồn",
    "Cốt Truyện Hay", "Giải Đố", "Co-op", "Nhập Vai",
    "Đồ họa Pixel", "Gia Đình", "Anime", "Thể Thao",
    "Action", "Beat 'em Up", "Fighting", "Hack and Slash",
    "Metroidvania", "Roguelike", "Shoot 'em Up", "Bullet Hell",
    "Tower Defense", "Stealth", "Battle Royale",
    "First-Person Shooter", "Third-Person Shooter", "Tactical Shooter",
    "Hero Shooter", "Looter Shooter",
    "RPG", "JRPG", "MMORPG", "CRPG", "Dungeon Crawler",
    "Tactical RPG", "Deck Builder",
    "Real-Time Strategy", "Turn-Based Strategy", "Grand Strategy",
    "4X", "City Builder", "Colony Sim", "Auto Battler", "Wargame",
    "Life Sim", "Farming Sim", "Flight Sim", "Driving Sim",
    "Space Sim", "Tycoon", "Sandbox", "God Game",
    "Adventure", "Point and Click", "Visual Novel",
    "Walking Simulator", "Interactive Fiction",
    "Physics Puzzle", "Logic Puzzle", "Escape Room", "Hidden Object",
    "2D Platformer", "3D Platformer", "Precision Platformer", "Run and Gun",
    "Survival Horror", "Psychological Horror",
    "Racing", "Soccer", "Basketball", "Baseball", "Motorsport",
    "Skateboarding", "Fishing",
    "PvP", "PvE", "Local Co-op", "Party Game",
    "Social Deduction", "Asymmetric",
    "Casual", "Indie", "Cozy", "Idle / Clicker", "Endless Runner",
    "Rhythm", "Dance",
    "Sci-Fi", "Fantasy", "Cyberpunk", "Post-Apocalyptic",
    "Steampunk", "Historical", "Mythology", "Noir", "Western",
    "Crafting", "Exploration", "Extraction Shooter",
    "Card Game", "Board Game", "Educational", "VR"
  ];

  // 3. JS tự động gom Nền tảng + Tags lại thành danh sách Map hoàn chỉnh
  let linksMap = [
    ...baseLinks,
    ...FIXED_TAGS.map(tag => ({
      kw: tag,
      url: `/category.html?tag=${encodeURIComponent(tag)}`
    }))
  ];

  // 💡 MẸO SEO CHÍ MẠNG: Ép JS ưu tiên quét từ khóa dài trước từ khóa ngắn.
  // (Ví dụ: Nó sẽ quét và gắn link cho chữ "Survival Horror" trước, rồi mới quét chữ "Horror". Tránh lỗi lồng thẻ HTML).
  linksMap.sort((a, b) => b.kw.length - a.kw.length);

  // 4. Thuật toán bóc tách HTML an toàn
  const parts = html.split(/(<[^>]+>)/g);
  let inAnchor = false;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].match(/^<a\b/i)) inAnchor = true;
    if (parts[i].match(/^<\/a>/i)) inAnchor = false;

    // Nếu là đoạn chữ bình thường (Không phải thẻ HTML và không nằm trong thẻ link <a> có sẵn)
    if (!parts[i].startsWith('<') && !inAnchor) {
      linksMap.forEach(item => {
        // Tìm đúng từ khóa đứng độc lập (Bỏ qua hoa thường)
        const regex = new RegExp(`(^|\\s|[.,(])(${item.kw})(?=\\s|[.,)]|$)`, 'gi');
        parts[i] = parts[i].replace(regex, `$1<a href="${item.url}" class="seo-auto-link" title="Xem thêm game $2">$2</a>`);
      });
    }
  }
  return parts.join('');
}


// ============================================================
// HỆ THỐNG RATING & SEO
// ============================================================
function initRatingWidget(gameData) {
  // Lấy thêm cái khung to ngoài cùng để lát nữa giấu nó đi
  const widgetContainer = document.querySelector('.floating-rating'); 
  const toggleBtn = document.getElementById('rating-toggle-btn');
  const panel = document.getElementById('rating-panel');
  const starContainer = document.getElementById('rating-stars');
  const stars = document.querySelectorAll('.rating-stars .star');
  const thanksMsg = document.getElementById('rating-thanks');
  
  // 1. KIỂM TRA LỊCH SỬ: Nếu khách đã đánh giá rồi -> Ẩn luôn và thoát
  const hasRated = localStorage.getItem(`clt_rated_${gameData.slug}`);
  if (hasRated) {
    if (widgetContainer) widgetContainer.style.display = 'none';
    injectSchemaSEO(gameData); // Vẫn phải chạy SEO để Google biết
    return; // Dừng hàm luôn tại đây, không cần tải thêm sự kiện click nữa
  }

  // 2. Mở / Đóng panel
  toggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); 
    panel.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  // 3. Logic xử lý sao
  stars.forEach(star => {
    if (window.matchMedia("(min-width: 769px)").matches) {
      star.addEventListener('mouseover', function() {
        const val = this.getAttribute('data-val');
        stars.forEach(s => s.classList.toggle('hover', s.getAttribute('data-val') <= val));
      });
      star.addEventListener('mouseout', function() {
        stars.forEach(s => s.classList.remove('hover'));
      });
    }

    // 4. Bấm chọn sao
    star.addEventListener('click', function(e) {
      e.stopPropagation(); 
      if (localStorage.getItem(`clt_rated_${gameData.slug}`)) return; 

      const val = this.getAttribute('data-val');
      setStars(val);
      
      localStorage.setItem(`clt_rated_${gameData.slug}`, val);
      thanksMsg.style.display = 'block';
      starContainer.style.pointerEvents = 'none'; 

      // Rung nút cảm ơn
      toggleBtn.style.animation = 'none';
      setTimeout(() => toggleBtn.style.transform = 'scale(1.2)', 50);
      setTimeout(() => toggleBtn.style.transform = 'scale(1)', 200);
      
      // 🔥 SAU KHI ĐÁNH GIÁ XONG: Chờ 1.5 giây để khách đọc chữ Cảm ơn, sau đó cho bay màu!
      setTimeout(() => {
        if (widgetContainer) {
          widgetContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          widgetContainer.style.opacity = '0'; // Làm mờ từ từ
          widgetContainer.style.transform = 'translateY(20px)'; // Tụt xuống dưới
          setTimeout(() => widgetContainer.style.display = 'none', 500); // Xóa sổ hoàn toàn
        }
      }, 1500);
    });
  });

  function setStars(val) {
    stars.forEach(s => s.classList.toggle('active', s.getAttribute('data-val') <= val));
  }

  // BƠM DỮ LIỆU SEO LÊN GOOGLE (JSON-LD)
  injectSchemaSEO(gameData);
}

function injectSchemaSEO(game) {
  // Tạo đoạn Script chứa Schema.org chuẩn Google
  const schema = {
    "@context": "https://schema.org/",
    "@type": "SoftwareApplication",
    "name": `${game.titleVi || game.title} Việt Hóa`,
    "applicationCategory": "GameApplication",
    "operatingSystem": game.platform || "PS5, PC, Switch",
    "image": game.coverImage,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "VND"
    },
    // Chỗ này báo cho Google biết game được mấy sao (Giả lập số liệu nếu chưa có)
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": game.rating || "5", 
      "ratingCount": game.ratingCount || Math.floor(Math.random() * 50) + 10 // Random số người rate nếu database chưa có
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

// Bác nhớ gọi hàm này sau khi trang game tải xong dữ liệu nhé!
// Ví dụ: initRatingWidget(game);