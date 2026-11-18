// Soru metinlerindeki basit biçimlendirme: **kalın** ve *italik*.
// Ayrıştırma saftır (test edilebilir); çizim yalnızca text node kullanır.

import { el, ekle } from "./dom";

export type BicimParcasi = { tur: "duz" | "kalin" | "italik"; metin: string };

const BICIM = /\*\*(.+?)\*\*|\*([^*\s](?:[^*]*[^*\s])?)\*/g;
export const BOSLUK_DESENI = /_{3,}/g;

export function bicimAyristir(metin: string): BicimParcasi[] {
  const parcalar: BicimParcasi[] = [];
  let son = 0;
  for (const m of metin.matchAll(BICIM)) {
    const bas = m.index;
    if (bas > son) parcalar.push({ tur: "duz", metin: metin.slice(son, bas) });
    if (m[1] !== undefined) parcalar.push({ tur: "kalin", metin: m[1] });
    else if (m[2] !== undefined) parcalar.push({ tur: "italik", metin: m[2] });
    son = bas + m[0].length;
  }
  if (son < metin.length) parcalar.push({ tur: "duz", metin: metin.slice(son) });
  return parcalar;
}

function parcalariCiz(hedef: Node, metin: string): void {
  for (const p of bicimAyristir(metin)) {
    if (p.tur === "kalin") ekle(hedef, el("strong", null, p.metin));
    else if (p.tur === "italik") ekle(hedef, el("em", null, p.metin));
    else ekle(hedef, p.metin);
  }
}

/**
 * Biçimli metni güvenli şekilde DOM'a çevirir.
 * boslukCiz verilirse her ___ yerine onun döndürdüğü düğüm konur.
 */
export function bicimliMetin(metin: string, boslukCiz?: (sira: number) => Node): DocumentFragment {
  const f = document.createDocumentFragment();
  if (!boslukCiz) {
    parcalariCiz(f, metin);
    return f;
  }
  const parcalar = metin.split(BOSLUK_DESENI);
  parcalar.forEach((parca, i) => {
    parcalariCiz(f, parca);
    if (i < parcalar.length - 1) f.appendChild(boslukCiz(i + 1));
  });
  return f;
}

export function boslukSayisi(metin: string): number {
  return (metin.match(BOSLUK_DESENI) ?? []).length;
}
