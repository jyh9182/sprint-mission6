# design/

레슨커넥트AI 랜딩페이지의 디자인 참고 자료입니다. 앱 빌드에는 쓰이지 않습니다. 실제로 화면에 쓰이는 사진은 `public/assets/`에 있습니다.

원본 Figma: https://www.figma.com/design/RyxzsASpQMGHSrEaHfWGgJ

```
design/
├── assets.manifest.json      public/assets 사진의 생성 방법과 원본 설명
├── figma/
│   ├── figma-delivery.json   Figma 파일·프레임 ID, 검수 결과, 알려진 제약
│   └── design-audit.json     프레임별 컴포넌트 인스턴스와 검사 결과
└── screenshots/
    ├── figma/                Figma 시안 (desktop, mobile, components)
    ├── runtime/              Figma 코드 레이어 실행 화면 (너비 320/390/768/1440)
    └── web/                  로컬 웹 구현 화면 (desktop, mobile)
```

스크린샷은 2026-11-03 검수 시점의 기록입니다. 지금 코드와 다를 수 있으니 최신 화면은 `npm test` 실행 후 `test-results/landing-<너비>.png`에서 확인하세요.
