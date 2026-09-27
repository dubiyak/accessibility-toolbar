"""Inline the fonts into src/morph.src.html -> morph.html (one self-contained file)."""
import base64, pathlib

ROOT = pathlib.Path(__file__).parent
FONTS = [
    ("Geist", 400, "Geist-Regular.woff2", None),
    ("Geist", 500, "Geist-Medium.woff2", None),
    ("Geist", 600, "Geist-SemiBold.woff2", None),
    ("Heebo", 400, "heebo-hebrew-400-normal.woff2", "U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F"),
    ("Heebo", 500, "heebo-hebrew-500-normal.woff2", "U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F"),
    ("Heebo", 600, "heebo-hebrew-600-normal.woff2", "U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F"),
]

def main():
    faces = []
    for fam, wt, fn, rng in FONTS:
        b64 = base64.b64encode((ROOT / "fonts" / fn).read_bytes()).decode()
        r = f"unicode-range:{rng};" if rng else ""
        faces.append(f"@font-face{{font-family:'{fam}';font-weight:{wt};font-style:normal;font-display:block;{r}"
                     f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
    src = (ROOT / "src" / "morph.src.html").read_text()
    (ROOT / "morph.html").write_text(src.replace("/*@FONTS@*/", "\n".join(faces)))
    print("wrote", ROOT / "morph.html")

if __name__ == "__main__":
    main()
