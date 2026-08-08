# 01. Figma 임포트 가이드 (html.to.design)

이 문서는 이 저장소의 HTML을 Figma로 옮길 때의 **표준 절차와 함정**을 정리한다.
읽기 전 전제: 모든 슬라이드는 1920×1080 고정 캔버스이며 반응형이 아니다.

---

## 1. 뷰포트 설정 — 가장 중요

플러그인 실행 후 Viewport를 **반드시 커스텀 `1920 × 1080`** 으로 지정한다.

| 설정 | 결과 |
|---|---|
| Custom `1920 × 1080` | ✅ 의도한 그대로 |
| Desktop 프리셋 (1440 등) | ❌ 캔버스가 1920인데 뷰포트가 1440 → 가로 스크롤 영역이 잘리거나, 폰트 렌더링 메트릭이 어긋나 줄바꿈 위치가 달라짐 |
| Mobile / Tablet | ❌ 사용 금지 |

> 미디어쿼리를 안 썼으니 괜찮다고 생각하기 쉽지만, 뷰포트 폭은 폰트 서브픽셀 렌더링과
> 줄바꿈 계산에 그대로 영향을 준다. 프리셋을 쓰면 브라우저에서 보던 것과 미세하게 다르게 들어온다.

---

## 2. HTML을 불러오는 3가지 방법

### 방법 A — URL 입력 (✅ 권장)

GitHub Pages에 배포한 뒤 그 URL을 붙여넣는다.

```
https://<user>.github.io/<repo>/02_COMPONENTS_LIBRARY/03_DIAGRAMS/01_PROCESS_FLOW/01_linear_steps_horizontal.html
```

- 외부 CSS, 웹폰트, 이미지 상대경로가 **전부 정상 동작**
- 갤러리(`docs/index.html`)의 `URL 복사` 버튼이 이 값을 그대로 클립보드에 넣어준다
- 팀원과 동일한 소스를 공유할 수 있음

### 방법 B — Paste HTML (⚠️ 제한적)

HTML 소스를 직접 붙여넣는 모드.

- **상대경로가 전부 깨진다.** `<link href="../../03_ASSETS/css/...">`, `<img src="...">` 모두 404
- 쓰려면 CSS를 `<style>`로, 이미지를 base64 data URI로 **단일 파일에 인라인화**해야 함
- 빠른 1회성 테스트 외에는 권장하지 않음

### 방법 C — 로컬 서버

```bash
cd ppt_template
python -m http.server 8000
# http://localhost:8000/02_COMPONENTS_LIBRARY/...
```

- 상대경로는 살아남는다
- 단, 플러그인 버전/환경에 따라 `localhost` 접근이 차단될 수 있음
- **브라우저에서 최종 육안 확인용**으로는 이 방법이 가장 빠르다 (배포 대기 없음)

### 권장 워크플로우

```
HTML 작성 → 로컬 서버로 육안 확인 → commit & push
         → Pages 배포 → 갤러리에서 URL 복사 → 방법 A로 임포트
```

---

## 3. 웹폰트 처리

**규칙: 임포트 전에 해당 폰트가 Figma에서도 사용 가능한 상태여야 한다.**

1. Google Fonts를 `<link>`로 쓰는 경우, 플러그인이 폰트 로드 완료 전에 캡처하면
   fallback 폰트(보통 시스템 산세리프)로 굳어버린다
2. Figma에 동일 폰트가 없으면 텍스트 레이어가 들어와도 **폰트 누락 경고**가 뜨고,
   최악의 경우 텍스트가 아닌 이미지 레이어로 래스터화된다
3. 한글 폰트(Pretendard, Noto Sans KR 등)는 Figma 데스크톱 앱에 로컬 설치하거나
   Figma 팀 라이브러리 폰트를 쓰는 것이 가장 안정적

임포트 후 확인: Figma 상단에 **"Missing fonts"** 배너가 뜨면 실패다. 폰트 설치 후 재임포트.

---

## 4. 레이어 구조를 살리는 HTML 작성 규칙

임포트 품질은 대부분 **HTML을 어떻게 썼느냐**로 결정된다.

### 4-1. `div` 중첩 최소화
중첩 1단계 = Figma 프레임 1단계. 5단계 중첩하면 Figma에서 5번 더블클릭해야 요소에 닿는다.
**목표: 3~4단계 이내.**

