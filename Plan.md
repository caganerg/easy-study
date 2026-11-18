# Görev: Ders Çalışma Uygulaması (TypeScript + Vite + Bun, PWA, GitHub Pages)

Benim için telefonda ve tablette kullanacağım bir ders çalışma uygulaması yap. Uygulama GitHub Pages'te statik site olarak yayınlanacak. Sorular repodaki JSON dosyalarında duracak. Soruları ayrı bir yapay zeka ajanı üretecek, bu yüzden soru formatı kesin, belgelenmiş ve doğrulanabilir olmalı.

İşi aşağıdaki fazlara göre yap. Her fazın sonunda kabul kriterlerini kontrol et, sonra bir sonrakine geç. Her fazdan sonra ne yaptığını ve nasıl test edeceğimi kısaca yaz.

---

## 1. Teknik kısıtlar

- **Dil: TypeScript**, `strict: true` (ayrıca `noUncheckedIndexedAccess: true`). `any` kullanma; dışarıdan gelen veri (JSON, IndexedDB, yedek dosyası) önce `unknown` olarak alınıp doğrulanarak tipe çevrilsin.
- **Paket yöneticisi ve test aracı: Bun.** `npm`, `npx`, `yarn`, `pnpm` kullanma; `package-lock.json` oluşturma. Kilit dosyası `bun.lock` olsun ve repoya eklensin. Testler `bun test` ile yazılsın (Jest/Vitest kurma). Scriptler `bun run ...` ile çalışsın.
- **Derleyici: Vite.** Bun'un kendi bundler'ını kullanma; PWA eklentisi Vite'a bağlı.
- **PWA: `vite-plugin-pwa`** (Workbox). Ana ekrana eklenebilmeli ve internetsiz çalışabilmeli.
- **UI framework kullanma** (React, Vue, Svelte vb. yok). Saf TypeScript + DOM. Ekranları küçük, tek sorumluluklu modüllere böl. DOM oluşturmak için küçük bir yardımcı fonksiyon (ör. `el("button", { class: "...", onclick }, ...cocuklar)`) yazabilirsin.
- **Bağımlılıkları en az tut.** İzin verilenler (hepsi `devDependencies`): `vite`, `typescript`, `vite-plugin-pwa`, `ajv` (yalnızca testlerde ve doğrulama scriptinde, şema ile kodun tutarlılığını kontrol etmek için), `@types/bun`. Çalışma zamanında hiçbir dış paket olmasın; IndexedDB için kendi küçük sarmalayıcını yaz. Başka bir paket gerekirse önce bana sor.
- **Yayın adresi:** Site `https://<kullanici>.github.io/<repo-adi>/` altında yayınlanacak. Vite `base` ayarı ortam değişkeninden gelsin (`BASE_PATH`, yerelde varsayılan `/`). Desteler ve diğer statik dosyalar `import.meta.env.BASE_URL` ile çekilsin; kodda `/` ile başlayan sabit yol olmasın.
- **Mobil öncelikli tasarım:** 360 px genişlikte kusursuz görünmeli, tablette (768–1024 px) içerik ortalanmış, okunaklı bir genişlikte olmalı. Dokunma hedefleri en az 44×44 px. Açık/koyu mod (`prefers-color-scheme` + ayardan seçim).
- **Arayüz dili Türkçe.** Tüm metinler tek bir yerde (`src/metinler.ts`) dursun.
- İlerleme verisi **IndexedDB**'de, ayarlar `localStorage`'da tutulsun. Hiçbir veri dışarı gönderilmesin.
- Karmaşık yerlere kısa Türkçe yorum yaz.

## 2. Repo yapısı

