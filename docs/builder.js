/* ==========================================================================
   builder.js — 다이어그램 조합 빌더

   목록은 갤러리와 같은 docs/manifest.json을 그대로 읽는다 (별도 데이터 없음).
   캔버스의 노드는 원본 HTML을 iframe으로 띄운다 — iframe에 width/height로 캔버스
   원본 크기를 주고, 축소는 래퍼의 transform:scale이 담당한다.
   즉 내부 좌표가 원본 px 그대로라 앵커 계산이 단순하다.
   (원본 HTML에는 JS가 없다 — 예전의 body.style.zoom 자기축소 스크립트는
    html.to.design import 때 좌표계를 갈라 텍스트를 밀어버려서 전부 걷어냈다.)

   file:// 로 열면 fetch와 iframe 내부 접근이 막힌다. 로컬 서버 필요:
     npx serve -l 8000 .   →  http://localhost:8000/docs/builder.html
   ========================================================================== */

'use strict';

const STORE = 'builder.nodes.v1';
const GRID = 8;          // 앵커 후보가 없을 때 붙는 격자
const SNAP_PX = 12;      // 화면 기준 스냅 반경
const PAD = 48;          // 내보낼 때 캔버스 여백

const $wrap = document.getElementById('canvas-wrap');
const $stage = document.getElementById('stage');
const $guides = document.getElementById('guides');
const $palList = document.getElementById('pal-list');
const $palTabs = document.getElementById('pal-tabs');
const $palHint = document.getElementById('pal-hint');
const $search = document.getElementById('search');
const $status = document.getElementById('status');
const $emptyHint = document.getElementById('empty-hint');
const $toast = document.getElementById('toast');
const $file = document.getElementById('file-input');

let manifest = null;
let items = [];               // 팔레트용 평탄화 목록
let activeSection = 'diagrams';
let nodes = [];               // {id, path, title, w, h, x, y, scale, z}
let view = { x: 80, y: 60, z: 0.4 };
let selId = null;
let armed = null;             // 앵커 클릭 후 대기 상태 {x, y, name}
let seq = 1;
const els = new Map();        // id → 노드 DOM (iframe 재로드를 막기 위해 재사용)

init();

