# 04. 다이어그램 카탈로그 (60종)

`02_COMPONENTS_LIBRARY/03_DIAGRAMS/` 에 들어갈 다이어그램 **기획 목록**.
다이어그램이 아닌 부품(타이포·차트·표·UI) 16종은 [06_COMPONENT_CATALOG.md](06_COMPONENT_CATALOG.md).

> 이 문서는 "무엇을 만들 것인가"의 기획서다. **진척 현황은 여기서 보지 않는다.**
> 실제 상태는 갤러리(`docs/`)가 파일을 스캔해 자동으로 보여준다.
> 크기 열은 각 파일 1행 `@card` 마커의 사본이다 — 마커가 단일 소스다.

---

## 공통 설계 규칙

작성 규칙 전문: [../02_COMPONENTS_LIBRARY/03_DIAGRAMS/_README.md](../02_COMPONENTS_LIBRARY/03_DIAGRAMS/_README.md)

- 크기는 슬라이드(1920×1080)가 아니라 **컴포넌트 자체 크기** (기본 `1400 × 700`)
- **1행에 `@card` 마커** — `<!-- @card 제목 | 설명 | 1400x700 -->`
- 각 파일은 **자기완결형** (CSS 인라인 · 외부 링크 금지) · **JS 0줄** (축소는 갤러리가 한다)
- 색은 `--color-data-1 ~ 6` 순서대로. 하드코딩 금지
- 도형은 인라인 `<svg>`, 텍스트는 HTML 요소
- 실제 예시 문구 ("Lorem ipsum" 금지)
- 이어 붙일 지점에 **`data-anchor`** — 조합 빌더(`docs/builder.html`)의 스냅 대상

---

## 01_PROCESS_FLOW — 프로세스 · 흐름 (9종)

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_linear_steps_horizontal.html` | 가장 기본. 4~6단계 절차 설명 | 번호 원 + 제목 + 설명, 화살표 연결 | 1400×700 |
| 2 | `02_timeline_milestone.html` | 프로젝트 로드맵, 연혁 | 수평 축 + 상하 교차 배치 마일스톤 카드 | 1600×600 |
| 3 | `03_conversion_funnel.html` | 마케팅 퍼널, 이탈률 분석 | 사다리꼴 5단 + 단계별 수치·전환율 | 1200×800 |
| 4 | `04_swimlane_process.html` | 부서별 R&R이 얽힌 프로세스 | 3~4 레인 × 단계 그리드, 레인 간 화살표 | 1600×700 |
| 5 | `05_decision_flowchart.html` | 조건 분기 로직 | 마름모 판단 노드 + Yes/No 분기 | 1200×800 |
| 6 | `06_gantt_roadmap.html` | 일정 계획, 분기별 과제 | 좌측 과제명 + 우측 기간 바 + 분기 눈금 | 1600×700 |
| 7 | `07_before_after_arrow.html` | 개선 전후 비교 | 좌우 2블록 + 중앙 대형 변환 화살표 | 1400×600 |
| 8 | `08_state_transition.html` | 상태 전이 · 승인 상태 정의 | 상태 노드 5 + 전이 조건 라벨 화살표(순환 포함) | 1400×700 |
| 9 | `09_kanban_board.html` | 진행 현황 공유 | 4열 보드 + 카드(담당·기한) + 열 상단 건수 | 1600×800 |

---

## 02_HIERARCHY_TREE — 계층 · 관계 (7종)

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_org_chart_vertical.html` | 조직도 3계층 | 최상단 1 + 2계층 N + 3계층 다수, 직선 커넥터 | 1400×700 |
| 2 | `02_mindmap_radial.html` | 브레인스토밍, 개념 확장 | 중앙 노드 + 방사형 곡선 브랜치 | 1400×900 |
| 3 | `03_tree_breakdown_wbs.html` | WBS, 제품 구성 분해 | 좌→우 들여쓰기 트리, 레벨별 색 농도 | 1200×800 |
| 4 | `04_logic_tree_issue.html` | MECE 이슈 분해, 원인 분석 | 좌측 핵심 질문 + 우측 2단 분기 | 1400×800 |
| 5 | `05_sitemap_structure.html` | 서비스 IA, 메뉴 구조 | 박스 그리드형 계층, 뎁스별 테두리 구분 | 1400×700 |
| 6 | `06_stakeholder_map.html` | 이해관계자 관계도 | 중심 조직 + 위성 노드 + 관계선 굵기 차등 | 1200×900 |
| 7 | `07_org_matrix.html` | 매트릭스 조직 · 겸직 구조 | 행=기능 조직 / 열=프로젝트, 교차 셀에 인원 배지 | 1400×800 |

---

