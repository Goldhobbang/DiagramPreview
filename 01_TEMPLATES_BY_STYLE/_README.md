# 01_TEMPLATES_BY_STYLE — 스타일별 완성형 템플릿

한 스타일 = 한 폴더. 각 폴더는 **같은 10개 슬라이드 세트**를 동일한 파일명으로 갖는다.
파일명이 같으므로 스타일을 바꿔도 어느 파일이 무엇인지 헷갈리지 않는다.

## 현재 스타일

| 폴더 | 성격 |
|---|---|
| `01_CORPORATE_BLUE` | 기업 IR·보고서. 파랑 계열, 보수적 |
| `02_MINIMAL_MONO` | 흑백 미니멀. 텍스트 중심, 여백 큼 |
| `03_VIVID_GRADIENT` | 스타트업·제품 소개. 그라디언트, 강한 대비 |

## 표준 슬라이드 세트 (10종)

| 파일 | 용도 |
|---|---|
| `01_cover.html` | 표지 — 제목, 부제, 발표자, 날짜 |
| `02_agenda.html` | 목차 |
| `03_section_divider.html` | 섹션 구분 (장 표지) |
| `04_content_1col.html` | 본문 1단 — 텍스트 중심 |
| `05_content_2col.html` | 본문 2단 — 텍스트 + 이미지/도표 |
| `06_content_3col.html` | 본문 3단 — 카드 3개 나열 |
| `07_full_image.html` | 전면 이미지 + 오버레이 텍스트 |
| `08_quote.html` | 인용문 / 핵심 메시지 |
| `09_data_dashboard.html` | KPI + 차트 조합 |
| `10_closing.html` | 마무리 / Q&A / 연락처 |

## 새 스타일 추가하는 법

1. 폴더 생성: `04_<STYLE_NAME>/` (2자리 번호 + 대문자 스네이크)
2. `_style.css` 작성 — **CSS 변수 오버라이드만** 넣는다. 새 클래스를 정의하지 않는다
   ```css
   :root {
     --color-bg: #0a0a0a;
     --color-text: #fafafa;
     --color-accent: #22d3ee;
     --font-sans: "Inter", sans-serif;
   }
   ```
3. 기존 스타일 폴더의 10개 HTML을 복사 → `_style.css` 링크 경로만 확인
4. HTML 구조는 손대지 않는다. 손대야 한다면 그건 변수로 뺄 수 있는 값인지 먼저 검토

## CSS 링크 순서 (모든 슬라이드 공통)

```html
<link rel="stylesheet" href="../../03_ASSETS/css/00_reset.css">
<link rel="stylesheet" href="../../03_ASSETS/css/01_variables.css">
<link rel="stylesheet" href="../../03_ASSETS/css/02_slide_base.css">
<link rel="stylesheet" href="../../03_ASSETS/css/03_components.css">
<link rel="stylesheet" href="_style.css">
```

`_style.css`는 **항상 마지막**. 순서를 바꾸면 오버라이드가 조용히 무시된다.

상세 규칙: [../00_GUIDES/02_DESIGN_SYSTEM.md](../00_GUIDES/02_DESIGN_SYSTEM.md)