async function init() {
  try {
    const res = await fetch('manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`manifest.json ${res.status}`);
    manifest = await res.json();
  } catch (err) {
    $palList.innerHTML = `<p class="pal-hint">manifest.json을 읽지 못했습니다: ${esc(err.message)}<br>
      <code>node tools/build-gallery.js</code> 후 로컬 서버로 열어야 합니다.</p>`;
    return;
  }

  items = manifest.sections
    .filter(s => s.kind === 'html')
    .flatMap(s => s.groups.flatMap(g => g.items
      .filter(i => i.status !== 'todo')
      .map(i => ({ ...i, section: s.id, group: g.label }))));

  renderTabs();
  renderPalette();
  restore();
  bind();
}

/* 캐시 버스터 — 갤러리와 같은 규칙(manifest.buildId). 사람이 쓰는 주소에는 붙이지 않는다. */
function v(p) {
  return manifest && manifest.buildId ? `${p}?v=${manifest.buildId}` : p;
}

/* --- 팔레트 ------------------------------------------------------------ */
function renderTabs() {
  const secs = manifest.sections.filter(s => s.kind === 'html');
  $palTabs.innerHTML = secs.map(s =>
    `<button data-sec="${s.id}" aria-pressed="${s.id === activeSection}">${esc(s.label)}</button>`
  ).join('');
}

function renderPalette() {
  const q = $search.value.trim().toLowerCase();
  const list = items.filter(i =>
    i.section === activeSection &&
    (!q || `${i.title} ${i.desc} ${i.file}`.toLowerCase().includes(q)));

  // 썸네일도 원본 iframe이다 — 스크린샷 파이프라인을 두지 않는다(갤러리와 같은 방식).
  // loading="lazy"라 스크롤에 들어온 것만 실제로 로드된다.
  $palList.innerHTML = list.length
    ? list.map(i => `
      <button class="pal-item" data-path="${esc(i.path)}" title="${esc(i.title)} 추가">
        <span class="pal-thumb" style="aspect-ratio:${i.w}/${i.h}">
          <iframe src="${v(i.path)}" loading="lazy" scrolling="no" tabindex="-1"
                  data-w="${i.w}" data-h="${i.h}"
                  title="${esc(i.title)} 미리보기"></iframe>
        </span>
        <span class="t">${esc(i.title)}</span>
        <span class="d">${esc(i.desc || i.group)}</span>
        <span class="m">${i.w}×${i.h}</span>
      </button>`).join('')
    : `<p class="pal-hint">조건에 맞는 항목이 없습니다.</p>`;
  fitFrames($palList);
}

/* 팔레트 썸네일 축소. 원본 HTML에는 자기축소 스크립트가 없다 —
   그 body.style.zoom이 html.to.design import 때 텍스트를 밀어버려서 걷어냈다.
   캔버스 노드(.node iframe)는 width/height 속성으로 원본 크기를 이미 받으므로 해당 없다. */
function fitFrames(root) {
  for (const f of root.querySelectorAll('iframe[data-w]')) {
    const w = +f.dataset.w;
    const box = f.parentElement;
    if (!w || !box.clientWidth) continue;
    f.style.width = `${w}px`;
    f.style.height = `${f.dataset.h}px`;
    f.style.transform = `scale(${box.clientWidth / w})`;   // 카드 폭에 정확히 맞춘다
  }
}

/* --- 노드 ------------------------------------------------------------- */
function addNode(item, x, y, scale) {
  const n = {
    id: `n${seq++}`,
    path: item.path,
    title: item.title,
    w: item.w,
    h: item.h,
    x: Math.round(x),
    y: Math.round(y),
    scale: scale || 1,
    z: nodes.length + 1,
  };
  nodes.push(n);
  mountNode(n);
  select(n.id);
  sync();
  return n;
}

function mountNode(n) {
  const el = document.createElement('div');
  el.className = 'node';
  el.dataset.id = n.id;
  // 핸들 8개: 변 4개는 그 변 전체를 덮고, 모퉁이 4개가 그 위에 얹힌다.
  // 어느 쪽을 잡아도 비율은 고정이다 — 붙잡은 반대편이 제자리에 남는다.
  const handles = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']
    .map(d => `<span class="resize rz-${d}" data-resize="${n.id}" data-dir="${d}"></span>`)
    .join('');

  el.innerHTML = `
    <span class="tag">${esc(n.title)}</span>
    <iframe src="${v(n.path)}" width="${n.w}" height="${n.h}" scrolling="no"
            title="${esc(n.title)}" loading="eager"></iframe>
    ${handles}`;
  $stage.appendChild(el);
  els.set(n.id, el);
  placeNode(n);

  // 원본은 단독 열람용으로 body에 흰 종이를 깐다 — 캔버스에서는 그걸 끈다.
  // 같은 오리진이라 문서에 직접 규칙을 넣을 수 있다 (file://로 열면 실패 → 무시).
  const frame = el.querySelector('iframe');
  frame.addEventListener('load', () => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const style = doc.createElement('style');
      style.textContent = 'body{background:transparent!important}';
      doc.head.appendChild(style);
    } catch { /* 접근 불가면 흰 배경 그대로 — 편집은 계속된다 */ }
  });
}

function placeNode(n) {
  const el = els.get(n.id);
  if (!el) return;
  el.style.left = `${n.x}px`;
  el.style.top = `${n.y}px`;
  el.style.width = `${n.w}px`;
  el.style.height = `${n.h}px`;
  el.style.transform = `scale(${n.scale})`;
  el.style.zIndex = String(n.z);
  // 라벨·핸들은 노드와 함께 축소되므로 역배율을 변수로 내려보낸다.
  // 각 요소가 필요한 축에만 적용한다 (변 핸들은 두께만 보정해야 길이가 안 줄어든다).
  el.style.setProperty('--inv', String(1 / (n.scale * view.z)));
}

