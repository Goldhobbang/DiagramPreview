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

기획 목록 — 다이어그램: [../00_GUIDES/04_DIAGRAM_CATALOG.md](../00_GUIDES/04_DIAGRAM_CATALOG.md) ·
그 외 16종: [../00_GUIDES/06_COMPONENT_CATALOG.md](../00_GUIDES/06_COMPONENT_CATALOG.md)
작성 규칙(전 폴더 공통): [03_DIAGRAMS/_README.md](03_DIAGRAMS/_README.md)

## 공통 규칙

- 크기는 **컴포넌트 자체 크기**. 슬라이드(1920×1080) 안에 억지로 맞추지 않는다
- 색은 `var(--color-*)` 또는 `var(--color-data-1~6)`만. 하드코딩 금지
- 각 파일은 **자기완결형** — CSS를 파일 안에 인라인하고 외부 `<link>`는 쓰지 않는다
  (베이스 블록은 기존 파일에서 통째로 복사한다. 원본은 `03_ASSETS/css/`)
- **JS 0줄**. `<script>`를 두지 않는다 — `zoom`이 html.to.design import를 깬다.
  축소는 갤러리(`docs/gallery.js`의 `fitFrames`)가 iframe 쪽에서 한다
- 실제 예시 문구를 넣는다. "Lorem ipsum"은 임포트 후 길이 감이 안 잡혀 금지

## 새 컴포넌트 추가 후

```bash
node tools/build-gallery.js     # docs/manifest.json 재생성 — 손으로 고치지 않는다
node tools/check-templates.js   # @card 마커 · 외부 CSS 링크 없음 · JS 0줄 검사
npx serve -l 8000 .             # localhost:8000/docs/ 에서 썸네일 확인 → push
```

`status`(todo/done)는 손으로 안 고친다 — 빌드 스크립트가 파일 내용으로 판정한다.
카탈로그 문서의 표는 기획서이므로 진척 갱신 대상이 아니다.
