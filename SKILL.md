---
name: animasyon-studyosu
description: Sadece bir ses kaydından (m4a/mp3/wav) kelimelere oturan premium reklam animasyonu videosu üretir (Remotion motoru, 3B telefon sahneleri, çizimler, otomatik ses efektleri). "animasyon-studyosu.skill dosyasını kur", "kur", "bu sese animasyon videosu yap", "ses kaydından reklam", "animasyon reklam", "güncelle" dendiğinde kullan. Kurulmamışsa önce kurar ve kişiyi adım adım yönlendirir.
---

# Animasyon Stüdyosu – ses kaydından reklam animasyonu

Karşındaki kişi büyük ihtimalle teknik bilmiyor (işletme sahibi, sosyal medya yöneticisi, içerik üreticisi).
Sen hem **kurulumu yapan teknisyen** hem **yol gösteren rehbersin**:
- Sade Türkçe konuş, jargon kullanma ("bağımlılık" değil "gerekli programlar"). Tek seferde tek şey iste.
- Her adımdan önce ne yapacağını bir cümleyle söyle, sonra "✓ … tamam" diye bildir.
- İzin penceresi, şifre ya da Windows onayı gelecekse ÖNCEDEN haber ver ve ne yapacağını söyle.
- Hata olursa korkutma: ne olduğunu bir cümleyle anlat, kendin çöz; çözemezsen ne yapması gerektiğini söyle.
- Kişinin şifresini, kart bilgisini asla isteme ve yazma. Şifreyi sadece kişi kendisi, kendi penceresine yazar.

## Hangi moddasın?
Proje klasörü = Claude Code'un açık olduğu klasör (`.skill` dosyasının durduğu yer).
- `_sistem/studio/node_modules` YOK → **KURULUM** (aşağıda). Kişi "kur" dese de demese de önce bu.
- Var, kişi ses / video istiyor → **ÜRETİM**: `references/uretim.md`'yi oku ve uygula.
- Kişi "güncelle" diyor ve elinde yeni bir `.skill` var → **GÜNCELLEME** (en altta).

## KURULUM
Ayrıntılı komutlar ve sorun giderme: `references/kurulum.md` (Mac ve Windows ayrı). Akış:

**0. Karşıla (kısa).** Örnek:
> "Merhaba! Ben bu klasörü bir animasyon stüdyosuna çevireceğim. Sen sadece ses kaydını vereceksin, ben sana
> paylaşıma hazır reklam animasyonu çıkaracağım. Kurulum 10–20 dakika sürer, çoğu bekleme. Arada birkaç kez
> 'izin ver' demen gerekecek, ben her seferinde söyleyeceğim. Başlıyorum."

**1. Paketi yerleştir.** (Kendin yap, kişiye anlatma.)
- **Paket bu klasörün kendisiyse** (GitHub'dan "Download ZIP" ile indirilmiş: kökte `SKILL.md` + `motor/` var):
  zip açma adımını atla; `SKILL.md`, `LISANS.md`, `references/`, `motor/`'u `<proje>/.claude/skills/animasyon-studyosu/`
  altına KOPYALA, aşağıdaki gibi `motor/`'u `_sistem/`'e kur. (Klasör adı "-main" ile bitse de sorun değil.)
- Yoksa: `.skill` dosyası bir zip'tir. Proje klasöründe `animasyon-studyosu.skill`'i geçici bir klasöre aç
  (Mac: `unzip`, Windows: `tar -xf`). İçinden `animasyon-studyosu/` çıkar.
- O klasörü `<proje>/.claude/skills/animasyon-studyosu/` olarak kopyala (sonraki oturumlarda skill hazır olsun).
- `animasyon-studyosu/motor/` içeriğini `<proje>/_sistem/` altına kopyala → `_sistem/studio`, `_sistem/ses`,
  `_sistem/kurgu`, `_sistem/animasyon` oluşur. `motor/proje_CLAUDE.md` → `<proje>/CLAUDE.md` (varsa üzerine yazma, sonuna ekle).
- Kişinin klasörlerini oluştur: `sesler/`, `marka/`, `cikti/`.

**2. Bilgisayarı tanı.** İşletim sistemi (Mac / Windows), Mac'te Apple çip mi Intel mi, NVIDIA ekran kartı var mı
(Windows: `nvidia-smi`), boş disk alanı (en az 8 GB). Kişiye tek cümleyle söyle:
> "Mac (Apple çip) görüyorum, ekran kartı hızlandırması yok ama sorun değil; videolar biraz daha uzun sürer."

**3. Gerekli programlar.** Node.js (20+), uv (Python), ffmpeg. Hangisi eksikse kur (`references/kurulum.md`).
Mac'te Homebrew yoksa önce o: kurulum Mac şifresini ister →
> "Birazdan terminalde Mac şifren istenecek. Yazarken ekranda hiçbir şey görünmez, bu normal. Yazıp Enter'a bas."
Homebrew kurulumu etkileşimli olduğu için onu kişinin kendi Terminal'inde çalıştırmasını iste (komutu kopyalanabilir
ver), bitince "tamam" demesini bekle. Windows'ta `winget` ile kur; "değişiklik yapsın mı?" penceresine "Evet" dedirt.
Yeni kurulan program bulunamazsa PATH'i yenile ya da tam yolunu kullan.

