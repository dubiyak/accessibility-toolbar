"""Seam check: seek(14) must equal seek(0) pixel for pixel, and the cursor must keep its speed."""
import asyncio, io, pathlib
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"


async def main():
    async with async_playwright() as pw:
        kw = {"executable_path": CHROMIUM} if pathlib.Path(CHROMIUM).exists() else {}
        b = await pw.chromium.launch(**kw)
        p = await b.new_page(viewport={"width": 1440, "height": 1440})
        await p.goto(pathlib.Path(__file__).with_name("morph.html").resolve().as_uri() + "?render=1")
        await p.wait_for_function("window.ready===true")

        async def shot(t):
            await p.evaluate(f"seek({t})")
            return np.array(Image.open(io.BytesIO(await p.locator("#frame").screenshot()))).astype(int)

        for a, bb in [(0, 14), (1 / 240, 14 + 1 / 240), (13.99, -0.01)]:
            print(f"seek({a:.4f}) vs seek({bb:.4f}) max pixel diff:", np.abs(await shot(a) - await shot(bb)).max())
        v = await p.evaluate("""() => {
          const pos = t => { seek(t); const m = document.getElementById('cursor').style.transform.match(/translate\\(([-\\d.]+)px, ([-\\d.]+)px/); return [+m[1], +m[2]]; };
          const vel = t => { const a = pos(t - 0.002), b = pos(t + 0.002); return [(b[0]-a[0])/0.004, (b[1]-a[1])/0.004].map(x => +x.toFixed(2)); };
          return { before_seam: vel(13.998), after_seam: vel(0.002), pos_end: pos(14), pos_start: pos(0) };
        }""")
        print("cursor px/s", v)
        await b.close()

asyncio.run(main())
