// Leitner kutu sistemi. Saf fonksiyonlar: şimdiki zaman (ms) parametre olarak
// verilir, Date.now() burada çağrılmaz.

import { nesneMi } from "./soru-tipleri/ortak";

export const EN_UST_KUTU = 5;
/** Kutu → tekrar aralığı (gün). Kutu 1 = aynı gün. */
export const TEKRAR_ARALIGI_GUN: Readonly<Record<number, number>> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

export interface IlerlemeKaydi {
  desteId: string;
  soruId: string;
  /** 1–5 */
  kutu: number;
  /** Son çözülme zamanı (ms, epoch). */
  sonCozulme: number;
  /** Bir sonraki tekrarın başladığı an (ms, yerel gün başı). */
  sonrakiTekrar: number;
  dogruSayisi: number;
  yanlisSayisi: number;
}

export function anahtar(desteId: string, soruId: string): string {
  return `${desteId}\u0000${soruId}`;
}

/** Yerel saatle günün başlangıcı. Tekrarlar gün bazında planlanır. */
export function gunBaslangici(zaman: number): number {
  const d = new Date(zaman);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Yerel takvimde n gün sonrasının başlangıcı (yaz saati geçişlerine dayanıklı). */
export function gunEkle(zaman: number, gun: number): number {
  const d = new Date(gunBaslangici(zaman));
  d.setDate(d.getDate() + gun);
  return d.getTime();
}

export function sonrakiTekrarZamani(kutu: number, simdi: number): number {
  return gunEkle(simdi, TEKRAR_ARALIGI_GUN[kutu] ?? 0);
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
  const kutu = dogru ? Math.min(eskiKutu + 1, EN_UST_KUTU) : 1;
  return {
    desteId: kimlik.desteId,
    soruId: kimlik.soruId,
    kutu,
    sonCozulme: simdi,
    sonrakiTekrar: sonrakiTekrarZamani(kutu, simdi),
    dogruSayisi: (onceki?.dogruSayisi ?? 0) + (dogru ? 1 : 0),
    yanlisSayisi: (onceki?.yanlisSayisi ?? 0) + (dogru ? 0 : 1),
  };
}

export function ogrenildiMi(k: IlerlemeKaydi | undefined): boolean {
  return k !== undefined && k.kutu >= EN_UST_KUTU;
}

export function tekrarZamaniGeldiMi(k: IlerlemeKaydi | undefined, simdi: number): boolean {
  return k !== undefined && k.sonrakiTekrar <= simdi;
}

/** Son cevap yanlış mı? Yanlış cevap kutuyu 1'e indirir, doğru cevap en az 2'ye çıkarır. */
export function sonCevapYanlisMi(k: IlerlemeKaydi | undefined): boolean {
  return k !== undefined && k.kutu === 1 && k.yanlisSayisi > 0;
}

/**
 * "Tekrar zamanı gelenler" sırası: önce zamanı geçmiş sorular (en eski tarihli
 * önce, eşitse düşük kutu önce), sonra hiç çözülmemiş (yeni) sorular — ikincisi
 * gelen sırayı korur. Zamanı gelmemiş sorular dahil edilmez.
 */
export function tekrarSirasi<T>(ogeler: readonly T[], kayit: (o: T) => IlerlemeKaydi | undefined, simdi: number): T[] {
  const zamaniGelen: { o: T; k: IlerlemeKaydi }[] = [];
  const yeni: T[] = [];
  for (const o of ogeler) {
    const k = kayit(o);
    if (k === undefined) yeni.push(o);
    else if (tekrarZamaniGeldiMi(k, simdi)) zamaniGelen.push({ o, k });
  }
  zamaniGelen.sort((a, b) => a.k.sonrakiTekrar - b.k.sonrakiTekrar || a.k.kutu - b.k.kutu);
  return [...zamaniGelen.map((x) => x.o), ...yeni];
}

function negatifOlmayanTamSayi(x: unknown): x is number {
  return typeof x === "number" && Number.isInteger(x) && x >= 0;
}

/** unknown → IlerlemeKaydi (IndexedDB ve yedek dosyası için). Geçersizse null. */
export function ilerlemeKaydiCoz(ham: unknown): IlerlemeKaydi | null {
  if (!nesneMi(ham)) return null;
  const { desteId, soruId, kutu, sonCozulme, sonrakiTekrar, dogruSayisi, yanlisSayisi } = ham;
  if (typeof desteId !== "string" || desteId === "" || typeof soruId !== "string" || soruId === "") return null;
  if (!negatifOlmayanTamSayi(kutu) || kutu < 1 || kutu > EN_UST_KUTU) return null;
  if (!negatifOlmayanTamSayi(sonCozulme) || !negatifOlmayanTamSayi(sonrakiTekrar)) return null;
  if (!negatifOlmayanTamSayi(dogruSayisi) || !negatifOlmayanTamSayi(yanlisSayisi)) return null;
  return { desteId, soruId, kutu, sonCozulme, sonrakiTekrar, dogruSayisi, yanlisSayisi };
}
