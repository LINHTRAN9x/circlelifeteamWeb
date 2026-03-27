// ============================================================
//  CircleLifeTeam — config.js
//  Cấu hình JSONBin.io API
// ============================================================

const CONFIG = {
  JSONBIN_BIN_ID: "69c523b6aa77b81da920101b",
  JSONBIN_API_KEY: "$2a$10$crwiwth7.WytFIBWMl2BaO62qFxJiIG5EX5nYcGxEScYtq13Dmm/q",
  JSONBIN_BASE_URL: "https://api.jsonbin.io/v3",

  // Tên website
  SITE_NAME: "CircleLifeTeam",
  SITE_URL: "https://circlelifeteam.top",
  SITE_DESCRIPTION: "Website việt hóa game PS5 hàng đầu Việt Nam – bản dịch chất lượng cao từ đội ngũ CircleLifeTeam",
  SITE_KEYWORDS: "game ps5 việt hóa, việt hóa ps5, bản dịch ps5, patch việt hóa, circlelifeteam, game ps5 tiếng việt, chép game việt hóa ps4 ps5, tải game việt hóa ps4",

  ADMIN_PASS_HASH: "0d9bfb393d6aa97a2736a1876739d6c4",
};

// Dữ liệu mẫu (fallback khi chưa có JSONBin)
const SAMPLE_DATA = {
  games: [
    {
      id: "ghost-of-tsushima",
      slug: "ghost-of-tsushima",
      title: "Ghost of Tsushima",
      titleVi: "Bóng Ma Tsushima",
      description: "Ghost of Tsushima is an open-world action-adventure game set in feudal Japan during the first Mongol invasion of Japan in 1274.",
      descriptionVi: "Ghost of Tsushima là game hành động thế giới mở lấy bối cảnh Nhật Bản phong kiến trong cuộc xâm lược đầu tiên của quân Mông Cổ năm 1274. Bạn sẽ vào vai samurai Jin Sakai, người duy nhất còn sống sót để bảo vệ đảo Tsushima.",
      coverImage: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/3a2f4a8c77ff64b2d98a98c3bcdb1b7d7ae9aa66e5a14eb7.png",
      images: [
        "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/3a2f4a8c77ff64b2d98a98c3bcdb1b7d7ae9aa66e5a14eb7.png",
        "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/3a2f4a8c77ff64b2d98a98c3bcdb1b7d7ae9aa66e5a14eb7.png"
      ],
      youtubeId: "nvjJGXBnBi4",
      downloadLink: "#",
      isNew: true,
      isFeatured: true,
      genre: "Action-Adventure",
      platform: "PS5",
      releaseDate: "2024-03-15",
      version: "v1.2",
      translator: "CircleLife Team",
      status: "Hoàn thành 100%",
      rating: 5
    },
    {
      id: "god-of-war-ragnarok",
      slug: "god-of-war-ragnarok",
      title: "God of War Ragnarök",
      titleVi: "Chúa Tể Chiến Tranh: Ragnarök",
      description: "God of War Ragnarök is an action-adventure game. It is the sequel to God of War (2018) and the ninth installment in the God of War series.",
      descriptionVi: "God of War Ragnarök là game hành động phiêu lưu, tiếp nối câu chuyện của God of War 2018. Kratos và Atreus phải đối mặt với Ragnarök – ngày tàn của thế giới theo thần thoại Bắc Âu.",
      coverImage: "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi88QSEl3AUcSARXb.png",
      images: [
        "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi88QSEl3AUcSARXb.png"
      ],
      youtubeId: "EE-4GvjKcfs",
      downloadLink: "#",
      isNew: false,
      isFeatured: true,
      genre: "Action-Adventure",
      platform: "PS5",
      releaseDate: "2023-11-20",
      version: "v1.0",
      translator: "CircleLife Team",
      status: "Hoàn thành 100%",
      rating: 5
    },
    {
      id: "spider-man-2",
      slug: "spider-man-2",
      title: "Marvel's Spider-Man 2",
      titleVi: "Người Nhện 2",
      description: "Marvel's Spider-Man 2 is a 2023 action-adventure game developed by Insomniac Games and published by Sony Interactive Entertainment.",
      descriptionVi: "Marvel's Spider-Man 2 là game hành động phiêu lưu 2023 do Insomniac Games phát triển. Chơi với cả Peter Parker và Miles Morales trong thành phố New York rộng lớn.",
      coverImage: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b3a0c5c8f2d4b9e6f8a2b1d3c4e5f.jpg",
      images: [],
      youtubeId: "oJQZdNfyIwI",
      downloadLink: "#",
      isNew: true,
      isFeatured: false,
      genre: "Action-Adventure",
      platform: "PS5",
      releaseDate: "2024-01-10",
      version: "v1.1",
      translator: "CircleLife Team",
      status: "Đang dịch 70%",
      rating: 4
    },
    {
      id: "final-fantasy-xvi",
      slug: "final-fantasy-xvi",
      title: "Final Fantasy XVI",
      titleVi: "Final Fantasy XVI",
      description: "Final Fantasy XVI is an action role-playing game developed and published by Square Enix.",
      descriptionVi: "Final Fantasy XVI là game nhập vai hành động do Square Enix phát triển. Đây là phần game thứ 16 trong series Final Fantasy huyền thoại, với cốt truyện đậm màu chính trị và chiến tranh.",
      coverImage: "https://image.api.playstation.com/vulcan/ap/rnd/202304/0612/7d16effe4d2e36b1f24b63e1e01ccc9bdea21bc41e11dd3c.png",
      images: [],
      youtubeId: "mSNAm_Wc3-k",
      downloadLink: "#",
      isNew: false,
      isFeatured: false,
      genre: "RPG",
      platform: "PS5",
      releaseDate: "2023-09-05",
      version: "v1.0",
      translator: "CircleLife Team",
      status: "Hoàn thành 100%",
      rating: 5
    },
    {
      id: "hogwarts-legacy",
      slug: "hogwarts-legacy",
      title: "Hogwarts Legacy",
      titleVi: "Di Sản Hogwarts",
      description: "Hogwarts Legacy is an action role-playing game set in the wizarding world of Harry Potter.",
      descriptionVi: "Hogwarts Legacy là game nhập vai hành động đặt trong thế giới phù thủy Harry Potter. Khám phá trường Hogwarts và thế giới ma thuật vào thế kỷ 19.",
      coverImage: "https://image.api.playstation.com/vulcan/ap/rnd/202209/2716/CqKlIAmVgbSTRSjV89GkG4Pt.png",
      images: [],
      youtubeId: "1O6Qstncpnc",
      downloadLink: "#",
      isNew: false,
      isFeatured: false,
      genre: "RPG",
      platform: "PS5",
      releaseDate: "2023-06-20",
      version: "v1.0",
      translator: "CircleLife Team",
      status: "Hoàn thành 100%",
      rating: 4
    },
    {
      id: "elden-ring",
      slug: "elden-ring",
      title: "Elden Ring",
      titleVi: "Nhẫn Kỳ Cổ",
      description: "Elden Ring is an action role-playing game developed by FromSoftware.",
      descriptionVi: "Elden Ring là game nhập vai hành động do FromSoftware phát triển, hợp tác cùng George R.R. Martin. Khám phá vùng Đất Giữa huyền bí với vô số quái vật và boss khó nhằn.",
      coverImage: "https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png",
      images: [],
      youtubeId: "E3Huy2cdih0",
      downloadLink: "#",
      isNew: false,
      isFeatured: false,
      genre: "Action RPG",
      platform: "PS5",
      releaseDate: "2023-04-01",
      version: "v1.0",
      translator: "CircleLife Team",
      status: "Hoàn thành 100%",
      rating: 5
    }
  ],
  settings: {
    heroTitle: "Việt Hóa Game PS5 Chất Lượng Cao",
    heroSubtitle: "CircleLifeTeam – Đưa ngôn ngữ Việt vào từng tựa game PS5",
    discordLink: "#",
    facebookLink: "#",
    youtubeLink: "#"
  }
};