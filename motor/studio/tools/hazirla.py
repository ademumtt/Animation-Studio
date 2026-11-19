"""Bir musterinin klasorunu Remotion'a hazirlar.

Kullanim:  uv run tools/hazirla.py "Ornek Marka"   (studio klasorunden)

Yaptiklari:
  1. videolar/<musteri>/* -> public/jobs/<slug>/src/*.mp4  (1080x1920, 30fps, H.264, ses temizleme + -14 LUFS)
  2. B-Roll/<musteri>/*   -> public/jobs/<slug>/broll/*
  3. marka/<musteri>/*    -> public/jobs/<slug>/marka/*
  4. _sistem/ses/*        -> public/sfx/*
  5. Kelime zamanli Turkce transkript -> public/jobs/<slug>/transkript.json
"""
# /// script
# requires-python = ">=3.11"
# dependencies = ["faster-whisper>=1.1", "nvidia-cublas-cu12; sys_platform != 'darwin'", "nvidia-cudnn-cu12==9.*; sys_platform != 'darwin'"]
# ///
import json, os, re, shutil, subprocess, sys, unicodedata
from concurrent.futures import ThreadPoolExecutor

# Klasor duzeni: video\ (kullanicinin klasorleri) + video\_sistem\ (studio, ses, refereans, ortak, kurgu, arsiv)
STUDIO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SISTEM = os.path.dirname(STUDIO)
ROOT = os.path.dirname(SISTEM)
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm"}
AUDIO_EXT = {".m4a", ".mp3", ".wav", ".aac", ".ogg", ".opus", ".flac"}  # sadece ses -> animasyonlu anlatim
IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
# hafif gurultu temizleme + kompresor + sosyal medya ses seviyesi
AF = "highpass=f=80,afftdn=nf=-28,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=7"


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.replace("ı", "i").replace("İ", "I")).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,color_transfer:stream_side_data=rotation",
         "-show_entries", "format=duration", "-of", "json", path], capture_output=True, text=True).stdout
    return json.loads(out)


def transcode(src, dst, has_audio=True):
    if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src):
        return dst
    info = probe(src)
    st = (info.get("streams") or [{}])[0]
    hdr = st.get("color_transfer") in ("arib-std-b67", "smpte2084")
    vf = []
    if hdr:  # iPhone HDR -> SDR ton esleme (yoksa soluk/patlak renk olur)
        vf.append("zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv")
    # yuksek cozunurluk korunur: yakin plan zoom'larinda netlik kaybolmasin
    w, h = (1728, 3072) if min(st.get("width", 0), st.get("height", 0)) >= 1440 else (1080, 1920)
    vf.append(f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,crop={w}:{h},fps=30,format=yuv420p")
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", ",".join(vf),
           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-g", "15", "-movflags", "+faststart"]
    cmd += ["-af", AF, "-ar", "48000", "-c:a", "aac", "-b:a", "256k"] if has_audio else ["-an"]
    subprocess.run(cmd + [dst], check=True)
    return dst


def transcode_audio(src, dst):
    """Sadece ses kaydi (animasyonlu anlatim): siyah 1080x1920 goruntulu mp4'e cevrilir, boylece kurgu/render
    akisi ayni kalir. Siyah goruntu hicbir karede gorunmemeli - tamami tam ekran sahnelerle kaplanir."""
    if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src):
        return dst
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30", "-i", src,
           "-map", "0:v", "-map", "1:a", "-shortest", "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-g", "15",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-af", AF, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", dst]
    subprocess.run(cmd, check=True)
    return dst


def has_audio(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return bool(out.strip())


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout.strip())


def add_cuda_dlls():
    try:
        import nvidia.cublas, nvidia.cudnn  # noqa
        for mod in (nvidia.cublas, nvidia.cudnn):
            for p in mod.__path__:
                b = os.path.join(p, "bin")
                if os.path.isdir(b):
                    os.add_dll_directory(b)
                    os.environ["PATH"] = b + os.pathsep + os.environ["PATH"]
    except Exception as e:  # noqa
        print("CUDA kutuphaneleri bulunamadi:", e)


def load_model():
    from faster_whisper import WhisperModel
    add_cuda_dlls()
    try:
        m = WhisperModel("large-v3", device="cuda", compute_type="float16")
        print("Whisper large-v3 (GPU)")
        return m
    except Exception as e:
        print("GPU olmadi, CPU'ya geciliyor:", str(e)[:200])
        return WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")


