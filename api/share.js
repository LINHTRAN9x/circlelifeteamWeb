// Thay đổi link thành nhà mới Firebase
const FIREBASE_DB_URL = 'https://circlelifeteam-default-rtdb.asia-southeast1.firebasedatabase.app';

// Hàm gọt sạch thẻ HTML, gom chữ và bọc giáp (Escape) chống vỡ thẻ Meta
function stripHTML(html) {
  if (!html) return '';
  let text = html
    .replace(/<[^>]+>/g, ' ')   // 1. Quét sạch mọi thẻ HTML (Regex chuẩn hơn)
    .replace(/&nbsp;/g, ' ')     // 2. Dọn khoảng trắng dị
    .replace(/\s+/g, ' ')        // 3. Gom nhiều dấu cách thành 1
    .trim();
  
  // 4. Cắt ngắn gọn khoảng 140 ký tự
  if (text.length > 340) {
    text = text.substring(0, 340) + '...';
  }
  
  // 5. QUAN TRỌNG NHẤT: Bọc giáp các dấu ngoặc kép, ngoặc đơn để không làm nổ thẻ <meta>
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  const slug = req.query.id;
  if (!slug) return res.redirect('/');

  let game = null;
  try {
    const r = await fetch(`${FIREBASE_DB_URL}/.json`);
    const data = await r.json();
    game = (data.games || []).find(g => g.slug === slug);
  } catch (e) {
    console.error('Fetch error:', e);
    return res.redirect('/');
  }

  if (!game) return res.redirect('/');

  // Lọc nội dung
  const cleanDescVi = stripHTML(game.descriptionVi);

  // Thoát ngoặc kép cho cả Title để an toàn tuyệt đối
  const title = `${game.title} Việt Hóa – CircleLifeTeam`.replace(/"/g, '&quot;');
  const desc  = `Tải bản việt hóa ${game.title} cho ${game.platform}. ${game.status || ''}. ${cleanDescVi}`;
  const image = game.coverImage || 'https://i.ibb.co/j90KpF3x/gdyt4q4jhynd1-1.png';
  const url   = `https://circlelifeteam.top/share/${slug}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:type"         content="article">
  <meta property="og:title"        content="${title}">
  <meta property="og:description"  content="${desc}">
  <meta property="og:image"        content="${image}">
  <meta property="og:url"          content="${url}">
  <meta property="og:site_name"    content="CircleLifeTeam">
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image"       content="${image}">
  <link rel="canonical"            href="${url}">
</head>
<body>
  <script>window.location.replace('/game.html?id=${slug}');</script>
</body>
</html>`);
}