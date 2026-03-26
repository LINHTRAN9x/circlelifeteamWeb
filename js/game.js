// ============================================================
//  CircleLifeTeam — game.js
//  Logic cho trang chi tiết game (game.html)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const slug = getSlugFromURL();
  if (!slug) { window.location.href = 'index.html'; return; }
  await loadGameDetail(slug);
  initNavScroll();
});

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
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
          <br><a href="index.html" class="btn-primary" style="display:inline-flex;margin-top:16px">← Về trang chủ</a>
        </div>`;
      return;
    }
    updateSEO(game);
    renderGameDetail(game);
    loadRelatedGames(game);
  } catch (e) {
    console.error('Game detail error:', e);
  }
}

// ── SEO Meta Update ──
function updateSEO(game) {
  const h1 = document.getElementById('game-title');
  if (h1) h1.textContent = `${game.title} Việt Hóa PS5`;
  const title = `${game.title} Việt Hóa PS5 – Patch ${game.version || 'Mới Nhất'} | CircleLifeTeam`;
  const desc = `Tải về bản việt hóa ${game.title} (${game.titleVi || ''}) cho PS5. ${game.status || 'Hoàn thành'}. Bản dịch chất lượng cao bởi CircleLifeTeam.`;
  const keywords = `${game.title} việt hóa, ${game.title} ps5 tiếng việt, patch việt hóa ${game.title}, circlelifeteam ${game.title}`;

  document.title = title;
  setMeta('description', desc);
  setMeta('keywords', keywords);
  setOG('title', title);
  setOG('description', desc);
  setOG('image', game.coverImage || '');
  setOG('url', `${CONFIG.SITE_URL}/game.html?id=${game.slug}`);

  // JSON-LD structured data
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": game.title,
    "alternateName": game.titleVi,
    "description": game.descriptionVi || game.description,
    "gamePlatform": "PlayStation 5",
    "genre": game.genre,
    "image": game.coverImage,
    "url": `${CONFIG.SITE_URL}/game.html?id=${game.slug}`,
    "publisher": { "@type": "Organization", "name": "CircleLifeTeam" }
  };
  const ldScript = document.getElementById('json-ld');
  if (ldScript) ldScript.textContent = JSON.stringify(ld);

  // Update canonical
  const canonical = document.getElementById('canonical');
  if (canonical) canonical.href = `${CONFIG.SITE_URL}/game.html?id=${game.slug}`;

  // Update breadcrumb
  const bcGame = document.getElementById('bc-game');
  if (bcGame) bcGame.textContent = game.title;
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
  // Background blur
  const bg = document.getElementById('game-detail-bg');
  if (bg && game.coverImage) bg.style.backgroundImage = `url(${game.coverImage})`;

  // Cover
  const coverEl = document.getElementById('game-cover');
  if (coverEl) {
    if (game.coverImage) {
      coverEl.innerHTML = `<img src="${game.coverImage}" alt="${game.title}" onerror="this.parentElement.innerHTML='<div class=\\'game-detail-cover-placeholder\\'><span>🎮</span></div>'">`;
    } else {
      coverEl.innerHTML = '<div class="game-detail-cover-placeholder"><span>🎮</span></div>';
    }
  }

  // Badges
  const badgesEl = document.getElementById('game-detail-badges');
  if (badgesEl) {
    let html = `<span class="badge badge-platform">${game.platform || 'PS5'}</span>`;
    if (game.isNew) html += '<span class="badge badge-new">🔥 Mới</span>';
    if (game.status) html += `<span class="badge ${game.status.includes('100%') ? 'badge-done' : 'badge-wip'}">${game.status}</span>`;
    badgesEl.innerHTML = html;
  }

  // Title
  const titleEl = document.getElementById('game-title');
  if (titleEl) titleEl.textContent = game.title;
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
    ratingEl.innerHTML = Array.from({length: 5}, (_, i) =>
      `<span style="font-size:18px">${i < game.rating ? '⭐' : '☆'}</span>`
    ).join('') + `<span style="font-size:13px;color:var(--text-muted);margin-left:6px">${game.rating}/5</span>`;
  }

  // Download button
  const dlBtn = document.getElementById('download-btn');
  if (dlBtn) {
    if (game.downloadLink && game.downloadLink !== '#') {
      dlBtn.href = game.downloadLink;
      dlBtn.target = '_blank';
      dlBtn.rel = 'noopener noreferrer';
    } else {
      dlBtn.onclick = () => showToast('Link tải đang được cập nhật...', 'info');
      dlBtn.removeAttribute('href');
    }
  }

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
      screensEl.innerHTML = imgs.map((url, i) => `
        <div class="screenshot-item" onclick="openLightbox('${url}')">
          <img src="${url}" alt="${game.title} screenshot ${i+1}" loading="lazy"
            onerror="this.parentElement.style.display='none'">
        </div>
      `).join('');
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
  return `
    <div class="game-card" onclick="navigateToGame('${game.slug}')">
      <div class="game-card-thumb" style="aspect-ratio:3/4">${img}</div>
      <div class="game-card-body">
        <div class="game-card-title">${game.title}</div>
        ${game.titleVi ? `<div class="game-card-title-vi">${game.titleVi}</div>` : ''}
      </div>
    </div>`;
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
  window.location.href = `game.html?id=${slug}`;
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