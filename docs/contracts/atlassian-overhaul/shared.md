# Ortak tasarım ve tercih kontratı

## Kullanıcıya gösterilen metinler

- Metin kısa, somut ve işleve yönelik olmalı. Slogan, pazarlama dili, yapay samimiyet, kullanıcıyı pohpohlama ve gereksiz motivasyon cümleleri kullanılmaz. Bilgi katmayan yardımcı metin silinir; başlıklar bölümün veya işlemin adını söyler.
- Atlassian, Atlaskit, ADS veya kullanılan tema/tasarım sistemi kullanıcıya tanıtılmaz. Kütüphane, token ve uygulama altyapısı bilgileri ürün metnine taşınmaz. Renk grupları “Temel renkler” ve “Ek renkler” olarak adlandırılır.
- Kurallar tüm sayfa ve modallara, boş/yükleme/hata durumlarına, önizleme örneklerine, tooltip, placeholder, erişilebilirlik adları ve sayfa metadata'sına uygulanır. Teknik importlar, kod yorumları ve geliştirici dokümanları bu kısıtın dışındadır.
- Her modülün kabul kontrolünde görünen metin ve erişilebilirlik adları bu kurallara göre gözden geçirilir; önceki uygulamalar da kapsam içindedir.

## Bileşen ve veri yaklaşımı

React, Zustand, Express ve MongoDB korunur. Önce mevcut endpoint, store ve tüm çağıranlar okunur. Atlaskit karşılığı varsa kullanılır; tek kullanımlı sarmalayıcı/factory kurulmaz. CSS yalnız ürün düzeni, responsive davranış ve token bağlantısı içindir.

