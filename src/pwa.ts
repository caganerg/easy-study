// Service worker kaydı ve "Güncelleme var" bildirimi.

import { registerSW } from "virtual:pwa-register";
import { el } from "./dom";
import { M } from "./metinler";
import { bildir } from "./pencere";

function guncellemeCubugu(yenile: () => void): void {
  if (document.getElementById("guncelleme")) return;
  const yenileDugmesi = el("button", { type: "button", class: "dugme birincil" }, M.yenile);
  const kapat = el(
    "button",
    { type: "button", class: "ikon-dugme", attr: { "aria-label": M.kapat } },
    el("span", { attr: { "aria-hidden": "true" } }, "✕"),
  );
  const cubuk = el(
    "div",
    { id: "guncelleme", class: "guncelleme-cubugu", attr: { role: "alert" } },
    el("span", null, M.guncellemeVar),
    yenileDugmesi,
    kapat,
  );
  yenileDugmesi.onclick = () => {
    yenileDugmesi.disabled = true;
    yenile();
  };
  kapat.onclick = () => cubuk.remove();
  document.body.appendChild(cubuk);
}

export function pwaBaslat(): void {
  if (!("serviceWorker" in navigator)) return;
  const guncelle = registerSW({
    onNeedRefresh() {
      guncellemeCubugu(() => void guncelle(true));
    },
    onOfflineReady() {
      bildir(M.cevrimdisiHazir);
    },
    onRegisteredSW(_url, kayit) {
      // Uzun süre açık kalan uygulamada saatte bir güncelleme kontrolü.
      if (kayit) window.setInterval(() => void kayit.update(), 60 * 60 * 1000);
    },
  });
}
