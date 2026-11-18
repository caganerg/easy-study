import { bicimliMetin } from "../bicim";
import { cevapKontrol, dogruCevapMetni } from "../cevap";
import { el, simgeliMetin } from "../dom";
import { durum, gezinti } from "../durum";
import { cevabiKaydet, kayitBul } from "../ilerleme";
import { M } from "../metinler";
import { bittiMi, bosSayisi, cevapKaydet, dogruSay, karistir, mevcutSonuc, mevcutSoru, onceki, sonraki } from "../oturum";
import { onayIste } from "../pencere";
import { SORU_TIPLERI } from "../soru-tipleri/kayit";
import { kapsamli, type CizimBaglami } from "../soru-tipleri/ortak";
import type { Cevap, Degerlendirme, Soru, SoruTipi } from "../tipler";
import { ekran } from "./ortak";

/** Oturumdan çıkış onayı; onaylanırsa oturum silinir. */
export async function oturumdanCikisOnayi(): Promise<boolean> {
  const tamam = await onayIste({ baslik: M.oturumdanCikilsinMi, aciklama: M.oturumdanCikAciklama, onay: M.cik });
  if (tamam) durum.oturum = null;
  return tamam;
}

interface Cizim {
  el: HTMLElement;
  sonucuGoster: (cevap: Cevap, sonuc: Degerlendirme) => void;
  odakla?: () => void;
}

/** Soru tipine göre doğru modülün çizim fonksiyonunu çağırır. */
function soruCiz(soru: Soru, cevapla: (c: Cevap) => void): Cizim {
  const baglam = <T extends SoruTipi>(): CizimBaglami<T> => ({
    ayarlar: durum.ayarlar,
    karistir: (d) => karistir(d, Math.random),
    cevapla,
  });
  switch (soru.tip) {
    case "coktan_secmeli": {
      const c = SORU_TIPLERI.coktan_secmeli.ciz(soru, baglam());
      return { ...c, sonucuGoster: (cv, s) => cv.tip === soru.tip && c.sonucuGoster(cv, s) };
    }
    case "dogru_yanlis": {
      const c = SORU_TIPLERI.dogru_yanlis.ciz(soru, baglam());
      return { ...c, sonucuGoster: (cv, s) => cv.tip === soru.tip && c.sonucuGoster(cv, s) };
    }
    case "bosluk": {
      const c = SORU_TIPLERI.bosluk.ciz(soru, baglam());
      return { ...c, sonucuGoster: (cv, s) => cv.tip === soru.tip && c.sonucuGoster(cv, s) };
    }
    default:
      return kapsamli(soru);
  }
}

