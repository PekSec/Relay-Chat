# 07 — Mesaj istekleri

**Durum: onay bekliyor.**

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | İstek listesi → mevcut mesaj detay alanı ve eylem banner'ı | **Öneri; onay değil** |
| B | Satır içinde kabul/gizleme eylemli liste | Az tıklama, karar öncesi içerik daha az görünür |
| C | Liste yanında dar inceleme paneli | Masaüstü inceleme alanı, mobilde ayrı detay |

Mevcut Requests, `GET /api/conversations/status/pending` üzerinden useFriendList dönüşümünü kullanır. Kişi `_id` ile konuşma `conversationId` farklıdır. Kabul `PUT /api/conversations/accept/:conversationId`; şu an reddet/gizle `DELETE /api/messages/clear/:userId` üzerinden yalnız yerel görünürlüğü temizler. UI açıklaması gerçek semantiğe uygun olmalı; engelleme veya herkes için silme gibi anlatılmamalı.

Mevcut gönderici/alıcı kararı son mesaja bakıyor; backend kabul yetkisi ilk mesajın alıcısına bakıyor. Bu **incelenecek tutarsızlık adayıdır**, doğrulanmış hata diye sunulmaz. Çok mesajlı pending konuşma testiyle doğrulanırsa frontend/backend'in paylaştığı doğru veri akışında aynı adımda düzeltilir. Yetki kontrolü sunucudan çıkarılmaz.

Atlaskit Avatar/Button/SectionMessage ve seçilen liste düzeni kullan. Liste hatası boş liste gibi gösterilmez. Kabul sonrası sohbet/listeler/socket tutarlı yenilenir; ağ hatasında istek kaybolmaz. Bekleyen istek metni messagePreviews tercihine uyar. Eski banner/istek dönüşüm kodu sadece ortak çağıranlar incelendikten sonra sadeleştirilir.

Kabul: alıcı kabul eder, gönderen/üçüncü kişi edemez; gelen/giden ayrımı, birden çok pending mesaj, gizlemenin diğer kişiyi etkilememesi, reconnect/count güncellemesi, mobil/klavye, yükleme/tekrar dene. Build/lint + security/realtime/UI. Seçim, varsa backend düzeltmesi ve kanıt sonrası 08.
