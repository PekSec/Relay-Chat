# 03 — Kayıt

> Önceki ekran görüntüleri kullanıcı isteğiyle kaldırıldı. Aşağıdaki eski doğrulama kayıtları tarihseldir; güncel görseller [koyu masaüstü / açık mobil galerisindedir](../../screenshots/README.md).

**Durum: uygulandı ve doğrulandı.** Kullanıcı 25 Eylül 2026'da soru aracında **A — Tek sütun kart** seçti ve ardından “Implement the plan.” ile uygulamayı onayladı.

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | Tek sütun tek form; alanlar doğal okuma sırasında | **Onaylandı ve uygulandı** |
| B | Aynı sayfada profil/hesap alanlarını görsel gruplama | Uzun formu taramayı kolaylaştırır |
| C | İki adımlı profil → hesap | Ek adım/state maliyeti; kullanıcı seçerse uygulanır |

Başlangıç SignUp/GenderCheckBox ve signup hook'u `POST /api/auth/signup` kullanıyordu. Ad, kullanıcı adı, şifre/tekrar ve gender validasyonları controller ile karşılaştırıldı. Şifre en az 8 karakter/en çok 72 UTF-8 bayt; mevcut frontend/backend uzunluk hesapları korundu. Yeni hesap shared varsayılan tercihleri alır. Gender zorunlu `male`/`female` olarak korundu.

Atlaskit Form/Textfield/Button ve seçime uygun kontrol kullan; label, error association, autocomplete ve ilk hataya focus sağla. Kayıt sırasında input korunur; başarısız submit yeniden denenir. Başarılı kayıt mevcut cookie/redirect/store akışıyla tamamlanır. Sadece bu modülün geçersiz CSS/ikon/alan sarmalayıcısı temizlenir; eski bileşen çağıranları kontrol edilir.

Kabul: minimum/maksimum uzunluk, çok baytlı şifre, uyuşmayan tekrar, kullanılan username, ağ hatası/çift submit, keyboard/mobile, varsayılan tercihler, login'e bağlantı ve başarılı redirect. Mevcut smoke/security/UI senaryolarıyla doğrula. Onay, test kanıtı ve sınırlamalar yazıldıktan sonra 04'e geç.

## Uygulama kaydı

- Girişteki `auth-card`, logo, tema seçicisi ve alt bağlantı düzeni kullanıldı. Alan sırası ad soyad → kullanıcı adı → parola → parola tekrar → cinsiyet; başlık “Hesap oluştur”, eylemler “Kayıt ol” / “Giriş yap”. Slogan ve sağlayıcı adı yok.
- Atlaskit Form/Field/Textfield/ErrorMessage/HelperMessage, Button/IconButton, SectionMessage/Spinner ve RadioGroup kullanıldı. Tek yeni bağımlılık `@atlaskit/radio@10.2.4`; peer aralığı React 18.2/19'u destekliyor. Her iki parola alanında mevcut `eye-open` / `eye-open-strikethrough` ikonları var.
- Ad soyad trim sonrası 1–50; kullanıcı adı 3–20 ASCII harf/rakam/alt çizgi; mevcut parola yardımcısı, tekrar eşleşmesi ve cinsiyet doğrulanır. Parola değiştiğinde tekrar alanı yeniden doğrulanır. İlk geçersiz alana/radio'ya ve kullanılan kullanıcı adına focus döner; hata bağlantıları bileşenler tarafından sağlanır.
- Signup hook'u eşzamanlı isteği kilitler, unmount'ta iptal eder ve `apiFetch` hesap sürümü korumasını kullanır. 400 kullanıcı adı çakışması alan hatasıdır; 429, sunucu, ağ ve hesap oluşturulup oturum açılamaması durumları form içinde Türkçe gösterilir. HTML gibi hatalı upstream yanıtları kullanıcıya yansıtılmaz. Başarısızlıkta değerler korunur.
- Başarı mevcut cookie/store/sekme bildirimi/yönlendirme akışını ve hesap varsayılanlarını korur. Misafir tema tercihi kayıt payload'ına eklenmez. `GenderCheckBox` ve son kullanımı biten `.surface` stili silindi; diğer ekranlarda kullanılan `.field` korundu. Mevcut kayıt testlerinin alan ID'leri korundu.

## Aynı adımda düzeltilen backend sorunları

1. Arkadaş kodu pre-check ile save arasında çakışabiliyor ve yanlış “User already exists” hatasına dönüşüyordu. Regresyon önce bu yolda başarısız oldu. Kod adayı `crypto.randomInt` ile 4 karakterli A–Z/0–9 biçiminde üretilir; unique indeks son otoritedir. Yalnız `friendCode` çakışması en fazla 5 save denemesiyle yeniden denenir; hash bir kez hesaplanır. Sınırsız DB sorgu döngüsü kaldırıldı. Sınırda 503, kullanıcı adı çakışmasında mevcut 400 + `USERNAME_TAKEN` döner; diğer duplicate-key hataları kullanıcı adı diye etiketlenmez. Kullanıcı adı ön kontrolü `exists` kullanır.
2. Hesap kalıcı kaydedildikten sonra oturum oluşturma başarısız olursa hesap korunur, 503 + `ACCOUNT_CREATED_LOGIN_REQUIRED` döner. UI “Hesap oluşturuldu. Oturum açılamadı; giriş yap.” metniyle mevcut giriş bağlantısını sunar. Başarılı 201 zarfı ve şema değişmedi; migrasyon yok.

## Doğrulama ve devir

- `npm run test:signup-api`: **29 kontrol**. Gerçek disposable Mongo üzerinde controller; DB sınırında zorlanmış kod çakışması, 5 deneme sınırı/kayıt bırakmama, diğer duplicate anahtar, oturum yazma hatası/kaydı koruma, eşzamanlı kullanıcı adı, ad/kullanıcı adı/parola sınırları, 72/73 UTF-8 bayt, tür ve cinsiyet doğrulaması. Başarılı kayıtlarda default tercihler, public yanıt ve kod formatı doğrulandı.
- `npm run test:signup`: **38 kontrol**, production Chromium. Boş/geçersiz alanlar, parola değişimi/tekrar, iki görünürlük düğmesi, klavyeli radio/focus, gerçek kullanılan kullanıcı adı, HTTP 429/500/503/offline, çift submit, açık/koyu, 320×480 kısa ekran, varsayılan tercihler ve login bağlantısı. Ara adım assertion'ları kontrol sayısına ayrıca eklenmez.
- Smoke **41**, security **37**, realtime **8**, login **48**, genel UI **56**, ayarlar **106** geçti. Build/lint, syntax, CI YAML ve diff kontrolleri geçti. Yeni testler CI ve `test:all` kapsamına eklendi.
- SignUp JS **7,03 kB / 3,29 kB gzip**; ortak form/ikon/Textfield chunk'ları ayrıca yüklenir. Ana JS **617,86 kB / 188,75 kB gzip**; mevcut Vite >500 kB uyarısı devam ediyor. Bu değerler ağ performansı ölçümü değildir.
- Gerçek test ekranları: masaüstü, mobil, koyu hata durumu. Görseller incelendi.

Sonraki adım **04 ana sohbet için ayrı tasarım seçimi**. Emoji sağlayıcısı/asset lisansı araştırması o adımda başlar; bu teslimatta emoji entegrasyonu veya Lucide gereksinimi yok.
