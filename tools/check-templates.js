#!/usr/bin/env node
/* ==========================================================================
   check-templates.js — 스타일 폴더 + 컴포넌트 라이브러리 규약 검사

     node tools/check-templates.js

   20개 폴더 × 6파일을 손으로 만드는 동안 같은 실수가 반복된다.
   기계적으로 잡을 수 있는 것만 잡는다 (레이아웃 품질은 눈으로 볼 것):
     1. v{1,2,3}_{01_cover,02_global}.html 6개가 다 있는가
     2. 1행에 @card 마커가 있는가
     3. 자기완결형인가 — 외부 CSS 링크가 없고 <style>이 있는가
     4. 그 <style>이 자기 베리에이션 토큰 블록(.v1 등)을 담고 있는가
     5. .slide에 자기 베리에이션 클래스가 붙었는가
     6. <script>가 없는가 — JS 0줄이어야 한다 (축소는 docs/gallery.css가 한다)

   추가로 Figma import를 깨는 CSS를 경고로 센다. `--figma`로 파일:줄 목록 출력.

   02_COMPONENTS_LIBRARY(다이어그램·타이포·차트·표·UI 부품)는 규약이 더 얕다 —
   베리에이션·1920 캔버스가 없으므로 2·3·6번만 본다.

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
      // JS 0줄이어야 한다. body.style.zoom은 html.to.design에서 좌표계를 갈라
      // 텍스트를 밀어버린다. 축소는 갤러리(docs/gallery.css)가 iframe 쪽에서 한다.
      if (/<script[\s>]/.test(raw)) {
        errors.push(`${style}/${file} — <script> 남음 (축소는 갤러리가 한다)`);
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

/* --- 컴포넌트: 스타일 폴더와 규약이 다르다 (베리에이션·1920 캔버스 없음) ---
   다이어그램과 나머지 컴포넌트가 같은 규약을 쓰므로 한 루프로 본다.
   기계로 잡을 수 있는 3가지만 본다. 나머지는 갤러리에서 눈으로. */
const LIB = path.join(ROOT, '02_COMPONENTS_LIBRARY');
const COMPONENT_DIRS = ['03_DIAGRAMS', '01_TYPOGRAPHY', '02_CHARTS', '04_TABLES', '05_UI_PARTS']
  .map(d => path.join(LIB, d));
const componentFiles = COMPONENT_DIRS.flatMap(htmlFiles);

for (const file of componentFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');

  if (!/^\s*<!--\s*@card\s/.test(raw)) errors.push(`${rel} — 1행 @card 마커 없음`);
  if (/<link\s+rel="stylesheet"/.test(raw)) errors.push(`${rel} — 외부 CSS 링크 남음`);
  if (/<script[\s>]/.test(raw)) errors.push(`${rel} — <script> 남음 (축소는 갤러리가 한다)`);
}

/* --- Figma import 린트 ---------------------------------------------------
   html.to.design이 못 다루는 CSS. 규약 위반이 아니라 품질 경고이므로
   exit code를 올리지 않는다 (아직 재작업이 안 끝난 파일이 많다).
   `node tools/check-templates.js --figma`로 파일:줄 목록을 본다.
   ponytail: 문자열 매칭이라 주석 속 속성명도 잡힌다 — 목록이 짧아지면 신경 쓸 것 */
const FIGMA_BANNED = [
  [/-webkit-background-clip\s*:\s*text|background-clip\s*:\s*text/, 'background-clip:text — 그라디언트가 박스를 칠하고 글자가 사라진다'],
  [/body\.style\.zoom|\bzoom\s*:/, 'zoom — 좌표계가 갈려 전체가 어긋난다'],
  [/backdrop-filter/, 'backdrop-filter — 무시되거나 불투명해진다'],
  // backdrop-filter를 겹쳐 세지 않도록 선언 시작을 요구한다
  [/(^|[;{\s])filter\s*:\s*[^;]*blur\(/, 'filter:blur — 래스터화될 수 있다'],
  // polygon()은 대체로 그대로 들어온다 — 곡선 함수만 문제다
  [/clip-path\s*:\s*(circle|ellipse|path|url)\(|clip-path\s*:\s*inset\([^;]*round/,
    'clip-path 곡선 — 깨진다 (인라인 SVG로)'],
  // 미검증 — 실제 import에서 세로쓰기가 깨지는지 확인되면 대응한다.
  // 라틴·숫자는 transform:rotate(90deg)로, 한글은 글자 낱개 flex 세로 배열로 옮기면 된다.
  [/writing-mode/, 'writing-mode — 세로쓰기, import 결과 확인 필요(미검증)'],
  [/conic-gradient/, 'conic-gradient — 미지원'],
  [/mix-blend-mode/, 'mix-blend-mode — 무시된다'],
  [/position\s*:\s*sticky/, 'position:sticky — 정적 캡처에서 무의미'],
  [/text-stroke/, '-webkit-text-stroke — 유실된다 (8방향 text-shadow로)'],
  [/color\s*:\s*transparent/, 'color:transparent — 글자가 안 보이게 들어온다'],
];

const allHtml = [...htmlFiles(BASE), ...componentFiles];
const figmaHits = [];
for (const file of allHtml) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  // 주석을 먼저 지운다 — "backdrop-filter는 쓰지 말 것" 같은 설명문을 위반으로
  // 세지 않기 위해서다. 줄 번호가 밀리지 않게 개행만 남긴다.
  const lines = stripComments(fs.readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    for (const [re, msg] of FIGMA_BANNED) {
      if (re.test(line)) figmaHits.push(`${rel}:${i + 1} — ${msg}`);
    }
  });
}

if (process.argv.includes('--figma')) {
  console.log(`\n  Figma import 경고 ${figmaHits.length}건\n`);
  for (const h of figmaHits) console.log(`  · ${h}`);
  console.log('');
}

if (errors.length) {
  console.error(`\n  ${errors.length}건 발견\n`);
  for (const e of errors) console.error(`  ! ${e}`);
  console.error('');
  process.exit(1);
}

const n = fs.readdirSync(BASE).filter(isDir).length;
// data-anchor는 강제하지 않는다 (빌더가 박스 8앵커로 폴백한다) — 진척만 보여준다
const anchored = componentFiles.filter(f => fs.readFileSync(f, 'utf8').includes('data-anchor=')).length;
console.log(`\n  스타일 ${n}개 · 파일 ${n * 6}개 · 컴포넌트 ${componentFiles.length}개 — 규약 통과`);
console.log(`  조합 빌더 앵커(data-anchor) 보유 ${anchored} / ${componentFiles.length}개`);
console.log(`  Figma import 경고 ${figmaHits.length}건 — 목록은 --figma\n`);

/* CSS·HTML 주석을 비운다. 줄 수를 보존해야 file:line이 맞는다. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g,
    m => m.replace(/[^\n]/g, ' '));
}

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
