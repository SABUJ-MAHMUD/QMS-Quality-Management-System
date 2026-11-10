const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(width, height, getPixel) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Draw QMS icon pixel shader
function qmsPixel(x, y, width, height, isMaskable = false) {
  const nx = x / width; // 0 to 1
  const ny = y / height; // 0 to 1

  // Center coordinates (-1 to 1)
  const cx = (nx - 0.5) * 2;
  const cy = (ny - 0.5) * 2;
  const dist = Math.sqrt(cx * cx + cy * cy);

  // Background
  let r = 7, g = 24, b = 46, a = 255; // #07182e

  // Slight subtle background gradient
  const grad = ny * 0.3;
  r = Math.min(255, Math.floor(r + 10 * grad));
  g = Math.min(255, Math.floor(g + 20 * grad));
  b = Math.min(255, Math.floor(b + 35 * grad));

  // If not maskable, round corners with smooth antialiasing
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const ax = Math.max(0, Math.abs(cx) - (1 - cornerRadius));
    const ay = Math.max(0, Math.abs(cy) - (1 - cornerRadius));
    const cornerDist = Math.sqrt(ax * ax + ay * ay);
    if (cornerDist > cornerRadius) {
      return [0, 0, 0, 0]; // transparent outside squircle
    }
    if (cornerDist > cornerRadius - 0.02) {
      const edge = (cornerRadius - cornerDist) / 0.02;
      a = Math.floor(255 * Math.max(0, Math.min(1, edge)));
    }
  }

  // Draw concentric glow in center
  if (dist < 0.7) {
    const glow = Math.pow(1 - dist / 0.7, 2) * 0.35;
    r = Math.floor(r * (1 - glow) + 16 * glow);
    g = Math.floor(g * (1 - glow) + 185 * glow);
    b = Math.floor(b * (1 - glow) + 129 * glow);
  }

  // Ribbon loop 1: Green leaf / ribbon swoosh
  // Parametric swirl in normalized coords
  const rx1 = cx + 0.15;
  const ry1 = cy + 0.1;
  const angle1 = Math.atan2(ry1, rx1);
  const rDist1 = Math.sqrt(rx1 * rx1 + ry1 * ry1);
  
  // Ribbon 1 shape: upper green blade
  const blade1 = Math.sin(nx * Math.PI) * Math.sin(ny * Math.PI);
  const inRibbon1 = (cx > -0.55 && cx < 0.25 && cy > -0.55 && cy < 0.15 && Math.abs(cy - (-0.6 * cx - 0.15)) < 0.22);
  const inRibbon2 = (cx > -0.25 && cx < 0.55 && cy > -0.15 && cy < 0.55 && Math.abs(cy - (-0.6 * cx + 0.15)) < 0.22);

  if (inRibbon1) {
    // Green to lime gradient
    const t = (cx + 0.55) / 0.8;
    const gr = Math.floor(163 * t + 16 * (1 - t));
    const gg = Math.floor(230 * t + 185 * (1 - t));
    const gb = Math.floor(53 * t + 129 * (1 - t));
    r = gr; g = gg; b = gb;
  } else if (inRibbon2) {
    // Cyan to blue gradient
    const t = (cx + 0.25) / 0.8;
    const br = Math.floor(56 * (1 - t) + 2 * t);
    const bg = Math.floor(189 * (1 - t) + 132 * t);
    const bb = Math.floor(248 * (1 - t) + 199 * t);
    r = br; g = bg; b = bb;
  }

  // Center white swoosh separation
  if (Math.abs(cy - (-0.6 * cx)) < 0.04 && dist < 0.45) {
    r = 255; g = 255; b = 255;
  }

  // Draw QMS bottom badge pill
  if (Math.abs(cx) < 0.65 && cy > 0.52 && cy < 0.82) {
    // Dark pill container
    const isBorder = (Math.abs(Math.abs(cx) - 0.64) < 0.02 || Math.abs(cy - 0.53) < 0.02 || Math.abs(cy - 0.81) < 0.02);
    if (isBorder) {
      r = 2; g = 132; b = 199; // #0284c7 border
    } else {
      r = 15; g = 23; b = 42; // #0f172a
      
      // Let's render Q M S letter pixels inside the pill!
      // Center of pill: cx = 0, cy = 0.67
      const px = (cx / 0.6) * 15; // -15 to +15
      const py = ((cy - 0.67) / 0.12) * 6; // -6 to +6

      let isLetter = false;

      // Q: px around -8, py between -4 and +4
      const qx = px - (-8);
      const qy = py;
      const qDist = Math.sqrt(qx * qx + qy * qy);
      if (qDist >= 2.2 && qDist <= 4.2) isLetter = true;
      if (qx > 1 && qx < 4.5 && qy > 1 && qy < 4.5 && Math.abs(qx - qy) < 1.2) isLetter = true; // tail

      // M: px around 0, py between -4 and +4
      const mx = px;
      const my = py;
      if (Math.abs(my) <= 4.2) {
        if (Math.abs(mx - (-3.2)) < 1.0) isLetter = true; // left bar
        if (Math.abs(mx - 3.2) < 1.0) isLetter = true; // right bar
        // middle diagonal
        if (my <= 1.0 && Math.abs(Math.abs(mx) - (3.2 - (my + 4.2) * 0.6)) < 0.9) isLetter = true;
      }

      // S: px around +8, py between -4 and +4
      const sx = px - 8;
      const sy = py;
      if (Math.abs(sy) <= 4.2 && Math.abs(sx) <= 3.2) {
        if (Math.abs(sy - (-3.5)) < 1.0) isLetter = true; // top
        if (Math.abs(sy) < 1.0) isLetter = true; // middle
        if (Math.abs(sy - 3.5) < 1.0) isLetter = true; // bottom
        if (sy < 0 && Math.abs(sx - (-2.5)) < 1.0) isLetter = true; // top left
        if (sy > 0 && Math.abs(sx - 2.5) < 1.0) isLetter = true; // bottom right
      }

      if (isLetter) {
        r = 56; g = 189; b = 248; // #38bdf8 bright cyan
      }
    }
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(__dirname, '../public');

console.log('Generating PWA icons in:', publicDir);

// 1. pwa-192x192.png
const pwa192 = createPng(192, 192, (x, y, w, h) => qmsPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
console.log('✓ pwa-192x192.png generated (' + pwa192.length + ' bytes)');

// 2. pwa-512x512.png
const pwa512 = createPng(512, 512, (x, y, w, h) => qmsPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
console.log('✓ pwa-512x512.png generated (' + pwa512.length + ' bytes)');

// 3. pwa-maskable-512x512.png (full edge-to-edge background)
const pwaMaskable = createPng(512, 512, (x, y, w, h) => qmsPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);
console.log('✓ pwa-maskable-512x512.png generated (' + pwaMaskable.length + ' bytes)');

// 4. apple-touch-icon.png (180x180)
const appleIcon = createPng(180, 180, (x, y, w, h) => qmsPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('✓ apple-touch-icon.png generated (' + appleIcon.length + ' bytes)');

// 5. favicon.ico (can be a 48x48 PNG renamed as ico or 32x32)
const favIcon = createPng(64, 64, (x, y, w, h) => qmsPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), favIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favIcon);
console.log('✓ favicon.ico & favicon.png generated');
