import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages alt dizini için taban yol ortam değişkeninden gelir (yerelde "/").
const base = process.env.BASE_PATH ?? "/";
if (!base.startsWith("/") || !base.endsWith("/")) {
  throw new Error(`BASE_PATH "/" ile başlayıp bitmeli (ör. /repo-adi/), verilen: ${base}`);
}

const TEMA_RENGI = "#2f5d8a";
const paket = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  base,
  define: { __SURUM__: JSON.stringify(paket.version) },
  plugins: [
    VitePWA({
      registerType: "prompt",
      // Kayıt src/pwa.ts içinde virtual:pwa-register ile yapılır.
      injectRegister: false,
      // İkonlar zaten globPatterns ile önbelleğe giriyor; tekrar eklenmesin.
      includeManifestIcons: false,
      manifest: {
        name: "Ders Çalış",
        short_name: "Ders Çalış",
        description: "Telefon ve tablet için çevrimdışı çalışabilen ders çalışma uygulaması",
        lang: "tr",
        dir: "ltr",
        display: "standalone",
        orientation: "any",
        theme_color: TEMA_RENGI,
        background_color: "#f4f6f9",
        start_url: base,
        scope: base,
        id: base,
        icons: [
          { src: "ikonlar/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "ikonlar/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "ikonlar/ikon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Uygulama kabuğu önbelleğe alınır; desteler alınmaz.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["desteler/**"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Desteler: önce ağ, ağ yoksa son indirilen kopya.
            urlPattern: /\/desteler\/[^/?#]+\.json(?:[?#].*)?$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "desteler",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