function removeNode(id) {
  nodes = nodes.filter(n => n.id !== id);
  const el = els.get(id);
  if (el) el.remove();
  els.delete(id);
  if (selId === id) select(null);
  sync();
}

function select(id) {
  selId = id;
  for (const [nid, el] of els) el.classList.toggle('sel', nid === id);
  renderAnchors();
}

function nodeById(id) { return nodes.find(n => n.id === id); }

/* --- 앵커 -------------------------------------------------------------
   박스 8앵커는 늘 있다. 파일 안에 data-anchor가 있으면 그 지점도 후보가 된다
   (같은 오리진이라 iframe 내부를 읽을 수 있다). iframe 내부에는 스케일이 없으므로
   getBoundingClientRect 값이 원본 px 좌표 그대로다.
   ---------------------------------------------------------------------- */
const OPPOSITE = { n: 's', s: 'n', e: 'w', w: 'e', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw' };

function boxAnchors(n) {
  const w = n.w, h = n.h;
  return [
    { name: 'nw', lx: 0,     ly: 0 },
    { name: 'n',  lx: w / 2, ly: 0 },
    { name: 'ne', lx: w,     ly: 0 },
    { name: 'e',  lx: w,     ly: h / 2 },
    { name: 'se', lx: w,     ly: h },
    { name: 's',  lx: w / 2, ly: h },
    { name: 'sw', lx: 0,     ly: h },
    { name: 'w',  lx: 0,     ly: h / 2 },
  ];
}

function innerAnchors(n) {
  if (n._inner) return n._inner;
  const frame = els.get(n.id)?.querySelector('iframe');
  let out = [];
  try {
    const doc = frame && frame.contentDocument;
    if (doc && doc.readyState === 'complete') {
      out = [...doc.querySelectorAll('[data-anchor]')].map(el => {
        const r = el.getBoundingClientRect();
        return { name: el.dataset.anchor, lx: r.left + r.width / 2, ly: r.top + r.height / 2, inner: true };
      });
      n._inner = out;      // 로드 완료 후 1회만 읽는다
    }
  } catch { /* 크로스 오리진이면 박스 앵커만 쓴다 */ }
  return out;
}

/* 캔버스 좌표로 변환된 앵커 목록 */
function anchorsOf(n) {
  return [...boxAnchors(n), ...innerAnchors(n)]
    .map(a => ({ ...a, x: n.x + a.lx * n.scale, y: n.y + a.ly * n.scale }));
}

function renderAnchors() {
  for (const el of $stage.querySelectorAll('.anchor')) el.remove();
  const n = nodeById(selId);
  if (!n) return;
  const inv = 1 / view.z;
  for (const a of anchorsOf(n)) {
    // 박스 앵커는 리사이즈 핸들과 같은 자리라 바깥으로 밀어 둔다 — 둘 다 집을 수 있어야 한다.
    // 밀어낸 건 표시 위치뿐이고, 스냅에 쓰는 좌표(anchorsOf)는 원래 지점 그대로다.
    const off = a.inner ? 0 : 16 / view.z;
    const ox = a.name.includes('w') ? -off : a.name.includes('e') ? off : 0;
    const oy = a.name.includes('n') ? -off : a.name.includes('s') ? off : 0;

    const d = document.createElement('span');
    d.className = `anchor${a.inner ? ' inner' : ''}`;
    d.style.left = `${a.x + ox}px`;
    d.style.top = `${a.y + oy}px`;
    d.style.transform = `scale(${inv})`;
    d.style.zIndex = '9999';
    d.title = `${a.name} — 클릭하면 이 지점에 새 부품을 붙인다`;
    d.dataset.anchor = JSON.stringify({ x: a.x, y: a.y, name: a.name });
    $stage.appendChild(d);
  }
}

/* --- 스냅 -------------------------------------------------------------- */
function snap(n, rawX, rawY, free) {
  if (free) return { x: rawX, y: rawY, hits: [] };

  const mine = [...boxAnchors(n), ...innerAnchors(n)];
  const targets = nodes.filter(o => o.id !== n.id).flatMap(anchorsOf);

  let best = null;
  for (const a of mine) {
    const ax = rawX + a.lx * n.scale;
    const ay = rawY + a.ly * n.scale;
    for (const t of targets) {
      const d = Math.hypot(t.x - ax, t.y - ay);
      if (!best || d < best.d) best = { d, dx: t.x - ax, dy: t.y - ay, t };
    }
  }

  if (best && best.d * view.z <= SNAP_PX) {
    return { x: rawX + best.dx, y: rawY + best.dy, hits: [best.t] };
  }
  // 붙일 상대가 없으면 격자에만 맞춘다
  return { x: Math.round(rawX / GRID) * GRID, y: Math.round(rawY / GRID) * GRID, hits: [] };
}

function drawGuides(hits) {
  if (!hits.length) { $guides.innerHTML = ''; return; }
  const inv = 1 / view.z;
  $guides.innerHTML = hits.map(t => `
    <span class="guide h" style="left:${t.x - 400 * inv}px;top:${t.y}px;
          width:${800 * inv}px;height:${inv}px"></span>
    <span class="guide v" style="left:${t.x}px;top:${t.y - 400 * inv}px;
          width:${inv}px;height:${800 * inv}px"></span>
    <span class="guide-dot" style="left:${t.x}px;top:${t.y}px;transform:scale(${inv})"></span>`).join('');
}

/* --- 뷰 (팬·줌) -------------------------------------------------------- */
function applyView() {
  $stage.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
  for (const n of nodes) placeNode(n);
  renderAnchors();
}

function toCanvas(clientX, clientY) {
  const r = $wrap.getBoundingClientRect();
  return {
    x: (clientX - r.left - view.x) / view.z,
    y: (clientY - r.top - view.y) / view.z,
  };
}

function fitView() {
  if (!nodes.length) { view = { x: 80, y: 60, z: 0.4 }; applyView(); return; }
  const b = bbox();
  const r = $wrap.getBoundingClientRect();
  const z = Math.min((r.width - 80) / b.w, (r.height - 100) / b.h, 1);
  view.z = Math.max(0.05, z);
  view.x = (r.width - b.w * view.z) / 2 - b.x * view.z;
  view.y = (r.height - b.h * view.z) / 2 - b.y * view.z;
  applyView();
}

function bbox() {
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const xe = nodes.map(n => n.x + n.w * n.scale);
  const ye = nodes.map(n => n.y + n.h * n.scale);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xe) - x, h: Math.max(...ye) - y };
}

