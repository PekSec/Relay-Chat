# 07 — Mesaj istekleri

**Durum: tasarım seçilmedi, uygulama başlamadı.** 27 Eylül 2026'da yalnızca açıklamalar detaylandırıldı. Kullanıcının isteği gereği bu açıklama aşamasında soru sorulmaz; tasarım seçimi plan modundaki görüşmeye bırakılır. A seçeneği öneridir, onaylanmış karar değildir.

## Bu adım hangi ekranı değiştiriyor?

Ana gezinmedeki **İstekler** düğmesiyle açılan gelen mesaj isteklerini ele alıyoruz. Bunlar [05 — Arkadaşlar](./05-friends.md) içindeki arkadaşlık isteklerinden farklıdır: birinde kişi arkadaş olmak ister, diğerinde henüz kabul edilmemiş bir konuşma vardır.

Örneğin arkadaşın olmayan Ece sana ilk mesajını gönderdiğinde konuşma bekleyen durumda olabilir. Bu ekran, isteği inceleyip konuşmayı kabul etmeni veya kendi hesabında gizlemeni sağlar. Mesaj isteğini kabul etmek, Ece'yi otomatik olarak arkadaş listene eklemek anlamına gelmez. Arkadaş olmadığın biriyle önceden kabul edilmiş her konuşma da yeniden mesaj isteği sayılmaz.

Bugün sol panelde kişi listesi bulunuyor. Kişiye tıklanınca mevcut sohbet alanında mesajlar ve **Kabul et ve sohbet et / Reddet** düğmelerini taşıyan bir bilgi alanı açılıyor. Bu adım, kararın nerede verileceğini ve karar öncesinde ne kadar içerik görüleceğini belirler.

## Önce “gizleme” işleminin anlamı

Mevcut **Reddet** düğmesinin yaptığı işlem, ilgili kişiyle mesaj geçmişini yalnızca **kendi hesabındaki görünürlükten temizlemektir**. Karşı tarafın mesajları silinmez; kişi engellenmez ve sunucudaki konuşma “reddedildi” adlı yeni bir duruma geçirilmez. Bu nedenle seçeneklerin açıklamalarında **Gizle** adı kullanılıyor; ürün metni gerçek etkiyi açık anlatmalıdır.

Gizlemek, o kişiden bir daha istek gelmeyeceği garantisini vermez. Gizleme sınırından sonra gelen yeni mesaj yeniden görünür olabilir. İşlem sırasında gelen daha yeni mesaj da eski geçmişle birlikte yanlışlıkla kaybolmamalıdır. “İsteği gizle” ifadesi yalnızca listeden bir satırı kaldıran geçici bir filtre olarak da anlatılmamalıdır; mevcut işlem kendi hesabındaki geçmiş görünürlüğünü değiştirir.

## A — Listeden mevcut sohbet alanında inceleme

Sol panelde gelen istekler listelenir. Bir isteğe tıklayınca sağdaki mevcut mesaj alanı o konuşmayı açar. Mesajların üstündeki bilgi alanı isteğin beklediğini söyler ve **Kabul et / Gizle** eylemlerini sunar. Buradaki “banner”, reklam veya geçici bildirim değil, konuşmanın durumunu açıklayan satırdır.

Aşağıdaki şemalar temsilidir; köşeli parantezler düğmeleri gösterir. Düğme metinleri ve ölçüler son tasarım kararı değildir.

```text
Sol panel                Mevcut sohbet alanı
Mesaj istekleri          Ece Demir
[Ece Demir]              Mesaj isteği
[Deniz Kaya]             [Kabul et] [Gizle]
                         ─────────────────────
                         Ece'nin mesajları
```

Örneğin Ece'nin kim olduğunu hatırlamıyorsan isteğini açıp mesajlarını okur, ardından karar verirsin. Kabul edildiğinde aynı alan normal sohbet olarak devam eder; istek bekleyen listesinden çıkar. Mobilde önce liste görünür, isteğe dokununca sohbet ayrıntısı açılır; geri düğmesiyle listeye dönülür.

**Kazancı:** Karar öncesi mesajları mevcut ve tanıdık sohbet görünümünde inceleyebilirsin. 04'te tamamlanan mesaj alanı yeniden kullanılır. **Karşılığı:** Kabul/gizle düğmelerine ulaşmak için önce isteği açmak gerekir; masaüstünde sağda açık olan başka bir sohbetin yerini seçilen istek alır. A'nın önerilme nedeni mevcut akışla uyumu ve ayrı bir mesaj görüntüleme alanına ihtiyaç bırakmamasıdır.

## B — İşlemleri doğrudan liste satırında yapma

Her isteğin satırında kişi bilgisiyle birlikte **Kabul et / Gizle** düğmeleri bulunur. Kullanıcı isteği tam sohbet alanında açmadan karar verebilir. Mesajları okumak istediğinde kişinin inceleme eylemiyle mevcut detay alanına geçebilir; hızlı işlem düğmeleri bunu zorunlu kılmaz.

