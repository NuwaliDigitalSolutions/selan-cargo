/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom zero-dependency QR Generator ported to clean TypeScript
// Implements QR version selection, finder patterns, alignment patterns, timing patterns, and Reed-Solomon ECC.

export function drawQR(canvas: HTMLCanvasElement, text: string) {
  const size = canvas.width;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);

  try {
    const matrix = generateQRMatrix(text);
    if (!matrix) {
      drawFallbackQR(ctx, size, text);
      return;
    }
    const cells = matrix.length;
    const cellSize = Math.floor(size / cells);
    const offset = Math.floor((size - cells * cellSize) / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (matrix[r][c] === 1) {
          ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
        }
      }
    }
  } catch (e) {
    drawFallbackQR(ctx, size, text);
  }
}

function drawFallbackQR(ctx: CanvasRenderingContext2D, size: number, text: string) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;

  // Finder patterns
  [[4, 4], [size - 24, 4], [4, size - 24]].forEach(([x, y]) => {
    ctx.strokeRect(x, y, 16, 16);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 4, y + 4, 8, 8);
  });

  // Center logo representation / Text
  ctx.fillStyle = '#444444';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TRACK', size / 2, size / 2 + 2);
}

function generateQRMatrix(text: string): number[][] | null {
  try {
    return buildQR(text);
  } catch (e) {
    return null;
  }
}

function buildQR(data: string): number[][] | null {
  const bytes: number[] = [];
  for (let i = 0; i < data.length; i++) {
    bytes.push(data.charCodeAt(i));
  }

  // Version threshold
  let version = 1;
  const caps = [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858];
  for (let v = 0; v < caps.length; v++) {
    if (bytes.length <= caps[v]) {
      version = v + 1;
      break;
    }
  }
  if (bytes.length > caps[caps.length - 1]) return null;

  const size = version * 4 + 17;
  // Initialize matrix
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const addFinder = (row: number, col: number) => {
    const pat = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (row + r >= 0 && row + r < size && col + c >= 0 && col + c < size) {
          matrix[row + r][col + c] = pat[r][c];
          reserved[row + r][col + c] = true;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  const reserveArea = (r1: number, c1: number, r2: number, c2: number, val: number) => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size && !reserved[r][c]) {
          matrix[r][c] = val;
          reserved[r][c] = true;
        }
      }
    }
  };

  reserveArea(7, 0, 7, 7, 0);
  reserveArea(0, 7, 7, 7, 0);
  reserveArea(7, size - 8, 7, size - 1, 0);
  reserveArea(0, size - 8, 7, size - 8, 0);
  reserveArea(size - 8, 0, size - 8, 7, 0);
  reserveArea(size - 7, 7, size - 1, 7, 0);

  // Timing lines
  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0 ? 1 : 0;
    if (!reserved[6][i]) {
      matrix[6][i] = v;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      matrix[i][6] = v;
      reserved[i][6] = true;
    }
  }

  // Dark module
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  // Align patterns (ver >= 2)
  const alignTable: { [key: number]: number[] } = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50]
  };

  if (version >= 2 && alignTable[version]) {
    const pts = alignTable[version];
    for (let ai = 0; ai < pts.length; ai++) {
      for (let aj = 0; aj < pts.length; aj++) {
        const ar = pts[ai];
        const ac = pts[aj];
        if (reserved[ar][ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const v = (r === -2 || r === 2 || c === -2 || c === 2) ? 1 : (r === 0 && c === 0 ? 1 : 0);
            if (!reserved[ar + r][ac + c]) {
              matrix[ar + r][ac + c] = v;
              reserved[ar + r][ac + c] = true;
            }
          }
        }
      }
    }
  }

  // Format reserve
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Assembly of stream
  let bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte indicator
  pushBits(bytes.length, 8); // Characters count
  for (const b of bytes) pushBits(b, 8);
  pushBits(0, 4); // Terminator

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCW = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216, 254, 290, 334, 365, 415, 453, 507, 563, 627, 669];
  const totalDataBits = (dataCW[version - 1] || 16) * 8;
  const padBytes = [0b11101100, 0b00010001];
  let pi = 0;
  while (bits.length < totalDataBits) {
    pushBits(padBytes[pi % 2], 8);
    pi++;
  }
  bits = bits.slice(0, totalDataBits);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    codewords.push(b);
  }

  const eccCounts = [10, 16, 26, 36, 48, 64, 72, 88, 110, 130, 150, 176, 198, 216, 240, 280, 308, 338, 384, 410];
  const eccCount = eccCounts[version - 1] || 10;
  const eccWords = computeECC(codewords, eccCount);
  const allCW = [...codewords, ...eccWords];

  let bitIdx = 0;
  const allBits: number[] = [];
  for (const cw of allCW) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((cw >> i) & 1);
    }
  }

  let up = true;
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5;
    for (let row2 = 0; row2 < size; row2++) {
      const row = up ? size - 1 - row2 : row2;
      for (let delta = 0; delta <= 1; delta++) {
        const c = col - delta;
        if (c < 0 || c >= size) continue;
        if (!reserved[row][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Apply standard mask (row + col) % 2 === 0
          matrix[row][c] = bit ^ ((row + col) % 2 === 0 ? 1 : 0);
        }
      }
    }
    up = !up;
  }

  // Format string
  const fmt = 0b101010000010010;
  const fmtBits: number[] = [];
  for (let i = 14; i >= 0; i--) {
    fmtBits.push((fmt >> i) & 1);
  }

  const fmtPos = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = fmtPos[i];
    if (r < size && c < size) matrix[r][c] = fmtBits[i];
  }

  for (let i = 0; i < 8; i++) {
    if (size - 1 - i >= 0) matrix[size - 1 - i][8] = fmtBits[i];
  }
  for (let i = 0; i < 7; i++) {
    if (size - 8 + i < size) matrix[8][size - 8 + i] = fmtBits[14 - i];
  }

  return matrix;
}

