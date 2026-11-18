import { bicimliMetin, boslukSayisi } from "../bicim";
import { el } from "../dom";
import { D, M } from "../metinler";
import { normallestir } from "../normallestir";
import type { SoruTipiTanim } from "./ortak";
import { bosOlmayanMetinMi } from "./ortak";

/** Her boşluğu ayrı değerlendirir; girilen cevap kabul listesinden biriyle eşleşmeli. */
export function boslukSonuclari(cevaplar: readonly string[][], girilen: readonly string[], turkceTolerans: boolean): boolean[] {
  const ayar = { turkceTolerans };
  return cevaplar.map((kabul, i) => {
    const g = normallestir(girilen[i] ?? "", ayar);
    return g.length > 0 && kabul.some((k) => normallestir(k, ayar) === g);
  });
}

/** Klavye açıldığında soru metni görünür kalsın. */
function soruyuGorunurTut(metin: HTMLElement, kutu: HTMLInputElement): void {
  // Klavyenin açılıp görünür alanın küçülmesini bekle.
  window.setTimeout(() => {
    const vv = window.visualViewport;
    const gorunurYukseklik = vv ? vv.height : window.innerHeight;
    const metinUst = metin.getBoundingClientRect().top;
    const kutuAlt = kutu.getBoundingClientRect().bottom;
    const ustBosluk = 64; // yapışkan üst çubuk
    // Soru ile kutu birlikte sığıyorsa sorunun başını üst çubuğun altına getir;
    // sığmıyorsa en azından kutuyu görünür yap.
    if (kutuAlt - metinUst + ustBosluk <= gorunurYukseklik) {
      window.scrollBy({ top: metinUst - ustBosluk, behavior: "smooth" });
    } else {
      kutu.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, 300);
}

export const bosluk: SoruTipiTanim<"bosluk"> = {
  tip: "bosluk",
  alanlar: ["cevaplar"],

  dogrula(ham, temel, hatalar) {
    const baslangic = hatalar.length;
    const cevaplar = ham["cevaplar"];
    const boslukAdedi = typeof ham["soru"] === "string" ? boslukSayisi(ham["soru"]) : 0;
    if (typeof ham["soru"] === "string" && boslukAdedi === 0) hatalar.push(D.boslukYok);

    if (cevaplar === undefined) {
      hatalar.push(D.alanEksik("cevaplar"));
      return null;
    }
    if (!Array.isArray(cevaplar)) {
      hatalar.push(D.diziOlmali("cevaplar"));
      return null;
    }
    if (cevaplar.length === 0) hatalar.push(D.bosDizi("cevaplar"));
    const gecerli: string[][] = [];
    cevaplar.forEach((liste: unknown, i) => {
      if (!Array.isArray(liste)) hatalar.push(D.diziOlmali(`cevaplar[${i}]`));
      else if (liste.length === 0) hatalar.push(D.cevapListesiBos(i + 1));
      else if (!liste.every(bosOlmayanMetinMi)) hatalar.push(D.cevapMetinOlmali(i + 1));
      else gecerli.push(liste);
    });
    if (boslukAdedi > 0 && cevaplar.length > 0 && boslukAdedi !== cevaplar.length) {
      hatalar.push(D.boslukSayisiUyumsuz(boslukAdedi, cevaplar.length));
    }
    if (hatalar.length > baslangic) return null;
    return { ...temel, tip: "bosluk", cevaplar: gecerli };
  },

  kontrol(soru, cevap, ayarlar) {
    const bosluklar = boslukSonuclari(soru.cevaplar, cevap.girilen, ayarlar.turkceTolerans);
    return { dogru: bosluklar.every(Boolean), bosluklar };
  },

  dogruCevapMetni(soru) {
    const parca = (kabul: string[]) => kabul.join(" / ");
    if (soru.cevaplar.length === 1) return parca(soru.cevaplar[0] ?? []);
    return soru.cevaplar.map((k, i) => `${i + 1}) ${parca(k)}`).join("; ");
  },

  ciz(soru, baglam) {
    const adet = soru.cevaplar.length;
    let cevaplandi = false;

    // Soru metnindeki her boşluk numaralı bir işaretle gösterilir.
    const metin = el(
      "p",
      { class: "soru-metni", id: "soru-metni" },
      bicimliMetin(soru.soru, (sira) =>
        el("span", { class: "bosluk-isareti", attr: { "aria-label": M.bosluk(sira) } }, adet > 1 ? String(sira) : " "),
      ),
    );

    const kutular = soru.cevaplar.map((_, i) =>
      el("input", {
        type: "text",
        class: "bosluk-kutusu",
        id: `bosluk-${i + 1}`,
        autocomplete: "off",
        spellcheck: false,
        attr: {
          autocapitalize: "off",
          autocorrect: "off",
          inputmode: "text",
          enterkeyhint: i < adet - 1 ? "next" : "done",
        },
      }),
    );
    const isaretler = kutular.map(() => el("span", { class: "bosluk-sonuc", attr: { "aria-hidden": "true" } }));
    const dogrular = kutular.map(() => el("p", { class: "bosluk-dogru" }));

    const kontrolEt = () => {
      if (cevaplandi) return;
      cevaplandi = true;
      baglam.cevapla({ tip: "bosluk", girilen: kutular.map((k) => k.value) });
    };

    kutular.forEach((k, i) => {
      k.addEventListener("focus", () => soruyuGorunurTut(metin, k));
      k.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" || e.isComposing) return;
        e.preventDefault();
        const sonraki = kutular[i + 1];
        if (sonraki) sonraki.focus();
        else kontrolEt();
      });
    });

    const satirlar = kutular.map((k, i) =>
      el(
        "div",
        { class: "bosluk-satiri" },
        el("label", { htmlFor: k.id }, adet > 1 ? M.bosluk(i + 1) : M.cevabiniz),
        el("div", { class: "bosluk-giris" }, k, isaretler[i]),
        dogrular[i],
      ),
    );
    const dugme = el("button", { type: "button", class: "dugme birincil genis", onclick: kontrolEt }, M.kontrolEt);

    return {
      el: el("div", { class: "soru-govde" }, metin, el("div", { class: "bosluklar" }, ...satirlar), dugme),
      odakla: () => {
        // Dokunmatik cihazda klavyeyi kendiliğinden açma; masaüstünde odakla.
        if (window.matchMedia("(pointer: fine)").matches) kutular[0]?.focus();
      },
      sonucuGoster(cevap, sonuc) {
        dugme.remove();
        kutular.forEach((k, i) => {
          // Cevaplanmış soruya geri dönüldüğünde girilen cevap yeniden gösterilir.
          if (k.value === "") k.value = cevap.girilen[i] ?? "";
          k.readOnly = true;
          const dogru = sonuc.bosluklar?.[i] ?? sonuc.dogru;
          k.classList.add(dogru ? "dogru" : "yanlis");
          k.setAttribute("aria-invalid", String(!dogru));
          const isaret = isaretler[i];
          if (isaret) isaret.textContent = dogru ? "✓" : "✗";
          const d = dogrular[i];
          if (!dogru && d && adet > 1) d.append(el("strong", null, M.dogruCevapNe), " ", (soru.cevaplar[i] ?? []).join(" / "));
        });
      },
    };
  },
};
