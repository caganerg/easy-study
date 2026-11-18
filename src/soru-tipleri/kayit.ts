// Soru tipi kayıt tablosu. Eşlenmiş tip sayesinde tipler.ts'e yeni bir soru
// tipi eklendiğinde burada karşılığı yoksa derleyici hata verir.

import type { SoruTipi } from "../tipler";
import { bosluk } from "./bosluk";
import { coktanSecmeli } from "./coktan-secmeli";
import { dogruYanlis } from "./dogru-yanlis";
import type { SoruTipiTanim } from "./ortak";

export const SORU_TIPLERI: { readonly [T in SoruTipi]: SoruTipiTanim<T> } = {
  coktan_secmeli: coktanSecmeli,
  dogru_yanlis: dogruYanlis,
  bosluk,
};

export const TIP_SIRASI: readonly SoruTipi[] = Object.keys(SORU_TIPLERI) as SoruTipi[];

export function soruTipiMi(x: unknown): x is SoruTipi {
  return typeof x === "string" && Object.hasOwn(SORU_TIPLERI, x);
}
