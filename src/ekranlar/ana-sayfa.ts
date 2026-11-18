import type { YuklenenDeste } from "../desteler";
import { el } from "../dom";
import { durum } from "../durum";
import { bugunTekrarEdilecekler, desteIstatistigi } from "../ilerleme";
import { M } from "../metinler";
import { oturumBaslat } from "./oturum-ayari";
import { ayarlarBaglantisi, ekran, hataliSoruSayisi, sorunListesiGoster, ustBar } from "./ortak";

function sorunRozeti(y: YuklenenDeste): HTMLElement | null {
  const { hatalar, uyarilar } = y;
  if (hatalar.length === 0 && uyarilar.length === 0) return null;
  const hatali = hataliSoruSayisi(hatalar);
  const genelHata = hatalar.length - hatalar.filter((h) => h.sira !== undefined).length;
  let metin: string;
  if (hatali > 0) metin = M.hataliSoru(hatali);
  else if (genelHata > 0) metin = M.hatalar;
  else metin = M.uyariSayisi(uyarilar.length);
  return el(
    "button",
    {
      type: "button",
      class: `rozet ${hatalar.length > 0 ? "hata" : "uyari"}`,
      onclick: () => sorunListesiGoster(y.deste?.baslik ?? y.ozet.baslik, hatalar, uyarilar),
    },
    el("span", { attr: { "aria-hidden": "true" } }, "⚠"),
    " ",
    metin,
  );
}

function ilerlemeCubugu(ogrenilen: number, toplam: number): HTMLElement {
  const oran = toplam === 0 ? 0 : ogrenilen / toplam;
  const c = el(
    "div",
    { class: "deste-ilerleme" },
    el("div", {
      class: "cubuk",
      attr: { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": toplam, "aria-valuenow": ogrenilen, "aria-label": M.ogrenilen(ogrenilen, toplam) },
    }),
    el("span", { class: "kart-alt" }, M.ogrenilen(ogrenilen, toplam)),
  );
  c.style.setProperty("--oran", String(oran));
  return c;
}

function tekrarKisayolu(simdi: number): HTMLElement {
  const sorular = bugunTekrarEdilecekler(simdi);
  const n = sorular.length;
  return el(
    "section",
    { class: `kart tekrar-kisayolu${n > 0 ? " var" : ""}` },
    el("p", null, el("span", { attr: { "aria-hidden": "true" } }, "🔁 "), n > 0 ? M.bugunTekrar(n) : M.bugunTekrarYok),
    n > 0 ? el("button", { type: "button", class: "dugme birincil", onclick: () => oturumBaslat(M.modTekrar, sorular) }, M.tekrarBasla) : null,
  );
}

function desteKarti(y: YuklenenDeste, simdi: number): HTMLElement {
  const d = y.deste;
  const ist = d ? desteIstatistigi(d, simdi) : null;
  const baslik = d?.baslik ?? y.ozet.baslik;
  const ust = d
    ? el("a", { class: "kart-baglanti", href: `#/deste/${encodeURIComponent(d.id)}` }, baslik)
    : el("span", { class: "kart-baglanti devre-disi" }, baslik);
  return el(
    "article",
    { class: `kart deste-karti${d ? "" : " bozuk"}` },
    el("h3", { class: "kart-baslik" }, ust),
    el(
      "p",
      { class: "kart-alt" },
      d ? M.soruSayisi(d.sorular.length) : M.desteYuklenemedi(y.ozet.dosya),
      ist && ist.tekrar > 0 ? el("span", { class: "tekrar-sayisi" }, ` · ${M.tekrarSayisi(ist.tekrar)}`) : null,
    ),
    ist ? ilerlemeCubugu(ist.ogrenilen, ist.toplam) : null,
    sorunRozeti(y),
  );
}

export function anaSayfaEkrani(): HTMLElement {
  const k = durum.katalog;
  const icerik: HTMLElement[] = [];
  const simdi = Date.now();

  if (!k || k.listeHatasi) {
    icerik.push(el("p", { class: "uyari-kutu" }, k?.listeHatasi ?? M.listeYuklenemedi));
  } else if (k.desteler.length === 0) {
    icerik.push(el("p", { class: "bos" }, M.desteYok));
  } else {
    icerik.push(tekrarKisayolu(simdi));
    // Derse göre grupla (index.json sırası korunur).
    const gruplar = new Map<string, YuklenenDeste[]>();
    for (const y of k.desteler) {
      const ders = y.deste?.ders ?? y.ozet.ders;
      gruplar.set(ders, [...(gruplar.get(ders) ?? []), y]);
    }
    for (const [ders, liste] of gruplar) {
      icerik.push(el("section", { class: "ders-grubu" }, el("h2", null, ders), el("div", { class: "kartlar" }, ...liste.map((y) => desteKarti(y, simdi)))));
    }
  }
  if (k && k.listeSorunlari.length > 0) {
    icerik.push(
      el(
        "button",
        { type: "button", class: "rozet hata", onclick: () => sorunListesiGoster("index.json", k.listeSorunlari, []) },
        "⚠ index.json: ",
        M.uyariSayisi(k.listeSorunlari.length),
      ),
    );
  }

  if (!navigator.onLine) icerik.unshift(el("p", { class: "uyari-kutu" }, M.cevrimdisi));
  if (!durum.kalici) icerik.unshift(el("p", { class: "uyari-kutu" }, M.kaliciDegil));
  return ekran(ustBar(M.uygulamaAdi, { sag: ayarlarBaglantisi() }), el("main", { class: "icerik" }, ...icerik));
}