| İhtiyaç | Öncelikli paket |
|---|---|
| Buton / ikon butonu | `@atlaskit/button/default/button` / `@atlaskit/button/icon/button` |
| Modal | `@atlaskit/modal-dialog` |
| Form alanı / açıklama / hata | `@atlaskit/form`, `@atlaskit/textfield`, `@atlaskit/textarea` |
| Seçim / aç-kapat | `@atlaskit/select`, `@atlaskit/toggle` |
| Tekli seçenek grubu | `@atlaskit/radio` (`RadioGroup`; 03'te kullanıldı) |
| Avatar / tooltip / popup | `@atlaskit/avatar`, `@atlaskit/tooltip`, `@atlaskit/popup` |
| Sekme / durum / yükleme | `@atlaskit/tabs`, `@atlaskit/section-message`, `@atlaskit/spinner` |
| Emoji / ikon / tema | Emoji kontratı, ikon kontratı, `@atlaskit/tokens` |

Paketler kullanılacakları adımda eklenir; React 19 peer aralığı ve portal/focus davranışı kurulu sürümden doğrulanır. Kurulu button paketinde `/new` hâlâ çalışır ancak deprecated olarak işaretlidir; yeniden ele alınan modülde yukarıdaki doğrudan giriş noktaları tercih edilir. Atlaskit bileşeni kullanmak tek başına göçü tamamlamaz: klavye, mobil, yükleme/hata/boş durumları da kapsanır.

04a'da yıkıcı eylem modalı aynı bileşenleri kullanır: ilk odak iptalde, işlem sürerken tekrar gönderme/kapatma engelli, hata içeride ve hedef sabit. Ekran/hesap değişimi isteği iptal eder. Odak dönüşünde silinen tetikleyici yerine kalan mesaj veya composer kullanılır. Danger/hata renkleri accent seçimine çevrilmez. Bu kurallar sonraki onaylı modallarda yeniden doğrulanır; yeni ortak modal sarmalayıcısı kurulmaz.

04b bu kuralları kişi adı/avatarı olan modalda doğrular; işlem yalnız kendi hesaptan geçmiş gizleme olarak açıklanır. Temizleme sonrası boş durumdaki slogan kaldırıldı. HTTP/socket'te paylaşılan temizleme sınırı geç yanıtları filtreler; diğer kişinin verisi veya daha yeni mesajlar başarı temizliğine dahil edilmez.

04c iki yerde kullanılan tek emoji panelini paylaşır: masaüstü Popup, mobil Modal; geçici 13 Unicode seçenek ve altı tepki. Kaynak yaklaşımı kullanıcı tarafından onaylıdır. Klavye dolaşımı, kısa Türkçe hata, grapheme güvenli imlece ekleme ve focus dönüşü doğrulandı. Tepki rozetleri seçili durum/sayı adı taşır; HTTP ve socket aynı sürümlü state güncellemesini kullanır. Ürün metninde altyapı adı yoktur.

## Tercih API'si

`PATCH /api/auth/preferences` oturum cookie'si ile çalışır. Düz, kısmi bir tercih nesnesi alır; `{ preferences: <tam normalize edilmiş tercihler> }` döndürür. Kimlik body'den alınmaz. Enum/boolean tipleri sunucuda doğrulanır; bilinmeyen alanlar ve geçersiz değerler reddedilir. Mevcut auth user yanıtlarına `preferences` eklenir; endpointlerin mevcut dış zarfı korunur.

| Alan | Değerler | Varsayılan |
|---|---|---|
| `theme` | `system`, `light`, `dark` | `system` |
| `accent` | `blue`, `lime`, `red`, `orange`, `yellow`, `green`, `teal`, `purple`, `magenta`, `gray`, `relay-bosphorus`, `relay-iris`, `relay-pine`, `relay-copper` | `blue` |
| `density` | `comfortable`, `compact` | `comfortable` |
| `fontSize` | `standard`, `large` | `standard` |
| `sendKey` | `enter`, `mod-enter` | `enter` |
| `chatSound` | boolean | `true` |
| `notificationSound` | boolean | `true` |
| `messagePreviews` | boolean | `true` |

Eksik eski tercihler okumada varsayılan alır; toplu migrasyon yok. Profil güncellemesi tercihleri kaybetmez. Logout/hesap değişimi hesap tercihlerinin diğer kullanıcıya taşınmasını engeller. Misafir tema seçimi ayrı cihaz tercihi olarak kalır. Diğer cihazdaki değişiklik sonraki oturum yüklemesinde alınır; yeni Socket.IO tercih senkronizasyonu kurulmaz.

## Accent ve erişilebilirlik

Seçenekler resmî paletin dokuz kromatik ailesi ve griyi kapsar; tonlar ayrı kullanıcı seçenekleri değildir. Her aile tema ve etkileşim için uygun tonlara eşlenir. Kaynak: [Atlassian renk paleti](https://atlassian.design/foundations/color/color-palette).

| Relay seçeneği | Başlangıç rengi |
|---|---|
| Boğaz / `relay-bosphorus` | `#167D9A` |
| İris / `relay-iris` | `#6654C0` |
| Çam / `relay-pine` | `#287A60` |
| Bakır / `relay-copper` | `#A65E3B` |

Renkler Relay önerisidir, Atlassian markasına ait renkler olarak sunulmaz. Açık/koyu temada buton normal/hover/pressed, üst yazı, link, focus ve seçili alanlar için statik ton eşlemeleri kullanılır. Accent `html` kökünde uygulanır; `body` portalı aynı değerleri devralır. Atlaskit'in brand-bold background, selected background/text/border, link ve focused border token'ları mevcut `--accent*` değişkenleriyle aynı palete bağlanır. Hata/uyarı/başarı token'ları kişiselleştirilmez.

Normal metinde 4.5:1, büyük metinde ve gerekli arayüz/focus ayrımında 3:1 hedefi gerçek komşu yüzeylere karşı ölçülür. Sarı/lime dahil her seçenek hem açık hem koyu temada test edilir; swatch rengi doğrudan beyaz buton yazısı zemini kabul edilmez. Renk adı ve seçili işareti birlikte verilir. OS `prefers-reduced-motion` desteği korunur.

### İlk adımın ölçüm kanıtı

`test-results/settings-contrast.json` içindeki 28 gerçek tarayıcı eşleşmesinin rol bazında minimumları aşağıdadır; üç ondalığa yuvarlanmıştır. Ayarlar UI testi 106 kontrolle geçti. Bunlar test edilen ayarlar yüzeyleri için kanıttır; henüz yeniden tasarlanmamış ekranlara erişilebilirlik sertifikası değildir.

| Metin rolü | En düşük oran | Tema / accent |
|---|---|---|
| Normal buton | 4,506:1 | Açık / turuncu |
| Hover buton | 5,933:1 | Açık / sarı |
| Pressed buton | 7,958:1 | Açık / Boğaz |
| Link | 5,586:1 | Açık / sarı |
| Seçili alan | 5,467:1 | Açık / sarı |

Focus için her eşleşmede en az 2 px görünür outline ve komşu yüzeye karşı en az 3:1 ayrı assertion ile doğrulandı; focus oranlarının sayısal minimumu JSON'a kaydedilmiyor. Test ve masaüstü/mobil ekran bağlantıları [01 kaydındadır](./01-settings.md).

## Backend inceleme sınırı

02'de oturum doğrulama ayrımı sabitlendi: geçersiz/süresi dolmuş oturum HTTP 401, doğrulamayı engelleyen DB hatası HTTP 503 döner. Socket handshake aynı durumları `UNAUTHORIZED` / `SESSION_UNAVAILABLE` kodlarıyla ayırır. İstemci altyapı hatasını logout olarak yorumlamaz; doğrulanamayan socket olayı işlenmez. Sonraki modüller bu ayrımı korur.

Başlangıçta mesaj geçmişinde 50 öğelik cursor pagination vardır. Sohbet listesinde aggregation ile son görünür mesaj lookup'ı vardır; bunu “N+1 zaten çözülmüş” diye incelemeden atlama. İlgili modülde sorgu sayısı, payload ve indeks kullanımını ölç. Sırf olası büyüme için yeni cache, endpoint ya da pagination protokolü ekleme. Doğrulanmış sorun için en küçük ortak düzeltmeyi ve onu bozan tek gerekli testi ekle.
