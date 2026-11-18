// Çalışma oturumu mantığı. DOM'dan ve tarayıcı API'lerinden bağımsızdır;
// rastgelelik dışarıdan verilir ki testler tekrarlanabilir olsun.

import { anahtar, sonCevapYanlisMi, type IlerlemeKaydi } from "./leitner";
import type { Cevap, Soru, SoruTipi } from "./tipler";

export type Rastgele = () => number;

export interface OturumSorusu {
  desteId: string;
  soru: Soru;
}

export interface SoruSonucu {
  desteId: string;
  soruId: string;
  dogru: boolean;
  cevap: Cevap;
  /** "Aslında doğruydu" ile düzeltildi mi? */
  duzeltildi: boolean;
  /** Cevaptan önceki ilerleme kaydı; "Aslında doğruydu" bununla yeniden hesaplanır. */
  oncekiKayit?: IlerlemeKaydi;
}

export interface Oturum {
  baslik: string;
  sorular: OturumSorusu[];
  /** Şu an gösterilen sorunun indeksi; sorular.length ise oturum bitmiştir. */
  indeks: number;
  /** sorular ile aynı uzunlukta; boş bırakılan (cevaplanmamış) sorular null. */
  sonuclar: (SoruSonucu | null)[];
}

export type SoruAdedi = number | "tumu";

/** karisik: tüm sorular rastgele; yanlislar: son cevabı yanlış olanlar. */
export type Mod = "karisik" | "yanlislar";
export const MODLAR: readonly Mod[] = ["karisik", "yanlislar"];

export interface OturumSecimi {
  mod: Mod;
  /** Boşsa tüm tipler dahil. */
  tipler: readonly SoruTipi[];
  adet: SoruAdedi;
  /** Boşsa etiket filtresi uygulanmaz; doluysa en az birini taşıyan sorular. */
  etiketler: readonly string[];
}

/** Fisher–Yates; girdiyi değiştirmez. */
export function karistir<T>(dizi: readonly T[], rastgele: Rastgele): T[] {
  const k = [...dizi];
  for (let i = k.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    const a = k[i] as T;
    k[i] = k[j] as T;
    k[j] = a;
  }
  return k;
}

/** Tip ve etiket filtresini uygular (sıra korunur). */
export function filtrele(havuz: readonly OturumSorusu[], secim: OturumSecimi): OturumSorusu[] {
  return havuz.filter(({ soru }) => {
    if (secim.tipler.length > 0 && !secim.tipler.includes(soru.tip)) return false;
    if (secim.etiketler.length > 0 && !(soru.etiketler ?? []).some((e) => secim.etiketler.includes(e))) return false;
    return true;
  });
}

export function adetSinirla<T>(dizi: readonly T[], adet: SoruAdedi): T[] {
  return adet === "tumu" ? [...dizi] : dizi.slice(0, Math.max(0, adet));
}

export type KayitBul = (desteId: string, soruId: string) => IlerlemeKaydi | undefined;

export function haritadanBul(harita: ReadonlyMap<string, IlerlemeKaydi>): KayitBul {
  return (d, s) => harita.get(anahtar(d, s));
}

/** Seçilen moda göre oturumun sorularını belirler (sınırlamadan önce). */
export function moduUygula(
  havuz: readonly OturumSorusu[],
  secim: OturumSecimi,
  kayit: KayitBul,
  rastgele: Rastgele,
): OturumSorusu[] {
  const filtreli = filtrele(havuz, secim);
  const k = (o: OturumSorusu) => kayit(o.desteId, o.soru.id);
  switch (secim.mod) {
    case "karisik":
      return karistir(filtreli, rastgele);
    case "yanlislar":
      return karistir(
        filtreli.filter((o) => sonCevapYanlisMi(k(o))),
        rastgele,
      );
    default: {
      const x: never = secim.mod;
      return x;
    }
  }
}

export function soruSec(
  havuz: readonly OturumSorusu[],
  secim: OturumSecimi,
  kayit: KayitBul,
  rastgele: Rastgele,
): OturumSorusu[] {
  return adetSinirla(moduUygula(havuz, secim, kayit, rastgele), secim.adet);
}

