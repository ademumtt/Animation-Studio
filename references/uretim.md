# ÜRETİM – ses kaydından animasyon reklamı

Komutlar `_sistem/studio/` içinden. Kişinin klasörleri: `sesler/<Marka>/` (ses), `marka/<Marka>/` (logo),
`cikti/<Marka>/` (teslim). Marka kartı: `_sistem/kurgu/<Marka>/marka.json`.

## 0. Önce oku
1. `_sistem/animasyon/OGRENILENLER.md` – kurallar, kişinin beğendikleri, kusurlar, sürüm geçmişi (kişinin kendi defteri).
2. `_sistem/animasyon/KATALOG.md` – elimizdeki çizimler, telefon ekranları, 3B nesneler, temalar, geçişler.
3. Başlangıç taslağı: kişinin en iyi sürümü (`_sistem/animasyon/surumler/<en iyi>/taslak.json`), yoksa bu skill'in
   `references/ornek_taslak.json`'u (hazır, beğenilmiş dil). **Asla sıfırdan tasarlama**; bunun üstüne kur.
Stil değişimi sadece kişi açıkça isterse.

## Akış (değişmez)
1. **İlk soru:** "Video 9:16 (Reels/Story) mı, 4:5 (akış) mı, ikisi mi?" – cevaba göre teslim.
2. Ses → hazırla → otomatik taslak → gözden geçir → **storyboard (gerçek karelerle)** → kişi AÇIKÇA onaylar →
   sormadan render + ses + teslim → kısa not iste.
3. Düzeltme gelirse: yeni storyboard → tekrar onay. Onay olmadan render alma, video gönderme.
4. Eksik bilgi (marka kartı vb.) varsa makul varsayımla doldur ve storyboard'da belirt; gereksiz soru sorma.

## 1. Ses ve marka
- Ses `sesler/<Marka>/` içinde olmalı (kişi başka yerden verdiyse oraya kopyala). Dosya adı = klip adı (ör. "Seslendirme 1").
- `uv run tools/hazirla.py "<Marka>"` → sesi siyah mp4'e çevirir, -14 LUFS, Whisper ile kelime zamanları
  (`public/jobs/<slug>/transkript.json`, `kelimeler.txt`). Logo `marka/<Marka>/` → `public/jobs/<slug>/marka/`.
- Transkripti oku: Whisper hatalarını taslağın `fix` alanıyla düzelt ("4000" → "4.000", yanlış duyulan marka adı).
- `marka.json` yoksa `_sistem/kurgu/_ORNEK_marka.json`'dan oluştur: `accent` koyu marka rengi (kart zemini),
  `highlight` açık vurgu (koyu zeminde yazı), `dark` buton, `tint` zemin ışığı, `sektor` (kuafor | genel | …),
  `cta.kanal` (whatsapp | telefon | adres | web). Siyah zeminli logo → `"kapanisTema": "night"`.
  Logonun beyaz zemini varsa: `uv run tools/ikon_temizle.py <girdi> <çıktı.png>`.
