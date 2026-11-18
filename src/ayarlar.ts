// Ayarlar localStorage'da tutulur. Okunan değer unknown kabul edilip
// alan alan doğrulanır; bozuk/eksik alanlar varsayılana döner.

import { nesneMi } from "./soru-tipleri/ortak";
import { VARSAYILAN_AYARLAR, type Ayarlar, type Tema, type YaziBoyutu } from "./tipler";

const ANAHTAR = "ders-calis:ayarlar";

const TEMALAR: readonly Tema[] = ["sistem", "acik", "koyu"];
const YAZI_BOYUTLARI: readonly YaziBoyutu[] = ["normal", "buyuk"];

function birindenMi<T extends string>(x: unknown, liste: readonly T[]): x is T {
  return typeof x === "string" && (liste as readonly string[]).includes(x);
}

/** unknown → Ayarlar; geçersiz alanlar varsayılan değeri alır. */
export function ayarlariCoz(ham: unknown): Ayarlar {
  const a: Ayarlar = { ...VARSAYILAN_AYARLAR };
  if (!nesneMi(ham)) return a;
  if (typeof ham["turkceTolerans"] === "boolean") a.turkceTolerans = ham["turkceTolerans"];
  if (typeof ham["siklariKaristir"] === "boolean") a.siklariKaristir = ham["siklariKaristir"];
  if (birindenMi(ham["tema"], TEMALAR)) a.tema = ham["tema"];
  if (birindenMi(ham["yaziBoyutu"], YAZI_BOYUTLARI)) a.yaziBoyutu = ham["yaziBoyutu"];
  return a;
}

export function ayarlariOku(): Ayarlar {
  try {
    const metin = localStorage.getItem(ANAHTAR);
    return ayarlariCoz(metin === null ? null : (JSON.parse(metin) as unknown));
  } catch {
    return { ...VARSAYILAN_AYARLAR };
  }
}

export function ayarlariYaz(a: Ayarlar): void {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(a));
  } catch {
    // Gizli mod vb. durumlarda yazılamazsa oturum boyunca bellekte kalır.
  }
}

/** Tema ve yazı boyutunu <html> öğesine uygular. */
export function gorunumUygula(a: Ayarlar): void {
  const kok = document.documentElement;
  kok.dataset["tema"] = a.tema;
  kok.dataset["yazi"] = a.yaziBoyutu;
}
