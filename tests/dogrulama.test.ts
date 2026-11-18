import { describe, expect, test } from "bun:test";
import { desteDogrula, listeDogrula } from "../src/dogrulama";
import { tekSoruluk } from "./yardimci";

const cs = (ek: Record<string, unknown> = {}) => ({
  id: "q001",
  tip: "coktan_secmeli",
  soru: "Soru?",
  secenekler: ["A", "B", "C"],
  dogru: 1,
  ...ek,
});

describe("deste düzeyi", () => {
  test("nesne olmayan girdi ölümcül hatadır", () => {
    for (const ham of [null, 42, "x", [], undefined]) {
      const s = desteDogrula(ham);
      expect(s.deste).toBeNull();
      expect(s.hatalar.length).toBeGreaterThan(0);
    }
  });

  test("yanlış sürüm reddedilir", () => {
    expect(desteDogrula({ ...(tekSoruluk(cs()) as object), surum: 2 }).deste).toBeNull();
  });

  test("eksik başlık ölümcül hatadır", () => {
    const { baslik: _, ...gerisi } = tekSoruluk(cs()) as Record<string, unknown>;
    expect(desteDogrula(gerisi).deste).toBeNull();
  });

  test("geçerli deste hatasız yüklenir", () => {
    const s = desteDogrula(tekSoruluk(cs({ aciklama: "Açıklama", etiketler: ["a", "b"] })));
    expect(s.hatalar).toEqual([]);
    expect(s.uyarilar).toEqual([]);
    expect(s.deste?.sorular).toHaveLength(1);
    expect(s.deste?.sorular[0]).toMatchObject({ id: "q001", dogru: 1, etiketler: ["a", "b"] });
  });

  test("bilinmeyen alanlar uyarıdır, hata değil", () => {
    const ham = { ...(tekSoruluk(cs({ zorluk: 3 })) as object), yazar: "x" };
    const s = desteDogrula(ham);
    expect(s.hatalar).toEqual([]);
    expect(s.uyarilar).toHaveLength(2);
    expect(s.uyarilar[1]).toMatchObject({ sira: 1, soruId: "q001" });
  });

  test("hatalı soru atlanır, diğerleri yüklenir; sıra ve id raporlanır", () => {
    const ham = {
      surum: 1,
      id: "test",
      baslik: "T",
      ders: "D",
      sorular: [cs(), cs({ id: "q002", dogru: 9 }), cs({ id: "q003" }), "bozuk"],
    };
    const s = desteDogrula(ham);
    expect(s.deste?.sorular.map((q) => q.id)).toEqual(["q001", "q003"]);
    expect(s.hatalar.map((h) => h.sira)).toEqual([2, 4]);
    expect(s.hatalar[0]?.soruId).toBe("q002");
  });

  test("tekrarlanan id hatadır ve ilk soru korunur", () => {
    const s = desteDogrula({ surum: 1, id: "t", baslik: "T", ders: "D", sorular: [cs(), cs({ soru: "İkinci" })] });
    expect(s.deste?.sorular).toHaveLength(1);
    expect(s.deste?.sorular[0]?.soru).toBe("Soru?");
    expect(s.hatalar).toHaveLength(1);
    expect(s.hatalar[0]).toMatchObject({ sira: 2, soruId: "q001" });
  });

  test("hiç geçerli soru yoksa hata verir ama çökmez", () => {
    const s = desteDogrula(tekSoruluk(cs({ dogru: -1 })));
    expect(s.deste?.sorular).toEqual([]);
    expect(s.hatalar.length).toBeGreaterThanOrEqual(2);
  });
});

describe("ortak soru alanları", () => {
  test("bilinmeyen tip", () => {
    const s = desteDogrula(tekSoruluk({ id: "q1", tip: "eslestirme", soru: "S" }));
    expect(s.hatalar[0]?.mesaj).toContain("eslestirme");
  });
  test("eksik tip", () => {
    expect(desteDogrula(tekSoruluk({ id: "q1", soru: "S" })).hatalar.length).toBeGreaterThan(0);
  });
  test("boş soru metni", () => {
    expect(desteDogrula(tekSoruluk(cs({ soru: "  " }))).hatalar.length).toBeGreaterThan(0);
  });
  test("geçersiz id biçimi", () => {
    expect(desteDogrula(tekSoruluk(cs({ id: "q 1" }))).hatalar.length).toBeGreaterThan(0);
  });
  test("etiketler metin dizisi olmalı", () => {
    expect(desteDogrula(tekSoruluk(cs({ etiketler: "a" }))).hatalar.length).toBeGreaterThan(0);
    expect(desteDogrula(tekSoruluk(cs({ etiketler: [1] }))).hatalar.length).toBeGreaterThan(0);
  });
});

