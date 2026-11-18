import { el, type Cocuk } from "../dom";
import { M } from "../metinler";
import { bilgiGoster } from "../pencere";
import type { Sorun } from "../tipler";

/** Ekranın üst çubuğu: isteğe bağlı geri bağlantısı, başlık, sağ öğe. */
export function ustBar(baslik: string, opts: { geri?: string; sag?: Cocuk } = {}): HTMLElement {
  return el(
    "header",
    { class: "ust-bar" },
    opts.geri
      ? el("a", { class: "ikon-dugme", href: opts.geri, attr: { "aria-label": M.geri } }, el("span", { attr: { "aria-hidden": "true" } }, "←"))
      : null,
    el("h1", { class: "ust-baslik", tabIndex: -1 }, baslik),
    opts.sag ?? null,
  );
}

export function ayarlarBaglantisi(): HTMLElement {
  return el("a", { class: "ikon-dugme", href: "#/ayarlar", attr: { "aria-label": M.ayarlar } }, el("span", { attr: { "aria-hidden": "true" } }, "⚙"));
}

export function ekran(...cocuklar: Cocuk[]): HTMLElement {
  return el("div", { class: "ekran" }, ...cocuklar);
}

export function sorunListesiGoster(baslik: string, hatalar: Sorun[], uyarilar: Sorun[]): void {
  const liste = (sorunlar: Sorun[]) =>
    el(
      "ul",
      { class: "sorun-listesi" },
      ...sorunlar.map((s) => el("li", null, el("strong", null, M.soruEtiketi(s.sira, s.soruId)), ": ", s.mesaj)),
    );
  void bilgiGoster(M.sorunlarBaslik(baslik), [
    hatalar.length > 0 ? el("h3", null, M.hatalar) : null,
    hatalar.length > 0 ? liste(hatalar) : null,
    uyarilar.length > 0 ? el("h3", null, M.uyarilar) : null,
    uyarilar.length > 0 ? liste(uyarilar) : null,
  ]);
}

/** Hatalı soru sayısı: soruya bağlı hatalarda farklı sıra numaraları. */
export function hataliSoruSayisi(hatalar: Sorun[]): number {
  return new Set(hatalar.filter((h) => h.sira !== undefined).map((h) => h.sira)).size;
}
