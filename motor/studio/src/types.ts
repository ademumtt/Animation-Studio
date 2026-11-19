// Bir reklamin tum kurgu karari bu yapida tutulur (is.json).
// Tum zamanlar SANIYE; "at" degerleri CIKIS (reklam) zaman cizelgesine goredir.

export type Segment = {
  src: string; // public/ altindaki yol, orn "jobs/ornek-marka/src/Kanca A.mp4"
  in: number; // kaynak videoda baslangic (sn)
  out: number; // kaynak videoda bitis (sn)
  zoom?: number; // 1 = normal, 1.15 = yakin plan (jump-cut cesitliligi)
  focusX?: number; // zoom merkezi 0..1 (yuz konumu)
  focusY?: number;
  gain?: [number, number, number]; // cekimler arasi renk esitleme (R,G,B carpan)
};

export type Word = { w: string; s: number; e: number; hl?: boolean };

type Base = { at: number; dur: number; sfx?: string | false; sfxVol?: number };

export type Overlay =
  | (Base & { type: "hero"; kicker?: string; title: string; sub?: string; badge?: string; compact?: boolean }) // badge: teklif rozeti; compact: alt satir + rozet tek satirda, baslik kucuk (yuz yakin plandaysa)
  | (Base & {
      type: "glass";
      image?: string;
      video?: string;
      emoji?: string;
      icon?: string; // seffaf PNG ikon/logo (orn WhatsApp) - kare kartta ortalanir
      badge?: string;
      x: number; // 0..1 kart merkezi
      y: number;
      size?: number; // px genislik
      tilt?: number;
    })
  | (Base & { type: "white"; title: string; title2?: string; image?: string; emoji?: string; cut?: boolean }) // cut: zemin aninda gelir (B-roll'u kaplarken)
  | (Base & {
      type: "split";
      title?: string;
      image?: string;
      emoji?: string;
      items?: (string | { text: string; at?: number })[]; // at: overlay basina gore sn
      topImage?: string; // ust yariya tam ekran gorsel/ekran kaydi
      topVideo?: string;
    })
  | (Base & {
      type: "price";
      title: string;
      rows: { label: string; value: string; old?: string; at?: number }[];
      total?: { label: string; value: string };
      y?: number;
    })
  | (Base & { type: "bigword"; text: string; y?: number })
  | (Base & {
      type: "broll"; // tam ekran B-roll goruntusu (ses konusmacidan devam eder)
      video?: string;
      image?: string;
      from?: number; // B-roll videosunda baslangic saniyesi
      zoom?: "in" | "out"; // yavas Ken Burns hareketi
    })
  // ---- DERINLIK STILI (referans: konusmaci onde, buyuk baslik arkasinda) ----
  | (Base & {
      type: "behind"; // yazi/kart KISININ ARKASINDA (maske: tools/maske.py). Maske yoksa yazi ustte kalir.
      kicker?: string; // ustteki kucuk satir: "Fiyatla"
      script?: string; // el yazisi/italik serif vurgu satiri (brand.highlight): "yarışmıyorsunuz"
      after?: string; // script'in sagindaki duz kucuk kelime
      title: string; // dev kelime (degrade): "FİYAT"
      dot?: boolean; // dev kelimenin sonunda marka renkli nokta
      tail?: string; // dev kelimenin sag altindaki kucuk kelime ("mi?")
      image?: string; // basligin arkasinda yatay kart (film seridi gibi) - gorsel/video
      video?: string;
      deco?: ("plus" | "frame" | "think" | "arcs" | "ribbon")[]; // sade suslemeler (en fazla 2 onerilir)
      dim?: number; // 0..1 arka plani karartip konusmaciya spot isik (varsayilan 0.45)
      y?: number; // baslik blogunun dikey merkezi 0..1 (varsayilan 0.30 - basin hemen ustu/arkasi)
    })
  | (Base & {
      type: "statement"; // tam ekran sade sahne, konusma sesi devam eder (referans: "Does your content SHOW it?")
      kicker?: string;
      title: string; // dev kelime (marka parlamasi)
      tail?: string;
      bg?: "dark" | "light" | "brand";
      deco?: ("arcs" | "grid" | "plus")[];
      cut?: boolean; // zemin aninda (B-roll ses klibini kaplarken)
    })
  | (Base & {
      type: "story"; // konusmaci arkada (bulanik), anlattigi sey ekranda baglantili parcalarla canlanir
      items: {
        at?: number; // overlay basina gore sn (taslakta kelime capasi)
        image?: string;
        emoji?: string;
        icon?: string;
        text?: string; // kucuk satir
        big?: string; // buyuk kalin satir
        x: number; // 0..1 merkez
        y: number;
        size?: number; // gorsel px (varsayilan 420)
        circle?: boolean; // gorsel daire icinde (yakin plan detay)
      }[];
      bg?: "light" | "dark";
      cut?: boolean;
    })
  | (Base & {
      type: "film"; // SADECE SES KAYDI: tum videoyu kaplayan kesintisiz sinematik anlatim (zemin + kinetik yazi + gecis)
      beats: Beat[];
      gecisSesi?: boolean; // false: yerlesik gecis whoosh'u kapali (ses_tasarim.mjs kullanildiginda)
    })
  | (Base & {
      // K3: DESTEK SAHNESI – konusmaci konusurken soyledigini destekleyen tam ekran gorsel (ses ve altyazi surer)
      type: "cutaway";
      bg?: "masa" | "bokeh"; // masa: sicak kagit/masa dokusu + pencere/yaprak golgesi; bokeh: bulanik sicak isiklar
      items: {
        icon?: string; // public/ altinda yol (kurgu.mjs "fluent:light_bulb" -> public/ikon3d/light_bulb.png kopyalar)
        note?: string; // yapiskan not (el yazisi)
        at?: number; // overlay basina gore sn (taslakta kelime capasi)
        x: number; // 0..1 merkez
        y: number;
        size?: number; // px (ikon varsayilan 380, not 300)
        rot?: number; // derece
      }[];
    })
  | (Base & {
      type: "cta";
      headline: string;
      sub?: string;
      button?: string;
      buttonIcon?: string; // butonun solundaki ikon (orn WhatsApp logosu)
      logo?: string;
    });

