# 04 alt kararları — Onay modalları ve emoji popup

**04a B, 04b B ve 04c B + Frimousse onaylandı ve uygulandı.** Birini sor → uygula → test et → diğerini sor. Kullanıcının isteğiyle bu alt kararlar ana sohbet tasarımından önce ele alınıyor; ana sohbet hâlâ onaysız.

## 04a — Mesaj silme

- **A (seçilmedi):** dar Atlaskit modal; “Mesaj silinsin mi?”, geri alınamazlık açıklaması, Vazgeç ve Sil.
- **B (25 Eylül 2026'da onaylandı, uygulandı):** aynı modal içinde silinecek mesajın kısaltılmış önizlemesi; doğru mesajı doğrulamayı kolaylaştırır, daha fazla içerik taşır.

Başlangıç Message içindeki `window.confirm`; `DELETE /api/messages/:id` yalnız kendi mesajı için. Modal açılırken hedef ID sabitlenir; seçili sohbet değişince başka mesaj silinmez. Sunucu başarısı gelmeden başarı gösterilmez; hata açık modalda yeniden denemeye izin verir. İlk focus güvenli eylemde; Escape/overlay iptal, submit sırasında çift istek engeli, kapanınca tetikleyiciye focus. Kabul: iptal, hata, başarılı silme, socket'te karşı tarafa silme, yetkisiz sahiplik. Eski confirm sadece bu akıştan kaldırılır.

### Uygulama ve kanıt

Kullanıcı B seçimini yaptı ve planı “Implement the plan.” ile uygulamaya açtı. Mesaj satırlarından bağımsız, gerektiğinde yüklenen tek `DeleteMessageModal`, mevcut Atlaskit Modal/Button/SectionMessage/Spinner bileşenlerini kullanır; yeni paket eklenmedi. Önizleme ilk **240 grapheme** ile sınırlı; `Intl.Segmenter` ZWJ/ten rengi dizilerini bölmez. React metin gösterimi kullanılır. Unicode fallback korunur; bu, 04c emoji seti entegrasyonu değildir.

İlk odak Vazgeç'tedir. İptalde tetikleyici, silmede kalan mesaj balonu, arama filtresi balonu kaldırmışsa composer odaklanır. Pending sırasında çift istek, Escape, overlay ve iptal engellenir. Sohbet/hesap değişimi diyaloğu kaldırır ve isteği iptal eder; eski yanıt yeni diyaloğu kapatamaz. Mobilde kurulu Modal ekranı doldurduğundan dış overlay alanı yoktur; Escape ve Vazgeç kullanılabilir. HTTP 403/404, sunucu ve bağlantı hataları diyaloğu açık tutar, kısa Türkçe hata ve yeniden deneme sunar.

Backend sahiplik kontrolü korunur; kendi silinmiş mesajını tekrar silme **200** döner. Atomik silme ve `isDeleted` koşullu atomik düzenleme aynı mesaj üzerinde yarışsa da silinmiş metin geri gelmez. `{ messageId }` silme olayı gönderen ve alıcının tüm bağlı oturumlarına gider. HTTP ve socket ortak store eylemiyle mesajı ve son mesaj önizlemesini günceller. Silinen ID'ler oturum reset'ine kadar tutulur; henüz yüklenmemiş mesaj için gelen silme olayı da geciken history/older/list yanıtına uygulanır. Eski mesajı silmek daha yeni sohbet önizlemesini değiştirmez. Diğer sekmede açık düzenleyici silme sonrası metni göstermeyi bırakır.

- `npm run test:delete-message`: store'da geciken history/older/list/edit, henüz yüklenmemiş hedef, tekrar olay ve oturum reset'i; backend'de sahiplik, geçersiz/bulunamayan ID, tekrar silme ve **30** eşzamanlı edit/delete yarışı geçti. Düzeltme öncesi tekrar silme kontrolü 400 yerine 200 bekleyerek başarısızdı. Son incelemenin gecikmiş yanıt ve açık düzenleyici bulguları da önce başarısız kontrolle doğrulandı, ardından düzeltildi.
- `npm run test:delete-dialog`: masaüstü/mobil **47** kontrol geçti; açık/koyu tema, büyük yazı, grapheme, odak/iptal, HTTP/ağ hataları, çift submit, diğer hesap ve gönderenin ikinci sekmesi, önizlemeler, filtre sonrası odak, sohbet değişiminden sonra geciken yanıt ve hesap değişimi.
- Build/lint ve mevcut smoke **41**, security **37**, realtime **8**, UI **56**, settings **106** geçti; sohbet sorgusu kontrolü en fazla **iki okuma** sınırını korudu.
- Yerel geçici MongoDB 7 ve Chromium kullanıldı. Testler npm `test:all` ve CI akışına eklendi; uzak CI çalıştırıldığı iddia edilmez.
- İncelenen gerçek görüntüler: [masaüstü açık](../../screenshots/delete-desktop-light.png), [mobil koyu](../../screenshots/delete-mobile-dark.png). Bundle ve doğrulama ayrıntıları [VERIFICATION](../../VERIFICATION.md) içinde.

Temizlik: Message içindeki confirm, toast kullanan eski silme hook akışı ve `IoTrashOutline` kaldırıldı. Silme düğmesi `IconButton` + core `delete` kullanır. Geçmiş temizleme confirm'i 04b'ye, diğer mesaj ikonları kendi onaylı adımlarına aittir; `react-icons` henüz kaldırılmaz.

## 04b — Geçmiş temizleme

- **A (seçilmedi):** dar modal; “Bu sohbetin geçmişi yalnızca senden gizlenecek” açıklaması, Vazgeç ve Geçmişi temizle.
- **B (25 Eylül 2026'da soru aracında onaylandı ve uygulandı):** kişi adı/avatarı eklenmiş açıklamalı modal; sohbet bağlamı daha belirgin.

Başlık “Sohbet geçmişi temizlensin mi?”, kişi satırı ve “Bu sohbetin geçmişi yalnızca senin hesabından gizlenecek. Karşı tarafın mesajları korunacak.” açıklaması. Kurulu Modal, Avatar, Button ve SectionMessage kullanılır; yeni bağımlılık veya ortak modal sarmalayıcısı gerekmez. Header temizleme düğmesi core `delete` ikonuna taşınır. Emoji verisi kullanılmaz; sağlayıcı işi 04c'de kalır.

İncelemede aynı endpoint'in bekleyen isteği alıcı temizlediğinde iki tarafın kayıtlarını sildiği görüldü. 04b'de pending/active ayrımı olmadan yalnız çağıranın görünürlüğü değişecek; isteği gizleyen mevcut çağıran da bu davranışı paylaşacak. Sunucu son mevcut mesajı sınır olarak döndürecek; sonradan gelen mesaj korunacak, geç history/list yanıtı temizlenmiş metni geri getiremeyecek. Aynı hesabın sekmeleri güncellenecek. Mobil/masaüstü, focus, hata/iptal, hesap/sohbet değişimi, iki hesabın ayrı görünürlüğü, yeni mesaj ve pagination yarışları test edilecek.

### Uygulama ve kanıt

Tek lazy `ClearHistoryModal` hedef kişi/hesap/tetikleyiciyi açılışta yakalar. İlk odak Vazgeç; Escape/overlay iptal eder, işlem sırasında kapatma ve tekrar gönderme engellenir. Hata modalda yeniden denemeye izin verir. Sohbet/hesap değişimi isteği iptal eder; eski yanıt yeni modalı kapatamaz. Başarıdan sonra arama sıfırlanır ve odak header düğmesine döner. Boş geçmişteki “İlk mesajı sen gönder!” kaldırıldı; ürün metni “Henüz mesaj yok.” oldu. Kaynak bileşen: [resmî Modal](https://atlassian.design/components/modal-dialog/).

`DELETE /api/messages/clear/:id` artık pending dahil yalnız çağıranın geçmişini gizler. Endpoint ve `deletedCount` korunur; yanıta `clearedThrough` eklenir. Sınır, mevcut pagination ile aynı `_id` sırasına göre en son kayıt; update ve iki taraf da temizlemişse fiziksel temizlik bu sınırla kısıtlıdır. Daha büyük ID'li yeni mesajlar korunur. Boş sohbet varsa başarılı, konuşma yoksa 404. `conversationCleared { peerId, clearedThrough }` yalnız çağıranın hesap odasına yayılır; karşı tarafın geçmişi ve sohbet statüsü değişmez.

HTTP/socket aynı state güncellemesini paylaşır. Sınırlar hesap reset'ine kadar tutulur; eski history/older/list/socket yanıtları temizlenmiş içeriği geri getiremez. Sıralaması ters gelen temizleme olayı sınırı geriye çekemez. Bekleyen istekleri gizleyen diğer endpoint çağıranı da aynı sınırı uygular; daha yeni istek kaldırılmaz. Pagination yenilenir; okunmamış sayısı yeniden alınır. İstek sırasında socket/read sayacı değiştirdiyse eski sayım uygulanmadan yeniden alınır. İki son inceleme bulgusu (eski/null preview ve eski unread snapshot) başarısız kontrollerle doğrulanıp düzeltildi.

- `npm run test:clear-dialog`: masaüstü/mobil **47** kontrol geçti. Kişi/işlem açıklaması, odak, iptal, açık/koyu, büyük yazı, 404/500/ağ hatası, çift gönderim, hesap sekmeleri, karşı tarafın geçmişi, eşzamanlı yeni mesaj, tekrar temizleme, arama sıfırlama, reload, pending istek/yeni istek, geciken unread ve iptal edilmiş yanıt kapsandı.
- `npm run test:clear-history`: pending/active görünürlük ayrımı, olmayan konuşma, tekrar, update sırasında mesaj gelişi ve iki tarafın temizliği; store'da eski history/list/null preview, yeni istek, başka sohbet, ters olay ve hesap reset'i geçti. İlk backend testi pending mesajın karşı taraftan silindiğini göstererek başarısızdı.
- Regresyonlar: 04a UI **47** ve silme backend/store; smoke **41**, security **37**, realtime **8**, UI **56**, settings **106**; conversation sorgularında en fazla **iki okuma** geçti. Build/lint, JS syntax ve CI YAML doğrulandı.
- Testler `test:all` ve CI'a eklendi. Geçici MongoDB 7/Chromium kullanıldı; uzak CI çalıştırılmadı. [Masaüstü açık](../../screenshots/clear-desktop-light.png), [mobil koyu](../../screenshots/clear-mobile-dark.png) görüntüleri incelendi; ayrıntı [VERIFICATION](../../VERIFICATION.md) içinde.

Temizlik: MessageContainer confirm'i ve `IoTrashOutline`, hook içindeki toast/ölü yorumlar kaldırıldı; bu dosyanın Button import'u doğrudan güncel giriş noktasına taşındı. Genel emoji/diğer ikon geçişi tamamlandı denmez; sıradaki bağımsız karar 04c'dir.

Başlangıç MessageContainer `window.confirm`; `DELETE /api/messages/clear/:userId` kullanıcının görünürlüğünü değiştirir. “Herkesten sil” denmez. Hedef kişi işlem boyunca sabit; hata halinde mesajlar tutulur. Klavye/iptal/focus 04a ile aynı erişilebilirlik koşullarında Atlaskit tarafından sağlanır. Kabul: kendi liste/mesajı temizlenir, diğer hesabın geçmişi korunur, tekrar yükleme ve yeni mesaj alma doğru çalışır. Backend davranışı değişmiyorsa yeni endpoint eklenmez.

## 04c — Emoji seçimi / tepki popup

**Güncel karar — 26 Eylül 2026:** B yerleşimi (masaüstü Popup, mobil Modal) korunarak Frimousse uygulandı. Kullanıcı mesaj alanı ve tepkilerde tam katalog, İngilizce arama/adlar ve Türkçe arayüz metinlerini seçti. Önceki geçici 13 emoji / 6 tepki sınırı kaldırıldı. Kaynak ve lisans bilgileri [emoji kontratında](./emoji.md).

### Uygulama ve kanıt

İki alan aynı lazy `EmojiPanel` ve `frimousse@0.4.0` parçalarını kullanır. Emojibase 17.0.0 İngilizce verisi uygulamayla birlikte sunulur; aynı katalog sunucuda tepki doğrulamasında kullanılır. Docker bu veriyi runtime'a taşır. Unicode görseller işletim sistemi fontundandır; Frimousse tarayıcının desteklemediği sürüm/bayrakları filtreler. Mesaj ve kopyalanan metin özgün Unicode olarak kalır.

Arama, kategoriler, sanallaştırılmış liste ve ten rengi seçimi Frimousse'a aittir. Panel Relay/ADS tema ve vurgu renklerini izler. Açılış odağı aramada; seçimden sonra composer veya tepki tetikleyicisindedir. Popup'ın otomatik odağı kapatılarak Frimousse aramasıyla çakışması giderildi. Tepki grid'inde kayıtlı seçim geçerli `aria-selected` ile, aktif klavye/hover öğesi ayrı görselle bildirilir.

Grapheme güvenli imlece/seçime ekleme ve 2000 UTF-16 sınırı korunur. Veri yüklenemezse taslak kaybolmadan yeniden denenir. Tepki API hatasında panel açık kalır; pending sırasında çift istek/kapanış engellenir. Eski altı tepkinin kayıt biçimi uyumluluk dönüşümüyle korunur; izin verilen seçenekler bu altılıyla sınırlı değildir.

Atomik tepki güncellemesi, artan `reactionVersion`, iki hesabın tüm sekmelerine Socket.IO olayı, geciken history/HTTP/socket yanıtları ve silme baskınlığı korunur.

- `test:emoji`: Unicode imleç/seçim/sınır, ters olay/geç history/reset, tam katalog örnekleri/ten rengi/ZWJ, geçersiz girdiler, eski kayıt uyumluluğu ve 20 tur eşzamanlı katılımcı/toggle/silme geçti.
- `test:emoji-ui`: **69 kontrol** geçti; masaüstü/mobil arama, klavye/odak, ten rengi, API/veri hataları ve retry, seçili grid erişilebilirliği, açık/koyu tema, canlı vurgu rengi, 320 px ekranda 44 px hedefler, iki hesap/ikinci sekme ve aynı origin veri istekleri.
- Build/lint, Docker build ve Node 22 runtime içinde katalog doğrulaması geçti. Ayrıntı: [VERIFICATION](../../VERIFICATION.md).
- Composer: [masaüstü açık](../../screenshots/emoji-desktop-light.png), [masaüstü koyu](../../screenshots/emoji-desktop-dark.png), [mobil açık](../../screenshots/emoji-mobile-light.png), [mobil koyu](../../screenshots/emoji-mobile-dark.png).
- Tepki araması: [masaüstü açık](../../screenshots/emoji-reaction-desktop-light.png), [masaüstü koyu](../../screenshots/emoji-reaction-desktop-dark.png), [mobil açık](../../screenshots/emoji-reaction-mobile-light.png), [mobil koyu](../../screenshots/emoji-reaction-mobile-dark.png).

Ana sohbet (04) tasarım seçimi ayrı kalır. Favoriler, son kullanılanlar, özel emoji yükleme ve kalıcı ten rengi tercihi bu kapsamda değildir.
