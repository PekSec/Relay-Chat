# 02 — Giriş ve oturum durumları

**Durum: onay bekliyor.** 01 kabulü tamamlanmadan başlanmaz.

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | Ortalanmış tek form, üstte Relay adı, altta kayıt bağlantısı | **Öneri; onay değil** |
| B | Masaüstü marka alanı + form; mobil tek sütun | Daha güçlü marka alanı, daha fazla içerik |
| C | Sade tam sayfa form, kart çerçevesi yok | En düşük görsel yoğunluk |

Soru aracında A/B/C sun, seçimi/tarihi kaydet. Atlaskit Form/Textfield/Button/SectionMessage/Spinner; erişilebilir input label, password autocomplete ve hata özeti. Oturum kontrolü sürerken giriş formunun yanlışlıkla görünmesi önlenir; 401 ile ağ hatası aynı durum sayılmaz.

Mevcut akış: App başlangıç `GET /api/auth/me`; Login `POST /api/auth/login`; HttpOnly cookie otorite. `useAuth` hesap değişiminde store/socket temizliği; `apiFetch` oturum hatası işleme. Başarılı login sunucu tercihlerini yükler; misafir tema tercihleri kullanıcıya kaydedilmez. Logout mevcut `POST /api/auth/logout` sözleşmesini korur. Yeni auth sağlayıcısı/refresh protokolü eklenmez.

Uygulama: mevcut Login ve oturum başlangıcını uçtan uca oku; seçilen düzeni uygula; legacy alan/button CSS'sini yalnız kullanımı bittiyse kaldır. İlgili yükleniyor/yeniden dene/yanlış şifre akışlarını aynı adımda tamamla. Auth payload'ında gereksiz alan veya hata görülürse ortak serializer/middleware'de düzelt.

Kabul: doğru/yanlış giriş, boş alanlar, çift submit, API 500/offline, oturum kontrolü 401, yeniden yükleme, expired session, logout, ikinci hesapta önceki tema/veri sızıntısı, mobil/klavye. Build/lint + smoke/security/UI'nin ilgili adımları. Kanıt ve seçilmiş düzen kaydedildikten sonra 03'e geç.
