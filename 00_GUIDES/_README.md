# 00_GUIDES — 공통 지침서

이 프로젝트의 모든 규칙이 여기 있다. HTML을 만들기 전에 최소 1, 2번은 읽는다.

## 읽는 순서

| 순서 | 문서 | 언제 읽나 |
|---|---|---|
| 1 | [01_FIGMA_IMPORT_GUIDE.md](01_FIGMA_IMPORT_GUIDE.md) | 처음 1회 필수. Figma로 옮기는 절차와 함정 |
| 2 | [02_DESIGN_SYSTEM.md](02_DESIGN_SYSTEM.md) | HTML 작성 **전**. 폰트·간격·색 토큰 |
| 3 | [03_CHECKLIST.md](03_CHECKLIST.md) | 임포트할 **때마다**. 복붙해서 쓰는 체크리스트 |
| 4 | [04_DIAGRAM_CATALOG.md](04_DIAGRAM_CATALOG.md) | 다이어그램 만들 때. 31종 기획 + 진척 현황 |

## 3줄 요약

1. 캔버스는 **1920×1080 고정**, 단위는 **px만**, 반응형 아님
2. 색·간격은 **CSS 변수**로만. 하드코딩하면 테마 교체가 불가능해짐
3. Figma 임포트는 **GitHub Pages URL 방식**. 뷰포트는 Custom 1920×1080