describe("çoktan seçmeli", () => {
  test.each([
    ["tek şık", { secenekler: ["A"], dogru: 0 }],
    ["yedi şık", { secenekler: ["A", "B", "C", "D", "E", "F", "G"], dogru: 0 }],
    ["şıklar dizi değil", { secenekler: "A,B" }],
    ["boş şık", { secenekler: ["A", ""] }],
    ["tekrarlanan şık", { secenekler: ["A", "A"], dogru: 0 }],
    ["dogru metin", { dogru: "1" }],
    ["dogru ondalık", { dogru: 1.5 }],
    ["dogru negatif", { dogru: -1 }],
    ["dogru sınır dışı", { dogru: 3 }],
    ["dogru eksik", { dogru: undefined }],
  ])("%s hatalıdır", (_, ek) => {
    const s = desteDogrula(tekSoruluk(cs(ek)));
    expect(s.hatalar.length).toBeGreaterThan(0);
    expect(s.deste?.sorular).toEqual([]);
  });

  test("6 şık ve son indeks geçerlidir", () => {
    const s = desteDogrula(tekSoruluk(cs({ secenekler: ["A", "B", "C", "D", "E", "F"], dogru: 5 })));
    expect(s.hatalar).toEqual([]);
  });
});

describe("deste listesi", () => {
  test("geçerli liste", () => {
    const s = listeDogrula({ desteler: [{ dosya: "a.json", baslik: "A", ders: "D" }] });
    expect(s.hatalar).toEqual([]);
    expect(s.liste?.desteler).toHaveLength(1);
  });
  test("hatalı satırlar atlanır", () => {
    const s = listeDogrula({
      desteler: [
        { dosya: "a.json", baslik: "A", ders: "D" },
        { dosya: "../b.json", baslik: "B", ders: "D" },
        { dosya: "a.json", baslik: "A2", ders: "D" },
        { baslik: "C" },
      ],
    });
    expect(s.liste?.desteler.map((d) => d.dosya)).toEqual(["a.json"]);
    expect(new Set(s.hatalar.map((h) => h.sira))).toEqual(new Set([2, 3, 4]));
  });
  test("desteler dizi değilse ölümcül", () => {
    expect(listeDogrula({ desteler: {} }).liste).toBeNull();
  });
});

describe("doğru/yanlış", () => {
  const dy = (ek: Record<string, unknown> = {}) => ({ id: "q1", tip: "dogru_yanlis", soru: "S", dogru: true, ...ek });
  test("geçerli", () => expect(desteDogrula(tekSoruluk(dy())).hatalar).toEqual([]));
  test.each([["metin", "true"], ["sayı", 1], ["eksik", undefined]])("dogru %s ise hatalı", (_, dogru) => {
    expect(desteDogrula(tekSoruluk(dy({ dogru }))).hatalar.length).toBeGreaterThan(0);
  });
});

describe("boşluk doldurma", () => {
  const b = (ek: Record<string, unknown> = {}) => ({ id: "q1", tip: "bosluk", soru: "A ___ B ___", cevaplar: [["a"], ["b", "B2"]], ...ek });
  test("çok boşluklu geçerli soru", () => {
    const s = desteDogrula(tekSoruluk(b()));
    expect(s.hatalar).toEqual([]);
    expect(s.deste?.sorular[0]).toMatchObject({ cevaplar: [["a"], ["b", "B2"]] });
  });
  test.each([
    ["boşluk sayısı az", { cevaplar: [["a"]] }],
    ["boşluk sayısı fazla", { cevaplar: [["a"], ["b"], ["c"]] }],
    ["metinde boşluk yok", { soru: "A B", cevaplar: [["a"]] }],
    ["boş kabul listesi", { cevaplar: [["a"], []] }],
    ["düz dizi", { cevaplar: ["a", "b"] }],
    ["boş metin cevap", { cevaplar: [["a"], [" "]] }],
    ["cevaplar eksik", { cevaplar: undefined }],
  ])("%s hatalıdır", (_, ek) => {
    expect(desteDogrula(tekSoruluk(b(ek))).hatalar.length).toBeGreaterThan(0);
  });
});