- **Sonu önce tasarla:** izleyici ne yapacak (WhatsApp'tan yaz, ara, gel)? Kapanış buna göre.

## 2. Taslak
- `node scripts/taslak.mjs "<Marka>" "<klip>" "../kurgu/<Marka>/<ad>.json"` → cümle/vuruş bölme, liste → `seq`,
  sayı → etiket, çizim seçimi, temalar, ortadan geçişler, kapanış.
- Çıktıyı başlangıç taslağının diliyle düzelt: small/big satır bölmesi, çizim seçimi, 1–2 adet `device` (3B telefon)
  sahnesi, uygun yerde `obj` (3B hediye / takvim). Bir reklam tek yolculuk anlatır: 5–10 vuruş, cümle başına bir vuruş,
  ilk saniyede kanca (koyu `night` tema).
- Film katmanında `"gecisSesi": false` kalsın (ses efektleri 5b'de eklenir).
- **Fiyat/vaat sadece seste söylenen.** Söylenmeyen rakam, garanti, sahte istatistik ya da yorum ekrana konmaz
  (Meta reklam incelemesi + tüketici mevzuatı).
- Katalogda karşılığı olmayan, sık geçen bir kavram için aynı çizim dilinde yeni `Art` çizilebilir
  (`src/components/Art.tsx`) → `taslak.mjs` ARTS tablosuna ve `KATALOG.md`'ye ekle. Sürüm başına en fazla 2–3 yenilik.

## 3. Motion kuralları
- Her sahne bir sonrakine dönüşür: geçiş çıkan sahnenin ana nesnesinin merkezinden büyür (`ring` daire / `wipe`
  yuvarlak kare). Düz `fade` yok.
- Önemli şey tam ortada; kapanış logosu görünür sınırına göre ortalı, son sahnede kamera kayması yok.
- Her an bir şey hareket eder; ölü kare yok. Yön aniden dönmez. Önce hızlı, sonra uzun yavaş (expo-out).
- Yazı kısa satır, kelime kelime; zıplama / ölçek patlaması yok. Gradyan yazı sadece koyu zeminde.
- Nesneler tek başına ve 3B (el, kol, vücut çizimi yok – absürt görünür). Para = kağıt para (`refund`), jeton değil.
- Koyu marka rengi video üstünde yazı rengi olmaz → `highlight` kullan.
- WhatsApp geçiyorsa logo `ortak/whatsapp.png` (`buttonIcon`), emoji değil.

## 4. Storyboard → onay
```
node scripts/kurgu.mjs "../kurgu/<Marka>/<ad>.json" "../kurgu/<Marka>/<ad>.is.json"
node scripts/render.mjs "../kurgu/<Marka>/<ad>.is.json" --kare 1.2,3.4,... "../kurgu/<Marka>/kare"
```
- `kurgu.mjs` UYARI verirse (açıkta kalan siyah kare vb.) düzelt, uyarı varken devam etme.
- Kare saniyeleri: her vuruşun büyük satırı oturduktan sonrası + 3–4 geçiş anı. Kareleri kendin incele (taşma,
  boş kare, ortalama, logo), sorun varsa düzelt.
- Kişiye göster: kareleri tek görselde birleştir (dosyaları sırayla `-i` ile verip
  `-filter_complex "xstack=..."` ya da 4'erli `hstack` + `vstack`) ve numaralı tablo:
  zaman · seslendirme cümlesi · ekranda ne olur · sonraki sahneye geçiş.
  Görseli gösterebiliyorsan göster; gösteremiyorsan dosyanın yerini söyle. Logo/çizim taklit edilmez, gerçek kare.
- Sor: "Onaylıyor musun, yoksa değiştirmek istediğin bir sahne var mı?"

## 5. Render (onaydan sonra, sormadan)
```
node scripts/render.mjs "../kurgu/<Marka>/<ad>.is.json" "../kurgu/<Marka>/<ad>.mp4"
node scripts/ses_tasarim.mjs "../kurgu/<Marka>/<ad>.is.json" "../kurgu/<Marka>/<ad>.mp4" "../kurgu/<Marka>/<ad>_sesli.mp4"
```
- Kişiye süreyi söyle (ekran kartsız/Mac'te 30 sn'lik video 10–20 dk sürebilir); render'ı arka planda çalıştır.
- Kontrol: kare sayısı = süre × 30; ses ≈ -14 LUFS (`ffmpeg -i x.mp4 -af loudnorm=print_format=summary -f null -`);
  kontak sayfası `ffmpeg -i x.mp4 -vf "fps=2,scale=270:-1,tile=8x7" -frames:v 1 kontak.jpg` ile ölü kare/taşma yok.
- Ses efektleri kısa vuruşlardır (pop, tık, yumuşak vuruş); sürekli hışırtı ve gerilim sesi yok.

## 6. Teslim ve öğrenme
```
node scripts/teslim.mjs "<is.json>" "<video>_sesli.mp4" "<Marka>" "Animasyon Reklam" <kapak sn> "v1 - <kısa ad> (<tarih>)" <9x16|4x5|ikisi>
```
→ `cikti/<Marka>/REKLAM HAZIR/Animasyon Reklam.mp4` + kapak + `_sistem/animasyon/surumler/<sürüm>/`.
Aynı markada sonrakiler: "Animasyon Reklam 2", "3"…
- `cikti/<Marka>/REKLAM HAZIR/REKLAM METINLERI.md`: Instagram açıklaması (sadece seste söylenenler), başlık, buton önerisi.
- `_sistem/animasyon/OGRENILENLER.md`'ye sürüm satırı; kişiden 1–3 kısa not iste ("neyi beğendin, neyi
  değiştirelim?"), gelince deftere işle. Beğendiği sürüm "en iyi sürüm" olur; sonraki video onun üstüne kurulur.
- Kişiye videonun yerini söyle (gönderme aracın varsa gönder).
