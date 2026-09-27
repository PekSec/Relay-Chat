# Atlassian geçiş kontratları

Bu alan sonraki oturumların başlangıç noktasıdır. **01 Ayarlar ve Kişiselleştirme**, **02 Giriş ve oturum**, **03 Kayıt**, **04 Ana sohbet** ve **04a–c modal/emoji akışları** tamamlandı. Diğer ekranlar ayrı onay-uygulama döngüleriyle ilerler. Mevcut kısmi geçişler de yeniden değerlendirilir.

## Kararlar ve durum

Tüm mevcut ve gelecek ekranlar [ortak metin kurallarına](./shared.md#kullanıcıya-gösterilen-metinler) uyar: slogan ve yapay samimiyet yok; kullanıcıya Atlassian/Atlaskit veya tema altyapısı adı gösterilmez. Kullanıcının 25 Eylül 2026 düzeltmesiyle ayarlar, giriş/kayıt, sohbet ve kişi arama metinleri ile metadata bu kurala göre sadeleştirildi; bu metin düzeltmesi gelecek ekran tasarımlarının onayı değildir.

Kullanıcı 25 Eylül 2026 tarihinde önceki plan için **“Implement the plan.”** diyerek uygulamayı istedi. Onaylanan ilk adım: masaüstünde sol bölüm menülü, mobilde bölüm seçicili ayarlar modalı; profil, güvenlik, görünüm, mesajlaşma ve ses içeriği; sunucuda kalıcı tercihler; anında önizleme ve Kaydet/Vazgeç. Uygulamada mesajlaşma ve ses kontrolleri **Mesaj ve ses** bölümünde birlikte sunulur; toplam dört gezinme bölümü vardır. Azaltılmış hareket için yeni ayar yok; işletim sistemi tercihi korunur. Bu kayıt sonraki ekranların tasarım seçeneklerinin onayı değildir.

| Sıra | Kontrat | Durum |
|---|---|---|
| Ortak | [Tasarım ve tercih kontratı](./shared.md), [İkon geçişi](./icons.md), [Emoji](./emoji.md) | Ortak yön onaylı; modüllere kademeli uygulanır |
| 01 | [Ayarlar ve kişiselleştirme](./01-settings.md) | Uygulandı ve doğrulandı; ayarlar UI 106 kontrol geçti |
| 02 | [Giriş ve oturum](./02-login.md) | A — Ortalanmış kart onaylandı, uygulandı; giriş UI 48 kontrol geçti |
| 03 | [Kayıt](./03-signup.md) | A — Tek sütun kart uygulandı; signup UI 38, API 29 kontrol geçti |
| 04 | [Ana sohbet](./04-chat.md) | A — İki sütun düzen uygulandı; 45 yeni chat UI kontrolü ve store yarış testleri geçti |
| 04a–c | [Mesaj silme, geçmiş temizleme, emoji popup](./04-dialogs.md) | 04a B ve 04b B uygulandı; ayrı ayrı 47 UI kontrolü geçti. 04c B + Frimousse tam katalog uygulandı; 69 UI kontrolü geçti |
| 05 | [Arkadaşlar](./05-friends.md) | Tasarım seçimi bekliyor |
| 06 | [Yeni sohbet / kişi bulma](./06-new-chat.md) | Tasarım seçimi bekliyor |
| 07 | [Mesaj istekleri](./07-requests.md) | Tasarım seçimi bekliyor |
| 08 | [Bildirimler](./08-notifications.md) | Tasarım seçimi bekliyor |

Her birim: mevcut veri akışını oku → 2–3 seçeneği soru aracında sun → açık seçimi buraya kaydet → uygula ve ilgili ölü kodu kaldır → gerçek test sonuçlarını kaydet → sonraki birime geç. `ask_user_input_v0` bulunmuyorsa mevcut soru aracı kullanılır; öneri kendiliğinden onaya dönüşmez. Backend sorunları aynı adımda, bağımsızsa paralel çözülür; doğrulanmış hata ayrı backlog'a ertelenmez.

## Başlangıçtaki bekleyen çalışma

Başlangıç çalışma ağacı temiz değildi. Aşağıdakiler önceki çalışmalardır; bu teslimata mal edilmez, geri alınmaz, otomatik olarak tamamlanmış sayılmaz:

- Kısmi Atlaskit button/tokens kurulumu; App/main, tema store/seçici, CSS/Tailwind, giriş/kayıt ve ana sohbet düzenlemeleri.
- Avatar, ayarlar/Dialog, mesaj listesi/composer, sidebar, arkadaşlar/kişi arama/istekler ve ortak arkadaş listesi hook değişiklikleri.
- Conversation controller aggregation değişikliği, yeni conversation testi, UI testi/CI/npm script güncellemeleri, doğrulama belgesi ve sohbet ekran görüntüleri.
- Silinmiş eski NotificationModal, SearchModal, SearchInput; kullanılmayan React/Vite görselleri ve arka plan dosyaları.

Bu envanter sürüm farklarını özetler; sonraki oturum ayrıca `git status --short` ve ilgili diff'i okumalıdır. İlk uygulamada `codex/frontend-overhaul` dalındaki bekleyen çalışma korundu. Kullanıcının sonraki talebiyle bu çalışma ve metin düzeltmeleri `codex/settings-copy-contracts` dalında commit kapsamına alındı; push istenmedi. Kaynak gerçekliği güncel kod ve testtir.

## Doğrulama ve devir

Her adımda `npm run build`, `npm run lint` ve ilgili mevcut testler çalıştırılır. İlk adımda preferences API, smoke **41**, realtime **8**, security **37**, conversation listesi **iki okuma sınırı**, mevcut UI **56** ve ayarlar UI **106** kontrolleri geçti. Ayarlar testi sırasında bulunan eşzamanlı mesaj gönderim hatası da aynı teslimatta düzeltildi; regresyonda **40/40** istek başarılı. Ayrıntı [01 kanıt kaydındadır](./01-settings.md); son toplu regresyon kaydı `docs/VERIFICATION.md` içindedir. Veritabanı ve tarayıcı test koşulları için mevcut `scripts/test-server.js` esas alınır.

02 için kullanıcı 25 Eylül 2026'da soru aracında **A — Ortalanmış kart** seçti ve uygulama planını “Implement the plan.” ile onayladı. Ortak metin, ikon ve tema kuralları giriş/oturum akışına uygulandı. HTTP/socket oturum doğrulamasındaki altyapı hatası ayrımı aynı adımda düzeltildi; ayrıntılar [02 kaydındadır](./02-login.md).

03 için kullanıcı 25 Eylül 2026'da soru aracında **A — Tek sütun kart** seçti ve planı uygulamaya açtı. Kayıt formu ve iki backend hata yolu tamamlandı; ayrıntılar [03 kaydındadır](./03-signup.md).

Kullanıcı 04-dialogs ile devam etmeyi istedi; 04a için **B — Mesaj önizlemeli modal** seçti ve uygulama planını onayladı. Bu adımın kanıtı [04-dialogs](./04-dialogs.md) içinde. O tarihte ana sohbet için tasarım onayı henüz verilmemişti.

04b'de kullanıcı soru aracında **B — Kişi adı ve avatarı olan modal** seçti; uygulama ve backend görünürlük/yarış düzeltmeleri tamamlandı. Sonraki oturum önce bu belgeyi, shared/emoji/icons kontratlarını ve 04 kanıtını okur. 04c'nin geçici Unicode seçicisi, kullanıcının yeni kararıyla 26 Eylül'de Frimousse'a taşındı: her iki alanda tam İngilizce katalog/arama ve ten rengi; Türkçe arayüz, yerel veri, tema uyumu ve genişletilmiş sunucu doğrulaması. 69 UI kontrolü, build/lint, emoji backend/store ve Docker doğrulaması geçti; güncel kapsam [emoji kontratındadır](./emoji.md). Bu kayıttan sonra 04 kararı aşağıdaki gibi ayrıca alındı. Lucide ihtiyacı henüz yok.

27 Eylül 2026: 04 için **A — İki sütunlu ana sohbet** onaylandı ve uygulandı. Atlaskit geçişi, çok satırlı düzenleme, hata/taslak korunması, geçmiş retry/scroll/reconnect ve gecikmiş yanıt tutarlılığı tamamlandı. [04 kontratı](./04-chat.md) ve [doğrulama kaydı](../../VERIFICATION.md) güncel devirdir. Sonraki tasarım seçimi 05 arkadaşlar içindir.
