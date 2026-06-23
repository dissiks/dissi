#!/usr/bin/env python3
"""Build full 7-minute 2D cinematic POV video from scenes.json."""

import asyncio
import json
import math
import os
import random
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
SCENES_FILE = ROOT / "scenes.json"
OUT_DIR = ROOT / "output"
FRAMES_DIR = OUT_DIR / "frames"
AUDIO_DIR = OUT_DIR / "audio"
CLIPS_DIR = OUT_DIR / "clips"
FINAL_VIDEO = OUT_DIR / "your-life-as-every-car-culture-rank.mp4"

W, H = 1920, 1080
FPS = 30
SCENE_DURATION = 10.0
VOICE = "en-US-ChristopherNeural"
RATE = "+5%"

PATH_COLORS = {
    "all": (232, 93, 44),
    "mechanic": (74, 158, 255),
    "tuner": (232, 93, 44),
    "collector": (201, 162, 39),
}

PATH_LABELS = {
    "all": "ALL PATHS",
    "mechanic": "MECHANIC",
    "tuner": "TUNER",
    "collector": "COLLECTOR",
}


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def lerp(a, b, t):
    return int(a + (b - a) * t)


def gradient_bg(draw: ImageDraw.ImageDraw, top, bottom):
    for y in range(H):
        t = y / H
        color = (lerp(top[0], bottom[0], t), lerp(top[1], bottom[1], t), lerp(top[2], bottom[2], t))
        draw.line([(0, y), (W, y)], fill=color)


