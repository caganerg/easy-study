import { bicimliMetin } from "../bicim";
import { el } from "../dom";
import { D } from "../metinler";
import type { SoruTipiTanim } from "./ortak";
import { bosOlmayanMetinMi } from "./ortak";

export const SECENEK_MIN = 2;
export const SECENEK_MAX = 6;
const HARFLER = "ABCDEF";

export const coktanSecmeli: SoruTipiTanim<"coktan_secmeli"> = {
  tip: "coktan_secmeli",
  alanlar: ["secenekler", "dogru"],

  dogrula(ham, temel, hatalar) {
    const baslangic = hatalar.length;
    const secenekler = ham["secenekler"];
    const dogru = ham["dogru"];
    let gecerliSecenekler: string[] | null = null;

    if (secenekler === undefined) hatalar.push(D.alanEksik("secenekler"));
    else if (!Array.isArray(secenekler)) hatalar.push(D.diziOlmali("secenekler"));
    else if (secenekler.length < SECENEK_MIN || secenekler.length > SECENEK_MAX)
      hatalar.push(D.secenekSayisi(SECENEK_MIN, SECENEK_MAX));
    else if (!secenekler.every(bosOlmayanMetinMi)) hatalar.push(D.metinOlmali("secenekler[]"));
    else if (new Set(secenekler.map((s) => s.trim())).size !== secenekler.length) hatalar.push(D.secenekTekrar);
    else gecerliSecenekler = secenekler;

    if (dogru === undefined) hatalar.push(D.alanEksik("dogru"));
    else if (typeof dogru !== "number" || !Number.isInteger(dogru)) hatalar.push(D.tamSayiOlmali("dogru"));
    else if (gecerliSecenekler && (dogru < 0 || dogru >= gecerliSecenekler.length))
      hatalar.push(D.dogruIndeksSinirDisi(gecerliSecenekler.length));

    if (hatalar.length > baslangic || !gecerliSecenekler || typeof dogru !== "number") return null;
    return { ...temel, tip: "coktan_secmeli", secenekler: gecerliSecenekler, dogru };
  },

  kontrol(soru, cevap) {
    return { dogru: cevap.secilen === soru.dogru };
  },

  dogruCevapMetni(soru) {
    return soru.secenekler[soru.dogru] ?? "";
  },

  ciz(soru, baglam) {
    // Ekrandaki sıra karıştırılabilir; her düğme orijinal indeksi taşır.
    const sira = soru.secenekler.map((_, i) => i);
    const gosterim = baglam.ayarlar.siklariKaristir ? baglam.karistir(sira) : sira;
    let cevaplandi = false;

    const dugmeler = gosterim.map((orijinal, konum) =>
      el(
        "button",
        {
          type: "button",
          class: "secenek",
          onclick: () => {
            if (cevaplandi) return;
            cevaplandi = true;
            baglam.cevapla({ tip: "coktan_secmeli", secilen: orijinal });
          },
        },
        el("span", { class: "secenek-harf", attr: { "aria-hidden": "true" } }, HARFLER[konum] ?? ""),
        el("span", { class: "secenek-metin" }, bicimliMetin(soru.secenekler[orijinal] ?? "")),
        el("span", { class: "secenek-isaret", attr: { "aria-hidden": "true" } }),
      ),
    );

    const govde = el(
      "div",
      { class: "soru-govde" },
      el("p", { class: "soru-metni", id: "soru-metni" }, bicimliMetin(soru.soru)),
      el("div", { class: "secenekler", attr: { role: "group", "aria-labelledby": "soru-metni" } }, ...dugmeler),
    );

    return {
      el: govde,
      odakla: () => dugmeler[0]?.focus(),
      sonucuGoster(cevap) {
        dugmeler.forEach((d, konum) => {
          const orijinal = gosterim[konum];
          d.disabled = true;
          const isaret = d.querySelector(".secenek-isaret");
          if (orijinal === soru.dogru) {
            d.classList.add("dogru");
            if (isaret) isaret.textContent = "✓";
          } else if (orijinal === cevap.secilen) {
            d.classList.add("yanlis");
            if (isaret) isaret.textContent = "✗";
          }
          if (orijinal === cevap.secilen) d.setAttribute("aria-current", "true");
        });
      },
    };
  },
};
