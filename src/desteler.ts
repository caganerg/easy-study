// Deste listesini ve desteleri ağdan yükler. Yollar BASE_URL'e göredir.

import { listeDogrula, desteDogrula } from "./dogrulama";
import { D, M } from "./metinler";
import type { Deste, DesteOzeti, Sorun } from "./tipler";

export interface YuklenenDeste {
  ozet: DesteOzeti;
  deste: Deste | null;
  hatalar: Sorun[];
  uyarilar: Sorun[];
}

export interface DesteKatalogu {
  desteler: YuklenenDeste[];
  /** index.json'un kendisiyle ilgili sorunlar. */
  listeSorunlari: Sorun[];
  /** Liste hiç okunamadıysa. */
  listeHatasi: string | null;
}

function desteYolu(dosya: string): string {
  return `${import.meta.env.BASE_URL}desteler/${encodeURIComponent(dosya)}`;
}

async function jsonGetir(yol: string): Promise<unknown> {
  // no-cache: tarayıcı önbelleği yerine sunucuya sorulur; çevrimdışıyken
  // service worker (NetworkFirst) son kopyayı verir.
  const yanit = await fetch(yol, { cache: "no-cache" });
  if (!yanit.ok) throw new Error(`HTTP ${yanit.status}`);
  const veri: unknown = await yanit.json();
  return veri;
}

async function desteYukle(ozet: DesteOzeti): Promise<YuklenenDeste> {
  try {
    const sonuc = desteDogrula(await jsonGetir(desteYolu(ozet.dosya)));
    return { ozet, ...sonuc };
  } catch (e) {
    const neden = e instanceof Error ? e.message : String(e);
    return { ozet, deste: null, hatalar: [{ mesaj: `${M.desteYuklenemedi(ozet.dosya)} (${neden})` }], uyarilar: [] };
  }
}

export async function katalogYukle(): Promise<DesteKatalogu> {
  let ham: unknown;
  try {
    ham = await jsonGetir(desteYolu("index.json"));
  } catch {
    return { desteler: [], listeSorunlari: [], listeHatasi: M.listeYuklenemedi };
  }
  const { liste, hatalar, uyarilar } = listeDogrula(ham);
  if (!liste) return { desteler: [], listeSorunlari: hatalar, listeHatasi: M.listeYuklenemedi };

  const desteler = await Promise.all(liste.desteler.map(desteYukle));

  // Aynı deste id'si iki dosyada kullanılmışsa ilerleme karışır: ikinciyi devre dışı bırak.
  const gorulen = new Map<string, string>();
  for (const y of desteler) {
    if (!y.deste) continue;
    const onceki = gorulen.get(y.deste.id);
    if (onceki !== undefined) {
      y.hatalar.push({ mesaj: D.tekrarlananDeste(y.deste.id, onceki) });
      y.deste = null;
    } else gorulen.set(y.deste.id, y.ozet.dosya);
  }
  return { desteler, listeSorunlari: [...hatalar, ...uyarilar], listeHatasi: null };
}
