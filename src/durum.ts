// Uygulamanın paylaşılan (bellekteki) durumu.

import type { DesteKatalogu, YuklenenDeste } from "./desteler";
import type { IlerlemeKaydi } from "./leitner";
import type { Oturum } from "./oturum";
import type { Ayarlar } from "./tipler";

export interface Durum {
  katalog: DesteKatalogu | null;
  ayarlar: Ayarlar;
  oturum: Oturum | null;
  /** anahtar(desteId, soruId) → kayıt. IndexedDB'nin bellekteki kopyası. */
  ilerleme: Map<string, IlerlemeKaydi>;
  /** IndexedDB kullanılamıyorsa false (ilerleme yalnızca bellekte). */
  kalici: boolean;
}

export const durum: Durum = {
  katalog: null,
  ayarlar: { turkceTolerans: true, siklariKaristir: true, tema: "sistem", yaziBoyutu: "normal" },
  oturum: null,
  ilerleme: new Map(),
  kalici: true,
};

export function desteBul(id: string): YuklenenDeste | undefined {
  return durum.katalog?.desteler.find((y) => y.deste?.id === id);
}

/** main.ts tarafından doldurulur; ekranların döngüsel içe aktarma yapmadan yeniden çizim istemesi için. */
export const gezinti = {
  yenidenCiz: (): void => {},
};