## 03_MATRIX_SWOT — 매트릭스 · 4분면 (7종)

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_swot_2x2.html` | SWOT 분석 | 4분면 + 분면별 색상 코드 + 불릿 리스트 | 1200×800 |
| 2 | `02_positioning_map.html` | 경쟁사 포지셔닝 | X/Y축 라벨 + 산점 버블 + 자사 강조 | 1000×900 |
| 3 | `03_priority_matrix.html` | 중요도-긴급도, ICE 스코어 | 4분면 + 축 화살표 + 항목 태그 | 1000×900 |
| 4 | `04_comparison_matrix.html` | 다항목 비교표 | 행=항목 / 열=기준, 셀에 ●◐○ 평가 심볼 | 1400×700 |
| 5 | `05_bcg_growth_share.html` | 사업 포트폴리오 | 4분면 + Star/Cash Cow 명칭 + 버블 크기=매출 | 1000×900 |
| 6 | `06_raci_matrix.html` | 역할·책임 분담 | 행=업무 / 열=담당자, R/A/C/I 배지 | 1400×700 |
| 7 | `07_kano_model.html` | 기능 우선순위(만족도 축) | 곡선 3개(필수·성능·매력) + 기능 점 배치 | 1200×800 |

---

## 04_VENN_CYCLE — 교집합 · 순환 (7종)

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_venn_3circle.html` | 3요소 교집합, 핵심 가치 정의 | 반투명 원 3개 + 교집합 라벨 + 중앙 결론 | 1100×900 |
| 2 | `02_venn_2circle_overlap.html` | 두 영역의 시너지 | 원 2개 + 중앙 교집합 강조 | 1200×700 |
| 3 | `03_cycle_arrow_loop.html` | PDCA, 선순환 구조 | 4~6 아크 화살표 원형 + 중앙 제목 | 1000×900 |
| 4 | `04_infinity_continuous.html` | DevOps, 지속 개선 루프 | 8자 형태 + 양쪽 단계 노드 | 1400×600 |
| 5 | `05_hub_spoke_radial.html` | 플랫폼 중심 생태계 | 중앙 허브 + 방사형 6~8 스포크 카드 | 1200×900 |
| 6 | `06_gear_interlock.html` | 상호 연동 요소 | 맞물린 기어 3개 + 각 기어 라벨 | 1200×700 |
| 7 | `07_double_diamond.html` | 디자인 프로세스(발산·수렴) | 다이아몬드 2개 + 4단계(발견·정의·개발·전달) | 1600×600 |

---

## 05_PYRAMID_LAYER — 피라미드 · 레이어 (7종)

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_pyramid_3layer.html` | 계층 구조, 매슬로우형 | 3~5단 삼각 분할 + 우측 설명 텍스트 | 1400×700 |
| 2 | `02_inverted_funnel.html` | 필터링·선별 과정 | 역삼각 단계 + 단계별 잔존 수치 | 1200×800 |
| 3 | `03_stacked_layers_tech.html` | 기술 스택, 아키텍처 레이어 | 직사각 수평 레이어 스택 + 좌측 레이어명 | 1200×800 |
| 4 | `04_maturity_stairs.html` | 성숙도 모델, 단계별 성장 | 계단형 상승 블록 + 각 단 기준 설명 | 1400×700 |
| 5 | `05_iceberg_visible.html` | 표면 vs 이면 (빙산 모델) | 수면선 기준 상단 소 / 하단 대 영역 | 1100×900 |
| 6 | `06_building_blocks.html` | 전략 체계도 (비전-전략-과제) | 최상단 비전 바 + 중간 기둥 N개 + 하단 기반 바 | 1400×800 |
| 7 | `07_kpi_tree.html` | 지표 분해 (핵심 → 하위) | 최상단 핵심 지표 + 2단 분해 + 기여도 % | 1600×800 |

---

## 06_SYSTEM_ARCH — 시스템 · 아키텍처 (7종)

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_system_context.html` | 시스템 경계와 외부 연동 | 중앙 시스템 박스 + 외부 액터·시스템 + 연동 화살표 | 1600×800 |
| 2 | `02_data_flow.html` | 데이터 이동 경로 | 소스 → 수집 → 저장 → 활용 4단 + 단계 간 데이터 라벨 | 1600×700 |
| 3 | `03_sequence_api.html` | API 호출 순서 | 참가자 4 수직 레인 + 번호 붙은 좌우 메시지 화살표 | 1200×900 |
| 4 | `04_erd_tables.html` | 데이터 모델 | 테이블 박스 4개(컬럼 목록) + 1:N 관계선 | 1400×800 |
| 5 | `05_network_topology.html` | 인프라 구성 | 존(DMZ/내부) 묶음 + 장비 노드 + 연결선 | 1400×800 |
| 6 | `06_deploy_pipeline.html` | CI/CD 흐름 | 커밋 → 빌드 → 테스트 → 배포 스테이지 + 게이트 표시 | 1600×600 |
| 7 | `07_three_tier.html` | 3계층 아키텍처 | 프레젠테이션·애플리케이션·데이터 레이어 + 계층 간 화살표 | 1200×800 |