export function oturumOlustur(baslik: string, sorular: readonly OturumSorusu[]): Oturum {
  return { baslik, sorular: [...sorular], indeks: 0, sonuclar: sorular.map(() => null) };
}

export function mevcutSoru(o: Oturum): OturumSorusu | undefined {
  return o.sorular[o.indeks];
}

export function bittiMi(o: Oturum): boolean {
  return o.indeks >= o.sorular.length;
}

/** Mevcut sorunun sonucu; cevaplanmadıysa null. */
export function mevcutSonuc(o: Oturum): SoruSonucu | null {
  return o.sonuclar[o.indeks] ?? null;
}

/** Mevcut soru cevaplandı mı (geri bildirim gösteriliyor mu)? */
export function cevaplandiMi(o: Oturum): boolean {
  return mevcutSonuc(o) !== null;
}

export function cevapKaydet(o: Oturum, cevap: Cevap, dogru: boolean, oncekiKayit?: IlerlemeKaydi): Oturum {
  const s = mevcutSoru(o);
  if (!s || cevaplandiMi(o)) return o;
  const sonuc: SoruSonucu = { desteId: s.desteId, soruId: s.soru.id, dogru, cevap, duzeltildi: false, oncekiKayit };
  const sonuclar = [...o.sonuclar];
  sonuclar[o.indeks] = sonuc;
  return { ...o, sonuclar };
}

/** Mevcut sorunun cevabını doğru sayar ("Aslında doğruydu"). */
export function dogruSay(o: Oturum): Oturum {
  const son = mevcutSonuc(o);
  if (!son || son.dogru) return o;
  const sonuclar = [...o.sonuclar];
  sonuclar[o.indeks] = { ...son, dogru: true, duzeltildi: true };
  return { ...o, sonuclar };
}

/** "Aslında doğruydu" düzeltmesini geri alır ("Aslında yanlıştı"). */
export function yanlisSay(o: Oturum): Oturum {
  const son = mevcutSonuc(o);
  if (!son || !son.duzeltildi) return o;
  const sonuclar = [...o.sonuclar];
  sonuclar[o.indeks] = { ...son, dogru: false, duzeltildi: false };
  return { ...o, sonuclar };
}

/** Verilen soruya geçer (cevaplanmış olsun ya da olmasın); sorular.length oturumu bitirir. */
export function git(o: Oturum, indeks: number): Oturum {
  const yeni = Math.min(Math.max(0, indeks), o.sorular.length);
  return yeni === o.indeks ? o : { ...o, indeks: yeni };
}

/** Sonraki soruya geçer; mevcut soru boş bırakılabilir. Son sorudan sonra oturum biter. */
export function sonraki(o: Oturum): Oturum {
  return git(o, o.indeks + 1);
}

export function onceki(o: Oturum): Oturum {
  return git(o, o.indeks - 1);
}

/** Cevaplanmamış (boş bırakılmış) soru sayısı. */
export function bosSayisi(o: Oturum): number {
  return o.sonuclar.filter((s) => s === null).length;
}

export interface OturumOzeti {
  dogru: number;
  yanlis: number;
  bos: number;
  /** Doğruların tüm sorulara oranı; 0–100 arası tam sayı. */
  yuzde: number;
  yanlislar: OturumSorusu[];
  /** Cevaplanmadan bırakılan sorular. */
  boslar: OturumSorusu[];
}

export function ozet(o: Oturum): OturumOzeti {
  const cevaplanan = o.sonuclar.filter((s): s is SoruSonucu => s !== null);
  const dogru = cevaplanan.filter((s) => s.dogru).length;
  const yanlis = cevaplanan.length - dogru;
  const bos = o.sonuclar.length - cevaplanan.length;
  const yanlislar = o.sonuclar.flatMap((s, i) => {
    const os = o.sorular[i];
    return s && !s.dogru && os ? [os] : [];
  });
  const boslar = o.sonuclar.flatMap((s, i) => {
    const os = o.sorular[i];
    return s === null && os ? [os] : [];
  });
  const yuzde = o.sorular.length === 0 ? 0 : Math.round((dogru / o.sorular.length) * 100);
  return { dogru, yanlis, bos, yuzde, yanlislar, boslar };
}
