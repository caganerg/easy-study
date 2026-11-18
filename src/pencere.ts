// Uygulama içi pencereler (tarayıcı confirm()/alert() yerine) ve kısa bildirimler.

import { el, type Cocuk } from "./dom";
import { M } from "./metinler";

function katman(): HTMLElement {
  const k = document.getElementById("katman");
  if (!k) throw new Error("#katman bulunamadı");
  return k;
}

interface Secenek<T> {
  etiket: string;
  /** null: pencereyi değer döndürmeden kapatır (Vazgeç). */
  deger: T | null;
  tur?: "birincil" | "tehlikeli" | "ikincil";
}

/**
 * Modal pencere açar; seçilen düğmenin değeriyle (Esc/kapatma → null) çözülür.
 * <dialog> odak tuzağını ve Esc tuşunu kendisi yönetir.
 */
export function pencereAc<T>(baslik: string, icerik: Cocuk[], secenekler: Secenek<T>[]): Promise<T | null> {
  return new Promise((coz) => {
    let sonuc: T | null = null;
    const baslikId = `pencere-${Math.random().toString(36).slice(2)}`;
    const dugmeler = secenekler.map((s) =>
      el(
        "button",
        {
          type: "button",
          class: `dugme ${s.tur ?? "ikincil"}`,
          onclick: () => {
            sonuc = s.deger;
            d.close();
          },
        },
        s.etiket,
      ),
    );
    const d = el(
      "dialog",
      { class: "pencere", attr: { "aria-labelledby": baslikId } },
      el("h2", { id: baslikId }, baslik),
      el("div", { class: "pencere-icerik" }, ...icerik),
      el("div", { class: "pencere-dugmeler" }, ...dugmeler),
    );
    d.addEventListener("close", () => {
      d.remove();
      coz(sonuc);
    });
    // Arka plana dokununca kapat.
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close();
    });
    katman().appendChild(d);
    d.showModal();
    // Tehlikeli işlemde odak "Vazgeç"te başlasın.
    const ilk = secenekler.findIndex((s) => s.tur !== "tehlikeli");
    dugmeler[ilk >= 0 ? ilk : 0]?.focus();
  });
}

export async function onayIste(opts: {
  baslik: string;
  aciklama?: string;
  onay: string;
  tehlikeli?: boolean;
}): Promise<boolean> {
  const sonuc = await pencereAc(
    opts.baslik,
    opts.aciklama ? [el("p", null, opts.aciklama)] : [],
    [
      { etiket: M.vazgec, deger: false, tur: "ikincil" },
      { etiket: opts.onay, deger: true, tur: opts.tehlikeli ? "tehlikeli" : "birincil" },
    ],
  );
  return sonuc === true;
}

export async function bilgiGoster(baslik: string, icerik: Cocuk[]): Promise<void> {
  await pencereAc(baslik, icerik, [{ etiket: M.kapat, deger: true, tur: "birincil" }]);
}

/** Açık pencereleri kapatır (sayfa değişiminde). */
export function pencereleriKapat(): void {
  for (const d of katman().querySelectorAll("dialog")) d.close();
}

let bildirimZamani: number | undefined;

export function bildir(metin: string): void {
  let b = document.getElementById("bildirim");
  if (!b) {
    b = el("div", { id: "bildirim", class: "bildirim", attr: { role: "status" } });
    document.body.appendChild(b);
  }
  b.textContent = metin;
  b.classList.add("gorunur");
  window.clearTimeout(bildirimZamani);
  bildirimZamani = window.setTimeout(() => b.classList.remove("gorunur"), 3000);
}
