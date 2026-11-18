import { describe, expect, test } from "bun:test";
import { bicimAyristir, boslukSayisi } from "../src/bicim";
import { boslukSonuclari, cevapKontrol, dogruCevapMetni, normallestir } from "../src/cevap";
import type { Soru } from "../src/tipler";

const acik = { turkceTolerans: true };
const kapali = { turkceTolerans: false };

describe("normalleştirme", () => {
  test("İstanbul / istanbul / ISTANBUL / Istanbul eşit (tolerans açık)", () => {
    const hepsi = ["İstanbul", "istanbul", "ISTANBUL", "Istanbul"].map((s) => normallestir(s, acik));
    expect(new Set(hepsi).size).toBe(1);
  });

  test("Türkçe küçük harf kuralları: I → ı, İ → i (tolerans kapalı)", () => {
    expect(normallestir("İSTANBUL", kapali)).toBe("istanbul");
    expect(normallestir("ISPARTA", kapali)).toBe("ısparta");
    expect(normallestir("İstanbul", kapali)).toBe(normallestir("istanbul", kapali));
    expect(normallestir("IŞIK", kapali)).toBe("ışık");
  });

  test("boşluklar kırpılır ve teke indirilir", () => {
    expect(normallestir("  Triticum    aestivum \t", acik)).toBe("triticum aestivum");
  });

  test("sondaki nokta ve virgül yok sayılır", () => {
    expect(normallestir("aestivum.", acik)).toBe("aestivum");
    expect(normallestir("aestivum,", acik)).toBe("aestivum");
    expect(normallestir("aestivum. ", acik)).toBe("aestivum");
    expect(normallestir("a.b", acik)).toBe("a.b");
  });

  test("tolerans açıkken sogan = soğan", () => {
    expect(normallestir("sogan", acik)).toBe(normallestir("soğan", acik));
    expect(normallestir("ÇĞİÖŞÜ", acik)).toBe("cgiosu");
  });

  test("tolerans kapalıyken sogan ≠ soğan", () => {
    expect(normallestir("sogan", kapali)).not.toBe(normallestir("soğan", kapali));
  });
});

describe("boşluk doldurma kontrolü", () => {
  const soru: Soru = {
    id: "q1",
    tip: "bosluk",
    soru: "Ekmeklik buğday ___ , makarnalık buğday ___ olarak bilinir.",
    cevaplar: [["Triticum aestivum", "T. aestivum"], ["Triticum durum"]],
  };

  test("her boşluk ayrı değerlendirilir", () => {
    const s = cevapKontrol(soru, { tip: "bosluk", girilen: ["t. aestivum", "triticum aestivum"] }, acik);
    expect(s.dogru).toBe(false);
    expect(s.bosluklar).toEqual([true, false]);
  });

  test("hepsi doğruysa soru doğru", () => {
    const s = cevapKontrol(soru, { tip: "bosluk", girilen: [" TRITICUM AESTIVUM.", "Triticum durum"] }, acik);
    expect(s).toEqual({ dogru: true, bosluklar: [true, true] });
  });

  test("boş cevap yanlıştır", () => {
    expect(boslukSonuclari([["a"]], [""], true)).toEqual([false]);
    expect(boslukSonuclari([["a"], ["b"]], ["a"], true)).toEqual([true, false]);
  });

  test("tolerans ayarı boşlukta uygulanır", () => {
    const s: Soru = { id: "q", tip: "bosluk", soru: "___", cevaplar: [["soğan"]] };
    expect(cevapKontrol(s, { tip: "bosluk", girilen: ["sogan"] }, acik).dogru).toBe(true);
    expect(cevapKontrol(s, { tip: "bosluk", girilen: ["sogan"] }, kapali).dogru).toBe(false);
  });

  test("doğru cevap metni", () => {
    expect(dogruCevapMetni(soru)).toBe("1) Triticum aestivum / T. aestivum; 2) Triticum durum");
  });
});

describe("diğer tipler", () => {
  test("çoktan seçmeli orijinal indeksle kontrol edilir", () => {
    const s: Soru = { id: "q", tip: "coktan_secmeli", soru: "?", secenekler: ["a", "b", "c"], dogru: 2 };
    expect(cevapKontrol(s, { tip: "coktan_secmeli", secilen: 2 }, acik).dogru).toBe(true);
    expect(cevapKontrol(s, { tip: "coktan_secmeli", secilen: 0 }, acik).dogru).toBe(false);
    expect(dogruCevapMetni(s)).toBe("c");
  });

  test("doğru/yanlış", () => {
    const s: Soru = { id: "q", tip: "dogru_yanlis", soru: "?", dogru: false };
    expect(cevapKontrol(s, { tip: "dogru_yanlis", secilen: false }, acik).dogru).toBe(true);
    expect(cevapKontrol(s, { tip: "dogru_yanlis", secilen: true }, acik).dogru).toBe(false);
  });

  test("tipi uyuşmayan cevap yanlış sayılır", () => {
    const s: Soru = { id: "q", tip: "dogru_yanlis", soru: "?", dogru: true };
    expect(cevapKontrol(s, { tip: "coktan_secmeli", secilen: 0 }, acik).dogru).toBe(false);
  });
});

describe("biçimlendirme", () => {
  test("kalın ve italik ayrıştırılır", () => {
    expect(bicimAyristir("a **b** *c* d")).toEqual([
      { tur: "duz", metin: "a " },
      { tur: "kalin", metin: "b" },
      { tur: "duz", metin: " " },
      { tur: "italik", metin: "c" },
      { tur: "duz", metin: " d" },
    ]);
  });
  test("HTML etiketleri düz metin olarak kalır", () => {
    expect(bicimAyristir("<img src=x onerror=alert(1)>")).toEqual([{ tur: "duz", metin: "<img src=x onerror=alert(1)>" }]);
  });
  test("tek yıldız ve çarpım işareti biçim sayılmaz", () => {
    expect(bicimAyristir("2 * 3 * 4")).toEqual([{ tur: "duz", metin: "2 * 3 * 4" }]);
  });
  test("boşluk sayısı", () => {
    expect(boslukSayisi("a ___ b _____ c __ d")).toBe(2);
  });
});
