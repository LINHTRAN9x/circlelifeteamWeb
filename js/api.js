// ============================================================
//  CircleLifeTeam — api.js
//  Xử lý gọi API Firebase
// ============================================================

const API = (() => {
  let cachedData = null;

  // Đọc dữ liệu từ Firebase
  async function getData() {
    if (cachedData) return cachedData;

    const localData = localStorage.getItem('clt_cache_data');
    const cacheTime = localStorage.getItem('clt_cache_time');
    const now = Date.now();
    const isAdmin = sessionStorage.getItem('clt_admin_token') === 'authenticated';

    if (!isAdmin && localData && cacheTime && (now - cacheTime < 3 * 60 * 1000)) {
      cachedData = JSON.parse(localData);
      console.log("🚀 Dùng dữ liệu từ Cache");
      return cachedData;
    }

    if (CONFIG.FIREBASE_DB_URL === "https://ten-du-an-cua-ban.firebaseio.com") {
      cachedData = JSON.parse(JSON.stringify(SAMPLE_DATA));
      return cachedData;
    }

    try {
      // Gọi API lấy dữ liệu dạng JSON từ Firebase
      const res = await fetch(`${CONFIG.FIREBASE_DB_URL}/.json`);
      if (!res.ok) throw new Error("Firebase fetch failed");
      let fetchedData = await res.json();

      // Nếu Database mới tinh chưa có gì, nạp dữ liệu mẫu
      if (!fetchedData || !fetchedData.games) {
        fetchedData = JSON.parse(JSON.stringify(SAMPLE_DATA));
      }

      cachedData = fetchedData;
      localStorage.setItem('clt_cache_data', JSON.stringify(cachedData));
      localStorage.setItem('clt_cache_time', Date.now().toString());

      return cachedData;
    } catch (e) {
      console.warn("Firebase unavailable, using sample data:", e);
      cachedData = JSON.parse(JSON.stringify(SAMPLE_DATA));
      return cachedData;
    }
  }

  // Ghi dữ liệu lên Firebase (chỉ admin có SECRET mới ghi được)
  async function saveData(data) {
  try {
    // Chờ Firebase Auth load xong (tránh race condition)
    const user = await new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) throw new Error("Chưa đăng nhập Firebase");
    const token = await user.getIdToken();

    const res = await fetch(`${CONFIG.FIREBASE_DB_URL}/.json?auth=${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Save failed");
    cachedData = data;
    return true;
  } catch (e) {
    console.error("Save error:", e);
    return false;
  }
}

  function clearCache() { 
    cachedData = null; 
    localStorage.removeItem('clt_cache_data');
    localStorage.removeItem('clt_cache_time');
  }

  // CRUD Helpers
  async function getGames() {
    const d = await getData();
    return d.games || [];
  }

  async function getGameBySlug(slug) {
    const games = await getGames();
    return games.find(g => g.slug === slug) || null;
  }

  async function saveGame(game) {
    const d = await getData();
    const idx = d.games.findIndex(g => g.id === game.id);
    if (idx >= 0) d.games[idx] = game;
    else d.games.unshift(game);
    return saveData(d);
  }

  async function deleteGame(id) {
    const d = await getData();
    d.games = d.games.filter(g => g.id !== id);
    return saveData(d);
  }

  async function getSettings() {
    const d = await getData();
    return d.settings || SAMPLE_DATA.settings;
  }

  async function saveSettings(settings) {
    const d = await getData();
    d.settings = settings;
    return saveData(d);
  }

  return { getData, saveData, clearCache, getGames, getGameBySlug, saveGame, deleteGame, getSettings, saveSettings };
})();

// MD5 hash (dùng cho admin auth)
function md5(string) {
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
  function md5blks(s) {
    const nblk = ((s.length + 64) >> 6) + 1;
    const blks = new Array(nblk * 16).fill(0);
    for (let i = 0; i < s.length; i++) blks[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    blks[s.length >> 2] |= 0x80 << ((s.length % 4) * 8);
    blks[nblk * 16 - 2] = s.length * 8;
    return blks;
  }
  const m = md5blks(string);
  let [a, b, c, d] = [1732584193, -271733879, -1732584194, 271733878];
  for (let i = 0; i < m.length; i += 16) {
    const [aa, bb, cc, dd] = [a, b, c, d];
    a = md5ff(a,b,c,d,m[i+0],7,-680876936); d=md5ff(d,a,b,c,m[i+1],12,-389564586); c=md5ff(c,d,a,b,m[i+2],17,606105819); b=md5ff(b,c,d,a,m[i+3],22,-1044525330);
    a=md5ff(a,b,c,d,m[i+4],7,-176418897); d=md5ff(d,a,b,c,m[i+5],12,1200080426); c=md5ff(c,d,a,b,m[i+6],17,-1473231341); b=md5ff(b,c,d,a,m[i+7],22,-45705983);
    a=md5ff(a,b,c,d,m[i+8],7,1770035416); d=md5ff(d,a,b,c,m[i+9],12,-1958414417); c=md5ff(c,d,a,b,m[i+10],17,-42063); b=md5ff(b,c,d,a,m[i+11],22,-1990404162);
    a=md5ff(a,b,c,d,m[i+12],7,1804603682); d=md5ff(d,a,b,c,m[i+13],12,-40341101); c=md5ff(c,d,a,b,m[i+14],17,-1502002290); b=md5ff(b,c,d,a,m[i+15],22,1236535329);
    a=md5gg(a,b,c,d,m[i+1],5,-165796510); d=md5gg(d,a,b,c,m[i+6],9,-1069501632); c=md5gg(c,d,a,b,m[i+11],14,643717713); b=md5gg(b,c,d,a,m[i+0],20,-373897302);
    a=md5gg(a,b,c,d,m[i+5],5,-701558691); d=md5gg(d,a,b,c,m[i+10],9,38016083); c=md5gg(c,d,a,b,m[i+15],14,-660478335); b=md5gg(b,c,d,a,m[i+4],20,-405537848);
    a=md5gg(a,b,c,d,m[i+9],5,568446438); d=md5gg(d,a,b,c,m[i+14],9,-1019803690); c=md5gg(c,d,a,b,m[i+3],14,-187363961); b=md5gg(b,c,d,a,m[i+8],20,1163531501);
    a=md5gg(a,b,c,d,m[i+13],5,-1444681467); d=md5gg(d,a,b,c,m[i+2],9,-51403784); c=md5gg(c,d,a,b,m[i+7],14,1735328473); b=md5gg(b,c,d,a,m[i+12],20,-1926607734);
    a=md5hh(a,b,c,d,m[i+5],4,-378558); d=md5hh(d,a,b,c,m[i+8],11,-2022574463); c=md5hh(c,d,a,b,m[i+11],16,1839030562); b=md5hh(b,c,d,a,m[i+14],23,-35309556);
    a=md5hh(a,b,c,d,m[i+1],4,-1530992060); d=md5hh(d,a,b,c,m[i+4],11,1272893353); c=md5hh(c,d,a,b,m[i+7],16,-155497632); b=md5hh(b,c,d,a,m[i+10],23,-1094730640);
    a=md5hh(a,b,c,d,m[i+13],4,681279174); d=md5hh(d,a,b,c,m[i+0],11,-358537222); c=md5hh(c,d,a,b,m[i+3],16,-722521979); b=md5hh(b,c,d,a,m[i+6],23,76029189);
    a=md5hh(a,b,c,d,m[i+9],4,-640364487); d=md5hh(d,a,b,c,m[i+12],11,-421815835); c=md5hh(c,d,a,b,m[i+15],16,530742520); b=md5hh(b,c,d,a,m[i+2],23,-995338651);
    a=md5ii(a,b,c,d,m[i+0],6,-198630844); d=md5ii(d,a,b,c,m[i+7],10,1126891415); c=md5ii(c,d,a,b,m[i+14],15,-1416354905); b=md5ii(b,c,d,a,m[i+5],21,-57434055);
    a=md5ii(a,b,c,d,m[i+12],6,1700485571); d=md5ii(d,a,b,c,m[i+3],10,-1894986606); c=md5ii(c,d,a,b,m[i+10],15,-1051523); b=md5ii(b,c,d,a,m[i+1],21,-2054922799);
    a=md5ii(a,b,c,d,m[i+8],6,1873313359); d=md5ii(d,a,b,c,m[i+15],10,-30611744); c=md5ii(c,d,a,b,m[i+6],15,-1560198380); b=md5ii(b,c,d,a,m[i+13],21,1309151649);
    a=md5ii(a,b,c,d,m[i+4],6,-145523070); d=md5ii(d,a,b,c,m[i+11],10,-1120210379); c=md5ii(c,d,a,b,m[i+2],15,718787259); b=md5ii(b,c,d,a,m[i+9],21,-343485551);
    a=safeAdd(a,aa); b=safeAdd(b,bb); c=safeAdd(c,cc); d=safeAdd(d,dd);
  }
  const hex = [a,b,c,d].map(v => {
    let h = "";
    for (let i = 0; i < 4; i++) h += ("0" + ((v >> (i*8)) & 0xff).toString(16)).slice(-2);
    return h;
  }).join("");
  return hex;
}