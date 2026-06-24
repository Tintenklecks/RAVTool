#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ICON = ROOT / "icon.png"
CHROME = ROOT / "jobroom-helper"
SAFARI = ROOT / "jobroom-helper-safari"
SAFARI_BUILD = ROOT / "safari-build" / "JobRoom Helper Safari"
SAFARI_RESOURCES = SAFARI_BUILD / "JobRoom Helper Safari Extension" / "Resources"
SAFARI_ASSETS = SAFARI_BUILD / "JobRoom Helper Safari" / "Assets.xcassets"
IOS_APP_ASSETS = SAFARI_BUILD / "iOS (App)" / "Assets.xcassets"
MACOS_APP_ASSETS = SAFARI_BUILD / "macOS (App)" / "Assets.xcassets"
SAFARI_APP_RESOURCES = SAFARI_BUILD / "JobRoom Helper Safari" / "Resources"
SHARED_APP_RESOURCES = SAFARI_BUILD / "Shared (App)" / "Resources"
STORE = ROOT / "deploy" / "store-assets"

BLUE = (31, 91, 214)
INK = (24, 31, 42)
MUTED = (93, 105, 121)
GREEN = (14, 147, 93)
BG = (246, 248, 252)
WHITE = (255, 255, 255)
LINE = (214, 221, 232)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            pass
    return ImageFont.load_default()


def ensure(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def rounded(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], radius: int, fill, outline=None, width: int = 1) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_centered(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], text: str, fill, size: int, bold: bool = False) -> None:
    f = font(size, bold)
    box = draw.textbbox((0, 0), text, font=f)
    x = xy[0] + (xy[2] - xy[0] - (box[2] - box[0])) // 2
    y = xy[1] + (xy[3] - xy[1] - (box[3] - box[1])) // 2
    draw.text((x, y), text, font=f, fill=fill)


def make_icon(size: int) -> Image.Image:
    if not SOURCE_ICON.exists():
        raise FileNotFoundError(f"Missing source icon: {SOURCE_ICON}")

    img = Image.open(SOURCE_ICON).convert("RGBA")
    width, height = img.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    img = img.crop((left, top, left + side, top + side))
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_screenshot(path: Path) -> None:
    img = Image.new("RGB", (1280, 800), BG)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 1280, 72), fill=WHITE)
    d.text((42, 21), "JobRoom Helper", font=font(28, True), fill=INK)
    d.text((1030, 25), "LinkedIn -> Job-Room", font=font(18), fill=MUTED)

    rounded(d, (64, 118, 540, 660), 8, WHITE, LINE)
    d.text((92, 150), "LinkedIn job", font=font(26, True), fill=INK)
    d.text((92, 198), "Senior Product Manager", font=font(32, True), fill=BLUE)
    d.text((92, 244), "Example AG", font=font(23), fill=INK)
    d.text((92, 286), "Geneva, Switzerland", font=font(23), fill=MUTED)
    d.text((92, 330), "Applied on 2026-06-10", font=font(20), fill=MUTED)
    rounded(d, (92, 405, 272, 455), 6, BLUE)
    draw_centered(d, (92, 405, 272, 455), "READ", WHITE, 20, True)

    rounded(d, (620, 118, 1216, 660), 8, WHITE, LINE)
    d.text((648, 150), "Job-Room fields", font=font(26, True), fill=INK)
    rows = [
        ("Firma", "Example AG"),
        ("Stelle", "Senior Product Manager"),
        ("PLZ / Ort", "1201 Geneva"),
        ("Beworben am", "10.06.2026"),
        ("Bewerbungsart", "Elektronisch"),
        ("Pensum", "Vollzeit"),
        ("Resultat", "Noch offen"),
    ]
    y = 205
    for label, value in rows:
        d.text((650, y), label, font=font(17), fill=MUTED)
        rounded(d, (790, y - 9, 1178, y + 32), 5, (250, 252, 255), LINE)
        d.text((810, y), value, font=font(18), fill=INK)
        y += 54
    rounded(d, (648, 584, 862, 634), 6, GREEN)
    draw_centered(d, (648, 584, 862, 634), "PASTE ONLY", WHITE, 19, True)
    d.text((884, 599), "No automatic submission", font=font(18), fill=MUTED)
    img.save(path)


