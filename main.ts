// The World in One Day - Wednesday 18 November 2026.
// A program that draws one newspaper front page, 1024 x 1024, in pure
// Node 22 standard library code: no network, no fonts on disk, no image
// files. Every letter is drawn from a 5x7 bitmap font defined below, and
// every picture is drawn from rectangles, circles and triangles, so the
// program writes exactly the same PNG bytes on every run.
//
// The stories are the day's world news as reported on 18 November 2026:
// Trump in Manila and on to Shenzhen, the US strike on Qeshm Island and
// Iran's drone attacks in the Gulf, the attack on the Kerch Bridge to
// Crimea, the Alaska Senate race, measles and Ebola, Gaza, and Israel.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// A 5x7 bitmap font. Each glyph is 7 rows of 5 bits, written as strings
// of 0 and 1. Only capitals, digits and the punctuation the page uses.
const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
};

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const img = Buffer.alloc(W * H * 3);
const PAPER = [248, 243, 230];
const INK = [20, 20, 20];
const RED = [180, 35, 24];
const BLUE = [30, 58, 95];
const SKY = [174, 205, 226];
const SEA = [38, 84, 124];
const SAND = [214, 186, 138];
const GREEN = [46, 110, 72];
const GOLD = [201, 148, 42];
const GREY = [120, 120, 116];
const LIGHT = [232, 226, 210];
const WHITE = [255, 255, 255];