def add_grain(img: Image.Image, amount: int = 18) -> Image.Image:
    pixels = img.load()
    for _ in range((W * H) // 90):
        x = random.randint(0, W - 1)
        y = random.randint(0, H - 1)
        r, g, b = pixels[x, y][:3]
        n = random.randint(-amount, amount)
        pixels[x, y] = (
            max(0, min(255, r + n)),
            max(0, min(255, g + n)),
            max(0, min(255, b + n)),
        )
    return img


def add_vignette(img: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for i in range(20):
        alpha = int(110 * (i / 20) ** 2)
        margin_x = int(W * 0.025 * i)
        margin_y = int(H * 0.025 * i)
        x0, y0 = margin_x, margin_y
        x1, y1 = W - margin_x, H - margin_y
        if x1 <= x0 or y1 <= y0:
            break
        draw.rectangle([x0, y0, x1, y1], outline=(0, 0, 0, alpha), width=8)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def draw_car_side(draw, x, y, scale, color, style="sedan"):
    body_w = int(280 * scale)
    body_h = int(55 * scale)
    wheel_r = int(24 * scale)
    if style == "hatchback":
        points = [
            (x, y + body_h),
            (x + body_w * 0.15, y + body_h),
            (x + body_w * 0.22, y + body_h * 0.35),
            (x + body_w * 0.55, y + body_h * 0.2),
            (x + body_w * 0.78, y + body_h * 0.35),
            (x + body_w, y + body_h * 0.55),
            (x + body_w, y + body_h),
        ]
    elif style == "classic":
        points = [
            (x, y + body_h),
            (x + body_w * 0.1, y + body_h),
            (x + body_w * 0.18, y + body_h * 0.45),
            (x + body_w * 0.42, y + body_h * 0.15),
            (x + body_w * 0.72, y + body_h * 0.2),
            (x + body_w * 0.88, y + body_h * 0.45),
            (x + body_w, y + body_h * 0.6),
            (x + body_w, y + body_h),
        ]
    elif style == "sports":
        points = [
            (x, y + body_h),
            (x + body_w * 0.08, y + body_h),
            (x + body_w * 0.2, y + body_h * 0.5),
            (x + body_w * 0.45, y + body_h * 0.1),
            (x + body_w * 0.75, y + body_h * 0.25),
            (x + body_w, y + body_h * 0.55),
            (x + body_w, y + body_h),
        ]
    else:
        points = [
            (x, y + body_h),
            (x + body_w * 0.12, y + body_h),
            (x + body_w * 0.2, y + body_h * 0.4),
            (x + body_w * 0.5, y + body_h * 0.2),
            (x + body_w * 0.8, y + body_h * 0.35),
            (x + body_w, y + body_h * 0.55),
            (x + body_w, y + body_h),
        ]
    draw.polygon(points, fill=color, outline=(20, 20, 24))
    draw.ellipse([x + body_w * 0.18 - wheel_r, y + body_h - wheel_r, x + body_w * 0.18 + wheel_r, y + body_h + wheel_r], fill=(22, 22, 26), outline=(50, 50, 55))
    draw.ellipse([x + body_w * 0.72 - wheel_r, y + body_h - wheel_r, x + body_w * 0.72 + wheel_r, y + body_h + wheel_r], fill=(22, 22, 26), outline=(50, 50, 55))


def draw_garage(draw, accent):
    draw.rectangle([120, 420, W - 120, H - 80], fill=(28, 28, 34), outline=(45, 45, 52), width=4)
    draw.rectangle([120, 120, W - 120, 200], fill=(35, 35, 42))
    for i in range(6):
        lx = 180 + i * 280
        draw.rectangle([lx, 130, lx + 8, 190], fill=(200, 200, 180, 120))
    draw.line([(120, 420), (W - 120, 420)], fill=accent, width=3)


def draw_figure(draw, x, y, scale, color):
    s = scale
    draw.ellipse([x - 18*s, y - 55*s, x + 18*s, y - 20*s], fill=color)
    draw.rectangle([x - 22*s, y - 20*s, x + 22*s, y + 45*s], fill=color)
    draw.line([(x - 22*s, y), (x - 40*s, y + 35*s)], fill=color, width=int(8*s))
    draw.line([(x + 22*s, y), (x + 40*s, y + 35*s)], fill=color, width=int(8*s))


def scene_palette(path: str, num: int):
    accent = PATH_COLORS[path]
    if path == "mechanic":
        return (12, 16, 24), (20, 28, 42), accent
    if path == "tuner":
        return (18, 10, 8), (36, 18, 12), accent
    if path == "collector":
        return (16, 14, 8), (32, 26, 14), accent
    return (10, 10, 12), (22, 18, 16), accent


def draw_scene_visual(draw, scene):
    n = scene["num"]
    path = scene["path"]
    accent = PATH_COLORS[path]

    if n == 1 or n == 42:
        draw.rectangle([680, 80, 1240, 520], fill=(180, 30, 30))
        draw.polygon([(700, 520), (900, 300), (1100, 280), (1220, 520)], fill=(200, 40, 40), outline=(30, 30, 30))
        draw.text((760, 140), "F40", fill=(255, 220, 200), font=load_font(72, True))
    elif n == 2:
        draw.rectangle([300, 250, 1500, 850], fill=(40, 42, 48))
        for i in range(5):
            draw_car_side(draw, 380 + i * 180, 620 - i * 20, 0.45, (100 + i * 15, 100 + i * 10, 110), "sports")
    elif n == 3:
        draw.rectangle([80, 300, 600, 900], fill=(30, 30, 36))
        draw.rectangle([660, 300, 1180, 900], fill=(34, 30, 26))
        draw.rectangle([1240, 300, 1840, 900], fill=(26, 30, 38))
        draw_garage(draw, accent)
        draw_car_side(draw, 200, 700, 0.55, (120, 120, 125), "hatchback")
        draw.rectangle([760, 650, 1080, 820], fill=(90, 60, 35), outline=(60, 40, 25))
        draw_car_side(draw, 1380, 700, 0.5, accent, "sedan")
    elif n == 5:
        draw_car_side(draw, 260, 620, 0.8, PATH_COLORS["mechanic"], "sedan")
        draw_car_side(draw, 760, 600, 0.85, PATH_COLORS["tuner"], "hatchback")
        draw_car_side(draw, 1260, 610, 0.82, PATH_COLORS["collector"], "classic")
    elif n in (6, 7, 13, 14, 23, 28, 33, 37, 40):
        draw_garage(draw, accent)
        draw_car_side(draw, 500, 700, 0.9, (90, 95, 105), "sedan")
        draw_figure(draw, 300 if n != 7 else 1050, 760, 1.2 if n < 20 else 1.4, (200, 200, 210))
        if n == 14:
            draw.ellipse([850, 760, 1050, 900], fill=(50, 50, 55), outline=accent, width=4)
        if n == 33:
            draw.rectangle([1180, 500, 1500, 700], fill=(10, 30, 50), outline=accent, width=3)
            for i in range(20):
                x = 1200 + i * 14
                y = 620 + math.sin(i * 0.6) * 40
                draw.line([(x, 620), (x, y)], fill=accent, width=2)
    elif n in (4, 8, 9, 15, 16, 19, 20, 24, 25, 31, 32, 36, 38):
        draw_garage(draw, accent)
        style = "hatchback" if n < 19 else "sports"
        color = (130, 60, 50) if n < 19 else (60, 80, 120)
        draw_car_side(draw, 620, 690, 1.0, color, style)
        if n == 16:
            draw_car_side(draw, 250, 720, 0.7, (80, 80, 90), "hatchback")
            draw_car_side(draw, 1150, 715, 0.75, accent, "sports")
        if n == 20:
            for i, label in enumerate(["TURBO", "FUEL", "INTERCOOLER"]):
                draw.rectangle([350 + i * 380, 350, 620 + i * 380, 430], outline=accent, width=3)
                draw.text((380 + i * 380, 365), label, fill=accent, font=load_font(28, True))
        if n == 25:
            draw.rectangle([1180, 420, 1600, 760], fill=(12, 18, 28), outline=accent, width=3)
            draw.text((1240, 540), "500 HP", fill=accent, font=load_font(54, True))
        if n == 38:
            draw.rectangle([0, 780, W, H], fill=(210, 180, 140))
            draw_car_side(draw, 700, 700, 1.1, (40, 40, 48), "sports")
    elif n in (10, 11, 12, 17, 18, 21, 22, 26, 27, 29, 30, 34, 35, 39):
        if n in (21, 41):
            for i in range(8):
                draw.ellipse([200 + i * 90, 500 - i * 15, 260 + i * 90, 560 - i * 15], fill=(160 + i * 8, 90 + i * 5, 30))
        draw_car_side(draw, 620, 700, 1.0, (150, 40, 35) if n < 20 else (170, 170, 175), "classic" if n not in (12,) else "hatchback")
        if n == 10 or n == 11:
            draw_figure(draw, 400, 760, 1.0, (210, 200, 190))
            draw_figure(draw, 1050, 760, 1.15, (180, 180, 190))
        if n == 35 or n == 39:
            draw.polygon([(300, 820), (500, 500), (1500, 500), (1700, 820)], fill=(40, 80, 50))
            draw.rectangle([900, 430, 1020, 560], fill=PATH_COLORS["collector"], outline=(255, 240, 200))
    else:
        draw_car_side(draw, 620, 700, 1.0, accent, "sports")


def render_frame(scene) -> Image.Image:
    path = scene["path"]
    top, bottom, accent = scene_palette(path, scene["num"])
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    gradient_bg(draw, top, bottom)
    draw_scene_visual(draw, scene)

  # UI overlay
    title_font = load_font(62, True)
    small_font = load_font(28)
    label_font = load_font(22, True)
    num_font = load_font(120, True)

    draw.text((80, 60), f"{scene['num']:02d}", fill=accent, font=num_font)
    draw.rectangle([80, 200, 260, 236], fill=accent)
    draw.text((95, 206), PATH_LABELS[path], fill=(10, 10, 12), font=label_font)
    draw.text((80, 260), scene["title"].upper(), fill=(235, 232, 228), font=title_font)

    bar_w = int(W * (scene["num"] / 42))
    draw.rectangle([0, H - 8, bar_w, H], fill=accent)

    img = add_grain(img)
    img = add_vignette(img)
    return img


def run(cmd, **kwargs):
    print(">", " ".join(cmd) if isinstance(cmd, list) else cmd)
    subprocess.run(cmd, check=True, **kwargs)


async def generate_audio(scene, out_path: Path):
    import edge_tts

    communicate = edge_tts.Communicate(scene["narration"], VOICE, rate=RATE)
    await communicate.save(str(out_path))


def audio_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def build_scene_clip(scene, frame_path: Path, audio_path: Path, clip_path: Path):
    duration = SCENE_DURATION
    aud_dur = audio_duration(audio_path)
    atempo = 1.0
    if aud_dur > duration - 0.15:
        atempo = min(1.35, aud_dur / (duration - 0.2))

    vf = (
        f"scale=1920:1080:force_original_aspect_ratio=increase,"
        f"crop=1920:1080,"
        f"zoompan=z='min(zoom+0.0008,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"d={int(duration * FPS)}:s=1920x1080:fps={FPS}"
    )

    af = f"atempo={atempo}" if atempo > 1.01 else "anull"
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(frame_path),
        "-i", str(audio_path),
        "-filter_complex", f"[0:v]{vf},format=yuv420p[v];[1:a]{af},apad,atrim=0:{duration}[a]",
        "-map", "[v]", "-map", "[a]",
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        str(clip_path),
    ]
    run(cmd)


def concat_clips(clip_paths, output_path: Path):
    list_file = OUT_DIR / "concat.txt"
    with list_file.open("w") as f:
        for p in clip_paths:
            f.write(f"file '{p.resolve()}'\n")
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c", "copy", str(output_path),
    ])


