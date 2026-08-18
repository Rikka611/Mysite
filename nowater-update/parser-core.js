/* ============================================================================
 * NowaterParser — 去水印解析核心（浏览器 / Node 双端通用，零依赖）
 *
 * 支持平台：
 *   douyin   抖音（分享链接 → 无水印视频/图文）
 *   bilibili B站（分享链接 → 单文件 MP4，免登录最高 720p）
 *
 * 抖音方案（2026 年验证有效）：
 *   1. 解析分享链接得到 aweme_id
 *   2. ttwid.bytedance.com 注册 ttwid（Set-Cookie）
 *   3. mcs.zijieapi.com/webid 注册 webid（绑定 ttwid）
 *   4. 对查询串做 md5 → X-Bogus 签名（frontierSign 等价算法）
 *   5. 请求 aweme/v1/web/aweme/detail/ 拿到完整视频数据
 *   （X-Bogus 算法参考开源逆向工程实现，Apache-2.0 相关社区成果）
 * ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------- 基础工具 ------------------------------- */

  const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
  const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  // ---------- MD5（纯 JS，字节数组进出） ----------
  const MD5_K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];
  const MD5_S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const MD5_M = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    1, 6, 11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12,
    5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2,
    0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9,
  ];
  function md5Bytes(data) {
    const bytes = Array.from(data);
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 0; i < 8; i++) bytes.push(Math.floor(bitLen / Math.pow(2, 8 * i)) & 0xff);
    const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let chunk = 0; chunk < bytes.length; chunk += 64) {
      const w = new Array(16);
      for (let i = 0; i < 16; i++) {
        w[i] = (bytes[chunk + i * 4]) | (bytes[chunk + i * 4 + 1] << 8) | (bytes[chunk + i * 4 + 2] << 16) | (bytes[chunk + i * 4 + 3] << 24);
      }
      let A = a0, B = b0, C = c0, D = d0;
      for (let j = 0; j < 64; j++) {
        let F, g;
        if (j < 16) { F = (B & C) | (~B & D); g = j; }
        else if (j < 32) { F = (D & B) | (~D & C); g = MD5_M[j]; }
        else if (j < 48) { F = B ^ C ^ D; g = MD5_M[j]; }
        else { F = C ^ (B | ~D); g = MD5_M[j]; }
        F = (F + A + MD5_K[j] + w[g]) >>> 0;
        A = D; D = C; C = B;
        B = (B + rotl(F, MD5_S[j])) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    const out = [];
    for (const v of [a0, b0, c0, d0]) {
      for (let i = 0; i < 4; i++) out.push((v >>> (8 * i)) & 0xff);
    }
    return out;
  }
  function md5HexFromBytes(bytes) {
    let hex = '';
    for (const b of bytes) hex += (b < 16 ? '0' : '') + b.toString(16);
    return hex;
  }
  function md5HexFromString(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
      else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
    }
    return md5HexFromBytes(md5Bytes(bytes));
  }
  function hexToBytes(hex) {
    const out = [];
    for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
    return out;
  }

  // ---------- X-Bogus（抖音 web 签名） ----------
  function rc4Bytes(key, data) {
    const S = [];
    for (let i = 0; i < 256; i++) S[i] = i;
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + key[i % key.length]) & 0xff;
      const t = S[i]; S[i] = S[j]; S[j] = t;
    }
    let i = 0; j = 0;
    const out = [];
    for (let n = 0; n < data.length; n++) {
      i = (i + 1) & 0xff;
      j = (j + S[i]) & 0xff;
      const t = S[i]; S[i] = S[j]; S[j] = t;
      out.push(data[n] ^ S[(S[i] + S[j]) & 0xff]);
    }
    return out;
  }
  const XB64_S1 = 'Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=';
  function dyBase64(data, pad) {
    let out = '';
    let i = 0;
    while (i < data.length) {
      const c1 = data[i++];
      const c2 = i < data.length ? data[i++] : null;
      const c3 = i < data.length ? data[i++] : null;
      const combined = ((c1 & 0xff) << 16) | (c2 !== null ? (c2 & 0xff) << 8 : 0) | (c3 !== null ? (c3 & 0xff) : 0);
      out += XB64_S1[(combined >> 18) & 0x3f];
      out += XB64_S1[(combined >> 12) & 0x3f];
      out += c2 !== null ? XB64_S1[(combined >> 6) & 0x3f] : pad;
      out += c3 !== null ? XB64_S1[combined & 0x3f] : pad;
    }
    return out;
  }
  function xcrypto(padString, ostring) {
    const uarray = new Array(ostring.length + 1);
    let ieor = 0;
    for (let i = 0; i < ostring.length; i++) { uarray[i] = ostring[i]; ieor ^= ostring[i]; }
    uarray[ostring.length] = ieor;
    const randomKey = Math.floor(Math.random() * 256);
    const crypted = rc4Bytes([randomKey], uarray);
    const bytes = [padString, randomKey].concat(crypted);
    return dyBase64(bytes, '=');
  }
  const xbState = { bogusIndex: 0, envcode: 1 };
  function xbogusFun(protocol, reventFlag, arg3, inSalt, dataHex) {
    const dataBytes = hexToBytes(dataHex);
    const inSaltBytes = [];
    for (let i = 0; i < (inSalt || '').length; i++) inSaltBytes.push((inSalt || '').charCodeAt(i) & 0xff);
    const inSaltMd5Md5 = md5Bytes(md5Bytes(inSaltBytes));
    const uArray = new Array(9);
    const padString = ((protocol << 6) | (reventFlag << 5) | ((Math.floor(Math.random() * 100) & 1) << 4) | 0) & 0xff;
    xbState.bogusIndex = (xbState.bogusIndex + 1) & 0x3f;
    uArray[0] = (arg3 << 6) | xbState.bogusIndex;
    uArray[1] = (xbState.envcode >> 8) & 255;
    uArray[2] = xbState.envcode & 255;
    uArray[3] = 0;
    uArray[4] = inSaltMd5Md5[14];
    uArray[5] = inSaltMd5Md5[15];
    const dataMd5 = md5Bytes(dataBytes);
    uArray[6] = dataMd5[14];
    uArray[7] = dataMd5[15];
    uArray[8] = Math.floor(Math.random() * 255) & 255;
    return xcrypto(padString, uArray);
  }
  function makeXBogus(queryString) {
    return xbogusFun(1, 0, 0, null, md5HexFromString(queryString));
  }

  /* ------------------------------- HTTP 工具 ------------------------------- */

  // 可插拔 fetch：App 内通过 /api/fetch 代理绕过 WebView 跨域限制（解析逻辑仍可热更新）
  let fetchImpl = null;
  function httpFetch(url, opts) {
    return fetchImpl ? fetchImpl(url, opts) : fetch(url, opts);
  }

  function collectSetCookies(headers) {
    const out = [];
    try {
      const list = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
      for (const c of list) out.push(c.split(';')[0]);
    } catch (e) { /* ignore */ }
    if (!out.length) {
      const raw = headers.get('set-cookie');
      if (raw) {
        for (const part of raw.split(/,(?=[^;=]+=)/)) out.push(part.trim().split(';')[0]);
      }
    }
    return out;
  }

  async function followRedirects(url, ua, maxHops) {
    const cookies = [];
    let cur = /^https?:/i.test(url) ? url : 'https://' + url;
    for (let i = 0; i < (maxHops || 10); i++) {
      const r = await httpFetch(cur, {
        redirect: 'manual',
        headers: { 'User-Agent': ua || UA_PC, 'Cookie': cookies.join('; ') },
      });
      for (const c of collectSetCookies(r.headers)) {
        if (!cookies.some(x => x.split('=')[0] === c.split('=')[0])) cookies.push(c);
      }
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
        cur = new URL(r.headers.get('location'), cur).toString();
        continue;
      }
      return { finalUrl: cur, status: r.status, cookies };
    }
    return { finalUrl: cur, status: 0, cookies };
  }

  /* ------------------------------- 抖音 ------------------------------- */

  function extractDouyinId(input) {
    const s = String(input || '');
    let m = s.match(/modal_id=(\d{15,})/);
    if (m) return m[1];
    m = s.match(/(?:video|note|share\/video)\/(\d{15,})/);
    if (m) return m[1];
    m = s.match(/v\.douyin\.com\/[A-Za-z0-9_-]+\/?/);
    if (m) return { shortUrl: /^https?:/i.test(m[0]) ? m[0] : 'https://' + m[0] };
    m = s.match(/\b\d{15,}\b/);
    if (m) return m[0];
    return null;
  }

  let cachedTtwid = null;

  async function getTtwid() {
    if (cachedTtwid) return cachedTtwid;
    const body = JSON.stringify({
      region: 'cn', aid: 1768, needFid: false, service: 'www.ixigua.com',
      migrate_info: { ticket: '', source: 'node' }, cbUrlProtocol: 'https', union: true,
    });
    const r = await httpFetch('https://ttwid.bytedance.com/ttwid/union/register/', {
      method: 'POST',
      headers: { 'User-Agent': UA_PC, 'Content-Type': 'application/json' },
      body,
    });
    await r.text();
    const ttwid = collectSetCookies(r.headers).find(c => c.startsWith('ttwid='));
    if (!ttwid) throw new Error('ttwid 注册失败（抖音风控）');
    cachedTtwid = ttwid;
    return ttwid;
  }

  /* ---- a_bogus 签名（移植自 TikTokDownloader aBogus.py，Apache-2.0） ---- */

  function sm3Bytes(inputBytes) {
    const IV = [0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e];
    const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
    const msg = Array.from(inputBytes);
    const bitLen = msg.length * 8;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    for (let i = 7; i >= 0; i--) msg.push((bitLen >>> (8 * i)) & 0xff);
    const V = IV.slice();
    for (let off = 0; off < msg.length; off += 64) {
      const W = new Array(68), W1 = new Array(64);
      for (let i = 0; i < 16; i++) {
        W[i] = ((msg[off + i * 4] << 24) | (msg[off + i * 4 + 1] << 16) | (msg[off + i * 4 + 2] << 8) | msg[off + i * 4 + 3]) >>> 0;
      }
      for (let i = 16; i < 68; i++) {
        const x = (W[i - 16] ^ W[i - 9] ^ rotl(W[i - 3], 15)) >>> 0;
        W[i] = (x ^ rotl(x, 15) ^ rotl(x, 23) ^ rotl(W[i - 13], 7) ^ W[i - 6]) >>> 0;
      }
      for (let i = 0; i < 64; i++) W1[i] = (W[i] ^ W[i + 4]) >>> 0;
      const FF = (j, x, y, z) => (j < 16 ? (x ^ y ^ z) : ((x & y) | (x & z) | (y & z))) >>> 0;
      const GG = (j, x, y, z) => (j < 16 ? (x ^ y ^ z) : ((x & y) | (~x & z))) >>> 0;
      const P0 = (x) => (x ^ rotl(x, 9) ^ rotl(x, 17)) >>> 0;
      let A = V[0], B = V[1], C = V[2], D = V[3], E = V[4], F = V[5], G = V[6], H = V[7];
      for (let j = 0; j < 64; j++) {
        const T = j < 16 ? 0x79cc4519 : 0x7a879d8a;
        const SS1 = rotl((rotl(A, 12) + E + rotl(T, j % 32)) >>> 0, 7);
        const SS2 = (SS1 ^ rotl(A, 12)) >>> 0;
        const TT1 = (FF(j, A, B, C) + D + SS2 + W1[j]) >>> 0;
        const TT2 = (GG(j, E, F, G) + H + SS1 + W[j]) >>> 0;
        D = C; C = rotl(B, 9); B = A; A = TT1;
        H = G; G = rotl(F, 19); F = E; E = P0(TT2);
      }
      V[0] = (V[0] ^ A) >>> 0; V[1] = (V[1] ^ B) >>> 0; V[2] = (V[2] ^ C) >>> 0; V[3] = (V[3] ^ D) >>> 0;
      V[4] = (V[4] ^ E) >>> 0; V[5] = (V[5] ^ F) >>> 0; V[6] = (V[6] ^ G) >>> 0; V[7] = (V[7] ^ H) >>> 0;
    }
    const out = [];
    for (const v of V) out.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
    return out;
  }
  function sm3OfString(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
      else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
    }
    return sm3Bytes(bytes);
  }

  const AB_STR = {
    s3: 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe',
    s4: 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe',
  };
  function abRc4(plaintext, key) {
    const S = [];
    for (let i = 0; i < 256; i++) S[i] = i;
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + key.charCodeAt(i % key.length)) % 256;
      const t = S[i]; S[i] = S[j]; S[j] = t;
    }
    let a = 0; j = 0;
    let out = '';
    for (let k = 0; k < plaintext.length; k++) {
      a = (a + 1) % 256;
      j = (j + S[a]) % 256;
      const t = S[a]; S[a] = S[j]; S[j] = t;
      out += String.fromCharCode(S[(S[a] + S[j]) % 256] ^ plaintext.charCodeAt(k));
    }
    return out;
  }
  function abRandomList(a, b, c, d, e, f, g) {
    const r = (a === undefined || a === null) ? Math.random() * 10000 : a;
    const v = [r, Math.floor(r) & 255, Math.floor(r) >> 8];
    v.push((v[1] & b | d) & 255);
    v.push((v[1] & c | e) & 255);
    v.push((v[2] & b | f) & 255);
    v.push((v[2] & c | g) & 255);
    return v.slice(-4);
  }
  function abGenerateResult(s, table) {
    const t = AB_STR[table];
    const r = [];
    for (let i = 0; i < s.length; i += 3) {
      let n;
      if (i + 2 < s.length) n = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8) | s.charCodeAt(i + 2);
      else if (i + 1 < s.length) n = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8);
      else n = s.charCodeAt(i) << 16;
      for (const [j, k] of [[18, 0xfc0000], [12, 0x03f000], [6, 0x0fc0], [0, 0x3f]]) {
        if (j === 6 && i + 1 >= s.length) break;
        if (j === 0 && i + 2 >= s.length) break;
        r.push(t[(n & k) >>> j]);
      }
    }
    r.push('='.repeat((4 - r.length % 4) % 4));
    return r.join('');
  }

  function makeABogus(queryString, ua) {
    const browser = '1536|742|1536|864|0|0|0|0|1536|864|1536|864|1536|742|24|24|Win32';
    const browserCode = Array.from(browser).map(c => c.charCodeAt(0));
    // ua_code = sm3( base64( rc4(ua, "\0\1\x0e") ) )
    const uaCrypt = abRc4(ua || UA_PC, '\u0000\u0001\u000e');
    const uaB64 = abGenerateResult(uaCrypt, 's3');
    const uaCode = sm3Bytes(Array.from(uaB64).map(c => c.charCodeAt(0)));

    // string_1：三个随机块
    const c1 = (rn) => abRandomList(rn, 170, 85, 1, 2, 5, 45 & 85);
    const c2 = (rn) => abRandomList(rn, 170, 85, 1, 0, 0, 0);
    const c3 = (rn) => abRandomList(rn, 170, 85, 1, 0, 5, 0);
    const s1 = String.fromCharCode(...c1(), ...c2(), ...c3());

    // string_2
    const now = Date.now();
    const startTime = now;
    const endTime = startTime + 4 + Math.floor(Math.random() * 5);
    const paramsArray = sm3Bytes(sm3OfString(queryString + 'cus'));
    const methodArray = sm3Bytes(sm3OfString('GET' + 'cus'));
    const a = [
      44,
      (endTime >> 24) & 255, 0, 0, 0, 0, 24,
      paramsArray[21], methodArray[21], 0, uaCode[23],
      (endTime >> 16) & 255, 0, 0, 0, 1, 0, 239,
      paramsArray[22], methodArray[22], uaCode[24],
      (endTime >> 8) & 255, 0, 0, 0, 0,
      (endTime >> 0) & 255, 0, 0, 14,
      (startTime >> 24) & 255, (startTime >> 16) & 255, 0,
      (startTime >> 8) & 255, (startTime >> 0) & 255, 3,
      Math.floor(endTime / 256 / 256 / 256 / 256), 1,
      Math.floor(startTime / 256 / 256 / 256 / 256), 1,
      browserCode.length, 0, 0, 0,
    ];
    const e = a.reduce((x, y) => x ^ y, 0);
    const full = a.concat(browserCode).concat([e]);
    const s2 = abRc4(String.fromCharCode(...full), 'y');

    return abGenerateResult(s1 + s2, 's4');
  }

  const DY_DEVICE_PARAMS = {
    device_platform: 'webapp', aid: '6383', channel: 'channel_pc_web',
    update_version_code: '170400', pc_client_type: '1', pc_libra_divert: 'Windows',
    support_h265: '1', support_dash: '1', version_code: '290100', version_name: '19.5.0',
    cookie_enabled: 'true', screen_width: '1536', screen_height: '864',
    browser_language: 'zh-CN', browser_platform: 'Win32', browser_name: 'Chrome',
    browser_version: '150.0.0.0', browser_online: 'true', engine_name: 'Blink',
    engine_version: '150.0.0.0', os_name: 'Windows', os_version: '10',
    cpu_core_num: '16', device_memory: '8', platform: 'PC',
    downlink: '10', effective_type: '4g', round_trip_time: '50',
    uifid: '', msToken: '',
  };

  function douyinQuery(awemeId) {
    return Object.entries({ ...DY_DEVICE_PARAMS, aweme_id: awemeId })
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
      .join('&');
  }

  async function douyinDetail(awemeId, ttwid) {
    const baseQuery = douyinQuery(awemeId);
    const abogus = makeABogus(baseQuery, UA_PC);
    const r = await httpFetch('https://www.douyin.com/aweme/v1/web/aweme/detail/?' + baseQuery + '&a_bogus=' + encodeURIComponent(abogus), {
      headers: {
        'User-Agent': UA_PC,
        'Referer': 'https://www.douyin.com/?recommend=1',
        'Cookie': ttwid,
        'Accept': 'application/json, text/plain, */*',
      },
    });
    const text = await r.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  }

  function cleanDouyinUrl(url) {
    if (!url) return url;
    return url.replace('/playwm/', '/play/').replace(/playwm/g, 'play');
  }

  async function parseDouyin(input) {
    const extracted = extractDouyinId(input);
    if (!extracted) throw new Error('未识别到抖音链接，请粘贴完整的分享链接');
    let awemeId = extracted;
    if (typeof extracted === 'object') {
      const res = await followRedirects(extracted.shortUrl, UA_MOBILE);
      const m = res.finalUrl.match(/(?:video|note)\/(\d{15,})/) || res.finalUrl.match(/modal_id=(\d{15,})/);
      if (!m) throw new Error('抖音短链解析失败：' + res.finalUrl);
      awemeId = m[1];
    }

    let ttwid = null, json = null;
    const errors = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        ttwid = await getTtwid();
        json = await douyinDetail(awemeId, ttwid);
        if (json && json.aweme_detail) break;
        cachedTtwid = null;
        errors.push('detail 空响应(第' + (attempt + 1) + '次)');
      } catch (e) {
        cachedTtwid = null;
        errors.push(e.message);
      }
    }
    if (!json || !json.aweme_detail) {
      throw new Error('抖音解析失败：' + (errors.join('；') || '未知错误') + '。可稍后重试（抖音风控偶尔波动）');
    }

    const d = json.aweme_detail;
    const video = d.video || {};
    const playAddr = video.play_addr || {};
    const urls = (playAddr.url_list || []).map(cleanDouyinUrl);
    const cover = ((video.cover || {}).url_list || [])[0] || null;
    const images = Array.isArray(d.images)
      ? d.images.map(img => (img.url_list || [])[0]).filter(Boolean)
      : [];
    const isImage = images.length > 0;

    return {
      platform: 'douyin',
      type: isImage ? 'image' : 'video',
      id: String(d.aweme_id || awemeId),
      title: (d.desc || '').trim(),
      author: (d.author && d.author.nickname) || '',
      avatar: (d.author && d.author.avatar_thumb && d.author.avatar_thumb.url_list && d.author.avatar_thumb.url_list[0]) || null,
      cover: cover || (images[0] || null),
      videoUrl: urls[0] || null,
      videoUrls: urls,
      images: images,
      stats: {
        likes: d.statistics ? d.statistics.digg_count : 0,
        comments: d.statistics ? d.statistics.comment_count : 0,
        shares: d.statistics ? d.statistics.share_count : 0,
      },
      raw: d,
    };
  }

  /* ------------------------------- B站 ------------------------------- */

  function extractBilibiliBv(input) {
    const s = String(input || '');
    let m = s.match(/b23\.tv\/[A-Za-z0-9]+/);
    if (m) return { shortUrl: m[0] };
    m = s.match(/(BV[0-9A-Za-z]{10})/);
    if (m) return m[1];
    return null;
  }

  async function parseBilibili(input, pageOverride) {
    const extracted = extractBilibiliBv(input);
    if (!extracted) throw new Error('未识别到B站链接，请粘贴分享链接（b23.tv 或 bilibili.com/video/BV...）');

    let bvid = extracted;
    let pageIndex = typeof pageOverride === 'number' && pageOverride >= 0 ? pageOverride : 0;
    if (typeof extracted === 'object') {
      const res = await followRedirects('https://' + extracted.shortUrl, UA_PC);
      const m = res.finalUrl.match(/video\/(BV[0-9A-Za-z]{10})/);
      if (!m) throw new Error('B站短链解析失败：' + res.finalUrl);
      bvid = m[1];
      if (typeof pageOverride !== 'number') {
        const p = res.finalUrl.match(/[?&]p=(\d+)/);
        if (p) pageIndex = parseInt(p[1], 10) - 1;
      }
    } else if (typeof pageOverride !== 'number') {
      const pm = String(input).match(/[?&]p=(\d+)/);
      if (pm) pageIndex = parseInt(pm[1], 10) - 1;
    }

    const headers = { 'User-Agent': UA_PC, 'Referer': 'https://www.bilibili.com/' };

    const viewRes = await httpFetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid, { headers });
    const viewJson = await viewRes.json();
    if (viewJson.code !== 0 || !viewJson.data) {
      throw new Error('B站视频信息获取失败：' + (viewJson.message || ('code ' + viewJson.code)));
    }
    const v = viewJson.data;
    const pages = (v.pages && v.pages.length) ? v.pages : [{ cid: v.cid, part: '' }];
    const page = pages[Math.min(Math.max(pageIndex, 0), pages.length - 1)] || pages[0];
    const cid = page.cid;

    // fnval=0 → 单文件 MP4（含音轨），免登录最高 720p
    const playRes = await httpFetch(
      'https://api.bilibili.com/x/player/playurl?bvid=' + bvid + '&cid=' + cid + '&qn=80&fnval=0&platform=pc&high_quality=1',
      { headers },
    );
    const playJson = await playRes.json();
    let videoUrl = null;
    let quality = 0;
    let dashVideo = null;
    let dashAudio = null;
    if (playJson.code === 0 && playJson.data) {
      if (playJson.data.durl && playJson.data.durl.length) {
        videoUrl = playJson.data.durl[0].url;
        quality = playJson.data.quality || 0;
      } else if (playJson.data.dash) {
        const dv = (playJson.data.dash.video || []).slice().sort((a, b) => (b.id || 0) - (a.id || 0));
        const da = (playJson.data.dash.audio || []).slice().sort((a, b) => (b.id || 0) - (a.id || 0));
        dashVideo = dv[0] ? (dv[0].baseUrl || dv[0].base_url) : null;
        dashAudio = da[0] ? (da[0].baseUrl || da[0].base_url) : null;
        quality = playJson.data.quality || 0;
      }
    }

    const pagesInfo = pages.map((p, i) => ({ index: i, title: p.part || ('P' + (i + 1)), cid: p.cid }));

    return {
      platform: 'bilibili',
      type: 'video',
      id: bvid,
      title: (v.title || '').trim(),
      author: (v.owner && v.owner.name) || '',
      avatar: (v.owner && v.owner.face) || null,
      cover: v.pic || null,
      videoUrl: videoUrl || null,
      dashVideo: dashVideo,
      dashAudio: dashAudio,
      quality: quality,
      duration: v.duration || 0,
      pages: pagesInfo,
      pageIndex: Math.min(Math.max(pageIndex, 0), pages.length - 1),
      stats: {
        views: v.stat ? v.stat.view : 0,
        danmaku: v.stat ? v.stat.danmaku : 0,
        likes: v.stat ? v.stat.like : 0,
      },
      raw: { view: v, play: playJson.data },
    };
  }

  /* ------------------------------- 分发 ------------------------------- */

  async function parse(platform, url, opts) {
    if (platform === 'douyin' || platform === 'dy') return parseDouyin(url);
    if (platform === 'bilibili' || platform === 'bili' || platform === 'b') return parseBilibili(url, opts && opts.page);
    throw new Error('不支持的平台: ' + platform);
  }

  function configure(opts) {
    if (opts && typeof opts.fetchImpl === 'function') fetchImpl = opts.fetchImpl;
  }

  global.NowaterParser = {
    VERSION: '1.0.0',
    parse,
    parseDouyin,
    parseBilibili,
    makeXBogus,
    makeABogus,
    extractDouyinId,
    extractBilibiliBv,
    getTtwid,
    configure,
    UA_PC,
    UA_MOBILE,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
