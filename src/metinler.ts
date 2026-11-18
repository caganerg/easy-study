// Arayüzdeki ve doğrulama mesajlarındaki tüm Türkçe metinler burada durur.

export const M = {
  uygulamaAdi: "Ders Çalış",

  // Genel
  anaSayfa: "Ana sayfa",
  geri: "Geri",
  ayarlar: "Ayarlar",
  yukleniyor: "Yükleniyor…",
  tamam: "Tamam",
  vazgec: "Vazgeç",
  evet: "Evet",
  kapat: "Kapat",

  // Ana sayfa
  desteYok: "Henüz deste yok. public/desteler/index.json dosyasına deste ekleyin.",
  listeYuklenemedi: "Deste listesi yüklenemedi.",
  desteYuklenemedi: (dosya: string) => `${dosya} yüklenemedi.`,
  soruSayisi: (n: number) => `${n} soru`,
  ogrenilen: (ogrenilen: number, toplam: number) => `${ogrenilen} / ${toplam} öğrenildi`,
  hataliSoru: (n: number) => `${n} soru hatalı`,
  uyariSayisi: (n: number) => `${n} uyarı`,
  yanlisSoruVar: (n: number) => `Yanlış çözdüğün ${n} soru var`,
  yanlislariCoz: "Tekrar çöz",
  yanlislarimBaslik: "Yanlışlarım",
  yanlisSayisiKisa: (n: number) => `${n} yanlış`,
  kaliciDegil: "İlerleme bu tarayıcıda kalıcı olarak saklanamıyor (gizli mod?). Sayfa kapanınca kaybolur.",
  cevrimdisi: "Çevrimdışısınız; son indirilen desteler gösteriliyor.",

  // Sorun listesi
  sorunlarBaslik: (baslik: string) => `${baslik} – sorunlar`,
  hatalar: "Hatalar",
  uyarilar: "Uyarılar",
  soruEtiketi: (sira: number | undefined, id: string | undefined) => {
    const parcalar: string[] = [];
    if (sira !== undefined) parcalar.push(`${sira}. soru`);
    if (id !== undefined) parcalar.push(`id: ${id}`);
    return parcalar.length > 0 ? parcalar.join(", ") : "Deste";
  },

  // Oturum ayarı
  oturumAyari: "Oturum ayarı",
  soruTipleri: "Soru tipleri",
  soruAdedi: "Soru sayısı",
  tumu: "Tümü",
  mod: "Mod",
  modKarisik: "Karışık",
  modYanlislar: "Sadece yanlışlarım",
  etiketler: "Etiketler",
  etiketAciklama: "Hiçbiri seçilmezse tüm etiketler dahil edilir.",
  basla: "Başla",
  uygunSoruYok: "Bu seçimlere uyan soru yok.",
  uygunSoruSayisi: (n: number) => `Uygun soru: ${n}`,
  desteBulunamadi: "Deste bulunamadı.",

  // Soru tipleri
  tipAdi: {
    coktan_secmeli: "Çoktan seçmeli",
    dogru_yanlis: "Doğru / Yanlış",
    bosluk: "Boşluk doldurma",
  },
  dogruSecenek: "Doğru",
  yanlisSecenek: "Yanlış",
  kontrolEt: "Kontrol et",
  bosluk: (n: number) => `${n}. boşluk`,
  cevabiniz: "Cevabınız",

  // Soru ekranı
  ilerleme: (sira: number, toplam: number) => `${sira} / ${toplam}`,
  oturumdanCik: "Oturumdan çık",
  oturumdanCikilsinMi: "Oturumdan çıkılsın mı?",
  oturumdanCikAciklama: "Bu oturumda henüz kaydedilmemiş cevap kaybolmaz; çözülen sorular kaydedildi.",
  cik: "Çık",
  devamEt: "Devam et",

  // Geri bildirim
  dogruCevap: "Doğru!",
  yanlisCevap: "Yanlış",
  dogruCevapNe: "Doğru cevap:",
  devam: "Devam",
  aslindaDogruydu: "Aslında doğruydu",
  dogruSayildi: "Doğru sayıldı",

  // Sonuç
  sonuc: "Sonuç",
  dogruSayisi: (n: number) => `Doğru: ${n}`,
  yanlisSayisi: (n: number) => `Yanlış: ${n}`,
  yuzde: (n: number) => `%${n}`,
  yanlisSorular: "Yanlış cevaplanan sorular",
  hepsiDogru: "Tebrikler, hepsi doğru!",
  yanlislariTekrarCoz: "Yanlışları tekrar çöz",
  oturumYok: "Aktif oturum yok.",

  // Ayarlar
  turkceTolerans: "Türkçe karakter farkını yok say",
  turkceToleransAciklama: "Açıkken “sogan” ile “soğan” aynı sayılır.",
  siklariKaristir: "Şıkları karıştır",
  tema: "Tema",
  temaSistem: "Sistem",
  temaAcik: "Açık",
  temaKoyu: "Koyu",
  yaziBoyutu: "Yazı boyutu",
  yaziNormal: "Normal",
  yaziBuyuk: "Büyük",
  veri: "Veri",
  disaAktar: "İlerlemeyi dışa aktar",
  iceAktar: "İçe aktar",
  sifirla: "İlerlemeyi sıfırla",
  sifirlaSoru: "Tüm ilerleme silinsin mi?",
  sifirlaAciklama: "Bu işlem geri alınamaz. Önce dışa aktararak yedek almanız önerilir.",
  sifirlandi: "İlerleme sıfırlandı.",
  sil: "Sil",
  iceAktarSoru: "Yedek nasıl yüklensin?",
  iceAktarAciklama: (n: number) => `Yedekte ${n} soru kaydı var.`,
  iceAktarSecenekAciklama: "Birleştir: her soru için daha yeni kayıt tutulur, ayarlar değişmez. Üzerine yaz: mevcut ilerleme ve ayarlar silinip yedektekiler yüklenir.",
  uzerineYaz: "Üzerine yaz",
  birlestir: "Birleştir",
  iceAktarildi: (n: number) => `${n} kayıt içe aktarıldı.`,
  yedekGecersiz: (neden: string) => `Yedek dosyası geçersiz: ${neden}`,
  dosyaOkunamadi: "Dosya okunamadı.",
  disaAktarildi: "Yedek indirildi.",
  surumBilgisi: (s: string) => `Sürüm ${s}`,

  // PWA
  guncellemeVar: "Güncelleme var",
  yenile: "Yenile",
  cevrimdisiHazir: "Uygulama çevrimdışı kullanıma hazır.",

  // Bilinmeyen sayfa
  sayfaYok: "Sayfa bulunamadı.",
} as const;