export type Punch = { at: number; dur: number; scale?: number };
export type Sfx = { at: number; file: string; vol?: number };

export type Brand = {
  name: string;
  accent: string; // vurgu rengi (fiyat, vurgulu kelime)
  accentText?: string; // vurgu zemininde yazi rengi
  highlight?: string; // video ustunde vurgulu altyazi rengi (koyu marka renkleri videoda okunmaz)
  dark?: string;
  logo?: string;
  tint?: string; // film zemin isigi tonu (varsayilan kirmizi/pembe); orn. neon yesil
};

export type Spec = {
  fps?: number;
  brand: Brand;
  segments: Segment[];
  words: Word[];
  overlays: Overlay[];
  punches?: Punch[];
  sfx?: Sfx[];
  music?: { file: string; vol?: number };
  extraEnd?: number; // konusma bittikten sonra eklenen sure (CTA icin)
  grade?: { contrast?: number; saturate?: number; brightness?: number; warmth?: number };
  captions?: boolean;
  takeTransition?: boolean; // cekim degisiminde blur gecisi (varsayilan kapali)
  noCaptions?: { at: number; dur: number }[];
  captionStyle?: "classic" | "mix" | "kutu" | "parilti"; // mix: kucuk beyaz + buyuk kalin; kutu: kucuk beyaz satir + turuncu kutulu vurgu; parilti: kucuk satir + parlayan sari vurgu (K2)
  look?: "sinema"; // K1: konusmaci ustunde sicak sinema gorunumu (nokta deseni + alt koyu gecis + vinyet)
  mattes?: Matte[]; // tools/maske.py ciktisi (kisi kesimi, seffaf webm)
};

