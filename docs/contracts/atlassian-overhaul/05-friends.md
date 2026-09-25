# 05 — Arkadaşlar

**Durum: onay bekliyor.** Önceki sayfa ve alt birimler bitince soru aracında seçim alınır.

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | Tümü/Gelen/Giden Atlaskit sekmeleri, kompakt kişi satırları | **Öneri; onay değil** |
| B | Aynı görünümde başlıklarla gruplanmış üç liste | Tüm bekleyen işler aynı yerde |
| C | Kişi kartları; eylemler kart altında | Daha geniş profil alanı, düşük liste yoğunluğu |

Mevcut Friends → useFriendStore; ortak useFriendList yükleme/abort/reconnect yönetir. `/api/friends/list`, `/requests`, `/sentRequests`; send/respond/cancel/remove eylemleri mevcut hook'lardadır. Gelen kayıtta kişi `senderId`, gidende `receiverId`; arkadaş listesinde doğrudan kişi. “Mesaj” mevcut veya taslak sohbet seçer; yeni endpoint gerektirmez.

Atlaskit tabs/textfield/avatar/button kullan; boş, arama sonucu yok, yükleme ve hata/tekrar dene durumları ayrılır. Çevrimiçi yalnız renkle verilmez. Kabul/red/iptal/silmede başka satırın kişi ID'si kullanılmaz; server cevabı ve socket iki kez satır oluşturmaz. Backend listeleri/payload'ları okunur; doğrulanmış sorgu sorunu aynı adımda çözülür. Özel sekme ve kart CSS'si yalnız seçilen düzen artık kullanmıyorsa temizlenir; ikonlar tabloda belirtilen hedeflere taşınır.

Kabul: üç liste, Türkçe arama, kabul/red/iptal/çıkarma, mesaj açma, socket yenileme, offline/tekrar dene, hesap değişimi/abort, klavye/mobil/tercih yoğunluğu. Build/lint + smoke/realtime/UI. Onay ve kanıt yazıldıktan sonra 06.
