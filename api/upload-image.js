// api/upload-image.js

export default async function handler(req, res) {
  // Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKeys = [
    process.env.IMGBB_KEY_1,
    process.env.IMGBB_KEY_2,
    process.env.IMGBB_KEY_3,
  ].filter(Boolean); // Lọc bỏ key undefined nếu chưa cài

  if (apiKeys.length === 0) {
    return res.status(500).json({ error: 'Chưa cấu hình IMGBB_KEY trong Vercel Environment Variables' });
  }

  const { base64, name } = req.body;
  if (!base64) {
    return res.status(400).json({ error: 'Thiếu trường base64' });
  }

  // Thử lần lượt từng key (xoay vòng như logic cũ)
  let lastError = '';
  for (const apiKey of apiKeys) {
    try {
      const formData = new URLSearchParams();
      formData.append('image', base64);
      if (name) formData.append('name', name);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Chỉ trả về URL, không trả gì khác
        return res.status(200).json({ url: result.data.url });
      } else {
        lastError = result.error?.message || 'Lỗi không xác định từ ImgBB';
      }
    } catch (e) {
      lastError = e.message;
    }
  }

  // Hết key mà vẫn lỗi
  return res.status(500).json({ error: `Thử hết ${apiKeys.length} key vẫn lỗi: ${lastError}` });
}