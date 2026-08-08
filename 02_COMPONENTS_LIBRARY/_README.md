# 02_COMPONENTS_LIBRARY — 개별 요소 보관소

슬라이드가 아니라 **슬라이드에 얹는 부품**들. 각 파일은 `.component` 캔버스(기본 1400×700)를 쓰며,
테마 색을 고정하지 않고 CSS 변수만 참조한다 → 어느 스타일에나 얹을 수 있다.

## 구성

| 폴더 | 내용 | 개수 |
|---|---|---|
| `01_TYPOGRAPHY` | 제목 스케일, 본문 블록, 리스트 스타일 | 3 |
| `02_CHARTS` | 막대/선/도넛/누적/KPI | 6 |
| `03_DIAGRAMS` | ★ 다이어그램 31종 (5개 카테고리) | 31 |
| `04_TABLES` | 비교표, 가격표, 사양표 | 3 |
| `05_UI_PARTS` | 배지, 강조박스, 진행표시, 아이콘 불릿 | 4 |

다이어그램 기획 목록: [../00_GUIDES/04_DIAGRAM_CATALOG.md](../00_GUIDES/04_DIAGRAM_CATALOG.md)
다이어그램 작성 규칙: [03_DIAGRAMS/_README.md](03_DIAGRAMS/_README.md)

## 공통 규칙

- 크기는 **컴포넌트 자체 크기**. 슬라이드(1920×1080) 안에 억지로 맞추지 않는다
- 색은 `var(--color-*)` 또는 `var(--color-data-1~6)`만. 하드코딩 금지
- 각 파일은 **독립 실행 가능** — 공통 CSS를 상대경로로 링크
- 실제 예시 문구를 넣는다. "Lorem ipsum"은 임포트 후 길이 감이 안 잡혀 금지

## CSS 링크 (컴포넌트 기준 경로)

```html
<!-- 02_COMPONENTS_LIBRARY/02_CHARTS/*.html 기준 -->
<link rel="stylesheet" href="../../03_ASSETS/css/00_reset.css">
<link rel="stylesheet" href="../../03_ASSETS/css/01_variables.css">
<link rel="stylesheet" href="../../03_ASSETS/css/02_slide_base.css">
<link rel="stylesheet" href="../../03_ASSETS/css/03_components.css">
```

```html
<!-- 02_COMPONENTS_LIBRARY/03_DIAGRAMS/<카테고리>/*.html 기준 — 한 단계 더 깊다 -->
<link rel="stylesheet" href="../../../03_ASSETS/css/00_reset.css">
...
```

## 새 컴포넌트 추가 후

1. `docs/manifest.json`에 항목 추가 (다이어그램은 이미 31개 등록되어 있으니 `status`만 `done`으로)
2. `00_GUIDES/04_DIAGRAM_CATALOG.md`의 상태도 같이 갱신
3. 갤러리에서 썸네일 확인 → push