function computeECC(data: number[], eccCount: number): number[] {
  const PRIM = 0x11d;
  const gfExp = new Uint8Array(512);
  const gfLog = new Uint8Array(256);
  let x = 1;

  for (let i = 0; i < 255; i++) {
    gfExp[i] = x;
    gfLog[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= PRIM;
  }
  for (let i = 255; i < 512; i++) {
    gfExp[i] = gfExp[i - 255];
  }

  const gfMul = (a: number, b: number) => {
    return (a === 0 || b === 0) ? 0 : gfExp[(gfLog[a] + gfLog[b]) % 255];
  };

  let g = [1];
  for (let i = 0; i < eccCount; i++) {
    const p = [1, gfExp[i]];
    const r = new Array(g.length + p.length - 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      for (let k = 0; k < p.length; k++) {
        r[j + k] ^= gfMul(g[j], p[k]);
      }
    }
    g = r;
  }

  const msg = [...data, ...new Array(eccCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const c = msg[i];
    if (c !== 0) {
      for (let j = 0; j < g.length; j++) {
        msg[i + j] ^= gfMul(g[j], c);
      }
    }
  }

  return msg.slice(data.length);
}

// Global print utility
export function openStickerPrintWindow(
  uid: string,
  sender: string,
  receiver: string,
  dest: string,
  tel: string,
  hbl: string,
  items: string,
  qrDataUrl: string,
  pdfMode: boolean = false
) {
  const w = window.open('', '_blank', 'width=540,height=480');
  if (!w) {
    alert('Please allow popups in your browser to print the sticker label.');
    return;
  }
  w.document.write(`<!DOCTYPE html>
<html>
<head>
 <title>Parcel Sticker — ${uid}</title>
 <style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{margin:0;padding:${pdfMode ? '0' : '20px'};font-family:system-ui, -apple-system, sans-serif;background:#ffffff;color:#111111}
  .stk{width:${pdfMode ? '100%' : '390px'};border:3px solid #1a1a1a;border-radius:${pdfMode ? '0' : '10px'};overflow:hidden;margin:auto;box-shadow:${pdfMode ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'}}
  .hdr{background:#1e40af;color:#ffffff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}
  .ht{font-size:13px;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
  .hid{font-size:11px;background:rgba(255,255,255,0.22);padding:2px 8px;border-radius:4px;font-family:monospace;font-weight:700}
  .body{display:flex;padding:12px 14px;background:#ffffff;gap:12px}
  .qr{flex-shrink:0;display:flex;align-items:center;justify-content:center}
  .info{flex:1;min-width:0}
  .row{margin-bottom:6px}
  .lbl{font-size:8px;font-weight:700;color:#666666;text-transform:uppercase;letter-spacing:.05em}
  .val{font-size:11.5px;color:#111111;font-weight:600;line-height:1.35;word-break:break-word}
  .desc{border-top:1px solid #e5e5e5;padding:8px 14px;background:#f9f9f7}
  .dlbl{font-size:8px;font-weight:700;color:#666666;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
  .dval{font-size:11px;color:#333333;font-weight:500;line-height:1.4}
  .ftr{background:#1e40af;color:#ffffff;text-align:center;padding:6px;font-size:8.5px;letter-spacing:.08em;font-weight:700}
  @media print{
    body{padding:0}
    .stk{width:100%;border-radius:0;border:3px solid #000000}
  }
 </style>
</head>
<body>
 <div class="stk">
  <div class="hdr">
   <span class="ht">Sea Cargo — Japan → Sri Lanka</span>
   <span class="hid">${uid}</span>
  </div>
  <div class="body">
   ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" width="96" height="96" alt="QR Code"></div>` : ''}
   <div class="info">
    <div class="row"><div class="lbl">Sender</div><div class="val">${sender}</div></div>
    <div class="row"><div class="lbl">Receiver</div><div class="val">${receiver}</div></div>
    <div class="row"><div class="lbl">Destination</div><div class="val">${dest}</div></div>
    <div class="row"><div class="lbl">Contact</div><div class="val">${tel}</div></div>
    <div class="row"><div class="lbl">HBL No.</div><div class="val">${hbl}</div></div>
   </div>
  </div>
  <div class="desc">
    <div class="dlbl">Declared Items</div>
    <div class="dval">${items}</div>
  </div>
  <div class="ftr">SCAN QR CODE TO TRACK PARCEL STATUS IN REAL TIME</div>
 </div>
 <script>
  window.onload = function() {
    setTimeout(function(){ window.print(); }, 400);
  };
 <\/script>
</body>
</html>`);
  w.document.close();
}