```html
<!-- ❌ 나쁨 -->
<div class="wrap"><div class="inner"><div class="box"><div class="pad"><p>텍스트</p></div></div></div></div>

<!-- ✅ 좋음 -->
<div class="card"><p class="card-text">텍스트</p></div>
```

### 4-2. Auto Layout으로 변환시키기
`display:flex` + `gap`을 쓰면 Figma **Auto Layout**으로 변환된다.
`position:absolute`는 절대좌표 레이어가 되어, 나중에 텍스트 한 줄만 늘어나도 전부 수동으로 밀어야 한다.

| CSS | Figma 결과 |
|---|---|
| `display:flex; gap:24px` | ✅ Auto Layout (간격 24) |
| `display:grid` | △ 프레임으로는 들어오나 Auto Layout 미변환 |
| `position:absolute` | ❌ 절대 위치 고정 레이어 |
| `margin` 으로 간격 | △ 패딩으로 흡수되거나 유실 |

### 4-3. 이미지는 `<img>`로
`background-image`는 프레임의 배경 fill로 들어가 개별 조작이 어렵다.
`<img>`는 독립된 이미지 레이어가 되어 교체가 쉽다.

### 4-4. `class` 이름 = Figma 레이어 이름
플러그인은 클래스명을 레이어 이름으로 쓴다. `div1`, `wrap2` 대신
`step-card`, `funnel-stage-3` 처럼 의미 있는 이름을 쓴다.

### 4-5. SVG는 인라인으로
인라인 `<svg>`는 Figma에서 **편집 가능한 벡터 레이어**가 된다.
`<img src="icon.svg">`는 단일 래스터/이미지 레이어로 뭉쳐 들어온다.
단, 텍스트는 SVG `<text>` 대신 HTML 요소로 빼는 편이 편집성이 좋다.

---

## 5. 임포트 직후 정리 작업

1. 최상위 프레임 크기가 `1920 × 1080`인지 확인
2. 프레임 이름을 슬라이드/컴포넌트 이름으로 변경
3. Auto Layout이 안 잡힌 컨테이너는 선택 후 `Shift + A`로 수동 적용
4. 반복 사용할 요소는 컴포넌트화 (`Ctrl/Cmd + Alt + K`)
5. 불필요한 래퍼 프레임 정리 (선택 후 `Ctrl/Cmd + Shift + G`로 그룹 해제)
6. 색상을 Figma 스타일/변수로 등록해 이후 테마 교체 대비

---

## 6. 미지원 · 불안정 CSS 목록

이 저장소의 다이어그램을 만들 때 **피해야 할** 속성들.

| 속성 | 증상 | 대안 |
|---|---|---|
| `backdrop-filter` | 무시되거나 불투명 배경으로 렌더 | 반투명 배경색 + 그림자 |
| `mix-blend-mode` | 대부분 무시됨 | `rgba()` 반투명으로 대체 |
| `filter: blur()` | 불안정. 이미지로 래스터화될 수 있음 | 최소 사용 |
| 복잡한 `clip-path` | 다각형은 대체로 되나 곡선은 깨짐 | 인라인 SVG `<path>` 사용 |
| CSS 애니메이션 / `transition` | 캡처 시점의 정지 상태로 들어옴 | 최종 상태를 기본값으로 작성 |
| `grid` 의 `subgrid` | 미지원 | 중첩 flex로 대체 |
| 웹폰트 `font-feature-settings` | 유실 가능 | Figma에서 재설정 |
| `position: sticky` | 의미 없음 (정적 캡처) | 사용 금지 |

---

## 7. 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 텍스트가 이미지로 들어옴 | 웹폰트 미로드 / Figma에 폰트 없음 | Figma에 폰트 설치 후 재임포트 |
| CSS가 하나도 적용 안 됨 | Paste HTML 모드 + 상대경로 | URL 방식(A)으로 전환 |
| 레이아웃이 브라우저와 다름 | 뷰포트 프리셋 사용 | Custom 1920×1080으로 재설정 |
| 요소가 잘려 있음 | `.slide` 밖으로 오버플로우 | 브라우저에서 먼저 오버플로우 수정 |
| 레이어가 수백 개 | `div` 과다 중첩 | HTML 구조 단순화 후 재임포트 |
| 아이콘이 하나로 뭉쳐 있음 | `<img src="*.svg">` 사용 | 인라인 `<svg>`로 변경 |

---

관련 문서: [02_DESIGN_SYSTEM.md](02_DESIGN_SYSTEM.md) · [03_CHECKLIST.md](03_CHECKLIST.md)
