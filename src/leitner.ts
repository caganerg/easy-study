// Soru başına ilerleme kaydı ve kutu hesabı. Saf fonksiyonlar: şimdiki zaman
// (ms) parametre olarak verilir, Date.now() burada çağrılmaz.
//
// Kutu (1–5) art arda doğru cevapları izler: doğru → bir üst kutu, yanlış → 1.
// Kutu 5'teki sorular "öğrenildi" sayılır. Tekrar zamanlaması yoktur;
// hangi desteye ne zaman çalışılacağına kullanıcı karar verir.

import { nesneMi } from "./soru-tipleri/ortak";

export const EN_UST_KUTU = 5;

export interface IlerlemeKaydi {
  desteId: string;
  soruId: string;
  /** 1–5 */
  kutu: number;
  /** Son çözülme zamanı (ms, epoch). Yedek birleştirmede yeni kaydı seçmek için. */
  sonCozulme: number;
  dogruSayisi: number;
  yanlisSayisi: number;
}

export function anahtar(desteId: string, soruId: string): string {
  return `${desteId}\u0000${soruId}`;
}

/**
 * Cevaptan sonra yeni kaydı hesaplar. Doğru → bir üst kutu (en fazla 5);
 * yanlış → kutu 1. Hiç çözülmemiş soru kutu 1'den başlamış sayılır.
 */
export function kayitGuncelle(
  onceki: IlerlemeKaydi | undefined,
  kimlik: { desteId: string; soruId: string },
  dogru: boolean,
  simdi: number,
): IlerlemeKaydi {
  const eskiKutu = onceki?.kutu ?? 1;
  return {
    desteId: kimlik.desteId,
    soruId: kimlik.soruId,
    kutu: dogru ? Math.min(eskiKutu + 1, EN_UST_KUTU) : 1,
    sonCozulme: simdi,
    dogruSayisi: (onceki?.dogruSayisi ?? 0) + (dogru ? 1 : 0),
    yanlisSayisi: (onceki?.yanlisSayisi ?? 0) + (dogru ? 0 : 1),
  };
}

export function ogrenildiMi(k: IlerlemeKaydi | undefined): boolean {
  return k !== undefined && k.kutu >= EN_UST_KUTU;
}

/** Son cevap yanlış mı? Yanlış cevap kutuyu 1'e indirir, doğru cevap en az 2'ye çıkarır. */
export function sonCevapYanlisMi(k: IlerlemeKaydi | undefined): boolean {
  return k !== undefined && k.kutu === 1 && k.yanlisSayisi > 0;
}

function negatifOlmayanTamSayi(x: unknown): x is number {
  return typeof x === "number" && Number.isInteger(x) && x >= 0;
}

/**
 * unknown → IlerlemeKaydi (IndexedDB ve yedek dosyası için). Geçersizse null.
 * Eski sürümlerden kalan fazladan alanlar (ör. sonrakiTekrar) yok sayılır.
 */
export function ilerlemeKaydiCoz(ham: unknown): IlerlemeKaydi | null {
  if (!nesneMi(ham)) return null;
  const { desteId, soruId, kutu, sonCozulme, dogruSayisi, yanlisSayisi } = ham;
  if (typeof desteId !== "string" || desteId === "" || typeof soruId !== "string" || soruId === "") return null;
  if (!negatifOlmayanTamSayi(kutu) || kutu < 1 || kutu > EN_UST_KUTU) return null;
  if (!negatifOlmayanTamSayi(sonCozulme)) return null;
  if (!negatifOlmayanTamSayi(dogruSayisi) || !negatifOlmayanTamSayi(yanlisSayisi)) return null;
  return { desteId, soruId, kutu, sonCozulme, dogruSayisi, yanlisSayisi };
}
