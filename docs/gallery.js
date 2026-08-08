/* ==========================================================================
   gallery.js — 저장소 전체를 한 페이지에 카드로 렌더한다.
   빌드 스텝(런타임)은 없다. 목록은 tools/build-gallery.js가 만든 manifest.json.

   file:// 로 열면 fetch가 CORS로 막히므로 로컬 서버 필요:
     npx serve -l 8000 .   →  http://localhost:8000/docs/
   ========================================================================== */

const VARS_CSS = '../03_ASSETS/css/01_variables.css';

const $main = document.getElementById('main');
const $filters = document.getElementById('filters');
const $search = document.getElementById('search');
const $toast = document.getElementById('toast');
const $sizer = document.querySelector('.sizer');

let manifest = null;
let tokens = null;          // 01_variables.css에서 런타임에 추출
let activeSection = 'ALL';
let thumbW = 380;

init();

async function init() {
  try {
    const res = await fetch('manifest.json');
    if (!res.ok) throw new Error(`manifest.json ${res.status}`);
    manifest = await res.json();
  } catch (err) {
    $main.innerHTML = `<p class="empty">manifest.json을 불러오지 못했습니다: ${esc(err.message)}<br>
      <code>node tools/build-gallery.js</code> 로 생성한 뒤,
      <code>npx serve -l 8000 .</code> 후 <code>localhost:8000/docs/</code> 로 접속하세요.</p>`;
    return;
  }

  tokens = await loadTokens();   // 실패해도 나머지는 그린다

  renderProgress();
  renderFilters();
  render();

  $filters.addEventListener('click', onFilterClick);
  $sizer.addEventListener('click', onSizeClick);
  $search.addEventListener('input', render);
}

/* --- 디자인 토큰: CSS를 직접 읽어 파싱 --------------------------------
   manifest에 굽지 않는 이유 — 변수를 추가하면 재빌드 없이 바로 반영된다.
   ---------------------------------------------------------------------- */
async function loadTokens() {
  try {
    const res = await fetch(VARS_CSS);
    if (!res.ok) throw new Error(String(res.status));
    const css = await res.text();

    const found = [];
    for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      // --font-sans 처럼 여러 줄에 걸친 값이 있다. 한 줄로 접어야 표시가 깨지지 않는다.
      found.push({ name: `--${m[1]}`, value: m[2].replace(/\s+/g, ' ').trim() });
    }
    return found;
  } catch {
    return [];   // 토큰 섹션만 비고 나머지 갤러리는 정상 동작
  }
}

/* 접두사로 분류. 순서가 곧 표시 순서. */
const TOKEN_GROUPS = [
  { id: 'color',  label: '색상',   test: n => n.startsWith('--color-'),  render: swatch },
  { id: 'font',   label: '폰트',   test: n => n.startsWith('--font-'),   render: fontSample },
  { id: 'fs',     label: '타입 스케일', test: n => n.startsWith('--fs-'), render: typeSample },
  { id: 'sp',     label: '간격',   test: n => n.startsWith('--sp-'),     render: spaceBar },
  { id: 'radius', label: '라운드', test: n => n.startsWith('--radius-'), render: boxSample },
  { id: 'shadow', label: '그림자', test: n => n.startsWith('--shadow-'), render: boxSample },
  // 캐치올. 이게 없으면 --fw-* / --lh-* / --slide-* 등이 개수에만 잡히고 화면에서 사라진다.
  { id: 'etc', label: '기타', test: () => true, render: plainToken },
];

/* 어느 그룹에도 안 잡힌 토큰을 캐치올로 넘긴다 (앞 그룹이 이미 가져간 것은 제외). */
function bucket(list) {
  const rest = new Set(list);
  return TOKEN_GROUPS.map(g => {
    const mine = [...rest].filter(t => g.test(t.name));
    for (const t of mine) rest.delete(t);
    return { ...g, list: mine };
  });
}

/* --- 진척 ------------------------------------------------------------- */
function allItems() {
  return manifest.sections.flatMap(s => s.groups.flatMap(g => g.items));
}

function renderProgress() {
  const items = allItems();
  const total = items.length;
  const done = items.filter(i => i.status === 'done').length;
  document.getElementById('count-done').textContent = done;
  document.getElementById('count-total').textContent = total;
  document.getElementById('bar-fill').style.width = total ? `${(done / total) * 100}%` : '0';
}