export function soruEkrani(): HTMLElement {
  const o = durum.oturum;
  const os = o ? mevcutSoru(o) : undefined;
  if (!o || !os) {
    return ekran(
      el("main", { class: "icerik" }, el("p", null, M.oturumYok), el("a", { class: "dugme birincil", href: "#/" }, M.anaSayfa)),
    );
  }
  const { soru } = os;
  const toplam = o.sorular.length;
  const kimlik = { desteId: os.desteId, soruId: soru.id };
  const sonSoru = o.indeks === toplam - 1;

  const cik = el(
    "button",
    {
      type: "button",
      class: "ikon-dugme",
      attr: { "aria-label": M.oturumdanCik },
      onclick: async () => {
        if (await oturumdanCikisOnayi()) history.back();
      },
    },
    el("span", { attr: { "aria-hidden": "true" } }, "✕"),
  );
  const cubuk = el("div", {
    class: "ilerleme-cubugu",
    attr: { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": toplam, "aria-valuenow": o.indeks + 1, "aria-label": M.ilerleme(o.indeks + 1, toplam) },
  });
  cubuk.style.setProperty("--oran", String((o.indeks + 1) / toplam));
  const ust = el(
    "header",
    { class: "ust-bar oturum-ust" },
    cik,
    el("h1", { class: "ust-baslik ilerleme-metni", tabIndex: -1 }, M.ilerleme(o.indeks + 1, toplam)),
    el("span", { class: "tip-etiketi" }, M.tipAdi[soru.tip]),
  );

  const geriBildirim = el("section", { class: "geri-bildirim", attr: { "aria-live": "assertive" } });

  const cevapla = (cevap: Cevap) => {
    const cur = durum.oturum;
    if (!cur) return;
    const sonuc = cevapKontrol(soru, cevap, durum.ayarlar);
    // "Aslında doğruydu" için cevaptan önceki kayıt sonuçla birlikte saklanır.
    const oncekiKayit = kayitBul(kimlik.desteId, kimlik.soruId);
    durum.oturum = cevapKaydet(cur, cevap, sonuc.dogru, oncekiKayit);
    cevabiKaydet(oncekiKayit, kimlik, sonuc.dogru, Date.now());
    cizim.sonucuGoster(cevap, sonuc);
    geriBildirimGoster(sonuc, false, true);
  };

  const gec = (yeni: NonNullable<typeof durum.oturum>) => {
    durum.oturum = yeni;
    if (bittiMi(yeni)) location.replace("#/sonuc");
    else gezinti.yenidenCiz();
  };

  const sonrakineGec = async () => {
    const cur = durum.oturum;
    if (!cur) return;
    const yeni = sonraki(cur);
    if (bittiMi(yeni)) {
      const bos = bosSayisi(yeni);
      if (bos > 0 && !(await onayIste({ baslik: M.bitirilsinMi, aciklama: M.bosKalanlarAciklama(bos), onay: M.bitir }))) return;
    }
    gec(yeni);
  };

  const oncekineGec = () => {
    const cur = durum.oturum;
    if (cur) gec(onceki(cur));
  };

  const oncekiDugmesi = el(
    "button",
    { type: "button", class: "dugme ikincil", disabled: o.indeks === 0, onclick: oncekineGec },
    el("span", { attr: { "aria-hidden": "true" } }, "←"),
    M.oncekiSoru,
  );
  const sonrakiDugmesi = el(
    "button",
    { type: "button", class: `dugme ${mevcutSonuc(o) ? "birincil" : "ikincil"}`, onclick: () => void sonrakineGec() },
    sonSoru ? M.bitir : M.sonrakiSoru,
    sonSoru ? null : el("span", { attr: { "aria-hidden": "true" } }, "→"),
  );
  const bosBilgisi = el("p", { class: "bos-bilgisi", attr: { "aria-live": "polite" } });
  const bosGuncelle = () => {
    // Geride boş bırakılan sorular (henüz gelinmemiş sorular sayılmaz).
    const cur = durum.oturum;
    const n = cur ? cur.sonuclar.slice(0, cur.indeks).filter((x) => x === null).length : 0;
    bosBilgisi.textContent = n > 0 ? M.bosSoruVar(n) : "";
  };
  bosGuncelle();
  const gezintiCubugu = el(
    "nav",
    { class: "soru-gezintisi", attr: { "aria-label": M.soruGezintisi } },
    el("div", { class: "dugme-satiri" }, oncekiDugmesi, sonrakiDugmesi),
    bosBilgisi,
  );

  const geriBildirimGoster = (sonuc: Degerlendirme, duzeltildi: boolean, yeniCevap: boolean) => {
    sonrakiDugmesi.className = "dugme birincil";
    const baslik = el(
      "p",
      { class: `sonuc-baslik ${sonuc.dogru ? "dogru" : "yanlis"}` },
      duzeltildi ? simgeliMetin("✓", M.dogruSayildi) : simgeliMetin(sonuc.dogru ? "✓" : "✗", sonuc.dogru ? M.dogruCevap : M.yanlisCevap),
    );
    const parcalar: (HTMLElement | null)[] = [baslik];
    if (!sonuc.dogru) {
      parcalar.push(el("p", { class: "dogru-cevap" }, el("strong", null, M.dogruCevapNe), " ", bicimliMetin(dogruCevapMetni(soru))));
    }
    if (soru.aciklama) parcalar.push(el("p", { class: "soru-aciklama" }, bicimliMetin(soru.aciklama)));
    const dugmeler = el("div", { class: "dugme-satiri" });
    if (!sonuc.dogru) {
      const aslinda = el(
        "button",
        {
          type: "button",
          class: "dugme ikincil",
          onclick: () => {
            const cur = durum.oturum;
            if (!cur) return;
            const kayit = mevcutSonuc(cur);
            durum.oturum = dogruSay(cur);
            cevabiKaydet(kayit?.oncekiKayit, kimlik, true, Date.now());
            baslik.className = "sonuc-baslik dogru";
            baslik.replaceChildren(simgeliMetin("✓", M.dogruSayildi));
            aslinda.remove();
            sonrakiDugmesi.focus();
          },
        },
        M.aslindaDogruydu,
      );
      dugmeler.append(aslinda);
      parcalar.push(dugmeler);
    }
    geriBildirim.replaceChildren(...parcalar.filter((p): p is HTMLElement => p !== null));
    geriBildirim.classList.add("gorunur", sonuc.dogru ? "dogru" : "yanlis");
    bosGuncelle();
    if (yeniCevap) {
      sonrakiDugmesi.focus({ preventScroll: true });
      gezintiCubugu.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  const cizim = soruCiz(soru, cevapla);
  const govde = el(
    "main",
    { class: "icerik soru-ekrani" },
    el("article", { class: "kart soru-karti" }, cizim.el),
    geriBildirim,
    gezintiCubugu,
  );
  const sayfa = ekran(ust, cubuk, govde);

  // Daha önce cevaplanmış bir soruya dönüldüyse cevabı ve geri bildirimi göster.
  const kayitli = mevcutSonuc(o);
  if (kayitli) {
    const sonuc = { ...cevapKontrol(soru, kayitli.cevap, durum.ayarlar), dogru: kayitli.dogru };
    cizim.sonucuGoster(kayitli.cevap, sonuc);
    geriBildirimGoster(sonuc, kayitli.duzeltildi, false);
    queueMicrotask(() => sonrakiDugmesi.focus({ preventScroll: true }));
  } else {
    // Ekrana eklendikten sonra odakla.
    queueMicrotask(() => cizim.odakla?.());
  }
  return sayfa;
}
