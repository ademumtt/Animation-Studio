# Animasyon kataloğu – elimizde ne var

Video yapmadan ÖNCE buraya bakılır. Yeni bir parça çizildiğinde buraya eklenir (tek satır).

## 1. Motor (`_sistem/studio/src/components`)
| Parça | Ne yapar | Nerede |
|---|---|---|
| `film` katmanı | Sadece ses kaydı → tam ekran sinematik anlatım, vuruş (beat) dizisi | Film.tsx |
| Temalar | `night` koyu + marka ışığı · `brand` marka degradesi · `light` krem · `glow` koyu + vurgu ışığı | Film.tsx |
| Geçişler | `ring` çizimin merkezinden büyüyen daire · `wipe` merkezden yuvarlak kare · `cut` | Film.tsx |
| Boş kare koruması | sahne, sonraki şekil onu örtene kadar kalır | Film.tsx |
| `block` | büyük satır tek blok girer ("1 ay boyunca") | Film.tsx |
| Marka tonu | `brand.tint` → zemin ışıkları marka renginde | Film.tsx |
| Koyu kapanış | `kapanisTema: "night"`: siyah zeminli logo karışır, buton vurgu renginde; `logoW` logo genişliği | Film.tsx |
| Kinetik yazı | `small` + `big`, `serif`/`italic`, `bigFirst`, `seq` (kelime yerinde değişir), `count` (sayaç), `strikeAt` (üstü çizilir), `note` | Film.tsx |
| Kapanış | `logo` (yoksa `big` = marka adı) + `button` + `buttonIcon` (`ortak/whatsapp.png`) | Film.tsx |
| Süsler (`deco`) | `grid` nokta ızgara · `plus` · `arcs` · `ribbon` · `frame` · `think` | Film.tsx / Derinlik.tsx |
| Logo kapanışı | logo inince parlama + marka renkli parçacık + ışık süpürmesi (otomatik) | Film.tsx |

## 2. Anlam çizimleri (`art: "<ad>"`, Art.tsx)
| Ad | Görsel | Uygun söz |
|---|---|---|
| percent | yüzde rozeti, parıltı | indirim, yüzde |
| clock | kadran, yelkovan hızlanıp durur | saat, dakika, hızlı, süre |
| pin | konum pini düşer, halka yayılır | adres, konum, şube |
| phone | telefon titrer, arama dalgaları | arayın, telefon, numara |
| star | 5 yıldız sırayla dolar | yorum, memnuniyet, kalite |
| check | 3 satırlık liste, tikler sırayla | güven, adımlar, süreç |
| heart | kalp çizilir, dolar, atar | sevgi, mutluluk, güzel |
| people | 30 kişilik ızgara sırayla dolar | müşteri, danışan, takipçi |
| post | sosyal medya gönderisi: seq 0 hazırlanıyor, seq 1 "Yayında" + kalpler | reklam, paylaşım, içerik |
| chat | WhatsApp telefon ekranı, mesajlar (başlık = marka adı) | yazın, mesaj, iletişim |
| gift | hediye kutusu açılır (3B için `obj: {kind: "gift"}` tercih et) | hediye, ücretsiz |
| tag | fiyat etiketi | fiyat, değer |
| coin | madeni para (üstü çizilebilir) | ücret, ödeme (para anlatımında `refund` tercih) |
| refund | 4 kağıt para yelpaze → kıvrılarak cüzdana, iade oku, "İADE ✓" rozeti | iade, paranız geri |
| calendar | takvim, günler dolar | ay, tarih, kampanya süresi |
| guarantee | belge yazılır, "GARANTİ" mührü iner | garanti, söz, taahhüt |
| shield | kalkan çizilir, tik + halkalar | risk yok, güvence, koruma |
| voice | ses dalgası → video kartı + oynat, k1'de tik rozeti | sesten video, ses kaydı |
| folder | klasör açılır, ".skill" dosyası içine düşer, kapanır, tik | klasöre at, dosya, yükle |
| appWindow | uygulama penceresi: `artAt`'ta "Code" sekmesi seçilir, sonra klasör; k1'de "dosyayı kur" yazılır, "Kuruluyor…" | uygulamada aç, yaz, komut |
| **Kuaför / güzellik** (`marka.json` → `"sektor": "kuafor"` ise otomatik seçilir) | | |
| hair3d | 3B ışıklı portre, hacimli saç, ombre akışı | kuaför, saç, renk |
| scissorsSpin | dönen 3B krom makas, havada 3 kesme | makas, kesim |
| frayed · bond · lock · strand · hair | yıpranmış tel · bağ onarımı · saç tutamı (4 teknik rengi) · tek tel · 2D baş | yıpranma, onarım, boya teknikleri |
Kullanma: `scissorsHand`, `scissors3d` (el/kesim görüntüsü absürt görünüyor), `refundCoin` (jeton).
Seçim otomatik: `scripts/taslak.mjs` ARTS tablosu (anahtar kelime → çizim). Yeni çizim → buraya + ARTS'a ekle.

