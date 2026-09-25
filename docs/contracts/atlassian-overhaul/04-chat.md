# 04 — Ana sohbet

**Durum: onay bekliyor.** 03 kabulünden sonra ana sayfa seçimi alınır. Alt modal/popup kararları [ayrı kontrattadır](./04-dialogs.md); sayfa onayı onları kapsamaz.

| Seçenek | Yerleşim | Karar |
|---|---|---|
| A | Sohbet listesi + mesaj alanı; mobilde liste/sohbet arasında geçiş | **Öneri; onay değil** |
| B | Dar gezinme şeridi + liste + mesaj alanı | Masaüstü araçlarına ek sabit alan |
| C | Katlanabilir liste + geniş sohbet | Daha geniş mesaj alanı, ek aç/kapat davranışı |

## Akış ve uygulama

Home/Sidebar/Conversations → useConversation → MessageContainer/Messages/MessageInput. `GET /api/conversations` son görünür mesaj ve katılımcıları verir. `GET /api/messages/:id?before=…&limit=50` geçmişi ve `X-Has-More` verir; UI araması yalnız yüklenen mesajlarda çalışır ve bu sınır belirtilir. `POST send`, `PUT edit`, `DELETE message`, `POST react`, `DELETE clear` sözleşmeleri `docs/API.md` ile karşılaştırılır. Socket.IO mesaj, düzenleme, silme, tepki, okundu, typing ve reconnect yenilemeleri korunur.

Önce gerçek sorgu/payload akışını ve mevcut aggregation değişikliğini yeniden değerlendir. Geçmiş sayfalarken scroll konumu korunur; çok hızlı kişi değişiminde eski cevap yeni sohbete yazılmaz. Socket ve fetch tekrarları çift mesaj üretmez. Liste büyümesi somut sorun çıkarırsa ölçülmüş sorunu aynı adımda gider; çalışan cursor pagination yerine yeni protokol tasarlama.

Seçilmiş kabuğu Atlaskit button/avatar/form/textarea/tooltip/section-message ile kur; mesaj balonunun Atlaskit'te doğrudan karşılığı yoksa mevcut semantik DOM ve az CSS kullan. Composer, düzenleme, arama, bağlantı, boş ve hata durumları aynı sayfa kararı içinde tamamlanır. Emoji popup ve destructive modal değişiklikleri ayrı onayları ardından sırayla uygulanır. Tercihlerin yoğunluk/yazı/ses/Enter/önizleme tüketicileri korunur. İkonlar tabloya göre taşınır; eski CSS yalnız çağıranı kalmayınca silinir.

## Kabul ve devir

İki kullanıcıyla send/edit/delete/reaction/read/typing; reconnect kaçırılan olay yenilemesi; 50+ mesaj geçmişi ve hızlı kişi geçişi; arama kapsamı; IME/çok satır/2.000 sınırı; gövdede emoji ve erişilebilir metin; mobil keyboard/scroll; preferences açık/kapalı; clear sadece kendi görünürlüğü. Build/lint, realtime/conversations/UI ve yetki yolları için security. 04a–c de kendi döngüsünü bitirmeden 05'e geçilmez.
