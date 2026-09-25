# 06 — Yeni sohbet / kişi bulma

**Durum: onay bekliyor.**

| Seçenek | Tasarım | Karar |
|---|---|---|
| A | Sidebar içinde kişi arama görünümü ve sonuç satırları | **Öneri; onay değil** |
| B | Atlaskit arama modalı, sonuçtan sohbet açma | Konumdan bağımsız açılır, focus yönetimi gerekir |
| C | Ayrı tam genişlik kişi arama görünümü | Sonuçlara daha çok alan |

Mevcut AddFriend/useSearchUsers akışı: 350 ms debounce, trim edilmiş en az 2 karakter, `GET /api/friends/search?query=…`, eski fetch abort. Sonuçtan arkadaş isteği `POST /friends/send/:id` veya useConversation üzerinde kişi seçimi. İlk mesaj gönderilene kadar sohbet taslaktır; `chatOpened` gerçek konuşma için yayınlanır. Bu ayrım korunur.

Seçilmiş görünümde Atlaskit Textfield/Avatar/Button ve gerekiyorsa Modal kullan. Kişi bulma ipucu, yükleniyor, boş ve API hatası ayrı görünür. Arama response'unda gereksiz özel alan taşınmadığı ve query sınırlarının backend'de uygulandığı kontrol edilir. Gönderilmiş arkadaş isteğine çift eylem başarılıymış gibi gösterilmez. Eski SearchModal/SearchInput zaten silinmiş olabilir; geri getirilmez, yeni düzenin tüm importları yeniden denetlenir.

Kabul: 0/1/2 karakter, boşluk/kod/username, Türkçe karakterler, hızlı sorgu değişimi/eski yanıt, sonuç yok/hata, arkadaş isteği, mevcut sohbet ve ilk mesaj taslağı, klavye/mobil. Build/lint + smoke/UI. Seçim ve kanıt sonrası 07.
