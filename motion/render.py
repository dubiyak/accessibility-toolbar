"""Render morph.html with Playwright.

  python3 render.py beats [offset]   one frame per beat (+ contact sheet) for review
  python3 render.py times 1.2 3.4    arbitrary single frames
  python3 render.py full             60 fps x 4 subframes -> out/sub/%05d.png

Every frame is a fresh seek(t); nothing depends on the previous frame.
"""
import asyncio, os, subprocess, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out"
FPS, SUB, T = 60, 4, 14.0
SHUTTER = 0.5          # fraction of a frame the 4 subframes span (180 degrees)
WORKERS = int(os.environ.get("WORKERS", "6"))
CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"


async def open_page(pw):
    kw = {}
    if os.path.exists(CHROMIUM):
        kw["executable_path"] = CHROMIUM
    b = await pw.chromium.launch(**kw)
    p = await b.new_page(viewport={"width": 1440, "height": 1440}, device_scale_factor=1)
    await p.goto((ROOT / "morph.html").as_uri() + "?render=1")
    await p.wait_for_function("window.ready === true")
    return b, p


async def shoot(p, t, path):
    await p.evaluate(f"seek({t!r})")
    await p.locator("#frame").screenshot(path=str(path), animations="disabled", caret="initial")


async def render_list(jobs):
    async with async_playwright() as pw:
        pages = [await open_page(pw) for _ in range(min(WORKERS, len(jobs)))]

        async def worker(i):
            _, p = pages[i]
            for t, path in jobs[i::len(pages)]:
                await shoot(p, t, path)

        await asyncio.gather(*(worker(i) for i in range(len(pages))))
        for b, _ in pages:
            await b.close()


def main():
    mode = sys.argv[1]
    if mode == "beats":
        off = float(sys.argv[2]) if len(sys.argv) > 2 else 0.3
        d = OUT / "beats"; d.mkdir(parents=True, exist_ok=True)
        jobs = [(b * 0.5 + off, d / f"b{b:02d}.png") for b in range(28)]
        asyncio.run(render_list(jobs))
        ff = os.environ.get("FFMPEG", "ffmpeg")
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(d / "b%02d.png"),
                        "-vf", "scale=360:360,tile=7x4:padding=6:color=white", "-frames:v", "1",
                        str(OUT / f"beats_sheet_{off:.2f}.png")], check=True)
    elif mode == "times":
        d = OUT / "times"; d.mkdir(parents=True, exist_ok=True)
        jobs = [(float(x), d / f"t{float(x):06.3f}.png") for x in sys.argv[2:]]
        asyncio.run(render_list(jobs))
    elif mode == "full":
        d = OUT / "sub"; d.mkdir(parents=True, exist_ok=True)
        n = int(T * FPS)
        jobs = []
        for f in range(n):
            for s in range(SUB):
                o = ((s + 0.5) / SUB - 0.5) * SHUTTER
                path = d / f"{f * SUB + s:05d}.png"
                if not path.exists():
                    jobs.append(((f + o) / FPS, path))
        asyncio.run(render_list(jobs))
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
