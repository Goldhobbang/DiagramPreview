# 01_TEMPLATES_BY_STYLE — 스타일별 완성형 템플릿

20가지 UI/UX 디자인 스타일 × 3 베리에이션 = 60개 템플릿.
한 스타일 = 한 폴더. 각 폴더는 **베리에이션 3종 × (표지 + 전역) = 6개 HTML**을 갖는다.

디자인 기획서: [../00_GUIDES/PLANS/](../00_GUIDES/PLANS/)

## 폴더 구조

```
01_FLAT_DESIGN/
├── v1_01_cover.html
├── v1_02_global.html
├── v2_01_cover.html
├── v2_02_global.html
├── v3_01_cover.html
└── v3_02_global.html
```

CSS 파일이 없다. 각 HTML이 자기 CSS를 전부 품고 있다.

## HTML은 자기완결형 단일 파일이다

**외부 `<link>`가 없다.** 파일 하나만 다른 곳에 복사해도 그대로 열린다
(`03_ASSETS` 없이 동작). 각 HTML의 `<style>` 안에는 순서대로:

```
00_reset → 01_variables → 02_slide_base → 03_components → 베리에이션 토큰(.v1 등)
→ 그 슬라이드만의 레이아웃
```

**HTML이 단일 소스다.** 토큰을 고치려면 그 HTML을 직접 고친다.
같은 베리에이션의 표지·전역 2장이 토큰을 각자 갖고 있으므로, 색을 바꾸면
**2개 파일을 함께** 고쳐야 한다. 자기완결성의 대가다.

## 축소 — 슬라이드 파일은 JS 0줄, 축소는 갤러리가 한다

각 HTML은 **1920×1080 원본 그대로**다. `<script>`가 없다.

예전에는 `</body>` 앞에 `body.style.zoom`으로 컨테이너에 맞추는 자기축소 스크립트가
있었지만 **걷어냈다.** `zoom`은 `getBoundingClientRect`(스케일 반영)와
`getComputedStyle`의 `font-size`/`padding`(스케일 미반영)을 서로 다른 좌표계로 갈라
놓는다. html.to.design이 그 둘을 섞어 읽으므로 뷰포트가 1px만 작아도 import 결과에서
텍스트가 밀렸다.

축소는 이제 보여주는 쪽이 한다 — `docs/gallery.js`의 `fitFrames()`가 iframe에
캔버스 원본 px를 주고 `transform: scale()`로 컨테이너 폭에 맞춘다
(`docs/builder.js`의 팔레트 썸네일도 같은 함수를 쓴다).
카드 폭은 갤러리 헤더의 S/M/L 토글이 정한다 (`docs/index.html`의 `data-size`).

- 파일을 직접 열면 원본 1920×1080이다 — 창이 작으면 스크롤바가 생긴다. 정상이다.
  Figma import는 이 상태를 그대로 캡처해야 맞는다.
- `17_RETRO_PIXEL`은 비정수 배율에서 픽셀 가장자리가 뭉갠다 — 원본 크기로 열면 선명하다.

`tools/check-templates.js`가 이 스크립트의 존재를 검사한다. 새 템플릿은 기존 파일을
복사해 만들므로 자동으로 따라온다.

`03_ASSETS/css/*.css`는 남아 있지만 이 폴더와는 무관하다 —
`02_COMPONENTS_LIBRARY`의 다이어그램·컴포넌트가 아직 링크해서 쓴다.

```bash
node tools/check-templates.js # 폴더 규약 검사
node tools/build-gallery.js   # docs/manifest.json 갱신
```

## 3종은 레이아웃을 공유하지 않는다

같은 스타일의 V1·V2·V3는 **화면 분할 구조 자체가 다르다.**
그래서 공통 레이아웃 CSS를 두지 않는다 — 토큰(색·반경·그림자)만 `.v1`/`.v2`/`.v3`
블록으로 스코프하고, 배치는 각 HTML이 자기 것을 갖는다.

## 새 스타일 추가하는 법

1. 폴더 생성: `NN_<STYLE_NAME>/` (2자리 번호 + 대문자 스네이크)
2. 기존 스타일의 HTML 하나를 복사해 시작한다 — `<style>` 앞부분(공통 CSS)을 그대로 물려받는다
3. `<style>` 안에 `.v1` / `.v2` / `.v3` 토큰 블록을 쓰고, `.slide`에 그 클래스를 붙인다
   ```html
   <div class="slide v2"> ... </div>
   ```
4. 1행에 갤러리 마커를 넣는다
   ```html
   <!-- @card V2 콘셉트명 · 표지 | 한 줄 설명 | 1920x1080 -->
   ```
5. `tools/build-gallery.js`의 `LABELS`에 폴더명 → 한글 라벨 추가
6. `node tools/check-templates.js && node tools/build-gallery.js`

상세 규칙: [../00_GUIDES/02_DESIGN_SYSTEM.md](../00_GUIDES/02_DESIGN_SYSTEM.md)
