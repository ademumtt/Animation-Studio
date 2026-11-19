# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Ses efekti mikseri (Animasyon Studyosu, sifirdan yazildi).

Efektleri zaman cizelgesine yerlestirir, tek bir stereo WAV yazar ve her efektin hedef ana ne kadar
oturdugunu raporlar. scripts/ses_tasarim.mjs bunu otomatik cagirir.

Kullanim (_sistem/studio icinden):
  uv run tools/sfx_mix.py cues.json cikti.wav --lib ../ses [--lib baska/klasor] [--events olaylar.json] [--len 15.1]

cues.json: liste. Her eleman:
  "at": saniye  (ya da "event": olaylar.json'daki ad, + istege bagli "offset")
  "file": kutuphanedeki dosya adinin bir parcasi (buyuk/kucuk harf fark etmez)
  "db": seviye (dBFS, orn -24)       "align": "peak" (varsayilan) | "start"  - hangi noktasi hedef ana gelsin
  "pitch": hiz/ton carpani (1 = ayni) "lp" / "hp": alcak / yuksek geciren filtre (Hz)
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt

RATE = 48000
EXTS = (".wav", ".mp3", ".flac", ".aif", ".aiff", ".ogg")


def library(folders):
    found = []
    for root in folders:
        for d, _, names in os.walk(root):
            found += [os.path.join(d, n) for n in sorted(names) if n.lower().endswith(EXTS) and not n.startswith(".")]
    return found


def decode(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(RATE), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    peak = np.abs(x).max()
    return x / peak if peak > 0 else x


def resample(x, factor):
    """factor > 1: daha hizli ve ince; < 1: daha yavas ve kalin (dogrusal ara deger)."""
    if abs(factor - 1.0) < 1e-4:
        return x
    pos = np.arange(0, len(x) - 1, factor)
    lo = pos.astype(int)
    w = (pos - lo)[:, None]
    return x[lo] * (1 - w) + x[lo + 1] * w


def band(x, hz, kind):
    return sosfilt(butter(2, min(hz, RATE / 2 - 100) / (RATE / 2), btype=kind, output="sos"), x, axis=0)


def loudness_curve(x):
    win = max(1, int(RATE * 0.008))
    return np.convolve(np.abs(x).max(axis=1), np.ones(win) / win, mode="same")


def anchor(x, mode):
    c = loudness_curve(x)
    if mode == "start":
        above = np.nonzero(c > c.max() * 0.1)[0]
        return int(above[0]) if len(above) else 0
    return int(np.argmax(c))


def main():
    ap = argparse.ArgumentParser(description="Ses efekti mikseri")
    ap.add_argument("cues")
    ap.add_argument("out")
    ap.add_argument("--lib", action="append", required=True)
    ap.add_argument("--events")
    ap.add_argument("--len", type=float)
    args = ap.parse_args()

    files = library(args.lib)
    events = {}
    if args.events:
        events = {e["name"]: e["t"] for e in json.load(open(args.events, encoding="utf-8"))}
    cues = json.load(open(args.cues, encoding="utf-8"))

    def target(c):
        if "event" in c:
            if c["event"] not in events:
                sys.exit(f'olay bulunamadi: {c["event"]}')
            return events[c["event"]] + c.get("offset", 0)
        return c["at"] + c.get("offset", 0)

    length = args.len or events.get("end") or (max((target(c) for c in cues), default=0) + 2)
    total = int(length * RATE)
    bus = np.zeros((total + RATE * 3, 2))
    cache, report = {}, []

    for c in cues:
        key = c["file"].lower()
        match = next((f for f in files if key in os.path.basename(f).lower()), None)
        if match is None:
            sys.exit(f'efekt bulunamadi: "{c["file"]}" (kutuphane: {", ".join(args.lib)})')
        if match not in cache:
            cache[match] = decode(match)
        snd = resample(cache[match], c.get("pitch", 1.0))
        if c.get("lp"):
            snd = band(snd, c["lp"], "lowpass")
        if c.get("hp"):
            snd = band(snd, c["hp"], "highpass")
        snd = snd * (10 ** (c.get("db", -24) / 20))
        ref = anchor(snd, c.get("align", "peak"))
        t = target(c)
        start = int(round(t * RATE)) - ref
        if start < 0:
            snd, ref, start = snd[-start:], ref + start, 0
        n = min(len(snd), len(bus) - start)
        if n <= 0:
            continue
        bus[start:start + n] += snd[:n]
        report.append((t, (start + ref) / RATE, os.path.basename(match)))

    bus = bus[:total]
    fade = min(total, int(0.5 * RATE))
    if fade:
        bus[-fade:] *= np.linspace(1, 0, fade)[:, None]
    ceiling = 10 ** (-1.0 / 20)
    peak = np.abs(bus).max()
    if peak > ceiling:
        bus *= ceiling / peak
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(RATE), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", args.out],
                   input=bus.astype(np.float32).tobytes(), check=True)

    worst = 0.0
    for t, real, name in sorted(report):
        err = (real - t) * 1000
        worst = max(worst, abs(err))
        print(f"{t:7.3f}s  {err:+6.1f} ms  {name}")
    print(f"sync: {len(report)} cues, worst offset {worst:.1f} ms (1 kare 30 fps = 33.3 ms)   peak {20 * np.log10(np.abs(bus).max() + 1e-12):.1f} dBFS")


if __name__ == "__main__":
    main()
