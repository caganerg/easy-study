// İlerlemenin bellekteki kopyası ile IndexedDB arasındaki köprü ve istatistikler.

import { kayitYaz, topluYaz, tumKayitlar, tumunuSil } from "./depo";
import { durum } from "./durum";
import { anahtar, kayitGuncelle, ogrenildiMi, tekrarZamaniGeldiMi, tekrarSirasi, type IlerlemeKaydi } from "./leitner";
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
  tekrar: number;
  yeni: number;
}

/** Yalnızca destede hâlâ var olan sorular sayılır; silinmiş soruların kayıtları yok sayılır. */
export function desteIstatistigi(deste: Deste, simdi: number): DesteIstatistigi {
  let ogrenilen = 0;
  let tekrar = 0;
  let yeni = 0;
  for (const s of deste.sorular) {
    const k = kayitBul(deste.id, s.id);
    if (!k) yeni++;
    else {
      if (ogrenildiMi(k)) ogrenilen++;
      if (tekrarZamaniGeldiMi(k, simdi)) tekrar++;
    }
  }
  return { toplam: deste.sorular.length, ogrenilen, tekrar, yeni };
}

/** Tüm destelerde tekrar zamanı gelmiş sorular (yeni sorular hariç). */
export function bugunTekrarEdilecekler(simdi: number): OturumSorusu[] {
  const havuz: OturumSorusu[] = [];
  for (const y of durum.katalog?.desteler ?? []) {
    if (!y.deste) continue;
    for (const soru of y.deste.sorular) {
      if (tekrarZamaniGeldiMi(kayitBul(y.deste.id, soru.id), simdi)) havuz.push({ desteId: y.deste.id, soru });
    }
  }
  return tekrarSirasi(havuz, (o) => kayitBul(o.desteId, o.soru.id), simdi);
}