```
/
├── index.html
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
├── .github/workflows/deploy.yml
├── public/
│   ├── ikonlar/              # 192, 512 px ve maskable ikon
│   └── desteler/
│       ├── index.json        # deste listesi
│       └── ornek.json        # örnek deste
├── src/
│   ├── main.ts               # başlatma, hash yönlendirme
│   ├── tipler.ts             # Soru, Deste, İlerleme, Ayarlar tipleri
│   ├── dogrulama.ts          # unknown → Deste dönüşümü, hata listesi (bağımlılıksız)
│   ├── desteler.ts           # deste yükleme
│   ├── soru-tipleri/         # her soru tipi ayrı modül + kayıt tablosu
│   ├── cevap.ts              # normalleştirme ve cevap kontrolü
│   ├── oturum.ts             # çalışma oturumu mantığı (DOM'dan bağımsız)
│   ├── leitner.ts            # kutu ve tekrar zamanı hesabı (DOM'dan bağımsız)
│   ├── depo.ts               # IndexedDB sarmalayıcı
│   ├── yedek.ts              # dışa/içe aktarma
│   ├── metinler.ts
│   ├── ekranlar/             # her ekran ayrı modül
│   └── stil.css
├── tests/                    # bun test dosyaları (*.test.ts)
│   └── fixtures/             # geçerli ve bilerek hatalı örnek desteler
├── scripts/
│   └── dogrula-desteler.ts   # public/desteler altındaki tüm desteleri doğrular
├── sema/
│   └── deste.schema.json     # JSON Schema (soru üreten ajan için)
├── SORU_FORMATI.md           # soru üreten ajan için talimat
└── README.md
```

`package.json` scriptleri:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit",
    "test": "bun test",
    "dogrula": "bun scripts/dogrula-desteler.ts"
  }
}
```

İş mantığı (`cevap.ts`, `leitner.ts`, `oturum.ts`, `dogrulama.ts`, `yedek.ts`) DOM'a ve tarayıcı API'lerine bağımlı olmasın ki `bun test` ile doğrudan test edilebilsin.

## 3. Soru formatı

### `public/desteler/index.json`

```json
{
  "desteler": [
    { "dosya": "ornek.json", "baslik": "Örnek Deste", "ders": "Genel" }
  ]
}
```

Yeni deste eklemek için JSON dosyasını `public/desteler/` klasörüne koyup bu listeye bir satır eklemek yeterli olmalı. Kodda değişiklik gerekmemeli.

### Deste dosyası

```json
{
  "surum": 1,
  "id": "bugday-temel",
  "baslik": "Buğday – Temel Bilgiler",
  "ders": "Tarla Bitkileri",
  "aciklama": "İsteğe bağlı kısa açıklama",
  "sorular": [
    {
      "id": "q001",
      "tip": "coktan_secmeli",
      "soru": "Ekmeklik buğdayın kromozom sayısı kaçtır?",
      "secenekler": ["2n=14", "2n=28", "2n=42", "2n=56"],
      "dogru": 2,
      "aciklama": "Ekmeklik buğday hekzaploittir (6x=42).",
      "etiketler": ["sitogenetik"]
    },
    {
      "id": "q002",
      "tip": "dogru_yanlis",
      "soru": "Makarnalık buğday tetraploittir.",
      "dogru": true,
      "aciklama": "Triticum durum, 2n=4x=28."
    },
    {
      "id": "q003",
      "tip": "bosluk",
      "soru": "Ekmeklik buğdayın bilimsel adı Triticum ___ L.'dir.",
      "cevaplar": [["aestivum"]],
      "aciklama": "Ekmeklik buğday: Triticum aestivum L."
    }
  ]
}
```

### TypeScript tipleri (`src/tipler.ts`)

Soru tipleri `tip` alanına göre ayrışan bir birleşim tipi (discriminated union) olsun:

```ts
interface SoruTemel { id: string; soru: string; aciklama?: string; etiketler?: string[] }

export type Soru =
  | (SoruTemel & { tip: "coktan_secmeli"; secenekler: string[]; dogru: number })
  | (SoruTemel & { tip: "dogru_yanlis"; dogru: boolean })
  | (SoruTemel & { tip: "bosluk"; cevaplar: string[][] });
