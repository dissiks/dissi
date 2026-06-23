# yout — Your Life as Every Car Culture Rank

Everything for this YouTube video project is in this folder.

## Files

| File | Description |
|------|-------------|
| `your-life-as-every-car-culture-rank.html` | Production bible — 42 scenes, prompts, full script |
| `your-life-as-every-car-culture-rank.mp4` | Final 7-minute video (42 scenes × 10 sec) |
| `video-production/` | Build scripts, scenes data, and all assets |

## Video production folder

```
video-production/
├── build_video.py      # Rebuild the full video
├── scenes.json         # All 42 scenes + narration
├── README.md           # Build instructions
└── output/
    ├── your-life-as-every-car-culture-rank.mp4
    ├── frames/         # 42 PNG stills
    ├── audio/          # 42 narration MP3s
    └── clips/          # 42 video clips
```

## Rebuild video

```bash
cd yout/video-production
pip install pillow edge-tts
python3 build_video.py
```
