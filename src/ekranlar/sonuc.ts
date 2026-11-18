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
      ? el("p", { class: "tebrik" }, M.hepsiDogru)
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
  if (oz.yanlislar.length > 0) {
    dugmeler.append(
      el(
        "button",
        { type: "button", class: "dugme birincil genis", onclick: () => oturumBaslat(o.baslik, oz.yanlislar, true) },
        M.yanlislariTekrarCoz,
      ),
    );
  }
  dugmeler.append(el("a", { class: `dugme ${oz.yanlislar.length > 0 ? "ikincil" : "birincil"} genis`, href: "#/" }, M.anaSayfa));

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
      ),
      dugmeler,
      yanlisListesi,
    ),
  );
}