/* --- 이벤트 ------------------------------------------------------------ */
function bind() {
  $palTabs.addEventListener('click', e => {
    const b = e.target.closest('button[data-sec]');
    if (!b) return;
    activeSection = b.dataset.sec;
    renderTabs();
    renderPalette();
  });

  $search.addEventListener('input', renderPalette);

  $palList.addEventListener('click', e => {
    const b = e.target.closest('.pal-item');
    if (!b) return;
    const item = items.find(i => i.path === b.dataset.path);
    if (!item) return;

    if (armed) {
      // 앵커에 붙여 추가 — 클릭한 앵커의 반대편이 그 점에 오도록 놓는다.
      // 내부 앵커(data-anchor)는 방향을 모르므로 위쪽 중앙을 맞춘다(아래로 뻗는 구조가 흔하다).
      const side = OPPOSITE[armed.name] || 'n';
      const a = boxAnchors(item).find(p => p.name === side) || { lx: item.w / 2, ly: 0 };
      addNode(item, armed.x - a.lx, armed.y - a.ly);
      armed = null;
      $palHint.classList.remove('armed');
      $palHint.textContent = '항목을 클릭하면 캔버스 중앙에 놓인다.';
      return;
    }

    const r = $wrap.getBoundingClientRect();
    const c = toCanvas(r.left + r.width / 2, r.top + r.height / 2);
    addNode(item, c.x - item.w / 2, c.y - item.h / 2);
    fitIfFirst();
  });

  // 앵커 클릭 = 붙일 지점 예약
  $stage.addEventListener('pointerdown', e => {
    const a = e.target.closest('.anchor');
    if (!a) return;
    e.stopPropagation();
    armed = JSON.parse(a.dataset.anchor);
    $palHint.classList.add('armed');
    $palHint.textContent = `${armed.name} 지점에 붙일 부품을 왼쪽에서 고르세요 (Esc 취소)`;
  });

  $wrap.addEventListener('pointerdown', onPointerDown);
  $wrap.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKey);

  document.getElementById('fit').addEventListener('click', fitView);
  document.getElementById('del').addEventListener('click', () => selId && removeNode(selId));
  document.getElementById('dup').addEventListener('click', duplicate);
  document.getElementById('front').addEventListener('click', () => reorder(+1));
  document.getElementById('back-z').addEventListener('click', () => reorder(-1));
  document.getElementById('clear').addEventListener('click', clearAll);
  document.getElementById('save-json').addEventListener('click', saveJson);
  document.getElementById('load-json').addEventListener('click', () => $file.click());
  document.getElementById('export').addEventListener('click', exportHtml);
  $file.addEventListener('change', loadJson);
}