def make_promo(path: Path, size: tuple[int, int]) -> None:
    img = Image.new("RGB", size, BLUE)
    d = ImageDraw.Draw(img)
    w, h = size
    d.rounded_rectangle((w - h // 2, -h // 6, w + h // 4, h + h // 5), radius=h // 3, fill=(46, 111, 234))
    icon = make_icon(min(h - 70, 180)).convert("RGBA")
    img.paste(icon.convert("RGB"), (34, (h - icon.height) // 2), icon)
    d.text((icon.width + 58, h // 2 - 42), "JobRoom Helper", font=font(max(24, h // 9), True), fill=WHITE)
    d.text((icon.width + 58, h // 2 + 8), "Copy LinkedIn jobs into Job-Room", font=font(max(15, h // 20)), fill=(226, 235, 255))
    img.save(path)


def write_extension_icons() -> None:
    for base in [CHROME, SAFARI, SAFARI_RESOURCES]:
        icon_dir = base / "icons"
        ensure(icon_dir)
        for size in [16, 32, 48, 128]:
            make_icon(size).save(icon_dir / f"icon-{size}.png")


def write_asset_catalog_metadata(assets: Path) -> None:
    ensure(assets)
    (assets / "Contents.json").write_text(json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2) + "\n")

    accent = assets / "AccentColor.colorset"
    ensure(accent)
    (accent / "Contents.json").write_text(
        json.dumps({"colors": [{"idiom": "universal"}], "info": {"author": "xcode", "version": 1}}, indent=2) + "\n"
    )


def write_app_icon_catalog(assets: Path) -> None:
    write_asset_catalog_metadata(assets)
    appicon = assets / "AppIcon.appiconset"
    ensure(appicon)
    specs = [
        ("16x16", "1x", 16),
        ("16x16", "2x", 32),
        ("32x32", "1x", 32),
        ("32x32", "2x", 64),
        ("128x128", "1x", 128),
        ("128x128", "2x", 256),
        ("256x256", "1x", 256),
        ("256x256", "2x", 512),
        ("512x512", "1x", 512),
        ("512x512", "2x", 1024),
    ]
    images = []
    for logical, scale, pixels in specs:
        filename = f"app-icon-{pixels}.png"
        make_icon(pixels).save(appicon / filename)
        images.append({"idiom": "mac", "size": logical, "scale": scale, "filename": filename})
    (appicon / "Contents.json").write_text(json.dumps({"images": images, "info": {"author": "xcode", "version": 1}}, indent=2) + "\n")

    large = assets / "LargeIcon.imageset"
    ensure(large)
    large_specs = [("1x", 128), ("2x", 256), ("3x", 384)]
    large_images = []
    for scale, pixels in large_specs:
        filename = f"large-icon-{pixels}.png"
        make_icon(pixels).save(large / filename)
        large_images.append({"idiom": "universal", "scale": scale, "filename": filename})
    (large / "Contents.json").write_text(json.dumps({"images": large_images, "info": {"author": "xcode", "version": 1}}, indent=2) + "\n")


def write_ios_app_icon_catalog(assets: Path) -> None:
    write_asset_catalog_metadata(assets)
    appicon = assets / "AppIcon.appiconset"
    ensure(appicon)
    filename = "app-icon-1024.png"
    make_icon(1024).save(appicon / filename)
    images = [{"idiom": "universal", "platform": "ios", "size": "1024x1024", "filename": filename}]
    (appicon / "Contents.json").write_text(json.dumps({"images": images, "info": {"author": "xcode", "version": 1}}, indent=2) + "\n")


def write_safari_app_icons() -> None:
    write_app_icon_catalog(SAFARI_ASSETS)
    write_app_icon_catalog(MACOS_APP_ASSETS)
    write_ios_app_icon_catalog(IOS_APP_ASSETS)

    ensure(SAFARI_APP_RESOURCES)
    make_icon(256).save(SAFARI_APP_RESOURCES / "Icon.png")
    ensure(SHARED_APP_RESOURCES)
    make_icon(256).save(SHARED_APP_RESOURCES / "Icon.png")


def write_store_assets() -> None:
    chrome = STORE / "chrome"
    safari = STORE / "safari"
    ensure(chrome)
    ensure(safari)
    make_icon(128).save(chrome / "store-icon-128.png")
    make_icon(1024).save(safari / "app-icon-1024.png")
    make_screenshot(chrome / "screenshot-1280x800.png")
    shutil.copyfile(chrome / "screenshot-1280x800.png", safari / "screenshot-mac-1280x800.png")
    make_promo(chrome / "promo-small-440x280.png", (440, 280))
    make_promo(chrome / "promo-marquee-1400x560.png", (1400, 560))


def main() -> None:
    write_extension_icons()
    write_safari_app_icons()
    write_store_assets()
    print("Generated extension icons, Safari app icons, and store artwork.")


if __name__ == "__main__":
    main()
