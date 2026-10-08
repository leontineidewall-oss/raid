// raid pixel engine: one source for the page scene, viking cards, the share card and /api/og
// (inlined into index.html by build.py; required by api/og.js in node)
(function (root) {
  var PAL = {
    c0: 0x120d14, c1: 0x1a1220, c2: 0x24182a, c3: 0x2f1f30, rock: 0x3a2836, rockD: 0x22161f,
    ol: 0x0b080d, glow: 0x5a3a1c, glow2: 0x7a4f1e,
    gold: 0xffd34d, goldL: 0xfff1a8, goldD: 0xc9861c, goldO: 0x6a3e0e,
    steel: 0x9aa6b2, steelL: 0xd4dce4, steelD: 0x5f6b78, horn: 0xefe3c4, hornD: 0xb8a77e,
    skin: 0xf0b98f, skinD: 0xcf8f68, eye: 0x1a1220, wood: 0x8a5a32, woodD: 0x5c3a1e,
    dr: 0x2f8a5a, drL: 0x4fbf7f, drD: 0x1b5a3a, drB: 0xc9e8a8, drS: 0xffd34d, horn2: 0xe8dcc0,
    fire: 0xff7a1a, fireL: 0xffd34d, smoke: 0x6a5a72, white: 0xffffff, red: 0xff5a4e, dim: 0x8a7f96, grey: 0x5a5262
  };
  var BEARDS = [[0xe0782c, 0xb05418], [0xf2d27a, 0xc9a44a], [0x7a4a2a, 0x55311a], [0x2a2230, 0x15111a], [0xd8d4cc, 0xa8a29a]];
  var TUNICS = [[0x3a6fd8, 0x2a4fa0], [0xc8323c, 0x8e1f27], [0x2f8a5a, 0x1b5a3a], [0x8e6bff, 0x5f43d1], [0xe0a030, 0xa8741a]];
  var SHIELDS = [[0xc8323c, 0xf4efe2], [0x3a6fd8, 0xf4efe2], [0x2a2230, 0xffd34d], [0x2f8a5a, 0xf4efe2]];
  var N1 = ["iron", "salty", "red", "frost", "loud", "storm", "bold", "grim", "sly", "lucky", "broken", "golden"];
  var N2 = ["beard", "axe", "oar", "horn", "shield", "helm", "fist", "boot", "raven", "wolf", "anchor", "hammer"];
  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function traits(addr) {
    var h = hash(addr || "raid");
    return { beard: h % BEARDS.length, tunic: (h >>> 3) % TUNICS.length, shield: (h >>> 6) % SHIELDS.length, eyes: (h >>> 9) & 1 ? "open" : "squint",
      name: N1[(h >>> 11) % N1.length] + " " + N2[(h >>> 16) % N2.length] };
  }

  function Grid(w, h, bg) { this.w = w; this.h = h; this.px = new Int32Array(w * h).fill(bg == null ? PAL.c0 : bg); }
  Grid.prototype.set = function (x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c == null) return;
    this.px[y * this.w + x] = typeof c === "string" ? PAL[c] : c;
  };
  Grid.prototype.get = function (x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : this.px[y * this.w + x]; };
  Grid.prototype.rect = function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c); };
  Grid.prototype.rgba = function (out) {
    for (var i = 0; i < this.px.length; i++) {
      var c = this.px[i];
      if (c < 0) { out[i * 4 + 3] = 0; continue; }
      out[i * 4] = (c >> 16) & 255; out[i * 4 + 1] = (c >> 8) & 255; out[i * 4 + 2] = c & 255; out[i * 4 + 3] = 255;
    }
    return out;
  };
  // draws a buffer (W x H of colours or -1) with a 1px outline around it
  function stamp(g, buf, W, H, x0, y0, ol) {
    for (var py = 0; py < H; py++) for (var px = 0; px < W; px++) {
      var v = buf[py * W + px];
      if (v < 0) {
        if ((px > 0 && buf[py * W + px - 1] >= 0) || (px < W - 1 && buf[py * W + px + 1] >= 0) || (py > 0 && buf[(py - 1) * W + px] >= 0) || (py < H - 1 && buf[(py + 1) * W + px] >= 0)) g.set(x0 + px, y0 + py, ol == null ? PAL.ol : ol);
      } else g.set(x0 + px, y0 + py, v);
    }
  }
  // 3x5 pixel font (rows joined, 15 cells per glyph)
  var F3 = {
    "A": ".#.#.#####.##.#",
    "B": "##.#.###.#.###.",
    "C": ".###..#..#...##",
    "D": "##.#.##.##.###.",
    "E": "####..##.#..###",
    "F": "####..##.#..#..",
    "G": ".###..#.##.#.##",
    "H": "#.##.#####.##.#",
    "I": "###.#..#..#.###",
    "J": "..#..#..##.#.#.",
    "K": "#.##.###.#.##.#",
    "L": "#..#..#..#..###",
    "M": "#.########.##.#",
    "N": "##.#.##.##.##.#",
    "O": ".#.#.##.##.#.#.",
    "P": "##.#.###.#..#..",
    "Q": ".#.#.##.###..##",
    "R": "##.#.###.#.##.#",
    "S": ".###...#...###.",
    "T": "###.#..#..#..#.",
    "U": "#.##.##.##.####",
    "V": "#.##.##.##.#.#.",
    "W": "#.##.########.#",
    "X": "#.##.#.#.#.##.#",
    "Y": "#.##.#.#..#..#.",
    "Z": "###..#.#.#..###",
    "0": "####.##.##.####",
    "1": ".#.##..#..#.###",
    "2": "##...#.#.#..###",
    "3": "##...#.#...###.",
    "4": "#.##.####..#..#",
    "5": "####..##...###.",
    "6": ".###..####.####",
    "7": "###..#.#..#..#.",
    "8": "####.#####.####",
    "9": "####.####..###.",
    "$": ".####..#..####.",
    "?": "##...#.#.....#.",
    "+": "....#.###.#....",
    ".": ".............#.",
    "-": "......###......",
    ":": "....#.....#....",
    "!": ".#..#..#.....#.",
    "/": "..#..#.#.#..#..",
    " ": "...............",
    ",": "..........#.#..",
    "%": "#.#..#.#.#..#.#",
    "—": "......###......"
  };

  function textW(s, sc) { return s.length * 4 * sc - sc; }
  function text(g, s, x, y, sc, col, shadow) {
    s = String(s).toUpperCase(); sc = sc || 1;
    for (var n = 0; n < s.length; n++) {
      var gl = F3[s[n]] || F3["?"];
      for (var j = 0; j < 5; j++) for (var i = 0; i < 3; i++) if (gl[j * 3 + i] === "#") {
        if (shadow) g.rect(x + (n * 4 + i) * sc + sc, y + j * sc + sc, sc, sc, shadow);
      }
      for (var j2 = 0; j2 < 5; j2++) for (var i2 = 0; i2 < 3; i2++) if (gl[j2 * 3 + i2] === "#") g.rect(x + (n * 4 + i2) * sc, y + j2 * sc, sc, sc, col);
    }
  }

  function el(x, y, cx, cy, rx, ry) { var a = (x - cx) / rx, b = (y - cy) / ry; return a * a + b * b <= 1; }
  function ci(x, y, cx, cy, r) { return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r; }

  // a viking in a 26 x 34 unit box. t = traits; opts: mirror, sneak, dim (sits this raid out)
  function viking(g, x0, y0, k, t, opts) {
    opts = opts || {};
    var W = Math.floor(26 * k), H = Math.floor(34 * k), buf = new Int32Array(W * H).fill(-1);
    var bc = BEARDS[t.beard][0], bd = BEARDS[t.beard][1], tc = TUNICS[t.tunic][0], td = TUNICS[t.tunic][1], sc = SHIELDS[t.shield][0], sl = SHIELDS[t.shield][1];
    for (var py = 0; py < H; py++) for (var px = 0; px < W; px++) {
      var x = (px + 0.5) / k, y = (py + 0.5) / k, c = -1, s, n;
      if (opts.mirror) x = 26 - x;
      if (x > 9.2 && x < 12.2 && y > 27 && y < 32.5) c = y > 30.4 ? PAL.woodD : td;
      if (x > 13.8 && x < 16.8 && y > 27 && y < 32.5) c = y > 30.4 ? PAL.woodD : td;
      if (opts.sneak && y > 30.4 && y < 32.5 && ((x > 8 && x < 12.2) || (x > 13.8 && x < 18))) c = PAL.woodD;
      if (el(x, y, 13, 23.5, 6.4, 6.0) && y < 28.4) {
        c = x < 15.5 ? tc : td;
        if (y > 25.4 && y < 26.8) c = x > 12 && x < 14 ? PAL.gold : PAL.woodD;
      }
      if (el(x, y, 6.8, 22.5, 1.9, 4.2) || el(x, y, 19.2, 22.5, 1.9, 4.2)) c = td;
      if (ci(x, y, 6.8, 26.4, 1.5) || ci(x, y, 19.2, 26.4, 1.5)) c = PAL.skin;
      if (el(x, y, 13, 12.5, 5.6, 5.4)) c = x < 16.2 ? PAL.skin : PAL.skinD;
      if (el(x, y, 13, 17.6, 5.8, 4.6) && y > 14.2) c = x < 15.6 ? bc : bd;
      for (n = 0; n < 2; n++) {
        var bx = n ? 15.4 : 10.6;
        if (Math.abs(x - bx) < 1.0 && y > 19 && y < 24.5) c = Math.floor(y * 1.2) % 2 ? bd : bc;
        if (ci(x, y, bx, 24.8, 0.9)) c = PAL.gold;
      }
      if (y > 14.6 && y < 15.8 && x > 9.4 && x < 16.6) c = bd;
      if (t.eyes === "open") { if (ci(x, y, 10.9, 12.8, 0.8) || ci(x, y, 15.1, 12.8, 0.8)) c = PAL.eye; }
      else if (y > 12.6 && y < 13.3 && ((x > 9.8 && x < 12) || (x > 14 && x < 16.2))) c = PAL.eye;
      if (el(x, y, 13, 9.4, 6.4, 5.4) && y < 10.6) {
        c = PAL.steel;
        if (x < 10.5 && y < 7.5) c = PAL.steelL;
        if (x > 16.4 || Math.abs(x - 13) < 0.6) c = PAL.steelD;
      }
      if (y > 9.6 && y < 11.2 && el(x, y, 13, 10.4, 6.8, 1.6)) c = PAL.steelD;
      if (Math.abs(x - 13) < 0.7 && y > 10 && y < 13.6) c = PAL.steelD;
      for (s = -1; s <= 1; s += 2) for (n = 0; n <= 10; n++) {
        var tt = n / 10, hx = 13 + s * (6 + 3 * tt), hy = 8.6 - 5.4 * tt + 1.6 * tt * tt;
        if (ci(x, y, hx, hy, 1.5 - tt)) c = s < 0 || tt > 0.6 ? PAL.horn : PAL.hornD;
      }
      var sx = opts.mirror ? 21 : 5, d = Math.hypot(x - (opts.mirror ? 26 - sx : sx), y - 24);
      if (opts.mirror) d = Math.hypot((26 - x) - sx, y - 24);
      if (d <= 4.6) {
        var a = Math.atan2(y - 24, (opts.mirror ? 26 - x : x) - sx);
        c = Math.floor((a + Math.PI) / (Math.PI / 3)) % 2 ? sc : sl;
        if (d > 3.7) c = PAL.woodD;
        if (d < 1.2) c = PAL.steelL;
      }
      if (opts.dim && c >= 0) c = dimc(c);
      buf[py * W + px] = c;
    }
    stamp(g, buf, W, H, x0, y0);
    return { w: W, h: H };
  }
  function dimc(c) { var r = (c >> 16) & 255, gg = (c >> 8) & 255, b = c & 255, l = Math.round((r * 0.3 + gg * 0.55 + b * 0.15) * 0.45 + 18); return (l << 16) | (l << 8) | (l + 8); }

  // the dragon, curled on the hoard in a W x H box. mood: 0 asleep, 1 stirring, 2 awake
  function dragon(g, x0, y0, W, H, mood, breath) {
    var buf = new Int32Array(W * H).fill(-1), i, xx, yy;
    function put(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = c; }
    var lift = breath || 0;
    for (i = 0; i < 260; i++) {
      var t = i / 259, bx = W * (0.30 + 0.62 * t), by = H * (0.78 - 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.05))) - lift * Math.sin(Math.PI * t), rr = H * (0.20 - 0.12 * t);
      for (yy = Math.floor(by - rr); yy <= by + rr; yy++) for (xx = Math.floor(bx - rr); xx <= bx + rr; xx++) {
        if ((xx - bx) * (xx - bx) + (yy - by) * (yy - by) <= rr * rr) {
          var belly = yy > by + rr * 0.58;
          put(xx, yy, belly ? PAL.drB : (yy - by > rr * 0.15 ? PAL.drD : (yy - by < -rr * 0.55 ? PAL.drL : PAL.dr)));
        }
      }
      if (i % 17 === 0 && t < 0.95) {
        var sh = rr * 0.9;
        for (var q = 0; q < sh; q++) for (var w = -Math.floor((sh - q) * 0.45); w <= (sh - q) * 0.45; w++) put(bx + w, by - rr - q + 1, q > sh * 0.45 ? PAL.drS : PAL.horn2);
      }
    }
    var tx = W * 0.93, ty = H * 0.76;
    for (var s2 = 0; s2 < 6; s2++) for (var w2 = -s2; w2 <= s2; w2++) put(tx + 9 - s2, ty + w2, PAL.drD);
    var hx = W * 0.16, hy = H * 0.74 - (mood === 2 ? H * 0.08 : 0), hr = H * 0.16;
    for (yy = 0; yy < H; yy++) for (xx = 0; xx < W; xx++) {
      if (((xx - hx) / (hr * 1.5)) * ((xx - hx) / (hr * 1.5)) + ((yy - hy) / hr) * ((yy - hy) / hr) <= 1) put(xx, yy, yy > hy + hr * 0.5 ? PAL.drD : PAL.dr);
      var sx = hx - hr * 1.45, sy = hy + hr * 0.25;
      if (((xx - sx) / (hr * 0.9)) * ((xx - sx) / (hr * 0.9)) + ((yy - sy) / (hr * 0.62)) * ((yy - sy) / (hr * 0.62)) <= 1) put(xx, yy, yy < hy + hr * 0.5 ? PAL.dr : PAL.drD);
    }
    for (var h2 = 0; h2 < hr * 1.6; h2++) {
      put(hx + hr * 0.6 + h2 * 0.9, hy - hr * 0.7 - h2 * 0.55, PAL.horn2); put(hx + hr * 0.6 + h2 * 0.9, hy - hr * 0.7 - h2 * 0.55 + 1, PAL.horn2);
      put(hx + hr * 0.1 + h2 * 0.7, hy - hr * 0.85 - h2 * 0.7, PAL.horn2);
    }
    put(hx - hr * 1.95, hy + hr * 0.05, PAL.ol); put(hx - hr * 1.95 + 1, hy + hr * 0.05, PAL.ol);
    var ex = hx - hr * 0.25, ey = hy - hr * 0.25;
    if (mood === 0) { for (var d = -3; d <= 3; d++) put(ex + d, ey + (Math.abs(d) === 3 ? 1 : 0), PAL.ol); }
    else {
      var ry = mood === 1 ? 1 : 2;
      for (yy = -ry; yy <= ry; yy++) for (xx = -3; xx <= 3; xx++) if ((xx / 3.2) * (xx / 3.2) + (yy / (ry + 0.2)) * (yy / (ry + 0.2)) <= 1) put(ex + xx, ey + yy, PAL.drS);
      for (yy = -ry; yy <= ry; yy++) put(ex, ey + yy, PAL.ol);
      put(ex - 4, ey - ry - 1, PAL.ol); put(ex - 3, ey - ry - 1, PAL.ol); put(ex - 2, ey - ry - 1, PAL.ol);
    }
    stamp(g, buf, W, H, x0, y0);
    return { nose: [x0 + Math.floor(hx - hr * 2.2), y0 + Math.floor(hy + hr * 0.1)], top: [x0 + Math.floor(hx), y0 + Math.floor(hy - hr)] };
  }

  var COIN5 = [".OOO.", "OLCCO", "OCCDO", "OCDDO", ".OOO."];
  var COIN7 = ["..OOO..", ".OLLCO.", "OLCCCDO", "OCCDCDO", "OCCCDDO", ".OCDDO.", "..OOO.."];
  var CMAP = { O: "goldO", L: "goldL", C: "gold", D: "goldD" };
  function coin(g, x, y, big) { var rows = big ? COIN7 : COIN5; for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) { var c = CMAP[rows[j][i]]; if (c) g.set(x + i, y + j, c); } }
  function sparkle(g, x, y, c) { g.set(x, y, "white"); g.set(x + 1, y, c || "goldL"); g.set(x - 1, y, c || "goldL"); g.set(x, y + 1, c || "goldL"); g.set(x, y - 1, c || "goldL"); }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0; s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0; s ^= s >>> 16; return (s >>> 0) / 4294967296; }; }
  function hoard(g, cx, base, rx, ry, seed) {
    var r = rng(seed || 1), x, y;
    for (y = base - ry - 2; y <= base; y++) for (x = cx - rx - 2; x <= cx + rx + 2; x++) {
      var e = ((x - cx) / rx) * ((x - cx) / rx) + ((y - base) / ry) * ((y - base) / ry);
      if (e > 1) continue;
      var c = "gold";
      if (e > 0.86) c = "goldO"; else if (x > cx + rx * 0.35 && BAYER[(y + 64) & 3][(x + 64) & 3] < 9) c = "goldD"; else if ((base - y) / ry > 0.55 && x < cx && BAYER[(y + 64) & 3][(x + 64) & 3] < 6) c = "goldL";
      g.set(x, y, c);
    }
    var n = Math.floor(rx * ry / 9);
    for (var i = 0; i < n; i++) { var a = r() * Math.PI, d = Math.sqrt(r()); coin(g, Math.floor(cx + Math.cos(a) * rx * d * 0.92) - 3, Math.floor(base - Math.sin(a) * ry * d * 0.9) - 3, r() < 0.5); }
  }
  function goldFloor(g, y0, seed) {
    for (var y = y0; y < g.h; y++) for (var x = 0; x < g.w; x++) {
      var t = (y - y0) / Math.max(1, g.h - y0), c = y === y0 ? "goldO" : (BAYER[y & 3][x & 3] < 8 - t * 6 ? "goldD" : "gold");
      if (t > 0.5 && BAYER[(y + 1) & 3][(x + 2) & 3] < 3) c = "goldL";
      g.set(x, y, c);
    }
    var r = rng(seed || 9), n = Math.floor(g.w / 4);
    for (var i = 0; i < n; i++) coin(g, Math.floor(r() * (g.w + 4)) - 4, y0 - 4 + Math.floor(r() * 9), r() < 0.5);
  }
  function cave(g, seed) {
    var cols = ["c0", "c1", "c2", "c3"], x, y;
    for (y = 0; y < g.h; y++) { var t = y / g.h * 3, k = Math.min(2, Math.floor(t)), f = t - k; for (x = 0; x < g.w; x++) g.set(x, y, f * 16 > BAYER[y & 3][x & 3] ? cols[k + 1] : cols[k]); }
    var r = rng(seed || 2); x = 0;
    while (x < g.w) {
      var w = 4 + Math.floor(r() * 8), h = 4 + Math.floor(r() * (g.h * 0.2));
      for (var yy = 0; yy < h; yy++) { var half = (w / 2) * (1 - yy / h); for (var xx = Math.floor(x + w / 2 - half); xx <= x + w / 2 + half; xx++) g.set(xx, yy, xx > x + w / 2 ? "rockD" : "rock"); }
      x += w + Math.floor(r() * 7);
    }
  }
  function zzz(g, x, y, ph) {
    [[0, 0, 3], [-5, -8, 4], [-11, -18, 5]].forEach(function (z, i) {
      if (((ph >> 3) + i) % 4 === 3) return;
      var zx = x + z[0], zy = y + z[1] - ((ph >> 2) % 3), s = z[2];
      for (var q = 0; q < s; q++) { g.set(zx + q, zy, "white"); g.set(zx + q, zy + s - 1, "white"); g.set(zx + s - 1 - q, zy + q, "white"); }
    });
  }
  function smoke(g, x, y, ph) { for (var i = 0; i < 4; i++) { var sx = x - 3 - i * 3 + ((ph + i) % 3), sy = y - 2 - i * 3; g.set(sx, sy, "smoke"); g.set(sx + 1, sy, "smoke"); g.set(sx, sy - 1, "grey"); } }

  // the hero scene: cave, gold floor, hoard, dragon (mood from the odds), the crew sneaking in, live hud
  function scene(g, opts) {
    opts = opts || {};
    var W = g.w, H = g.h, ph = opts.phase || 0, crew = opts.crew || [], mood = opts.mood || 0;
    cave(g, 7);
    var fy = H - 12;
    goldFloor(g, fy, 9);
    var dw = Math.round(W * (W >= 400 ? 0.46 : 0.5)), dh = Math.round(H * 0.6), dx = W - dw, dy = H - dh - 10;
    hoard(g, Math.round(W * 0.78), H, Math.round(W * (W >= 400 ? 0.24 : 0.26)), Math.round(H * 0.3), 3);
    var breath = opts.still ? 0 : (mood === 0 ? Math.round(1 + Math.sin(ph / 6)) : 0);
    var d = dragon(g, dx, dy, dw, dh, mood, breath);
    if (mood === 0) zzz(g, d.nose[0] - 2, d.nose[1] - 10, opts.still ? 0 : ph);
    else smoke(g, d.nose[0], d.nose[1], opts.still ? 0 : ph);
    var n = W >= 400 ? 5 : W >= 300 ? 3 : 2, sx = W >= 400 ? 86 : Math.round(W * (W >= 300 ? 0.27 : 0.29));
    for (var i = 0; i < n; i++) {
      var t = crew[i] || traits("crew" + i), step = opts.still ? 0 : ((ph + i * 3) >> 2) % 2;
      viking(g, sx + i * 19, fy - 33 - step, 1, t, { sneak: true });
    }
    [[0.62, 0.84], [0.9, 0.7], [0.45, 0.93]].forEach(function (s, j) { if (opts.still || (ph + j * 5) % 14 < 9) sparkle(g, Math.round(W * s[0]), Math.round(H * s[1])); });
    if (opts.hud) {
      var hs = W >= 300 ? 4 : 3, hx = 8, hy = 8;
      text(g, "RAID", hx, hy, hs, "gold", "goldO"); hy += hs * 5 + 8;
      opts.hud.forEach(function (r) { text(g, r[0], hx, hy, 1, "dim"); hy += 7; text(g, r[1], hx, hy, 2, r[2] || "white", "ol"); hy += 15; });
    }
  }

  // og / share card (240 x 126; x5 = 1200 x 630)
  function card(g, lines, opts) {
    opts = opts || {};
    cave(g, 5); goldFloor(g, g.h - 14, 4);
    hoard(g, 196, g.h, 60, 30, 6);
    if (opts.hero) viking(g, 150, g.h - 14 - 66 + 2, 2, opts.hero);
    else { dragon(g, 134, 40, 106, 72, 0, 1); viking(g, 104, g.h - 14 - 33, 1, traits("og-a"), { sneak: true }); viking(g, 84, g.h - 14 - 33, 1, traits("og-b"), { sneak: true }); }
    var y = opts.top || 16;
    lines.forEach(function (l) {
      var x = 12, sc = l.sc || 1;
      l.segs.forEach(function (s) { text(g, s[0], x, y, sc, s[1], sc > 1 ? "ol" : null); x += textW(s[0] + " ", sc); });
      y += sc * 5 + (l.gap || 6);
    });
  }

  var api = { PAL: PAL, BEARDS: BEARDS, TUNICS: TUNICS, SHIELDS: SHIELDS, Grid: Grid, hash: hash, traits: traits, viking: viking, dragon: dragon, hoard: hoard,
    goldFloor: goldFloor, cave: cave, coin: coin, sparkle: sparkle, zzz: zzz, scene: scene, card: card, text: text, textW: textW, F3: F3 };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.PX = api;
})(this);
