# Shape morph: 7 bars at 120 BPM

One element (`#shape`) morphs through 28 beats: button → loader → check → island → player (play/pause) → scrub → volume (stretches past max) → toggle → liquid tabs → chart + tooltip → ⌘K → type → enter → toast → button. All text is Hebrew and laid out right to left, in Geist with a Heebo fallback for Hebrew.

- `src/morph.src.html` is the timeline. Every style is computed inside `seek(t)` from closed-form spring step responses. Each change of target adds one spring, so every value is a pure function of time. Tracks are periodic, so `seek(14) === seek(0)`.
- `build.py` inlines the fonts and writes `morph.html`, one self-contained 1440×1440 file. Open it to preview; add `?t=3.2` to freeze at a given time.
- `render.py beats [offset]` renders one frame per beat plus a contact sheet. `render.py full` renders 840 frames × 4 subframes.
- `mux.sh` blends the subframes with ffmpeg `tmix` (180° shutter), outputs 60 fps and adds `out/audio.wav`.
- `audio.py song.mp3` finds the beat grid with numpy and starts on a downbeat. It chooses the 7 bars that loop best, stretches them to 120.000 BPM, crossfades the seam over 40 ms, and places each UI sound by its measured peak. With no argument it writes the UI sounds alone.
- `loopcheck.py` checks that seek(0) and seek(14) are pixel-identical and that the cursor has the same position and speed at the seam.

```
python3 build.py && WORKERS=8 python3 render.py full && python3 audio.py song.mp3 && ./mux.sh
```
Fonts: Geist and Heebo, both under the SIL OFL (licenses in `fonts/`).
