export default async function handler(req, res) {
    const { id } = req.query;

    // 1. 👉 BẠN HÃY MỞ FILE js/config.js LÊN, COPY MÃ BIN_ID VÀ API_KEY VÀO 2 DÒNG DƯỚI ĐÂY:
    const BIN_ID = "69c523b6aa77b81da920101b"; 
    const API_KEY = "$2a$10$crwiwth7.WytFIBWMl2BaO62qFxJiIG5EX5nYcGxEScYtq13Dmm/q";

    try {
        // 2. Kéo dữ liệu từ JSONBin (Giống hệt cách file api.js của bạn đang làm)
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: {
                "X-Master-Key": API_KEY,
                "X-Bin-Meta": "false"
            }
        });

        if (!response.ok) throw new Error("Không thể kết nối đến JSONBin");
        
        const data = await response.json();
        const games = data.games || []; // Lấy mảng games từ database

        // 3. Tìm game theo ID (slug)
        const game = games.find(g => g.slug === id);

        // Nếu người ta gõ sai tên game, tự động đá về trang chủ
        if (!game) {
            return res.redirect(302, '/');
        }

        // 4. Tạo ra HTML động chứa chuẩn SEO đưa cho Discord/Facebook
        const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>${game.title} Việt Hóa PS5 – Patch Mới Nhất | CircleLifeTeam</title>
            <meta name="description" content="Tải bản việt hóa ${game.title} cho PS5. ${game.descriptionVi || 'Bản dịch chất lượng cao.'}">
            
            <meta property="og:title" content="${game.title} Việt Hóa PS5 | CircleLifeTeam">
            <meta property="og:description" content="Tiến độ: ${game.status || 'Hoàn thành'}. ${game.descriptionVi || ''}">
            <meta property="og:image" content="${game.coverImage}">
            <meta property="og:url" content="https://circlelifeteam.top/share/${game.slug}">
            <meta property="og:type" content="website">
            <meta name="theme-color" content="#FFC312">

            <script>
                // Trượt mượt mà sang giao diện chính của bạn
                window.location.replace("/game.html?id=${game.slug}");
            </script>
        </head>
        <body style="background: #F4F5F0; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h3>Đang tải dữ liệu ${game.title}...</h3>
        </body>
        </html>
        `;

        // 5. Trả kết quả về
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (error) {
        console.error("Lỗi API Share:", error);
        return res.redirect(302, '/'); // Lỗi mạng thì cho về trang chủ
    }
}