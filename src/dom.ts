// Küçük DOM yardımcıları. Metin çocuklar her zaman text node olarak eklenir;
// innerHTML / outerHTML tipte bilerek yasaklanmıştır.

export type Cocuk = Node | string | number | null | undefined | false;

type Yasak = "innerHTML" | "outerHTML" | "style" | "children" | "className";

export type Ozellikler<K extends keyof HTMLElementTagNameMap> = Partial<
  Omit<HTMLElementTagNameMap[K], Yasak>
> & {
  class?: string;
  /** setAttribute ile yazılır: aria-*, data-*, role, inputmode vb. */
  attr?: Record<string, string | number | boolean | undefined>;
};

export function el<K extends keyof HTMLElementTagNameMap>(
  etiket: K,
  ozellik?: Ozellikler<K> | null,
  ...cocuklar: Cocuk[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(etiket);
  if (ozellik) {
    const { class: sinif, attr, ...gerisi } = ozellik;
    if (sinif) e.className = sinif;
    if (attr) {
      for (const [ad, deger] of Object.entries(attr)) {
        if (deger === undefined || deger === false) continue;
        e.setAttribute(ad, deger === true ? "" : String(deger));
      }
    }
    Object.assign(e, gerisi);
  }
  ekle(e, ...cocuklar);
  return e;
}

export function ekle(ebeveyn: Node, ...cocuklar: Cocuk[]): void {
  for (const c of cocuklar) {
    if (c === null || c === undefined || c === false) continue;
    ebeveyn.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
}

export function temizle(e: Element): void {
  e.replaceChildren();
}

/** Simge + metin; simge ekran okuyuculardan gizlenir. */
export function simgeliMetin(simge: string, metin: string): DocumentFragment {
  const f = document.createDocumentFragment();
  ekle(f, el("span", { class: "simge", attr: { "aria-hidden": "true" } }, simge), " ", metin);
  return f;
}