```

`switch (soru.tip)` kullanılan her yerde `never` ile kapsamlılık kontrolü yap, böylece yeni bir tip eklendiğinde ele alınmayan yerlerde derleyici hata versin.

### Kurallar

- `id`: Deste içinde benzersiz, değişmez. İlerleme takibi `desteId + soruId` ile yapılır, bu yüzden soru metni değişse bile id aynı kalırsa ilerleme korunur.
- `tip`: `coktan_secmeli` | `dogru_yanlis` | `bosluk`. İleride yeni tip eklemek (eşleştirme, sıralama, flash kart) kolay olsun: her tipin kendi doğrulama, çizim ve cevap kontrolü fonksiyonu `src/soru-tipleri/` altında ayrı bir modülde olsun ve tipli bir kayıt tablosundan seçilsin.
- **coktan_secmeli:** `secenekler` 2–6 eleman, `dogru` sıfırdan başlayan geçerli bir indeks. Şıklar ekranda karıştırılarak gösterilsin (ayardan kapatılabilsin), doğru cevap takibi karıştırmadan etkilenmesin.
- **dogru_yanlis:** `dogru` boolean.
- **bosluk:** Soru metnindeki her `___` (üç alt çizgi) bir boşluktur. `cevaplar` bir dizi dizisidir: her boşluk için kabul edilen cevapların listesi (her liste en az 1 eleman). Boşluk sayısı ile `cevaplar` uzunluğu eşit olmalı. Birden fazla boşluk desteklensin.
- `aciklama` ve `etiketler` isteğe bağlı. Bilinmeyen alanlar hata değil, uyarı sayılsın.
- Soru metinlerinde basit biçimlendirme olarak yalnızca `**kalın**` ve `*italik*` desteklensin. Deste içeriğini DOM'a `textContent` ile yaz ya da escape et; escape edilmemiş içerik asla `innerHTML`'e gitmesin.

### Doğrulama

- `src/dogrulama.ts`: `unknown` alır, `{ deste, hatalar, uyarilar }` döndürür. Hatalı sorular atlansın ama uygulama çökmesin. Deste kartında "3 soru hatalı" gibi bir uyarı çıksın; tıklayınca hangi sorunun (id ve sıra numarası) neden hatalı olduğu listelensin.
- Aynı id'ye sahip sorular hata sayılsın.
- `sema/deste.schema.json` dosyasını JSON Schema (draft 2020-12) olarak yaz. Kodundaki doğrulama kurallarıyla aynı kuralları içersin. Şemanın ifade edemediği kurallar (boşluk sayısı = `cevaplar` uzunluğu, `dogru` indeksinin sınırlar içinde olması, id benzersizliği) `SORU_FORMATI.md`'de açıkça yazsın.
- **Tutarlılık testi:** `tests/fixtures/` altındaki her geçerli deste hem `ajv` + şemadan hem de `dogrulama.ts`'den geçmeli; her hatalı deste `dogrulama.ts`'den hata almalı (şemanın yakalayabildiği hatalar şemadan da). Böylece şema ile kod birbirinden kopmaz.
- `scripts/dogrula-desteler.ts`: `public/desteler/index.json`'u ve listelenen tüm desteleri doğrular. Listede olup dosyası olmayan ya da dosyası olup listede olmayan desteleri de bildirir. Hata varsa sıfırdan farklı çıkış koduyla biter.

## 4. Cevap kontrolü (boşluk doldurma)

Karşılaştırmadan önce hem kullanıcı cevabını hem kabul edilen cevapları normalleştir:
- Baştaki ve sondaki boşlukları sil, birden fazla boşluğu teke indir.
- Türkçe kurallarıyla küçük harfe çevir (`toLocaleLowerCase("tr")`). İ/ı ve I/i dönüşümü doğru olmalı.
- Sondaki nokta ve virgülü yok say.
- **Ayar: "Türkçe karakter farkını yok say"** (varsayılan: açık). Açıkken ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u eşlemesi yapılsın. Bu sayede Türkçe klavyesi olmayan cihazda da cevap verilebilsin.
- Birden çok boşlukta her boşluk ayrı kontrol edilsin. Soru ancak hepsi doğruysa doğru sayılsın, ama geri bildirimde hangi boşluğun yanlış olduğu gösterilsin.

## 5. Ekranlar ve akış

1. **Ana sayfa:** Deste kartları (başlık, ders, soru sayısı, ilerleme çubuğu: kaç soru "öğrenildi"). Derse göre gruplansın. Üstte "Bugün tekrar edilecek: N soru" kısayolu olsun.
2. **Oturum ayarı** (desteye tıklayınca): Soru tipleri (çoklu seçim), soru sayısı (10 / 20 / tümü), mod: *Karışık*, *Sadece yanlışlarım*, *Tekrar zamanı gelenler*. Etiket filtresi (varsa).
3. **Soru ekranı:** Üstte ilerleme ("7 / 20"). Çoktan seçmeli ve doğru/yanlışta seçeneğe dokununca hemen değerlendirilsin. Boşlukta metin kutusu olsun; "Kontrol et" butonuna basınca ya da Enter'a basınca değerlendirilsin. Metin kutusu açılınca ekran klavyesi soruyu kapatmasın. Otomatik düzeltme ve büyük harfle başlatma kapalı olsun (`autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`).
4. **Geri bildirim:** Doğru/yanlış rengi ve simgesi, doğru cevap, varsa açıklama. "Devam" butonu. Yanlışta "Aslında doğruydu" butonu da olsun (yazım farkı gibi durumlar için, soruyu doğru sayar).
5. **Sonuç ekranı:** Doğru/yanlış sayısı, yüzde, yanlış soruların listesi. "Yanlışları tekrar çöz" ve "Ana sayfa" butonları.
6. **Ayarlar:** Türkçe karakter toleransı, şıkları karıştır, tema (sistem/açık/koyu), yazı boyutu (normal/büyük), ilerlemeyi dışa aktar, içe aktar, ilerlemeyi sıfırla (onay penceresiyle; tarayıcı `confirm()` yerine uygulama içi bir onay penceresi kullan).

Geri tuşu (Android) ve tarayıcı geçmişi düzgün çalışsın: hash tabanlı yönlendirme kullan (`#/`, `#/deste/bugday-temel`, `#/ayarlar`). Oturum ortasında geri basılırsa "Oturumdan çıkılsın mı?" diye sorulsun.

