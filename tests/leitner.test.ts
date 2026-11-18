import { describe, expect, test } from "bun:test";
import { ilerlemeKaydiCoz, kayitGuncelle, ogrenildiMi, sonCevapYanlisMi, type IlerlemeKaydi } from "../src/leitner";

const SIMDI = new Date(2026, 2, 15, 14, 30).getTime();
const kimlik = { desteId: "d", soruId: "q1" };

function arka(adimlar: boolean[], baslangic = SIMDI): IlerlemeKaydi | undefined {
  let k: IlerlemeKaydi | undefined;
  for (const d of adimlar) k = kayitGuncelle(k, kimlik, d, baslangic);
  return k;
}

describe("kutu geçişleri", () => {
  test("yeni soruya doğru → kutu 2, yanlış → kutu 1", () => {
    expect(kayitGuncelle(undefined, kimlik, true, SIMDI).kutu).toBe(2);
    expect(kayitGuncelle(undefined, kimlik, false, SIMDI).kutu).toBe(1);
  });
  test("doğru cevaplar bir üst kutuya taşır, en fazla 5", () => {
    expect(arka([true, true, true])?.kutu).toBe(4);
    expect(arka([true, true, true, true])?.kutu).toBe(5);
    expect(arka([true, true, true, true, true, true])?.kutu).toBe(5);
  });
  test("yanlış cevap kutu 1'e indirir", () => {
    expect(arka([true, true, true, true, false])?.kutu).toBe(1);
  });
  test("sayaçlar ve son çözülme", () => {
    const k = arka([true, false, true])!;
    expect(k).toMatchObject({ dogruSayisi: 2, yanlisSayisi: 1, sonCozulme: SIMDI });
  });
  test("kutu 5 öğrenildi sayılır", () => {
    expect(ogrenildiMi(arka([true, true, true, true]))).toBe(true);
    expect(ogrenildiMi(arka([true, true, true]))).toBe(false);
    expect(ogrenildiMi(undefined)).toBe(false);
  });
  test("son cevap yanlış mı", () => {
    expect(sonCevapYanlisMi(arka([true, false]))).toBe(true);
    expect(sonCevapYanlisMi(arka([false, true]))).toBe(false);
    expect(sonCevapYanlisMi(undefined)).toBe(false);
  });
});

describe("kayıt doğrulama", () => {
  const gecerli = { desteId: "d", soruId: "q", kutu: 3, sonCozulme: 1, dogruSayisi: 1, yanlisSayisi: 0 };
  test("geçerli kayıt", () => expect(ilerlemeKaydiCoz(gecerli)).toEqual(gecerli));
  test.each([
    ["kutu 0", { kutu: 0 }],
    ["kutu 6", { kutu: 6 }],
    ["kutu metin", { kutu: "3" }],
    ["negatif sayaç", { dogruSayisi: -1 }],
    ["boş id", { soruId: "" }],
    ["zaman yok", { sonCozulme: undefined }],
  ])("%s reddedilir", (_, ek) => {
    expect(ilerlemeKaydiCoz({ ...gecerli, ...ek })).toBeNull();
  });
  test("nesne olmayan", () => expect(ilerlemeKaydiCoz("x")).toBeNull());
  test("eski sürümün sonrakiTekrar alanı yok sayılır", () => {
    expect(ilerlemeKaydiCoz({ ...gecerli, sonrakiTekrar: 123 })).toEqual(gecerli);
  });
});
