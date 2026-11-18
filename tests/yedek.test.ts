import { describe, expect, test } from "bun:test";
import { ayarlariCoz } from "../src/ayarlar";
import type { IlerlemeKaydi } from "../src/leitner";
import { VARSAYILAN_AYARLAR, type Ayarlar } from "../src/tipler";
import { birlestir, yedekCoz, yedekDosyaAdi, yedekOlustur } from "../src/yedek";

const SIMDI = new Date(2026, 10, 18, 9, 5).getTime();

const k = (soruId: string, sonCozulme: number, kutu = 2, desteId = "d"): IlerlemeKaydi => ({
  desteId,
  soruId,
  kutu,
  sonCozulme,
  sonrakiTekrar: sonCozulme + 1000,
  dogruSayisi: kutu - 1,
  yanlisSayisi: 0,
});

const ayarlar: Ayarlar = { turkceTolerans: false, siklariKaristir: true, tema: "koyu", yaziBoyutu: "buyuk" };
const kayitlar = [k("q1", 100), k("q2", 200, 5), k("q1", 300, 3, "baska")];

describe("dışa aktar → içe aktar", () => {
  test("JSON üzerinden gidiş-dönüş veriyi aynen korur", () => {
    const yedek = yedekOlustur(kayitlar, ayarlar, SIMDI);
    expect(yedek.surum).toBe(1);
    const metin = JSON.stringify(yedek);
    const sonuc = yedekCoz(JSON.parse(metin) as unknown);
    expect(sonuc).toEqual({ tamam: true, yedek });
    if (sonuc.tamam) {
      expect(sonuc.yedek.ilerleme).toEqual(kayitlar);
      expect(sonuc.yedek.ayarlar).toEqual(ayarlar);
    }
  });

  test("dosya adı ders-yedek-YYYY-AA-GG.json", () => {
    expect(yedekDosyaAdi(SIMDI)).toBe("ders-yedek-2026-11-18.json");
    expect(yedekDosyaAdi(new Date(2026, 0, 3).getTime())).toBe("ders-yedek-2026-01-03.json");
  });
});

describe("birleştirme", () => {
  test("her soru için daha yeni kayıt kazanır", () => {
    const mevcut = [k("q1", 500, 4), k("q2", 100, 2)];
    const gelen = [k("q1", 400, 1), k("q2", 900, 5), k("q3", 50, 2)];
    const s = birlestir(mevcut, gelen);
    const bul = (id: string) => s.find((x) => x.soruId === id);
    expect(s).toHaveLength(3);
    expect(bul("q1")?.kutu).toBe(4); // mevcut daha yeni
    expect(bul("q2")?.kutu).toBe(5); // gelen daha yeni
    expect(bul("q3")).toBeDefined(); // yalnızca gelende var
  });
  test("eşit zamanda mevcut korunur", () => {
    expect(birlestir([k("q1", 100, 4)], [k("q1", 100, 1)])[0]?.kutu).toBe(4);
  });
  test("farklı destelerdeki aynı soru id'leri karışmaz", () => {
    expect(birlestir([k("q1", 1, 2, "a")], [k("q1", 2, 3, "b")])).toHaveLength(2);
  });
});

describe("bozuk yedek reddedilir", () => {
  const gecerli = () => JSON.parse(JSON.stringify(yedekOlustur(kayitlar, ayarlar, SIMDI))) as Record<string, unknown>;
  test.each([
    ["nesne değil", () => [1, 2]],
    ["null", () => null],
    ["başka uygulama", () => ({ ...gecerli(), uygulama: "x" })],
    ["sürüm yok", () => ({ ...gecerli(), surum: undefined })],
    ["gelecek sürüm", () => ({ ...gecerli(), surum: 2 })],
    ["tarih bozuk", () => ({ ...gecerli(), olusturulma: "dün" })],
    ["ayarlar yok", () => ({ ...gecerli(), ayarlar: undefined })],
    ["ilerleme dizi değil", () => ({ ...gecerli(), ilerleme: {} })],
    ["bozuk kayıt", () => ({ ...gecerli(), ilerleme: [k("q1", 1), { ...k("q2", 1), kutu: 9 }] })],
    ["eksik alanlı kayıt", () => ({ ...gecerli(), ilerleme: [{ desteId: "d", soruId: "q" }] })],
  ])("%s", (_, uret) => {
    const s = yedekCoz(uret());
    expect(s.tamam).toBe(false);
  });

  test("ayarlardaki geçersiz alanlar varsayılana döner", () => {
    const s = yedekCoz({ ...gecerli(), ayarlar: { tema: "mor", turkceTolerans: "evet", yaziBoyutu: "buyuk" } });
    expect(s.tamam && s.yedek.ayarlar).toEqual({ ...VARSAYILAN_AYARLAR, yaziBoyutu: "buyuk" });
  });
});

describe("ayarlar", () => {
  test("bozuk girdi varsayılan döner", () => {
    expect(ayarlariCoz(null)).toEqual(VARSAYILAN_AYARLAR);
    expect(ayarlariCoz("x")).toEqual(VARSAYILAN_AYARLAR);
  });
});