---

## 07_BUSINESS_MODEL — 비즈니스 모델 (8종)

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_business_model_canvas.html` | 비즈니스 모델 정리 | 9블록 그리드 + 블록별 불릿 | 1600×900 |
| 2 | `02_value_chain.html` | 가치사슬 분석 | 본원적 활동 5 화살표 블록 + 지원 활동 3 상단 바 | 1600×700 |
| 3 | `03_customer_journey.html` | 고객 여정 설계 | 단계 5 × 행(행동·접점·감정 곡선·기회) | 1600×800 |
| 4 | `04_service_blueprint.html` | 서비스 운영 설계 | 프론트/백스테이지/지원 프로세스 3레인 + 접점 연결 | 1600×900 |
| 5 | `05_persona_card.html` | 타깃 정의 | 프로필 블록 + 목표·불편·행동 3열 | 1400×700 |
| 6 | `06_five_forces.html` | 산업 구조 분석 | 중앙 경쟁 + 4방향 압력 박스 + 강도 표시 | 1200×900 |
| 7 | `07_pest_analysis.html` | 외부 환경 분석 | 4분면 + 요인별 영향도 배지 | 1200×800 |
| 8 | `08_lean_canvas.html` | 사업 가설 정리 | 9블록(문제·솔루션·지표·UVP 등) | 1600×900 |

---

## 08_DATA_RELATION — 수치 관계 (8종)

차트(`02_CHARTS`)와의 구분: 차트는 **값을 읽는** 그림, 여기는 **관계·구조를 읽는** 그림이다.

| # | 파일 | 용도 | 구성 요소 | 크기 |
|---|---|---|---|---|
| 1 | `01_waterfall_bridge.html` | 증감 분해 (기초 → 기말) | 시작·종료 막대 + 증감 막대(색 구분) + 연결선 | 1400×700 |
| 2 | `02_scatter_correlation.html` | 두 변수 관계 | X/Y축 + 산점 + 추세선 + 사분면 라벨 | 1200×800 |
| 3 | `03_heatmap_grid.html` | 2축 밀도 | 행×열 셀 + 농도 단계 + 범례 | 1400×800 |
| 4 | `04_treemap_share.html` | 비중 계층 | 면적 비례 사각형 중첩 + 상위 그룹 테두리 | 1400×800 |
| 5 | `05_sankey_flow.html` | 흐름 배분 | 좌우 노드 + 폭이 값인 곡선 띠 | 1600×800 |
| 6 | `06_radar_profile.html` | 다축 역량 비교 | 6축 거미줄 + 2계열 다각형 + 범례 | 1000×900 |
| 7 | `07_bubble_timeline.html` | 시점별 규모 | 수평 시간축 + 크기=값 버블 + 라벨 | 1600×700 |
| 8 | `08_bullet_target.html` | 목표 대비 실적 | 실적 바 + 목표 기준선 + 구간 배경 3단 | 1200×600 |

---

## 우선순위 (제안)

실무 활용 빈도 기준.

**1순위 (6종, 완료)** — 어느 발표에나 쓰임
`01_linear_steps_horizontal` · `02_timeline_milestone` · `01_swot_2x2`
`01_org_chart_vertical` · `03_cycle_arrow_loop` · `03_stacked_layers_tech`

**2순위 (6종, 완료)** — 기획·전략 문서
`03_conversion_funnel` · `03_priority_matrix` · `04_comparison_matrix`
`04_logic_tree_issue` · `01_venn_3circle` · `01_pyramid_3layer`

**3순위 (신설 29종)** — 카테고리 단위로 만든다
`06_SYSTEM_ARCH` → `08_DATA_RELATION` → `07_BUSINESS_MODEL` → 기존 카테고리 보강 6종

---

## 진척 확인 방법

```bash
node tools/build-gallery.js     # 파일을 스캔해 목록 + 상태 재생성
node tools/check-templates.js   # 규약 + data-anchor 보유 수
npx serve -l 8000 .             # localhost:8000/docs/ 상단에 done/total 표시
```

수동 갱신 절차는 없다. HTML에 실제 내용이 들어가면 스크립트가 `done`으로 판정한다.

---

관련 문서: [02_DESIGN_SYSTEM.md](02_DESIGN_SYSTEM.md) ·
[06_COMPONENT_CATALOG.md](06_COMPONENT_CATALOG.md) ·
[../02_COMPONENTS_LIBRARY/03_DIAGRAMS/_README.md](../02_COMPONENTS_LIBRARY/03_DIAGRAMS/_README.md)