function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function circle(cx, cy, r, c) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (i * i + j * j <= r * r) px(cx + i, cy + j, c);
  }
}
function ring(cx, cy, r, t, c) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = i * i + j * j;
    if (d <= r * r && d > (r - t) * (r - t)) px(cx + i, cy + j, c);
  }
}
function tri(x1, y1, x2, y2, x3, y3, c) {
  const minX = Math.min(x1, x2, x3); const maxX = Math.max(x1, x2, x3);
  const minY = Math.min(y1, y2, y3); const maxY = Math.max(y1, y2, y3);
  const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d;
    const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d;
    const cc = 1 - a - b;
    if (a >= 0 && b >= 0 && cc >= 0) px(x, y, c);
  }
}
function line(x1, y1, x2, y2, c) {
  const dx = Math.abs(x2 - x1); const dy = -Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1; const sy = y1 < y2 ? 1 : -1;
  let err = dx + dy; let x = x1; let y = y1;
  for (;;) {
    px(x, y, c); px(x + 1, y, c);
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

// -------------------------------------------------------------------- text
function textWidth(s, scale) { return s.length * 6 * scale - scale; }
function drawText(x, y, s, scale, c) {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] || FONT['?'];
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
      if (g[r][col] === '1') rect(cx + col * scale, y + r * scale, scale, scale, c);
    }
    cx += 6 * scale;
  }
  return cx;
}
function drawTextCentered(cx, y, s, scale, c) {
  drawText(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}
function wrapText(s, maxW, scale) {
  const words = s.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (textWidth(test, scale) <= maxW) { cur = test; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(x, y, s, maxW, scale, c, lh) {
  const lines = wrapText(s, maxW, scale);
  lines.forEach((ln, i) => drawText(x, y + i * lh, ln, scale, c));
  return y + lines.length * lh;
}

// --------------------------------------------------------------------- PNG
const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- illustrations
function manilaArt(x, y, w, h) {
  rect(x, y, w, h, SKY);
  circle(x + w - 52, y + 34, 22, GOLD);
  rect(x, y + h - 46, w, 46, SEA);
  rect(x + 18, y + h - 118, 52, 72, BLUE);
  rect(x + 82, y + h - 96, 44, 50, GREY);
  rect(x + 138, y + h - 132, 58, 86, BLUE);
  rect(x + 208, y + h - 104, 48, 58, GREY);
  rect(x + 268, y + h - 88, 56, 42, BLUE);
  // a plane crossing the sky
  rect(x + 40, y + 26, 72, 9, WHITE);
  tri(x + 112, y + 26, x + 136, y + 30, x + 112, y + 35, WHITE);
  tri(x + 48, y + 26, x + 56, y + 12, x + 64, y + 26, WHITE);
  tri(x + 70, y + 35, x + 86, y + 50, x + 92, y + 35, WHITE);
  // four small flags
  const cols = [RED, BLUE, GREEN, GOLD];
  for (let i = 0; i < 4; i++) {
    const fx = x + 30 + i * 78;
    line(fx, y + h - 46, fx, y + h - 78, INK);
    rect(fx, y + h - 78, 34, 18, cols[i]);
  }
}
function gulfArt(x, y, w, h) {
  rect(x, y, w, h, [214, 126, 84]);
  rect(x, y + h - 34, w, 34, SEA);
  tri(x + 30, y + h - 34, x + 110, y + h - 34, x + 70, y + h - 66, SAND);
  circle(x + w - 70, y + 34, 16, GOLD);
  circle(x + w - 70, y + 34, 26, RED);
  circle(x + w - 70, y + 34, 10, [255, 220, 120]);
  for (let i = 0; i < 5; i++) circle(x + 150 + i * 26, y + 26 + (i % 2) * 14, 3, INK);
  rect(x + 150, y + 52, 120, 4, INK);
}
function bridgeArt(x, y, w, h) {
  rect(x, y, w, h, SKY);
  rect(x, y + h - 30, w, 30, SEA);
  rect(x, y + 52, w, 10, INK);
  tri(x + 20, y + 52, x + w - 20, y + 52, x + w / 2, y + 14, BLUE);
  rect(x + w / 2 - 16, y + 40, 32, 22, PAPER);
  circle(x + w / 2 - 30, y + 30, 10, GREY);
  circle(x + w / 2 + 24, y + 22, 12, GREY);
  circle(x + w / 2 + 4, y + 12, 9, GREY);
}
function alaskaArt(x, y, w, h) {
  rect(x, y, w, h, SKY);
  tri(x, y + h, x + 130, y + h, x + 60, y + 18, BLUE);
  tri(x + 90, y + h, x + 260, y + h, x + 180, y + 30, GREY);
  tri(x + 40, y + 34, x + 80, y + 34, x + 60, y + 18, WHITE);
  tri(x + 160, y + 46, x + 200, y + 46, x + 180, y + 30, WHITE);
  rect(x + w - 92, y + h - 52, 64, 52, RED);
  rect(x + w - 92, y + h - 52, 64, 12, WHITE);
  rect(x + w - 68, y + h - 66, 16, 14, INK);
  circle(x + 34, y + 30, 12, GOLD);
}
function healthArt(x, y, w, h) {
  rect(x, y, w, h, WHITE);
  rect(x + 26, y + 22, 18, 52, RED);
  rect(x + 12, y + 36, 46, 18, RED);
  circle(x + w - 64, y + 42, 20, BLUE);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    line(x + w - 64, y + 42, x + w - 64 + Math.round(Math.cos(a) * 30), y + 42 + Math.round(Math.sin(a) * 30), BLUE);
  }
  circle(x + w - 64, y + 42, 20, BLUE);
  circle(x + w - 130, y + 66, 12, RED);
  circle(x + w - 40, y + 74, 8, GREEN);
}
function gazaArt(x, y, w, h) {
  rect(x, y, w, h, SKY);
  for (let i = 0; i < 6; i++) line(x + 30 + i * 44, y + 12, x + 22 + i * 44, y + 34, BLUE);
  tri(x + 20, y + h - 10, x + 120, y + h - 10, x + 70, y + h - 58, SAND);
  tri(x + 130, y + h - 10, x + 230, y + h - 10, x + 180, y + h - 48, [190, 180, 160]);
  rect(x + w - 78, y + h - 40, 56, 40, WHITE);
  rect(x + w - 78, y + h - 40, 56, 10, RED);
  drawText(x + w - 70, y + h - 26, 'AID', 2, RED);
}
function israelArt(x, y, w, h) {
  rect(x, y, w, h, SKY);
  rect(x, y + h - 18, w, 18, SAND);
  circle(x + w / 2, y + 34, 22, GOLD);
  rect(x + 56, y + 44, w - 112, 10, BLUE);
  for (let i = 0; i < 5; i++) rect(x + 66 + i * 38, y + 54, 12, 34, WHITE);
  rect(x + 56, y + 88, w - 112, 6, BLUE);
  line(x + 30, y + 20, x + 30, y + h - 18, INK);
  rect(x + 30, y + 20, 30, 16, BLUE);
}

// -------------------------------------------------------------------- panels
function panel(x, y, w, h, kicker, headline, deck, art) {
  rect(x, y, w, h, WHITE);
  rect(x, y, w, 2, INK); rect(x, y + h - 2, w, 2, INK);
  rect(x, y, 2, h, INK); rect(x + w - 2, y, 2, h, INK);
  art(x + 2, y + 2, w - 4, 84);
  rect(x, y + 86, w, 2, INK);
  drawText(x + 14, y + 100, kicker, 2, RED);
  const afterHead = drawPara(x + 14, y + 122, headline, w - 28, 3, INK, 24);
  drawPara(x + 14, afterHead + 6, deck, w - 28, 2, [60, 60, 60], 17);
}

// --------------------------------------------------------------------- page
rect(0, 0, W, H, PAPER);
drawTextCentered(512, 26, 'THE WORLD IN ONE DAY', 6, INK);
rect(28, 78, 968, 4, RED);
rect(28, 88, 968, 2, INK);
drawTextCentered(512, 100, 'WEDNESDAY, 18 NOVEMBER 2026', 3, INK);
rect(28, 128, 968, 2, INK);

// lead story: Trump in Manila
rect(28, 138, 968, 236, WHITE);
rect(28, 138, 968, 3, INK); rect(28, 371, 968, 3, INK);
rect(28, 138, 3, 236, INK); rect(993, 138, 3, 236, INK);
manilaArt(31, 141, 360, 230);
rect(391, 141, 3, 230, INK);
drawText(408, 158, 'MANILA - DIPLOMACY', 2, RED);
drawPara(408, 184, 'TRUMP IN MANILA, THEN ON TO SHENZHEN', 560, 4, INK, 32);
drawPara(408, 184 + 2 * 32, 'MEETS MARCOS AND THE QUAD LEADERS, HAILS A BIG TRADE DEAL WITH THE PHILIPPINES, AND FLIES TO CHINA FOR APEC AND A THREE-WAY SUMMIT WITH XI AND PUTIN ON THURSDAY.', 560, 2, [60, 60, 60], 20);

// six more stories in two rows of three
panel(28, 390, 312, 256, 'THE GULF - CONFLICT', 'US STRIKES QESHM AS IRAN HITS BACK', 'US JETS HIT A MISSILE SITE ON QESHM. IRAN HIT BACK.', gulfArt);
panel(356, 390, 312, 256, 'UKRAINE - WAR', 'KERCH BRIDGE HIT, SPAN FALLS', 'UKRAINE HIT THE BRIDGE TO CRIMEA AGAIN. PART OF IT FELL INTO THE SEA.', bridgeArt);
panel(684, 390, 312, 256, 'WASHINGTON - POLITICS', 'DEMOCRATS TAKE ALASKA, 56 SEATS', 'PELTOLA WON ALASKA FOR THE DEMOCRATS. THEY NOW HOLD 56 OF 100 SEATS.', alaskaArt);
panel(28, 662, 312, 256, 'HEALTH - TWO OUTBREAKS', 'MEASLES FREE NO MORE. EBOLA GROWS', 'US MEASLES CASES PASSED 5,400. EBOLA IN CONGO PASSED 11,000 CASES.', healthArt);
panel(356, 662, 312, 256, 'GAZA - AID', 'ALLIES URGE AID INTO FLOODED GAZA', 'AUSTRALIA, CANADA, ITALY AND BRITAIN URGED ISRAEL TO LET AID IN.', gazaArt);
panel(684, 662, 312, 256, 'JERUSALEM - POLITICS', 'EISENKOT ASKED TO FORM GOVERNMENT', 'HERZOG ASKED GADI EISENKOT TO FORM THE NEXT GOVERNMENT.', israelArt);

// also today
rect(28, 928, 968, 72, BLUE);
drawText(44, 938, 'ALSO TODAY', 2, GOLD);
drawPara(44, 960, 'RUSSIAN PLANE CRASHES IN SIBERIA, 19 DEAD - CYCLONE XAVIER HITS THE COOK ISLANDS - APEC OPENS IN SHENZHEN', 936, 2, WHITE, 17);
drawTextCentered(512, 1006, 'ALL STORIES WERE REPORTED ON 18 NOVEMBER 2026', 1, [90, 90, 90]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
