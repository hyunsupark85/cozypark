#!/usr/bin/env python3
"""
사진 폴더(photos/)를 스캔해서 웹진 갤러리 데이터를 자동 생성합니다.

하는 일
  1. photos/ 안의 사진(jpg, jpeg, png, webp)을 모두 찾습니다.
  2. 각 사진의 EXIF 촬영 날짜를 읽습니다. (없으면 파일 수정 날짜 사용)
  3. 빠른 로딩을 위해 photos/thumbs/ 에 썸네일을 만듭니다.
  4. 같은 이름의 .txt 파일이 있으면 그 내용을 캡션(글)으로 붙입니다.
       예) jeju.jpg + jeju.txt  ->  jeju.jpg 사진에 jeju.txt 글이 함께 보임
  5. 결과를 photos.json 으로 저장합니다. (웹사이트가 이 파일을 읽어 화면을 그림)

직접 실행할 필요는 없습니다. GitHub에 사진을 올리면 자동으로 돌아갑니다.
"""

import json
import os
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps
from PIL.ExifTags import TAGS

ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = ROOT / "photos"
THUMBS_DIR = PHOTOS_DIR / "thumbs"
MANIFEST = ROOT / "photos.json"

VALID_EXT = {".jpg", ".jpeg", ".png", ".webp"}
THUMB_MAX = 1400          # 썸네일 긴 변 최대 픽셀
THUMB_QUALITY = 82        # 썸네일 품질

KOR_MONTH = None  # 월 표기는 프론트엔드에서 처리


def read_exif_date(img: Image.Image):
    """EXIF에서 촬영 날짜(DateTimeOriginal)를 읽어 datetime으로 반환."""
    try:
        exif = img.getexif()
        if not exif:
            return None
        # 표준 태그
        wanted = {"DateTimeOriginal", "DateTime", "DateTimeDigitized"}
        found = {}
        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag in wanted and isinstance(value, str):
                found[tag] = value
        # EXIF IFD (촬영 정보는 보통 여기 들어있음)
        try:
            ifd = exif.get_ifd(0x8769)
            for tag_id, value in ifd.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag in wanted and isinstance(value, str):
                    found.setdefault(tag, value)
        except Exception:
            pass
        raw = found.get("DateTimeOriginal") or found.get("DateTimeDigitized") or found.get("DateTime")
        if raw:
            # 형식: "2026:05:30 14:23:01"
            return datetime.strptime(raw.strip(), "%Y:%m:%d %H:%M:%S")
    except Exception:
        return None
    return None


def make_thumb(src: Path, dst: Path):
    """src 사진의 썸네일을 dst 경로에 저장하고 (w, h)를 반환."""
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)   # 회전 정보 반영
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, "JPEG", quality=THUMB_QUALITY, optimize=True, progressive=True)
        return img.size


def main():
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)

    photos = []
    for path in sorted(PHOTOS_DIR.iterdir()):
        if path.is_dir():
            continue
        if path.suffix.lower() not in VALID_EXT:
            continue

        name = path.name
        stem = path.stem
        thumb_name = f"{stem}.jpg"
        thumb_path = THUMBS_DIR / thumb_name

        # 촬영 날짜
        try:
            with Image.open(path) as img:
                taken = read_exif_date(img)
        except Exception:
            taken = None
        if taken is None:
            taken = datetime.fromtimestamp(path.stat().st_mtime)

        # 썸네일 (이미 있고 원본보다 최신이면 건너뜀)
        try:
            need_thumb = (not thumb_path.exists()
                          or thumb_path.stat().st_mtime < path.stat().st_mtime)
            if need_thumb:
                w, h = make_thumb(path, thumb_path)
            else:
                with Image.open(thumb_path) as t:
                    w, h = t.size
        except Exception as e:
            print(f"  ! 썸네일 실패 {name}: {e}")
            continue

        # 캡션 (같은 이름의 .txt)
        caption = ""
        txt = path.with_suffix(".txt")
        if txt.exists():
            caption = txt.read_text(encoding="utf-8").strip()

        photos.append({
            "file": f"photos/{name}",
            "thumb": f"photos/thumbs/{thumb_name}",
            "date": taken.strftime("%Y-%m-%d"),
            "month": taken.strftime("%Y-%m"),
            "w": w,
            "h": h,
            "caption": caption,
        })
        print(f"  + {name}  ({taken:%Y-%m-%d})")

    # 최신순 정렬
    photos.sort(key=lambda p: p["date"], reverse=True)

    data = {
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "count": len(photos),
        "photos": photos,
    }
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n완료: 사진 {len(photos)}장 -> {MANIFEST.name}")


if __name__ == "__main__":
    main()
