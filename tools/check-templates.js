#!/usr/bin/env node
/* ==========================================================================
   check-templates.js — 스타일 폴더 규약 검사

     node tools/check-templates.js

   20개 폴더 × 6파일을 손으로 만드는 동안 같은 실수가 반복된다.
   기계적으로 잡을 수 있는 것만 잡는다 (레이아웃 품질은 눈으로 볼 것):
     1. v{1,2,3}_{01_cover,02_global}.html 6개가 다 있는가
     2. 1행에 @card 마커가 있는가
     3. 자기완결형인가 — 외부 CSS 링크가 없고 <style>이 있는가
     4. 그 <style>이 자기 베리에이션 토큰 블록(.v1 등)을 담고 있는가
     5. .slide에 자기 베리에이션 클래스가 붙었는가
     6. 자기축소 스크립트가 있는가 — 갤러리 미리보기가 여기에 의존한다

   HTML이 단일 소스다 — 외부 _style.css는 없다. 토큰은 각 파일 안에 있다.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, '01_TEMPLATES_BY_STYLE');
const VARIANTS = ['v1', 'v2', 'v3'];
const KINDS = ['01_cover', '02_global'];

const errors = [];

for (const style of fs.readdirSync(BASE).filter(isDir)) {
  const dir = path.join(BASE, style);
  const accents = new Map();      // 베리에이션 → --color-accent 값

  for (const v of VARIANTS) {
    for (const kind of KINDS) {
      const file = `${v}_${kind}.html`;
      const abs = path.join(dir, file);
      if (!fs.existsSync(abs)) {
        errors.push(`${style}/${file} 없음`);
        continue;
      }

      const raw = fs.readFileSync(abs, 'utf8');

      if (!/^\s*<!--\s*@card\s/.test(raw)) {
        errors.push(`${style}/${file} — 1행 @card 마커 없음`);
      }
      // .slide에 베리에이션 클래스가 붙어야 토큰이 적용된다
      if (!new RegExp(`class="slide[^"]*\\b${v}\\b`).test(raw)) {
        errors.push(`${style}/${file} — .slide에 .${v} 클래스 없음`);
      }
      // 자기완결형: 외부 CSS 링크가 없고, CSS를 직접 품고 있어야 한다.
      if (/<link\s+rel="stylesheet"/.test(raw)) {
        errors.push(`${style}/${file} — 외부 CSS 링크 남음`);
      }
      if (!raw.includes('<style>')) {
        errors.push(`${style}/${file} — <style> 블록 없음`);
      }
      // 자기축소: 갤러리 썸네일과 확대 미리보기가 이것에 의존한다.
      // 없으면 iframe 안에서 1920px 원본이 잘려 보인다.
      if (!raw.includes('self-fit') || !raw.includes('body.style.zoom')) {
        errors.push(`${style}/${file} — 자기축소 스크립트 없음 (body.style.zoom)`);
      }
      // 토큰 블록이 실제로 들어 있는가 — 갤러리 상세 패널이 이걸 읽어 값을 보여준다
      const accent = readAccent(raw, v);
      if (!accent) {
        errors.push(`${style}/${file} — .${v} 블록에서 --color-accent를 못 찾음`);
      } else {
        const prev = accents.get(v);
        if (prev && prev !== accent) {
          errors.push(`${style}/${file} — 표지·전역의 .${v} accent 불일치 (${prev} ≠ ${accent})`);
        }
        accents.set(v, accent);
      }
    }
  }
}

/* --- 다이어그램: 스타일 폴더와 규약이 다르다 (베리에이션·1920 캔버스 없음) ---
   기계로 잡을 수 있는 3가지만 본다. 나머지는 갤러리에서 눈으로. */
const DIAGRAMS = path.join(ROOT, '02_COMPONENTS_LIBRARY', '03_DIAGRAMS');

for (const file of htmlFiles(DIAGRAMS)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');

  if (!/^\s*<!--\s*@card\s/.test(raw)) errors.push(`${rel} — 1행 @card 마커 없음`);
  if (/<link\s+rel="stylesheet"/.test(raw)) errors.push(`${rel} — 외부 CSS 링크 남음`);
  if (!raw.includes('body.style.zoom')) errors.push(`${rel} — 자기축소 스크립트 없음`);
}

if (errors.length) {
  console.error(`\n  ${errors.length}건 발견\n`);
  for (const e of errors) console.error(`  ! ${e}`);
  console.error('');
  process.exit(1);
}

const n = fs.readdirSync(BASE).filter(isDir).length;
const d = htmlFiles(DIAGRAMS).length;
console.log(`\n  스타일 ${n}개 · 파일 ${n * 6}개 · 다이어그램 ${d}개 — 규약 통과\n`);

function isDir(f) {
  return fs.statSync(path.join(BASE, f)).isDirectory();
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

/* 해당 베리에이션 블록의 --color-accent를 읽는다.
   docs/gallery.js의 상세 패널이 쓰는 것과 같은 방식이라, 여기서 통과하면 거기서도 읽힌다.
   주석을 먼저 걷어낸다 — 주석 속 ".v1/.v2/.v3" 문구를 선택자로 오인하면
   정규식이 진짜 블록을 건너뛴다(실제로 한 번 당했다).
   선택자는 `{`와 같은 줄에 있어야 하므로 `.v2 {` 와 `.v1, .v2, .v3 {` 둘 다 잡힌다. */
function readAccent(html, variant) {
  const css = html.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = new RegExp(`^[^\\n{}]*\\.${variant}\\b[^\\n{}]*\\{([^}]*)\\}`, 'gm');
  let found = null;
  for (const m of css.matchAll(re)) {
    const hit = m[1].match(/--color-accent\s*:\s*([^;]+);/);
    if (hit) found = hit[1].trim();     // 나중 블록이 앞의 값을 덮어쓴다
  }
  return found;
}
