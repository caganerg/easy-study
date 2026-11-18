import { ayarlariYaz, gorunumUygula } from "../ayarlar";
import { el } from "../dom";
import { durum, gezinti } from "../durum";
import { ilerlemeyiDegistir, ilerlemeyiSifirla } from "../ilerleme";
import { M } from "../metinler";
import { bildir, onayIste, pencereAc } from "../pencere";
import type { Ayarlar, Tema, YaziBoyutu } from "../tipler";
import { birlestir, yedekCoz, yedekDosyaAdi, yedekOlustur } from "../yedek";
import { ekran, ustBar } from "./ortak";

function ayarDegistir(degisiklik: Partial<Ayarlar>): void {
  durum.ayarlar = { ...durum.ayarlar, ...degisiklik };
  ayarlariYaz(durum.ayarlar);
  gorunumUygula(durum.ayarlar);
}

function anahtarSatiri(etiket: string, aciklama: string | null, deger: boolean, degisti: (v: boolean) => void): HTMLElement {
  const kutu = el("input", { type: "checkbox", checked: deger, attr: { role: "switch" } });
  kutu.addEventListener("change", () => degisti(kutu.checked));
  return el(
    "label",
    { class: "ayar-satiri" },
    el("span", { class: "ayar-metin" }, el("span", null, etiket), aciklama ? el("small", null, aciklama) : null),
    kutu,
  );
}

function bolumlu<T extends string>(ad: string, baslik: string, secenekler: [T, string][], secili: T, degisti: (v: T) => void): HTMLElement {
  return el(
    "fieldset",
    { class: "bolumlu" },
    el("legend", null, baslik),
    el(
      "div",
      { class: "bolumlu-secenekler" },
      ...secenekler.map(([deger, etiket]) => {
        const radyo = el("input", { type: "radio", name: ad, value: deger, checked: deger === secili });
        radyo.addEventListener("change", () => radyo.checked && degisti(deger));
        return el("label", null, radyo, el("span", null, etiket));
      }),
    ),
  );
}

function disaAktar(): void {
  const simdi = Date.now();
  const yedek = yedekOlustur(durum.ilerleme.values(), durum.ayarlar, simdi);
  const blob = new Blob([JSON.stringify(yedek, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  // Android Chrome ve iPad Safari a[download] + Blob URL'yi destekler.
  const a = el("a", { href: url, download: yedekDosyaAdi(simdi), class: "gizli" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari indirmeyi başlatmadan URL'yi iptal etmemek için bekle.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  bildir(M.disaAktarildi);
}

async function dosyaIceAktar(dosya: File): Promise<void> {
  let ham: unknown;
  try {
    ham = JSON.parse(await dosya.text()) as unknown;
  } catch {
    bildir(M.yedekGecersiz(M.dosyaOkunamadi));
    return;
  }
  const sonuc = yedekCoz(ham);
  if (!sonuc.tamam) {
    bildir(M.yedekGecersiz(sonuc.neden));
    return;
  }
  const { yedek } = sonuc;
  const secim = await pencereAc<"uzerine" | "birlestir">(
    M.iceAktarSoru,
    [el("p", null, M.iceAktarAciklama(yedek.ilerleme.length)), el("p", { class: "ipucu" }, M.iceAktarSecenekAciklama)],
    [
      { etiket: M.vazgec, deger: null, tur: "ikincil" },
      { etiket: M.birlestir, deger: "birlestir", tur: "ikincil" },
      { etiket: M.uzerineYaz, deger: "uzerine", tur: "tehlikeli" },
    ],
  );
  if (secim === null) return;
  try {
    if (secim === "uzerine") {
      await ilerlemeyiDegistir(yedek.ilerleme, true);
      ayarDegistir(yedek.ayarlar);
    } else {
      await ilerlemeyiDegistir(birlestir(durum.ilerleme.values(), yedek.ilerleme), false);
    }
    bildir(M.iceAktarildi(yedek.ilerleme.length));
  } catch (e) {
    bildir(M.yedekGecersiz(e instanceof Error ? e.message : String(e)));
  }
  gezinti.yenidenCiz();
}

export function ayarlarEkrani(): HTMLElement {
  const a = durum.ayarlar;
  const dosyaSecici = el("input", { type: "file", accept: "application/json,.json", class: "gizli", attr: { "aria-hidden": "true", tabindex: "-1" } });
  dosyaSecici.addEventListener("change", () => {
    const dosya = dosyaSecici.files?.[0];
    dosyaSecici.value = "";
    if (dosya) void dosyaIceAktar(dosya);
  });

  const sifirla = async () => {
    const tamam = await onayIste({ baslik: M.sifirlaSoru, aciklama: M.sifirlaAciklama, onay: M.sil, tehlikeli: true });
    if (!tamam) return;
    await ilerlemeyiSifirla();
    bildir(M.sifirlandi);
  };

  return ekran(
    ustBar(M.ayarlar, { geri: "#/" }),
    el(
      "main",
      { class: "icerik ayarlar" },
      el(
        "section",
        { class: "kart ayar-grubu" },
        anahtarSatiri(M.turkceTolerans, M.turkceToleransAciklama, a.turkceTolerans, (v) => ayarDegistir({ turkceTolerans: v })),
        anahtarSatiri(M.siklariKaristir, null, a.siklariKaristir, (v) => ayarDegistir({ siklariKaristir: v })),
      ),
      bolumlu<Tema>(
        "tema",
        M.tema,
        [
          ["sistem", M.temaSistem],
          ["acik", M.temaAcik],
          ["koyu", M.temaKoyu],
        ],
        a.tema,
        (tema) => ayarDegistir({ tema }),
      ),
      bolumlu<YaziBoyutu>(
        "yazi",
        M.yaziBoyutu,
        [
          ["normal", M.yaziNormal],
          ["buyuk", M.yaziBuyuk],
        ],
        a.yaziBoyutu,
        (yaziBoyutu) => ayarDegistir({ yaziBoyutu }),
      ),
      el(
        "section",
        { class: "ayar-grubu" },
        el("h2", null, M.veri),
        el(
          "div",
          { class: "dugme-satiri dikey" },
          el("button", { type: "button", class: "dugme ikincil", onclick: disaAktar }, M.disaAktar),
          el("button", { type: "button", class: "dugme ikincil", onclick: () => dosyaSecici.click() }, M.iceAktar),
          el("button", { type: "button", class: "dugme tehlikeli", onclick: () => void sifirla() }, M.sifirla),
        ),
        dosyaSecici,
      ),
      el("p", { class: "ipucu surum" }, M.surumBilgisi(__SURUM__)),
    ),
  );
}
