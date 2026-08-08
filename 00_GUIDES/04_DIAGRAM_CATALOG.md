# 04. 다이어그램 카탈로그 (31종)

`02_COMPONENTS_LIBRARY/03_DIAGRAMS/` 에 들어갈 다이어그램 **기획 목록**.

> 이 문서는 "무엇을 만들 것인가"의 기획서다. **진척 현황은 여기서 보지 않는다.**
> 실제 상태는 갤러리(`docs/`)가 파일을 스캔해 자동으로 보여준다 —
> 아래 표의 `상태` 열은 참고용 초기값이며 손으로 갱신할 필요가 없다.

---

## 공통 설계 규칙

- 크기는 슬라이드(1920×1080)가 아니라 **컴포넌트 자체 크기**로 만든다 (기본 `1400 × 700`)
  → 슬라이드에 배치할 때 조합해서 쓴다
- **1행에 `@card` 마커**를 둔다 (갤러리 메타데이터의 단일 소스)
  ```
  <!-- @card 가로 단계 흐름 | 4~6단계 절차 설명 | 1400x700 -->
  ```
- 각 파일은 **독립 실행 가능**해야 한다 (공통 CSS를 상대경로로 링크)
- 색은 `--color-data-1 ~ 6` 순서대로. 하드코딩 금지
- 도형은 인라인 `<svg>`, 텍스트는 HTML 요소
- 텍스트는 실제 예시 문구를 넣는다 ("Lorem ipsum" 금지 — 임포트 후 길이 감이 안 잡힘)

---

## 01_PROCESS_FLOW — 프로세스 · 흐름 (7종)

| # | 파일 | 용도 | 구성 요소 | 상태 |
|---|---|---|---|---|
| 1 | `01_linear_steps_horizontal.html` | 가장 기본. 4~6단계 절차 설명 | 번호 원 + 제목 + 설명, 화살표 연결 | todo |
| 2 | `02_timeline_milestone.html` | 프로젝트 로드맵, 연혁 | 수평 축 + 상하 교차 배치 마일스톤 카드 | todo |
| 3 | `03_conversion_funnel.html` | 마케팅 퍼널, 이탈률 분석 | 사다리꼴 5단 + 단계별 수치·전환율 | todo |
| 4 | `04_swimlane_process.html` | 부서별 R&R이 얽힌 프로세스 | 3~4 레인 × 단계 그리드, 레인 간 화살표 | todo |
| 5 | `05_decision_flowchart.html` | 조건 분기 로직 | 마름모 판단 노드 + Yes/No 분기 | todo |
| 6 | `06_gantt_roadmap.html` | 일정 계획, 분기별 과제 | 좌측 과제명 + 우측 기간 바 + 분기 눈금 | todo |
| 7 | `07_before_after_arrow.html` | 개선 전후 비교 | 좌우 2블록 + 중앙 대형 변환 화살표 | todo |

---

## 02_HIERARCHY_TREE — 계층 · 관계 (6종)

| # | 파일 | 용도 | 구성 요소 | 상태 |
|---|---|---|---|---|
| 1 | `01_org_chart_vertical.html` | 조직도 3계층 | 최상단 1 + 2계층 N + 3계층 다수, 직선 커넥터 | todo |
| 2 | `02_mindmap_radial.html` | 브레인스토밍, 개념 확장 | 중앙 노드 + 방사형 곡선 브랜치 | todo |
| 3 | `03_tree_breakdown_wbs.html` | WBS, 제품 구성 분해 | 좌→우 들여쓰기 트리, 레벨별 색 농도 | todo |
| 4 | `04_logic_tree_issue.html` | MECE 이슈 분해, 원인 분석 | 좌측 핵심 질문 + 우측 2단 분기 | todo |
| 5 | `05_sitemap_structure.html` | 서비스 IA, 메뉴 구조 | 박스 그리드형 계층, 뎁스별 테두리 구분 | todo |
| 6 | `06_stakeholder_map.html` | 이해관계자 관계도 | 중심 조직 + 위성 노드 + 관계선 굵기 차등 | todo |

---

## 03_MATRIX_SWOT — 매트릭스 · 4분면 (6종)