**4. Motoru hazırla.** `_sistem/studio` içinde `npm ci` (olmazsa `npm install`) → ~1 GB indirir, birkaç dakika:
> "Animasyon motorunu indiriyorum (yaklaşık 1 GB). İnternet hızına göre 2–10 dakika."

**5. Test.** `_sistem/studio` içinde `node scripts/kurulum_testi.mjs --video` (ilk render'da Remotion kendi
tarayıcısını ve fontları indirir). Sonra `cikti/Kurulum Testi/test_kareler.jpg` karesine bakıp gerçekten sahne
çizildiğini doğrula (boş/siyah değil). Kişiye videonun yerini söyle (dosya göndermeye aracın varsa gönder).

**6. Ses tanıma.** Konuşmayı yazıya döken Whisper modeli (1,5–3 GB) ilk gerçek seste otomatik iner. Vakit varsa
şimdi indir (`references/kurulum.md` → "Whisper'ı önceden indir"); yoksa kişiye "ilk videoda ses tanıma modeli
iner, o video biraz uzun sürer" de.

**7. Marka tanışması.** Sor (tek mesajda, kısa):
> "Son olarak markanı tanıyayım: 1) Marka adı? 2) Logon var mı? Varsa `marka/<Marka adı>/` klasörüne at.
> 3) Müşteri seni nasıl bulsun: WhatsApp, telefon, adres, web? 4) Hangi sektördesin?"
Cevapla `_sistem/kurgu/<Marka>/marka.json`'u `_sistem/kurgu/_ORNEK_marka.json`'dan doldur (renkler logodan; logo
yoksa marka renklerini sor ya da şık bir varsayılan seç ve söyle). Logo `public/jobs/<slug>/marka/` altına
`hazirla.py` ile kopyalanır.

**8. Bitiş ve kullanım dersi.**
> "Kurulum tamam ✓ Bundan sonra yapman gereken tek şey:
> 1. Ses kaydını (telefonun ses kaydedicisi yeterli) `sesler/<Marka adı>/` klasörüne at.
> 2. Bana 'bu sese animasyon videosu yap' yaz.
> Ben önce sana sahne sahne bir storyboard göstereceğim; onaylarsan videoyu çıkarırım."
Ekle: "Bu klasörü bir dahaki sefere Claude Code'da açtığında her şey hazır olacak." Skill yeni eklendiği için bu
oturumda görünmeyebilir: o durumda da sorun yok, `references/uretim.md`'yi doğrudan okuyup devam et.

**Önemli bilgiler (kurulum sonunda bir kez, kısa):**
- Claude kullanımı aboneliğinden düşer; bir animasyon videosu epey kullanım harcar. Limit dolarsa birkaç saat sonra
  devam edilir.
- Remotion (motorun altyapısı) bireyler ve 3 kişiye kadar şirketler için ücretsizdir; daha büyük şirketler
  remotion.pro'dan lisans almalıdır.

## GÜNCELLEME
Yeni `.skill` geldiğinde: aç, `.claude/skills/animasyon-studyosu/`'yu değiştir; `motor/studio/{src,scripts,tools}`,
`package.json`, `package-lock.json`'ı `_sistem/studio/`'ya kopyala, sonra `npm ci`. **Dokunma:** `_sistem/studio/public/jobs`,
`_sistem/kurgu/<Marka>/`, `_sistem/animasyon/OGRENILENLER.md` ve `surumler/` (kişinin kendi geçmişi), `sesler/`,
`marka/`, `cikti/`. Sonra `node scripts/kurulum_testi.mjs` ile kontrol et.
