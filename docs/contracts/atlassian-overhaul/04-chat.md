# 04 — Ana sohbet

**Durum: A onaylandı ve uygulandı — 27 Eylül 2026.** Kullanıcı iki sütunlu düzeni seçti ve “Implement the plan.” ile uygulamayı istedi. Masaüstünde 320 px sohbet listesi ve esnek mesaj alanı; 768 px altında liste/sohbet arasında geçiş. 04a–c'nin mevcut modal ve Frimousse kararları korunur. 05–08 ekranlarının içeriği bu onayın kapsamına girmez.

## Arayüz

- Sidebar sırası logo → gezinme → arama → liste → hesap olarak kaldı. Textfield, Button, IconButton, Tooltip ve Spinner kullanılır; sohbet satırları semantik yerel button olarak kalır. Seçim, okunmamış, çevrimiçi, yazıyor ve bekleyen durumları tema token'ları kullanır.
- Başlıkta geri, kişi, durum, arama ve temizleme eylemleri bulunur. Arama yalnız yüklenmiş mesajları kapsar; bu sınır görünürdür. Kapatma/Escape filtreyi temizleyip tetikleyiciye odak döndürür.
- Mesaj balonları, gün ayraçları ve gruplama korunur. Eylemler hover, klavye odağı ve dokunmayla görünür. Gizli eylemler tıklamayı engellemez; son mesaja dönüş düğmesi üstte kalır. Saat time elementiyle, okundu/iletildi durumu erişilebilir adla sunulur.
- Composer ve düzenleme alanı `@atlaskit/textarea@10.2.7` kullanır. Composer en fazla 128 px büyür. Enter/Mod+Enter tercihi, Shift+Enter, IME ve 2.000 UTF-16 sınırı her iki alanda korunur. Düzenlemede Kaydet/Vazgeç ve odak dönüşü vardır.
- Gönderme/düzenleme hataları SectionMessage ile alanın yanında gösterilir; taslak kalır ve aynı eylemle yeniden denenebilir. Bekleyen istekler tekrarlanmaz; gereksiz başarı toast'ı kaldırıldı.
- Bağlantı, mesaj isteği ve arkadaşlık bilgisi başlık altında kompakt SectionMessage kullanır. Yükleme/boş/arama/hata durumları tutarlıdır; yenileme hatası mevcut mesajları veya sohbet listesini gizlemez.
- Ortak ChatAvatar, kurulu Atlaskit Avatar içinde mevcut güvenli URL ve baş harf fallback'ini kullanır. Harici resimde no-referrer korunur. Ana sohbet ikonları core ikonlara taşındı; Lucide eklenmedi.
- Tooltip 24.3.6 doğrudan bağımlılıktır. Textarea ve Tooltip'in React 19 peer uyumu npm metadata'sıyla doğrulandı; React sürümü düşürülmedi.

## Veri akışı ve yarışlar

Home/Sidebar/Conversations → useConversation → MessageContainer/Messages/MessageInput. Mevcut API payload'ları, Mongo şemaları ve son görünür mesaj aggregation'ı değişmedi. Conversation sorgusunun iki okuma sınırı mevcut testle doğrulandı.

`GET /api/messages/:id?before=…&limit=50` ve `X-Has-More` devam eder. Eski sayfa hatasında yeniden deneme aynı eski cursor'u kullanır. Başa eklenen geçmiş okuma konumunu korur; geçmiş okunurken gelen mesaj aşağı atlamaz. Bağlantı yeniden kurulduğunda yalnız son 50 değil, önceden yüklenmiş aralığın tamamı cursor sayfalarıyla yenilenir; yenilemenin herhangi bir sayfası başarısız olursa mevcut içerik korunur. Yeni protokol veya sanallaştırma eklenmedi.

HTTP düzenleme ve `messageEdited` ortak `setMessageEdited` eylemine gider. `editedAt` sırası geç kalan olay/geçmiş yanıtlarının yeni metni geri almasını önler; sidebar ve seçili sohbet önizlemeleri de güncellenir. Yeni mesaj önizlemesi daha eski HTTP/socket yanıtıyla geri alınmaz; liste son mesaj kimliğine göre sıralanır. Silme ve temizleme önceliği sürer. Sohbet değişiminde istek sürümü/abort, hesap değişiminde mevcut apiFetch sessionVersion koruması geç yanıtları ayırır. Reset düzenleme önbelleğini de temizler.

## Doğrulama ve devir

`npm run test:chat`: store yarış kontrolleri ve Chromium'da **45 masaüstü/mobil kontrol**. 66 mesajlık geçmiş, eski sayfa hatası/retry/scroll, geçmiş okurken gelen mesaj, bağlantı kaybında eski sayfadaki edit/delete, başarısız yenilemede içerik koruma, gecikmiş gönderim önizlemesi, hızlı sohbet değişimi, arama/odak, başarısız taslaklar, çok satır/IME/Mod+Enter, 128 px sınırı, açık/koyu tema, mor vurgu, büyük yazı, sıkışık yoğunluk ve 320×500 viewport kapsanır. Mobil klavye yüksekliği Chromium viewport daraltmasıyla taklit edilir; gerçek cihaz klavyesi testi iddia edilmez.

Mevcut UI **56**, ayarlar **106**, emoji **69**, silme **47** ve temizleme **47** tarayıcı kontrolleri regresyon kapsamındadır. Build/lint, backend/store ve tüm suite sonuçları [doğrulama kaydında](../../VERIFICATION.md). `test:chat`, `test:all` ve CI'a eklendi; yeni test framework'ü kurulmadı.

Salt okunur son incelemede iki önceden var olan tutarlılık sorunu kaydedildi (gecikmiş gönderim önizlemesi, eski yüklenmiş sayfanın reconnect yenilemesi). Bu adımın veri kapsamına dahil edilip başarısız olan testlerle doğrulandı ve düzeltildi. Ertelenmiş inceleme bulgusu yok.

| Görünüm | Açık | Koyu |
|---|---|---|
| Masaüstü | [Ekran](../../screenshots/desktop-chat.png) | [Ekran](../../screenshots/desktop-chat-dark.png) |
| Mobil | [Ekran](../../screenshots/mobile-chat.png) | [Ekran](../../screenshots/mobile-chat-dark.png) |
| Büyük yazı / sıkışık / mor | [Masaüstü](../../screenshots/chat-desktop-light-preferences.png) | [Mobil](../../screenshots/chat-mobile-dark-preferences.png) |

Sonraki modül 05 arkadaşlar için ayrı tasarım seçimiyle ilerler. Kalıcı taslak, sunucu genel araması ve yeni gezinme şeridi eklenmedi.
