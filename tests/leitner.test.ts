import { describe, expect, test } from "bun:test";
import {
  gunBaslangici,
  gunEkle,
  ilerlemeKaydiCoz,
  kayitGuncelle,
  ogrenildiMi,
  sonCevapYanlisMi,
  tekrarSirasi,
  tekrarZamaniGeldiMi,
  type IlerlemeKaydi,
} from "../src/leitner";

// Sabit zaman: 15 Mart 2026, 14:30 (yerel)
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

describe("tekrar zamanları", () => {
  const bugun = gunBaslangici(SIMDI);
  test.each([
    [1, 0],
    [2, 1],
    [3, 3],
    [4, 7],
    [5, 14],
  ])("kutu %i → %i gün sonra (gün başı)", (kutu, gun) => {
    // kutuya ulaşmak için gereken doğru sayısı: kutu-1 (kutu 1 için bir yanlış)
    const k = kutu === 1 ? arka([false]) : arka(Array(kutu - 1).fill(true));
    expect(k?.kutu).toBe(kutu);
    expect(k?.sonrakiTekrar).toBe(gunEkle(SIMDI, gun));
    expect(new Date(k!.sonrakiTekrar).getHours()).toBe(0);
    expect(Math.round((k!.sonrakiTekrar - bugun) / 86_400_000)).toBe(gun);
  });

  test("kutu 1 aynı gün tekrar edilir", () => {
    expect(tekrarZamaniGeldiMi(arka([false]), SIMDI)).toBe(true);
    expect(tekrarZamaniGeldiMi(arka([false]), SIMDI + 60_000)).toBe(true);
  });

  test("kutu 2 ertesi gün sabahından itibaren gelir", () => {
    const k = arka([true]);
    expect(tekrarZamaniGeldiMi(k, new Date(2026, 2, 15, 23, 59).getTime())).toBe(false);
    expect(tekrarZamaniGeldiMi(k, new Date(2026, 2, 16, 0, 1).getTime())).toBe(true);
  });

  test("ay sonunu aşar", () => {
    const k = arka([true, true, true, true], new Date(2026, 0, 25, 10).getTime());
    expect(k?.sonrakiTekrar).toBe(new Date(2026, 1, 8).getTime());
  });
});

describe("tekrar sırası", () => {
  const kayit = (soruId: string, kutu: number, sonrakiTekrar: number): IlerlemeKaydi => ({
    desteId: "d",
    soruId,
    kutu,
    sonCozulme: 0,
    sonrakiTekrar,
    dogruSayisi: 0,
    yanlisSayisi: 0,
  });
  const gun = (n: number) => gunEkle(SIMDI, n);
  const kayitlar = new Map<string, IlerlemeKaydi>([
    ["a", kayit("a", 3, gun(-1))],
    ["b", kayit("b", 2, gun(2))], // zamanı gelmedi
    ["c", kayit("c", 1, gun(-3))],
    ["e", kayit("e", 1, gun(-1))],
  ]);
  test("önce zamanı geçmişler (eskiden yeniye, eşitse düşük kutu), sonra yeniler; gelmeyenler hariç", () => {
    const sira = tekrarSirasi(["y1", "a", "b", "c", "y2", "e"], (id) => kayitlar.get(id), SIMDI);
    expect(sira).toEqual(["c", "e", "a", "y1", "y2"]);
  });
});

describe("kayıt doğrulama", () => {
  const gecerli = { desteId: "d", soruId: "q", kutu: 3, sonCozulme: 1, sonrakiTekrar: 2, dogruSayisi: 1, yanlisSayisi: 0 };
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
});
