// Şema ile dogrulama.ts'in birbirinden kopmadığını denetler.
// hatali/sema-*.json: şemanın da yakalaması gereken hatalar.
// hatali/kod-*.json : şemanın ifade edemediği, yalnızca kodun yakaladığı hatalar.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { desteDogrula } from "../src/dogrulama";
import { fixtureler, jsonOku, KOK, semaDogrulayici } from "./yardimci";

const sema = semaDogrulayici();

describe("geçerli desteler hem şemadan hem koddan geçer", () => {
  const yayindakiler = (jsonOku(join(KOK, "public", "desteler", "index.json")) as { desteler: { dosya: string }[] }).desteler.map((d) => ({
    ad: `public/desteler/${d.dosya}`,
    veri: jsonOku(join(KOK, "public", "desteler", d.dosya)),
  }));
  const liste = [...fixtureler("gecerli"), ...yayindakiler];
  test.each(liste.map((f) => [f.ad, f.veri] as const))("%s", (_, veri) => {
    const gecerli = sema(veri);
    expect(sema.errors ?? []).toEqual([]);
    expect(gecerli).toBe(true);
    expect(desteDogrula(veri).hatalar).toEqual([]);
  });
});

describe("hatalı desteler", () => {
  const liste = fixtureler("hatali");
  test("her hatalı fixture sema- ya da kod- ile başlar", () => {
    for (const f of liste) expect(f.ad).toMatch(/^(sema|kod)-/);
  });
  test.each(liste.map((f) => [f.ad, f.veri] as const))("%s", (ad, veri) => {
    expect(desteDogrula(veri).hatalar.length).toBeGreaterThan(0);
    // kod-* dosyaları şemadan geçmeli; geçmiyorsa sema- olarak yeniden adlandırılmalı.
    expect(sema(veri)).toBe(!ad.startsWith("sema-"));
  });
});
