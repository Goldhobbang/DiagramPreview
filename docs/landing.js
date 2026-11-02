/* ==========================================================================
   landing.js — 루트 랜딩 페이지 인터랙션
   1. 히어로 슬라이드 실시간 iframe 스케일 맞춤 및 스타일 탭 전환
   2. docs/manifest.json 로드 시 실제 슬라이드·다이어그램·컴포넌트 수량 반영
   ========================================================================== */

'use strict';

const $box = document.getElementById('showcase-box');
const $frame = document.getElementById('showcase-frame');
const $tabs = document.getElementById('showcase-tabs');
const $caption = document.getElementById('showcase-caption');

fitShowcase();
window.addEventListener('resize', fitShowcase);

if ($tabs) {
  $tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-src]');
    if (!btn || !$frame) return;

    $frame.src = btn.dataset.src;
    if ($caption && btn.dataset.caption) {
      $caption.textContent = btn.dataset.caption;
    }
    for (const b of $tabs.querySelectorAll('button')) {
      b.setAttribute('aria-pressed', String(b === btn));
    }
    fitShowcase();
  });
}

loadStats();

function fitShowcase() {
  if (!$box || !$frame) return;
  const w = Number($frame.dataset.w) || 1920;
  const h = Number($frame.dataset.h) || 1080;
  const boxW = $box.clientWidth;
  if (!boxW) return;

  const scale = boxW / w;
  $frame.style.width = `${w}px`;
  $frame.style.height = `${h}px`;
  $frame.style.transform = `scale(${scale})`;
}

async function loadStats() {
  try {
    const res = await fetch('docs/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const manifest = await res.json();
    const byId = id => manifest.sections.find(s => s.id === id);

    const slidesSec = byId('slides');
    const diagramsSec = byId('diagrams');
    const componentsSec = byId('components');

    if (slidesSec) {
      setText('stat-styles', slidesSec.groups.length);
      setText('stat-slides', countItems(slidesSec));
    }
    if (diagramsSec) {
      setText('stat-diagrams', countItems(diagramsSec));
    }
    if (componentsSec) {
      setText('stat-components', countItems(componentsSec));
    }
  } catch {
    // 정적 폴백 숫자 유지
  }
}

function countItems(sec) {
  return sec.groups.reduce((acc, g) => acc + g.items.length, 0);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val);
}
