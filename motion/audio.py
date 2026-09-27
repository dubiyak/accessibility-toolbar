"""Beat-grid the song with numpy, cut 7 bars from a downbeat, lay UI sounds on their peaks.

  python3 audio.py path/to/song.mp3      -> out/audio.wav, out/audio_report.json
  python3 audio.py                       -> UI sounds only (no song)

1. Onset envelope = spectral flux (log-magnitude STFT).
2. Tempo + phase: comb search 110-130 BPM scoring onset strength on the grid.
3. Downbeat: of the 4 beat phases, the one carrying the most low-band (kick) flux.
4. Start: the downbeat whose 7-bar window loops best (the bar after the cut
   sounds like the first bar) and sits in the full-energy part of the song.
5. Time-stretch to exactly 120.000 BPM, 40 ms equal-power seam crossfade.
6. Every UI sound is placed so its measured peak lands on its event time.
"""
import json, subprocess, sys, pathlib
import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out"
SR = 44100
BPM, BARS = 120.0, 7
LOOP = BARS * 4 * 60 / BPM          # 14.0 s


def load(path, sr=SR, ch=2, af=None):
    cmd = [FF, "-v", "error", "-i", str(path)]
    if af:
        cmd += ["-af", af]
    cmd += ["-f", "f32le", "-ac", str(ch), "-ar", str(sr), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()


def save(path, x, sr=SR):
    x = np.clip(x, -1, 1)
    p = subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ac", str(x.shape[1]), "-ar", str(sr),
                        "-i", "-", "-c:a", "pcm_s16le", str(path)], input=x.astype(np.float32).tobytes())
    p.check_returncode()


# ---------------- analysis ----------------
HOP, NFFT = 256, 2048


def stft_mag(x):
    win = np.hanning(NFFT).astype(np.float32)
    n = 1 + (len(x) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(n)[:, None]
    return np.abs(np.fft.rfft(x[idx] * win, axis=1))


def onset_env(mono):
    M = np.log1p(100 * stft_mag(mono))
    flux = np.maximum(0, np.diff(M, axis=0))
    freqs = np.fft.rfftfreq(NFFT, 1 / SR)
    full = flux.sum(1)
    low = flux[:, freqs < 150].sum(1)
    # a flux frame fires once the leading part of the window reaches the onset;
    # calibrated on synthetic clicks: frame start + 0.79 * NFFT
    t = (np.arange(len(full)) + 1) * HOP / SR + 0.79 * NFFT / SR
    g = np.exp(-0.5 * (np.arange(-6, 7) * HOP / SR / 0.008) ** 2)    # 8 ms smoothing so the comb can't slip past spikes
    g /= g.sum()
    norm = lambda e: (lambda f: (f - f.mean()) / (f.std() + 1e-9))(np.convolve(e, g, mode="same"))
    return t, norm(full), norm(low), M


def track_beats(t, env):
    """Comb search: period and phase maximising interpolated onset strength on the grid."""
    dur = t[-1]
    best = (-1e9, None, None)
    for bpm in np.arange(110, 130.001, 0.02):
        per = 60 / bpm
        grid0 = np.arange(0, dur - 1, per)
        for ph in np.arange(0, per, 0.004):
            g = grid0 + ph
            g = g[g < t[-1]]
            sc = np.interp(g, t, env).mean()
            if sc > best[0]:
                best = (sc, bpm, ph)
    return best[1], best[2]


def refine(t, env, bpm, ph):
    per = 60 / bpm
    best = (-1e9, bpm, ph)
    for b in np.arange(bpm - 0.03, bpm + 0.03001, 0.002):
        p2 = 60 / b
        for q in np.arange(ph - 0.01, ph + 0.01001, 0.0005):
            g = np.arange(q, t[-1], p2)
            sc = np.interp(g, t, env).mean()
            if sc > best[0]:
                best = (sc, b, q)
    return best[1], best[2]


def analyse(mono):
    t, full, low, M = onset_env(mono)
    # beats are where the kick is: off-beat hats must not win the phase
    drive = full + 2 * low
    bpm, ph = track_beats(t, drive)
    bpm, ph = refine(t, drive, bpm, ph)
    per = 60 / bpm
    beats = np.arange(ph, t[-1], per)
    # downbeat phase: most low-band flux
    lowb = np.interp(beats, t, low)
    k = int(np.argmax([lowb[i::4].mean() for i in range(4)]))
    downbeats = beats[k::4]
    return bpm, beats, downbeats, (t, full, low, M)


def choose_start(mono, bpm, downbeats, feats):
    t, full, low, M = feats
    per_bar = 4 * 60 / bpm
    span = BARS * per_bar
    M = M[1:]                       # align frames with the flux timeline
    frames = lambda a, b: M[(t >= a) & (t < b)]
    rms_all = np.sqrt(np.mean(mono ** 2))
    best = None
    for s in downbeats:
        if s < 1.0 or s + span + per_bar > t[-1]:
            continue
        a = frames(s, s + per_bar).mean(0)
        b = frames(s + span, s + span + per_bar).mean(0)
        seam = float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))
        seg = mono[int(s * SR):int((s + span) * SR)]
        level = float(np.sqrt(np.mean(seg ** 2)) / (rms_all + 1e-9))
        # bars inside should be uniformly loud: no breakdowns or fades in the loop
        bars = [np.sqrt(np.mean(mono[int((s + i * per_bar) * SR):int((s + (i + 1) * per_bar) * SR)] ** 2)) for i in range(BARS)]
        even = float(min(bars) / (max(bars) + 1e-9))
        score = seam * 2 + min(level, 1.3) + even
        if best is None or score > best[0]:
            best = (score, float(s), seam, level, even)
    return best


