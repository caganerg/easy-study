import { bicimliMetin } from "../bicim";
import { el } from "../dom";
import { D, M } from "../metinler";
import type { SoruTipiTanim } from "./ortak";

export const dogruYanlis: SoruTipiTanim<"dogru_yanlis"> = {
  tip: "dogru_yanlis",
  alanlar: ["dogru"],

  dogrula(ham, temel, hatalar) {
    const dogru = ham["dogru"];
    if (dogru === undefined) {
      hatalar.push(D.alanEksik("dogru"));
      return null;
    }
    if (typeof dogru !== "boolean") {
      hatalar.push(D.booleanOlmali("dogru"));
      return null;
    }
    return { ...temel, tip: "dogru_yanlis", dogru };
  },

  kontrol(soru, cevap) {
    return { dogru: cevap.secilen === soru.dogru };
  },

  dogruCevapMetni(soru) {
    return soru.dogru ? M.dogruSecenek : M.yanlisSecenek;
  },

  ciz(soru, baglam) {
    let cevaplandi = false;
    const dugme = (deger: boolean) =>
      el(
        "button",
        {
          type: "button",
          class: `secenek dy-secenek ${deger ? "dy-dogru" : "dy-yanlis"}`,
          onclick: () => {
            if (cevaplandi) return;
            cevaplandi = true;
            baglam.cevapla({ tip: "dogru_yanlis", secilen: deger });
          },
        },
        el("span", { class: "secenek-metin" }, deger ? M.dogruSecenek : M.yanlisSecenek),
        el("span", { class: "secenek-isaret", attr: { "aria-hidden": "true" } }),
      );
    const dugmeler = [dugme(true), dugme(false)] as const;

    return {
      el: el(
        "div",
        { class: "soru-govde" },
        el("p", { class: "soru-metni", id: "soru-metni" }, bicimliMetin(soru.soru)),
        el("div", { class: "secenekler dy-secenekler", attr: { role: "group", "aria-labelledby": "soru-metni" } }, ...dugmeler),
      ),
      odakla: () => dugmeler[0].focus(),
      sonucuGoster(cevap) {
        dugmeler.forEach((d, i) => {
          const deger = i === 0;
          d.disabled = true;
          const isaret = d.querySelector(".secenek-isaret");
          if (deger === soru.dogru) {
            d.classList.add("dogru");
            if (isaret) isaret.textContent = "✓";
          } else if (deger === cevap.secilen) {
            d.classList.add("yanlis");
            if (isaret) isaret.textContent = "✗";
          }
          if (deger === cevap.secilen) d.setAttribute("aria-current", "true");
        });
      },
    };
  },
};
