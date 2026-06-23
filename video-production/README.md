# Video Production — Your Life as Every Car Culture Rank

## Final Video
- **File:** `output/your-life-as-every-car-culture-rank.mp4`
- **Duration:** 7:00 (42 scenes × 10 seconds)
- **Resolution:** 1920×1080 · H.264 · AAC

## Rebuild
```bash
pip install pillow edge-tts
python3 build_video.py
```

## Pipeline
1. Generates 42 custom 2D cinematic frames (Pillow)
2. Generates narration per scene (Edge TTS — Christopher Neural voice)
3. Creates 10-second clips with Ken Burns zoom (ffmpeg)
4. Concatenates into final 7-minute video

## Assets
- `scenes.json` — all 42 scenes with narration
- `output/frames/` — PNG stills per scene
- `output/audio/` — MP3 narration per scene
- `output/clips/` — individual 10s video clips
