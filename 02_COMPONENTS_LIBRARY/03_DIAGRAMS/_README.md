# 03_DIAGRAMS — 다이어그램 작성 규칙

31종 기획 목록과 진척 현황: [../../00_GUIDES/04_DIAGRAM_CATALOG.md](../../00_GUIDES/04_DIAGRAM_CATALOG.md)

## 카테고리

| 폴더 | 성격 | 개수 |
|---|---|---|
| `01_PROCESS_FLOW` | 순서·흐름·시간 | 7 |
| `02_HIERARCHY_TREE` | 계층·관계·분해 | 6 |
| `03_MATRIX_SWOT` | 4분면·비교표 | 6 |
| `04_VENN_CYCLE` | 교집합·순환 | 6 |
| `05_PYRAMID_LAYER` | 피라미드·레이어 | 6 |

---

## 필수 규칙 6가지

### 1. 캔버스는 `.component` (기본 1400×700)
슬라이드가 아니다. 슬라이드에 배치할 때 조합해서 쓴다.
가로로 긴 것(간트, 타임라인)은 `1600×600`, 정사각형에 가까운 것(벤, 매트릭스)은 `1000×800` 처럼
내용에 맞춘다. **크기를 바꾸면 `docs/manifest.json`의 `w`/`h`도 같이 고친다.**

### 2. 색은 변수만
```css
/* ❌ */  fill: #2563eb;
/* ✅ */  fill: var(--color-data-1);
```
계열 색은 `--color-data-1` 부터 **순서대로**. 6색을 넘기면 데이터를 묶어서 줄인다.

### 3. 도형은 인라인 `<svg>`
Figma에서 **편집 가능한 벡터 레이어**가 된다.
`<img src="shape.svg">`는 단일 이미지로 뭉쳐 들어와 수정이 불가능하다.

```html
<!-- ✅ -->
<svg width="1400" height="700" viewBox="0 0 1400 700">
  <path d="..." fill="var(--color-data-1)"/>
</svg>
```

### 4. 텍스트는 HTML 요소로
SVG `<text>`도 텍스트 레이어로 들어오긴 하지만, Figma에서 편집·재배치가 불편하다.
**도형은 SVG, 글자는 HTML**로 분리하고 `position: absolute`로 겹치는 편이 낫다.
(이 경우는 예외적으로 absolute 허용 — SVG 좌표에 맞춰야 하므로)

### 5. 레이아웃은 `flex` + `gap`
Figma Auto Layout으로 변환된다. `position:absolute`는 SVG 오버레이 텍스트에만 쓴다.
중첩은 3~4단계 이내.

### 6. 실제 문구를 넣는다
"Lorem ipsum"이나 "제목1/제목2"는 금지. 실제 발표에서 쓸 법한 길이의 한글 문구를 넣어야
임포트 후 줄바꿈·오버플로우 문제를 미리 발견한다.

### 7. 이어 붙일 지점에 `data-anchor`를 붙인다
조합 빌더(`docs/builder.html`)가 이 지점을 스냅 대상으로 쓴다.
반복 노드의 **컨테이너에만** 붙인다 (단계 카드 · 레인 · 레이어 · 분면 · 허브).
값은 짧은 식별자 + 순번:

```html
<div class="step-item" data-anchor="step-1">…</div>
<div class="layer d1"  data-anchor="layer-1">…</div>
```

없어도 동작한다 — 빌더가 박스 8앵커(모퉁이 4 + 변 중점 4)로 폴백한다. 붙이면
"프로세스 3단계 **아래에** 상세 매트릭스 붙이기"처럼 박스 안쪽 지점에 스냅할 수 있다.
`node tools/check-templates.js`가 앵커 보유 파일 수를 세어 보여준다(강제는 아니다).

---

## 파일 골격

**1행의 `@card` 마커가 갤러리 메타데이터의 단일 소스다.** 반드시 DOCTYPE 앞에 둔다.

```
<!-- @card 제목 | 설명 | 가로x세로 -->
```

HTML5 스펙상 DOCTYPE 앞 주석은 허용되며 표준 모드가 유지된다.
크기를 기본값(1400×700)에서 바꿨다면 **마커의 크기도 같이 고친다** — 갤러리 썸네일 비율이 이 값으로 계산된다.

```html
<!-- @card 가로 단계 흐름 | 4~6단계 절차 설명. 번호 원 + 화살표 | 1400x700 -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>가로 단계 흐름</title>
  <!-- 자기완결형: CSS 전체를 아래에 인라인했다. 외부 링크 없음. -->
  <style>
/* ===== 베이스 (reset + variables + .component + components) ===== */
/* 기존 다이어그램 하나에서 이 블록을 통째로 복사해 온다 */

/* ===== 이 다이어그램 전용 ===== */
    .component { width: 1400px; height: 700px; }
  </style>
</head>
<body>
  <div class="component">
    <!-- 내용 -->
  </div>
  <!-- JS 0줄. 축소는 갤러리(docs/gallery.js fitFrames)가 iframe 쪽에서 한다.
       예전에는 body.style.zoom 자기축소 스크립트가 있었는데, 그 zoom이
       html.to.design import 때 좌표계를 갈라 텍스트를 밀어버려서 걷어냈다. -->
</body>
</html>
```

**외부 CSS 링크는 쓰지 않는다.** 슬라이드 템플릿과 마찬가지로 파일 하나로 열리고, 하나로 Figma에
들어가야 한다. 베이스 CSS는 `03_ASSETS/css/`(reset · variables · `.component` · components)에서 온
것이고, 토큰을 고칠 때는 그 원본과 각 HTML의 인라인 블록을 함께 갱신한다.

---

## 완료 처리

```bash
node tools/build-gallery.js     # 목록 재생성
node tools/check-templates.js   # @card 마커 · 외부 CSS 링크 · JS 0줄 검사
node tools/check-templates.js --figma   # Figma import를 깨는 CSS 목록
npx serve -l 8000 .             # localhost:8000/docs/ 에서 확인
```

1. 마커를 포함해 HTML 작성
2. `node tools/build-gallery.js` 실행
3. 갤러리에서 썸네일 확인 → commit & push
4. [체크리스트](../../00_GUIDES/03_CHECKLIST.md) 통과 후 Figma 임포트

> **`status`는 손으로 안 고친다.** 빌드 스크립트가 파일 내용으로 판정한다 —
> 주석만 있으면 `todo`, 실제 내용이 있으면 `done`.
> `docs/manifest.json`도 스크립트 산출물이므로 직접 편집하지 않는다.