/* --- 섹션 필터 --------------------------------------------------------- */
function renderFilters() {
  const chips = [chip('ALL', '전체', allItems().length)];
  for (const s of manifest.sections) {
    chips.push(chip(s.id, s.label, s.groups.reduce((a, g) => a + g.items.length, 0)));
  }
  chips.push(chip('tokens', '디자인 토큰', tokens.length));
  $filters.innerHTML = chips.join('');

  function chip(id, label, n) {
    return `<button data-sec="${id}" aria-pressed="${id === activeSection}">${esc(label)}<span class="n">${n}</span></button>`;
  }
}

function onFilterClick(e) {
  const btn = e.target.closest('button[data-sec]');
  if (!btn) return;
  activeSection = btn.dataset.sec;
  for (const b of $filters.querySelectorAll('button')) {
    b.setAttribute('aria-pressed', String(b.dataset.sec === activeSection));
  }
  render();
}

function onSizeClick(e) {
  const btn = e.target.closest('button[data-size]');
  if (!btn) return;
  thumbW = +btn.dataset.size;
  document.documentElement.style.setProperty('--card-w', `${thumbW}px`);
  for (const b of $sizer.querySelectorAll('button')) {
    b.setAttribute('aria-pressed', String(b.dataset.size === btn.dataset.size));
  }
  render();
}

/* --- 렌더 ------------------------------------------------------------- */
function render() {
  const q = $search.value.trim().toLowerCase();
  const html = [];

  for (const section of manifest.sections) {
    if (activeSection !== 'ALL' && activeSection !== section.id) continue;

    const groups = section.groups
      .map(g => ({ ...g, items: g.items.filter(i => matches(i, q)) }))
      .filter(g => g.items.length);

    // 검색 중에는 빈 섹션을 아예 숨긴다. 검색이 아니면 "여기 채우면 된다"고 알려준다.
    if (!groups.length) {
      if (q) continue;
      html.push(sectionHead(section), `<p class="empty-group">아직 파일이 없습니다.</p>`);
      continue;
    }

    html.push(sectionHead(section));
    for (const g of groups) {
      html.push(`<h3 class="group-head">${esc(g.label)}<span class="n">${g.items.length}</span></h3>`);
      html.push(`<div class="grid">${g.items.map(i => card(i, section.kind)).join('')}</div>`);
    }
  }

  if (activeSection === 'ALL' || activeSection === 'tokens') {
    html.push(renderTokens(q));
  }

  $main.innerHTML = html.join('') || `<p class="empty">조건에 맞는 항목이 없습니다.</p>`;

  for (const el of $main.querySelectorAll('[data-copy]')) {
    el.addEventListener('click', () => copyUrl(el.dataset.copy));
  }
}

function matches(item, q) {
  if (!q) return true;
  return `${item.title} ${item.desc} ${item.file}`.toLowerCase().includes(q);
}

function sectionHead(s) {
  const n = s.groups.reduce((a, g) => a + g.items.length, 0);
  return `<h2 class="section-head" id="sec-${s.id}">${esc(s.label)}<span class="n">${n}</span></h2>`;
}

/* --- 카드 ------------------------------------------------------------- */
function card(item, kind) {
  return kind === 'image' ? mediaCard(item) : htmlCard(item);
}

function htmlCard(item) {
  const scale = thumbW / item.w;
  const thumbH = Math.round(item.h * scale);

  // todo면 iframe을 만들지 않는다 — 빈 파일 로드도 네트워크 요청도 낭비.
  const inner = item.status === 'todo'
    ? `<div class="thumb-placeholder">
         <span>미착수</span><span class="dim">${item.w} × ${item.h}</span>
       </div>`
    : `<iframe src="${item.path}" width="${item.w}" height="${item.h}"
              style="transform:scale(${scale})" loading="lazy"
              title="${esc(item.title)} 미리보기" scrolling="no"></iframe>`;

  return `
<article class="card">
  <div class="thumb" style="height:${thumbH}px">${inner}</div>
  <div class="card-body">
    <div class="card-head">
      <span class="card-title">${esc(item.title)}</span>
      <span class="status ${item.status}">${item.status}</span>
    </div>
    ${item.desc ? `<p class="card-desc">${esc(item.desc)}</p>` : ''}
    <p class="card-path">${esc(item.file)} · ${item.w}×${item.h}</p>
  </div>
  <div class="card-actions">
    <a href="${item.path}" target="_blank" rel="noopener">새 창</a>
    <button class="primary" data-copy="${item.path}">URL 복사</button>
  </div>
</article>`;
}

