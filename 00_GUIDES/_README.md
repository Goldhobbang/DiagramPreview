# 00_GUIDES — 공통 지침서

이 프로젝트의 모든 규칙이 여기 있다. HTML을 만들기 전에 최소 1, 2번은 읽는다.

## 읽는 순서

| 순서 | 문서 | 언제 읽나 |
|---|---|---|
| 1 | [01_FIGMA_IMPORT_GUIDE.md](01_FIGMA_IMPORT_GUIDE.md) | 처음 1회 필수. Figma로 옮기는 절차와 함정 |
| 2 | [02_DESIGN_SYSTEM.md](02_DESIGN_SYSTEM.md) | HTML 작성 **전**. 폰트·간격·색 토큰 (**숫자**) |
| 3 | [05_VISUAL_GUIDE.md](05_VISUAL_GUIDE.md) | HTML 작성 **전**. 정렬·여백·강조·안티패턴 (**판단**) |
| 4 | [03_CHECKLIST.md](03_CHECKLIST.md) | 임포트할 **때마다**. 복붙해서 쓰는 체크리스트 |

### 만들 때 꺼내 쓰는 문서

| 문서 | 용도 |
|---|---|
| [07_PROMPTS.md](07_PROMPTS.md) | **여기서 시작.** 붙여넣어 쓰는 제작 프롬프트 (마스터 + 카테고리 + 항목별 스펙) |
| [04_DIAGRAM_CATALOG.md](04_DIAGRAM_CATALOG.md) | 다이어그램 31종 기획 목록과 우선순위 |
| [06_STYLE_IDENTITY.md](06_STYLE_IDENTITY.md) | 슬라이드 만들 때. 3개 스타일의 시각 정체성 |

## 3줄 요약

1. 캔버스는 **1920×1080 고정**, 단위는 **px만**, 반응형 아님
2. 색·간격은 **CSS 변수**로만. 하드코딩하면 테마 교체가 불가능해짐
3. Figma 임포트는 **GitHub Pages URL 방식**. 뷰포트는 Custom 1920×1080

## 문서 역할 구분

`02_DESIGN_SYSTEM`은 **숫자**를, `05_VISUAL_GUIDE`는 **판단**을 정한다.
숫자를 다 지켰는데 못생긴 결과가 나오면 `05`를 다시 읽는다.
