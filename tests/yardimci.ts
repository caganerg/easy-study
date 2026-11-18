// Testler için ortak yardımcılar.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020";

export const KOK = join(import.meta.dir, "..");

export function jsonOku(yol: string): unknown {
  return JSON.parse(readFileSync(yol, "utf8")) as unknown;
}

export function fixtureler(klasor: "gecerli" | "hatali"): { ad: string; veri: unknown }[] {
  const dizin = join(import.meta.dir, "fixtures", klasor);
  return readdirSync(dizin)
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((ad) => ({ ad, veri: jsonOku(join(dizin, ad)) }));
}

export function semaDogrulayici() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return ajv.compile(jsonOku(join(KOK, "sema", "deste.schema.json")) as object);
}

/** Tek soruluk deste kurar. */
export function tekSoruluk(soru: unknown): unknown {
  return { surum: 1, id: "test", baslik: "Test", ders: "Ders", sorular: [soru] };
}