function mediaCard(item) {
  return `
<article class="card">
  <div class="thumb media"><img src="${item.path}" alt="${esc(item.title)}" loading="lazy"></div>
  <div class="card-body">
    <div class="card-head"><span class="card-title">${esc(item.title)}</span></div>
    <p class="card-desc">${esc(item.desc)}</p>
  </div>
  <div class="card-actions">
    <a href="${item.path}" target="_blank" rel="noopener">원본</a>
    <button class="primary" data-copy="${item.path}">URL 복사</button>
  </div>
</article>`;
}

/* --- 디자인 토큰 섹션 --------------------------------------------------- */
function renderTokens(q) {
  if (!tokens.length) {
    return `<h2 class="section-head">디자인 토큰</h2>
      <p class="empty-group">${esc(VARS_CSS)} 를 읽지 못했습니다.</p>`;
  }

  const out = [`<h2 class="section-head" id="sec-tokens">디자인 토큰<span class="n">${tokens.length}</span></h2>`];
  let shown = 0;

  const hits = tokens.filter(t => !q || t.name.toLowerCase().includes(q));
  for (const g of bucket(hits)) {
    if (!g.list.length) continue;
    shown += g.list.length;
    out.push(`<h3 class="group-head">${g.label}<span class="n">${g.list.length}</span></h3>`);
    out.push(`<div class="token-grid ${g.id}">${g.list.map(g.render).join('')}</div>`);
  }

  if (!shown) return q ? '' : out.join('');
  return out.join('');
}

function swatch(t) {
  return `<div class="token swatch">
    <div class="chip" style="background:${t.value}"></div>
    <code class="tname">${esc(t.name)}</code>
    <code class="tval">${esc(t.value)}</code>
  </div>`;
}

function fontSample(t) {
  return `<div class="token wide">
    <p class="font-sample" style="font-family:${t.value}">다람쥐 헌 쳇바퀴에 타고파 Handgloves 0123</p>
    <code class="tname">${esc(t.name)}</code>
    <code class="tval">${esc(t.value)}</code>
  </div>`;
}

/* 실제 px로 렌더하면 96px 견본이 카드를 뚫는다. 축소해서 보여주되 원래 값을 병기. */
function typeSample(t) {
  const px = parseInt(t.value, 10) || 16;
  const shown = Math.min(px, 40);
  return `<div class="token wide">
    <p style="font-size:${shown}px;line-height:1.3">가나다 Handgloves 123</p>
    <code class="tname">${esc(t.name)}</code>
    <code class="tval">${esc(t.value)}${px > shown ? ` <em>(${shown}px로 축소 표시)</em>` : ''}</code>
  </div>`;
}

function spaceBar(t) {
  return `<div class="token wide">
    <div class="sp-bar" style="width:${t.value}"></div>
    <code class="tname">${esc(t.name)}</code>
    <code class="tval">${esc(t.value)}</code>
  </div>`;
}

/* 시각화할 게 없는 값(--fw-700, --lh-body, --slide-w …)은 값만 크게 보여준다 */
function plainToken(t) {
  return `<div class="token">
    <p class="plain-val">${esc(t.value)}</p>
    <code class="tname">${esc(t.name)}</code>
  </div>`;
}

function boxSample(t) {
  const style = t.name.startsWith('--radius-')
    ? `border-radius:${t.value}`
    : `box-shadow:${t.value}`;
  return `<div class="token">
    <div class="box-sample" style="${style}"></div>
    <code class="tname">${esc(t.name)}</code>
    <code class="tval">${esc(t.value)}</code>
  </div>`;
}

/* --- URL 복사: Figma 플러그인에 그대로 붙여넣는 값 --------------------- */
async function copyUrl(p) {
  const abs = new URL(p, location.href).href;
  try {
    await navigator.clipboard.writeText(abs);
    toast(`복사됨 · ${abs}`);
  } catch {
    // clipboard API는 http(s) + 사용자 제스처가 필요. 실패 시 수동 복사용으로 보여준다.
    window.prompt('복사할 URL:', abs);
  }
}

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 2200);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
