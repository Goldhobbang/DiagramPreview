#!/usr/bin/env node
/* ==========================================================================
   build-gallery.js — 저장소를 스캔해 docs/manifest.json을 생성한다.

     node tools/build-gallery.js

   의존성 없음. 손으로 manifest를 고치지 않는다 — 이 스크립트가 유일한 생성 경로다.

   메타데이터 단일 소스는 HTML 파일 1행의 마커 주석:
     <!-- @card 가로 단계 흐름 | 4~6단계 절차 설명 | 1400x700 -->
     제목 | 설명 | 크기 [| 상태강제]
   마커가 없으면 파일명에서 제목을 만들고 폴더 기본 크기를 쓴다.

   status는 파일 내용에서 자동 판정한다 (수동 동기화 없음):
     주석을 모두 제거한 나머지가 비었으면 todo, 아니면 done.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'manifest.json');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);

/* --- 섹션 정의 --------------------------------------------------------
   dir      : ROOT 기준 스캔 경로
   groupBy  : 'subdir' = 하위 폴더 하나가 그룹 / 'self' = 이 폴더 자체가 그룹
   defaults : 마커에 크기가 없을 때 쓰는 기본값
   ---------------------------------------------------------------------- */
const SECTIONS = [
  {
    id: 'slides', label: '슬라이드 템플릿', kind: 'html',
    dirs: ['01_TEMPLATES_BY_STYLE'], groupBy: 'subdir',
    defaults: { w: 1920, h: 1080 },
  },
  {
    id: 'diagrams', label: '다이어그램', kind: 'html',
    dirs: ['02_COMPONENTS_LIBRARY/03_DIAGRAMS'], groupBy: 'subdir',
    defaults: { w: 1400, h: 700 },
  },
  {
    id: 'components', label: '컴포넌트', kind: 'html',
    dirs: [
      '02_COMPONENTS_LIBRARY/01_TYPOGRAPHY',
      '02_COMPONENTS_LIBRARY/02_CHARTS',
      '02_COMPONENTS_LIBRARY/04_TABLES',
      '02_COMPONENTS_LIBRARY/05_UI_PARTS',
    ],
    groupBy: 'self',
    defaults: { w: 1400, h: 700 },
  },
  {
    // 조합 빌더(docs/builder.html)가 내보낸 합성 HTML을 여기 두면 갤러리에 뜬다.
    id: 'drafts', label: '조합 · 초안', kind: 'html',
    dirs: ['99_DRAFTS'], groupBy: 'self',
    defaults: { w: 1920, h: 1080 },
  },
  {
    id: 'media', label: '이미지 · 아이콘', kind: 'image',
    dirs: ['03_ASSETS/images', '03_ASSETS/icons'], groupBy: 'self',
  },
];

/* 폴더 id → 사람이 읽는 라벨. 없으면 폴더명을 그대로 다듬어 쓴다. */
const LABELS = {
  // 20 UI/UX 스타일 × 3 베리에이션. 기획: 00_GUIDES/PLANS/
  '01_FLAT_DESIGN': '01 플랫 디자인',
  '02_MINIMALISM': '02 미니멀리즘',
  '03_DARK_MODE': '03 다크 모드',
  '04_GLASSMORPHISM': '04 글래스모피즘',
  '05_NEUMORPHISM': '05 뉴모피즘',
  '06_CARD_BASED': '06 카드 기반',
  '07_3D_ILLUSTRATION': '07 3D · 일러스트',
  '08_MAXIMALISM': '08 맥시멀리즘',
  '09_BRUTALISM': '09 브루탈리즘',
  '10_SKEUOMORPHISM': '10 스큐어모피즘',
  '11_NEO_BRUTALISM': '11 네오 브루탈리즘',
  '12_BENTO_GRID': '12 벤토 그리드',
  '13_BOLD_TYPOGRAPHY': '13 볼드 타이포그래피',
  '14_CLEAN_WHITESPACE': '14 클린 · 화이트 스페이스',
  '15_SOFT_GRADIENTS': '15 소프트 그라데이션',
  '16_INTERACTIVE_MOTION_UI': '16 인터랙티브 모션 UI',
  '17_RETRO_PIXEL': '17 레트로 · 픽셀 아트',
  '18_NEON_CYBERPUNK': '18 네온 · 사이버펑크',
  '19_MONOCHROME': '19 모노크롬',
  '20_STORYTELLING_SCROLL': '20 스토리텔링 스크롤',
  '01_PROCESS_FLOW': '프로세스 · 흐름',
  '02_HIERARCHY_TREE': '계층 · 관계',
  '03_MATRIX_SWOT': '매트릭스 · 4분면',
  '04_VENN_CYCLE': '교집합 · 순환',
  '05_PYRAMID_LAYER': '피라미드 · 레이어',
  '06_SYSTEM_ARCH': '시스템 · 아키텍처',
  '07_BUSINESS_MODEL': '비즈니스 모델',
  '08_DATA_RELATION': '수치 관계',
  '01_TYPOGRAPHY': '타이포그래피',
  '02_CHARTS': '차트',
  '04_TABLES': '표',
  '05_UI_PARTS': 'UI 부품',
  '99_DRAFTS': '작업 중 · 조합 결과',
  'images': '이미지',
  'icons': '아이콘',
};