def load_audio(path):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def transcribe(model, path, prompt):
    segs, _ = model.transcribe(load_audio(path), language="tr", word_timestamps=True, vad_filter=True, beam_size=5,
                               initial_prompt=prompt, condition_on_previous_text=False)
    words, text = [], []
    for s in segs:
        text.append(s.text.strip())
        for w in s.words or []:
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 2)})
    return {"text": " ".join(text), "words": words}


def main():
    musteri = sys.argv[1]
    s = slug(musteri)
    job = os.path.join(STUDIO, "public", "jobs", s)
    for d in ("src", "broll", "marka"):
        os.makedirs(os.path.join(job, d), exist_ok=True)

    # ses efektleri
    sfx = os.path.join(STUDIO, "public", "sfx")
    os.makedirs(sfx, exist_ok=True)
    for f in os.listdir(os.path.join(SISTEM, "ses")):
        # alt klasorler (orn. sentez/ - ses_tasarim.mjs dogrudan oradan okur) kopyalanmaz
        if os.path.isdir(os.path.join(SISTEM, "ses", f)):
            continue
        if not os.path.exists(os.path.join(sfx, f)):
            shutil.copy2(os.path.join(SISTEM, "ses", f), sfx)

    # marka
    mdir = os.path.join(ROOT, "marka", musteri)
    if os.path.isdir(mdir):
        for f in os.listdir(mdir):
            src_f = os.path.join(mdir, f)
            dst_f = os.path.join(job, "marka", slug(os.path.splitext(f)[0]) + os.path.splitext(f)[1].lower())
            # islenmis (zemini temizlenmis vb.) dosyanin uzerine ham kopya yazma
            if os.path.exists(dst_f) and os.path.getmtime(dst_f) >= os.path.getmtime(src_f):
                continue
            shutil.copy2(src_f, dst_f)

    # videolar + b-roll
    tasks = []
    for folder, sub in (("videolar", "src"), ("sesler", "src"), ("B-Roll", "broll")):
        d = os.path.join(ROOT, folder, musteri)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            stem, ext = os.path.splitext(f)
            p = os.path.join(d, f)
            if ext.lower() in VIDEO_EXT:
                tasks.append((p, os.path.join(job, sub, stem + ".mp4"), sub == "src" or has_audio(p)))
            elif ext.lower() in AUDIO_EXT and sub == "src":
                tasks.append((p, os.path.join(job, sub, stem + ".mp4"), "ses"))
            elif ext.lower() in IMG_EXT:
                shutil.copy2(p, os.path.join(job, sub, f))
    with ThreadPoolExecutor(3) as ex:
        for r in ex.map(lambda a: transcode_audio(a[0], a[1]) if a[2] == "ses" else transcode(*a), tasks):
            print("hazir:", os.path.relpath(r, job), flush=True)

    # transkript
    tpath = os.path.join(job, "transkript.json")
    data = json.load(open(tpath, encoding="utf-8")) if os.path.exists(tpath) else {}
    todo = [f for f in sorted(os.listdir(os.path.join(job, "src"))) if f.endswith(".mp4") and os.path.splitext(f)[0] not in data]
    if todo:
        model = load_model()
        prompt = f"{musteri} reklam videosu. Türkçe konuşma."
        for f in todo:
            p = os.path.join(job, "src", f)
            r = transcribe(model, p, prompt)
            r["duration"] = round(duration(p), 3)
            data[os.path.splitext(f)[0]] = r
            print(f"[{f}] {r['text']}", flush=True)
            json.dump(data, open(tpath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # sureklilik olcumu (yuz/renk/ses) - kurgu.mjs bunu otomatik kullanir
    subprocess.run(["uv", "run", os.path.join(STUDIO, "tools", "olc.py"), job], check=True)
    # numarali kelime listesi (kurgu taslagi yazarken kullanilir)
    kl = subprocess.run(["node", os.path.join(STUDIO, "scripts", "kurgu.mjs"), "kelimeler", job], capture_output=True, text=True, encoding="utf-8").stdout
    open(os.path.join(job, "kelimeler.txt"), "w", encoding="utf-8").write(kl)
    broll = sorted(os.listdir(os.path.join(job, "broll")))
    print("\nB-ROLL:", ", ".join(broll) if broll else "(yok)")
    print("JOB:", job)
    print("SLUG:", s)


if __name__ == "__main__":
    main()
