// Başlatma ve hash tabanlı yönlendirme (#/, #/deste/<id>, #/oturum, #/sonuc, #/ayarlar).

import "./stil.css";
import { ayarlariOku, gorunumUygula } from "./ayarlar";
import { katalogYukle } from "./desteler";
import { el } from "./dom";
import { durum, gezinti } from "./durum";
import { anaSayfaEkrani } from "./ekranlar/ana-sayfa";
import { ayarlarEkrani } from "./ekranlar/ayarlar";
import { ekran, ustBar } from "./ekranlar/ortak";
import { oturumAyariEkrani } from "./ekranlar/oturum-ayari";
import { oturumdanCikisOnayi, soruEkrani } from "./ekranlar/soru";
import { sonucEkrani } from "./ekranlar/sonuc";
import { ilerlemeYukle } from "./ilerleme";
import { M } from "./metinler";
import { bittiMi } from "./oturum";
import { pencereleriKapat } from "./pencere";
import { pwaBaslat } from "./pwa";

type Rota =
  | { ad: "ana" }
  | { ad: "deste"; id: string }
  | { ad: "oturum" }
  | { ad: "sonuc" }
  | { ad: "ayarlar" }
  | { ad: "yok" };

function rotaCoz(hash: string): Rota {
  const yol = hash.replace(/^#/, "") || "/";
  const parcalar = yol.split("/").filter(Boolean);
  const [ilk, ikinci] = parcalar;
  if (ilk === undefined) return { ad: "ana" };
  if (ilk === "deste" && ikinci !== undefined && parcalar.length === 2) return { ad: "deste", id: decodeURIComponent(ikinci) };
  if (ilk === "oturum" && parcalar.length === 1) return { ad: "oturum" };
  if (ilk === "sonuc" && parcalar.length === 1) return { ad: "sonuc" };
  if (ilk === "ayarlar" && parcalar.length === 1) return { ad: "ayarlar" };
  return { ad: "yok" };
}

function ekranOlustur(rota: Rota): HTMLElement {
  switch (rota.ad) {
    case "ana":
      return anaSayfaEkrani();
    case "deste":
      return oturumAyariEkrani(rota.id);
    case "oturum":
      return soruEkrani();
    case "sonuc":
      return sonucEkrani();
    case "ayarlar":
      return ayarlarEkrani();
    case "yok":
      return ekran(ustBar(M.sayfaYok, { geri: "#/" }), el("main", { class: "icerik" }, el("a", { class: "dugme birincil", href: "#/" }, M.anaSayfa)));
    default: {
      const x: never = rota;
      return x;
    }
  }
}

const kok = document.getElementById("uygulama");
if (!kok) throw new Error("#uygulama bulunamadı");

let mevcutRota: Rota = rotaCoz(location.hash);

function ciz(odakla = true): void {
  pencereleriKapat();
  kok!.replaceChildren(ekranOlustur(mevcutRota));
  if (odakla) {
    window.scrollTo(0, 0);
    // Ekran okuyucu ve klavye kullanıcıları için odağı başlığa taşı.
    const baslik = kok!.querySelector<HTMLElement>(".ust-baslik");
    if (baslik && mevcutRota.ad !== "oturum") baslik.focus({ preventScroll: true });
  }
}

gezinti.yenidenCiz = () => ciz();

function oturumSurerMi(): boolean {
  return durum.oturum !== null && !bittiMi(durum.oturum);
}

let onayBekleniyor = false;

window.addEventListener("hashchange", () => {
  const yeni = rotaCoz(location.hash);
  // Oturum ortasında geri tuşu / bağlantı: önce onay iste.
  if (mevcutRota.ad === "oturum" && yeni.ad !== "oturum" && oturumSurerMi()) {
    // Adresi oturumda tut (pushState hashchange tetiklemez). Geri tuşuyla
    // gelindiği için ileri kayıtlar zaten atılabilir.
    history.pushState(null, "", "#/oturum");
    if (onayBekleniyor) return;
    onayBekleniyor = true;
    void oturumdanCikisOnayi().then((cik) => {
      onayBekleniyor = false;
      if (cik) history.back();
    });
    return;
  }
  mevcutRota = yeni;
  ciz();
});

async function baslat(): Promise<void> {
  durum.ayarlar = ayarlariOku();
  gorunumUygula(durum.ayarlar);
  kok!.replaceChildren(el("p", { class: "yukleniyor" }, M.yukleniyor));
  [durum.katalog] = await Promise.all([katalogYukle(), ilerlemeYukle()]);
  // Sayfa yenilendiğinde oturum bellekte olmadığı için ana sayfaya dön.
  if ((mevcutRota.ad === "oturum" || mevcutRota.ad === "sonuc") && !durum.oturum) {
    history.replaceState(null, "", "#/");
    mevcutRota = { ad: "ana" };
  }
  ciz(false);
}

void baslat();
pwaBaslat();
window.addEventListener("online", () => mevcutRota.ad === "ana" && ciz(false));
window.addEventListener("offline", () => mevcutRota.ad === "ana" && ciz(false));
