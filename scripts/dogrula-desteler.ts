// public/desteler altındaki index.json'u ve listelenen tüm desteleri doğrular.
// Hem dogrulama.ts hem de JSON Şeması (ajv) ile denetler. Hata varsa çıkış kodu 1.
//
// Kullanım: bun run dogrula

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { desteDogrula, listeDogrula } from "../src/dogrulama";
import type { Sorun } from "../src/tipler";

const KOK = join(import.meta.dir, "..");
const DESTE_DIZINI = join(KOK, "public", "desteler");

let hataSayisi = 0;
let uyariSayisi = 0;

const yer = (s: Sorun) => [s.sira !== undefined ? `#${s.sira}` : null, s.soruId].filter(Boolean).join(" ");

function hata(dosya: string, mesaj: string): void {
  hataSayisi++;
  console.error(`  ✗ ${dosya}: ${mesaj}`);
}
function uyari(dosya: string, mesaj: string): void {
  uyariSayisi++;
  console.warn(`  ! ${dosya}: ${mesaj}`);
}

function jsonOku(dosya: string): unknown {
  const yol = join(DESTE_DIZINI, dosya);
  try {
    return JSON.parse(readFileSync(yol, "utf8")) as unknown;
  } catch (e) {
    hata(dosya, `JSON okunamadı: ${e instanceof Error ? e.message : String(e)}`);
    return undefined;
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const sema = ajv.compile(JSON.parse(readFileSync(join(KOK, "sema", "deste.schema.json"), "utf8")) as object);

console.log("Desteler doğrulanıyor…");

const listeHam = jsonOku("index.json");
const { liste, hatalar, uyarilar } = listeHam === undefined ? { liste: null, hatalar: [], uyarilar: [] } : listeDogrula(listeHam);
for (const h of hatalar) hata("index.json", `${yer(h)} ${h.mesaj}`.trim());
for (const u of uyarilar) uyari("index.json", `${yer(u)} ${u.mesaj}`.trim());

const listelenen = new Set<string>();
const desteIdleri = new Map<string, string>();

for (const ozet of liste?.desteler ?? []) {
  listelenen.add(ozet.dosya);
  if (!existsSync(join(DESTE_DIZINI, ozet.dosya))) {
    hata(ozet.dosya, "index.json'da listeleniyor ama dosya yok.");
    continue;
  }
  const ham = jsonOku(ozet.dosya);
  if (ham === undefined) continue;

  const s = desteDogrula(ham);
  for (const h of s.hatalar) hata(ozet.dosya, `${yer(h)} ${h.mesaj}`.trim());
  for (const u of s.uyarilar) uyari(ozet.dosya, `${yer(u)} ${u.mesaj}`.trim());

  if (!sema(ham)) {
    for (const e of sema.errors ?? []) hata(ozet.dosya, `şema: ${e.instancePath || "/"} ${e.message ?? ""}`);
  }
  if (s.deste) {
    const onceki = desteIdleri.get(s.deste.id);
    if (onceki) hata(ozet.dosya, `deste id'si “${s.deste.id}” ${onceki} dosyasında da kullanılıyor.`);
    else desteIdleri.set(s.deste.id, ozet.dosya);
    if (s.deste.baslik !== ozet.baslik) uyari(ozet.dosya, `başlık index.json'dakinden farklı (“${ozet.baslik}”).`);
    if (s.deste.ders !== ozet.ders) uyari(ozet.dosya, `ders index.json'dakinden farklı (“${ozet.ders}”).`);
    const temiz = s.hatalar.length === 0 && sema(ham);
    console.log(`  ${temiz ? "✓" : "~"} ${ozet.dosya}: ${s.deste.sorular.length} geçerli soru`);
  }
}

for (const dosya of readdirSync(DESTE_DIZINI)) {
  if (dosya.endsWith(".json") && dosya !== "index.json" && !listelenen.has(dosya)) {
    hata(dosya, "dosya var ama index.json'da listelenmiyor.");
  }
}

console.log(`\n${hataSayisi} hata, ${uyariSayisi} uyarı.`);
process.exit(hataSayisi > 0 ? 1 : 0);
