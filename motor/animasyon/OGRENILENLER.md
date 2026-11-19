# Animasyon videosu – öğrenme defteri

Her videodan sonra buraya yazılır. Yeni video HER ZAMAN buradaki "en iyi sürüm"den başlar, sıfırdan değil.
Kural: bir sonraki video en az bir önceki kadar iyi olmalı.

## En iyi sürüm (taban)
Henüz yok → başlangıç: skill'in `references/ornek_taslak.json`'u (motorun beğenilmiş dili: koyu/marka/krem temalar,
ortadan şekil geçişleri, kelimeye bağlı çizimler, 3B telefon sahneleri, güven çizimleri, logo parıltı + parçacık,
otomatik ses tasarımı). İlk beğenilen videodan sonra buraya o sürümün klasörünü yaz:
`surumler/<sürüm adı>/` (taslak.json + video.mp4 + kontak.jpg).

## Bu motorun beğenilen dili (koru, bozma)
- 3B telefon / uygulama sahneleri (`device`), garanti mührü, kalkan, logo parıltısı. Her videoda 1–2 `device` sahnesi düşün.
- Koyu sinematik zemin + marka degradesi + krem/açık sahneler arası şekilli geçiş (ring / wipe).
- Konuyu anlatan sade çizimler, söylenen kelimede hareket eder.
- İki satırlı kinetik yazı: ince küçük satır + kalın/serif büyük satır, kelime kelime.
- Serif italik vurgu, noktada marka vurgu rengi. Sakin, premium tempo; patlama/zıplama yok.

## Kurallar
- Önce elimizdekine bak (KATALOG.md); yoksa aynı dilde üret ve kataloğa ekle. Sürüm başına en fazla 2–3 yenilik.
- Akış: boyut sorusu → storyboard → açık onay → render + teslim. Düzeltme → yeni storyboard → onay.
- Geçişler ORTADAN: çıkan sahnenin ana nesnesinin merkezinden büyüyen daire (`ring`) ya da yuvarlak kare (`wipe`),
  ~0,73 sn; yeni sahne %93→%100 oturur. Düz `fade` yok.
- Nesne tek başına, 3B (ışık, gölge, kendi ekseninde dönüş). El, kol, vücut etkileşimi çizimi yok.
- Para = kağıt para (stilize banknot, rakamsız), jeton değil.
- Ses: sürekli hışırtı/hava yatağı yok, gerilim/riser yok; kısa vuruşlar (pop, tık, yumuşak vuruş).
- Storyboard'da da gerçek varlık: logo, çizim ve sahneler taklit edilmez; `--kare` çıktısı kullanılır.
- Fiyat/vaat sadece seste söylenen.

## Bilinen küçük kusurlar
- Çok kısa vuruş (<1 sn) geçiş süresinin yarısına denk gelir → kısa vurgu cümlelerini önceki vuruşa bağla ya da `block` kullan.
- Not satırı (`note`) küçük kalabilir → önemliyse `small`/`big`'e taşı.

## Sürüm geçmişi
| Sürüm | Tarih | Marka | Ne değişti | Kişinin yorumu |
|---|---|---|---|---|