let space = false;

function onPointerDown(e) {
  if (e.button !== 0) return;
  e.preventDefault();   // 드래그가 글자 선택으로 새지 않게 (CSS user-select와 한 쌍)

  const handle = e.target.closest('.resize');
  if (handle) return startResize(e, nodeById(handle.dataset.resize), handle.dataset.dir);

  const nodeEl = e.target.closest('.node');
  if (nodeEl && !space) {
    const n = nodeById(nodeEl.dataset.id);
    select(n.id);
    return startMove(e, n);
  }

  startPan(e);
}

function startMove(e, n) {
  const start = toCanvas(e.clientX, e.clientY);
  const ox = start.x - n.x;
  const oy = start.y - n.y;
  $wrap.setPointerCapture(e.pointerId);

  const move = ev => {
    const c = toCanvas(ev.clientX, ev.clientY);
    const s = snap(n, c.x - ox, c.y - oy, ev.shiftKey);
    n.x = Math.round(s.x);
    n.y = Math.round(s.y);
    placeNode(n);
    drawGuides(s.hits);
    renderAnchors();
  };
  const up = () => {
    $wrap.removeEventListener('pointermove', move);
    $wrap.removeEventListener('pointerup', up);
    drawGuides([]);
    sync();
  };
  $wrap.addEventListener('pointermove', move);
  $wrap.addEventListener('pointerup', up);
}

/* 8방향 리사이즈. 잡은 쪽 반대편(고정점)을 제자리에 두고 비율을 유지한 채 배율만 바꾼다.
   dir: n · s · e · w · nw · ne · sw · se */
