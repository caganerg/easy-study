# Ders Çalış

Telefon ve tablet için, internetsiz de çalışabilen ders çalışma uygulaması (PWA). Sorular repodaki JSON dosyalarında durur; ilerleme yalnızca cihazınızda (IndexedDB) saklanır, hiçbir veri dışarı gönderilmez.

- Soru tipleri: çoktan seçmeli, doğru/yanlış, (çok boşluklu) boşluk doldurma
- Leitner kutu sistemiyle tekrar planlama (“Bugün tekrar edilecek”)
- Oturum modları: karışık, sadece yanlışlarım, tekrar zamanı gelenler
- Açık/koyu tema, büyük yazı, ilerlemeyi dışa/içe aktarma

Teknik: TypeScript (strict) + Vite + `vite-plugin-pwa`, UI framework yok, paket yöneticisi ve test aracı **Bun**.

## Kurulum

[Bun](https://bun.sh) 1.4 veya üstü gerekir:

```sh
curl -fsSL https://bun.sh/install | bash   # macOS / Linux
# Windows (PowerShell): powershell -c "irm bun.sh/install.ps1 | iex"
```

Bağımlılıklar:

```sh
bun install
```

## Yerelde çalıştırma

| Komut | Ne yapar |
|---|---|
| `bun run dev` | Geliştirme sunucusu: http://localhost:5173 (service worker kapalı) |
| `bun run build` | `dist/` klasörüne derler |
| `bun run preview` | Derlenmiş sürümü sunar: http://localhost:4173 (service worker açık) |
| `bun run check` | TypeScript tip kontrolü |
| `bun test` | Testler |
| `bun run dogrula` | `public/desteler/` altındaki tüm desteleri doğrular |

Telefondan aynı ağdan denemek için: `bun run dev --host` ve telefonda bilgisayarın IP adresini açın.

PWA ve çevrimdışı davranışı yalnızca derlenmiş sürümde çalışır:

```sh
bun run build && bun run preview
```

GitHub Pages'teki gibi alt dizinde denemek için:

```sh
BASE_PATH=/deneme/ bun run build && BASE_PATH=/deneme/ bun run preview
# → http://localhost:4173/deneme/
```

## GitHub Pages'te yayınlama

1. Repoyu GitHub'a gönderin (`main` dalı).
2. GitHub'da **Settings → Pages → Build and deployment → Source: GitHub Actions** seçin.
3. `main`'e her push'ta (ya da **Actions → Yayınla → Run workflow** ile elle) iş akışı çalışır: kurulum → tip kontrolü → testler → deste doğrulama → derleme → yayın.
4. Site `https://<kullanici>.github.io/<repo-adi>/` adresinde yayınlanır.

Adımlardan biri (ör. hatalı bir deste) başarısız olursa yayın yapılmaz; site önceki haliyle çalışmaya devam eder, hatayı Actions sekmesinde görürsünüz.

## Yeni deste ekleme

1. Deste JSON dosyasını `public/desteler/` klasörüne koyun (ör. `misir-temel.json`).
2. `public/desteler/index.json` listesine ekleyin:

   ```json
   { "dosya": "misir-temel.json", "baslik": "Mısır – Temel Bilgiler", "ders": "Tarla Bitkileri" }
   ```

3. `bun run dogrula` ile kontrol edip push edin.

Kod değişikliği gerekmez. Format ayrıntıları ve yapay zekaya soru ürettirmek için hazır prompt: [`SORU_FORMATI.md`](SORU_FORMATI.md). JSON Şeması: [`sema/deste.schema.json`](sema/deste.schema.json).

Yeni sorular, internet varken uygulama açıldığında otomatik gelir (desteler önce ağdan, yoksa önbellekten yüklenir). Uygulamanın kendisi güncellendiğinde ekranın altında **“Güncelleme var – Yenile”** çıkar.

## Telefona / tablete kurma

**Android (Chrome):** Siteyi açın → sağ üstteki **⋮** menü → **Ana ekrana ekle** (ya da **Uygulamayı yükle**) → **Yükle**.

**iPhone / iPad (Safari):** Siteyi Safari'de açın → **Paylaş** düğmesi (□↑) → **Ana Ekrana Ekle** → **Ekle**. (iOS'ta yalnızca Safari ile kurulabilir.)

Kurduktan sonra uygulamayı bir kez internet varken açın; desteler önbelleğe alınır ve sonrasında internetsiz çalışır.

## Yedekleme

**Ayarlar → İlerlemeyi dışa aktar**, tüm ilerleme ve ayarları `ders-yedek-YYYY-AA-GG.json` olarak indirir. Başka bir cihazda **İçe aktar** ile yükleyip **Birleştir** (her soru için daha yeni kayıt kalır) ya da **Üzerine yaz** seçebilirsiniz.

> iOS'ta tarayıcı verileri uzun süre kullanılmayan sitelerde silinebilir; ara sıra yedek almanız önerilir.

## Proje yapısı

```
src/
  main.ts            başlatma, hash yönlendirme (#/, #/deste/<id>, #/oturum, #/sonuc, #/ayarlar)
  tipler.ts          Soru, Deste, Ayarlar tipleri
  dogrulama.ts       unknown → Deste (hatalı sorular atlanır)
  soru-tipleri/      her soru tipi: doğrulama + cevap kontrolü + çizim; kayit.ts tablosu
  cevap.ts           normalleştirme ve cevap kontrolü
  leitner.ts         kutu ve tekrar zamanı hesabı (saf)
  oturum.ts          oturum mantığı (saf)
  depo.ts            IndexedDB sarmalayıcı
  yedek.ts           dışa/içe aktarma (saf)
  metinler.ts        tüm Türkçe metinler
  ekranlar/          ekran modülleri
tests/               bun test + fixtures (geçerli / hatalı desteler)
scripts/             dogrula-desteler.ts
sema/                deste.schema.json
```

### Yeni soru tipi eklemek

1. `src/tipler.ts` içinde `Soru` ve `Cevap` birleşimlerine yeni tipi ekleyin.
2. `src/soru-tipleri/<tip>.ts` dosyasında `SoruTipiTanim` arayüzünü uygulayın (doğrulama, kontrol, çizim).
3. `bun run check` çalıştırın: derleyici, `kayit.ts` tablosu ve `switch` kullanılan her yer (`cevap.ts`, `ekranlar/soru.ts`) güncellenene kadar hata verir.
4. Şemayı (`sema/deste.schema.json`), `SORU_FORMATI.md`'yi ve `tests/fixtures/` örneklerini güncelleyin.
