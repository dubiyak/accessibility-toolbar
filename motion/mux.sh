#!/usr/bin/env bash
# 4 subframes per frame -> tmix motion blur -> 60 fps, muxed with out/audio.wav if present.
set -euo pipefail
cd "$(dirname "$0")"
FF=${FFMPEG:-$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
VF="tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\,4)\,3)',setpts=N/(60*TB),format=yuv420p"
AUDIO=()
[ -f out/audio.wav ] && AUDIO=(-i out/audio.wav -c:a aac -b:a 256k -shortest)
"$FF" -y -loglevel error -framerate 240 -i out/sub/%05d.png "${AUDIO[@]:0:2}" \
  -vf "$VF" -r 60 -c:v libx264 -preset slow -crf 14 -tune animation -movflags +faststart \
  "${AUDIO[@]:2}" out/morph.mp4
echo "wrote out/morph.mp4"
