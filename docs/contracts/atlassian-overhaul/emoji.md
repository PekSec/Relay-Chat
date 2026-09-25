# Atlassian emoji kontratı

**Durum: araştırma ve uygulama 04 adımında; bu teslimatta emoji seti değiştirilmiş değildir.** Resmî paket başlangıç noktası: [Atlassian Emoji](https://atlaskit.atlassian.com/packages/elements/emoji). Bileşeni kurmak görsel veri kaynağının edinildiği veya kullanım hakkının doğrulandığı anlamına gelmez.

## Mevcut kapsam

Composer'da 12 Unicode hızlı seçenek; Message içinde altı Unicode tepki (`👍`, `❤️`, `😂`, `😮`, `😢`, `🙏`); kullanıcı mesaj gövdeleri serbest metindir. Backend aynı altı tepkiyi kabul eder. Geçiş picker, tepki satırı, mevcut mesaj gövdeleri ve kalan dekoratif UI emojilerini birlikte kapsar; mesaj/tepki wire değerleri Unicode kalır.

Metin düzeltmesinde MessageContainer karşılama `👋` emojisi kaldırıldı. 02'de Login `👁️`/`🙈` düğmeleri işlevsel Atlaskit ikonlarına, App oturum kartındaki `💬` mevcut Relay logosuna dönüştürüldü. Bu değişiklikler emoji seti entegrasyonu değildir; veri kaynağı/lisans araştırmasının sırası hâlâ 04'tür.

## Gerçek veri kaynağı ve kullanım koşulları

1. 04'e başlarken `@atlaskit/emoji` hedef sürümünün package metadata, LICENSE, peerDependencies, gerçek export ve provider tiplerini indirip incele. React 19 uyumu ve lazy picker maliyetini doğrula. Bu incelemede resmî web paket sayfası erişilebilir ancak içerik açıklaması alınamadı; Bitbucket kaynak/LICENSE erişimi başarısızdı. **Lisans ve kullanılabilir emoji asset feed'i henüz doğrulanmadı.**
2. Paketin resmî provider sözleşmesinden emoji ID/shortName/Unicode ve sprite/image metadata formatını çıkar. Atlassian tarafından izin verilen dağıtım kaynağı ve asset lisansını dosya/URL/sürüm ile burada kaydet. Paket kod lisansını sprite lisansının yerine koyma. Jira/Confluence tenant'ından alınmış özel feed, auth token veya undocumented demo CDN endpoint'i üretim kaynağı yapılmaz.
3. Kullanım izni doğrulanan asset'leri lisans/attribution dosyalarıyla sürümlü yerel statik dosya olarak sun; provider için aynı origin metadata kullan. Geliştirme test mock'u üretim kaynağı değildir. Resmî setin dağıtım izni veya servis erişimi alınamazsa somut engeli kullanıcıya bildir ve veri kaynağı için karar iste; başka markanın setini sessizce Atlassian adıyla koyma.
4. İzinli kaynak elde edildiğinde Emoji renderer ve picker aynı provider'ı kullanır. Picker gerektiğinde yüklenir; kullanıcıya özel emoji upload/tenant servisi eklenmez.

## Gösterim ve hata davranışı

Unicode metin kalıcı gerçek veridir; desteklenen grapheme dizileri (ZWJ, variation selector, skin tone dahil) renderer öğelerine dönüşür. Mesajı `innerHTML` ile çözümleme. Desteklenmeyen veya yüklenemeyen emoji özgün Unicode ve erişilebilir adıyla görünür; metin kaybolmaz. Asset hatasında gönderme/okuma devam eder; picker yeniden denemeyi sunar. Font tabanlı fallback geçişin tamamlandığı iddiası değildir.

Görüntüleyici Unicode metinle birleştirilebilir erişilebilir ad taşır; copy/paste orijinal mesajı üretir. Emoji ekleme imleç konumunu ve 2.000 karakter sınırını korur; surrogate/ZWJ dizisini ortadan kesmez. Backend altı tepki sözleşmesi genişletilmez; picker'ın mesaj yazma seçenekleri ile reaction seçenekleri karıştırılmaz.

Kabul: tüm altı tepki, kalan dekoratif emojiler, eski/yeni mesaj gövdeleri; ZWJ ve skin tone; klavye seçimi/focus dönüşü; mobil popup; asset 404/offline; uzun mesaj sınırı ve metin kopyalama. Lisans/kaynak kanıtı, bundle farkı ve browser test sonuçları eklenmeden “Atlassian emoji tamamlandı” yazılmaz.
