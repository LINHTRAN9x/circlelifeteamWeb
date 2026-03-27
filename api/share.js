const JSONBIN_API_KEY = '$2a$10$crwiwth7.WytFIBWMl2BaO62qFxJiIG5EX5nYcGxEScYtq13Dmm/q';
const JSONBIN_BIN_ID  = '69c523b6aa77b81da920101b';

export default async function handler(req, res) {
  const slug = req.query.id;
  if (!slug) return res.redirect('/');

  let game = null;
  try {
    const r = await fetch(
      `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`,
      { headers: { 'X-Master-Key': JSONBIN_API_KEY, 'X-Bin-Meta': 'false' } }
    );
    const data = await r.json();
    game = (data.games || []).find(g => g.slug === slug);
  } catch (e) {}

  if (!game) return res.redirect('/');

  const title = `${game.title} Việt Hóa – CircleLifeTeam`;
  const desc  = `Tải bản việt hóa ${game.title} cho PS5. ${game.status || ''}`;
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
  <meta name="twitter:image"       content="${image}">
  <link rel="canonical"            href="${url}">
  <meta http-equiv="refresh" content="0;url=/game.html?id=${slug}">
</head>
<body>
  <script>window.location.replace('/game.html?id=${slug}');</script>
</body>
</html>`);
}