## 2b. 3B telefon / uygulama sahneleri (`beat.device`, Device.tsx)
Kamera: `fly` (aşağıdan uçarak gelir), `tilt` (yavaş eğim), `orbit` (yörünge). Koyu zeminde otomatik kenar ışığı.
| Ekran | Ne gösterir | Uygun söz |
|---|---|---|
| `ui: "notif"` + `items` | kilit ekranı, bildirimler söylendiği anda düşer | randevu / sipariş / mesaj geliyor |
| `ui: "stats"` (+ `value`, `label`) | panel: sayaç, çizilen grafik, yükselen çubuklar | müşteri/satış artışı, sonuç |
| `ui: "stats"` + `hideValue` | sayaç yerine yukarı ok (seste rakam yoksa) | sonuç, büyüme |
| `ui: "feed"` | Instagram profili: takipçi sayacı, ızgara, kaydırma | sosyal medya, takipçi |
| `ui: "booking"` | randevu listesi, saatler sırayla "Dolu ✓" | dolu takvim, yoğunluk |
| `ui: "booking", empty: true` | tüm saatler "Boş", sayaç | boş saat, müşteri yok |
| `ui: "search"` + `query` | arama yazılır, rakipler listelenir, "Sizin işletmeniz yok" kartı | bulunamıyor, görünmüyorsun |
| `ui: "ads"` + `zeroAt` | "Harcanan ₺" artar, "Yeni müşteri 0" kalır | reklama para harcıyorsun, sonuç yok |
| `screen: "<yol>"` + `scroll` | gerçek ekran görüntüsü, yavaş kaydırma | uygulama tanıtımı (görüntü verilirse) |
| `video: "<yol>"` | telefonda sessiz video (ekran kaydı) | tanıtım |
| `pops` | ekrandan fırlayan kartlar (`title`, `sub`, `side: l|r`) | özellik listesi, fayda |
| `taps` | dokunma halkası (saniye listesi) | "tıklayın", "seçin" |
Örnek: `"device": {"ui": "notif", "cam": "fly", "items": [{"at": "Klip#34", "title": "Yeni randevu", "sub": "Yarın 14:00"}]}`

## 2c. 3B nesneler (`beat.obj`, Obj3D.tsx)
| Nesne | Ne yapar | Uygun söz |
|---|---|---|
| `{"kind": "gift"}` | marka renkli kutu döner, kapak fırlar, ışık hüzmesi | hediye, bizden, ücretsiz |
| `{"kind": "calendar", "pages": ["1","15","30"], "caption": "GÜN"}` | sayfalar çevrilir, son sayfada büyük sayı | 30 gün, bu ay, süre |

## 3. Ses tasarımı
| Araç | Ne yapar |
|---|---|
| `scripts/ses_tasarim.mjs` | is.json vuruşlarından otomatik efekt planı → `tools/sfx_mix.py` → seslendirmeyle karışım, efekt katmanı ~-25 LUFS, son -14 LUFS |
| `scripts/olaylar.mjs` | elle ince ayar için olay listesi (`b3.big`, `b4.seq2`, `end`) |
| `_sistem/ses/sentez/` | hazır efekt kiti: Pop, Tick, Soft Hit, Shutter, Whoosh 1–3 |
Kendi ses efektlerini (kullanım hakkı olan) `_sistem/ses/` altına koyabilirsin; `sfx_mix.py` dosya adının bir parçasıyla bulur.
