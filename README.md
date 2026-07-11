# 2026 하계 DI × HCI 워크숍

UNIST Data Intelligence Lab 주관 협력 워크숍 사이트.
**2026.07.28 – 07.29 · UNIST**


## 사진 추가하기

1. `photos/` 폴더에 이미지 파일 넣기
2. `js/gallery-data.js`의 `GALLERY` 배열에 한 줄 추가:

```js
{ src: "photos/파일명.jpg", caption: "설명" },
```

3. 커밋 & 푸시하면 사이트에 반영됨

## 로컬 실행

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 배포

GitHub Pages — `main` 브랜치 루트에서 서빙.
