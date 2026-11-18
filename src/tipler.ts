// Uygulamanın tüm ortak tipleri. Dışarıdan gelen veri bu tiplere ancak
// doğrulamadan (dogrulama.ts, depo.ts, yedek.ts) geçtikten sonra dönüşür.

export interface SoruTemel {
  id: string;
  soru: string;
  aciklama?: string;
  etiketler?: string[];
}

export type Soru =
  | (SoruTemel & { tip: "coktan_secmeli"; secenekler: string[]; dogru: number })
  | (SoruTemel & { tip: "dogru_yanlis"; dogru: boolean })
  | (SoruTemel & { tip: "bosluk"; cevaplar: string[][] });

export type SoruTipi = Soru["tip"];

/** Belirli bir tipe ait soru: SoruTuru<"bosluk"> gibi. */
export type SoruTuru<T extends SoruTipi> = Extract<Soru, { tip: T }>;

/** Kullanıcının verdiği cevap; soru tipine göre ayrışır. */
export type Cevap =
  | { tip: "coktan_secmeli"; secilen: number }
  | { tip: "dogru_yanlis"; secilen: boolean }
  | { tip: "bosluk"; girilen: string[] };

export type CevapTuru<T extends SoruTipi> = Extract<Cevap, { tip: T }>;

export interface Degerlendirme {
  dogru: boolean;
  /** Boşluk doldurmada her boşluğun ayrı sonucu. */
  bosluklar?: boolean[];
}

export interface Deste {
  surum: 1;
  id: string;
  baslik: string;
  ders: string;
  aciklama?: string;
  sorular: Soru[];
}

/** public/desteler/index.json içindeki bir satır. */
export interface DesteOzeti {
  dosya: string;
  baslik: string;
  ders: string;
}

export interface DesteListesi {
  desteler: DesteOzeti[];
}

/** Doğrulama sırasında bulunan bir sorun. sira 1'den başlar. */
export interface Sorun {
  sira?: number;
  soruId?: string;
  mesaj: string;
}

export interface DesteDogrulamasi {
  /** Ölümcül hata varsa null; aksi halde hatalı sorular atlanmış deste. */
  deste: Deste | null;
  hatalar: Sorun[];
  uyarilar: Sorun[];
}

export interface ListeDogrulamasi {
  liste: DesteListesi | null;
  hatalar: Sorun[];
  uyarilar: Sorun[];
}

export type Tema = "sistem" | "acik" | "koyu";
export type YaziBoyutu = "normal" | "buyuk";

export interface Ayarlar {
  turkceTolerans: boolean;
  siklariKaristir: boolean;
  tema: Tema;
  yaziBoyutu: YaziBoyutu;
}

export const VARSAYILAN_AYARLAR: Readonly<Ayarlar> = {
  turkceTolerans: true,
  siklariKaristir: true,
  tema: "sistem",
  yaziBoyutu: "normal",
};
