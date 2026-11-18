// Cevap kontrolünün tek giriş noktası. Normalleştirme normallestir.ts'te durur
// (soru tipi modülleri de onu kullandığı için döngüsel içe aktarmayı önler).

import { kapsamli, type KontrolAyarlari } from "./soru-tipleri/ortak";
import { SORU_TIPLERI } from "./soru-tipleri/kayit";
import type { Cevap, Degerlendirme, Soru } from "./tipler";

export { normallestir } from "./normallestir";
export { boslukSonuclari } from "./soru-tipleri/bosluk";

/** Cevabın tipi soruyla uyuşmazsa yanlış sayılır. */
export function cevapKontrol(soru: Soru, cevap: Cevap, ayarlar: KontrolAyarlari): Degerlendirme {
  switch (soru.tip) {
    case "coktan_secmeli":
      return cevap.tip === soru.tip ? SORU_TIPLERI.coktan_secmeli.kontrol(soru, cevap, ayarlar) : { dogru: false };
    case "dogru_yanlis":
      return cevap.tip === soru.tip ? SORU_TIPLERI.dogru_yanlis.kontrol(soru, cevap, ayarlar) : { dogru: false };
    case "bosluk":
      return cevap.tip === soru.tip ? SORU_TIPLERI.bosluk.kontrol(soru, cevap, ayarlar) : { dogru: false };
    default:
      return kapsamli(soru);
  }
}

export function dogruCevapMetni(soru: Soru): string {
  switch (soru.tip) {
    case "coktan_secmeli":
      return SORU_TIPLERI.coktan_secmeli.dogruCevapMetni(soru);
    case "dogru_yanlis":
      return SORU_TIPLERI.dogru_yanlis.dogruCevapMetni(soru);
    case "bosluk":
      return SORU_TIPLERI.bosluk.dogruCevapMetni(soru);
    default:
      return kapsamli(soru);
  }
}
