# fonts — 폰트 관리

## 원칙

**Figma에 설치되지 않은 폰트는 쓰지 않는다.**
브라우저에서만 로드되는 폰트를 쓰면 임포트 시 fallback으로 굳거나, 텍스트가 이미지로 래스터화된다.

## 기본 폰트

| 용도 | 폰트 | 라이선스 |
|---|---|---|
| 본문/제목 | Pretendard | SIL OFL 1.1 — 상업적 사용·임베드 가능 |
| 대체 | Noto Sans KR | SIL OFL 1.1 |
| 코드 | JetBrains Mono | Apache 2.0 |

## 임베드 방식 2가지

### A. 로컬 파일 (권장)
`fonts/` 에 `.woff2`를 두고 `01_variables.css` 위에서 `@font-face`로 선언.
Pages 배포 시 상대경로로 로드되며 네트워크 의존이 없다.

```css
@font-face {
  font-family: "Pretendard";
  src: url("../fonts/Pretendard-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: block;   /* swap 아님 — 로드 전 캡처되어 fallback으로 굳는 것을 막는다 */
}
```

`font-display: block`인 이유: `swap`을 쓰면 플러그인이 fallback 상태에서 캡처할 수 있다.

### B. CDN `<link>`
간편하지만 로드 타이밍 이슈로 임포트가 불안정할 수 있다. 빠른 테스트용으로만.

## 체크

- [ ] 사용하는 굵기(400/500/600/700)의 파일이 모두 있는가
- [ ] Figma 데스크톱 앱에 같은 폰트가 설치되어 있는가
- [ ] 임포트 후 Figma 상단에 "Missing fonts" 배너가 없는가

## 새 폰트 추가 시

1. 라이선스 확인 (웹 임베드 허용 여부)
2. `.woff2` 변환 후 이 폴더에 저장
3. 위 표에 폰트명·라이선스 추가
4. Figma에도 동일 폰트 설치
