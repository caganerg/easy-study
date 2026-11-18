import { describe, expect, test } from "bun:test";
import { anahtar, type IlerlemeKaydi } from "../src/leitner";
import {
  bittiMi,
  cevapKaydet,
  dogruSay,
  haritadanBul,
  onceki,
  sonraki,
  bosSayisi,
  cevaplandiMi,
  mevcutSoru,
  oturumOlustur,
  ozet,
  soruSec,
  type OturumSecimi,
  type OturumSorusu,
} from "../src/oturum";
import type { Soru } from "../src/tipler";

const SIMDI = new Date(2026, 2, 15, 12).getTime();

/** Tekrarlanabilir sözde rastgele üreteç (mulberry32). */
function tohumlu(tohum: number): () => number {
  let a = tohum;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function soru(i: number, tip: Soru["tip"], etiketler?: string[]): Soru {
  const id = `q${String(i).padStart(3, "0")}`;
  const temel = { id, soru: `Soru ${i}`, ...(etiketler ? { etiketler } : {}) };
  switch (tip) {
    case "coktan_secmeli":
      return { ...temel, tip, secenekler: ["a", "b"], dogru: 0 };
    case "dogru_yanlis":
      return { ...temel, tip, dogru: true };
    case "bosluk":
      return { ...temel, tip, soru: "___", cevaplar: [["a"]] };
  }
}

// 30 soru: 10'ar tane her tipten; ilk 5 tanesi "tarih" etiketli.
const tipler: Soru["tip"][] = ["coktan_secmeli", "dogru_yanlis", "bosluk"];
const havuz: OturumSorusu[] = Array.from({ length: 30 }, (_, i) => ({
  desteId: "d",
  soru: soru(i + 1, tipler[i % 3]!, i < 5 ? ["tarih"] : undefined),
}));

function kayit(soruId: string, kutu: number, yanlis = 0): IlerlemeKaydi {
  return { desteId: "d", soruId, kutu, sonCozulme: SIMDI - 1, dogruSayisi: kutu - 1, yanlisSayisi: yanlis };
}

const ilerleme = new Map<string, IlerlemeKaydi>(
  [
    kayit("q001", 1, 1), // son cevap yanlış
    kayit("q002", 3), // önce yanlış olsa da son cevap doğru
    kayit("q003", 2),
    kayit("q004", 1, 2), // son cevap yanlış
    kayit("q005", 5), // öğrenildi
  ].map((k) => [anahtar(k.desteId, k.soruId), k]),
);
const bul = haritadanBul(ilerleme);
const secim = (ek: Partial<OturumSecimi> = {}): OturumSecimi => ({ mod: "karisik", tipler: [], adet: "tumu", etiketler: [], ...ek });
const idler = (l: OturumSorusu[]) => l.map((o) => o.soru.id);

describe("soru seçimi", () => {
  test("adet sınırı", () => {
    expect(soruSec(havuz, secim({ adet: 10 }), bul, tohumlu(1))).toHaveLength(10);
    expect(soruSec(havuz, secim({ adet: 20 }), bul, tohumlu(1))).toHaveLength(20);
    expect(soruSec(havuz, secim({ adet: "tumu" }), bul, tohumlu(1))).toHaveLength(30);
    expect(soruSec(havuz.slice(0, 4), secim({ adet: 10 }), bul, tohumlu(1))).toHaveLength(4);
  });

  test("karışık mod tüm soruları karıştırır, tekrarsız", () => {
    const s = idler(soruSec(havuz, secim(), bul, tohumlu(7)));
    expect(new Set(s).size).toBe(30);
    expect(s).not.toEqual(idler(havuz));
  });

  test("aynı tohumla aynı sonuç", () => {
    expect(idler(soruSec(havuz, secim({ adet: 10 }), bul, tohumlu(3)))).toEqual(
      idler(soruSec(havuz, secim({ adet: 10 }), bul, tohumlu(3))),
    );
  });

  test("tip filtresi", () => {
    const s = soruSec(havuz, secim({ tipler: ["bosluk"] }), bul, tohumlu(1));
    expect(s).toHaveLength(10);
    expect(s.every((o) => o.soru.tip === "bosluk")).toBe(true);
  });

  test("etiket filtresi", () => {
    const s = soruSec(havuz, secim({ etiketler: ["tarih"] }), bul, tohumlu(1));
    expect(idler(s).sort()).toEqual(["q001", "q002", "q003", "q004", "q005"]);
  });

  test("sadece yanlışlarım: son cevabı yanlış olanlar", () => {
    const s = soruSec(havuz, secim({ mod: "yanlislar" }), bul, tohumlu(1));
    expect(idler(s).sort()).toEqual(["q001", "q004"]);
  });

  test("filtreler modla birleşir", () => {
    const cs = soruSec(havuz, secim({ mod: "yanlislar", tipler: ["coktan_secmeli"] }), bul, tohumlu(1));
    expect(idler(cs).sort()).toEqual(["q001", "q004"]);
    const dy = soruSec(havuz, secim({ mod: "yanlislar", tipler: ["dogru_yanlis"] }), bul, tohumlu(1));
    expect(dy).toEqual([]);
  });
});

describe("oturum akışı", () => {
  test("cevapla, düzelt, ilerle, özet", () => {
    let o = oturumOlustur("T", havuz.slice(0, 3));
    expect(mevcutSoru(o)?.soru.id).toBe("q001");
    o = cevapKaydet(o, { tip: "coktan_secmeli", secilen: 1 }, false);
    o = cevapKaydet(o, { tip: "coktan_secmeli", secilen: 0 }, true); // ikinci cevap yok sayılır
    expect(o.sonuclar[0]).toMatchObject({ dogru: false, cevap: { secilen: 1 } });
    o = dogruSay(o);
    expect(o.sonuclar[0]).toMatchObject({ dogru: true, duzeltildi: true });
    o = sonraki(o);
    o = sonraki(cevapKaydet(o, { tip: "dogru_yanlis", secilen: false }, false));
    o = sonraki(cevapKaydet(o, { tip: "bosluk", girilen: ["a"] }, true));
    expect(bittiMi(o)).toBe(true);
    const oz = ozet(o);
    expect(oz).toMatchObject({ dogru: 2, yanlis: 1, bos: 0, yuzde: 67 });
    expect(idler(oz.yanlislar)).toEqual(["q002"]);
  });

  test("boş bırakma, geri dönme ve sonradan cevaplama", () => {
    let o = oturumOlustur("T", havuz.slice(0, 3));
    o = onceki(o); // ilk sorudan geri gidilemez
    expect(o.indeks).toBe(0);
    o = sonraki(o); // q001 boş
    expect(o.indeks).toBe(1);
    expect(cevaplandiMi(o)).toBe(false);
    o = sonraki(cevapKaydet(o, { tip: "dogru_yanlis", secilen: true }, true));
    expect(bosSayisi(o)).toBe(2);
    o = onceki(onceki(o));
    expect(mevcutSoru(o)?.soru.id).toBe("q001");
    o = cevapKaydet(o, { tip: "coktan_secmeli", secilen: 0 }, false);
    o = sonraki(o);
    expect(cevaplandiMi(o)).toBe(true); // q002'nin cevabı korunur
    o = cevapKaydet(o, { tip: "dogru_yanlis", secilen: false }, false); // yeniden cevaplanamaz
    expect(o.sonuclar[1]).toMatchObject({ dogru: true });
    o = sonraki(sonraki(o)); // q003 boş, oturum biter
    expect(bittiMi(o)).toBe(true);
    o = sonraki(o);
    expect(o.indeks).toBe(3);
    expect(ozet(o)).toMatchObject({ dogru: 1, yanlis: 1, bos: 1, yuzde: 33 });
  });
});
