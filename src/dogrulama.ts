// Deste ve deste listesi doğrulaması. Girdi unknown'dur; çıktı tipli veridir.
// Hatalı sorular atlanır, uygulama çökmez. Kurallar sema/deste.schema.json ile
// aynı tutulmalıdır (tests/sema-tutarlilik.test.ts bunu denetler).

import { D } from "./metinler";
import { SORU_TIPLERI, soruTipiMi } from "./soru-tipleri/kayit";
import {
  istegeBagliMetinOku,
  metinDizisiMi,
  metinOku,
  nesneMi,
  type Nesne,
} from "./soru-tipleri/ortak";
import type { Deste, DesteDogrulamasi, DesteOzeti, ListeDogrulamasi, Soru, SoruTemel, Sorun } from "./tipler";

export const DESTE_SURUMU = 1;
export const DESTE_ID_DESENI = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SORU_ID_DESENI = /^[A-Za-z0-9_-]+$/;
export const DOSYA_DESENI = /^[A-Za-z0-9_.-]+\.json$/;

const DESTE_ALANLARI = ["surum", "id", "baslik", "ders", "aciklama", "sorular"];
const ORTAK_SORU_ALANLARI = ["id", "tip", "soru", "aciklama", "etiketler"];

function bilinmeyenAlanlar(ham: Nesne, bilinen: readonly string[]): string[] {
  return Object.keys(ham).filter((k) => !bilinen.includes(k));
}

/** Tek bir soruyu doğrular; hatalar listesine mesaj ekler. */
export function soruDogrula(ham: unknown, hatalar: string[], uyarilar: string[]): Soru | null {
  if (!nesneMi(ham)) {
    hatalar.push(D.nesneDegil);
    return null;
  }
  const baslangic = hatalar.length;

  const id = metinOku(ham, "id", hatalar);
  if (id !== null && !SORU_ID_DESENI.test(id)) hatalar.push(D.idBicimi("id", SORU_ID_DESENI.source));
  const soru = metinOku(ham, "soru", hatalar);
  const aciklama = istegeBagliMetinOku(ham, "aciklama", hatalar);

  let etiketler: string[] | undefined;
  if (ham["etiketler"] !== undefined) {
    if (metinDizisiMi(ham["etiketler"])) etiketler = ham["etiketler"];
    else hatalar.push(D.etiketMetinOlmali);
  }

  const tip = ham["tip"];
  if (tip === undefined) {
    hatalar.push(D.alanEksik("tip"));
    return null;
  }
  if (!soruTipiMi(tip)) {
    hatalar.push(D.bilinmeyenTip(String(tip)));
    return null;
  }
  const tanim = SORU_TIPLERI[tip];
  for (const alan of bilinmeyenAlanlar(ham, [...ORTAK_SORU_ALANLARI, ...tanim.alanlar])) {
    uyarilar.push(D.bilinmeyenAlan(alan));
  }

  if (id === null || soru === null) {
    // Ortak alan hatası olsa da tipe özgü hataları da raporla.
    tanim.dogrula(ham, { id: "", soru: "" }, hatalar);
    return null;
  }
  const temel: SoruTemel = { id, soru };
  if (aciklama !== undefined) temel.aciklama = aciklama;
  if (etiketler !== undefined) temel.etiketler = etiketler;

  const sonuc = tanim.dogrula(ham, temel, hatalar);
  return hatalar.length > baslangic ? null : sonuc;
}