```text
Mesaj istekleri

(Avatar) Ece Demir
         Mesaj isteği
         [İncele] [Kabul et] [Gizle]
──────────────────────────
(Avatar) Deniz Kaya
         Mesaj isteği
         [İncele] [Kabul et] [Gizle]
```

Örneğin ismini tanıdığın Ece'nin isteğini listeden kabul edebilirsin. Kim olduğunu bilmediğin Deniz'in mesajını ise önce incelemeyi seçersin. Bu seçeneğin ana farkı karar eylemlerinin listede bulunmasıdır; kabul sonrası sohbeti otomatik açıp açmama ayrıntısı uygulama planında netleştirilir.

**Kazancı:** Bilinen kişiler için daha az adımla işlem yapılır; birden fazla isteği sırayla ele almak kolaylaşır. **Karşılığı:** Mesajı okumadan karar vermek daha kolaydır ve dar panelde çok sayıda düğme oluşur. Kişinin satırını açmakla eylem düğmesine basmak birbirine karışmamalı; dar ekranda düğmeler alt satıra yerleşmelidir. Bu seçenek toplu kabul veya toplu gizleme özelliği eklemez.

## C — Liste yanında isteğe özel inceleme paneli

Masaüstünde istek listesi ile seçilen isteğin kişi bilgisini, mesaj içeriğini ve karar düğmelerini gösteren daha dar bir inceleme paneli birlikte sunulur. A'dan farkı, doğrudan normal sohbet görünümüne geçmek yerine **isteği değerlendirmeye ayrılmış bir detay alanı** kullanmasıdır. Sohbet etmeye geçiş kabulden sonra normal mesaj alanına yönlenir.

```text
İstek listesi          İstek inceleme paneli
[Ece Demir]            Ece Demir · @ecedemir
[Deniz Kaya]           Bekleyen mesaj içeriği
                       …
                       [Kabul et] [Gizle]
```

“Dar panel”, mevcut 320 px sol panelin içine ikinci bir sütun sıkıştırmak değildir. Liste ve inceleme için çalışma alanında yer ayrılması gerekir; bu nedenle A ve B'ye göre yerleşime daha fazla müdahale eder. Ayrı inceleme alanının kesin genişliği ve mevcut sohbet alanıyla ilişkisi tasarım seçimi sonrası planda belirlenir; şema üçüncü bir sohbet sütunu taahhüdü değildir.

Mobilde liste ve inceleme yan yana sıkıştırılmaz. Önce liste, seçimden sonra ayrıntı görünür; geri eylemiyle listeye dönülür. Uzun veya birden fazla mesaj okunabilir olmalı; gösterilmeyen içerik varsa eksiksiz konuşma gösteriliyormuş izlenimi verilmemelidir.

**Kazancı:** İsteği değerlendirmek ile normal sohbet etmek görsel olarak ayrılır; masaüstünde listeyi kaybetmeden ayrıntı incelenebilir. **Karşılığı:** Mevcut sohbet bileşeninin yanında ayrı bir inceleme düzeni, seçim durumu ve mobil geri dönüş akışı yönetmek gerekir. Az sayıdaki istek için daha fazla arayüz karmaşıklığı getirir.

## Seçeneklerin doğrudan karşılaştırması

| Karşılaştırma            | A — Mevcut sohbet detayı   | B — Liste içi işlemler           | C — Ayrı inceleme paneli             |
| ------------------------ | -------------------------- | -------------------------------- | ------------------------------------ |
| Karar düğmeleri          | Açılan konuşmanın üstünde  | Her istek satırında              | İsteğe özel detay alanında           |
| Önce açmak gerekir mi?   | Evet                       | Hayır; inceleme isteğe bağlı     | Evet                                 |
| Mesajı nerede okursun?   | Normal mesaj alanında      | İncele ile mesaj alanında        | İnceleme panelinde                   |
| Masaüstü düzenine etkisi | Mevcut iki sütunu kullanır | Mevcut listede daha çok eylem    | Liste + özel detay için alan gerekir |
| Mobilde                  | Liste → sohbet detayı      | Listeden işlem veya detaya geçiş | Liste → inceleme detayı              |
| Öncelik                  | Okuyarak karar vermek      | Hızlı işlem yapmak               | İstek incelemeyi sohbetten ayırmak   |

## Üç seçenekte de korunacak davranışlar

| İşlem veya durum           | Beklenen sonuç                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| İnceleme                   | İsteğin mesajları açılır; yalnızca inceleme eylemi isteği kabul etmiş sayılmaz.                                      |
| Kabul etme                 | Konuşma aktif hale gelir, bekleyen istek listesinden çıkar ve sohbet/listeler güncellenir. Arkadaşlık ayrı kalır.    |
| Gizleme                    | Mevcut geçmiş yalnız kendi hesabında görünmez olur; karşı taraf etkilenmez. Yeni mesajlar için kalıcı engel oluşmaz. |
| Ağ hatası                  | İşlem tamamlanmış gibi gösterilmez; istek kaybolmaz ve yeniden denemek mümkün olur.                                  |
| Tekrar tıklama             | Aynı hedefe eşzamanlı çift işlem gönderilmez; başka istek seçilse de ilk işlemin hedefi değişmez.                    |
| Kabul/gizleme sonrası sayı | İstek listesi, gezinme rozeti ve 08'deki bildirim sayısı aynı durumu yansıtır.                                       |

