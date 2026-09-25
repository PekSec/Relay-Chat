# Atlassian emoji kontratı

**Durum: 04c B + geçici Unicode onaylandı ve uygulandı; resmî görsel set entegrasyonu açık.** Resmî paket başlangıç noktası: [Atlassian Emoji](https://atlaskit.atlassian.com/packages/elements/emoji). Bileşeni kurmak görsel veri kaynağının edinildiği veya kullanım hakkının doğrulandığı anlamına gelmez.

04a silme önizlemesi orijinal Unicode'u React metni olarak gösterir. İlk 240 grapheme `Intl.Segmenter` ile kesilir; 241 adet ten rengi + ZWJ dizisiyle masaüstü/mobil test geçti. Bu fallback resmî emoji renderer entegrasyonu değildir; 04c'de aynı önizleme de ortak renderer kapsamında yeniden değerlendirilir.

04b geçmiş temizleme modalı emoji kullanmaz; kişi avatarı ve işlevsel silme ikonu içerir. Bu adımda sağlayıcı/asset entegrasyonu yapılmadı; 04c kapsamı korunur.

## Mevcut kapsam

Başlangıçtaki 12 composer seçeneği ile altı tepkinin birleşimi geçici 13 seçenekli katalog oldu. Tepkiler (`👍`, `❤️`, `😂`, `😮`, `😢`, `🙏`) değişmedi; kullanıcı mesaj gövdeleri serbest metindir. İki seçici tek paneli ve ad sözlüğünü paylaşır. Mesajlar/önizlemeler React metni olarak özgün Unicode'u korur; font tabanlı çıktı için ek renderer kurulmadı. Mesaj boş durumundaki işlevsiz 🔍/👋 dekorasyonu kaldırıldı.

Metin düzeltmesinde MessageContainer karşılama `👋` emojisi kaldırıldı. 02'de Login `👁️`/`🙈` düğmeleri işlevsel Atlaskit ikonlarına, App oturum kartındaki `💬` mevcut Relay logosuna dönüştürüldü. Bu değişiklikler emoji seti entegrasyonu değildir; veri kaynağı/lisans araştırmasının sırası hâlâ 04'tür.

## Gerçek veri kaynağı ve kullanım koşulları

### 04c araştırması — 25 Eylül 2026

Ürün bağımlılıkları değiştirilmeden resmî npm tarball'ı incelendi. Kaynak:
[`@atlaskit/emoji@72.4.23`](https://registry.npmjs.org/@atlaskit/emoji/72.4.23),
[sürüm tarball'ı](https://registry.npmjs.org/@atlaskit/emoji/-/emoji-72.4.23.tgz).
`npm view @atlaskit/emoji dist-tags` bu incelemede `latest=72.4.23`, `next=67.4.4` döndürdü.

| Kontrol | Doğrulanan sonuç |
|---|---|
| Kod lisansı | Tarball `LICENSE`: Apache-2.0, Copyright 2019 Atlassian Pty Ltd |
| React peer aralığı | `react` ve `react-dom`: `^18.2.0`; uygulama React 19 kullanıyor. React 19 desteği bu metadata ile doğrulanmıyor |
| Ek peer | `react-intl`: `^5.25.1 || ^6.0.0 || ^7.0.0` |
| Public girişler | `emoji-picker`, `emoji-resource`, `emoji`, `resourced-emoji`; kök export'larda EmojiPicker, EmojiResource, EmojiRepository mevcut |
| Sağlayıcı | `EmojiResourceConfig.providers: ServiceConfig[]`; görseller paketle gelen hazır bir set değil, ayrı kaynak gerektiriyor |
| Veri biçimi | `{ emojis: EmojiServiceDescriptionWithVariations[], meta? }`; öğelerde id, shortName, fallback, category, type, searchable, representation; opsiyonel skinVariations/keywords |
| Görsel biçimi | imagePath + width/height veya spriteRef + koordinatlar; `meta.spriteSheets` içinde URL ve sprite ölçüleri |
| Yerel Unicode gösterimi | `EmojiRepresentation` içinde `UnicodeRepresentation { unicodeEmoji }` var; bunun kullanılması resmî görsel set entegrasyonu anlamına gelmez |
| Paket içi asset | İncelenen tarball'da png/svg/gif/jpg/webp emoji seti bulunmadı |
| Tarball SHA-256 | `F572BD9B6C81A28D91EDF634F1DF6E2B128E6E000FA155CD11EAF0A20BC038EE` |

[Resmî Teamoji yazısı](https://www.atlassian.com/blog/how-we-build/meet-teamoji-atlassians-custom-emoji-system-built-for-the-future-of-work)
görsel sistemi tanıtıyor; bu incelemede Relay için indirilebilir set ve yeniden dağıtım izni doğrulanamadı.
[ADS lisansı](https://atlassian.design/license/) §1 kapsamı Atlassian ürünleriyle çalışan eklenti/entegrasyonlarla ilişkilendiriyor;
§8 açık kaynak kod için farklı hakların bulunabileceğini belirtiyor. Bu nedenle npm paketinin Apache lisansı,
ayrı Teamoji görsellerinin Relay'de dağıtımı için kanıt sayılmadı. Bu kayıt “kullanım kesin yasak” hükmü değildir;
gerekli asset kaynağı/izin kanıtının elde edilmediğini kaydeder. Bitbucket README/örnek bağlantıları araştırma aracından erişilemedi.

**Onay:** soru aracında önerilen B (masaüstü Popup / mobil Modal) ve geçici Unicode yaklaşımı,
kullanıcının “tamam o zaman öyle yapalım” yanıtıyla kabul edildi. 26 Eylül'de uygulandı.
Resmî görsel set yerine başka markanın seti kurulmadı. React sürümü düşürülmedi,
peer kontrolü aşılmadı. `@atlaskit/emoji` kurulmadı; Popup 6.3.10 React 18/19 peer desteğiyle eklendi.
Araştırma çıktıları yerel, ignore edilen `test-results/emoji-research/` içindedir; runtime asset değildir.

Geçici uygulamanın 50 masaüstü/mobil kontrolü ve backend/store/Unicode regresyonları geçti; ayrıntı [04c kaydında](./04-dialogs.md#uygulama-ve-kanıt--26-eylül-2026). Harici emoji asset isteği yoktur; asset 404/fallback kabulü resmî kaynak entegrasyonunda yapılacaktır. Geçici panel lazy yüklenir; bu tam katalog değildir.

### Kaynak kabul adımları

1. Hedef sürüm metadata, LICENSE, peerDependencies, gerçek export ve provider tiplerini doğrula. 04c'de 72.4.23 kod lisansı ve provider API'si incelendi; kanıt yukarıdadır. **React 19 desteği, görsel asset kaynağı/lisansı ve gerçek lazy picker bundle maliyeti henüz doğrulanmadı.**
2. Paketin resmî provider sözleşmesinden emoji ID/shortName/Unicode ve sprite/image metadata formatını çıkar. Atlassian tarafından izin verilen dağıtım kaynağı ve asset lisansını dosya/URL/sürüm ile burada kaydet. Paket kod lisansını sprite lisansının yerine koyma. Jira/Confluence tenant'ından alınmış özel feed, auth token veya undocumented demo CDN endpoint'i üretim kaynağı yapılmaz.
3. Kullanım izni doğrulanan asset'leri lisans/attribution dosyalarıyla sürümlü yerel statik dosya olarak sun; provider için aynı origin metadata kullan. Geliştirme test mock'u üretim kaynağı değildir. Resmî setin dağıtım izni veya servis erişimi alınamazsa somut engeli kullanıcıya bildir ve veri kaynağı için karar iste; başka markanın setini sessizce Atlassian adıyla koyma.
4. İzinli kaynak elde edildiğinde Emoji renderer ve picker aynı provider'ı kullanır. Picker gerektiğinde yüklenir; kullanıcıya özel emoji upload/tenant servisi eklenmez.

## Gösterim ve hata davranışı

Unicode metin kalıcı gerçek veridir; desteklenen grapheme dizileri (ZWJ, variation selector, skin tone dahil) renderer öğelerine dönüşür. Mesajı `innerHTML` ile çözümleme. Desteklenmeyen veya yüklenemeyen emoji özgün Unicode ve erişilebilir adıyla görünür; metin kaybolmaz. Asset hatasında gönderme/okuma devam eder; picker yeniden denemeyi sunar. Font tabanlı fallback geçişin tamamlandığı iddiası değildir.

Görüntüleyici Unicode metinle birleştirilebilir erişilebilir ad taşır; copy/paste orijinal mesajı üretir. Emoji ekleme imleç konumunu ve 2.000 karakter sınırını korur; surrogate/ZWJ dizisini ortadan kesmez. Backend altı tepki sözleşmesi genişletilmez; picker'ın mesaj yazma seçenekleri ile reaction seçenekleri karıştırılmaz.

Kabul: tüm altı tepki, kalan dekoratif emojiler, eski/yeni mesaj gövdeleri; ZWJ ve skin tone; klavye seçimi/focus dönüşü; mobil popup; asset 404/offline; uzun mesaj sınırı ve metin kopyalama. Lisans/kaynak kanıtı, bundle farkı ve browser test sonuçları eklenmeden “Atlassian emoji tamamlandı” yazılmaz.