const MARKER = /^\s*<!--\s*@card\s+([\s\S]*?)-->/;
const COMMENT = /<!--[\s\S]*?-->/g;

main();

function main() {
  const sections = [];
  let total = 0;
  let done = 0;

  for (const spec of SECTIONS) {
    const groups = [];

    for (const dir of spec.dirs) {
      const abs = path.join(ROOT, dir);
      if (!exists(abs)) {
        warn(`경로 없음, 건너뜀: ${dir}`);
        continue;
      }

      if (spec.groupBy === 'self') {
        const g = buildGroup(spec, dir, path.basename(dir));
        if (g) groups.push(g);
      } else {
        for (const sub of subdirs(abs)) {
          const g = buildGroup(spec, `${dir}/${sub}`, sub);
          if (g) groups.push(g);
        }
      }
    }

    for (const g of groups) {
      total += g.items.length;
      done += g.items.filter(i => i.status === 'done').length;
    }

    // 빈 섹션도 남긴다 — images/icons가 비어 있어도 "여기 넣으면 된다"가 보여야 한다.
    sections.push({ id: spec.id, label: spec.label, kind: spec.kind, groups });
  }

  // 빌드 도장. 갤러리가 iframe·CSS 요청에 ?v=로 붙여 브라우저 캐시를 깬다 —
  // 이게 없으면 GitHub Pages에 새 파일이 올라가도 방문자는 옛 사본을 계속 본다.
  const buildId = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const manifest = { buildId, sections };
  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  report(sections, total, done);
}

/* --- 그룹 하나 만들기 -------------------------------------------------- */
function buildGroup(spec, relDir, id) {
  const abs = path.join(ROOT, relDir);
  const wanted = spec.kind === 'image'
    ? f => IMAGE_EXT.has(path.extname(f).toLowerCase())
    : f => f.toLowerCase().endsWith('.html');

  const files = fs.readdirSync(abs)
    .filter(f => fs.statSync(path.join(abs, f)).isFile())
    .filter(wanted)
    .sort();

  if (!files.length && spec.kind !== 'image') return null;

  const items = files.map(f =>
    spec.kind === 'image'
      ? imageItem(relDir, f)
      : htmlItem(spec, relDir, f)
  );

  return { id, label: LABELS[id] || prettify(id), items };
}

/* --- HTML 아이템 ------------------------------------------------------- */
function htmlItem(spec, relDir, file) {
  const raw = fs.readFileSync(path.join(ROOT, relDir, file), 'utf8');
  const meta = parseMarker(raw);

  return {
    path: `../${relDir}/${file}`,
    file,
    title: meta.title || prettify(path.basename(file, '.html')),
    desc: meta.desc || '',
    w: meta.w || spec.defaults.w,
    h: meta.h || spec.defaults.h,
    status: meta.status || detectStatus(raw),
  };
}

/* 1행 마커를 판다. 없으면 빈 객체. */
function parseMarker(raw) {
  const m = raw.match(MARKER);
  if (!m) return {};

  const [title, desc, size, status] = m[1].split('|').map(s => s.trim());
  const out = { title, desc };

  if (size) {
    const dim = size.match(/^(\d+)\s*[x×]\s*(\d+)$/i);
    if (dim) {
      out.w = +dim[1];
      out.h = +dim[2];
    } else {
      warn(`크기 형식 오류 "${size}" — 1400x700 형태여야 함`);
    }
  }
  if (status && ['todo', 'wip', 'done'].includes(status)) out.status = status;

  return out;
}

/* 주석을 전부 걷어낸 나머지가 비었으면 아직 안 만든 파일이다. */
function detectStatus(raw) {
  return raw.replace(COMMENT, '').trim() ? 'done' : 'todo';
}

/* --- 이미지 아이템 ----------------------------------------------------- */
function imageItem(relDir, file) {
  const abs = path.join(ROOT, relDir, file);
  return {
    path: `../${relDir}/${file}`,
    file,
    title: file,
    desc: `${(fs.statSync(abs).size / 1024).toFixed(1)} KB`,
    status: 'done',
  };
}

/* --- 유틸 -------------------------------------------------------------- */
function exists(p) {
  try { fs.statSync(p); return true; } catch { return false; }
}

function subdirs(abs) {
  return fs.readdirSync(abs)
    .filter(f => fs.statSync(path.join(abs, f)).isDirectory())
    .sort();
}

/* '01_linear_steps_horizontal' → 'linear steps horizontal' */
function prettify(name) {
  return name.replace(/^\d+[_-]/, '').replace(/[_-]+/g, ' ').trim();
}

function warn(msg) {
  console.warn(`  ! ${msg}`);
}

function report(sections, total, done) {
  console.log(`\n  ${path.relative(ROOT, OUT).replace(/\\/g, '/')} 생성됨\n`);
  for (const s of sections) {
    const n = s.groups.reduce((a, g) => a + g.items.length, 0);
    console.log(`  ${s.label.padEnd(16)} ${String(n).padStart(3)}개  (그룹 ${s.groups.length})`);
  }
  console.log(`  ${'─'.repeat(34)}`);
  console.log(`  ${'합계'.padEnd(16)} ${String(total).padStart(3)}개  · 완료 ${done} / 미착수 ${total - done}\n`);
}