export function desteDogrula(ham: unknown): DesteDogrulamasi {
  const hatalar: Sorun[] = [];
  const uyarilar: Sorun[] = [];
  const olumcul = (mesaj: string): DesteDogrulamasi => ({ deste: null, hatalar: [...hatalar, { mesaj }], uyarilar });

  if (!nesneMi(ham)) return olumcul(D.nesneDegil);

  if (ham["surum"] !== DESTE_SURUMU) return olumcul(D.surumGecersiz(DESTE_SURUMU));

  const desteHatalari: string[] = [];
  const id = metinOku(ham, "id", desteHatalari);
  if (id !== null && !DESTE_ID_DESENI.test(id)) desteHatalari.push(D.idBicimi("id", DESTE_ID_DESENI.source));
  const baslik = metinOku(ham, "baslik", desteHatalari);
  const ders = metinOku(ham, "ders", desteHatalari);
  const sorularHam = ham["sorular"];
  if (sorularHam === undefined) desteHatalari.push(D.alanEksik("sorular"));
  else if (!Array.isArray(sorularHam)) desteHatalari.push(D.diziOlmali("sorular"));

  if (desteHatalari.length > 0 || id === null || baslik === null || ders === null || !Array.isArray(sorularHam)) {
    return { deste: null, hatalar: desteHatalari.map((mesaj) => ({ mesaj })), uyarilar };
  }

  // aciklama hatalıysa deste yine yüklenir, yalnızca hata bildirilir.
  const aciklamaHatalari: string[] = [];
  const aciklama = istegeBagliMetinOku(ham, "aciklama", aciklamaHatalari);
  hatalar.push(...aciklamaHatalari.map((mesaj) => ({ mesaj })));
  for (const alan of bilinmeyenAlanlar(ham, DESTE_ALANLARI)) uyarilar.push({ mesaj: D.bilinmeyenAlan(alan) });

  const sorular: Soru[] = [];
  const ilkSira = new Map<string, number>();

  sorularHam.forEach((sh: unknown, i) => {
    const sira = i + 1;
    const hamId = nesneMi(sh) && typeof sh["id"] === "string" ? sh["id"] : undefined;
    const soruHatalari: string[] = [];
    const soruUyarilari: string[] = [];
    const soru = soruDogrula(sh, soruHatalari, soruUyarilari);

    if (hamId !== undefined) {
      const onceki = ilkSira.get(hamId);
      if (onceki !== undefined) soruHatalari.push(D.tekrarlananId(hamId, onceki));
      else ilkSira.set(hamId, sira);
    }

    const konum = hamId !== undefined ? { sira, soruId: hamId } : { sira };
    for (const mesaj of soruHatalari) hatalar.push({ ...konum, mesaj });
    for (const mesaj of soruUyarilari) uyarilar.push({ ...konum, mesaj });
    if (soru && soruHatalari.length === 0) sorular.push(soru);
  });

  if (sorular.length === 0) hatalar.push({ mesaj: D.soruYok });

  const deste: Deste = { surum: 1, id, baslik, ders, sorular };
  if (aciklama !== undefined) deste.aciklama = aciklama;
  return { deste, hatalar, uyarilar };
}

/** public/desteler/index.json doğrulaması. Hatalı satırlar atlanır. */
export function listeDogrula(ham: unknown): ListeDogrulamasi {
  const hatalar: Sorun[] = [];
  const uyarilar: Sorun[] = [];
  if (!nesneMi(ham)) return { liste: null, hatalar: [{ mesaj: D.nesneDegil }], uyarilar };
  const satirlar = ham["desteler"];
  if (!Array.isArray(satirlar)) return { liste: null, hatalar: [{ mesaj: D.diziOlmali("desteler") }], uyarilar };
  for (const alan of bilinmeyenAlanlar(ham, ["desteler"])) uyarilar.push({ mesaj: D.bilinmeyenAlan(alan) });

  const desteler: DesteOzeti[] = [];
  const gorulen = new Set<string>();
  satirlar.forEach((s: unknown, i) => {
    const sira = i + 1;
    const h: string[] = [];
    if (!nesneMi(s)) {
      hatalar.push({ sira, mesaj: D.nesneDegil });
      return;
    }
    const dosya = metinOku(s, "dosya", h);
    if (dosya !== null && !DOSYA_DESENI.test(dosya)) h.push(D.dosyaAdi);
    const baslik = metinOku(s, "baslik", h);
    const ders = metinOku(s, "ders", h);
    if (dosya !== null && gorulen.has(dosya)) h.push(D.tekrarlananDosya(dosya));
    for (const alan of bilinmeyenAlanlar(s, ["dosya", "baslik", "ders"])) uyarilar.push({ sira, mesaj: D.bilinmeyenAlan(alan) });
    hatalar.push(...h.map((mesaj) => ({ sira, mesaj })));
    if (h.length === 0 && dosya !== null && baslik !== null && ders !== null) {
      gorulen.add(dosya);
      desteler.push({ dosya, baslik, ders });
    }
  });
  return { liste: { desteler }, hatalar, uyarilar };
}
