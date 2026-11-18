// İlerleme ve ayarların dışa/içe aktarımı. Saf fonksiyonlar; dosya indirme ve
// okuma ekranlar/ayarlar.ts içinde yapılır.

import { ayarlariCoz } from "./ayarlar";
import { anahtar, ilerlemeKaydiCoz, type IlerlemeKaydi } from "./leitner";
import { nesneMi } from "./soru-tipleri/ortak";
import type { Ayarlar } from "./tipler";

export const YEDEK_SURUMU = 1;
const UYGULAMA = "ders-calis";

export interface Yedek {
  surum: typeof YEDEK_SURUMU;
  uygulama: typeof UYGULAMA;
  /** ISO 8601 */
  olusturulma: string;
  ayarlar: Ayarlar;
  ilerleme: IlerlemeKaydi[];
}

export type YedekCozumu = { tamam: true; yedek: Yedek } | { tamam: false; neden: string };

export function yedekOlustur(ilerleme: Iterable<IlerlemeKaydi>, ayarlar: Ayarlar, simdi: number): Yedek {
  return {
    surum: YEDEK_SURUMU,
    uygulama: UYGULAMA,
    olusturulma: new Date(simdi).toISOString(),
    ayarlar: { ...ayarlar },
    ilerleme: [...ilerleme].map((k) => ({ ...k })),
  };
}

const iki = (n: number) => String(n).padStart(2, "0");

/** ders-yedek-YYYY-AA-GG.json (yerel tarih). */
export function yedekDosyaAdi(simdi: number): string {
  const d = new Date(simdi);
  return `ders-yedek-${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}.json`;
}

/**
 * unknown → Yedek. Tek bir kayıt bile bozuksa dosyanın tamamı reddedilir;
 * yarım yüklenmiş bir yedek fark edilmeden veri kaybına yol açabilir.
 */
export function yedekCoz(ham: unknown): YedekCozumu {
  if (!nesneMi(ham)) return { tamam: false, neden: "JSON nesnesi değil" };
  if (ham["uygulama"] !== UYGULAMA) return { tamam: false, neden: "bu uygulamanın yedeği değil" };
  if (ham["surum"] !== YEDEK_SURUMU) return { tamam: false, neden: `desteklenmeyen sürüm (${String(ham["surum"])})` };
  const olusturulma = ham["olusturulma"];
  if (typeof olusturulma !== "string" || Number.isNaN(Date.parse(olusturulma))) return { tamam: false, neden: "oluşturulma tarihi geçersiz" };
  if (!nesneMi(ham["ayarlar"])) return { tamam: false, neden: "ayarlar eksik" };
  const liste = ham["ilerleme"];
  if (!Array.isArray(liste)) return { tamam: false, neden: "ilerleme listesi eksik" };

  const ilerleme: IlerlemeKaydi[] = [];
  for (const [i, h] of liste.entries()) {
    const k = ilerlemeKaydiCoz(h);
    if (!k) return { tamam: false, neden: `${i + 1}. ilerleme kaydı bozuk` };
    ilerleme.push(k);
  }
  return {
    tamam: true,
    yedek: { surum: YEDEK_SURUMU, uygulama: UYGULAMA, olusturulma, ayarlar: ayarlariCoz(ham["ayarlar"]), ilerleme },
  };
}

/** Her soru için son çözülme zamanı daha yeni olan kayıt kazanır (eşitlikte mevcut). */
export function birlestir(mevcut: Iterable<IlerlemeKaydi>, gelen: Iterable<IlerlemeKaydi>): IlerlemeKaydi[] {
  const sonuc = new Map<string, IlerlemeKaydi>();
  for (const k of mevcut) sonuc.set(anahtar(k.desteId, k.soruId), k);
  for (const k of gelen) {
    const a = anahtar(k.desteId, k.soruId);
    const eski = sonuc.get(a);
    if (!eski || k.sonCozulme > eski.sonCozulme) sonuc.set(a, k);
  }
  return [...sonuc.values()];
}