# ---------------- UI sounds ----------------
def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def tone(f, dur, tau, amp=1.0, sweep=None):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    fr = f if sweep is None else f * (sweep / f) ** (tt / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    a = np.minimum(1, tt / 0.0015)
    return np.sin(ph) * env_exp(n, tau) * a * amp


def noise(dur, tau, lo, hi, seed):
    n = int(dur * SR)
    r = np.random.default_rng(seed).standard_normal(n)
    F = np.fft.rfft(r)
    f = np.fft.rfftfreq(n, 1 / SR)
    F[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(F, n)
    x /= np.abs(x).max() + 1e-9
    return x * env_exp(n, tau) * np.minimum(1, np.arange(n) / (0.001 * SR))


def sfx(kind):
    if kind == "click":
        return 0.55 * noise(0.05, 0.004, 1800, 9000, 1) + 0.5 * tone(2400, 0.05, 0.006)
    if kind == "soft":
        return 0.35 * noise(0.05, 0.005, 800, 5000, 2) + 0.35 * tone(1400, 0.05, 0.008)
    if kind == "tick":
        return 0.45 * tone(3200, 0.03, 0.004)
    if kind == "pop":
        return 0.6 * tone(900, 0.09, 0.02, sweep=420)
    if kind == "whoosh":
        n = noise(0.28, 0.2, 300, 3000, 3)
        n *= np.sin(np.linspace(0, np.pi, len(n))) ** 2
        return 0.35 * n
    if kind == "chime":
        return 0.28 * tone(1318.5, 0.5, 0.12) + 0.22 * tone(1975.5, 0.5, 0.09)
    if kind == "key":
        return 0.4 * noise(0.04, 0.003, 1200, 7000, 4) + 0.2 * tone(1800, 0.04, 0.005)
    if kind == "enter":
        return 0.5 * noise(0.06, 0.006, 600, 5000, 5) + 0.35 * tone(1100, 0.06, 0.012)
    if kind == "toggle":
        return 0.45 * tone(1500, 0.08, 0.012) + 0.4 * noise(0.08, 0.004, 1500, 8000, 6)
    if kind == "stretch":
        return 0.3 * tone(300, 0.3, 0.08, sweep=520)
    raise KeyError(kind)


# (time on the beat grid, sound) - mirrors the timeline in src/morph.src.html
EVENTS = [
    (0.0, "click"), (0.5, "tick"), (1.0, "tick"), (1.5, "chime"),
    (2.0, "pop"), (2.5, "click"), (3.0, "click"), (3.5, "soft"), (4.0, "tick"),
    (4.5, "soft"), (5.0, "soft"), (5.5, "stretch"), (6.0, "soft"), (6.5, "pop"),
    (7.0, "toggle"), (7.5, "pop"), (8.0, "click"), (8.5, "click"), (9.0, "whoosh"),
    (9.5, "tick"), (10.0, "tick"), (10.5, "pop"), (11.0, "click"),
    (11.5, "key"), (11.625, "key"), (11.75, "key"), (11.875, "key"), (12.0, "key"),
    (12.5, "enter"), (13.0, "chime"), (13.5, "pop"),
]


def peak_offset(x):
    """Index of the measured peak of a sound's amplitude envelope (1 ms smoothing)."""
    k = max(1, int(0.001 * SR))
    e = np.convolve(np.abs(x), np.ones(k) / k, mode="same")
    return int(np.argmax(e))


def lay_sfx(n):
    bus = np.zeros(n)
    placed = []
    for t, kind in EVENTS:
        x = sfx(kind)
        pk = peak_offset(x)
        start = int(round(t * SR)) - pk
        for s0 in (start, start + n, start - n):            # wrap around the loop seam
            a, b = max(0, s0), min(n, s0 + len(x))
            if a < b:
                bus[a:b] += x[a - s0:b - s0]
        placed.append({"t": t, "kind": kind, "peak_ms": round(pk / SR * 1000, 2)})
    return bus, placed


# ---------------- main ----------------
def main():
    OUT.mkdir(exist_ok=True)
    if len(sys.argv) < 2:                      # no song yet: UI sounds alone, same grid
        n = int(round(LOOP * SR))
        fx, placed = lay_sfx(n)
        fx *= 0.5 / (np.abs(fx).max() + 1e-9)
        save(OUT / "audio.wav", np.stack([fx, fx], 1))
        (OUT / "audio_report.json").write_text(json.dumps({"song": None, "sfx": placed}, indent=1))
        print("no song given: wrote UI sounds only")
        return
    song = sys.argv[1]
    st = load(song)
    mono = st.mean(1)
    bpm, beats, downbeats, feats = analyse(mono)
    score, start, seam, level, even = choose_start(mono, bpm, downbeats, feats)
    ratio = BPM / bpm                # atempo speed factor; source seconds per output second
    # cut a little more than 7 bars (+ seam tail) at the song's tempo, stretch to 120.000
    tail = 0.04
    need = (LOOP + tail + 0.2) * ratio
    af = f"atrim=start={start:.6f}:duration={need:.6f},asetpts=PTS-STARTPTS"
    if abs(ratio - 1) > 1e-4:
        af += f",atempo={ratio:.6f}"
    seg = load(song, af=af)
    n = int(round(LOOP * SR))
    nt = int(tail * SR)
    body, cont = seg[:n].copy(), seg[n:n + nt]
    # the loop's end flows into the song's own continuation, which fades into bar 1
    w = np.sin(np.linspace(0, np.pi / 2, nt))[:, None]
    body[:nt] = body[:nt] * w + cont * np.cos(np.linspace(0, np.pi / 2, nt))[:, None]
    body /= np.abs(body).max() + 1e-9
    body *= 10 ** (-1.5 / 20)

    fx, placed = lay_sfx(n)
    fx *= 10 ** (-9 / 20)
    mix = body + fx[:, None]
    peak = np.abs(mix).max()
    if peak > 0.98:
        mix *= 0.98 / peak
    save(OUT / "audio.wav", mix)

    # verify: the rendered loop's beats sit on k * 0.5 s
    chk = np.concatenate([body.mean(1)] * 3)
    t, full, low, _ = onset_env(chk.astype(np.float32))
    b2, p2 = refine(t, full + 2 * low, 120.0, 0.0)
    kicks = []
    for k in range(1, 3 * 28):
        m = (t > k * 0.5 - 0.06) & (t < k * 0.5 + 0.06)
        if m.any():
            kicks.append(t[m][np.argmax((full + 2 * low)[m])] - k * 0.5)
    kicks = np.array(kicks) * 1000
    report = {
        "song": str(song), "measured_bpm": round(bpm, 3), "stretch_ratio": round(ratio, 5),
        "start_downbeat_s": round(start, 4), "seam_similarity": round(seam, 3),
        "level_vs_song": round(level, 3), "bar_evenness": round(even, 3),
        "loop_check_bpm": round(b2, 3), "loop_check_phase_ms": round(((p2 + 0.25) % 0.5 - 0.25) * 1000, 2),
        "beat_error_ms_median": round(float(np.median(np.abs(kicks))), 2), "beat_error_ms_max": round(float(np.abs(kicks).max()), 2),
        "sfx": placed,
    }
    (OUT / "audio_report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    print(json.dumps({k: v for k, v in report.items() if k != "sfx"}, indent=1))


if __name__ == "__main__":
    main()
