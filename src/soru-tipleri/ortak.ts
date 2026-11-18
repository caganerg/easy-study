// Soru tipi modüllerinin ortak sözleşmesi ve doğrulama yardımcıları.
// Bu dosya DOM'a dokunmaz; yalnızca tipler ve saf fonksiyonlar içerir.

import type { Ayarlar, CevapTuru, Degerlendirme, SoruTemel, SoruTipi, SoruTuru } from "../tipler";
import { D } from "../metinler";

export type Nesne = Record<string, unknown>;

export function nesneMi(x: unknown): x is Nesne {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export interface KontrolAyarlari {
  turkceTolerans: boolean;
}

/** Soru ekranının bir soru tipine sağladığı olanaklar. */
export interface CizimBaglami<T extends SoruTipi> {
  ayarlar: Ayarlar;
  /** Diziyi karıştırılmış yeni bir kopya olarak döndürür. */
  karistir: <U>(dizi: readonly U[]) => U[];
  /** Kullanıcı cevabını verdiğinde çağrılır (yalnızca bir kez). */
  cevapla: (cevap: CevapTuru<T>) => void;
}

export interface CizilmisSoru<T extends SoruTipi> {
  el: HTMLElement;
  /** Değerlendirme sonrası girişleri kilitler, doğru/yanlışı işaretler. */
  sonucuGoster: (cevap: CevapTuru<T>, sonuc: Degerlendirme) => void;
  /** İlk odaklanacak öğe (klavye kullanımı için). */
  odakla?: () => void;
}

/** Her soru tipinin uygulaması gereken arayüz. */
export interface SoruTipiTanim<T extends SoruTipi> {
  tip: T;
  /** Bu tipe özgü bilinen alanlar (ortak alanlar hariç). */
  alanlar: readonly string[];
  /** Ortak alanları doğrulanmış ham nesneden tipli soru üretir; hata varsa null. */
  dogrula: (ham: Nesne, temel: SoruTemel, hatalar: string[]) => SoruTuru<T> | null;
  kontrol: (soru: SoruTuru<T>, cevap: CevapTuru<T>, ayarlar: KontrolAyarlari) => Degerlendirme;
  /** Geri bildirimde gösterilecek doğru cevap metni. */
  dogruCevapMetni: (soru: SoruTuru<T>) => string;
  ciz: (soru: SoruTuru<T>, baglam: CizimBaglami<T>) => CizilmisSoru<T>;
}

// ---- Doğrulama yardımcıları ----

export function bosOlmayanMetinMi(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export function metinDizisiMi(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(bosOlmayanMetinMi);
}

/** Zorunlu, boş olmayan metin alanı okur. */
export function metinOku(ham: Nesne, alan: string, hatalar: string[]): string | null {
  const deger = ham[alan];
  if (deger === undefined) {
    hatalar.push(D.alanEksik(alan));
    return null;
  }
  if (!bosOlmayanMetinMi(deger)) {
    hatalar.push(D.metinOlmali(alan));
    return null;
  }
  return deger;
}

/** İsteğe bağlı metin alanı okur; yoksa undefined. */
export function istegeBagliMetinOku(ham: Nesne, alan: string, hatalar: string[]): string | undefined {
  const deger = ham[alan];
  if (deger === undefined) return undefined;
  if (!bosOlmayanMetinMi(deger)) {
    hatalar.push(D.metinOlmali(alan));
    return undefined;
  }
  return deger;
}

export function kapsamli(x: never): never {
  throw new Error(`Ele alınmayan durum: ${JSON.stringify(x)}`);
}
