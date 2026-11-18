import { bicimliMetin } from "../bicim";
import { dogruCevapMetni } from "../cevap";
import { el } from "../dom";
import { durum } from "../durum";
import { M } from "../metinler";
import { ozet } from "../oturum";
import { ekran, ustBar } from "./ortak";
import { oturumBaslat } from "./oturum-ayari";

export function sonucEkrani(): HTMLElement {
  const o = durum.oturum;
  if (!o) {
    return ekran(ustBar(M.sonuc, { geri: "#/" }), el("main", { class: "icerik" }, el("p", null, M.oturumYok)));
  }
  const oz = ozet(o);
  const halka = el("div", { class: "yuzde-halka", attr: { role: "img", "aria-label": M.yuzde(oz.yuzde) } }, el("span", null, M.yuzde(oz.yuzde)));
  halka.style.setProperty("--oran", String(oz.yuzde / 100));

  const yanlisListesi =
    oz.yanlislar.length === 0
      ? el("p", { class: "tebrik" }, oz.bos > 0 ? M.yanlisYok : M.hepsiDogru)
      : el(
          "section",
          null,
          el("h2", null, M.yanlisSorular),
          el(
            "ol",
            { class: "yanlis-listesi" },
            ...oz.yanlislar.map(({ soru }) =>
              el(
                "li",
                null,
                el("p", null, bicimliMetin(soru.soru)),
                el("p", { class: "dogru-cevap" }, el("strong", null, M.dogruCevapNe), " ", bicimliMetin(dogruCevapMetni(soru))),
              ),
            ),
          ),
        );

  const dugmeler = el("div", { class: "dugme-satiri dikey" });
  const tekrarDugmesi = (etiket: string, sorular: typeof oz.yanlislar) =>
    el(
      "button",
      {
        type: "button",
        class: `dugme ${dugmeler.childElementCount === 0 ? "birincil" : "ikincil"} genis`,
        onclick: () => oturumBaslat(o.baslik, sorular, true),
      },
      etiket,
    );
  if (oz.yanlislar.length > 0) dugmeler.append(tekrarDugmesi(M.yanlislariTekrarCoz, oz.yanlislar));
  if (oz.boslar.length > 0) dugmeler.append(tekrarDugmesi(M.boslariCoz, oz.boslar));
  if (oz.yanlislar.length > 0 && oz.boslar.length > 0) {
    // Soruların oturumdaki sırası korunur.
    const secilen = new Set([...oz.yanlislar, ...oz.boslar]);
    dugmeler.append(tekrarDugmesi(M.yanlisVeBoslariCoz, o.sorular.filter((s) => secilen.has(s))));
  }
  dugmeler.append(el("a", { class: `dugme ${dugmeler.childElementCount === 0 ? "birincil" : "ikincil"} genis`, href: "#/" }, M.anaSayfa));

  return ekran(
    ustBar(M.sonuc, { geri: "#/" }),
    el(
      "main",
      { class: "icerik" },
      el("h2", { class: "oturum-baslik" }, o.baslik),
      el(
        "div",
        { class: "sonuc-ozet" },
        halka,
        el("p", { class: "dogru" }, el("span", { attr: { "aria-hidden": "true" } }, "✓ "), M.dogruSayisi(oz.dogru)),
        el("p", { class: "yanlis" }, el("span", { attr: { "aria-hidden": "true" } }, "✗ "), M.yanlisSayisi(oz.yanlis)),
        oz.bos > 0 ? el("p", { class: "bos" }, el("span", { attr: { "aria-hidden": "true" } }, "○ "), M.bosSayisi(oz.bos)) : null,
      ),
      dugmeler,
      yanlisListesi,
    ),
  );
}
