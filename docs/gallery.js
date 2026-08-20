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
const $detail = document.getElementById('detail');
const $detailBody = document.getElementById('detail-body');
const $detailClose = document.getElementById('detail-close');

/* 캐시 버스터. manifest.buildId를 붙여 iframe·CSS가 옛 사본으로 뜨는 걸 막는다.
   링크·URL 복사에는 붙이지 않는다 — 사람이 쓰는 주소는 깨끗해야 한다. */
function v(p) {
  return manifest && manifest.buildId ? `${p}?v=${manifest.buildId}` : p;
}

let manifest = null;
let tokens = null;          // 01_variables.css에서 런타임에 추출
let activeSection = 'ALL';
let activeStyle = 'ALL';    // 슬라이드 템플릿 섹션 전용 — 스타일(그룹) 필터
let thumbW = 380;
const styleTokenCache = new Map();   // 파일 경로 → 병합된 토큰 목록

init();

async function init() {
  try {
    // no-cache: 매니페스트만은 항상 서버에 물어본다 (ETag 재검증).
    // 나머지 파일은 여기서 얻은 buildId로 ?v=를 붙여 캐시를 깬다 — v() 참고.
    const res = await fetch('manifest.json', { cache: 'no-cache' });
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
  $main.addEventListener('click', onStyleClick);
  $main.addEventListener('click', onDetailOpenClick);
  $detailClose.addEventListener('click', closeDetail);
  $detail.addEventListener('click', e => { if (e.target === $detail) closeDetail(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });
}

/* --- 디자인 토큰: CSS를 직접 읽어 파싱 --------------------------------
   manifest에 굽지 않는 이유 — 변수를 추가하면 재빌드 없이 바로 반영된다.
   ---------------------------------------------------------------------- */
async function loadTokens() {
  try {
    const res = await fetch(v(VARS_CSS));
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
  activeStyle = 'ALL';   // 섹션을 바꾸면 스타일 필터는 초기화
  for (const b of $filters.querySelectorAll('button')) {
    b.setAttribute('aria-pressed', String(b.dataset.sec === activeSection));
  }
  render();
}

/* 슬라이드 템플릿 섹션 안의 스타일(그룹) 탭 — 클릭 시 해당 스타일 그룹만 표시 */
function onStyleClick(e) {
  const btn = e.target.closest('button[data-style]');
  if (!btn) return;
  activeStyle = btn.dataset.style;
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

    const isSlides = section.id === 'slides';
    if (isSlides) html.push(styleTabs(section));

    const groups = section.groups
      .map(g => ({ ...g, items: g.items.filter(i => matches(i, q)) }))
      .filter(g => g.items.length)
      .filter(g => !isSlides || activeStyle === 'ALL' || g.id === activeStyle);

    // 검색 중에는 빈 섹션을 아예 숨긴다. 검색이 아니면 "여기 채우면 된다"고 알려준다.
    if (!groups.length) {
      if (q) continue;
      html.push(sectionHead(section), `<p class="empty-group">아직 파일이 없습니다.</p>`);
      continue;
    }

    html.push(sectionHead(section));
    for (const g of groups) {
      html.push(`<h3 class="group-head">${esc(g.label)}<span class="n">${g.items.length}</span></h3>`);
      // 슬라이드는 표지·전역을 한 카드로 묶는다 — 열 수가 몇이든 쌍이 안 깨진다.
      const cards = isSlides
        ? pairByVariant(g.items).map(pairCard)
        : g.items.map(i => card(i, section.kind, section.id));
      // 이미지(media)만 고정 폭. HTML 미리보기는 넓은 트랙에서 늘려야 읽힌다.
      const track = isSlides ? ' grid-pair' : section.kind === 'image' ? '' : ' grid-wide';
      html.push(`<div class="grid${track}">${cards.join('')}</div>`);
    }
  }

  if (activeSection === 'ALL' || activeSection === 'tokens') {
    html.push(renderTokens(q));
  }

  $main.innerHTML = html.join('') || `<p class="empty">조건에 맞는 항목이 없습니다.</p>`;
  fitFrames($main);

  for (const el of $main.querySelectorAll('[data-copy]')) {
    el.addEventListener('click', () => copyUrl(el.dataset.copy));
  }
}

/* iframe을 캔버스 원본 크기로 띄우고 컨테이너 폭에 맞게 scale로 줄인다.
   예전에는 HTML 파일 안의 body.style.zoom 스크립트가 이 일을 했는데, 그 zoom이
   html.to.design import 때 좌표계를 갈라 텍스트를 밀어버려서 축소를 이쪽으로 옮겼다.
   컨테이너의 aspect-ratio가 캔버스 비율과 같으므로 폭만 맞추면 높이도 맞는다. */
function fitFrames(root) {
  for (const f of root.querySelectorAll('iframe[data-w]')) {
    const w = +f.dataset.w;
    const box = f.parentElement;
    if (!w || !box.clientWidth) continue;
    // 카드 폭에 정확히 맞춘다 — 1을 넘겨 확대해도 된다. transform은 문서 밖이라
    // import에 영향이 없다(문서 안 zoom과 다르다). 클램프를 걸면 캔버스가 작은
    // 다이어그램이 L에서 카드 안에 작게 박히고 여백도 카드마다 달라진다.
    const scale = box.clientWidth / w;
    f.style.width = `${w}px`;
    f.style.height = `${f.dataset.h}px`;
    f.style.transform = `scale(${scale})`;
  }
}

addEventListener('resize', () => fitFrames(document));

function matches(item, q) {
  if (!q) return true;
  return `${item.title} ${item.desc} ${item.file}`.toLowerCase().includes(q);
}

function sectionHead(s) {
  const n = s.groups.reduce((a, g) => a + g.items.length, 0);
  return `<h2 class="section-head" id="sec-${s.id}">${esc(s.label)}<span class="n">${n}</span></h2>`;
}

/* 슬라이드 템플릿 섹션 전용 — 스타일(폴더) 탭. 그룹 순서 그대로 사용. */
function styleTabs(section) {
  const chips = [
    `<button data-style="ALL" aria-pressed="${activeStyle === 'ALL'}">전체 스타일</button>`,
    ...section.groups.map(g =>
      `<button data-style="${esc(g.id)}" aria-pressed="${activeStyle === g.id}">${esc(g.label)}<span class="n">${g.items.length}</span></button>`
    ),
  ];
  return `<div class="style-tabs">${chips.join('')}</div>`;
}

/* --- 카드 ------------------------------------------------------------- */
function card(item, kind, sectionId) {
  return kind === 'image' ? mediaCard(item) : htmlCard(item, sectionId === 'slides');
}

/* 다이어그램·컴포넌트용. 슬라이드와 같은 경로다 — 크기를 지정하지 않고
   컨테이너 비율만 맞춰주면 파일의 self-fit 스크립트가 스스로 축소한다.
   비율은 캔버스마다 다르므로(1600×600 ~ 1000×900) 인라인으로 박는다. */
function htmlCard(item) {
  // todo면 iframe을 만들지 않는다 — 빈 파일 로드도 네트워크 요청도 낭비.
  const inner = item.status === 'todo'
    ? `<div class="thumb-placeholder">
         <span>미착수</span><span class="dim">${item.w} × ${item.h}</span>
       </div>`
    : `<iframe src="${v(item.path)}" loading="lazy" data-w="${item.w}" data-h="${item.h}"
              title="${esc(item.title)} 미리보기" scrolling="no"></iframe>`;

  return `
<article class="card" data-detail="${item.path}" role="button" tabindex="0">
  <div class="thumb" style="aspect-ratio:${item.w}/${item.h}">${inner}</div>
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

/* v1_01_cover.html + v1_02_global.html → 한 쌍.
   120개 전부 `v\d+_(01_cover|02_global).html` 형식이고 제목이 "… · 표지/전역"임을 확인했다.
   manifest 스키마는 그대로 두고 파일명으로만 짝을 찾는다. */
function pairByVariant(items) {
  const by = new Map();
  for (const it of items) {
    const v = (it.file.match(/^(v\d+)_/) || [])[1] || it.file;
    const slot = by.get(v) || { variant: v };
    slot[it.file.includes('_01_cover') ? 'cover' : 'global'] = it;
    by.set(v, slot);
  }
  return [...by.values()];
}

/* 슬라이드 카드 — 베리에이션 1개 = 카드 1개.
   썸네일 크기를 지정하지 않는다. 템플릿이 자기축소 스크립트로 알아서 채운다. */
function pairCard(pair) {
  const lead = pair.cover || pair.global;          // 검색 필터로 한쪽만 남을 수 있다
  const title = lead.title.replace(/\s*·\s*(표지|전역)\s*$/, '');
  const desc = (pair.cover || lead).desc;

  const shots = [
    ['표지', pair.cover],
    ['전역', pair.global],
  ].filter(([, it]) => it).map(([label, it]) => `
    <figure class="shot" data-preview="${it.path}" title="${esc(label)} 크게 보기">
      <div class="thumb">${it.status === 'todo'
        ? `<div class="thumb-placeholder"><span>미착수</span></div>`
        : `<iframe src="${v(it.path)}" loading="lazy" scrolling="no"
                   data-w="${it.w}" data-h="${it.h}"
                   title="${esc(it.title)} 미리보기"></iframe>`}</div>
      <figcaption>${label}</figcaption>
    </figure>`).join('');

  return `
<article class="card card-pair" data-detail="${lead.path}" role="button" tabindex="0">
  <div class="pair-thumbs">${shots}</div>
  <div class="card-body">
    <div class="card-head">
      <span class="card-title">${esc(title)}</span>
      <span class="status ${lead.status}">${lead.status}</span>
    </div>
    ${desc ? `<p class="card-desc">${esc(desc)}</p>` : ''}
    <p class="card-path">${esc(pair.variant)} · ${lead.w}×${lead.h}</p>
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

/* --- 상세 패널: 확대 미리보기 + 폰트·색·바로가기 -----------------------
   새 오버레이를 만들지 않는다 — #detail이 이미 ✕·Escape·backdrop 닫기를 처리한다.
   ---------------------------------------------------------------------- */
function onDetailOpenClick(e) {
  const card = e.target.closest('[data-detail]');
  if (!card) return;
  // 카드 안의 새 창·URL 복사는 자기 일을 한다 — 상세 패널까지 열지 않는다.
  if (e.target.closest('a, button')) return;
  // 썸네일을 눌렀으면 그 장을, 본문을 눌렀으면 기본값(표지)을 크게 연다.
  const shot = e.target.closest('[data-preview]');
  openDetail(card.dataset.detail, shot ? shot.dataset.preview : card.dataset.detail);
}

async function openDetail(leadPath, showPath) {
  const items = allItems();
  const lead = items.find(i => i.path === leadPath);
  if (!lead) return;

  // 같은 폴더의 표지·전역을 모은다. 토큰은 둘이 동일함을 check-templates.js가 보증한다.
  const dir = leadPath.slice(0, leadPath.lastIndexOf('/'));
  const variant = (lead.file.match(/^(v\d+)_/) || [])[1];
  const siblings = variant
    ? items.filter(i => i.path.startsWith(dir + '/') && i.file.startsWith(variant + '_'))
    : [lead];

  const merged = await resolveStyleTokens(lead);
  const byName = n => merged.find(t => t.name === n);

  const fontTok = byName('--font-sans');
  const colorNames = [
    '--color-bg', '--color-text', '--color-text-muted', '--color-accent',
    '--color-border', '--color-data-1', '--color-data-2', '--color-data-3',
    '--color-data-4', '--color-data-5', '--color-data-6',
  ];
  const colorToks = colorNames.map(byName).filter(Boolean);

  const kindOf = it => (it.file.includes('_01_cover') ? '표지' : '전역');
  const shown = siblings.find(i => i.path === showPath) || lead;

  const tabs = siblings.length > 1
    ? `<div class="preview-tabs">${siblings.map(it =>
        `<button data-show="${it.path}" aria-pressed="${it.path === shown.path}">${kindOf(it)}</button>`
      ).join('')}</div>`
    : '';

  $detailBody.innerHTML = `
    <div class="detail-head">
      <h2 class="detail-title">${esc(lead.title.replace(/\s*·\s*(표지|전역)\s*$/, ''))}</h2>
      ${tabs}
    </div>

    <div class="detail-preview" id="preview-box" style="aspect-ratio:${shown.w}/${shown.h}">
      <iframe id="preview-frame" src="${shown.path}" title="${esc(shown.title)} 확대 미리보기"
              data-w="${shown.w}" data-h="${shown.h}" scrolling="no"></iframe>
    </div>
    <p class="card-path" id="preview-path">${esc(shown.file)} · ${shown.w}×${shown.h}</p>

    <h3 class="group-head">폰트 정보</h3>
    <div class="token-grid font">${fontTok ? fontSample(fontTok) : '<p class="empty-group">폰트 정보를 읽지 못했습니다.</p>'}</div>

    <h3 class="group-head">색 정보</h3>
    <div class="token-grid">${colorToks.map(swatch).join('')}</div>

    <h3 class="group-head">바로가기</h3>
    ${siblings.map(it => `
      <div class="detail-actions">
        <span class="actions-label">${kindOf(it)}</span>
        <a href="${it.path}" target="_blank" rel="noopener">새 창에서 보기</a>
        <a href="${it.path}" download="${esc(it.file)}">HTML 다운로드</a>
        <button class="primary" data-copy="${it.path}">URL 복사</button>
      </div>`).join('')}
  `;

  // 탭은 iframe src만 갈아끼운다 — 토큰 정보는 표지·전역이 같으므로 다시 그릴 필요가 없다.
  const $frame = $detailBody.querySelector('#preview-frame');
  const $box = $detailBody.querySelector('#preview-box');
  const $path = $detailBody.querySelector('#preview-path');
  for (const btn of $detailBody.querySelectorAll('[data-show]')) {
    btn.addEventListener('click', () => {
      const it = siblings.find(i => i.path === btn.dataset.show);
      if (!it) return;
      $frame.src = v(it.path);
      $box.style.aspectRatio = `${it.w}/${it.h}`;
      $frame.dataset.w = it.w;
      $frame.dataset.h = it.h;
      fitFrames($box);
      $path.textContent = `${it.file} · ${it.w}×${it.h}`;
      for (const b of $detailBody.querySelectorAll('[data-show]')) {
        b.setAttribute('aria-pressed', String(b === btn));
      }
    });
  }

  for (const el of $detailBody.querySelectorAll('[data-copy]')) {
    el.addEventListener('click', () => copyUrl(el.dataset.copy));
  }

  $detail.hidden = false;
  fitFrames($detailBody);   // 패널이 보이기 전에는 clientWidth가 0이라 여기서 잰다
}

function closeDetail() {
  $detail.hidden = true;
  $detailBody.innerHTML = '';
}

/* 전역 토큰(01_variables.css) 위에 그 슬라이드가 실제로 쓰는 값을 덮어쓴다.

   슬라이드는 자기완결형이라 별도 CSS 파일이 없다 — HTML 자체를 읽어
   :root와 자기 베리에이션 블록(.v1 등)에서 토큰을 뽑는다.
   파일별로 1회만 fetch. 다이어그램·컴포넌트는 파일에 토큰이 없어 전역값만 남는다. */
async function resolveStyleTokens(item) {
  if (styleTokenCache.has(item.path)) return styleTokenCache.get(item.path);

  const byName = new Map((tokens || []).map(t => [t.name, t.value]));
  try {
    const res = await fetch(v(item.path));
    if (res.ok) {
      const html = await res.text();
      // v1_01_cover.html → v1. 없으면 :root 블록만 본다.
      const variant = (item.file.match(/^(v\d+)_/) || [])[1];
      for (const block of collectTokenBlocks(html, variant)) {
        for (const m of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
          byName.set(`--${m[1]}`, m[2].replace(/\s+/g, ' ').trim());
        }
      }
    }
  } catch { /* 못 읽으면 전역 토큰만 사용 */ }

  const merged = [...byName].map(([name, value]) => ({ name, value }));
  styleTokenCache.set(item.path, merged);
  return merged;
}

/* :root { } 와 해당 베리에이션 선택자의 { } 본문을 순서대로 돌려준다.
   나중 것이 앞의 값을 덮어써야 하므로 :root를 먼저 넣는다. */
function collectTokenBlocks(html, variant) {
  // 주석을 먼저 걷어낸다. 주석 안의 ".v1/.v2/.v3" 같은 문구를 선택자로 오인하면
  // 정규식 lastIndex가 진짜 블록을 건너뛴다.
  const css = html.replace(/\/\*[\s\S]*?\*\//g, '');

  const out = [];
  const grab = (selectorRe) => {
    for (const m of css.matchAll(selectorRe)) out.push(m[1]);
  };
  grab(/:root\s*\{([^}]*)\}/g);
  // 선택자는 `{`와 같은 줄에 있어야 한다 — `.v1 {` 과 `.v1, .v2, .v3 {` 둘 다 잡힌다.
  if (variant) grab(new RegExp(`^[^\\n{}]*\\.${variant}\\b[^\\n{}]*\\{([^}]*)\\}`, 'gm'));
  return out;
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
