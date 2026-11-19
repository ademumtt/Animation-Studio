// ANLAM CIZIMLERI – seslendirmede anlatilan seyi gorsel olarak gosteren sade, marka renkli vektor animasyonlar.
// Her cizim kendi vurusunun yerel karesiyle (lf) calisir; tetikler (k1 = buyuk kelimenin soylendigi an vb.) yerel kare.
// Ilke: tek fikir, yavas ve net hareket, patlama yok. Renk: marka (accent), vurgu (highlight), sac tonlari.
import React from "react";
import { Easing, interpolate } from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { SANS } from "../fonts";

export type ArtName =
  | "frayed" | "hair" | "strand" | "calendar" | "lock" | "bond" | "scissors" | "gift" | "tag" | "coin" | "chat"
  // genel set (2026-11-15): her sektore uyar
  | "percent" | "clock" | "pin" | "phone" | "star" | "check" | "heart"
  // ajans / pazarlama (2026-11-15, ajans)
  | "people" | "post"
  // guven / soz (2026-11-15)
  | "guarantee" | "shield"
  // para iadesi (2026-11-15, kullanici: "para animasyonu guzel olsun")
  | "refund" | "refundCoin"
  // 2.5B / 3B isikli (2026-11-15, kullanici: "bu ikisine 3d animasyon uret")
  | "hair3d" | "scissors3d"
  // el + makas, sac YOK (kullanici: "sadece makasi eline alip kesme isareti yapsin")
  | "scissorsHand"
  // sadece makas, kendi ekseninde donen 3B (kullanici: "el, sac olunca absurt; sadece makas donsun, 3 boyutlu")
  | "scissorsSpin"
  // kurulum / dijital urun anlatimi (2026-11-19): ses -> video, klasore dusen dosya, uygulama penceresinde komut
  | "voice" | "folder" | "appWindow";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ex = Easing.bezier(0.16, 1, 0.3, 1);
const io = Easing.bezier(0.65, 0, 0.35, 1);
const P = (lf: number, a: number, b: number, e = ex) => interpolate(lf, [a, b], [0, 1], { ...cl, easing: e });

const HAIR_DARK = "#2a1913";
const HAIR_MID = "#8a5530";
const HAIR_LIGHT = "#e9c47e";
const SKIN = "#efcfb8";
// arka sac: uclari dalgali (duz kesik "kutu" gibi durmasin)
const HAIR_BACK =
  "M300 62 C150 62 112 190 118 310 C124 430 96 505 130 572 Q170 604 214 580 Q256 606 300 584 Q344 606 386 580 Q430 604 470 572 C504 505 476 430 482 310 C488 190 450 62 300 62 Z";

type Props = {
  name: ArtName;
  lf: number; // yerel kare (vurus basindan)
  k1: number; // ana tetik (buyuk kelime) - yerel kare
  k0?: number; // ikinci tetik (beat.artAt) - yerel kare
  seqIdx?: number; // lock: hangi teknik (0 ombre, 1 sombre, 2 balyaj, 3 rofle)
  seqF?: number; // lock: son degisimin yerel karesi
  dark: boolean;
  accent: string;
  glow: string;
  size: number;
  brandName?: string; // chat basligi vb.
  variant?: string; // coin: "return" = iade (ok doner, ustu cizilmez)
};

