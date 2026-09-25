# 03 — Kayıt

**Durum: onay bekliyor.** 02 kabulünden sonra seçenek sorulur.

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | Tek sütun tek form; alanlar doğal okuma sırasında | **Öneri; onay değil** |
| B | Aynı sayfada profil/hesap alanlarını görsel gruplama | Uzun formu taramayı kolaylaştırır |
| C | İki adımlı profil → hesap | Ek adım/state maliyeti; kullanıcı seçerse uygulanır |

Mevcut SignUp/GenderCheckBox ve signup hook'u `POST /api/auth/signup` kullanır. Ad, kullanıcı adı, şifre/tekrar ve mevcut gender alanının gerçek validasyonları controller ile karşılaştırılır. Şifre en az 8 karakter/en çok 72 UTF-8 bayt; backend doğrulaması korunur. Yeni hesap shared varsayılan tercihleri alır. Alan veya gender politikası tasarım bahanesiyle sessizce değiştirilmez.

Atlaskit Form/Textfield/Button ve seçime uygun kontrol kullan; label, error association, autocomplete ve ilk hataya focus sağla. Kayıt sırasında input korunur; başarısız submit yeniden denenir. Başarılı kayıt mevcut cookie/redirect/store akışıyla tamamlanır. Sadece bu modülün geçersiz CSS/ikon/alan sarmalayıcısı temizlenir; eski bileşen çağıranları kontrol edilir.

Kabul: minimum/maksimum uzunluk, çok baytlı şifre, uyuşmayan tekrar, kullanılan username, ağ hatası/çift submit, keyboard/mobile, varsayılan tercihler, login'e bağlantı ve başarılı redirect. Mevcut smoke/security/UI senaryolarıyla doğrula. Onay, test kanıtı ve sınırlamalar yazıldıktan sonra 04'e geç.