async def main():
    for d in (OUT_DIR, FRAMES_DIR, AUDIO_DIR, CLIPS_DIR):
        d.mkdir(parents=True, exist_ok=True)

    scenes = json.loads(SCENES_FILE.read_text())
    print(f"Building {len(scenes)} scenes...")

    clip_paths = []
    for scene in scenes:
        n = scene["num"]
        frame_path = FRAMES_DIR / f"scene_{n:02d}.png"
        audio_path = AUDIO_DIR / f"scene_{n:02d}.mp3"
        clip_path = CLIPS_DIR / f"scene_{n:02d}.mp4"

        print(f"[{n:02d}/42] Frame + audio + clip: {scene['title']}")
        render_frame(scene).save(frame_path, "PNG")

        if not audio_path.exists() or audio_path.stat().st_size == 0:
            await generate_audio(scene, audio_path)

        build_scene_clip(scene, frame_path, audio_path, clip_path)
        clip_paths.append(clip_path)

    print("Concatenating final video...")
    concat_clips(clip_paths, FINAL_VIDEO)

    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(FINAL_VIDEO)],
        capture_output=True,
        text=True,
        check=True,
    )
    print(f"\nDone! {FINAL_VIDEO}")
    print(f"Duration: {float(result.stdout.strip()):.1f}s")


if __name__ == "__main__":
    asyncio.run(main())
