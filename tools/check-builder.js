#!/usr/bin/env node
/* ==========================================================================
   check-builder.js — 조합 빌더의 내보내기 로직 검사

     node tools/check-builder.js

   브라우저 없이 확인할 수 있는 것만 본다. 드래그·스냅은 눈으로 볼 것.
     1. 모든 부품 파일이 parseSource()로 세 조각(베이스 CSS · 전용 CSS · 본문)으로 갈리는가
     2. 베이스 CSS 블록이 전 파일 동일한가 — 합성 시 1회만 넣기 때문에 다르면 깨진다
     3. prefixCss()가 셀렉터에 #노드ID를 빠짐없이 붙이는가 (접두사 없는 규칙 = 충돌 위험)

   builder.js를 복사하지 않고 vm으로 그 파일을 그대로 실행해 함수를 꺼내 쓴다 —
   검사 대상과 실제 코드가 갈라지지 않는다.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const LIB = path.join(ROOT, '02_COMPONENTS_LIBRARY');
const DIRS = ['03_DIAGRAMS', '01_TYPOGRAPHY', '02_CHARTS', '04_TABLES', '05_UI_PARTS'];

const { parseSource, prefixCss } = loadBuilder();

const files = DIRS.flatMap(d => htmlFiles(path.join(LIB, d)));
const errors = [];
let base = null;
let baseFile = null;

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.replace(/<!--[\s\S]*?-->/g, '').trim()) continue;   // 미착수 파일은 건너뛴다

  let src;
  try {
    src = parseSource(raw);
  } catch (err) {
    errors.push(`${rel} — parseSource 실패: ${err.message}`);
    continue;
  }

  if (!src.body.includes('class="component"')) errors.push(`${rel} — 본문에 .component 루트가 없음`);

  // 줄바꿈은 비교에서 제외한다 — core.autocrlf 때문에 작업 트리의 CRLF/LF가 섞인다.
  // git이 커밋 시 정규화하므로 내용 차이만 본다.
  const nb = src.base.replace(/\r\n/g, '\n');
  if (base === null) { base = nb; baseFile = rel; }
  else if (nb !== base) errors.push(`${rel} — 베이스 CSS가 ${baseFile}와 다름`);

  const scoped = prefixCss(src.css, '#n1');
  for (const m of scoped.matchAll(/(^|\n)\s*([^{}\n][^{}]*?)\s*\{/g)) {
    for (const sel of m[2].split(',')) {
      if (!sel.trim().startsWith('#n1 ')) errors.push(`${rel} — 접두사 누락: "${sel.trim()}"`);
    }
  }
}

if (errors.length) {
  console.error(`\n  ${errors.length}건 발견\n`);
  for (const e of errors.slice(0, 40)) console.error(`  ! ${e}`);
  if (errors.length > 40) console.error(`  … 외 ${errors.length - 40}건`);
  console.error('');
  process.exit(1);
}

console.log(`\n  부품 ${files.length}개 · 베이스 CSS 동일 · 셀렉터 접두사 정상 — 내보내기 준비됨\n`);

/* --- builder.js에서 함수만 꺼내기 --------------------------------------
   최상단이 document를 만지므로 무엇을 물어도 스스로를 돌려주는 스텁을 준다.
   부작용 있는 초기화(init)는 fetch 스텁이 즉시 실패해 조용히 끝난다.
   ---------------------------------------------------------------------- */
function loadBuilder() {
  const stub = new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive || k === 'toString' ? () => '' : stub),
    set: () => true,
    apply: () => stub,
  });

  const ctx = {
    document: stub,
    localStorage: { getItem: () => null, setItem() {} },
    fetch: () => Promise.reject(new Error('no network in check')),
    console: { warn() {}, log() {}, error() {} },
    URL: stub,
    Blob: stub,
    FileReader: stub,
    setTimeout,
    clearTimeout,
    Math,
    Date,
    JSON,
  };
  ctx.window = ctx;
  ctx.addEventListener = () => {};

  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'builder.js'), 'utf8'), ctx,
    { filename: 'builder.js' });

  assert.strictEqual(typeof ctx.parseSource, 'function', 'parseSource를 못 찾았다');
  assert.strictEqual(typeof ctx.prefixCss, 'function', 'prefixCss를 못 찾았다');
  return ctx;
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}
