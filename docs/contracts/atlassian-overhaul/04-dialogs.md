# 04 alt kararları — Onay modalları ve emoji popup

**Üç birim de ayrı ayrı onay bekliyor.** Birini sor → uygula → test et → diğerini sor. Ana sohbet seçimi bu kararların yerine geçmez.

## 04a — Mesaj silme

- **A (öneri, onaysız):** dar Atlaskit modal; “Mesaj silinsin mi?”, geri alınamazlık açıklaması, Vazgeç ve Sil.
- **B:** aynı modal içinde silinecek mesajın kısaltılmış önizlemesi; doğru mesajı doğrulamayı kolaylaştırır, daha fazla içerik taşır.

Başlangıç Message içindeki `window.confirm`; `DELETE /api/messages/:id` yalnız kendi mesajı için. Modal açılırken hedef ID sabitlenir; seçili sohbet değişince başka mesaj silinmez. Sunucu başarısı gelmeden başarı gösterilmez; hata açık modalda yeniden denemeye izin verir. İlk focus güvenli eylemde; Escape/overlay iptal, submit sırasında çift istek engeli, kapanınca tetikleyiciye focus. Kabul: iptal, hata, başarılı silme, socket'te karşı tarafa silme, yetkisiz sahiplik. Eski confirm sadece bu akıştan kaldırılır.

## 04b — Geçmiş temizleme

- **A (öneri, onaysız):** dar modal; “Bu sohbetin geçmişi yalnızca senden gizlenecek” açıklaması, Vazgeç ve Geçmişi temizle.
- **B:** kişi adı/avatarı eklenmiş açıklamalı modal; sohbet bağlamı daha belirgin.

Başlangıç MessageContainer `window.confirm`; `DELETE /api/messages/clear/:userId` kullanıcının görünürlüğünü değiştirir. “Herkesten sil” denmez. Hedef kişi işlem boyunca sabit; hata halinde mesajlar tutulur. Klavye/iptal/focus 04a ile aynı erişilebilirlik koşullarında Atlaskit tarafından sağlanır. Kabul: kendi liste/mesajı temizlenir, diğer hesabın geçmişi korunur, tekrar yükleme ve yeni mesaj alma doğru çalışır. Backend davranışı değişmiyorsa yeni endpoint eklenmez.

## 04c — Emoji seçimi / tepki popup

- **A (öneri, onaysız):** composer düğmesine bağlı Atlaskit Popup içinde Emoji picker; mesaj tepkisi için aynı provider ile yalnız altı tepki.
- **B:** masaüstünde aynı popup, mobilde Atlaskit modal içinde picker; küçük ekran için daha geniş alan.

[Emoji veri/lisans kontratı](./emoji.md) tamamlanmadan gerçek set tamamlandı denmez. Picker'ın onayı tepki API listesini genişletmez. Hızlı seçenekler/Unicode UI aynı renderer'a taşınır; mevcut metin verisi korunur. Escape/dış tıklama kapatma, roving/arama klavyesi, imlece ekleme, focus dönüşü ve mobile taşma test edilir. Asset yükleme hatası sohbeti engellemez. Silinen özel emoji popup CSS'si ve doküman event listener'ları son kullanım bittiğinde kaldırılır.
