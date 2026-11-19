"""Her klip icin sureklilik olcumu: yuz konumu/boyutu, ortalama renk, ses seviyesi/tonu.

Kullanim: uv run tools/olc.py <job-klasoru>     -> <job>/olcum.json
Kurgu bu degerlerle her cekimi ayni kadraja, ayni renge ve ayni ses seviyesine getirir.
"""
# /// script
# requires-python = ">=3.11"
# dependencies = ["opencv-python-headless==4.10.0.84", "numpy<2.3"]
# ///
import json, os, subprocess, sys
import cv2
import numpy as np

job = sys.argv[1]
src = os.path.join(job, "src")
casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
res = {}


def frames(path, n=9):
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout)
    out = []
    for k in range(n):
        t = dur * (k + 0.5) / n
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", path, "-frames:v", "1", "-vf", "scale=576:1024", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                             capture_output=True).stdout
        if len(raw) == 576 * 1024 * 3:
            out.append(np.frombuffer(raw, np.uint8).reshape(1024, 576, 3))
    return out


def audio_stats(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "astats=metadata=0:reset=0,ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    lufs = None
    for line in r.splitlines():
        if line.strip().startswith("I:"):
            lufs = float(line.split()[1])
    # spektral denge: 300 Hz alti / 3 kHz ustu enerji orani (oda/mikrofon farkini gosterir)
    def band(f):
        o = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", f + ",volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
        for line in o.splitlines():
            if "mean_volume" in line:
                return float(line.split(":")[1].split()[0])
    return {"lufs": lufs, "low": band("lowpass=f=300"), "high": band("highpass=f=3000")}


for f in sorted(os.listdir(src)):
    if not f.endswith(".mp4"):
        continue
    p = os.path.join(src, f)
    fr = frames(p)
    faces = []
    for im in fr:
        g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
        det = casc.detectMultiScale(g, 1.08, 6, minSize=(24, 24))
        if len(det):
            x, y, w, h = max(det, key=lambda d: d[2] * d[3])
            faces.append(((x + w / 2) / 576, (y + h / 2) / 1024, h / 1024))
    face = [round(float(v), 4) for v in np.median(np.array(faces), axis=0)] if faces else None
    # renk: tum karenin ortalamasi (BGR->RGB) ve parlaklik
    mean = np.mean([im.reshape(-1, 3).mean(0) for im in fr], axis=0)[::-1]
    res[os.path.splitext(f)[0]] = {
        "face": face,  # [x, y, yukseklik] 0..1
        "faceN": len(faces),
        "rgb": [round(float(v), 1) for v in mean],
        "audio": audio_stats(p),
    }
    print(f, res[os.path.splitext(f)[0]], flush=True)

json.dump(res, open(os.path.join(job, "olcum.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

