// Thay đổi link thành nhà mới Firebase
const FIREBASE_DB_URL = 'https://circlelifeteam-default-rtdb.asia-southeast1.firebasedatabase.app';

// Hàm gọt sạch thẻ HTML và làm gọn chữ
function stripHTML(html) {
  if (!html) return '';
  // Xóa mọi thẻ <...>, đổi &nbsp; thành dấu cách, và gom khoảng trắng thừa
  let text = html.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  // Cắt ngắn gọn khoảng 140 ký tự cho chuẩn đẹp trên Discord/Facebook
  if (text.length > 140) {
    text = text.substring(0, 140) + '...';
  }
  return text;
}

export default async function handler(req, res) {
  const slug = req.query.id;
  if (!slug) return res.redirect('/');

  let game = null;
  try {
    // Gọi API sang Firebase thay vì JSONBin
    const r = await fetch(`${FIREBASE_DB_URL}/.json`);
    const data = await r.json();
    game = (data.games || []).find(g => g.slug === slug);
  } catch (e) {
    console.error('Fetch error:', e);
    return res.redirect('/');
  }

  // Nếu Firebase không có game này thì mới bị văng về trang chủ
  if (!game) return res.redirect('/');

  // Lọc sạch nội dung HTML từ Editor
  const cleanDescVi = stripHTML(game.descriptionVi);

  const title = `${game.title} Việt Hóa – CircleLifeTeam`;
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