## 6. İlerleme ve tekrar sistemi (Leitner)

- Her soru için sakla: kutu (1–5), son çözülme zamanı, bir sonraki tekrar zamanı, toplam doğru, toplam yanlış.
- Doğru cevap → bir üst kutu (en fazla 5). Yanlış cevap → kutu 1.
- Tekrar aralıkları: kutu 1 = aynı gün, 2 = 1 gün, 3 = 3 gün, 4 = 7 gün, 5 = 14 gün.
- Kutu 5'teki sorular "öğrenildi" sayılır.
- Hiç çözülmemiş sorular "yeni" sayılır.
- "Tekrar zamanı gelenler" modu önce zamanı geçmiş soruları, sonra yenileri getirsin.
- Desteden silinmiş soruların ilerleme kaydı silinmesin, sadece yok sayılsın.
- `leitner.ts` saf fonksiyonlardan oluşsun, şimdiki zaman parametre olarak verilsin (`Date.now()` içeride çağrılmasın) ki testlerde zaman kontrol edilebilsin.

## 7. Yedekleme

- **Dışa aktar:** Tüm ilerleme ve ayarları tek bir JSON dosyası olarak indir (`ders-yedek-YYYY-AA-GG.json`). İçinde bir `surum` alanı olsun.
- **İçe aktar:** Dosya seçiciyle yükle, doğrula, "Mevcut ilerlemenin üzerine yazılsın mı / birleştirilsin mi?" diye sor. Birleştirmede her soru için daha yeni kaydı tut.
- Android Chrome ve iPad Safari'de çalıştığından emin ol (indirme için `a[download]` + Blob).

