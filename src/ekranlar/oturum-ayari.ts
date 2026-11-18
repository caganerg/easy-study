import { el } from "../dom";
import { desteBul, durum } from "../durum";
import { M } from "../metinler";
import { kayitBul } from "../ilerleme";
import { MODLAR, moduUygula, oturumOlustur, soruSec, type Mod, type OturumSecimi, type OturumSorusu, type SoruAdedi } from "../oturum";
import { TIP_SIRASI } from "../soru-tipleri/kayit";
import type { SoruTipi } from "../tipler";
import { ekran, ustBar } from "./ortak";

const ADETLER: readonly SoruAdedi[] = [10, 20, "tumu"];
const MOD_ADI: Record<Mod, string> = { karisik: M.modKarisik, yanlislar: M.modYanlislar };

/**
 * Oturumu başlatır ve soru ekranına geçer. degistir: geçmişe yeni kayıt
 * eklemeden (sonuç ekranından tekrar çözerken) geç.
 */
export function oturumBaslat(baslik: string, sorular: OturumSorusu[], degistir = false): void {
  durum.oturum = oturumOlustur(baslik, sorular);
  if (degistir) location.replace("#/oturum");
  else location.hash = "#/oturum";
}

function onayKutusu(ad: string, deger: string, etiket: string, secili: boolean, degisti: () => void): HTMLElement {
  return el(
    "label",
    { class: "secim" },
    el("input", { type: "checkbox", name: ad, value: deger, checked: secili, onchange: degisti }),
    el("span", null, etiket),
  );
}

function radyo(ad: string, deger: string, etiket: string, secili: boolean, degisti: () => void): HTMLElement {
  return el(
    "label",
    { class: "secim" },
    el("input", { type: "radio", name: ad, value: deger, checked: secili, onchange: degisti }),
    el("span", null, etiket),
  );
}

export function oturumAyariEkrani(desteId: string): HTMLElement {
  const y = desteBul(desteId);
  const deste = y?.deste;
  if (!deste) return ekran(ustBar(M.oturumAyari, { geri: "#/" }), el("main", { class: "icerik" }, el("p", null, M.desteBulunamadi)));

  const havuz: OturumSorusu[] = deste.sorular.map((soru) => ({ desteId: deste.id, soru }));
  const mevcutTipler = TIP_SIRASI.filter((t) => deste.sorular.some((s) => s.tip === t));
  const tumEtiketler = [...new Set(deste.sorular.flatMap((s) => s.etiketler ?? []))].sort((a, b) => a.localeCompare(b, "tr"));

  const form = el("form", { class: "form" });
  const sayac = el("p", { class: "sayac", attr: { "aria-live": "polite" } });
  const basla = el("button", { type: "submit", class: "dugme birincil genis" }, M.basla);

  const secimiOku = (): OturumSecimi => {
    const veri = new FormData(form);
    const tipler = veri.getAll("tip").map(String).filter((t): t is SoruTipi => (mevcutTipler as string[]).includes(t));
    const adetHam = String(veri.get("adet") ?? "10");
    const adet: SoruAdedi = adetHam === "tumu" ? "tumu" : Number(adetHam);
    const etiketler = veri.getAll("etiket").map(String);
    const modHam = String(veri.get("mod") ?? "karisik");
    const mod: Mod = MODLAR.find((m) => m === modHam) ?? "karisik";
    return { mod, tipler, adet, etiketler };
  };

  const guncelle = () => {
    const s = secimiOku();
    // Hiç tip seçilmemişse oturum başlatılamaz (boş tip listesi "tümü" anlamına gelir).
    const uygun = s.tipler.length === 0 ? 0 : moduUygula(havuz, s, kayitBul, Math.random).length;
    sayac.textContent = uygun > 0 ? M.uygunSoruSayisi(uygun) : M.uygunSoruYok;
    basla.disabled = uygun === 0;
  };

  form.append(
    el(
      "fieldset",
      null,
      el("legend", null, M.soruTipleri),
      ...mevcutTipler.map((t) => onayKutusu("tip", t, M.tipAdi[t], true, guncelle)),
    ),
    el("fieldset", null, el("legend", null, M.mod), ...MODLAR.map((m) => radyo("mod", m, MOD_ADI[m], m === "karisik", guncelle))),
    el("fieldset", null, el("legend", null, M.soruAdedi), ...ADETLER.map((a) => radyo("adet", String(a), a === "tumu" ? M.tumu : String(a), a === 10, guncelle))),
  );
  if (tumEtiketler.length > 0) {
    form.append(
      el(
        "fieldset",
        null,
        el("legend", null, M.etiketler),
        el("p", { class: "ipucu" }, M.etiketAciklama),
        el("div", { class: "cipler" }, ...tumEtiketler.map((e) => onayKutusu("etiket", e, e, false, guncelle))),
      ),
    );
  }
  form.append(sayac, basla);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const s = secimiOku();
    if (s.tipler.length === 0) return;
    const sorular = soruSec(havuz, s, kayitBul, Math.random);
    if (sorular.length > 0) oturumBaslat(deste.baslik, sorular);
  });
  guncelle();

  return ekran(
    ustBar(deste.baslik, { geri: "#/" }),
    el("main", { class: "icerik" }, deste.aciklama ? el("p", { class: "aciklama" }, deste.aciklama) : null, form),
  );
}
