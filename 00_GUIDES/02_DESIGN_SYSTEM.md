# 02. 디자인 시스템

16:9 (1920×1080) 슬라이드 전용 디자인 시스템. 웹사이트가 아니라 **인쇄물에 가까운 고정 캔버스**로 다룬다.

---

## 1. 캔버스 원칙

- 캔버스: **1920 × 1080 px 고정** (16:9)
- 단위는 **`px`만 사용**. `rem` / `em` / `vw` / `%` 금지
  - 반응형이 아니므로 상대 단위는 이점이 없고, Figma 임포트 시 계산 오차만 만든다
  - 예외: `line-height`는 배수(`1.5`) 사용 — px 고정보다 폰트 교체에 강함
- 미디어쿼리 **금지**. 뷰포트는 항상 1920이다
- 슬라이드 1장 = HTML 파일 1개. 한 파일에 여러 슬라이드를 넣지 않는다

### 세이프 영역
```
슬라이드      1920 × 1080
패딩          96px (상하좌우)
콘텐츠 영역   1728 × 888
```
프로젝터 오버스캔과 화면 가장자리 여유를 고려한 값. 배경 이미지 외에는 이 영역을 넘지 않는다.

### 그리드
```
12 컬럼 / 거터 32px / 컬럼폭 116px
(116 × 12) + (32 × 11) = 1392 + 352 = 1744  ≈ 콘텐츠 1728 (거터 여유 포함)
```
2단 = 6+6, 3단 = 4+4+4, 사이드바형 = 4+8.

---

## 2. 타입 스케일

1080p를 회의실 프로젝터에 띄웠을 때를 기준으로 잡은 값. 웹 기준(16px base)보다 훨씬 크다.

| 토큰 | 크기 | 굵기 | line-height | 용도 |
|---|---|---|---|---|
| `--fs-display` | 96px | 700 | 1.2 | 표지 대제목 |
| `--fs-h1` | 64px | 700 | 1.25 | 슬라이드 제목 |
| `--fs-h2` | 44px | 600 | 1.3 | 섹션 제목 |
| `--fs-h3` | 32px | 600 | 1.4 | 소제목, 카드 헤더 |
| `--fs-body-l` | 28px | 400 | 1.6 | 본문 기본 |
| `--fs-body-m` | 24px | 400 | 1.6 | 부가 설명, 다이어그램 라벨 |
| `--fs-caption` | 18px | 400 | 1.5 | 출처, 각주, 축 라벨 |

**규칙**
- **18px 미만 금지.** 프로젝터에서 읽히지 않는다
- 한 슬라이드에 3개 이하의 크기만 사용
- 한글은 `line-height` 1.5 이상 권장. 1.4 이하에서 받침이 잘리는 폰트가 있다
- `letter-spacing`: 대제목(48px 이상)은 `-0.02em`, 본문은 `0`, 캡션·라벨 대문자는 `0.05em`

---

## 3. 간격 스케일

8px 배수. 임의값 금지.

```
4  8  16  24  32  48  64  96  128
```

| 토큰 | 값 | 대표 용도 |
|---|---|---|
| `--sp-1` | 4px | 아이콘-텍스트 사이 |
| `--sp-2` | 8px | 인라인 요소 간격 |
| `--sp-3` | 16px | 카드 내부 요소 간격 |
| `--sp-4` | 24px | 카드 패딩 |
| `--sp-5` | 32px | 그리드 거터 |
| `--sp-6` | 48px | 블록 간 간격 |
| `--sp-7` | 64px | 제목-본문 간격 |
| `--sp-8` | 96px | 슬라이드 패딩 |
| `--sp-9` | 128px | 표지 여백 |

---

## 4. CSS 변수 관리 방안

### 4-1. 의미 기반 이름만 쓴다

```css
/* ❌ 원시값 이름 — 테마를 초록으로 바꾸면 이름과 실제 색이 어긋난다 */
--blue-500: #2563eb;

/* ✅ 의미 기반 — 테마가 바뀌어도 이름이 계속 맞다 */
--color-accent: #2563eb;
```

### 4-2. 테마 교체는 변수 오버라이드로만

`03_ASSETS/css/01_variables.css`가 **단일 소스**. 각 스타일 폴더의 `_style.css`는
**같은 변수명을 덮어쓰기만** 한다. HTML은 한 줄도 고치지 않는다.

```css
/* 01_TEMPLATES_BY_STYLE/02_MINIMAL_MONO/_style.css */
:root {
  --color-accent: #111111;
  --color-accent-sub: #666666;
  --font-sans: "Pretendard", sans-serif;
}
```

### 4-3. CSS 로드 순서 (고정)