function startResize(e, n, dir = 'se') {
  e.stopPropagation();
  e.preventDefault();
  select(n.id);

  // 고정점 — 서쪽을 잡으면 오른쪽 변이, 북쪽을 잡으면 아래 변이 제자리에 남는다
  const fixedX = dir.includes('w') ? n.x + n.w * n.scale : n.x;
  const fixedY = dir.includes('n') ? n.y + n.h * n.scale : n.y;
  const horizontal = dir === 'e' || dir === 'w';
  const vertical = dir === 'n' || dir === 's';
  $wrap.setPointerCapture(e.pointerId);

  const move = ev => {
    const c = toCanvas(ev.clientX, ev.clientY);
    const dx = Math.abs(c.x - fixedX);
    const dy = Math.abs(c.y - fixedY);

    // 변 핸들은 그 축만 본다. 모퉁이는 대각선 길이 비로 잡아 흔들림이 없다.
    let s = horizontal ? dx / n.w
      : vertical ? dy / n.h
      : Math.hypot(dx, dy) / Math.hypot(n.w, n.h);

    if (!ev.altKey) s = Math.round(s / 0.05) * 0.05;    // Alt = 자유 배율
    n.scale = Math.min(3, Math.max(0.1, +s.toFixed(3)));

    if (dir.includes('w')) n.x = Math.round(fixedX - n.w * n.scale);
    if (dir.includes('n')) n.y = Math.round(fixedY - n.h * n.scale);

    placeNode(n);
    status();
  };
  const up = () => {
    $wrap.removeEventListener('pointermove', move);
    $wrap.removeEventListener('pointerup', up);
    renderAnchors();
    sync();
  };
  $wrap.addEventListener('pointermove', move);
  $wrap.addEventListener('pointerup', up);
}

function startPan(e) {
  const sx = e.clientX, sy = e.clientY;
  const vx = view.x, vy = view.y;
  $wrap.classList.add('panning');
  $wrap.setPointerCapture(e.pointerId);

  const move = ev => {
    view.x = vx + (ev.clientX - sx);
    view.y = vy + (ev.clientY - sy);
    applyView();
  };
  const up = () => {
    $wrap.removeEventListener('pointermove', move);
    $wrap.removeEventListener('pointerup', up);
    $wrap.classList.remove('panning');
    sync();
  };
  $wrap.addEventListener('pointermove', move);
  $wrap.addEventListener('pointerup', up);
}

/* 휠 = 포인터 위치를 고정점으로 확대·축소 */
function onWheel(e) {
  e.preventDefault();
  const r = $wrap.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  const before = { x: (px - view.x) / view.z, y: (py - view.y) / view.z };
  const z = Math.min(2, Math.max(0.05, view.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  view.z = z;
  view.x = px - before.x * z;
  view.y = py - before.y * z;
  applyView();
  sync();
}

function onKey(e) {
  if (e.key === ' ') space = true;
  if (e.key === 'Escape') {
    armed = null;
    $palHint.classList.remove('armed');
    $palHint.textContent = '항목을 클릭하면 캔버스 중앙에 놓인다.';
  }
  if (e.target.tagName === 'INPUT') return;

  if ((e.key === 'Delete' || e.key === 'Backspace') && selId) { e.preventDefault(); removeNode(selId); }
  if (e.key.toLowerCase() === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); duplicate(); }

  // 방향키 = 격자 한 칸 이동 (Shift = 10칸)
  const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (dir && selId) {
    e.preventDefault();
    const n = nodeById(selId);
    const step = GRID * (e.shiftKey ? 10 : 1);
    n.x += dir[0] * step;
    n.y += dir[1] * step;
    placeNode(n);
    renderAnchors();
    sync();
  }
}
document.addEventListener('keyup', e => { if (e.key === ' ') space = false; });

function duplicate() {
  const n = nodeById(selId);
  if (!n) return;
  addNode({ path: n.path, title: n.title, w: n.w, h: n.h }, n.x + GRID * 4, n.y + GRID * 4, n.scale);
}

function reorder(dir) {
  const n = nodeById(selId);
  if (!n) return;
  n.z = Math.max(1, n.z + dir * 1.5);
  // 정수로 다시 눌러 담아 z가 무한히 벌어지지 않게 한다
  [...nodes].sort((a, b) => a.z - b.z).forEach((m, i) => { m.z = i + 1; });
  for (const m of nodes) placeNode(m);
  sync();
}

function clearAll() {
  if (nodes.length && !confirm(`노드 ${nodes.length}개를 모두 지웁니다. 계속할까요?`)) return;
  nodes = [];
  for (const el of els.values()) el.remove();
  els.clear();
  select(null);
  sync();
}

function fitIfFirst() {
  if (nodes.length === 1) fitView();
}

/* --- 상태 저장 --------------------------------------------------------- */
function sync() {
  status();
  $emptyHint.hidden = nodes.length > 0;
  try {
    localStorage.setItem(STORE, JSON.stringify({ nodes: strip(), view }));
  } catch { /* 용량 초과는 무시 — 편집은 계속된다 */ }
}

function strip() {
  return nodes.map(({ id, path, title, w, h, x, y, scale, z }) =>
    ({ id, path, title, w, h, x, y, scale, z }));
}

function status() {
  const n = nodeById(selId);
  const zoom = `${Math.round(view.z * 100)}%`;
  $status.textContent = n
    ? `노드 ${nodes.length}개 · 선택 ${n.title} (${n.w}×${n.h}, ${Math.round(n.scale * 100)}%) · 화면 ${zoom}`
    : `노드 ${nodes.length}개 · 화면 ${zoom}`;
}

function restore() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { /* 깨진 값 무시 */ }
  if (!saved || !Array.isArray(saved.nodes)) { sync(); applyView(); return; }
  load(saved);
}