## 8. PWA ve önbellek (`vite-plugin-pwa`)

- Manifest: Türkçe ad ve kısa ad, `display: "standalone"`, tema rengi, 192/512 px ve maskable ikonlar. `start_url` ve `scope` `base` ile uyumlu olsun.
- `registerType: "prompt"`: Yeni sürüm algılanınca ekranın altında "Güncelleme var – Yenile" bildirimi göster (`virtual:pwa-register` kullan).
- Uygulama kabuğu (HTML, CSS, JS, ikonlar) precache edilsin.
- **`desteler/` klasörü precache'e girmesin** (`globIgnores` ile hariç tut). Bunun yerine Workbox `runtimeCaching` ile **NetworkFirst** stratejisi kullanılsın. Böylece repoya yeni soru eklediğimde internet varsa güncel hali gelir, yoksa son indirilen kullanılır.
- Service worker geliştirme modunda kapalı olabilir; PWA davranışı `bun run build && bun run preview` ile test edilsin.

## 9. Yayın: GitHub Actions (`.github/workflows/deploy.yml`)

`main` dalına her push'ta ve elle tetiklemede (`workflow_dispatch`) çalışsın:

1. `actions/checkout`
2. `oven-sh/setup-bun`
3. `bun install --frozen-lockfile`
4. `bun run check`
5. `bun test`
6. `bun run dogrula`
7. `BASE_PATH=/${{ github.event.repository.name }}/ bun run build`
8. `actions/upload-pages-artifact` (`dist` klasörü)
9. `actions/deploy-pages`

Gerekli `permissions` (`pages: write`, `id-token: write`, `contents: read`) ve `concurrency` ayarlarını ekle. Adımlardan biri başarısız olursa yayın yapılmasın; böylece hatalı bir deste push edilirse site bozulmaz, sadece Actions'ta hata görürüm.

## 10. Soru üreten ajan için belge

`SORU_FORMATI.md` dosyasını yaz. Bu dosyayı ben başka bir yapay zekaya vereceğim ve ondan soru üretmesini isteyeceğim. İçinde şunlar olsun:
- Formatın tam açıklaması ve her soru tipinden bir örnek.
- Şemanın ifade edemediği kurallar (bkz. bölüm 3).
- Kurallar: id'ler benzersiz ve sıralı (`q001`, `q002`...), çoktan seçmelide tek doğru şık, çeldiriciler makul ve benzer uzunlukta, "hepsi" / "hiçbiri" şıkları kullanılmasın, doğru şıkkın konumu dengeli dağılsın, boşlukta olası tüm doğru yazımlar `cevaplar`a eklensin, her soruda kısa bir `aciklama` olsun.
- Çıktının yalnızca geçerli JSON olması gerektiği (yorum, markdown kod bloğu yok).
- Mevcut bir desteye soru eklerken var olan id'lerin değiştirilmemesi, yeni id'lerin en sondan devam etmesi.
- Yeni desteyi `public/desteler/index.json`'a eklemeyi unutmaması ve push etmeden önce `bun run dogrula` çalıştırması.
- Hazır bir "soru üret" prompt şablonu, örneğin: *"Aşağıdaki ders notlarından, SORU_FORMATI.md'ye uygun, 15 çoktan seçmeli, 10 doğru/yanlış, 10 boşluk doldurma sorusu içeren bir deste üret: ..."*

## 11. Testler (`bun test`)