```html
<link rel="stylesheet" href="../../03_ASSETS/css/00_reset.css">
<link rel="stylesheet" href="../../03_ASSETS/css/01_variables.css">
<link rel="stylesheet" href="../../03_ASSETS/css/02_slide_base.css">
<link rel="stylesheet" href="../../03_ASSETS/css/03_components.css">
<link rel="stylesheet" href="_style.css">   <!-- 테마가 있을 때만, 항상 마지막 -->
```

순서를 바꾸면 변수가 정의되기 전에 참조되어 조용히 무시된다.

---

## 5. CSS Reset 규칙

슬라이드 전용 **최소 리셋**. normalize.css 같은 범용 리셋은 쓰지 않는다 (불필요한 규칙이
Figma 레이어에 노이즈를 더한다).

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #52525b;      /* 캔버스 밖 회색 — 슬라이드 경계를 눈으로 구분 */
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.slide {
  width: 1920px;
  height: 1080px;
  overflow: hidden;         /* ★ 핵심 */
  position: relative;
  background: var(--color-bg);
}

img { display: block; max-width: 100%; }
ul, ol { list-style: none; }
a { color: inherit; text-decoration: none; }
table { border-collapse: collapse; }
```

**`.slide { overflow: hidden }`이 핵심인 이유**
Figma는 프레임 밖 콘텐츠를 잘라서 가져온다. 브라우저에서 `overflow: visible`로 두면
넘친 내용이 보여서 문제를 못 느끼다가, 임포트 후에야 잘린 걸 발견하게 된다.
브라우저에서도 똑같이 잘리게 해두면 오버플로우를 **작성 시점에** 잡을 수 있다.

**디버그 모드**: `.slide.debug *  { outline: 1px solid rgba(255,0,0,.3) }`
클래스 하나로 모든 박스 경계를 확인.

---

## 6. 색상 토큰 구조

### 시맨틱 토큰 (테마마다 값이 달라짐)

| 토큰 | 역할 |
|---|---|
| `--color-bg` | 슬라이드 배경 |
| `--color-surface` | 카드·박스 배경 |
| `--color-surface-alt` | 보조 배경 (헤더 행, 강조 영역) |
| `--color-text` | 본문 텍스트 |
| `--color-text-muted` | 부가 설명, 캡션 |
| `--color-text-invert` | 어두운 배경 위 텍스트 |
| `--color-accent` | 주 강조색 (핵심 수치, CTA) |
| `--color-accent-sub` | 보조 강조색 |
| `--color-border` | 구분선, 테두리 |
| `--color-bg-inverse` | 반전 슬라이드 배경 (전면 이미지 등) |
| `--color-text-on-inverse` | 반전 배경 위 본문 |
| `--color-text-on-inverse-muted` | 반전 배경 위 부가 설명 |
| `--card-border-w` | 카드 테두리 두께. 면으로 구분하는 테마는 `0`, 선으로 구분하는 테마(Minimal Mono)만 `1px` |

**반전 토큰이 따로 있는 이유**
`--color-text`를 배경으로 뒤집어 쓰면 밝은 테마에서만 통한다. Vivid Gradient처럼
배경이 이미 어두운 테마에서는 같은 트릭이 **흰 배경**을 만들어 버린다.
반전이 필요한 슬라이드는 `--color-bg-inverse` 계열을 쓰고, 각 테마가 자기 값을 정한다.

**테마 전용 토큰은 `var()` 폴백으로 받는다**
`--gradient-accent`는 Vivid Gradient에만 있다. 공용 HTML에서 쓰려면 폴백을 준다.

```css
/* 그라디언트 테마면 그라디언트, 아니면 단색 */
background: var(--gradient-accent, var(--color-accent));
```

### 데이터 시각화 팔레트 (6색 고정 순서)

```
--color-data-1 ~ --color-data-6
```
차트·다이어그램의 계열 색은 **반드시 이 순서대로** 사용한다. 임의 색상 하드코딩 금지.
6개를 넘는 계열이 필요하면 데이터를 묶어서 줄인다 (6색 이상은 어차피 구분이 안 된다).

### 상태색 (테마 무관 고정)
```
--color-positive  상승·성공
--color-negative  하락·경고
--color-neutral   보합
```

---

## 7. 그림자 · 라운드

Figma로 잘 넘어오는 값만 쓴다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--radius-sm` | 8px | 배지, 태그 |
| `--radius-md` | 16px | 카드 |
| `--radius-lg` | 24px | 큰 패널 |
| `--radius-full` | 9999px | 원형, 알약 |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,.08)` | 카드 기본 |
| `--shadow-md` | `0 8px 24px rgba(0,0,0,.12)` | 부상 요소 |

다중 그림자(`box-shadow: a, b, c`)는 Figma에서 유실될 수 있으니 최대 1개만 쓴다.

---

관련 문서: [01_FIGMA_IMPORT_GUIDE.md](01_FIGMA_IMPORT_GUIDE.md) · [03_CHECKLIST.md](03_CHECKLIST.md)