| # | 파일 | 용도 | 구성 요소 | 상태 |
|---|---|---|---|---|
| 1 | `01_swot_2x2.html` | SWOT 분석 | 4분면 + 분면별 색상 코드 + 불릿 리스트 | todo |
| 2 | `02_positioning_map.html` | 경쟁사 포지셔닝 | X/Y축 라벨 + 산점 버블 + 자사 강조 | todo |
| 3 | `03_priority_matrix.html` | 중요도-긴급도, ICE 스코어 | 4분면 + 축 화살표 + 항목 태그 | todo |
| 4 | `04_comparison_matrix.html` | 다항목 비교표 | 행=항목 / 열=기준, 셀에 ●◐○ 평가 심볼 | todo |
| 5 | `05_bcg_growth_share.html` | 사업 포트폴리오 | 4분면 + Star/Cash Cow 등 명칭 + 버블 크기=매출 | todo |
| 6 | `06_raci_matrix.html` | 역할·책임 분담 | 행=업무 / 열=담당자, R/A/C/I 배지 | todo |

---

## 04_VENN_CYCLE — 교집합 · 순환 (6종)

| # | 파일 | 용도 | 구성 요소 | 상태 |
|---|---|---|---|---|
| 1 | `01_venn_3circle.html` | 3요소 교집합, 핵심 가치 정의 | 반투명 원 3개 + 교집합 라벨 + 중앙 결론 | todo |
| 2 | `02_venn_2circle_overlap.html` | 두 영역의 시너지 | 원 2개 + 중앙 교집합 강조 | todo |
| 3 | `03_cycle_arrow_loop.html` | PDCA, 선순환 구조 | 4~6 아크 화살표 원형 + 중앙 제목 | todo |
| 4 | `04_infinity_continuous.html` | DevOps, 지속 개선 루프 | 8자 형태 + 양쪽 단계 노드 | todo |
| 5 | `05_hub_spoke_radial.html` | 플랫폼 중심 생태계 | 중앙 허브 + 방사형 6~8 스포크 카드 | todo |
| 6 | `06_gear_interlock.html` | 상호 연동 요소 | 맞물린 기어 3개 + 각 기어 라벨 | todo |

---

## 05_PYRAMID_LAYER — 피라미드 · 레이어 (6종)

| # | 파일 | 용도 | 구성 요소 | 상태 |
|---|---|---|---|---|
| 1 | `01_pyramid_3layer.html` | 계층 구조, 매슬로우형 | 3~5단 삼각 분할 + 우측 설명 텍스트 | todo |
| 2 | `02_inverted_funnel.html` | 필터링·선별 과정 | 역삼각 단계 + 단계별 잔존 수치 | todo |
| 3 | `03_stacked_layers_tech.html` | 기술 스택, 아키텍처 레이어 | 직사각 수평 레이어 스택 + 좌측 레이어명 | todo |
| 4 | `04_maturity_stairs.html` | 성숙도 모델, 단계별 성장 | 계단형 상승 블록 + 각 단 기준 설명 | todo |
| 5 | `05_iceberg_visible.html` | 표면 vs 이면 (빙산 모델) | 수면선 기준 상단 소 / 하단 대 영역 | todo |
| 6 | `06_building_blocks.html` | 전략 체계도 (비전-전략-과제) | 최상단 비전 바 + 중간 기둥 N개 + 하단 기반 바 | todo |

---

## 우선순위 (제안)

실무 활용 빈도 기준. 여기부터 만들면 커버리지가 빨리 올라간다.

**1순위 (6종)** — 어느 발표에나 쓰임
`01_linear_steps_horizontal` · `02_timeline_milestone` · `01_swot_2x2`
`01_org_chart_vertical` · `03_cycle_arrow_loop` · `03_stacked_layers_tech`

**2순위 (6종)** — 기획·전략 문서
`03_conversion_funnel` · `03_priority_matrix` · `04_comparison_matrix`
`04_logic_tree_issue` · `01_venn_3circle` · `01_pyramid_3layer`

**3순위** — 나머지 19종

---

## 진척 확인 방법

```bash
node tools/build-gallery.js     # 파일을 스캔해 목록 + 상태 재생성
npx serve -l 8000 .             # localhost:8000/docs/ 상단에 done/total 표시
```

수동 갱신 절차는 없다. HTML에 실제 내용이 들어가면 스크립트가 `done`으로 판정한다.

---

관련 문서: [02_DESIGN_SYSTEM.md](02_DESIGN_SYSTEM.md) · [../02_COMPONENTS_LIBRARY/03_DIAGRAMS/_README.md](../02_COMPONENTS_LIBRARY/03_DIAGRAMS/_README.md)
