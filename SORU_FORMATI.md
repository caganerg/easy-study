# Soru Formatı (soru üreten yapay zeka için talimat)

Bu belge, ders çalışma uygulamasına soru destesi üretecek yapay zeka için **kesin** talimattır. Burada yazılan kurallara uymayan sorular uygulamada atlanır ve yayın (GitHub Actions) başarısız olur.

Makine tarafından okunabilir şema: [`sema/deste.schema.json`](sema/deste.schema.json) (JSON Schema, draft 2020-12). Şemanın ifade edemediği kurallar aşağıda [“Şemanın denetleyemediği kurallar”](#şemanın-denetleyemediği-kurallar) başlığında yazılıdır; onlara da uyulmalıdır.

---

## 1. Çıktı biçimi

- Çıktı **yalnızca geçerli JSON** olmalıdır: tek bir JSON nesnesi.
- Yorum (`//`, `/* */`), markdown kod bloğu (```` ``` ````), açıklama metni, sondaki virgül **olmamalıdır**.
- Kodlama UTF-8'dir. Türkçe karakterler (ç, ğ, ı, İ, ö, ş, ü) doğrudan yazılır; `ç` gibi kaçış dizisi gerekmez.
- Metinlerde çift tırnak gerekiyorsa `\"` ile kaçırılır ya da “Türkçe tırnak” kullanılır.

## 2. Deste dosyası

```json
{
  "surum": 1,
  "id": "bugday-temel",
  "baslik": "Buğday – Temel Bilgiler",
  "ders": "Tarla Bitkileri",
  "aciklama": "İsteğe bağlı kısa açıklama",
  "sorular": [ ... ]
}
```

| Alan | Zorunlu | Tür | Kural |
|---|---|---|---|
| `surum` | evet | sayı | Her zaman `1`. |
| `id` | evet | metin | Küçük harf, rakam ve tire: `^[a-z0-9]+(-[a-z0-9]+)*$` (ör. `bugday-temel`). Türkçe karakter ve boşluk yok. Tüm desteler arasında benzersiz; **asla değiştirilmez** (ilerleme bu id'ye bağlıdır). |
| `baslik` | evet | metin | Boş olmayan. |
| `ders` | evet | metin | Ana sayfada desteler bu alana göre gruplanır. Aynı dersin desteleri aynı yazımı kullanmalı. |
| `aciklama` | hayır | metin | Kısa açıklama. |
| `sorular` | evet | dizi | En az 1 soru. |

## 3. Ortak soru alanları

| Alan | Zorunlu | Tür | Kural |
|---|---|---|---|
| `id` | evet | metin | Harf, rakam, `_`, `-`: `^[A-Za-z0-9_-]+$`. Bu projede biçim **`q001`, `q002`, …** (üç haneli, sıralı). Deste içinde benzersiz, değişmez. |
| `tip` | evet | metin | `coktan_secmeli`, `dogru_yanlis` ya da `bosluk`. |
| `soru` | evet | metin | Boş olmayan soru metni. |
| `aciklama` | hayır* | metin | Cevaptan sonra gösterilen kısa açıklama. *Bu projede **her soruya yazılmalıdır.* |
| `etiketler` | hayır | metin dizisi | Konu etiketleri (ör. `["sitogenetik"]`). Oturumda etikete göre filtreleme yapılır. Küçük harf ve tutarlı yazım kullanın. |

Bilinmeyen alanlar hata değil uyarıdır ve yok sayılır; yine de **eklemeyin**.

### Biçimlendirme

Metinlerde (`soru`, `secenekler`, `aciklama`) yalnızca şu biçimlendirme desteklenir:

- `**kalın**`
- `*italik*` — bilimsel adlar için kullanın: `*Triticum aestivum*`

HTML etiketi, markdown başlığı, liste, bağlantı, görsel **kullanılmaz** (düz metin olarak görünür).

## 4. Soru tipleri

### 4.1 Çoktan seçmeli — `coktan_secmeli`

```json
{
  "id": "q001",
  "tip": "coktan_secmeli",
  "soru": "Ekmeklik buğdayın kromozom sayısı kaçtır?",
  "secenekler": ["2n=14", "2n=28", "2n=42", "2n=56"],
  "dogru": 2,
  "aciklama": "Ekmeklik buğday hekzaploittir (2n=6x=42).",
  "etiketler": ["sitogenetik"]
}
```

- `secenekler`: 2–6 adet, boş olmayan, **birbirinden farklı** metin. Tercihen 4 şık.
- `dogru`: doğru şıkkın **sıfırdan başlayan** indeksi (yukarıda `2` → `"2n=42"`).
- Uygulama şıkları ekranda karıştırır; `dogru` her zaman dosyadaki sıraya göredir.

### 4.2 Doğru / Yanlış — `dogru_yanlis`

```json
{
  "id": "q002",
  "tip": "dogru_yanlis",
  "soru": "Makarnalık buğday tetraploittir.",
  "dogru": true,
  "aciklama": "Triticum durum, 2n=4x=28."
}
```

- `dogru`: `true` ya da `false` (tırnaksız, JSON boolean).
- `soru` bir **önerme** olmalıdır (soru cümlesi değil).

### 4.3 Boşluk doldurma — `bosluk`

```json
{
  "id": "q003",
  "tip": "bosluk",
  "soru": "Ekmeklik buğdayın bilimsel adı *Triticum* ___ L.'dir.",
  "cevaplar": [["aestivum"]],
  "aciklama": "Ekmeklik buğday: Triticum aestivum L."
}
```

Çok boşluklu örnek:

```json
{
  "id": "q004",
  "tip": "bosluk",
  "soru": "Makarnalık buğdayın kromozom sayısı 2n = ___, ekmeklik buğdayınki ise 2n = ___ olarak bilinir.",
  "cevaplar": [["28"], ["42"]],
  "aciklama": "Makarnalık tetraploit (4x=28), ekmeklik hekzaploittir (6x=42)."
}
```

- Soru metnindeki her `___` (**üç alt çizgi**; daha uzun alt çizgi dizisi de tek boşluk sayılır) bir boşluktur.
- `cevaplar` bir **dizi dizisidir**: her boşluk için, sırasıyla, kabul edilen cevapların listesi. Tek boşluk olsa bile `[["cevap"]]` biçimindedir.
- Her listede en az 1 boş olmayan cevap olmalıdır.
- Kullanıcı cevabı karşılaştırılırken: baştaki/sondaki boşluk silinir, çoklu boşluk teke iner, Türkçe kurallarıyla küçük harfe çevrilir, sondaki nokta/virgül yok sayılır ve (varsayılan ayarda) ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u eşlenir. Bu yüzden büyük/küçük harf ve Türkçe karakter varyasyonlarını ayrıca eklemenize **gerek yoktur**.
- Ama **farklı yazımları ve eş anlamlıları ekleyin**: `["karyopsis", "kariyopsis"]`, `["Poaceae", "Gramineae", "buğdaygiller"]`, sayılarda `["7", "yedi"]`, kısaltmalarda `["Triticum aestivum", "T. aestivum"]`.
- Cevap kısa olmalı (1–3 kelime). Uzun cümle cevaplı boşluk sorusu yazmayın.
- Boşlukların sırası belirsiz olmamalıdır. ❌ “Gluten ___ ve ___ proteinlerinden oluşur.” (iki sıra da doğru olabilir) → ✅ “Uzama özelliği veren protein ___, esneklik veren protein ise ___'dir.”

## 5. Şemanın denetleyemediği kurallar

Bunlar `sema/deste.schema.json` ile ifade edilemez ama uygulama ve `bun run dogrula` tarafından **hata** olarak denetlenir:

1. **Boşluk sayısı = `cevaplar` uzunluğu.** `bosluk` sorusunda metindeki `___` sayısı `cevaplar` dizisinin eleman sayısına eşit olmalıdır.
2. **`dogru` indeksi sınırlar içinde olmalı.** `coktan_secmeli` sorusunda `0 ≤ dogru < secenekler.length` (şema yalnızca 0–5 aralığını denetler).
3. **Soru id'leri deste içinde benzersiz olmalı.** Aynı id ikinci kez kullanılırsa sonraki soru hatalı sayılır.
4. **Deste id'leri tüm desteler arasında benzersiz olmalı.**
5. **Şıklar baştaki/sondaki boşluk farkıyla bile tekrarlanmamalı** (`"A"` ile `"A "` aynı sayılır).
6. **Metinler yalnızca boşluktan oluşamaz.**

## 6. İçerik kuralları

- **Tek doğru şık.** Çoktan seçmelide yalnızca bir şık doğru olmalı; tartışmalı ya da “en uygun” türü belirsiz sorular yazmayın.
- **Makul çeldiriciler.** Yanlış şıklar konuyla ilgili, inandırıcı ve doğru şıkla **benzer uzunlukta ve aynı dil yapısında** olmalı. Doğru şık en uzun ya da en ayrıntılı şık olarak öne çıkmamalı.
- **“Hepsi”, “hiçbiri”, “A ve B” gibi şıklar kullanılmaz.** Şıklar karıştırıldığı için bu tür şıklar anlamsızlaşır.
- **Doğru şıkkın konumu dengeli dağılmalı.** Bir destede `dogru` değerleri 0, 1, 2, 3 arasında yaklaşık eşit sayıda olmalı; art arda aynı konumdan kaçının.
- **Olumsuz soru kökünden kaçının** (“… hangisi değildir?”). Gerekirse olumsuz kelimeyi **kalın** yazın: “Hangisi buğdayın özelliklerinden **değildir**?”
- **Doğru/yanlış dengesi.** `true` ve `false` cevaplı önermeler yaklaşık eşit sayıda olmalı. Yanlış önermeler tek bir kritik ayrıntıyı değiştirerek kurulmalı; “her zaman”, “asla” gibi ipucu veren kelimelerden kaçının.
- **Boşlukta olası tüm doğru yazımlar** `cevaplar`a eklenmeli (bkz. 4.3).
- **Her soruda kısa bir `aciklama`** olmalı: doğru cevabın neden doğru olduğunu 1–2 cümleyle anlatın.
- Sorular verilen ders notlarına dayanmalı; notlarda olmayan bilgi uydurulmamalı.
- Her soru tek başına anlaşılır olmalı (“yukarıdaki soruda…” gibi atıf yok).

## 7. Mevcut desteye soru ekleme

- Var olan soruların `id`'leri **değiştirilmez, yeniden numaralandırılmaz, silinen id yeniden kullanılmaz.** (İlerleme `deste id + soru id` ile tutulur.)
- Yeni sorular dizinin **sonuna** eklenir ve id'ler en büyük mevcut numaradan devam eder: son soru `q033` ise yenisi `q034`.
- Bir sorunun metnini düzeltmek serbesttir; id aynı kaldığı sürece ilerleme korunur. Ancak sorunun **anlamı** değişiyorsa eskisini silip yeni id ile ekleyin.
- Desteden silinen soruların ilerleme kaydı uygulamada silinmez, yalnızca yok sayılır.

## 8. Yeni deste ekleme

1. JSON dosyasını `public/desteler/` klasörüne koyun. Dosya adı: harf, rakam, `-`, `_`, `.` ve `.json` uzantısı (ör. `misir-temel.json`).
2. `public/desteler/index.json` dosyasındaki `desteler` listesine bir satır ekleyin (**unutmayın** — listede olmayan dosya hata sayılır):

   ```json
   { "dosya": "misir-temel.json", "baslik": "Mısır – Temel Bilgiler", "ders": "Tarla Bitkileri" }
   ```

   `baslik` ve `ders`, deste dosyasındakilerle aynı olmalı.
3. Push etmeden önce doğrulayın:

   ```sh
   bun run dogrula
   ```

   Çıktıda `0 hata` görmeden push etmeyin. Hata varsa GitHub Actions yayını durdurur; site bozulmaz ama yeni sorular yayınlanmaz.

Kodda değişiklik gerekmez.

## 9. Hazır prompt şablonları

### Yeni deste

> Aşağıdaki ders notlarından, `SORU_FORMATI.md` dosyasındaki kurallara birebir uyan bir deste üret.
>
> - Deste id'si: `<deste-id>`, başlık: `<Başlık>`, ders: `<Ders adı>`
> - **15 çoktan seçmeli** (4 şıklı, doğru şık konumları dengeli), **10 doğru/yanlış** (yaklaşık yarısı `true`), **10 boşluk doldurma** (en az 2'si çok boşluklu) soru.
> - Sıra: önce çoktan seçmeli, sonra doğru/yanlış, sonra boşluk. id'ler `q001`'den başlayıp kesintisiz artsın.
> - Her soruya kısa bir `aciklama` ve 1–2 konu `etiketler`i ekle.
> - Çıktı yalnızca geçerli JSON olsun; markdown kod bloğu, yorum ya da açıklama yazma.
>
> Ders notları:
> ```
> <notlar>
> ```

### Mevcut desteye ekleme

> Aşağıdaki mevcut desteye, `SORU_FORMATI.md` kurallarına uyarak ekte verdiğim notlardan **N yeni soru** ekle (tip dağılımı: …). Var olan soruları ve id'lerini **değiştirme**; yeni id'ler en büyük mevcut id'den devam etsin. Mevcut sorularla aynı bilgiyi tekrar soran soru yazma. Çıktı olarak **tüm destenin** güncel halini yalnızca geçerli JSON olarak ver.
>
> Mevcut deste:
> ```json
> <deste JSON>
> ```
>
> Notlar:
> ```
> <notlar>
> ```

### Kendi kendini denetleme listesi (üretimden sonra)

- [ ] Çıktı tek bir JSON nesnesi; yorum/kod bloğu yok.
- [ ] `surum` = 1, deste `id` biçimi doğru.
- [ ] Soru id'leri `q001`'den sıralı ve benzersiz.
- [ ] Her `coktan_secmeli`de `dogru` < şık sayısı; şıklar farklı; “hepsi/hiçbiri” yok.
- [ ] Her `bosluk`ta `___` sayısı = `cevaplar` uzunluğu; `cevaplar` dizi dizisi.
- [ ] Her `dogru_yanlis`te `dogru` tırnaksız `true`/`false`.
- [ ] Her soruda `aciklama` var.