En azından şunlar test edilsin:
- **Normalleştirme ve cevap kontrolü:** "İstanbul" / "istanbul" / "ISTANBUL" / "Istanbul" eşitliği; tolerans açıkken "sogan" = "soğan", kapalıyken değil; sondaki noktalama; çok boşluklu sorularda boşluk bazında sonuç.
- **Leitner:** kutu geçişleri, tekrar zamanları, "tekrar zamanı gelenler" sıralaması (sabit zamanla).
- **Doğrulama:** her soru tipi için geçerli ve hatalı örnekler, tekrarlanan id, boşluk sayısı uyuşmazlığı, sınır dışı `dogru` indeksi; şema–kod tutarlılık testi (bölüm 3).
- **Yedek:** dışa aktar → içe aktar gidiş-dönüşü, birleştirmede yeni kaydın kazanması, bozuk yedek dosyasının reddedilmesi.
- **Oturum:** mod filtreleri ve soru sayısı sınırı.

## 12. Fazlar

**Faz 1 – İskelet ve çoktan seçmeli**
Bun + Vite + TypeScript kurulumu, `tsconfig`, scriptler, hash yönlendirme, ana sayfa, deste yükleme ve doğrulama, çoktan seçmeli soru akışı, sonuç ekranı. `ornek.json` en az 10 çoktan seçmeli soru içersin. Doğrulama testleri ve `dogrula` scripti.
*Kabul:* `bun run dev` ile açıldığında bir deste baştan sona çözülebiliyor. Hatalı bir soru eklenince uygulama çökmüyor ve uyarı gösteriyor. `bun run check`, `bun test` ve `bun run dogrula` temiz geçiyor.

**Faz 2 – Diğer soru tipleri**
Doğru/yanlış ve çok boşluklu boşluk doldurma, normalleştirme ve Türkçe karakter toleransı, "Aslında doğruydu" butonu. Örnek desteye her tipten en az 10 soru ekle (en az 2'si çok boşluklu olsun). Cevap kontrolü testleri.
*Kabul:* Bölüm 11'deki normalleştirme testleri geçiyor; telefonda boşluk doldururken klavye soruyu kapatmıyor.

**Faz 3 – İlerleme ve Leitner**
IndexedDB, kutular, tekrar zamanları, oturum modları, ana sayfadaki ilerleme çubukları ve "Bugün tekrar edilecek" sayısı. Leitner ve oturum testleri.
*Kabul:* Sayfa yenilenince ilerleme korunuyor. "Sadece yanlışlarım" modu doğru soruları getiriyor.

**Faz 4 – PWA ve çevrimdışı**
`vite-plugin-pwa` yapılandırması, manifest, ikonlar, güncelleme bildirimi, desteler için NetworkFirst.
*Kabul:* `bun run build && bun run preview` ile açıldığında Chrome DevTools > Application'da manifest ve service worker sorunsuz; uygulama kurulabiliyor. İnternet kapalıyken uygulama açılıyor ve daha önce açılmış desteler çözülebiliyor.

**Faz 5 – Ayarlar, yedekleme, yayın**
Ayarlar ekranı, dışa/içe aktarma, tema ve yazı boyutu, yedek testleri, `sema/deste.schema.json` son hali, `SORU_FORMATI.md`, GitHub Actions iş akışı, `README.md`.
README'de: Bun kurulumu, yerelde çalıştırma, GitHub Pages'i açma (Settings > Pages > Source: **GitHub Actions**), yeni deste ekleme, telefonda ve iPad'de ana ekrana ekleme.
*Kabul:* Dışa aktarılan yedek başka bir tarayıcıya içe aktarılınca ilerleme aynen geliyor. `BASE_PATH=/deneme/ bun run build && bun run preview` ile alt dizinde desteler ve service worker doğru çalışıyor.

## 13. Genel kalite kontrolü (her faz sonunda)

- `bun run check`, `bun test`, `bun run dogrula` hatasız geçmeli.
- 360 px, 768 px ve 1024 px genişlikte görünümü kontrol et. Taşma ve yatay kaydırma olmasın.
- Konsolda hata olmasın.
- Klavye ile de kullanılabilsin (Tab, Enter). Butonlarda erişilebilir etiketler olsun, renk tek başına anlam taşımasın (doğru/yanlışta simge de olsun).
- Escape edilmemiş deste içeriği `innerHTML`'e yazılmasın.