/** film katmaninin bir "vurusu": tek ince satir + tek kalin satir. Zamanlar overlay basina gore sn. */
export type Beat = {
  at: number; // vurus basi (zemin gecisi + ince satir)
  theme: "night" | "brand" | "light" | "glow"; // night: koyu + marka isigi, brand: marka degradesi, light: krem/beyaz, glow: koyu + altin isik
  trans?: "fade" | "wipe" | "ring" | "cut"; // tema degisiminde gecis (varsayilan fade)
  small?: string; // ince satir (Jakarta 400)
  smallAt?: number;
  big?: string; // kalin satir
  bigAt?: number;
  serif?: boolean; // kalin satir yerine Bodoni (italik: "italic")
  italic?: boolean;
  bigFirst?: boolean; // buyuk satir ustte (referans: "Attention / costs money")
  artVar?: string; // cizim varyanti (orn coin: "return" = iade oku, ustu cizilmez)
  logoW?: number; // kapanis logosu genisligi (ekran orani, varsayilan 0.62)
  block?: boolean; // buyuk satir tek blok girer (kelime kelime degil) - "1 ay boyunca" gibi kisa ifadelerde tek kelime yalniz kalmasin
  seq?: { at: number; text: string }[]; // buyuk kelime yerinde degisir (ombre -> sombre -> balyaj -> rofle)
  count?: number; // buyuk satirda 0'dan sayan rakam (bigAt'te baslar), big = sonek ("TL")
  strikeAt?: number; // buyuk satirin ustu cizilir
  note?: string; // buyuk satirin altinda ince ek satir (orn. "Bakım 2.500 TL · Kesim 1.500 TL")
  noteAt?: number;
  icon?: string; // ustte seffaf PNG (ornek WhatsApp)
  iconAt?: number;
  artAt?: number; // cizimin ikinci tetigi (appWindow: "Code" sekmesi secilir)
  device?: DeviceSpec; // uygulama/ekran sahnesi (cizim yerine 3B telefon) - Device.tsx
  obj?: ObjSpec; // gercek 3B nesne (CSS 3D kutu) - Obj3D.tsx
  art?: import("./components/Art").ArtName; // anlatilani gosteren cizim (Art.tsx, liste: _sistem/animasyon/KATALOG.md)
  deco?: ("ribbon" | "arcs" | "plus" | "frame" | "grid" | "think")[]; // derinlik stilinden arka plan hareketleri (en fazla 2)
  logo?: string; // kapanis: logo
  button?: string; // kapanis butonu
  buttonIcon?: string;
};

/** 3B telefon / uygulama sahnesi. Zamanlar (at, taps) taslakta kelime capasi, is.json'da overlay-goreli saniye. */
export type DeviceSpec = {
  ui?: "notif" | "feed" | "booking" | "stats" | "search" | "ads"; // hazir arayuz (screen yoksa)
  query?: string; // search: arama cubuguna yazilan metin (v8)
  zeroAt?: number | string; // ads: "Sonuc 0" kirmiziya doner (v8)
  hideValue?: boolean; // stats: sayac yerine yukari ok (soylenmeyen rakam gostermemek icin, v8)
  screen?: string; // gercek ekran goruntusu (public/ altinda yol) - uzunsa scroll ile kaydirilir
  scroll?: number; // ekran goruntusu kaydirma mesafesi (px, 298 genislige gore)
  cam?: "fly" | "tilt" | "orbit"; // kamera: asagidan ucarak gelir / yavas egim / yorunge (yon degistirmez)
  items?: { at?: number | string; title: string; sub?: string }[]; // notif: bildirim kartlari
  pops?: { at?: number | string; title: string; sub?: string; icon?: string; side?: "l" | "r" }[]; // ekrandan firlayan 3B kartlar
  taps?: (number | string)[]; // dokunma halkasi anlari
  value?: number; // stats: sayac hedefi
  empty?: boolean; // booking: tum saatler "Bos" kalir (sorun anlatimi: bos koltuk/bos saat)
  video?: string; // ekranda video / ekran kaydi oynat (public/ altinda mp4) – uygulama tanitimi (G5)
  label?: string; // stats: baslik
};

/** Gercek 3B nesne (Obj3D.tsx). k1 = buyuk satirin soylendigi an. */
export type ObjSpec = {
  kind: "gift" | "calendar";
  pages?: string[]; // calendar: sirayla cevrilen sayfalar (orn ["1","15","30"])
  caption?: string; // calendar: sayinin altindaki kelime (orn "GÜN")
};

export type Matte ={ src: string; in: number; out: number; file: string };
