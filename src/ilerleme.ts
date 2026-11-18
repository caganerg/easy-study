// İlerlemenin bellekteki kopyası ile IndexedDB arasındaki köprü ve istatistikler.

import { kayitYaz, topluYaz, tumKayitlar, tumunuSil } from "./depo";
import { durum } from "./durum";
import { anahtar, kayitGuncelle, ogrenildiMi, sonCevapYanlisMi, type IlerlemeKaydi } from "./leitner";
import type { OturumSorusu } from "./oturum";
import type { Deste } from "./tipler";

export async function ilerlemeYukle(): Promise<void> {
  try {
    const kayitlar = await tumKayitlar();
    durum.ilerleme = new Map(kayitlar.map((k) => [anahtar(k.desteId, k.soruId), k]));
    durum.kalici = true;
  } catch (e) {
    console.warn("İlerleme yüklenemedi; yalnızca bellekte tutulacak.", e);
    durum.kalici = false;
  }
}

export function kayitBul(desteId: string, soruId: string): IlerlemeKaydi | undefined {
  return durum.ilerleme.get(anahtar(desteId, soruId));
}

async function yaz(k: IlerlemeKaydi): Promise<void> {
  durum.ilerleme.set(anahtar(k.desteId, k.soruId), k);
  if (!durum.kalici) return;
  try {
    await kayitYaz(k);
  } catch (e) {
    console.warn("İlerleme kaydedilemedi.", e);
  }
}

/**
 * Cevabı kaydeder. "Aslında doğruydu" durumunda aynı "onceki" kayıtla tekrar
 * çağrılır; böylece yanlış cevabın etkisi geri alınmış olur.
 */
export function cevabiKaydet(onceki: IlerlemeKaydi | undefined, kimlik: { desteId: string; soruId: string }, dogru: boolean, simdi: number): void {
  void yaz(kayitGuncelle(onceki, kimlik, dogru, simdi));
}

export async function ilerlemeyiDegistir(kayitlar: readonly IlerlemeKaydi[], temizle: boolean): Promise<void> {
  if (temizle) durum.ilerleme.clear();
  for (const k of kayitlar) durum.ilerleme.set(anahtar(k.desteId, k.soruId), k);
  if (durum.kalici) await topluYaz(kayitlar, temizle);
}

export async function ilerlemeyiSifirla(): Promise<void> {
  durum.ilerleme.clear();
  if (durum.kalici) await tumunuSil();
}

export interface DesteIstatistigi {
  toplam: number;
  ogrenilen: number;
  /** Son cevabı yanlış olan soru sayısı. */
  yanlis: number;
}

/** Yalnızca destede hâlâ var olan sorular sayılır; silinmiş soruların kayıtları yok sayılır. */
export function desteIstatistigi(deste: Deste): DesteIstatistigi {
  let ogrenilen = 0;
  let yanlis = 0;
  for (const s of deste.sorular) {
    const k = kayitBul(deste.id, s.id);
    if (ogrenildiMi(k)) ogrenilen++;
    if (sonCevapYanlisMi(k)) yanlis++;
  }
  return { toplam: deste.sorular.length, ogrenilen, yanlis };
}

/** Tüm destelerde son cevabı yanlış olan sorular (deste sırasıyla). */
export function tumYanlislar(): OturumSorusu[] {
  const havuz: OturumSorusu[] = [];
  for (const y of durum.katalog?.desteler ?? []) {
    if (!y.deste) continue;
    for (const soru of y.deste.sorular) {
      if (sonCevapYanlisMi(kayitBul(y.deste.id, soru.id))) havuz.push({ desteId: y.deste.id, soru });
    }
  }
  return havuz;
}
