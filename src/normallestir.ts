// Boşluk doldurma cevapları için metin normalleştirme (saf fonksiyonlar).

const TURKCE_ESLEME: Readonly<Record<string, string>> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

export interface NormallestirmeAyari {
  turkceTolerans: boolean;
}

export function normallestir(metin: string, ayar: NormallestirmeAyari): string {
  let s = metin.normalize("NFC").trim().replace(/\s+/g, " ");
  // Türkçe kurallarıyla küçük harf: "I" → "ı", "İ" → "i".
  s = s.toLocaleLowerCase("tr");
  // Sondaki nokta ve virgüller (ve araya giren boşluklar) yok sayılır.
  s = s.replace(/[.,\s]+$/u, "");
  if (ayar.turkceTolerans) s = s.replace(/[çğıöşü]/g, (h) => TURKCE_ESLEME[h] ?? h);
  return s;
}
