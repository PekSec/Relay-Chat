# 08 — Bildirimler

**Durum: onay bekliyor.**

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | Zil düğmesine bağlı Atlaskit Popup; kısa bildirim listesi | **Öneri; onay değil** |
| B | Atlaskit bildirim modalı | Küçük ekranda daha geniş alan |
| C | Sayılı menü; Arkadaşlık istekleri / Mesaj istekleri bağlantıları | En az tekrar içerik; kişi önizlemesi yok |

Başlangıç UserInfo içinde özel panel; count gelen arkadaşlık ve mesaj isteklerinin toplamı. Yeni bildirim endpoint'i yok; useFriendStore mevcut listelerinden türetilir. Tıklama arkadaşlar/gelen veya mesaj istekleri görünümüne yönlendirir. Bildirim geçmişi, okundu arşivi, push aboneliği ve yeni database collection bu adımda eklenmez.

Atlaskit Popup/Modal veya menü ve Avatar/Button/Badge bileşenleri seçilen tasarıma göre kullanılır. Trigger adı count içerir, aria-expanded doğru, Escape/dış tıklama ve focus dönüşü çalışır. Sıfır durumunda rozet gizlenir, liste boş mesajı gösterir. Mevcut listelerin hata/yükleme durumları okunmadan “bildirim yok” sonucu çıkarılmaz. Mesaj metni eklenirse messagePreviews tercihi zorunlu olarak uygulanır; bildirim sesi mevcut merkezi tercih kontrolünden geçer.

Özel document listener/panel CSS'si ve simgeler ilgili modül içinde değiştirilir. Eski silinmiş NotificationModal geri getirilmez; seçilen Atlaskit bileşeni kullanılır. Aynı veriyi tekrar fetch eden bildirim hook'u yazılmaz.

Kabul: sıfır/tek/çok istek, iki tür yönlendirme, kabul/red sonrası sayı, socket/reconnect, Escape/dış tıklama/trigger focus, dar ekran taşması, büyük yazı, hata/tekrar dene, ses kapalı. Build/lint + realtime/UI. Seçim ve test kaydı sonrası genel geçiş envanterinde kalan react-icons/Unicode UI/custom karşılığı olan bileşenler kontrol edilir; kullanıcıya tamamlanmayanlar açıkça bildirilir.
