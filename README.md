# Hyunsu Park — Photo Journal

사진을 올리기만 하면 자동으로 정리되어 웹진처럼 보여주는 개인 사이트입니다.
GitHub Pages로 무료 호스팅됩니다. 주소: **https://cozypark.github.io**

---

## 처음 한 번만 — 설정 (10분)

1. GitHub에서 새 저장소(repository)를 만듭니다.
   - 이름은 반드시 **`cozypark.github.io`** (소문자, 본인 GitHub 사용자명과 동일해야 함)
   - Public 으로 생성
2. 이 폴더의 모든 파일을 저장소에 올립니다.
   (웹에서 "uploading an existing file"로 드래그하거나, git push)
3. 저장소 **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main / (root)** 선택 후 저장
4. 저장소 **Settings → Actions → General → Workflow permissions**
   - **Read and write permissions** 선택 후 저장
   (자동 썸네일 생성 결과를 다시 커밋하기 위해 필요합니다)
5. 1~2분 뒤 https://cozypark.github.io 접속 → 끝.

---

## 평소 사용법 — 사진 올리기

`photos/` 폴더에 사진을 올리기만 하면 됩니다.

- GitHub 웹사이트에서 `photos` 폴더로 들어가 → **Add file → Upload files** →
  사진을 끌어다 놓고 **Commit** 하면 끝.
- 잠시 뒤(1~2분) 사이트가 자동으로 갱신됩니다.
  - 촬영 날짜(EXIF)를 읽어 **월별로 자동 정리**
  - 빠른 로딩을 위한 **썸네일 자동 생성**
  - 최신 사진이 위로

지원 형식: `.jpg` `.jpeg` `.png` `.webp`

### 사진에 글 붙이기 (선택)
사진과 **같은 이름의 `.txt` 파일**을 함께 올리면 그 글이 캡션으로 붙습니다.

```
photos/jeju.jpg      ← 사진
photos/jeju.txt      ← "그날 바다는 유난히 멀어 보였다." (이 글이 사진 아래에 표시됨)
```

---

## 내 정보 수정하기
`about.html` 파일을 열어 이메일·전화·인스타그램 부분을 고치면 됩니다.

## 동작 원리 (참고)
- `scripts/generate_gallery.py` — 사진을 스캔해 썸네일과 `photos.json` 생성
- `.github/workflows/build-gallery.yml` — 사진을 올리면 위 스크립트를 자동 실행
- `index.html` + `assets/app.js` — `photos.json`을 읽어 웹진 화면을 그림

직접 명령어를 칠 필요는 없습니다. 사진만 올리면 됩니다.