**Önizleme tercihi:** Liste satırına kısa mesaj metni eklenirse `messagePreviews` kapalıyken içerik yerine “Mesaj isteği” gibi genel bilgi gösterilir. Bu tercih, kullanıcının özellikle açtığı konuşmanın mesajlarını okuyamaması anlamına gelmez. Liste önizlemesi ile açılmış detay ayrımı korunur.

## Tema, hata ve erişilebilirlik

Avatarlar, listeler, seçili satır, bilgi alanı ve düğmeler açık/koyu tema, vurgu rengi, yoğunluk ve büyük yazı tercihlerine uyar. Kabul ile gizleme işlemleri hem adlarıyla hem yerleşimleriyle ayırt edilir; anlam yalnız renge bırakılmaz.

Liste yüklenirken “Bekleyen mesaj isteği yok” gösterilmez. Yükleme hatası, gerçekten boş liste ve seçilen konuşmanın mesajlarını yükleme hatası ayrı durumlar olarak anlatılır. Bağlantı geri geldiğinde listeler yenilenir; eski veriye bakarak işlem başarılıymış gibi davranılmaz.

Tüm işlemler klavyeyle erişilebilir olmalı. İşlem sonucunda satır kaldırılırsa odak kaybolmamalı; kalan listede veya anlamlı bir geri dönüş hedefinde devam etmelidir. Dar mobil ekranda ve büyük yazıda düğmeler taşmamalı; C'de geri dönüş liste seçimini anlaşılır kılmalıdır.

## Uygulama sırasında bakılacak mevcut parçalar

Bu bölüm geliştirme notudur; kontroller tamamlanmış veya hata doğrulanmış sayılmaz.

- Liste `frontend/src/components/sidebar/Requests.jsx`, mevcut detay ve karar alanı `components/messages/MessageContainer.jsx` içindedir.
- `useGetMessageRequests` ve ortak `useFriendList`, `GET /api/conversations/status/pending` sonucunu kişi/son mesaj bilgisine dönüştürür. Kişinin `_id` değeri ile konuşmanın `conversationId` değeri farklıdır.
- `useRespondToMessageRequests`: kabul için `PUT /api/conversations/accept/:conversationId`; gizleme için `DELETE /api/messages/clear/:userId`. İsimler ve hata metinleri bu farklı etkileri doğru anlatmalıdır.
- Gizleme mevcut `clearConversationHistory` ve temizleme sınırını kullanır. Bu sırada gelen daha yeni mesajların yanlışlıkla silinmemesi ve diğer hesabın etkilenmemesi korunur.
- İstemci şu anda gelen/giden ayrımında son mesajın göndericisine, sunucudaki kabul kontrolü ise ilk mesajın alıcısına bakıyor. Bu **incelenecek tutarsızlık adayıdır**. Çok mesajlı bekleyen konuşmada yanlış düğme veya yanlış liste oluşup oluşmadığı test edilir; doğrulanırsa ortak veri akışında aynı adımda düzeltilir. Yetki kontrolü sunucudan çıkarılmaz.
- Bekleyen isteği alıcı kabul edebilir; gönderen kendi isteğini ve üçüncü kişi başkasının isteğini kabul edemez. UI düğmesinin gizlenmesi sunucu kontrolünün yerine geçmez.
- Atlaskit Avatar/Button/SectionMessage ve seçilen liste düzeni kullanılır. Önce tüm çağıranlar okunur; eski bilgi alanı ve istek dönüşüm kodu ortak davranışlar korunarak sadeleştirilir.

## Tamamlandı sayılmadan önce doğrulanacaklar

1. Gelen/giden ayrımı; alıcının kabul edebilmesi, gönderen ve üçüncü kişinin yetkisiz kabul yapamaması.
2. Bir veya birden fazla mesaj içeren bekleyen konuşma; son mesajın değişmesiyle yanlış kabul yetkisi gösterilmemesi.
3. Kabul sonrası sohbet, istek listesi, socket güncellemeleri ve sayaçların tutarlılığı.
4. Gizlemenin yalnız kendi hesabını etkilemesi; geçmiş temizleme sınırı, yeni gelen mesaj ve aynı anda yapılan işlemler.
5. Yükleme, boş liste, ağ hatası, tekrar deneme, yeniden bağlantı ve hesap değişimi.
6. Mesaj önizlemesi tercihi, klavye/odak, mobil geri dönüş, açık/koyu tema, yoğunluk ve büyük yazı.
7. Build/lint ve ilgili security/realtime/UI kontrolleri; masaüstü/mobil görüntüleri, varsa backend düzeltmesi ve gerçek sonuçların kaydı.

Tasarım seçimi ve uygulama ayrı aşamalardır. 07 tamamlanıp doğrulandıktan sonra 08'e geçilir.
