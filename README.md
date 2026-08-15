# Figma PPT Template System

`html.to.design` 플러그인으로 Figma에 임포트하기 위한 **HTML 기반 PPT 템플릿 · 컴포넌트 라이브러리**.

슬라이드를 Figma에서 매번 수작업으로 그리는 대신, 1920×1080 고정 캔버스 HTML로 만들어
URL 하나로 임포트한다. 색·폰트·간격이 CSS 변수로 관리되므로 테마 교체가 HTML 수정 없이 된다.

---

## 빠른 시작

```bash
# 1. 로컬 서버 실행 (file:// 로 열면 CSS/fetch가 막힌다)
python -m http.server 8000
#   python이 없으면 (Windows 스토어 스텁 포함):
#   npx serve -l 8000 .

# 2. 갤러리 열기
#    http://localhost:8000/docs/

# 3. 개별 슬라이드 확인
#    http://localhost:8000/01_TEMPLATES_BY_STYLE/01_CORPORATE_BLUE/01_cover.html
```

Figma로 옮기려면: 갤러리 카드의 **URL 복사** → Figma에서 `html.to.design` 실행 →
Viewport를 **Custom 1920×1080** → URL 붙여넣기.

---

## 폴더 구조

```
ppt_template/
├── 00_GUIDES/                공통 지침서 ← 먼저 읽을 것
├── 01_TEMPLATES_BY_STYLE/    스타일별 완성형 템플릿 (3스타일 × 10슬라이드)
├── 02_COMPONENTS_LIBRARY/    개별 부품 (다이어그램 31종 포함)
├── 03_ASSETS/                공통 CSS · 폰트 · 이미지 · 아이콘
├── 99_DRAFTS/                작업/테스트용 (언제든 삭제됨)
├── tools/                    build-gallery.js — 갤러리 목록 생성기
└── docs/                     GitHub Pages 프리뷰 갤러리
```

갤러리는 저장소의 **모든 요소**를 한 페이지에서 보여준다 —
슬라이드 30 · 다이어그램 31 · 컴포넌트 16 · 디자인 토큰 62 · 이미지/아이콘.
썸네일 크기 S/M/L 토글이 있어 1920 슬라이드도 비교할 수 있다.

---

## 문서

| 문서 | 내용 |
|---|---|
| [00_GUIDES/_README.md](00_GUIDES/_README.md) | 읽는 순서 |
| [01_FIGMA_IMPORT_GUIDE.md](00_GUIDES/01_FIGMA_IMPORT_GUIDE.md) | 임포트 절차 · 함정 · 미지원 CSS |
| [02_DESIGN_SYSTEM.md](00_GUIDES/02_DESIGN_SYSTEM.md) | 폰트 스케일 · 간격 · CSS 변수 규칙 (**숫자**) |
| [03_CHECKLIST.md](00_GUIDES/03_CHECKLIST.md) | 임포트 전/후 체크리스트 |
| [04_DIAGRAM_CATALOG.md](00_GUIDES/04_DIAGRAM_CATALOG.md) | 다이어그램 31종 기획 + 우선순위 |
| [05_VISUAL_GUIDE.md](00_GUIDES/05_VISUAL_GUIDE.md) | 정렬 · 여백 · 위계 · 강조 · 안티패턴 (**판단**) |
| [06_STYLE_IDENTITY.md](00_GUIDES/06_STYLE_IDENTITY.md) | 3개 스타일의 시각 정체성 |
| [07_PROMPTS.md](00_GUIDES/07_PROMPTS.md) | **제작 프롬프트** — 붙여넣어 바로 쓰는 형태 |
| [08_COLORFUL_STYLE_GUIDE.md](00_GUIDES/08_COLORFUL_STYLE_GUIDE.md) | 컬러풀 패밀리(Bold Pop · Pastel Playful) 정체성 |

### 만들기 시작할 때

[07_PROMPTS.md](00_GUIDES/07_PROMPTS.md)의 `A. 마스터` + `B. 카테고리 블록` + `C. 항목 스펙`을
이어 붙여 Claude Code에 넣는다. 공통 규칙은 A에만 있어서 규칙 변경 시 한 곳만 고치면 된다.

---

## 핵심 규칙 3가지

1. **1920×1080 고정, `px`만 사용.** 반응형이 아니다. `rem`/`vw`/미디어쿼리 금지
2. **색·간격은 CSS 변수로만.** 하드코딩하면 테마 교체가 불가능해진다
3. **`flex` + `gap`으로 레이아웃.** Figma Auto Layout으로 변환된다. `position:absolute`는 최소화

---

## 갤러리 배포 (GitHub Pages)

**라이브: https://goldhobbang.github.io/DiagramPreview/**

1. GitHub 레포 생성 후 push
2. Settings → Pages → Source: `Deploy from a branch` → Branch `main`, Folder **`/ (root)`**
3. `https://<user>.github.io/<repo>/` 접속 (루트 `index.html`이 `docs/`로 넘긴다)

> ⚠️ **Folder를 `/docs`로 두면 안 된다.**
> 그러면 `docs/`만 사이트 루트가 되는데, 갤러리는 `../02_COMPONENTS_LIBRARY/`,
> `../03_ASSETS/` 를 iframe으로 참조하므로 그 경로가 게시 범위 밖이 되어 전부 404가 난다.
> 로컬에서는 레포 루트를 서빙하기 때문에 이 문제가 드러나지 않는다.

갤러리는 원본 HTML을 **상대경로 iframe으로 직접 참조**한다.
파일을 고치면 갤러리에 즉시 반영되며, 스크린샷 생성이나 파일 복사 단계가 없다.

---

## 작업 흐름

```
HTML 작성 (1행에 @card 마커)
  → node tools/build-gallery.js      # 폴더 스캔해 목록 재생성
  → 로컬 서버로 갤러리 확인
  → commit & push → Pages 배포
  → 갤러리에서 URL 복사 → 체크리스트 확인 → Figma 임포트
```

### `@card` 마커

각 HTML **1행**(DOCTYPE 앞)에 둔다. 갤러리 메타데이터의 단일 소스다.

```html
<!-- @card 가로 단계 흐름 | 4~6단계 절차 설명 | 1400x700 -->
<!DOCTYPE html>
```

`제목 | 설명 | 크기`. 마커가 없어도 파일명 기반 제목으로 목록에는 나온다.

**손으로 관리하지 않는 것 2가지**
- `docs/manifest.json` — 스크립트 산출물. 직접 편집 금지
- `status` — 파일에 실제 내용이 있으면 `done`, 주석뿐이면 `todo`로 자동 판정