/** Doğrulama mesajları (deste dosyaları ve index.json için). */
export const D = {
  nesneDegil: "Bir JSON nesnesi olmalı.",
  alanEksik: (alan: string) => `“${alan}” alanı eksik.`,
  metinOlmali: (alan: string) => `“${alan}” boş olmayan bir metin olmalı.`,
  diziOlmali: (alan: string) => `“${alan}” bir dizi olmalı.`,
  bosDizi: (alan: string) => `“${alan}” boş olamaz.`,
  booleanOlmali: (alan: string) => `“${alan}” true ya da false olmalı.`,
  tamSayiOlmali: (alan: string) => `“${alan}” bir tam sayı olmalı.`,
  surumGecersiz: (beklenen: number) => `“surum” ${beklenen} olmalı.`,
  idBicimi: (alan: string, desen: string) => `“${alan}” şu biçime uymalı: ${desen}`,
  bilinmeyenAlan: (alan: string) => `Bilinmeyen alan: “${alan}” (yok sayıldı).`,
  bilinmeyenTip: (tip: string) => `Bilinmeyen soru tipi: “${tip}”.`,
  tekrarlananId: (id: string, ilkSira: number) => `“${id}” id'si daha önce ${ilkSira}. soruda kullanılmış.`,
  secenekSayisi: (min: number, max: number) => `“secenekler” ${min}–${max} eleman içermeli.`,
  secenekTekrar: "Aynı şık birden fazla kez yazılmış.",
  dogruIndeksSinirDisi: (n: number) => `“dogru” 0 ile ${n - 1} arasında olmalı.`,
  boslukYok: "Soru metninde boşluk (___) yok.",
  boslukSayisiUyumsuz: (bosluk: number, cevap: number) =>
    `Soru metninde ${bosluk} boşluk var ama “cevaplar” ${cevap} eleman içeriyor.`,
  cevapListesiBos: (n: number) => `${n}. boşluk için en az bir kabul edilen cevap olmalı.`,
  cevapMetinOlmali: (n: number) => `${n}. boşluğun cevapları boş olmayan metinler olmalı.`,
  etiketMetinOlmali: "“etiketler” boş olmayan metinlerden oluşmalı.",
  soruYok: "Destede hiç geçerli soru yok.",
  tekrarlananDeste: (id: string, dosya: string) => `“${id}” deste id'si ${dosya} dosyasında da kullanılıyor.`,
  tekrarlananDosya: (dosya: string) => `“${dosya}” listede birden fazla kez geçiyor.`,
  dosyaAdi: "“dosya” .json ile biten bir dosya adı olmalı (klasör olmadan).",
} as const;
