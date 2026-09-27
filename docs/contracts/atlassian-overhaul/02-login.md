# 02 — Giriş ve oturum durumları

> Önceki ekran görüntüleri kullanıcı isteğiyle kaldırıldı. Aşağıdaki eski doğrulama kayıtları tarihseldir; güncel görseller [koyu masaüstü / açık mobil galerisindedir](../../screenshots/README.md).

**Durum: uygulandı ve doğrulandı.** 25 Eylül 2026 tarihinde kullanıcı soru aracında **A — Ortalanmış kart** seçti; ardından “Implement the plan.” ile uygulamayı onayladı.

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | Ortalanmış tek form, üstte Relay adı, altta kayıt bağlantısı | **Onaylandı ve uygulandı** |
| B | Masaüstü marka alanı + form; mobil tek sütun | Daha güçlü marka alanı, daha fazla içerik |
| C | Sade tam sayfa form, kart çerçevesi yok | En düşük görsel yoğunluk |

Soru aracında A/B/C sun, seçimi/tarihi kaydet. Atlaskit Form/Textfield/Button/SectionMessage/Spinner; erişilebilir input label, password autocomplete ve hata özeti. Oturum kontrolü sürerken giriş formunun yanlışlıkla görünmesi önlenir; 401 ile ağ hatası aynı durum sayılmaz.

Mevcut akış: App başlangıç `GET /api/auth/me`; Login `POST /api/auth/login`; HttpOnly cookie otorite. `useAuth` hesap değişiminde store/socket temizliği; `apiFetch` oturum hatası işleme. Başarılı login sunucu tercihlerini yükler; misafir tema tercihleri kullanıcıya kaydedilmez. Logout mevcut `POST /api/auth/logout` sözleşmesini korur. Yeni auth sağlayıcısı/refresh protokolü eklenmez.

Uygulama: mevcut Login ve oturum başlangıcını uçtan uca oku; seçilen düzeni uygula; legacy alan/button CSS'sini yalnız kullanımı bittiyse kaldır. İlgili yükleniyor/yeniden dene/yanlış şifre akışlarını aynı adımda tamamla. Auth payload'ında gereksiz alan veya hata görülürse ortak serializer/middleware'de düzelt.

Kabul: doğru/yanlış giriş, boş alanlar, çift submit, API 500/offline, oturum kontrolü 401, yeniden yükleme, expired session, logout, ikinci hesapta önceki tema/veri sızıntısı, mobil/klavye. Build/lint + smoke/security/UI'nin ilgili adımları. Kanıt ve seçilmiş düzen kaydedildikten sonra 03'e geç.

## Uygulama ve karar kaydı

- En fazla 400 px genişlikte kart; mobilde 16 px dış boşluk. Relay logo/adı, “Giriş yap”, kullanıcı adı/parola, göster/gizle, “Kayıt ol”. Slogan, tanıtım metni ve tema sağlayıcısı adı yok.
- Atlaskit Form/Field/ErrorMessage/Textfield/Button/IconButton/SectionMessage/Spinner kullanıldı. Boş alanlarda ilk hataya focus, parola autocomplete, Enter ile submit, istek boyunca kilit ve iptal edilen/geciken yanıt koruması var. API hataları kısa Türkçe metinle form içinde duyurulur; 429, yanlış bilgi, sunucu ve ağ hataları ayrıdır. Başarısızlıkta değerler korunur.
- Misafir tema seçicisi mevcut Select paketine taşındı; kayıt ekranı aynı seçiciyi kullanır. Seçici lazy yüklenir; oturum açmış kullanıcı başlangıçta bunun Select bağımlılığını indirmez. Kayıt ekranı yeniden tasarlanmadı.
- Parola emoji düğmeleri resmî `eye-open` / `eye-open-strikethrough` ikonlarına taşındı. Oturum durumundaki emoji logo ile değişti. Artık kullanılmayan `.brand-badge`, `.field-action` ve native tema select CSS'si kaldırıldı. Diğer ekranların kullandığı `.field`/`.primary-button` korundu.
- Oturum kontrolü sırasında form gösterilmez; 401 misafir durumuna geçer, sunucu/ağ hatası yeniden deneme sunar. Sunucu hatasının bağlantı hatası olarak gösterilmesi düzeltildi.

## Backend düzeltmesi

`verifySession` içindeki DB hatası eskiden geçersiz oturum gibi HTTP 401 dönüyordu. Hata enjeksiyonlu regresyon **401 ≠ 503** ile başarısız oldu. Ortak doğrulama şimdi altyapı hatasını `SESSION_UNAVAILABLE` ile ayırıyor: HTTP 503, socket handshake aynı kod; geçersiz oturum HTTP 401 / socket `UNAUTHORIZED`. Doğrulanamayan socket paketi işlenmez ve bağlantı kapatılır. İstemci yalnız gerçek 401'de hesabı temizler.

Login sorgusu parola, token ve mevcut public kullanıcı yanıtı için gereken alanlara sınırlandı; arkadaş dizisi yüklenmez. Endpoint, başarılı yanıt zarfı, cookie ve tercih şeması değişmedi; migrasyon yok.

## Doğrulama

- `npm run test:login`: **48 kontrol**; masaüstü/mobil, bekleyen kontrol/401/503/offline/yeniden deneme, boş alan/focus, yanlış parola, 429/500, çift submit, Enter, parola görünürlüğü, açık/koyu tema, kayıt bağlantısı, reload, gerçek iki sekmede çıkış ve ikinci hesap, hesap tercihleri ve tarayıcı hataları.
- `npm run test:session-errors`: geçersiz/eksik oturum, DB hatası, silinmiş/geçerli kullanıcı; socket kimlik/servis hata ayrımı ve doğrulanmamış paketin reddi geçti. Mongo olmadan çalışır; yalnız DB sınırı hata enjeksiyonuyla değiştirilir, gerçek middleware/socket kullanılır.
- Smoke **41**, security **37**, realtime **8**, mevcut UI **56**, ayarlar UI **106** geçti. Disposable MongoDB 7 ve production Chromium kullanıldı. Yeni testler npm scriptlerine ve CI'a bağlandı.
- Masaüstü, mobil; hata durumları açık / koyu. Görseller gerçek test çıktılarıdır.
- Emoji sağlayıcısı/asset lisansı çalışması **04'te**; Lucide gereksinimi çıkmadı. Sonraki adım **03-kayıt için ayrı tasarım seçimi**; mevcut onay 03'ü kapsamaz.