export const Art: React.FC<Props> = (p) => {
  const { name, lf, k1, dark, accent, glow, size } = p;
  const line = dark ? "rgba(255,255,255,0.92)" : "#1b1b1b";
  const soft = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)";
  const enter = P(lf, 0, 18);
  const float = Math.sin(lf / 22) * 6;
  const wrap = (children: React.ReactNode, vb = "0 0 600 600") => (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      style={{ overflow: "visible", opacity: enter, transform: `translateY(${(1 - enter) * 40 + float}px) scale(${0.92 + 0.08 * enter})`, filter: `blur(${(1 - enter) * 8}px)` }}
    >
      {children}
    </svg>
  );

  switch (name) {
    /* sac rengi koyudan ombreye doner (cesaret) */
    case "hair": {
      const c = P(lf, Math.max(8, k1 - 14), Math.max(8, k1 - 14) + 46, io); // renk akisi
      const edge = 1 - 0.62 * c; // gecis cizgisi yukari cikar
      const shine = interpolate(lf, [k1, k1 + 40], [-0.3, 1.3], cl);
      return wrap(
        <>
          <defs>
            <linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={HAIR_DARK} />
              <stop offset={Math.max(0, edge - 0.18)} stopColor={HAIR_DARK} />
              <stop offset={Math.min(1, edge + 0.05)} stopColor={HAIR_MID} />
              <stop offset={Math.min(1, edge + 0.3)} stopColor={HAIR_LIGHT} />
              <stop offset="1" stopColor={HAIR_LIGHT} />
            </linearGradient>
            <linearGradient id="hairShine" x1="0" y1="0" x2="1" y2="1">
              <stop offset={shine - 0.15} stopColor="#fff" stopOpacity="0" />
              <stop offset={shine} stopColor="#fff" stopOpacity="0.35" />
              <stop offset={shine + 0.15} stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="hairHalo">
              <stop offset="0" stopColor={glow} stopOpacity={0.35 * c} />
              <stop offset="1" stopColor={glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="300" r="300" fill="url(#hairHalo)" />
          <path d="M110 600 C130 485 215 452 300 452 C385 452 470 485 490 600 Z" fill={accent} />
          <rect x="268" y="370" width="64" height="100" rx="26" fill="#e2b9a0" />
          <path d={HAIR_BACK} fill="url(#hairG)" />
          <path d={HAIR_BACK} fill="url(#hairShine)" />
          <ellipse cx="300" cy="262" rx="92" ry="118" fill={SKIN} />
          {/* sakin, kendinden emin yuz: kapali gozler + hafif gulumseme */}
          <path d="M248 262 q16 12 32 0 M320 262 q16 12 32 0" stroke="#7a4a3a" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M282 318 q18 12 36 0" stroke="#b5605a" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="246" cy="300" rx="16" ry="9" fill="#e9a9a0" opacity="0.5" />
          <ellipse cx="354" cy="300" rx="16" ry="9" fill="#e9a9a0" opacity="0.5" />
          <path d="M300 70 C205 70 180 150 186 248 C226 172 300 150 368 136 C396 160 408 200 414 246 C420 156 392 70 300 70 Z" fill="url(#hairG)" />
          {/* sac telleri (ince cizgiler) */}
          {[150, 175, 425, 450].map((x, i) => (
            <path key={i} d={`M${x} 200 C${x - 8} 330 ${x + 6} 440 ${x - 4} 560`} stroke="#fff" strokeOpacity="0.12" strokeWidth="3" fill="none" />
          ))}
        </>
      );
    }

    /* 3B ISIKLI PORTRE: kure gibi golgelenmis yuz, hacimli sac (ombre akisi + kayan parlak bant), kenar isigi,
       basin hafif donusu katmanli paralaksla (on katman daha cok, arka katman ters kayar), sallanan teller, isiltilar. */
    case "hair3d": {
      const c = P(lf, Math.max(8, k1 - 14), Math.max(8, k1 - 14) + 46, io);
      const edge = 1 - 0.62 * c;
      const turn = Math.sin(lf / 30) * 1; // -1..1 bas donusu
      const tilt = Math.sin(lf / 41) * 2.2;
      const fx = turn * 14, bx = -turn * 8, mx = turn * 6; // paralaks: on / arka / orta
      const sway = (k: number) => Math.sin(lf / 13 + k) * 6;
      const band = interpolate((lf % 90) / 90, [0, 1], [-0.4, 1.4]);
      const rim = dark ? glow : "#ffffff";
      return wrap(
        <g transform={`rotate(${tilt} 300 330)`}>
          <defs>
            <linearGradient id="h3G" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={HAIR_DARK} />
              <stop offset={Math.max(0, edge - 0.18)} stopColor={HAIR_DARK} />
              <stop offset={Math.min(1, edge + 0.05)} stopColor={HAIR_MID} />
              <stop offset={Math.min(1, edge + 0.3)} stopColor={HAIR_LIGHT} />
              <stop offset="1" stopColor={HAIR_LIGHT} />
            </linearGradient>
            {/* silindirik hacim: kenarlar koyu, orta acik */}
            <linearGradient id="h3Vol" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#000" stopOpacity="0.55" />
              <stop offset="0.3" stopColor="#000" stopOpacity="0" />
              <stop offset="0.62" stopColor="#fff" stopOpacity="0.1" />
              <stop offset="1" stopColor="#000" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="h3Band" x1="0" y1="0" x2="1" y2="1">
              <stop offset={band - 0.12} stopColor="#fff" stopOpacity="0" />
              <stop offset={band} stopColor="#fff" stopOpacity="0.42" />
              <stop offset={band + 0.12} stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* yuz: kure isigi (sol ust kaynak) */}
            <radialGradient id="h3Skin" cx={0.38 + turn * 0.06} cy="0.32" r="0.75">
              <stop offset="0" stopColor="#ffe6d6" />
              <stop offset="0.55" stopColor={SKIN} />
              <stop offset="1" stopColor="#c99579" />
            </radialGradient>
            <radialGradient id="h3Neck" cx="0.5" cy="0" r="1">
              <stop offset="0" stopColor="#b98266" />
              <stop offset="1" stopColor="#e2b9a0" />
            </radialGradient>
            <linearGradient id="h3Body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={dark ? "#3a3a3a" : accent} />
              <stop offset="1" stopColor={dark ? "#0c0c0c" : "#000"} />
            </linearGradient>
            <filter id="h3Soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
            <radialGradient id="h3Halo">
              <stop offset="0" stopColor={glow} stopOpacity={0.28 + 0.2 * c} />
              <stop offset="1" stopColor={glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="300" r="300" fill="url(#h3Halo)" />
          {/* yer golgesi */}
          <ellipse cx="300" cy="598" rx="210" ry="22" fill="#000" opacity="0.35" filter="url(#h3Soft)" />
          {/* omuzlar */}
          <path d="M100 600 C120 482 210 448 300 448 C390 448 480 482 500 600 Z" fill="url(#h3Body)" />
          <path d="M140 520 C180 480 240 466 300 466" stroke="#fff" strokeOpacity="0.18" strokeWidth="6" fill="none" />
          {/* arka sac (ters paralaks) */}
          <g transform={`translate(${bx} 0)`}>
            <path d={HAIR_BACK} fill="url(#h3G)" />
            <path d={HAIR_BACK} fill="url(#h3Vol)" />
            <path d={HAIR_BACK} fill="url(#h3Band)" />
            {/* kenar isigi */}
            <path d={HAIR_BACK} fill="none" stroke={rim} strokeOpacity={dark ? 0.55 : 0.35} strokeWidth="5" filter="url(#h3Soft)" />
            {[150, 172, 428, 450].map((x, i) => (
              <path key={i} d={`M${x} 200 C${x - 8 + sway(i)} 330 ${x + 6 + sway(i + 1)} 440 ${x - 4 + sway(i + 2)} 562`} stroke="#fff" strokeOpacity="0.16" strokeWidth="4" fill="none" />
            ))}
          </g>
          {/* boyun */}
          <rect x="266" y="364" width="68" height="104" rx="28" fill="url(#h3Neck)" />
          {/* yuz (orta paralaks) */}
          <g transform={`translate(${mx} 0)`}>
            <ellipse cx="300" cy="262" rx="94" ry="120" fill="url(#h3Skin)" />
            {/* golge: cene alti */}
            <ellipse cx="300" cy="372" rx="60" ry="14" fill="#7a4a3a" opacity="0.25" filter="url(#h3Soft)" />
          </g>
          {/* yuz ozellikleri (on paralaks) */}
          <g transform={`translate(${fx * 0.8} 0)`}>
            <path d="M246 262 q16 13 33 0 M321 262 q16 13 33 0" stroke="#6b3d2f" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M246 252 l-6 -6 M354 252 l6 -6" stroke="#6b3d2f" strokeWidth="3" strokeLinecap="round" />
            <path d="M300 280 q-6 22 2 30" stroke="#b07a62" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M280 324 q20 13 40 0" stroke="#b5605a" strokeWidth="6" strokeLinecap="round" fill="none" />
            <ellipse cx="242" cy="302" rx="18" ry="10" fill="#f0a39a" opacity="0.5" />
            <ellipse cx="358" cy="302" rx="18" ry="10" fill="#f0a39a" opacity="0.5" />
            {/* goz parlamasi yerine kirpik ustu isik */}
            <ellipse cx="270" cy="214" rx="26" ry="10" fill="#fff" opacity="0.22" />
          </g>
          {/* on sac / perçem (en cok paralaks) */}
          <g transform={`translate(${fx} 0)`}>
            <path d={`M300 66 C200 66 172 150 182 250 C${222 + sway(3) * 0.4} 170 300 150 368 134 C396 158 410 200 418 248 C424 154 396 66 300 66 Z`} fill="url(#h3G)" />
            <path d="M300 66 C200 66 172 150 182 250 C222 170 300 150 368 134 C396 158 410 200 418 248 C424 154 396 66 300 66 Z" fill="url(#h3Band)" />
            <path d="M210 120 C250 92 330 86 380 118" stroke="#fff" strokeOpacity="0.35" strokeWidth="8" strokeLinecap="round" fill="none" />
          </g>
          {/* isiltilar (renk akisi bitince) */}
          {[0, 1, 2].map((i) => {
            const sp = P(lf, k1 + 6 + i * 6, k1 + 20 + i * 6);
            const x = [150, 470, 430][i], y = [170, 210, 470][i];
            return sp > 0 ? <path key={i} d={`M${x} ${y - 18} V${y + 18} M${x - 18} ${y} H${x + 18}`} stroke={glow} strokeWidth="6" strokeLinecap="round" opacity={sp * (1 - P(lf, k1 + 50, k1 + 70))} transform={`rotate(${lf * 3} ${x} ${y})`} /> : null;
          })}
        </g>
      );
    }

    /* 3B KROM MAKAS: perspektifte (egik duzlem) donerek gelir, krom biçaklarda kayan parlama, parlak marka renkli
       tutamaklar, metal vida, yer golgesi; ortadaki hacimli sac tutamini k1'de keser, uc parca 3B donerek duser. */
    case "scissors3d": {
      const inP = P(lf, 0, 26, ex);
      const ang = interpolate(lf, [0, 30, 120], [-38, -12, -4], cl); // tek yonlu donus (geri donmez)
      const persp = 0.62 + 0.12 * inP; // egik duzlem (Y basiklik)
      const snip = (f: number) => interpolate(f, [0, 5, 10], [1, 0, 1], cl);
      const s1 = lf >= k1 - 5 && lf < k1 + 5 ? snip(lf - (k1 - 5)) : lf >= k1 + 9 && lf < k1 + 19 ? snip(lf - (k1 + 9)) : lf >= k1 + 19 ? 0.35 : 1;
      const open = 17 * s1;
      const cut = lf >= k1;
      const fall = interpolate(lf, [k1, k1 + 34], [0, 1], { ...cl, easing: Easing.bezier(0.5, 0, 0.9, 0.6) });
      const flash = interpolate(lf, [k1, k1 + 2, k1 + 12], [0, 1, 0], cl);
      const sweep = interpolate(lf % 60, [0, 60], [-0.3, 1.3]);
      // tutamak: her zeminde parlak vurgu rengi + koyu kontur (acik zeminde duz siyah halka gibi durmasin)
      const handle = glow;
      const handleD = "#1a1a1a";
      const LOCK = "M268 40 C250 140 262 220 252 300 C246 360 262 420 256 560 L344 560 C338 420 354 360 348 300 C338 220 350 140 332 40 Z";
      const blade = (sign: number) => (
        <g transform={`rotate(${sign * open} 300 300)`}>
          {/* biçak: krom gradyan + kesici kenar */}
          <path d={`M300 300 L520 ${300 - sign * 14} C534 ${300 - sign * 6} 534 ${300 + sign * 4} 520 ${300 + sign * 9} Z`} fill="url(#scChrome)" stroke="#4b525a" strokeWidth="2" />
          <path d={`M300 300 L520 ${300 - sign * 14} C534 ${300 - sign * 6} 534 ${300 + sign * 4} 520 ${300 + sign * 9} Z`} fill="url(#scSweep)" />
          <path d={`M310 ${300 - sign * 2} L515 ${300 - sign * 11}`} stroke="#fff" strokeOpacity="0.8" strokeWidth="2" />
          {/* kol + tutamak halkasi (parlak plastik) */}
          <path d={`M300 300 L196 ${300 + sign * 66}`} stroke="url(#scChrome)" strokeWidth="22" strokeLinecap="round" />
          <circle cx="150" cy={300 + sign * 96} r="50" fill="none" stroke="#000" strokeWidth="26" transform={`translate(5 ${12})`} opacity="0.3" />
          <circle cx="150" cy={300 + sign * 96} r="50" fill="none" stroke={handleD} strokeWidth="30" />
          <circle cx="150" cy={300 + sign * 96} r="50" fill="none" stroke={handle} strokeWidth="22" />
          <path d={`M112 ${300 + sign * 80} A44 44 0 0 1 162 ${300 + sign * 52}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>
      );
      return wrap(
        <>
          <defs>
            <linearGradient id="scChrome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.35" stopColor="#c9d0d8" />
              <stop offset="0.5" stopColor="#6c757f" />
              <stop offset="0.65" stopColor="#e9edf1" />
              <stop offset="1" stopColor="#8a939d" />
            </linearGradient>
            <linearGradient id="scSweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset={sweep - 0.08} stopColor="#fff" stopOpacity="0" />
              <stop offset={sweep} stopColor="#fff" stopOpacity="0.85" />
              <stop offset={sweep + 0.08} stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="scScrew" cx="0.35" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#9aa3ad" />
              <stop offset="1" stopColor="#3d434a" />
            </radialGradient>
            <linearGradient id="scLock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={HAIR_DARK} />
              <stop offset="0.55" stopColor={HAIR_MID} />
              <stop offset="1" stopColor={HAIR_LIGHT} />
            </linearGradient>
            <linearGradient id="scLockVol" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#000" stopOpacity="0.55" />
              <stop offset="0.38" stopColor="#fff" stopOpacity="0.18" />
              <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.55" />
            </linearGradient>
            <clipPath id="scTop">
              <rect x="0" y="0" width="600" height="330" />
            </clipPath>
            <clipPath id="scBot">
              <rect x="0" y="330" width="600" height="300" />
            </clipPath>
            <filter id="scBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <circle cx="300" cy="300" r="280" fill={glow} opacity="0.07" />
          {/* hacimli sac tutami: ust parca sabit, alt parca kesilince 3B donerek duser */}
          <g clipPath="url(#scTop)">
            <path d={LOCK} fill="url(#scLock)" />
            <path d={LOCK} fill="url(#scLockVol)" />
          </g>
          <g clipPath="url(#scBot)" transform={cut ? `translate(${fall * 40} ${fall * 380}) rotate(${fall * 28} 300 330) scale(${1 - 0.3 * fall} ${1 - 0.55 * fall})` : undefined} opacity={1 - fall}>
            <path d={LOCK} fill="url(#scLock)" />
            <path d={LOCK} fill="url(#scLockVol)" />
          </g>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${276 + i * 16} 60 C${270 + i * 16} 200 ${282 + i * 16} 320 ${276 + i * 16} 330`} stroke="#fff" strokeOpacity="0.14" strokeWidth="3" fill="none" />
          ))}
          {/* makas: perspektif duzlem + yer golgesi */}
          <g opacity={inP} transform={`translate(${(1 - inP) * 260} ${(1 - inP) * 60})`}>
            <ellipse cx="320" cy="470" rx={190 * persp} ry="26" fill="#000" opacity="0.35" filter="url(#scBlur)" />
            <g transform={`translate(300 330) scale(1.28 ${1.28 * persp}) rotate(${ang}) translate(-300 -300)`}>
              {blade(1)}
              {blade(-1)}
              <circle cx="300" cy="300" r="16" fill="url(#scScrew)" stroke="#2f3439" strokeWidth="2" />
              <path d="M293 300 h14" stroke="#2f3439" strokeWidth="3" />
            </g>
          </g>
          {/* kesim parlamasi */}
          {flash > 0 && <circle cx="300" cy="330" r={30 + 90 * (1 - flash)} fill="#fff" opacity={0.8 * flash} filter="url(#scBlur)" />}
        </>
      );
    }

    /* EL + 3B MAKAS (sac yok): sol alttan el, sag ustten donerek krom makas gelir (0-22), ortada birlesir (kavrama
       parlamasi ~24), k1'den itibaren el havada 3 kez kesme hareketi yapar (her kapanista uc cizgileri). Basparmak ust
       halkayla, parmaklar alt halkayla birlikte hareket eder. */
    case "scissorsHand": {
      const handIn = P(lf, 0, 22, ex);
      const scIn = P(lf, 3, 24, ex);
      const grip = interpolate(lf, [20, 24, 30], [0, 1, 0], cl);
      // kesme: k1'den 3 dongu (8 kare), sonra hafif acik bekler
      const cyc = (lf - k1) / 8;
      const open = lf < k1 ? 14 : cyc < 3 ? 14 * (0.5 + 0.5 * Math.cos(cyc * Math.PI * 2)) : 6;
      const closeHit = (k: number) => interpolate(lf, [k1 + 4 + k * 8, k1 + 6 + k * 8, k1 + 12 + k * 8], [0, 1, 0], cl);
      const drift = interpolate(lf, [0, 150], [-12, -6], cl) + Math.sin(lf / 24) * 1.5; // neredeyse yatay (kol yazinin ustune inmesin)
      const bob = lf >= k1 && cyc < 3 ? Math.sin(cyc * Math.PI * 2) * 3 : 0;
      const sweep = interpolate(lf % 60, [0, 60], [-0.3, 1.3]);
      const SKIN_L = "#f6d2bd", SKIN_M = "#e3b196", SKIN_D = "#b9846a";
      const sleeve = dark ? "#2b2b2b" : accent;
      // makas yarisi: sign 1 = alt halka (+open), -1 = ust halka (-open). Pivot (300,300), biçaklar saga.
      const half = (sign: number, extra: React.ReactNode) => (
        <g transform={`rotate(${sign * open} 300 300)`}>
          <path d={`M300 300 L530 ${300 - sign * 15} C545 ${300 - sign * 6} 545 ${300 + sign * 4} 530 ${300 + sign * 9} Z`} fill="url(#shChrome)" stroke="#4b525a" strokeWidth="2" />
          <path d={`M300 300 L530 ${300 - sign * 15} C545 ${300 - sign * 6} 545 ${300 + sign * 4} 530 ${300 + sign * 9} Z`} fill="url(#shSweep)" />
          <path d={`M310 ${300 - sign * 2} L525 ${300 - sign * 12}`} stroke="#fff" strokeOpacity="0.8" strokeWidth="2" />
          <path d={`M300 300 L196 ${300 + sign * 66}`} stroke="url(#shChrome)" strokeWidth="22" strokeLinecap="round" />
          <circle cx="150" cy={300 + sign * 96} r="50" fill="none" stroke="#1a1a1a" strokeWidth="30" />
          <circle cx="150" cy={300 + sign * 96} r="50" fill="none" stroke={glow} strokeWidth="22" />
          <path d={`M112 ${300 + sign * 80} A44 44 0 0 1 162 ${300 + sign * 52}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="7" strokeLinecap="round" fill="none" />
          {extra}
        </g>
      );
      // parmak kapsulu (golgeli deri)
      const finger = (x1: number, y1: number, x2: number, y2: number, w: number, key: number) => (
        <g key={key}>
          <line x1={x1} y1={y1 + 4} x2={x2} y2={y2 + 4} stroke={SKIN_D} strokeWidth={w} strokeLinecap="round" />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#shSkin)" strokeWidth={w - 4} strokeLinecap="round" />
          <line x1={x1 + 4} y1={y1 - w * 0.22} x2={x2 - 2} y2={y2 - w * 0.22} stroke="#fff" strokeOpacity="0.28" strokeWidth={w * 0.18} strokeLinecap="round" />
        </g>
      );
      // el (alt halka grubu icinde): bilek/kol sol alttan, avuc halkalarin solunda, parmaklar alt halkayi kavrar
      const handLower = (
        <g transform={`translate(${-(1 - handIn) * 420} ${(1 - handIn) * 40})`}>
          {/* kol soldan yatay gelir (ekran kenarindan) */}
          <path d="M-330 392 L50 380 L64 500 L-330 520 Z" fill={sleeve} />
          <path d="M-330 400 L48 388" stroke={dark ? glow : "#fff"} strokeOpacity="0.45" strokeWidth="6" />
          <path d="M40 380 L58 500" stroke="#000" strokeOpacity="0.25" strokeWidth="8" />
          <path d="M30 470 C10 420 30 360 80 340 C120 326 150 350 158 392 C166 440 140 492 96 510 C66 520 44 500 30 470 Z" fill="url(#shSkin)" stroke={SKIN_D} strokeWidth="3" />
          {finger(70, 372, 150, 396, 38, 1)}
          {finger(80, 420, 176, 432, 36, 2)}
          {finger(86, 462, 166, 470, 32, 3)}
          {/* tirnak */}
          <ellipse cx="170" cy="432" rx="10" ry="8" fill="#ffe4d6" opacity="0.8" />
        </g>
      );
      const thumbUpper = (
        <g transform={`translate(${-(1 - handIn) * 420} ${(1 - handIn) * 40})`}>
          {finger(60, 330, 150, 214, 44, 4)}
          <ellipse cx="148" cy="218" rx="12" ry="10" fill="#ffe4d6" opacity="0.8" transform="rotate(-50 148 218)" />
        </g>
      );
      return wrap(
        <>
          <defs>
            <linearGradient id="shChrome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.35" stopColor="#c9d0d8" />
              <stop offset="0.5" stopColor="#6c757f" />
              <stop offset="0.65" stopColor="#e9edf1" />
              <stop offset="1" stopColor="#8a939d" />
            </linearGradient>
            <linearGradient id="shSweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset={sweep - 0.08} stopColor="#fff" stopOpacity="0" />
              <stop offset={sweep} stopColor="#fff" stopOpacity="0.85" />
              <stop offset={sweep + 0.08} stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="shSkin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={SKIN_L} />
              <stop offset="0.6" stopColor={SKIN_M} />
              <stop offset="1" stopColor={SKIN_D} />
            </linearGradient>
            <radialGradient id="shScrew" cx="0.35" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#9aa3ad" />
              <stop offset="1" stopColor="#3d434a" />
            </radialGradient>
            <filter id="shBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>
          <circle cx="300" cy="300" r="280" fill={glow} opacity="0.08" />
          <ellipse cx="300" cy="560" rx="200" ry="24" fill="#000" opacity="0.3" filter="url(#shBlur)" />
          <g transform={`translate(360 ${280 + bob}) rotate(${drift}) scale(1.18) translate(-300 -300)`}>
            {/* makas sagdan donerek gelir; el soldan. Birlesince ayni grupta hareket ederler */}
            <g transform={`translate(${(1 - scIn) * 420} ${-(1 - scIn) * 140}) rotate(${(1 - scIn) * 70} 300 300)`}>
              {half(1, null)}
              {half(-1, null)}
              <circle cx="300" cy="300" r="16" fill="url(#shScrew)" stroke="#2f3439" strokeWidth="2" />
              <path d="M293 300 h14" stroke="#2f3439" strokeWidth="3" />
            </g>
            {/* el: avuc + parmaklar alt halkayla, basparmak ust halkayla doner */}
            <g transform={`rotate(${open} 300 300)`}>{handLower}</g>
            <g transform={`rotate(${-open} 300 300)`}>{thumbUpper}</g>
            {/* kavrama parlamasi */}
            {grip > 0 && <circle cx="150" cy="300" r={60 + 60 * (1 - grip)} fill="none" stroke={glow} strokeWidth="6" opacity={grip} />}
            {/* her kapanista biçak ucunda hareket cizgileri */}
            {[0, 1, 2].map((k) => {
              const h = closeHit(k);
              return h > 0 ? (
                <g key={k} opacity={h} stroke={dark ? glow : accent} strokeWidth="7" strokeLinecap="round">
                  <path d={`M555 ${300 - 30 - 10 * h} l${22 + 14 * h} -${14 + 8 * h}`} />
                  <path d={`M565 300 l${30 + 16 * h} 0`} />
                  <path d={`M555 ${300 + 30 + 10 * h} l${22 + 14 * h} ${14 + 8 * h}`} />
                </g>
              ) : null;
            })}
          </g>
        </>
      );
    }

    /* SADECE 3B MAKAS: dikey eksende surekli doner (tek yon, yavaslayarak), kalinlik dilimleri her acida gorunur,
       krom biçaklarda kayan parlama, parlak vurgu renkli tutamaklar, yer golgesi donusle daralir/genisler.
       k1'de havada 3 kez acilip kapanir (kapanislar k1+4/+12/+20). El, sac, kesilen bir sey YOK. */
    case "scissorsSpin": {
      const inP = P(lf, 0, 22, ex);
      // donus acisi: hizli baslar, yavaslar ama durmaz (yon degistirmez)
      const theta = (interpolate(lf, [0, 40], [0, 1], { ...cl, easing: ex }) * 300 + lf * 1.6) * (Math.PI / 180);
      const c = Math.cos(theta), s = Math.sin(theta);
      const sx = Math.abs(c) < 0.06 ? 0.06 * Math.sign(c || 1) : c; // tam yandan bakista cizgi gibi kaybolmasin
      const cyc = (lf - k1) / 8;
      const open = lf < k1 ? 13 : cyc < 3 ? 13 * (0.5 + 0.5 * Math.cos(cyc * Math.PI * 2)) : 9;
      const sweep = interpolate((lf + 20) % 70, [0, 70], [-0.3, 1.3]);
      const float = Math.sin(lf / 20) * 8;
      const sc = 1.32 * (0.85 + 0.15 * inP);
      const half = (sign: number, slice: boolean) => (
        <g transform={`rotate(${sign * open} 300 300)`}>
          <path d={`M300 300 L530 ${300 - sign * 15} C545 ${300 - sign * 6} 545 ${300 + sign * 4} 530 ${300 + sign * 9} Z`} fill={slice ? "#3b4148" : "url(#ssChrome)"} stroke={slice ? "none" : "#4b525a"} strokeWidth="2" />
          {!slice && <path d={`M300 300 L530 ${300 - sign * 15} C545 ${300 - sign * 6} 545 ${300 + sign * 4} 530 ${300 + sign * 9} Z`} fill="url(#ssSweep)" />}
          {!slice && <path d={`M310 ${300 - sign * 2} L525 ${300 - sign * 12}`} stroke="#fff" strokeOpacity="0.8" strokeWidth="2" />}
          <path d={`M300 300 L196 ${300 + sign * 66}`} stroke={slice ? "#3b4148" : "url(#ssChrome)"} strokeWidth="22" strokeLinecap="round" />
          <circle cx="150" cy={300 + sign * 96} r="50" fill="none" stroke={slice ? "#26310a" : "#1a1a1a"} strokeWidth="30" />
          {!slice && <circle cx="150" cy={300 + sign * 96} r="50" fill="none" stroke={glow} strokeWidth="22" />}
          {!slice && <path d={`M112 ${300 + sign * 80} A44 44 0 0 1 162 ${300 + sign * 52}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="7" strokeLinecap="round" fill="none" />}
        </g>
      );
      const body = (slice: boolean) => (
        <>
          {half(1, slice)}
          {half(-1, slice)}
          {!slice && (
            <>
              <circle cx="300" cy="300" r="16" fill="url(#ssScrew)" stroke="#2f3439" strokeWidth="2" />
              <path d="M293 300 h14" stroke="#2f3439" strokeWidth="3" />
            </>
          )}
        </>
      );
      // kalinlik: arka dilimler donus yonune gore kayar (her acida hacim)
      const depth = [4, 3, 2, 1].map((i) => (
        <g key={i} transform={`translate(${-s * i * 3.2} ${i * 0.8})`} opacity={0.9}>
          {body(true)}
        </g>
      ));
      return wrap(
        <>
          <defs>
            <linearGradient id="ssChrome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.35" stopColor="#c9d0d8" />
              <stop offset="0.5" stopColor="#6c757f" />
              <stop offset="0.65" stopColor="#e9edf1" />
              <stop offset="1" stopColor="#8a939d" />
            </linearGradient>
            <linearGradient id="ssSweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset={sweep - 0.08} stopColor="#fff" stopOpacity="0" />
              <stop offset={sweep} stopColor="#fff" stopOpacity={0.5 + 0.4 * Math.abs(c)} />
              <stop offset={sweep + 0.08} stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="ssScrew" cx="0.35" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#9aa3ad" />
              <stop offset="1" stopColor="#3d434a" />
            </radialGradient>
            <filter id="ssBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <radialGradient id="ssHalo">
              <stop offset="0" stopColor={glow} stopOpacity="0.22" />
              <stop offset="1" stopColor={glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="290" r="290" fill="url(#ssHalo)" />
          {/* yer golgesi: donusle daralip genisler */}
          <ellipse cx="300" cy="560" rx={60 + 170 * Math.abs(sx)} ry="22" fill="#000" opacity={0.32 * inP} filter="url(#ssBlur)" />
          <g opacity={inP} transform={`translate(300 ${290 + float + (1 - inP) * 120}) scale(${sx * sc} ${0.94 * sc}) rotate(-32) translate(-300 -300)`}>
            {depth}
            {body(false)}
          </g>
          {/* kapanislarda bıçak ucunda kucuk parlama */}
          {[0, 1, 2].map((k) => {
            const h = interpolate(lf, [k1 + 3 + k * 8, k1 + 5 + k * 8, k1 + 11 + k * 8], [0, 1, 0], cl);
            const tipX = 300 + Math.cos((-32 * Math.PI) / 180) * 235 * sx * sc, tipY = 290 + float + Math.sin((-32 * Math.PI) / 180) * 235 * 0.94 * sc;
            return h > 0 ? <path key={k} d={`M${tipX} ${tipY - 26 * h} V${tipY + 26 * h} M${tipX - 26 * h} ${tipY} H${tipX + 26 * h}`} stroke={dark ? "#fff" : glow} strokeWidth="6" strokeLinecap="round" opacity={h} /> : null;
          })}
        </>
      );
    }

    /* tek sac teli + koruyan kalkan (zarar vermeden) */
    case "strand": {
      const d = "M120 470 C200 470 210 330 300 300 C390 270 400 150 480 130";
      const draw = P(lf, 0, 26, io);
      const shieldD = "M300 90 L450 140 L440 330 C430 420 370 480 300 515 C230 480 170 420 160 330 L150 140 Z";
      const s = P(lf, k1 - 4, k1 + 22, io);
      const check = P(lf, k1 + 16, k1 + 30, io);
      const L = getLength(d);
      // vurus bir kare once cizilebilir (lf = -1): uzunluk negatif olmasin
      const tpos = getPointAtLength(d, L * ((Math.max(0, lf) % 50) / 50)) ?? { x: 0, y: 0 };
      return wrap(
        <>
          <defs>
            <linearGradient id="strG" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor={HAIR_MID} />
              <stop offset="1" stopColor={HAIR_LIGHT} />
            </linearGradient>
          </defs>
          <path d={shieldD} fill={glow} fillOpacity={0.12 * s} stroke={glow} strokeWidth="10" strokeLinejoin="round" {...evolvePath(s, shieldD)} />
          <path d={d} stroke="url(#strG)" strokeWidth="30" strokeLinecap="round" fill="none" {...evolvePath(draw, d)} />
          {draw >= 1 && <circle cx={tpos.x} cy={tpos.y} r="10" fill="#fff" opacity="0.85" />}
          <path d="M255 410 L292 445 L360 372" stroke={dark ? "#fff" : accent} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" {...evolvePath(check, "M255 410 L292 445 L360 372")} />
        </>
      );
    }

    /* yipranmis sac teli: uc kirilir, catallanir, rengi soner (yipranma korkusu) */
    case "frayed": {
      const d = "M120 150 C220 150 230 290 300 320 C370 350 380 450 450 470";
      const draw = P(lf, 0, 24, io);
      const split = P(lf, k1 - 16, k1 + 10, io);
      const tips = [-38, -18, 4, 24, 44];
      return wrap(
        <>
          <defs>
            <linearGradient id="frG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={HAIR_MID} />
              <stop offset="1" stopColor="#a89480" />
            </linearGradient>
          </defs>
          <circle cx="300" cy="320" r="250" fill={glow} opacity="0.06" />
          <path d={d} stroke="url(#frG)" strokeWidth="28" strokeLinecap="round" fill="none" {...evolvePath(draw, d)} />
          {/* catallanan uclar */}
          {tips.map((a, i) => {
            const len = 70 + (i % 2) * 30;
            const rad = ((30 + a * split) * Math.PI) / 180;
            const x2 = 450 + Math.cos(rad) * len * split, y2 = 470 + Math.sin(rad) * len * split;
            return <path key={i} d={`M440 466 Q${(440 + x2) / 2 + a * 0.4} ${(466 + y2) / 2} ${x2} ${y2}`} stroke="#b8a48e" strokeWidth={7 - Math.abs(i - 2)} strokeLinecap="round" fill="none" opacity={split} />;
          })}
          {/* kopan kucuk parcalar */}
          {[0, 1, 2].map((i) => {
            const f = interpolate(lf, [k1 + i * 6, k1 + 40 + i * 6], [0, 1], cl);
            return f > 0 && f < 1 ? <path key={i} d={`M${500 + i * 18} ${500 + f * 90} l12 10`} stroke="#b8a48e" strokeWidth="5" strokeLinecap="round" opacity={1 - f} /> : null;
          })}
          {/* uyari halkasi */}
          <circle cx="470" cy="490" r={60 + 30 * split} fill="none" stroke={dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.15)"} strokeWidth="3" strokeDasharray="10 14" opacity={split} transform={`rotate(${lf * 1.5} 470 490)`} />
        </>
      );
    }

    /* 30 gun dolan takvim (1 ay boyunca) */
    case "calendar": {
      const fill = interpolate(lf, [k1 - 4, k1 + 30], [0, 30], cl);
      return wrap(
        <>
          <rect x="90" y="90" width="420" height="440" rx="44" fill={dark ? "rgba(255,255,255,0.1)" : "#fff"} stroke={soft} strokeWidth="3" />
          <path d="M90 134 a44 44 0 0 1 44 -44 h332 a44 44 0 0 1 44 44 v46 h-420 Z" fill={dark ? glow : accent} />
          {[200, 400].map((x) => (
            <rect key={x} x={x - 9} y="60" width="18" height="64" rx="9" fill={line} />
          ))}
          {Array.from({ length: 30 }).map((_, i) => {
            const c = i % 6, r = Math.floor(i / 6);
            const on = interpolate(fill, [i, i + 1], [0, 1], cl);
            return (
              <circle key={i} cx={145 + c * 62} cy={235 + r * 62} r={18 + 4 * on} fill={on > 0 ? (dark ? glow : accent) : soft} opacity={0.25 + 0.75 * on} />
            );
          })}
        </>
      );
    }

    /* sac tutami: teknige gore boya deseni degisir */
    case "lock": {
      const idx = p.seqIdx ?? 0;
      const cf = P(lf, p.seqF ?? 0, (p.seqF ?? 0) + 12, io);
      const tuft = "M300 40 C240 40 225 120 225 200 C225 300 240 420 255 520 C262 560 285 585 300 585 C315 585 338 560 345 520 C360 420 375 300 375 200 C375 120 360 40 300 40 Z";
      const fills = (k: number) => {
        if (k === 0) return { g: [HAIR_DARK, HAIR_DARK, HAIR_MID, HAIR_LIGHT], o: [0, 0.42, 0.58, 0.8] };
        if (k === 1) return { g: [HAIR_DARK, "#4a2e20", HAIR_MID, "#b88a58"], o: [0, 0.3, 0.7, 1] };
        return { g: [HAIR_DARK, "#3a241a", "#5b3a26", "#6b4430"], o: [0, 0.3, 0.7, 1] };
      };
      const layer = (k: number, op: number) => {
        const f = fills(k);
        return (
          <g opacity={op} key={k}>
            <defs>
              <linearGradient id={`lk${k}`} x1="0" y1="0" x2="0" y2="1">
                {f.g.map((c, i) => (
                  <stop key={i} offset={f.o[i]} stopColor={c} />
                ))}
              </linearGradient>
              <linearGradient id={`fade${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={HAIR_LIGHT} stopOpacity="0" />
                <stop offset="0.35" stopColor={HAIR_LIGHT} stopOpacity="0.9" />
                <stop offset="1" stopColor={HAIR_LIGHT} stopOpacity="1" />
              </linearGradient>
              <clipPath id="tuftClip">
                <path d={tuft} />
              </clipPath>
            </defs>
            <path d={tuft} fill={`url(#lk${k})`} />
            <g clipPath="url(#tuftClip)">
              {k === 2 && // balyaj: elle boyanmis genis firca darbeleri
                [250, 292, 334].map((x, i) => <path key={i} d={`M${x} 140 C${x + 10} 300 ${x - 12} 420 ${x + 4} 600`} stroke={`url(#fade${k})`} strokeWidth={26 - i * 3} strokeLinecap="round" fill="none" />)}
              {k === 3 && // rofle: kokten itibaren ince, duzenli citalar
                Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M${246 + i * 27} 70 C${250 + i * 26} 260 ${242 + i * 26} 420 ${258 + i * 21} 600`} stroke={HAIR_LIGHT} strokeOpacity={0.55 + 0.1 * (i % 2)} strokeWidth="7" strokeLinecap="round" fill="none" />)}
            </g>
          </g>
        );
      };
      const prev = Math.max(0, idx - 1);
      const sway = Math.sin(lf / 18) * 2.5;
      return wrap(
        <g transform={`rotate(${sway} 300 60)`}>
          <circle cx="300" cy="320" r="250" fill={glow} opacity={0.1} />
          {idx > 0 && layer(prev, 1 - cf)}
          {layer(idx, idx > 0 ? cf : 1)}
          <path d={tuft} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="3" />
          <rect x="262" y="26" width="76" height="34" rx="12" fill={dark ? "#fff" : accent} />
        </g>
      );
    }

    /* iki tel arasinda bag kurulur (bag guclendirici bakim) */
    case "bond": {
      const a = "M220 40 C180 160 260 280 220 400 C190 490 230 540 220 580";
      const b = "M380 40 C420 160 340 280 380 400 C410 490 370 540 380 580";
      const draw = P(lf, 0, 24, io);
      const ys = [110, 190, 270, 350, 430, 510];
      return wrap(
        <>
          <path d={a} stroke={HAIR_MID} strokeWidth="26" strokeLinecap="round" fill="none" {...evolvePath(draw, a)} />
          <path d={b} stroke={HAIR_LIGHT} strokeWidth="26" strokeLinecap="round" fill="none" {...evolvePath(draw, b)} />
          {ys.map((y, i) => {
            const t = y / 600;
            const pa = getPointAtLength(a, getLength(a) * t) ?? { x: 220, y }, pb = getPointAtLength(b, getLength(b) * t) ?? { x: 380, y };
            const on = P(lf, k1 - 10 + i * 5, k1 - 2 + i * 5, io);
            const mx = pa.x + (pb.x - pa.x) * on;
            return (
              <g key={i}>
                <line x1={pa.x} y1={pa.y} x2={mx} y2={pa.y + (pb.y - pa.y) * on} stroke={glow} strokeWidth="8" strokeLinecap="round" opacity={on} />
                <circle cx={pa.x} cy={pa.y} r={12 * on} fill={glow} />
                <circle cx={pb.x} cy={pb.y} r={12 * on} fill={glow} opacity={on > 0.95 ? 1 : 0} />
              </g>
            );
          })}
        </>
      );
    }

    /* makas acilip kapanir, uclar dokulur (sac kesimi) */
    case "scissors": {
      const snip = (f: number) => interpolate(f, [0, 6, 12], [1, 0, 1], cl);
      const s1 = lf >= k1 - 6 && lf < k1 + 6 ? snip(lf - (k1 - 6)) : lf >= k1 + 10 && lf < k1 + 22 ? snip(lf - (k1 + 10)) : 1;
      const open = 16 * s1;
      const blade = (sign: number) => (
        <g transform={`rotate(${sign * open} 300 300)`}>
          <path d={`M300 300 L${505} ${300 + sign * -14} C515 ${300 + sign * -4} 515 ${300 + sign * 4} 505 ${300 + sign * 8} Z`} fill={line} />
          <path d={`M300 300 L190 ${300 + sign * 70}`} stroke={line} strokeWidth="20" strokeLinecap="round" />
          <circle cx="150" cy={300 + sign * 95} r="48" fill="none" stroke={dark ? glow : accent} strokeWidth="18" />
        </g>
      );
      return wrap(
        <>
          {/* kesilen uclar */}
          {[0, 1, 2, 3, 4].map((i) => {
            const fall = interpolate(lf, [k1 + i * 3, k1 + 40 + i * 3], [0, 1], cl);
            return fall > 0 ? (
              <path key={i} d={`M${510 + i * 14} ${290 + fall * 230} c6 14 -4 26 2 40`} stroke={i % 2 ? HAIR_LIGHT : HAIR_MID} strokeWidth="5" strokeLinecap="round" fill="none" opacity={1 - fall * 0.8} transform={`rotate(${(i - 2) * 12 * fall} ${510 + i * 14} ${300 + fall * 230})`} />
            ) : null;
          })}
          <g transform="rotate(-18 300 300)">
            {blade(1)}
            {blade(-1)}
            <circle cx="300" cy="300" r="12" fill={dark ? glow : accent} />
          </g>
        </>
      );
    }

    /* hediye kutusu acilir */
    case "gift": {
      const lid = P(lf, 8, 30, Easing.bezier(0.34, 1.4, 0.64, 1));
      const light = P(lf, 16, 40);
      return wrap(
        <>
          <defs>
            <radialGradient id="giftL" cx="0.5" cy="1" r="0.8">
              <stop offset="0" stopColor={glow} stopOpacity={0.75 * light} />
              <stop offset="1" stopColor={glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={`M200 300 L120 ${40 - 30 * light} L480 ${40 - 30 * light} L400 300 Z`} fill="url(#giftL)" />
          <rect x="150" y="300" width="300" height="250" rx="22" fill={accent} />
          <rect x="282" y="300" width="36" height="250" fill={glow} />
          <g transform={`translate(0 ${-110 * lid}) rotate(${-14 * lid} 450 290)`}>
            <rect x="130" y="250" width="340" height="70" rx="18" fill={accent} style={{ filter: "brightness(1.15)" }} />
            <rect x="282" y="250" width="36" height="70" fill={glow} />
            <path d="M300 250 C250 190 210 220 240 250 M300 250 C350 190 390 220 360 250" stroke={glow} strokeWidth="16" fill="none" strokeLinecap="round" />
          </g>
          {[0, 1, 2].map((i) => {
            const sp = P(lf, 22 + i * 5, 34 + i * 5);
            const x = [210, 300, 395][i], y = [150, 90, 140][i];
            return <path key={i} d={`M${x} ${y - 18} V${y + 18} M${x - 18} ${y} H${x + 18}`} stroke={glow} strokeWidth="6" strokeLinecap="round" opacity={sp} transform={`rotate(${lf * 2} ${x} ${y}) scale(1)`} />;
          })}
        </>
      );
    }

    /* asili fiyat etiketi (deger) */
    case "tag": {
      const swing = Math.sin(lf / 9) * 9 * Math.exp(-lf / 60) + Math.sin(lf / 20) * 2;
      return wrap(
        <g transform={`rotate(${swing} 300 40)`}>
          <path d="M300 40 L300 150" stroke={line} strokeWidth="5" />
          <path d="M300 150 L410 230 L410 520 C410 540 395 555 375 555 L225 555 C205 555 190 540 190 520 L190 230 Z" fill={dark ? glow : accent} />
          <circle cx="300" cy="215" r="20" fill={dark ? "#1a0a0d" : "#f7f5f1"} />
          <text x="300" y="400" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="92" fill={dark ? "#1a0a0d" : "#fff"}>
            ₺
          </text>
        </g>
      );
    }

    /* madeni para duser, ustu cizilir (tek kurus almiyoruz) */
    case "coin": {
      const drop = interpolate(lf, [0, 18], [-220, 0], { ...cl, easing: Easing.bezier(0.5, 0, 0.75, 0) });
      const bounce = lf > 18 ? Math.abs(Math.sin((lf - 18) / 4)) * 18 * Math.exp(-(lf - 18) / 10) : 0;
      const spin = Math.cos(lf / 5) * 0.25 + 0.75;
      const strike = P(lf, k1 + 2, k1 + 14, io);
      return wrap(
        <>
          <ellipse cx="300" cy="520" rx={140 * (1 - bounce / 60)} ry="18" fill="#000" opacity={dark ? 0.35 : 0.08} />
          <g transform={`translate(0 ${drop - bounce})`}>
            <g transform={`translate(300 300) scale(${spin} 1) translate(-300 -300)`}>
              <circle cx="300" cy="300" r="170" fill={glow} />
              <circle cx="300" cy="300" r="138" fill="none" stroke="#b8862f" strokeWidth="8" />
              <text x="300" y="352" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="150" fill="#9c6d1f">
                ₺
              </text>
            </g>
          </g>
          {p.variant === "return" ? (
            // iade: paranin etrafinda geri donen ok (ustu cizilmez - "ucretsiz" degil "geri odeme")
            (() => {
              const arc = "M300 80 A220 220 0 1 1 82 330";
              const k = P(lf, k1 - 4, k1 + 22, io);
              const tip = getPointAtLength(arc, getLength(arc) * Math.max(0.001, k)) ?? { x: 82, y: 330 };
              return (
                <>
                  <path d={arc} stroke={dark ? "#fff" : accent} strokeWidth="18" strokeLinecap="round" fill="none" {...evolvePath(k, arc)} />
                  {k > 0.05 && <path d={`M${tip.x - 34} ${tip.y - 10} L${tip.x} ${tip.y + 18} L${tip.x + 26} ${tip.y - 22}`} stroke={dark ? "#fff" : accent} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={k} />}
                </>
              );
            })()
          ) : (
            <path d="M110 490 L490 110" stroke={dark ? "#fff" : accent} strokeWidth="22" strokeLinecap="round" {...evolvePath(strike, "M110 490 L490 110")} />
          )}
        </>
      );
    }

    /* telefonda WhatsApp konusmasi */
    case "chat": {
      const b1 = P(lf, 6, 20), typing = lf > 20 && lf < k1 + 4, b2 = P(lf, k1 + 4, k1 + 18);
      // balon genisligi metne gore (telefon ekranindan tasmasin); bizim mesajlar saga yasli
      const bubble = (_x: number, y: number, _w: number, text: string, me: boolean, pp: number) => {
        const w = Math.min(290, text.length * 11.6 + 40);
        const x = me ? 466 - w : 134;
        return (
        <g opacity={pp} transform={`translate(0 ${(1 - pp) * 20})`}>
          <rect x={x} y={y} width={w} height="60" rx="20" fill={me ? "#d9fdd3" : "#fff"} stroke="rgba(0,0,0,0.06)" />
          <text x={x + 20} y={y + 38} fontFamily={SANS} fontWeight={500} fontSize="21" fill="#1b1b1b">
            {text}
          </text>
        </g>
        );
      };
      return wrap(
        <>
          <rect x="110" y="20" width="380" height="560" rx="50" fill="#111" />
          <rect x="124" y="34" width="352" height="532" rx="38" fill="#efe7de" />
          <rect x="124" y="34" width="352" height="78" rx="38" fill="#128c7e" />
          <rect x="124" y="80" width="352" height="32" fill="#128c7e" />
          <circle cx="168" cy="78" r="20" fill="#fff" opacity="0.9" />
          <text x="198" y="86" fontFamily={SANS} fontWeight={700} fontSize="24" fill="#fff">
            {p.brandName ?? ""}
          </text>
          {bubble(0, 140, 0, "Merhaba,", true, b1)}
          {bubble(0, 208, 0, "kampanya için yazıyorum", true, b1)}
          {typing && (
            <g>
              <rect x="134" y="296" width="96" height="52" rx="22" fill="#fff" />
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={160 + i * 22} cy="322" r="7" fill="#999" opacity={0.4 + 0.6 * Math.abs(Math.sin((lf + i * 4) / 5))} />
              ))}
            </g>
          )}
          {bubble(0, 296, 0, "Hoş geldiniz!", false, b2)}
          {bubble(0, 364, 0, "Hemen bilgi verelim.", false, b2)}
        </>
      );
    }

    // ================= GENEL SET (her sektor) – ayni dil: sade vektor, marka rengi + vurgu, tetik k1'de =================

    /* yuzde rozeti: daire cizilir, "%" yerine oturur, k1'de etrafinda pariltilar (indirim) */
    case "percent": {
      const ring = P(lf, 0, 22, io);
      const sign = P(lf, k1 - 6, k1 + 10);
      const spark = P(lf, k1 + 4, k1 + 22);
      const c = "M300 90 A210 210 0 1 1 299.9 90";
      return wrap(
        <>
          <circle cx="300" cy="300" r="250" fill={glow} opacity={0.08} />
          <circle cx="300" cy="300" r="210" fill={dark ? accent : glow} opacity={0.9 * ring} />
          <path d={c} stroke={dark ? glow : accent} strokeWidth="14" fill="none" {...evolvePath(ring, c)} />
          <g opacity={sign} transform={`translate(300 300) scale(${0.7 + 0.3 * sign}) rotate(${(1 - sign) * -20}) translate(-300 -300)`}>
            <circle cx="225" cy="225" r="42" fill="none" stroke={dark ? "#fff" : accent} strokeWidth="22" />
            <circle cx="375" cy="375" r="42" fill="none" stroke={dark ? "#fff" : accent} strokeWidth="22" />
            <path d="M390 200 L210 400" stroke={dark ? "#fff" : accent} strokeWidth="24" strokeLinecap="round" />
          </g>
          {[0, 1, 2, 3].map((i) => {
            const a = (i * Math.PI) / 2 + Math.PI / 4, r = 250 + 30 * spark;
            const x = 300 + Math.cos(a) * r, y = 300 + Math.sin(a) * r;
            return <path key={i} d={`M${x} ${y - 16} V${y + 16} M${x - 16} ${y} H${x + 16}`} stroke={glow} strokeWidth="6" strokeLinecap="round" opacity={spark * (1 - 0.5 * P(lf, k1 + 30, k1 + 60))} />;
          })}
        </>
      );
    }

    /* saat: kadran cizilir, akrep/yelkovan doner, k1'de yelkovan hizlanip durur (zaman, hiz) */
    case "clock": {
      const draw = P(lf, 0, 22, io);
      const c = "M300 110 A190 190 0 1 1 299.9 110";
      const spin = interpolate(lf, [0, k1, k1 + 24], [0, 90, 450], { ...cl, easing: Easing.bezier(0.3, 0, 0.2, 1) });
      return wrap(
        <>
          <circle cx="300" cy="300" r="250" fill={glow} opacity={0.08} />
          <circle cx="300" cy="300" r="190" fill={dark ? "rgba(255,255,255,0.08)" : "#fff"} opacity={draw} />
          <path d={c} stroke={dark ? glow : accent} strokeWidth="16" fill="none" {...evolvePath(draw, c)} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6;
            return <line key={i} x1={300 + Math.cos(a) * 160} y1={300 + Math.sin(a) * 160} x2={300 + Math.cos(a) * (i % 3 ? 172 : 150)} y2={300 + Math.sin(a) * (i % 3 ? 172 : 150)} stroke={line} strokeWidth={i % 3 ? 4 : 8} strokeLinecap="round" opacity={draw} />;
          })}
          <line x1="300" y1="300" x2="300" y2="200" stroke={line} strokeWidth="14" strokeLinecap="round" transform={`rotate(${spin / 12 + 60} 300 300)`} opacity={draw} />
          <line x1="300" y1="300" x2="300" y2="160" stroke={dark ? glow : accent} strokeWidth="9" strokeLinecap="round" transform={`rotate(${spin} 300 300)`} opacity={draw} />
          <circle cx="300" cy="300" r="14" fill={dark ? glow : accent} />
        </>
      );
    }

    /* konum pini: yukaridan duser, zemine oturur, k1'de etrafinda halka yayilir (adres, sube) */
    case "pin": {
      const drop = interpolate(lf, [0, 16], [-260, 0], { ...cl, easing: Easing.bezier(0.5, 0, 0.75, 0) });
      const bounce = lf > 16 ? Math.abs(Math.sin((lf - 16) / 4)) * 22 * Math.exp(-(lf - 16) / 9) : 0;
      const wave = (lf - k1) % 45;
      const w = lf >= k1 ? interpolate(wave, [0, 45], [0, 1], cl) : 0;
      const pinD = "M300 520 C230 420 170 350 170 260 C170 185 230 125 300 125 C370 125 430 185 430 260 C430 350 370 420 300 520 Z";
      return wrap(
        <>
          <ellipse cx="300" cy="530" rx={80 + 170 * w} ry={18 + 38 * w} fill="none" stroke={dark ? glow : accent} strokeWidth="5" opacity={(1 - w) * 0.8} />
          <ellipse cx="300" cy="530" rx="70" ry="16" fill="#000" opacity={dark ? 0.35 : 0.1} />
          <g transform={`translate(0 ${drop - bounce})`}>
            <path d={pinD} fill={dark ? glow : accent} />
            <circle cx="300" cy="262" r="58" fill={dark ? "#1a0a0d" : "#f7f5f1"} />
          </g>
        </>
      );
    }

    /* telefon: kayarak gelir, k1'de titrer ve arama dalgalari yayilir (bizi arayin) */
    case "phone": {
      const ring = lf >= k1 && lf < k1 + 36;
      const shake = ring ? Math.sin(lf * 2.2) * 6 : 0;
      const wave = ring ? ((lf - k1) % 18) / 18 : 0;
      return wrap(
        <>
          {[0, 1].map((i) => {
            const r = 120 + (wave + i * 0.5) * 120;
            return ring ? <path key={i} d={`M${300 + r * 0.7} ${300 - r * 0.7} A${r} ${r} 0 0 1 ${300 + r * 0.7} ${300 + r * 0.7}`} stroke={dark ? glow : accent} strokeWidth="10" strokeLinecap="round" fill="none" opacity={1 - ((wave + i * 0.5) % 1)} /> : null;
          })}
          <g transform={`rotate(${shake} 300 300)`}>
            <rect x="190" y="80" width="220" height="440" rx="40" fill={line} />
            <rect x="204" y="100" width="192" height="384" rx="28" fill={dark ? accent : "#f7f5f1"} />
            <rect x="265" y="108" width="70" height="16" rx="8" fill={line} />
            <circle cx="300" cy="300" r="56" fill="#25D366" opacity={P(lf, 8, 20)} />
            <path d="M278 278 c0 30 14 44 44 44 l8 -14 -16 -10 -8 8 c-10 -4 -18 -12 -22 -22 l8 -8 -10 -16 Z" fill="#fff" opacity={P(lf, 8, 20)} />
          </g>
        </>
      );
    }

    /* yildizlar: 5 yildiz sirayla dolar (yorum, memnuniyet, kalite) */
    case "star": {
      const starD = (cx: number, cy: number, r: number) =>
        Array.from({ length: 10 })
          .map((_, i) => {
            const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
            return `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
          })
          .join(" ") + " Z";
      return wrap(
        <>
          <circle cx="300" cy="300" r="270" fill={glow} opacity={0.07} />
          <rect x="20" y="220" width="560" height="160" rx="80" fill={dark ? "rgba(255,255,255,0.08)" : "#fff"} stroke={soft} strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((i) => {
            const on = P(lf, k1 - 12 + i * 4, k1 - 2 + i * 4, Easing.bezier(0.34, 1.5, 0.64, 1));
            const cx = 92 + i * 104;
            return (
              <g key={i}>
                <path d={starD(cx, 300, 50)} fill={soft} />
                <path d={starD(cx, 300, 50)} fill={glow} transform={`translate(${cx} 300) scale(${on}) translate(${-cx} -300)`} />
              </g>
            );
          })}
        </>
      );
    }

    /* onay listesi: 3 satir, k1'den itibaren tikler sirayla atilir (garanti, guven, adimlar) */
    case "check": {
      return wrap(
        <>
          <rect x="110" y="90" width="380" height="420" rx="40" fill={dark ? "rgba(255,255,255,0.08)" : "#fff"} stroke={soft} strokeWidth="3" />
          {[0, 1, 2].map((i) => {
            const y = 180 + i * 120;
            const t = P(lf, k1 - 8 + i * 7, k1 + 4 + i * 7, io);
            const tick = `M162 ${y} l22 22 l40 -44`;
            return (
              <g key={i}>
                <circle cx="190" cy={y} r="34" fill={t > 0 ? (dark ? glow : accent) : soft} opacity={0.3 + 0.7 * t} />
                <path d={tick} stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" {...evolvePath(t, tick)} />
                <rect x="250" y={y - 12} width={190 - i * 30} height="24" rx="12" fill={line} opacity={0.18 + 0.2 * t} />
              </g>
            );
          })}
        </>
      );
    }

    /* musteri izgarasi: 30 kisi ikonu k1'den itibaren sirayla dolar (yeni musteri, danisan, kitle) */
    case "people": {
      const N = 30, cols = 6;
      return wrap(
        <>
          <circle cx="300" cy="300" r="270" fill={glow} opacity={0.07} />
          {Array.from({ length: N }).map((_, i) => {
            const c = i % cols, r = Math.floor(i / cols);
            const x = 95 + c * 82, y = 120 + r * 92;
            const on = P(lf, k1 - 6 + i * 0.9, k1 + 2 + i * 0.9, Easing.bezier(0.34, 1.5, 0.64, 1));
            const col = on > 0.02 ? (dark ? glow : accent) : soft;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * on}) translate(${-x} ${-y})`} opacity={0.35 + 0.65 * on}>
                <circle cx={x} cy={y - 14} r="15" fill={col} />
                <path d={`M${x - 24} ${y + 30} C${x - 24} ${y + 6} ${x - 12} ${y + 4} ${x} ${y + 4} C${x + 12} ${y + 4} ${x + 24} ${y + 6} ${x + 24} ${y + 30} Z`} fill={col} />
              </g>
            );
          })}
        </>
      );
    }

    /* sosyal medya gonderisi: seqIdx 0 = hazirlaniyor (gorsel cizilir), 1 = yayinda (rozet + begeniler) */
    case "post": {
      const live = (p.seqIdx ?? 0) >= 1;
      const lv = live ? P(lf, p.seqF ?? 0, (p.seqF ?? 0) + 14) : 0;
      const img = P(lf, 4, 30, io);
      const ink = dark ? "#fff" : "#1b1b1b";
      const card = dark ? "#1f1f1f" : "#fff";
      const wave = "M150 330 C200 290 240 300 280 320 C330 345 380 300 450 280 L450 400 L150 400 Z";
      return wrap(
        <>
          <circle cx="300" cy="300" r="270" fill={glow} opacity={0.07} />
          <rect x="120" y="40" width="360" height="520" rx="34" fill={card} stroke={soft} strokeWidth="3" />
          <circle cx="166" cy="92" r="22" fill={dark ? glow : accent} />
          <rect x="200" y="78" width="120" height="14" rx="7" fill={ink} opacity="0.8" />
          <rect x="200" y="100" width="76" height="10" rx="5" fill={ink} opacity="0.35" />
          {/* gorsel alani: hazirlanirken kesik cerceve icinde cizilir */}
          <rect x="150" y="140" width="300" height="260" rx="14" fill={dark ? accent : "#f1ece4"} stroke={live ? "none" : ink} strokeOpacity="0.35" strokeWidth="4" strokeDasharray={live ? "0" : "14 10"} />
          <circle cx="380" cy="200" r={34 * img} fill={glow} />
          <path d={wave} fill={dark ? glow : accent} opacity={0.85 * img} transform={`translate(0 ${(1 - img) * 60})`} />
          {/* yayinda rozeti */}
          <g opacity={lv} transform={`translate(0 ${(1 - lv) * 14})`}>
            <rect x="330" y="72" width="128" height="40" rx="20" fill={dark ? glow : accent} />
            <circle cx="352" cy="92" r="7" fill={dark ? "#0b0b0b" : "#fff"} opacity={0.5 + 0.5 * Math.abs(Math.sin(lf / 6))} />
            <text x="368" y="100" fontFamily={SANS} fontWeight={700} fontSize="21" fill={dark ? "#0b0b0b" : "#fff"}>Yayında</text>
          </g>
          {/* alt satir: begeni + yorum + paylas ikonlari */}
          <path d="M168 452 c0 -14 18 -20 24 -6 c6 -14 24 -8 24 6 c0 16 -24 28 -24 28 c0 0 -24 -12 -24 -28 Z" fill={live ? "#ff3b5c" : "none"} stroke={live ? "#ff3b5c" : ink} strokeWidth="4" />
          <rect x="236" y="444" width="32" height="26" rx="10" fill="none" stroke={ink} strokeWidth="4" />
          <path d="M292 470 L330 446 L300 446" stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="168" y="494" width={60 + 140 * lv} height="14" rx="7" fill={ink} opacity="0.55" />
          {/* yukari suzulen kalpler */}
          {live &&
            [0, 1, 2, 3, 4].map((i) => {
              const f = interpolate(lf - (p.seqF ?? 0), [6 + i * 5, 36 + i * 5], [0, 1], cl);
              if (f <= 0 || f >= 1) return null;
              const x = 470 + Math.sin(i * 2.1 + f * 4) * 24, y = 440 - f * 300;
              return <path key={i} d={`M${x} ${y} c0 -9 12 -13 16 -4 c4 -9 16 -5 16 4 c0 11 -16 19 -16 19 c0 0 -16 -8 -16 -19 Z`} fill="#ff3b5c" opacity={1 - f} />;
            })}
        </>
      );
    }

    /* SES -> VIDEO (2026-11-19): ses dalgasi cubuklari titresir, sonra ortada toplanip kaybolur; yerine 9:16 video
       karti cizilir + oynat dugmesi; k1'de kosede tik rozeti + halka. ("sesinden animasyon", "ses kaydindan video") */
    case "voice": {
      const ink = dark ? "#fff" : "#1b1b1b";
      const col = dark ? glow : accent;
      const gather = P(lf, 34, 62, io);
      const card = P(lf, 40, 70);
      const cardD = "M222 110 H378 Q410 110 410 142 V458 Q410 490 378 490 H222 Q190 490 190 458 V142 Q190 110 222 110 Z";
      const play = P(lf, 56, 74, Easing.bezier(0.34, 1.4, 0.64, 1));
      const badge = P(lf, k1, k1 + 12, Easing.bezier(0.34, 1.5, 0.64, 1));
      const ring = interpolate(lf - k1, [0, 30], [0, 1], cl);
      const N = 11;
      const tickD = "M378 122 L393 137 L420 108";
      return wrap(
        <>
          <circle cx="300" cy="300" r="270" fill={glow} opacity={0.07} />
          <g opacity={card} transform={`translate(300 300) scale(${0.86 + 0.14 * card}) translate(-300 -300)`}>
            <ellipse cx="300" cy="528" rx="120" ry="16" fill="#000" opacity={0.18} />
            <path d={cardD} fill={dark ? "#141414" : "#fff"} />
            <path d={cardD} fill="none" stroke={col} strokeWidth="6" {...evolvePath(P(lf, 40, 72, io), cardD)} />
            <rect x="222" y="402" width={110 * P(lf, 62, 80)} height="14" rx="7" fill={ink} opacity="0.75" />
            <rect x="222" y="428" width={70 * P(lf, 66, 84)} height="12" rx="6" fill={ink} opacity="0.3" />
          </g>
          <g opacity={play} transform={`translate(300 270) scale(${play}) translate(-300 -270)`}>
            <circle cx="300" cy="270" r="54" fill={col} />
            <path d="M286 244 L322 270 L286 296 Z" fill={dark ? "#0b0b0b" : "#fff"} />
          </g>
          {Array.from({ length: N }).map((_, i) => {
            const c = (N - 1) / 2;
            const x0 = 300 + (i - c) * 40;
            const amp = 0.35 + 0.65 * Math.abs(Math.sin(lf / 5 + i * 0.9)) * (0.6 + 0.4 * Math.sin(i * 1.7) ** 2);
            const h0 = 40 + 190 * amp * (1 - Math.abs(i - c) / N);
            const x = x0 + (300 - x0) * gather;
            const h = h0 * (1 - gather) + 8 * gather;
            const o = P(lf, i * 1.5, 10 + i * 1.5) * (1 - P(lf, 52, 64));
            return o > 0 ? <rect key={i} x={x - 9} y={300 - h / 2} width="18" height={h} rx="9" fill={col} opacity={o} /> : null;
          })}
          {ring > 0 && ring < 1 && <circle cx="398" cy="122" r={46 + 60 * ring} fill="none" stroke={glow} strokeWidth="5" opacity={1 - ring} />}
          <g opacity={Math.min(1, badge * 1.4)} transform={`translate(398 122) scale(${badge}) translate(-398 -122)`}>
            <circle cx="398" cy="122" r="46" fill={glow} />
            <path d={tickD} stroke="#0b0b0b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" {...evolvePath(P(lf, k1 + 4, k1 + 14, io), tickD)} />
          </g>
        </>
      );
    }

    /* KLASOR (2026-11-19): klasor belirir, on kapak asagi dogru acilir (lf 22..40); k1'de dosya (".skill" etiketli kagit)
       yukaridan kapagin arkasina duser, klasor hafif cokup toparlanir, kapak kapanir, tik rozeti. ("klasore at", "dosyayi yukle") */
    case "folder": {
      const body = dark ? glow : accent;
      const bodyHi = dark ? "#e2ff8a" : "#3a3a3a";
      const stripe = dark ? "#0b0b0b" : glow;
      const open = P(lf, 22, 40, io) * (1 - P(lf, k1 + 22, k1 + 34, io));
      const appear = P(lf, k1 - 8, k1);
      const drop = P(lf, k1 - 4, k1 + 16, Easing.bezier(0.5, 0, 0.2, 1));
      const landT = lf - (k1 + 16);
      const bump = landT > 0 ? Math.sin(landT * 0.55) * 0.035 * Math.exp(-landT / 7) : 0;
      const badge = P(lf, k1 + 30, k1 + 42, Easing.bezier(0.34, 1.5, 0.64, 1));
      const ring = interpolate(lf - k1 - 30, [0, 30], [0, 1], cl);
      const paperY = -300 * (1 - drop);
      const tickD = "M428 168 L443 183 L470 154";
      return wrap(
        <g transform={`translate(300 490) scale(${1 + bump} ${1 - bump}) translate(-300 -490)`}>
          <circle cx="300" cy="300" r="270" fill={glow} opacity={0.07} />
          <ellipse cx="300" cy="512" rx="210" ry="20" fill="#000" opacity={0.16} />
          <defs>
            <linearGradient id="fldFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={bodyHi} />
              <stop offset="1" stopColor={body} />
            </linearGradient>
          </defs>
          {/* arka govde + sekme */}
          <rect x="130" y="158" width="150" height="70" rx="20" fill={body} />
          <rect x="130" y="190" width="340" height="300" rx="26" fill={body} />
          {/* ic yuz: kapak acilinca icerisi aydinlanir (acilma okunur) */}
          <rect x="146" y="206" width="308" height="268" rx="18" fill={dark ? "#000" : "#fff"} opacity={(dark ? 0.25 : 0.16) * open} />
          <rect x="146" y="206" width="308" height="268" rx="18" fill={glow} opacity={0.18 * open} />
          {/* dosya */}
          <g opacity={appear} transform={`translate(0 ${paperY}) rotate(${-7 * (1 - drop)} 300 280)`}>
            <path d="M206 150 H360 L396 186 V420 H206 Z" fill="#fff" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
            <path d="M360 150 V186 H396" fill="#ececec" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
            <rect x="228" y="200" width="124" height="46" rx="23" fill={glow} stroke="#0b0b0b" strokeWidth="2.5" />
            <text x="290" y="232" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="26" fill="#0b0b0b">.skill</text>
            <rect x="230" y="262" width="136" height="12" rx="6" fill="#1b1b1b" opacity="0.25" />
            <rect x="230" y="286" width="100" height="12" rx="6" fill="#1b1b1b" opacity="0.18" />
          </g>
          {/* on kapak: alttan mentese, acilinca basiklasir (izleyiciye dogru egilir) */}
          <g transform={`translate(300 490) scale(${1 + 0.06 * open} ${1 - 0.5 * open}) translate(-300 -490)`}>
            <rect x="120" y="246" width="360" height="244" rx="26" fill="url(#fldFront)" />
            <rect x="120" y="246" width="360" height="10" rx="5" fill={stripe} opacity="0.9" />
          </g>
          {ring > 0 && ring < 1 && <circle cx="448" cy="168" r={44 + 60 * ring} fill="none" stroke={glow} strokeWidth="5" opacity={1 - ring} />}
          <g opacity={Math.min(1, badge * 1.4)} transform={`translate(448 168) scale(${badge}) translate(-448 -168)`}>
            <circle cx="448" cy="168" r="44" fill={glow} stroke={dark ? "none" : "#0b0b0b"} strokeWidth="3" />
            <path d={tickD} stroke="#0b0b0b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" {...evolvePath(P(lf, k1 + 34, k1 + 44, io), tickD)} />
          </g>
        </g>
      );
    }

    /* UYGULAMA PENCERESI (2026-11-19): masaustu uygulama penceresi; k0'da (beat.artAt) ust sekmede "Code" secilir,
       k0+42'de yan panelde klasor acilir, k1'de giris kutusuna "dosyayı kur" yazilir, gonderilir, "Kuruluyor..." belirir.
       Marka logosu yok (genel arayuz). ("Code sekmesi", "klasoru ac", "yaz", komut) */
    case "appWindow": {
      const ink = dark ? "#fff" : "#1b1b1b";
      const win = dark ? "#1b1b1b" : "#fff";
      const panel = dark ? "#151515" : "#f3f1ec";
      const k0 = p.k0 ?? 20;
      const tab = P(lf, k0, k0 + 10, io);
      const fold = P(lf, k0 + 42, k0 + 56);
      const cmd = "dosyayı kur";
      const typed = Math.round(interpolate(lf, [k1, k1 + 18], [0, cmd.length], cl));
      const sent = P(lf, k1 + 24, k1 + 34, Easing.bezier(0.34, 1.3, 0.64, 1));
      const isSent = lf >= k1 + 24;
      const work = P(lf, k1 + 32, k1 + 42);
      const caret = !isSent && Math.floor(lf / 8) % 2 === 0;
      // pencere ekranda okunur buyuklukte olsun: 1.32 olcek (viewBox disina tasar, overflow gorunur)
      return wrap(
        <g transform="translate(300 300) scale(1.32) translate(-300 -300)">
          <circle cx="300" cy="300" r="280" fill={glow} opacity={0.07} />
          <ellipse cx="300" cy="526" rx="230" ry="18" fill="#000" opacity={0.18} />
          <rect x="40" y="80" width="520" height="420" rx="28" fill={win} stroke={dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"} strokeWidth="3" />
          {/* baslik cubugu */}
          {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => <circle key={c} cx={76 + i * 24} cy="110" r="8" fill={c} />)}
          <rect x="226" y="92" width="148" height="38" rx="19" fill={dark ? "#262626" : "#eeeae3"} />
          <rect x={230 + 70 * tab} y="96" width="70" height="30" rx="15" fill={tab > 0.5 ? glow : dark ? "#3a3a3a" : "#fff"} />
          <text x="265" y="118" textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize="18" fill={ink} opacity={1 - 0.45 * tab}>Chat</text>
          <text x="335" y="118" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="18" fill={tab > 0.5 ? "#0b0b0b" : ink} opacity={0.55 + 0.45 * tab}>Code</text>
          {/* yan panel */}
          <path d="M40 140 H190 V500 H68 Q40 500 40 472 Z" fill={panel} />
          {[0, 1, 2].map((i) => <rect key={i} x="62" y={232 + i * 34} width={[96, 74, 86][i]} height="11" rx="5.5" fill={ink} opacity="0.14" />)}
          <g opacity={0.35 + 0.65 * fold} transform={`translate(${(1 - fold) * -10} 0)`}>
            <rect x="52" y="160" width="128" height="46" rx="14" fill={fold > 0.5 ? (dark ? "#2b2b2b" : "#fff") : "transparent"} stroke={fold > 0.5 ? glow : "none"} strokeWidth="2.5" />
            <path d="M64 174 h12 l5 5 h17 v17 h-34 Z" fill={glow} />
            <text x="104" y="181" fontFamily={SANS} fontWeight={700} fontSize="14" fill={ink}>Animasyon</text>
            <text x="104" y="198" fontFamily={SANS} fontWeight={700} fontSize="14" fill={ink}>Stüdyosu</text>
          </g>
          {/* sohbet alani: gonderilen mesaj + calisiyor */}
          {isSent && (
            <g opacity={sent} transform={`translate(${(1 - sent) * 30} ${(1 - sent) * 20})`}>
              <rect x="356" y="166" width="180" height="54" rx="24" fill={glow} />
              <text x="446" y="201" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="23" fill="#0b0b0b">{cmd}</text>
            </g>
          )}
          {work > 0 && (
            <g opacity={work}>
              {[0, 1, 2].map((i) => <circle key={i} cx={226 + i * 18} cy="262" r="6" fill={glow} opacity={0.35 + 0.65 * Math.abs(Math.sin((lf - i * 4) / 6))} />)}
              <text x="284" y="270" fontFamily={SANS} fontWeight={700} fontSize="22" fill={ink} opacity="0.85">Kuruluyor…</text>
            </g>
          )}
          {/* giris kutusu */}
          <rect x="210" y="424" width="330" height="54" rx="20" fill={dark ? "#232323" : "#f6f4ef"} stroke={!isSent && lf >= k1 - 6 ? glow : dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} strokeWidth="2.5" />
          <text x="230" y="460" fontFamily={SANS} fontWeight={700} fontSize="24" fill={ink}>
            {isSent ? "" : cmd.slice(0, typed)}
            <tspan fill={glow} opacity={caret ? 1 : 0}>|</tspan>
          </text>
          <circle cx="512" cy="451" r="17" fill={typed > 0 && !isSent ? glow : dark ? "#3a3a3a" : "#dedad2"} />
          <path d="M512 459 V443 M505 449 L512 442 L519 449" stroke={typed > 0 && !isSent ? "#0b0b0b" : "#fff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      );
    }

    /* garanti belgesi: kagit kayar, satirlar yazilir, k1'de "GARANTI" muhru iner (soz, garanti, taahhut) */
    case "guarantee": {
      const paper = P(lf, 0, 18);
      const stamp = P(lf, k1 - 2, k1 + 8, Easing.bezier(0.5, 0, 0.75, 0)); // hizla iner
      const land = lf >= k1 + 8;
      const shake = land ? Math.sin((lf - k1 - 8) * 2.4) * 4 * Math.exp(-(lf - k1 - 8) / 5) : 0;
      const dust = P(lf, k1 + 8, k1 + 26);
      const ink = dark ? "#fff" : "#1b1b1b";
      return wrap(
        <g transform={`translate(${shake} 0)`}>
          <circle cx="300" cy="300" r="270" fill={glow} opacity={0.07} />
          <g opacity={paper} transform={`translate(0 ${(1 - paper) * 40}) rotate(-4 300 300)`}>
            <rect x="130" y="60" width="340" height="460" rx="22" fill={dark ? "#1f1f1f" : "#fff"} stroke={soft} strokeWidth="3" />
            <rect x="170" y="110" width="180" height="20" rx="10" fill={ink} opacity="0.8" />
            {[0, 1, 2, 3, 4].map((i) => {
              const w = P(lf, 8 + i * 4, 20 + i * 4);
              return <rect key={i} x="170" y={170 + i * 44} width={(i % 2 ? 210 : 250) * w} height="14" rx="7" fill={ink} opacity="0.22" />;
            })}
            <path d="M175 470 C200 440 225 490 250 460 S295 455 310 470" stroke={ink} strokeWidth="4" fill="none" opacity="0.55" {...evolvePath(P(lf, 20, 34), "M175 470 C200 440 225 490 250 460 S295 455 310 470")} />
          </g>
          {/* muhur: yukaridan hizla iner, oturunca toz halkasi */}
          {lf >= k1 - 2 && (
            <g transform={`translate(390 400) scale(${land ? 1 : 1.7 - 0.7 * stamp}) rotate(-14) translate(-390 -400)`} opacity={Math.min(1, stamp * 1.5)}>
              <circle cx="390" cy="400" r="112" fill={dark ? glow : accent} />
              <circle cx="390" cy="400" r="94" fill="none" stroke={dark ? "#0b0b0b" : "#fff"} strokeWidth="4" strokeDasharray="6 8" />
              <path d="M348 392 L378 422 L434 362" stroke={dark ? "#0b0b0b" : "#fff"} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <text x="390" y="470" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="26" letterSpacing="3" fill={dark ? "#0b0b0b" : "#fff"}>GARANTİ</text>
            </g>
          )}
          {land && dust < 1 && <circle cx="390" cy="400" r={120 + 90 * dust} fill="none" stroke={glow} strokeWidth="6" opacity={1 - dust} />}
        </g>
      );
    }

    /* kalkan: cizilir, dolar, k1'de icinde tik + disa yayilan halkalar (risk bizde, guvence, koruma) */
    case "shield": {
      const sd = "M300 70 L470 130 L460 320 C450 420 385 485 300 525 C215 485 150 420 140 320 L130 130 Z";
      const draw = P(lf, 0, 22, io);
      const fill = P(lf, 14, 30);
      const tick = P(lf, k1, k1 + 12, io);
      const tickD = "M230 300 L282 352 L380 240";
      return wrap(
        <>
          {[0, 1, 2].map((i) => {
            const w = interpolate(lf - k1 - i * 9, [0, 40], [0, 1], cl);
            return w > 0 && w < 1 ? <path key={i} d={sd} fill="none" stroke={glow} strokeWidth="5" opacity={(1 - w) * 0.8} transform={`translate(300 300) scale(${1 + 0.45 * w}) translate(-300 -300)`} /> : null;
          })}
          <circle cx="300" cy="300" r="260" fill={glow} opacity={0.06 + 0.08 * tick} />
          <path d={sd} fill={dark ? glow : accent} fillOpacity={0.95 * fill} />
          <path d={sd} fill="none" stroke={dark ? glow : accent} strokeWidth="14" strokeLinejoin="round" {...evolvePath(draw, sd)} />
          <path d={tickD} stroke={dark ? "#0b0b0b" : "#fff"} strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none" {...evolvePath(tick, tickD)} />
        </>
      );
    }

    /* PARA IADESI: havada 3B donen 3 para; k1'de sirayla kavisle acik cuzdana ucar (inis k1+8+6i), cuzdan kapanir
       (k1+24..30), etrafinda iade oku doner, "IADE ✓" rozeti + isiltilar. Tetik: "tamamini iade" */
    /* PARA IADESI – KAGIT PARA (kullanici: "jeton yerine kagit para, kaliteli"): 4 banknot havada yelpaze gibi acik,
       kagit gibi dalgalanir; k1'den itibaren sirayla kivrilarak cuzdana suzulur (inis k1+8+5i), cuzdan kapanir (k1+26..32),
       iade oku doner, "IADE ✓" rozeti + isiltilar. Banknot stilize: gercek bir para basimini taklit etmez, rakam yok. */
    case "refund": {
      const NOTE = "#e6f0df", NOTE_D = "#2f6b4f", NOTE_M = "#9cc79a";
      const body = dark ? glow : accent;
      const bodyD = dark ? "#8fb81f" : "#0d0d0d";
      const fan = [
        { x: 252, y: 168, r: -26, ph: 0 },
        { x: 285, y: 148, r: -9, ph: 1.3 },
        { x: 318, y: 148, r: 9, ph: 2.6 },
        { x: 350, y: 168, r: 26, ph: 3.9 },
      ];
      const WY = 395;
      const close = P(lf, k1 + 26, k1 + 32, Easing.bezier(0.34, 1.5, 0.64, 1));
      const bump = lf > k1 + 8 && lf < k1 + 30 ? Math.sin((((lf - k1 - 8) % 5) / 5) * Math.PI) * 5 : 0;
      const arrow = P(lf, k1 + 12, k1 + 36, io);
      const arc = "M300 30 A275 275 0 1 1 48 410";
      const badge = P(lf, k1 + 32, k1 + 44, Easing.bezier(0.34, 1.5, 0.64, 1));
      const NW = 250, NH = 128;
      const note = (key: number) => (
        <g key={key}>
          <rect x={-NW / 2} y={-NH / 2} width={NW} height={NH} rx="10" fill={NOTE} />
          <rect x={-NW / 2 + 10} y={-NH / 2 + 10} width={NW - 20} height={NH - 20} rx="6" fill="none" stroke={NOTE_D} strokeWidth="3" opacity="0.7" />
          {/* guilos desen: ince dalgali cizgiler */}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${-NW / 2 + 18} ${-24 + i * 24} C${-60} ${-44 + i * 24} ${-20} ${-4 + i * 24} ${20} ${-24 + i * 24} S${90} ${-4 + i * 24} ${NW / 2 - 18} ${-24 + i * 24}`} stroke={NOTE_M} strokeWidth="2.5" fill="none" />
          ))}
          <circle cx="0" cy="0" r="34" fill={NOTE} stroke={NOTE_D} strokeWidth="4" />
          <text x="0" y="15" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="44" fill={NOTE_D}>₺</text>
          <text x={-NW / 2 + 26} y={-NH / 2 + 34} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="22" fill={NOTE_D}>₺</text>
          <text x={NW / 2 - 26} y={NH / 2 - 16} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="22" fill={NOTE_D}>₺</text>
          {/* kagit parlamasi */}
          <rect x={-NW / 2} y={-NH / 2} width={NW} height={NH / 2} rx="10" fill="#fff" opacity="0.18" />
        </g>
      );
      return wrap(
        <>
          <circle cx="300" cy="320" r="270" fill={glow} opacity={0.08 + 0.1 * badge} />
          <path d={arc} stroke={dark ? "#fff" : accent} strokeOpacity="0.85" strokeWidth="14" strokeLinecap="round" fill="none" {...evolvePath(arrow, arc)} />
          {arrow > 0.05 && (() => {
            const tip = getPointAtLength(arc, getLength(arc) * arrow) ?? { x: 48, y: 410 };
            return <circle cx={tip.x} cy={tip.y} r="16" fill={dark ? "#fff" : accent} opacity={arrow} />;
          })()}
          {/* cuzdan arka govde + agiz */}
          <g transform={`translate(0 ${bump})`}>
            <rect x="140" y="330" width="320" height="205" rx="34" fill={bodyD} />
            <rect x="158" y="330" width="284" height="40" rx="14" fill="#000" opacity="0.35" />
          </g>
          {/* banknotlar: yelpaze -> sirayla kivrilarak cuzdana (on cebin arkasina) */}
          {fan.map((n, i) => {
            const appear = P(lf, i * 3, 14 + i * 3, Easing.bezier(0.34, 1.5, 0.64, 1));
            const t0 = k1 - 4 + i * 5;
            const f = interpolate(lf, [t0, t0 + 12], [0, 1], { ...cl, easing: Easing.bezier(0.5, 0, 0.6, 1) });
            if (f >= 1) return null;
            const flap = Math.sin(lf / 7 + n.ph); // kagit dalgalanmasi
            const x = n.x + Math.sin(f * Math.PI) * (i - 1.5) * 30;
            const y = (n.y + flap * 6) * (1 - f) + WY * f - Math.sin(f * Math.PI) * 40;
            const rot = n.r * (1 - f) + flap * 2.5 * (1 - f);
            const sy = (0.92 + 0.08 * Math.abs(flap)) * (1 - 0.25 * f); // kivrilma (perspektif)
            const sk = flap * 4 * (1 - f) + Math.sin(f * Math.PI) * 10; // ucarken kagit bukulmesi
            const sc = (0.7 + 0.3 * appear) * (1 - 0.15 * f);
            return (
              <g key={i} opacity={appear} transform={`translate(${x} ${y}) rotate(${rot}) skewX(${sk}) scale(${sc} ${sc * sy})`}>
                {/* golge */}
                <rect x={-NW / 2 + 6} y={-NH / 2 + 10} width={NW} height={NH} rx="10" fill="#000" opacity="0.25" />
                {note(i)}
              </g>
            );
          })}
          {/* on cep + kapak */}
          <g transform={`translate(0 ${bump})`}>
            <rect x="140" y="372" width="320" height="163" rx="30" fill={body} />
            <rect x="140" y="372" width="320" height="163" rx="30" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="3" />
            {/* cebe girmis banknotlarin ucu gorunur */}
            {[0, 1, 2, 3].map((i) => {
              const inn = lf >= k1 + 8 + i * 5 ? 1 : 0;
              return inn && close < 0.5 ? <rect key={i} x={190 + i * 8} y={360 - i * 2} width="220" height="16" rx="4" fill={NOTE} stroke={NOTE_D} strokeWidth="2" opacity="0.95" /> : null;
            })}
            <g transform={`translate(300 372) scale(1 ${-1 + 2 * close}) translate(-300 -372)`}>
              <path d="M140 372 L460 372 L460 432 C460 454 442 464 422 464 L178 464 C158 464 140 454 140 432 Z" fill={bodyD} opacity={close > 0.02 ? 1 : 0} />
              <circle cx="420" cy="420" r="14" fill="#f2c14e" opacity={close > 0.5 ? 1 : 0} />
            </g>
            <rect x="180" y="486" width="120" height="14" rx="7" fill="#000" opacity="0.18" />
          </g>
          <g opacity={badge} transform={`translate(300 300) scale(${0.6 + 0.4 * badge}) translate(-300 -300)`}>
            <rect x="200" y="250" width="200" height="64" rx="32" fill={dark ? "#fff" : accent} />
            <text x="300" y="293" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="30" letterSpacing="2" fill={dark ? "#0b0b0b" : "#fff"}>İADE ✓</text>
          </g>
          {[0, 1, 2, 3].map((i) => {
            const sp = P(lf, k1 + 32 + i * 3, k1 + 46 + i * 3);
            const x = [165, 435, 245, 385][i], y = [230, 240, 160, 150][i];
            return sp > 0 ? <path key={i} d={`M${x} ${y - 20} V${y + 20} M${x - 20} ${y} H${x + 20}`} stroke={glow} strokeWidth="6" strokeLinecap="round" opacity={sp * (1 - P(lf, k1 + 62, k1 + 82))} transform={`rotate(${lf * 3} ${x} ${y})`} /> : null;
          })}
        </>
      );
    }

    /* (eski) jeton iadesi – kullanici kagit parayi tercih etti; "refundCoin" ile hala secilebilir */
    case "refundCoin": {
      const GOLD = "#f2c14e", GOLD_D = "#b8862f", GOLD_T = "#8a6420";
      const body = dark ? glow : accent;
      const bodyD = dark ? "#8fb81f" : "#0d0d0d";
      const coins = [
        { x: 300, y: 120, ph: 0 },
        { x: 205, y: 175, ph: 1.7 },
        { x: 395, y: 175, ph: 3.1 },
      ];
      const W0 = 300, WY = 400; // cuzdan agzi
      const close = P(lf, k1 + 24, k1 + 30, Easing.bezier(0.34, 1.5, 0.64, 1));
      const bump = lf > k1 + 8 && lf < k1 + 30 ? Math.sin(((lf - k1 - 8) % 6) / 6 * Math.PI) * 6 : 0;
      const arrow = P(lf, k1 + 10, k1 + 34, io);
      const arc = "M300 40 A270 270 0 1 1 52 410";
      const badge = P(lf, k1 + 30, k1 + 42, Easing.bezier(0.34, 1.5, 0.64, 1));
      const coin = (cx: number, cy: number, r: number, ang: number, key: number) => {
        const c = Math.cos(ang);
        const rx = Math.max(3, r * Math.abs(c));
        const th = 9 * Math.sin(ang); // kenar kalinligi yonu
        return (
          <g key={key}>
            {/* kenar (kalinlik) */}
            <ellipse cx={cx + th} cy={cy} rx={rx} ry={r} fill={GOLD_T} />
            <rect x={Math.min(cx, cx + th)} y={cy - r} width={Math.abs(th)} height={2 * r} fill={GOLD_T} />
            {/* yuz */}
            <ellipse cx={cx} cy={cy} rx={rx} ry={r} fill={GOLD} />
            <ellipse cx={cx} cy={cy} rx={rx * 0.8} ry={r * 0.8} fill="none" stroke={GOLD_D} strokeWidth="5" />
            {Math.abs(c) > 0.25 && (
              <text x={cx} y={cy + r * 0.33} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={r * 0.95} fill={GOLD_T} transform={`translate(${cx} 0) scale(${c} 1) translate(${-cx} 0)`}>
                ₺
              </text>
            )}
            {/* parlama seridi */}
            <ellipse cx={cx - rx * 0.35} cy={cy - r * 0.35} rx={rx * 0.18} ry={r * 0.32} fill="#fff" opacity={0.35 * Math.abs(c)} transform={`rotate(-30 ${cx - rx * 0.35} ${cy - r * 0.35})`} />
          </g>
        );
      };
      return wrap(
        <>
          <circle cx="300" cy="320" r="270" fill={glow} opacity={0.08 + 0.1 * badge} />
          {/* iade oku: cuzdanin etrafinda geri doner */}
          <path d={arc} stroke={dark ? "#fff" : accent} strokeOpacity="0.85" strokeWidth="14" strokeLinecap="round" fill="none" {...evolvePath(arrow, arc)} />
          {arrow > 0.05 && (() => {
            const tip = getPointAtLength(arc, getLength(arc) * arrow) ?? { x: 52, y: 410 };
            return <circle cx={tip.x} cy={tip.y} r="16" fill={dark ? "#fff" : accent} opacity={arrow} />;
          })()}
          {/* cuzdan arka govde + ic */}
          <g transform={`translate(0 ${bump})`}>
            <rect x="150" y="330" width="300" height="200" rx="34" fill={bodyD} />
            <rect x="168" y="330" width="264" height="40" rx="14" fill="#000" opacity="0.35" />
          </g>
          {/* paralar: once havada doner, sonra sirayla cuzdana ucar (on cebin ARKASINA girer) */}
          {coins.map((cn, i) => {
            const t0 = k1 - 4 + i * 6;
            const f = interpolate(lf, [t0, t0 + 12], [0, 1], { ...cl, easing: Easing.bezier(0.45, 0, 0.55, 1) });
            const bob = Math.sin(lf / 9 + cn.ph) * 8;
            const appear = P(lf, i * 4, 14 + i * 4, Easing.bezier(0.34, 1.5, 0.64, 1));
            const x = cn.x + (W0 - cn.x) * f;
            const y = (cn.y + bob) * (1 - f) + WY * f - Math.sin(f * Math.PI) * 120; // kavis
            const sc = (0.6 + 0.4 * appear) * (1 - 0.35 * f);
            const ang = lf * 0.12 + cn.ph + f * 6; // ucarken hizlanan donus
            if (f >= 1) return null;
            return <g key={i} opacity={appear} transform={`translate(${x} ${y}) scale(${sc}) translate(${-x} ${-y})`}>{coin(x, y, 76, ang, i)}</g>;
          })}
          {/* on cep + kapak */}
          <g transform={`translate(0 ${bump})`}>
            <rect x="150" y="372" width="300" height="158" rx="30" fill={body} />
            <rect x="150" y="372" width="300" height="158" rx="30" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="3" />
            {/* kapak: menteseden (ust kenar) asagi kapanir */}
            <g transform={`translate(300 372) scale(1 ${-1 + 2 * close}) translate(-300 -372)`}>
              <path d="M150 372 L450 372 L450 430 C450 452 432 462 412 462 L188 462 C168 462 150 452 150 430 Z" fill={bodyD} opacity={close > 0.02 ? 1 : 0} />
              <circle cx="410" cy="420" r="14" fill={GOLD} opacity={close > 0.5 ? 1 : 0} />
            </g>
            <rect x="190" y="480" width="120" height="14" rx="7" fill="#000" opacity="0.18" />
          </g>
          {/* IADE rozeti */}
          <g opacity={badge} transform={`translate(300 300) scale(${0.6 + 0.4 * badge}) translate(-300 -300)`}>
            <rect x="200" y="250" width="200" height="64" rx="32" fill={dark ? "#fff" : accent} />
            <text x="300" y="293" textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize="30" letterSpacing="2" fill={dark ? "#0b0b0b" : "#fff"}>İADE ✓</text>
          </g>
          {/* isiltilar */}
          {[0, 1, 2, 3].map((i) => {
            const sp = P(lf, k1 + 30 + i * 3, k1 + 44 + i * 3);
            const x = [170, 430, 250, 380][i], y = [230, 240, 160, 150][i];
            return sp > 0 ? <path key={i} d={`M${x} ${y - 20} V${y + 20} M${x - 20} ${y} H${x + 20}`} stroke={glow} strokeWidth="6" strokeLinecap="round" opacity={sp * (1 - P(lf, k1 + 60, k1 + 80))} transform={`rotate(${lf * 3} ${x} ${y})`} /> : null;
          })}
        </>
      );
    }

    /* kalp: cizilir, dolar ve iki kez atar (sevgi, mutluluk) */
    case "heart": {
      const h = "M300 500 C120 380 90 270 140 200 C190 130 270 150 300 210 C330 150 410 130 460 200 C510 270 480 380 300 500 Z";
      const draw = P(lf, 0, 24, io);
      const fill = P(lf, k1 - 4, k1 + 10);
      const beat = lf > k1 ? 1 + 0.06 * Math.max(0, Math.sin((lf - k1) / 3)) * Math.exp(-(lf - k1) / 20) : 1;
      return wrap(
        <g transform={`translate(300 320) scale(${beat}) translate(-300 -320)`}>
          <circle cx="300" cy="310" r="240" fill={glow} opacity={0.08 + 0.1 * fill} />
          <path d={h} fill={dark ? glow : accent} opacity={fill} />
          <path d={h} stroke={dark ? glow : accent} strokeWidth="14" strokeLinejoin="round" fill="none" {...evolvePath(draw, h)} />
        </g>
      );
    }
  }
  return null;
};
