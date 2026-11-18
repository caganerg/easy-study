// IndexedDB üzerinde küçük, bağımlılıksız bir sarmalayıcı. İlerleme kayıtları
// [desteId, soruId] bileşik anahtarıyla tutulur. Okunan her kayıt doğrulanır.

import { ilerlemeKaydiCoz, type IlerlemeKaydi } from "./leitner";

const VT_ADI = "ders-calis";
const VT_SURUMU = 1;
const DEPO = "ilerleme";

let vtSozu: Promise<IDBDatabase> | null = null;

function istekSozu<T>(istek: IDBRequest<T>): Promise<T> {
  return new Promise((coz, reddet) => {
    istek.onsuccess = () => coz(istek.result);
    istek.onerror = () => reddet(istek.error ?? new Error("IndexedDB isteği başarısız"));
  });
}

function islemBitti(islem: IDBTransaction): Promise<void> {
  return new Promise((coz, reddet) => {
    islem.oncomplete = () => coz();
    islem.onerror = () => reddet(islem.error ?? new Error("IndexedDB işlemi başarısız"));
    islem.onabort = () => reddet(islem.error ?? new Error("IndexedDB işlemi iptal edildi"));
  });
}

function vtAc(): Promise<IDBDatabase> {
  vtSozu ??= new Promise<IDBDatabase>((coz, reddet) => {
    if (typeof indexedDB === "undefined") {
      reddet(new Error("IndexedDB desteklenmiyor"));
      return;
    }
    const istek = indexedDB.open(VT_ADI, VT_SURUMU);
    istek.onupgradeneeded = () => {
      const vt = istek.result;
      if (!vt.objectStoreNames.contains(DEPO)) vt.createObjectStore(DEPO, { keyPath: ["desteId", "soruId"] });
    };
    istek.onsuccess = () => {
      const vt = istek.result;
      // Başka sekmede sürüm yükseltilirse bağlantıyı bırak.
      vt.onversionchange = () => {
        vt.close();
        vtSozu = null;
      };
      coz(vt);
    };
    istek.onerror = () => reddet(istek.error ?? new Error("IndexedDB açılamadı"));
    istek.onblocked = () => reddet(new Error("IndexedDB başka bir sekme tarafından engellendi"));
  }).catch((e: unknown) => {
    vtSozu = null;
    throw e;
  });
  return vtSozu;
}

export async function tumKayitlar(): Promise<IlerlemeKaydi[]> {
  const vt = await vtAc();
  const ham: unknown[] = await istekSozu(vt.transaction(DEPO, "readonly").objectStore(DEPO).getAll());
  return ham.map(ilerlemeKaydiCoz).filter((k): k is IlerlemeKaydi => k !== null);
}

export async function kayitYaz(k: IlerlemeKaydi): Promise<void> {
  const vt = await vtAc();
  const islem = vt.transaction(DEPO, "readwrite");
  islem.objectStore(DEPO).put(k);
  await islemBitti(islem);
}

/** Kayıtları tek işlemde yazar; temizle=true ise önce tüm depoyu siler. */
export async function topluYaz(kayitlar: readonly IlerlemeKaydi[], temizle: boolean): Promise<void> {
  const vt = await vtAc();
  const islem = vt.transaction(DEPO, "readwrite");
  const depo = islem.objectStore(DEPO);
  if (temizle) depo.clear();
  for (const k of kayitlar) depo.put(k);
  await islemBitti(islem);
}

export async function tumunuSil(): Promise<void> {
  await topluYaz([], true);
}