function load(saved) {
  nodes = [];
  for (const el of els.values()) el.remove();
  els.clear();

  for (const s of saved.nodes) {
    const n = { ...s, id: s.id || `n${seq++}` };
    seq = Math.max(seq, (+String(n.id).replace(/\D/g, '') || 0) + 1);
    nodes.push(n);
    mountNode(n);
  }
  if (saved.view) view = saved.view;
  select(null);
  applyView();
  sync();
}

function saveJson() {
  download(`composition_${stamp()}.json`,
    JSON.stringify({ nodes: strip(), view }, null, 2), 'application/json');
  toast('JSON을 저장했습니다');
}

function loadJson(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!Array.isArray(data.nodes)) throw new Error('nodes 배열이 없습니다');
      load(data);
      toast(`노드 ${data.nodes.length}개를 불러왔습니다`);
    } catch (err) {
      toast(`불러오기 실패: ${err.message}`);
    }
    e.target.value = '';
  };
  r.readAsText(f);
}

/* --- 내보내기: 자기완결형 HTML -----------------------------------------
   각 원본 파일에서 (1) 전용 CSS (2) .component 마크업만 떼어 한 문서로 합친다.
   전용 CSS의 셀렉터에는 #노드ID 접두사를 붙여 파일 간 클래스 충돌을 막는다
   (31개 전 파일이 클래스 셀렉터만 쓰고 @media/@keyframes가 없음을 확인했다).
   ---------------------------------------------------------------------- */
const OWN_CSS = /\/\*\s*=====\s*이\s*\S+\s*전용\s*=====\s*\*\//;
const BASE_START = '/* ===== 03_ASSETS/css/00_reset.css ===== */';

