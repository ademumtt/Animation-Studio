# Kurulum ayrıntıları (Mac + Windows)

Tüm komutlar proje klasöründen; motor komutları `_sistem/studio/` içinden. Önce kontrol et, sadece eksiği kur.

## Kontrol
```
node --version      # 20 veya üstü olmalı
uv --version
ffmpeg -version
ffprobe -version
```

## Mac
1. **Homebrew** (yoksa – `brew --version`): kişinin kendi Terminal'inde çalıştırması gerekir (şifre ister):
   `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
   Bittiğinde ekrandaki "Next steps" iki satırını da çalıştırmasını söyle (Apple çipte `/opt/homebrew/bin` PATH'e
   eklenir). Sonra senin kabuğunda: `eval "$(/opt/homebrew/bin/brew shellenv)"` (Intel: `/usr/local/bin/brew`).
2. `brew install node ffmpeg uv`
3. Xcode komut satırı araçları istenirse ("git/clang yok") → `xcode-select --install`, kişi pencerede "Yükle" der.

## Windows
1. `winget --version` (yoksa Microsoft Store → "Uygulama Yükleyici").
2. Eksik olanlar:
   ```
   winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
   winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
   winget install -e --id astral-sh.uv --accept-source-agreements --accept-package-agreements
   ```
   "Bu uygulama değişiklik yapsın mı?" → kişi "Evet" der.
3. Kurulan programlar açık kabukta hemen görünmez. PATH'i yenile (PowerShell):
   `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`
   Hâlâ yoksa: ffmpeg genelde `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin`, uv
   `%USERPROFILE%\.local\bin` ya da `%LOCALAPPDATA%\Microsoft\WinGet\Links`. Gerekirse kişiye "Claude uygulamasını
   kapatıp bu klasörü tekrar aç" de (yeni PATH ancak böyle gelir), sonra kaldığın yerden devam et.
4. NVIDIA kartı varsa (`nvidia-smi` çalışıyorsa) ses tanıma GPU'da çalışır; sürücü eskiyse sorun değil, CPU'ya düşer.

## Motor
```
cd _sistem/studio
npm ci            # package-lock'a göre; hata verirse: npm install
node scripts/kurulum_testi.mjs --video
```
- İlk render'da Remotion "Chrome Headless Shell" indirir (~100 MB) ve Google Fonts'tan yazı tiplerini çeker → internet şart.
- Test başarılı: `cikti/Kurulum Testi/test_kareler.jpg` (3 kare yan yana) + `test.mp4`. Kareye bakarak doğrula.

## Whisper'ı önceden indir (isteğe bağlı)
`_sistem/studio` içinde, kısa bir ses yokken modeli indirmek için:
```
uv run --with "faster-whisper>=1.1" python -c "from faster_whisper import WhisperModel; WhisperModel('large-v3-turbo', device='cpu', compute_type='int8')"
```
(NVIDIA'lı PC gerçek seste `large-v3`'ü ayrıca indirir.) İlk `uv run tools/hazirla.py` Python paketlerini de kurar
(birkaç dakika).

## Sorun giderme
| Belirti | Çözüm |
|---|---|
| `npm ci` "EBADPLATFORM" / lock hatası | `npm install` |
| `ffmpeg` bulunamıyor (Windows) | PATH'i yenile (yukarı) ya da tam yolla çağır; olmazsa uygulamayı yeniden açtır |
| Render "Could not find browser" | internet kontrolü; `npx remotion browser ensure` |
| Render çok yavaş / bilgisayar kilitleniyor | `render.mjs` içindeki `concurrency`'yi düşür (ör. 2) |
| Fontlar yüklenmedi (kare düz yazı tipi) | internet; tekrar dene |
| `uv run` CUDA/cudnn hatası (Windows) | sorun değil, `hazirla.py` otomatik CPU'ya geçer (daha yavaş) |
| Mac: "geliştirici doğrulanamadı" | Sistem Ayarları → Gizlilik ve Güvenlik → "Yine de aç" (kişi kendisi yapar) |
| Disk doldu | en az 8 GB boş alan gerekir |
