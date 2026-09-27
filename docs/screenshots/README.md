# Güncel ekran görüntüleri

27 Eylül 2026. Önceki görseller kaldırıldı; bu dizin aynı uygulamanın 28 alanını iki görünümde gösterir: **koyu masaüstü 1440 × 960** ve **açık mobil 390 × 844**. Standart yazı boyutu, rahat yoğunluk ve Relay Iris vurgu kullanılır. Görseller Chromium üzerinde geçici test hesaplarıyla alınır; gerçek kullanıcı verisi içermez. Alt bölüm görüntüleri aynı ekranın kaydırılmış halidir.

| Alan                            | Koyu masaüstü                                           | Açık mobil                                              |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Ana ekran ve sohbet listesi     | [Görüntü](sidebar-dark-desktop.png)                     | [Görüntü](sidebar-light-mobile.png)                     |
| Yeni sohbet — başlangıç         | [Görüntü](new-chat-empty-dark-desktop.png)              | [Görüntü](new-chat-empty-light-mobile.png)              |
| Yeni sohbet — arama sonuçları   | [Görüntü](new-chat-dark-desktop.png)                    | [Görüntü](new-chat-light-mobile.png)                    |
| Bildirimler                     | [Görüntü](notifications-dark-desktop.png)               | [Görüntü](notifications-light-mobile.png)               |
| Ayarlar — profil                | [Görüntü](settings-profile-dark-desktop.png)            | [Görüntü](settings-profile-light-mobile.png)            |
| Ayarlar — profil alt bölümü     | [Görüntü](settings-profile-details-dark-desktop.png)    | [Görüntü](settings-profile-details-light-mobile.png)    |
| Ayarlar — güvenlik              | [Görüntü](settings-security-dark-desktop.png)           | [Görüntü](settings-security-light-mobile.png)           |
| Ayarlar — mesajlaşma            | [Görüntü](settings-messaging-dark-desktop.png)          | [Görüntü](settings-messaging-light-mobile.png)          |
| Ayarlar — görünüm               | [Görüntü](settings-appearance-dark-desktop.png)         | [Görüntü](settings-appearance-light-mobile.png)         |
| Ayarlar — seçim menüsü          | [Görüntü](settings-select-dark-desktop.png)             | [Görüntü](settings-select-light-mobile.png)             |
| Ayarlar — görünüm alt bölümü    | [Görüntü](settings-appearance-details-dark-desktop.png) | [Görüntü](settings-appearance-details-light-mobile.png) |
| Arkadaşlar                      | [Görüntü](friends-dark-desktop.png)                     | [Görüntü](friends-light-mobile.png)                     |
| Arkadaşlıktan çıkarma           | [Görüntü](remove-friend-dark-desktop.png)               | [Görüntü](remove-friend-light-mobile.png)               |
| Gelen arkadaşlık istekleri      | [Görüntü](friends-incoming-dark-desktop.png)            | [Görüntü](friends-incoming-light-mobile.png)            |
| Gönderilen arkadaşlık istekleri | [Görüntü](friends-outgoing-dark-desktop.png)            | [Görüntü](friends-outgoing-light-mobile.png)            |
| Mesaj istekleri                 | [Görüntü](requests-dark-desktop.png)                    | [Görüntü](requests-light-mobile.png)                    |
| Mesaj isteği ayrıntısı          | [Görüntü](request-detail-dark-desktop.png)              | [Görüntü](request-detail-light-mobile.png)              |
| Sohbet                          | [Görüntü](chat-dark-desktop.png)                        | [Görüntü](chat-light-mobile.png)                        |
| Mesaj işlem menüsü              | [Görüntü](message-actions-dark-desktop.png)             | [Görüntü](message-actions-light-mobile.png)             |
| Sohbet içinde arama             | [Görüntü](chat-search-dark-desktop.png)                 | [Görüntü](chat-search-light-mobile.png)                 |
| Mesaj düzenleme                 | [Görüntü](message-edit-dark-desktop.png)                | [Görüntü](message-edit-light-mobile.png)                |
| Geçmişi temizleme               | [Görüntü](clear-history-dark-desktop.png)               | [Görüntü](clear-history-light-mobile.png)               |
| Mesaj silme                     | [Görüntü](delete-message-dark-desktop.png)              | [Görüntü](delete-message-light-mobile.png)              |
| Emoji seçici                    | [Görüntü](emoji-dark-desktop.png)                       | [Görüntü](emoji-light-mobile.png)                       |
| Tepki seçici                    | [Görüntü](reaction-dark-desktop.png)                    | [Görüntü](reaction-light-mobile.png)                    |
| Giriş                           | [Görüntü](login-dark-desktop.png)                       | [Görüntü](login-light-mobile.png)                       |
| Kayıt                           | [Görüntü](signup-dark-desktop.png)                      | [Görüntü](signup-light-mobile.png)                      |
| Kayıt — alt bölüm               | [Görüntü](signup-details-dark-desktop.png)              | [Görüntü](signup-details-light-mobile.png)              |

Yeniden üretmek için çalışan, yalnızca test için ayrılmış MongoDB üzerinde PowerShell ile:

```powershell
$env:MONGO_URI = "mongodb://127.0.0.1:27018/relay_screenshots"
npm run screenshots
```

Komut production build alır, test sunucusunu başlatır ve bu 56 görseli günceller. Veritabanına test hesapları ve mesajlar ekler; mevcut kullanıcı veritabanını kullanmayın. `npm run test:layout` ayrıca altı ekran boyutunda yazı/ikon hizası, boşluklar, taşma, menü erişilebilirliği ve odak dönüşünü denetler.