async function exportHtml() {
  if (!nodes.length) return toast('캔버스가 비어 있습니다');

  const sorted = [...nodes].sort((a, b) => a.z - b.z);
  const cache = new Map();
  let base = null;
  const cssParts = [];
  const bodyParts = [];

  try {
    for (const n of sorted) {
      if (!cache.has(n.path)) {
        const res = await fetch(v(n.path));
        if (!res.ok) throw new Error(`${n.path} ${res.status}`);
        cache.set(n.path, parseSource(await res.text()));
      }
      const src = cache.get(n.path);

      // 줄바꿈은 비교에서 뺀다 — 작업 트리에 CRLF/LF가 섞여 있어도 내용은 같다
      if (!base) base = src.base;
      else if (src.base.replace(/\r\n/g, '\n') !== base.replace(/\r\n/g, '\n')) {
        console.warn(`베이스 CSS가 다릅니다: ${n.path} — 첫 파일 기준으로 씁니다`);
      }

      cssParts.push(`/* ${n.title} — ${n.path} */\n${prefixCss(src.css, `#${n.id}`)}`);
      bodyParts.push(
        `  <div class="node" id="${n.id}" style="left:${n.x}px;top:${n.y}px;` +
        `width:${n.w}px;height:${n.h}px;transform:scale(${n.scale})">\n${src.body}\n  </div>`);
    }
  } catch (err) {
    return toast(`내보내기 실패: ${err.message}`);
  }

  const b = bbox();
  const W = Math.round(b.w + PAD * 2);
  const H = Math.round(b.h + PAD * 2);
  // 좌상단을 여백 안쪽으로 당긴다 — 캔버스 좌표를 그대로 쓰면 빈 공간이 남는다
  const shifted = bodyParts.map((s, i) => s
    .replace(`left:${sorted[i].x}px`, `left:${Math.round(sorted[i].x - b.x + PAD)}px`)
    .replace(`top:${sorted[i].y}px`, `top:${Math.round(sorted[i].y - b.y + PAD)}px`));

  const title = prompt('조합 구조의 제목', '조합 구조');
  if (title === null) return;

  const html = `<!-- @card ${title} | ${sorted.map(n => n.title).join(' + ')} | ${W}x${H} -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <!-- docs/builder.html 이 생성했다. 자기완결형: CSS 전체가 아래에 인라인되어 있다.
       각 부품의 전용 CSS는 #노드ID 접두사로 격리했다 — 클래스 이름이 겹쳐도 안전하다. -->
  <style>
${base}
/* ===== 이 조합 전용 ===== */
    /* 배경 없이 내부 요소만 남긴다 — PNG처럼. 흰색은 보는 쪽이 깐다
       (Figma 프레임 · 갤러리 .thumb · 브라우저 기본 흰 화면).
       베이스 블록의 body 규칙보다 뒤에 있어야 덮인다. */
    body { background: transparent; }

    /* 합성 캔버스 — .component보다 셀렉터가 강해야 크기·패딩을 덮는다 */
    .component.canvas {
      width: ${W}px;
      height: ${H}px;
      padding: 0;
      overflow: hidden;
      position: relative;
      background: transparent;
    }
    .canvas .node { position: absolute; transform-origin: 0 0; }

${cssParts.join('\n\n')}
  </style>
</head>
<body>
  <div class="component canvas">
${shifted.join('\n')}
  </div>
</body>
</html>
`;

  download(`composition_${stamp()}.html`, html, 'text/html');
  toast(`${W}×${H} 조합을 저장했습니다 — 99_DRAFTS/ 에 넣고 build-gallery 실행`);
}

/* 원본 1개를 세 조각으로 자른다: 베이스 CSS · 전용 CSS · .component 마크업 */
function parseSource(raw) {
  const styleEnd = raw.indexOf('</style>');
  const own = raw.search(OWN_CSS);
  const baseFrom = raw.indexOf(BASE_START);
  if (styleEnd < 0 || own < 0 || baseFrom < 0) throw new Error('예상과 다른 파일 구조');

  const bodyFrom = raw.indexOf('<body>') + '<body>'.length;
  const fitAt = raw.indexOf('<!-- self-fit');
  const bodyTo = fitAt > 0 ? fitAt : raw.indexOf('</body>');

  return {
    base: raw.slice(baseFrom, own).replace(/\s+$/, ''),
    css: raw.slice(raw.indexOf('*/', own) + 2, styleEnd),
    body: raw.slice(bodyFrom, bodyTo).replace(/^\s*\n|\s+$/g, ''),
  };
}

/* 규칙마다 셀렉터에 접두사를 붙인다. 주석을 먼저 걷어내야 셀렉터로 오인하지 않는다. */
function prefixCss(css, prefix) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([^{}]+)\{([^{}]*)\}/g, (_, sel, body) => {
      const scoped = sel.split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => `${prefix} ${s}`)
        .join(', ');
      return `    ${scoped} {${body.replace(/\s+/g, ' ')} }\n`;
    })
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/* --- 유틸 -------------------------------------------------------------- */
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 2600);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
