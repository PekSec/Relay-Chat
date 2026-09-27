# 05 — Arkadaşlar

> Önceki ekran görüntüleri kullanıcı isteğiyle kaldırıldı. Aşağıdaki eski doğrulama kayıtları tarihseldir; güncel görseller [koyu masaüstü / açık mobil galerisindedir](../../screenshots/README.md).

**Durum: A — Sekmeler ve kompakt kişi satırları onaylandı ve uygulandı — 27 Eylül 2026.** Kullanıcı soru aracında A düzenini ve arkadaşlıktan çıkarmada kısa onay penceresini seçti; ardından “Implement the plan.” ile uygulamayı istedi. Aşağıdaki seçenek açıklamaları korunmuştur; B/C uygulanmadı. Gerçek uygulama ve doğrulama kaydı belgenin sonundadır.

## Bu adım hangi ekranı değiştiriyor?

Ana gezinmedeki **Kişiler** düğmesine basınca açılan arkadaş listesini ele alıyoruz. Masaüstünde bu içerik mevcut 320 px genişliğindeki sol panelde görünür; sağ tarafta sohbet alanı kalır. Mobilde kişi listesi ekran genişliğini kullanır; bir arkadaşın **Mesaj** düğmesine basınca sohbet ekranına geçilir. Üç seçenek de bu mevcut yerleşim içinde düşünülmüştür; ayrı bir profil sayfası veya tam ekran arkadaşlık merkezi önerilmemektedir.

| Grup      | İçinde kimler var?                                                | Kullanıcı ne yapabilir?                        |
| --------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| **Tümü**  | Arkadaşlık ilişkisi kurulmuş kişiler                              | Mesaj açabilir veya arkadaşlıktan çıkarabilir. |
| **Gelen** | Sana arkadaşlık isteği gönderen, henüz yanıtlamadığın kişiler     | İsteği kabul edebilir veya reddedebilirsin.    |
| **Giden** | Senin arkadaşlık isteği gönderdiğin, henüz yanıt vermeyen kişiler | Gönderdiğin isteği iptal edebilirsin.          |

**“Tümü”, bu üç grubun birleşimi değildir; yalnızca mevcut arkadaşların tamamıdır.** Gelen ve giden kayıtlar arkadaşlık isteğidir. Ana gezinmedeki **İstekler** ekranı ise mesaj isteklerini gösterir ve [07 adımının](./07-requests.md) konusudur. Yeni birini bulmak ve arkadaşlık isteği göndermek [06 — Yeni sohbet / kişi bulma](./06-new-chat.md) kapsamında kalır.

Bugünkü ekran zaten Tümü/Gelen/Giden düğmeleri, isim veya kullanıcı adıyla arama ve eylemleri altta duran kişi kartları içeriyor. Bu adım, mevcut işlemleri temayla tutarlı bileşenlere taşıyacak ve seçilecek düzene göre sunacak.

## A — Sekmeler ve kompakt kişi satırları

Üstte **Tümü / Gelen / Giden** sekmeleri bulunur. Aynı anda yalnızca seçilen grubun listesi görünür. Arama alanı bu gruptaki kişileri filtreler; örneğin Gelen açıkken yazılan isim mevcut arkadaşlar arasında aranmaz.

Her kişi avatarı, adı, kullanıcı adı ve ilgili işlemleriyle kısa bir satırda gösterilir. Genişlik elverdiğinde işlemler kişi bilgisinin yanında durur; dar alanda veya büyük yazı tercihinde alt satıra geçebilir. “Kompakt”, ayrı ve geniş bir kart yerine daha az dikey boşluk kullanan liste düzeni demektir; okunabilirlik veya dokunma alanı küçültülmez.

Aşağıdaki yerleşimler temsilidir; köşeli parantezler düğmeleri gösterir, kesin ölçü veya son görsel tasarım değildir.

```text
Tümü    [Gelen]    Giden
İsim veya kullanıcı adıyla ara

(Avatar) Ayşe Yılmaz
         @ayse · Çevrimiçi
         [Reddet] [Kabul et]
──────────────────────────
(Avatar) Deniz Kaya
         @deniz
         [Reddet] [Kabul et]
```

Örneğin Ayşe'nin isteğini kabul ettiğinde Ayşe Gelen listesinden çıkar ve Tümü listesine eklenir. Diğer gelen isteklerle ilgilenmeye aynı sekmede devam edersin; arkadaşlarını görmek için Tümü'ne geçersin.

**Kazancı:** Dar sol panelde aynı anda daha fazla kişiyi görmek ve tek bir işe odaklanmak kolaylaşır. Mevcut sekmeli kullanım alışkanlığı korunur. **Karşılığı:** Gelen, giden ve arkadaş listelerini birlikte göremezsin; gruplar arasında sekme değiştirmen gerekir. A'nın önerilme nedeni mevcut sohbet yerleşimine uyumu ve listeyi daha az kaydırmayla taratmasıdır.

## B — Tek görünümde başlıklarla ayrılmış üç liste

Sekmeler yerine aynı kaydırılan alan içinde **Gelen istekler**, **Giden istekler** ve **Arkadaşlar** başlıkları bulunur. Her başlığın altında ilgili kişiler ve o gruba ait işlemler gösterilir. Buradaki örnek, bekleyen işleri üstte göstermek için gelen ve giden istekleri önce yerleştirir.

Tek arama alanı üç grubu birlikte filtreler. Örneğin “Deniz” yazınca eşleşen kişi, arkadaşsa Arkadaşlar altında; gönderdiğin istek bekliyorsa Giden istekler altında görünür. Kişinin hangi grupta olduğunu önceden bilmen gerekmez.

```text
İsim veya kullanıcı adıyla ara

Gelen istekler
  Ayşe Yılmaz · @ayse
  [Reddet] [Kabul et]

Giden istekler
  Deniz Kaya · @deniz
  [İsteği iptal et]

Arkadaşlar
  Ece Demir · @ece
  [Çıkar] [Mesaj]
```

Örneğin Ayşe'nin isteğini kabul ettiğinde kaydı aynı görünümdeki Gelen istekler bölümünden Arkadaşlar bölümüne geçer. Arkadaşlar bölümü aşağıda kalıyorsa yeni yerini görmek için kaydırman gerekebilir.

**Kazancı:** Üç grubun da aynı görünümde yer alması, bekleyen işleri ve arkadaşları sekme değiştirmeden kontrol etmeyi sağlar. **Karşılığı:** “Aynı görünümde” hepsinin ekrana aynı anda sığacağı anlamına gelmez. Çok kişi olduğunda liste uzar; özellikle mobilde alt bölümlere ulaşmak daha fazla kaydırma gerektirir. Boşluk, yükleme ve hata bilgileri her bölüm için ayrı anlaşılmalıdır.

## C — Sekmeler ve daha geniş kişi kartları

Tümü/Gelen/Giden ayrımı korunur; aynı anda seçilen grubun kartları gösterilir. A'daki kısa satırlar yerine her kişi ayrı bir yüzeyde yer alır. Avatar, ad ve kullanıcı adı üst bölümde; **Mesaj / Çıkar**, **Kabul et / Reddet** veya **İsteği iptal et** düğmeleri kartın alt bölümünde bulunur. Arama, A'daki gibi seçili grubu filtreler.

```text
[Tümü]    Gelen    Giden
İsim veya kullanıcı adıyla ara

┌────────────────────────────┐
│ (Avatar) Ece Demir          │
│          @ece · Çevrimiçi   │
│                            │
│          [Çıkar] [Mesaj]    │
└────────────────────────────┘
```

“Daha geniş profil alanı”, mevcut ad, avatar ve kullanıcı adının daha ferah gösterilmesidir. Biyografi, yeni profil alanları veya profil detay sayfası eklemek anlamına gelmez. Dar sol panelde kartlar alt alta yerleşir; çok sütunlu bir kart galerisi önerilmez.

**Kazancı:** Kişiler görsel olarak daha belirgin ayrılır ve eylemler her kartta aynı alt bölümde kolay bulunur. Bugünkü kart yapısına en yakın seçenektir. **Karşılığı:** Aynı ekranda A'ya göre daha az kişi görünür; uzun listelerde daha çok kaydırma gerekir. Büyük yazı tercihinde kartların yüksekliği daha da artabilir.

## Seçeneklerin doğrudan karşılaştırması

| Karşılaştırma       | A — Kompakt satırlar            | B — Gruplanmış listeler                | C — Kişi kartları                       |
| ------------------- | ------------------------------- | -------------------------------------- | --------------------------------------- |
| Görünen gruplar     | Seçilen tek grup                | Üç grup aynı kaydırma alanında         | Seçilen tek grup                        |
| Gruplar arası geçiş | Sekme değiştirerek              | Kaydırarak                             | Sekme değiştirerek                      |
| Aramanın kapsamı    | Seçili grup                     | Üç grup birlikte                       | Seçili grup                             |
| Kişi sunumu         | Daha az boşluklu satır          | Başlıklar altında kişi satırları       | Ayrı yüzeyli, daha ferah kart           |
| Eylemlerin yeri     | Alana göre yanında veya altında | İlgili kişi satırında                  | Kartın alt bölümünde                    |
| Mobilde temel fark  | Kısa liste, sekmeyle geçiş      | Uzun liste, bölümler arasında kaydırma | Büyük kartlar, sekmeyle geçiş           |
| Öncelik             | Listede hızlı kişi bulmak       | Farklı grupları birlikte takip etmek   | Kişi ve eylemleri daha belirgin ayırmak |

Bu seçimler arkadaşlık sisteminin yetkilerini veya işlemlerin anlamını değiştirmez. Fark, aynı bilgilerin nasıl yerleştirildiği ve listeler arasında nasıl dolaşıldığıdır.

## Üç seçenekte de korunacak işlemler

| İşlem               | Beklenen sonuç                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Mesaj**           | Kişiyle mevcut sohbet varsa onu açar. Yoksa ilk mesajın yazılabileceği taslak sohbeti seçer; yalnızca düğmeye basmak mesaj göndermez. |
| **Kabul et**        | Gelen istek kaldırılır, kişi arkadaş listesine eklenir. Ekran elle yenilenmeden güncellenir.                                          |
| **Reddet**          | Gelen istek kaldırılır; kişi arkadaş listesine eklenmez.                                                                              |
| **İsteği iptal et** | Senin gönderdiğin bekleyen istek Giden listesinden kaldırılır.                                                                        |
| **Çıkar**           | Arkadaşlık ilişkisi kaldırılır. Bu işlem sohbet geçmişini temizleme veya kişiyi engelleme işlemi değildir.                            |

İşlem sürerken aynı isteğin tekrar gönderilmesi engellenir ve hangi kişi için işlem yapıldığı anlaşılır. Başarısız işlem tamamlanmış gibi gösterilmez; ilgili kişi/istek kaybolmaz ve yeniden denemek mümkün olur. Sekme değiştirme, arama veya anlık liste güncellemesi işlemin hedefini başka bir kişiye çevirmemelidir.

## Tema, arama ve ekran durumları

**Tema uyumu:** Açık/koyu tema, seçilen vurgu rengi, rahat/kompakt yoğunluk ve standart/büyük yazı tercihleri bu ekrana da uygulanır. Seçili sekme, düğme, odak çerçevesi, metin, ayırıcı ve kart yüzeyleri mevcut tema değerlerini kullanır. Hata rengi vurgu rengine dönüşmez. Büyük yazı ve uzun isimler butonları ekran dışına itemez; mobilde yatay kaydırma oluşmamalıdır.

**Arama:** Mevcut listelerde ad ve kullanıcı adı aranır; yeni kullanıcı bulmak için sunucu genelinde arama yapılmaz. Türkçe büyük/küçük harf davranışı korunur. Aramayı temizleyince ilgili listenin tamamı yeniden görünür. “Henüz arkadaşın yok” ile “Bu aramayla eşleşen kişi yok” aynı durum gibi sunulmaz.

| Durum                    | Kullanıcının anlayacağı bilgi                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| İlk yükleme              | Liste henüz gelmedi; yükleniyor. Boş liste mesajı erkenden gösterilmez.                                   |
| Gerçekten boş liste      | Arkadaşın veya ilgili yönde bekleyen isteğin yok.                                                         |
| Aramada sonuç yok        | Yazılan isimle eşleşen kişi yok.                                                                          |
| Liste yükleme hatası     | Hangi listenin yüklenemediği ve **Tekrar dene** işlemi anlaşılır.                                         |
| İşlem hatası             | Kabul, ret, iptal veya çıkarma tamamlanamadı; tekrar denenebilir. Metin Türkçe ve yapılan işleme özgüdür. |
| Bağlantının geri gelmesi | Listeler yeniden alınır; bağlantı yokken değişen istekler güncel hale gelir.                              |

Çevrimiçi bilgisi yalnızca yeşil bir noktayla anlatılmaz; metin veya erişilebilir ad da anlamı taşır. Sekmeler, arama ve tüm işlemler klavyeyle kullanılabilir; odak görünür kalır. Arkadaşlık bildiriminin Gelen listesine yönlendirmesi korunur; B seçilirse aynı hedef ilgili bölümdür.

## Uygulama sırasında bakılacak mevcut parçalar

Bu bölüm geliştirme notudur; seçenekleri anlamak için teknik adları bilmek gerekmez. Buradaki kontroller henüz tamamlanmış veya testler geçmiş sayılmaz.

- Ekran: `frontend/src/components/sidebar/views/Friends.jsx`. Panel ve giriş noktaları: `Sidebar.jsx`; masaüstü/mobil ayrımı: `pages/home/Home.jsx`.
- Veriler: `frontend/src/zustand/useFriend.js` içindeki `useFriendStore`. Arkadaşlar doğrudan kişi kaydıdır; gelen istekte kişi `senderId`, gidende `receiverId` içindedir. Kabul/ret/iptal için **istek ID'si**, arkadaşlıktan çıkarma ve sohbet seçimi için **kişi ID'si** kullanılır.
- Liste yükleme: `hooks/friends/useFriendList.js` ve onu kullanan üç hook. Mevcut uçlar `GET /api/friends/list`, `GET /api/friends/requests`, `GET /api/friends/sentRequests`. Ortak hook yükleme, hata, eski isteği iptal etme ve yeniden bağlantıda yenileme davranışını sağlar.
- Eylemler: mevcut gönderme, yanıtlama, iptal ve çıkarma hook'ları. Yeni kişiye istek gönderme akışı 06'da kalır. “Mesaj” mevcut `useConversation` seçimini kullanır; bu yerleşim seçenekleri için yeni endpoint gerekmez.
- Anlık güncellemeler: `useListenFriendEvents.js`. Aynı değişiklik hem HTTP cevabından hem socket olayından gelirse listede çift kayıt oluşmamalıdır. Eski bir liste yanıtı, daha yeni bir kabul/ret/iptal sonucunu geri almamalıdır. Hesap değişiminde önceki hesabın yanıtı yeni hesaba yazılmamalıdır.
- Bileşenler: arama için Atlaskit Textfield, avatar için mevcut güvenli avatar yaklaşımı, işlemler için Button/IconButton; A veya C'de Tabs. Yükleme ve hatada uygun Spinner/SectionMessage kullanılır. İkonlar [ikon kontratındaki](./icons.md) `comment` ve `person-remove` karşılıklarına taşınır.
- Temizlik: yalnız seçilen düzenin artık kullanmadığı özel sekme/kart CSS'si kaldırılır; aynı stilleri kullanan diğer ekranlar korunur. Son `react-icons` kullanımı gerçekten kalktıysa bağımlılık kaldırılır; yeni ikon paketi eklenmez.
- Backend: ilgili liste ve eylem kodları, dönen alanlar ve sorgular okunur. Doğrulanmış bir sorun varsa bu adımda düzeltilir; yalnızca olası büyüme için yeni cache veya sayfalama sistemi kurulmaz.

## Tamamlandı sayılmadan önce doğrulanacaklar

1. Üç grubun doğru kişilerle görünmesi, Türkçe arama ve boş liste/arama sonucu yok ayrımı.
2. Kabul, ret, iptal ve çıkarma işlemlerinin doğru hedefte çalışması; hata ve tekrar tıklamada yanlış veya çift işlem oluşmaması.
3. Mevcut sohbeti ve ilk mesaj taslağını açma; masaüstünde sağ sohbet alanı, mobilde liste/sohbet geçişi.
4. Socket güncellemeleri, bağlantı kesilip gelmesi, tekrar deneme ve geciken yanıtların güncel listeyi bozmaması.
5. Hesap değişimi ve eski isteklerin iptali; önceki hesaba ait kişilerin yeni oturumda görünmemesi.
6. Klavye, görünür odak, açık/koyu tema, yoğunluk ve yazı boyutu tercihleri; uzun isimler ve dar mobil ekran.
7. Build/lint ve ilgili smoke/realtime/UI kontrolleri; seçilen düzenin masaüstü/mobil ekran görüntüleri ve gerçek sonuçların bu belgeye eklenmesi.

## Uygulama ve doğrulama kaydı

- Tümü/Gelen/Giden, `@atlaskit/tabs@21.2.5` ile klavye erişimli sekmelere taşındı; kurulumda React 18.2/19 peer aralığı doğrulandı. Arama seçili grupta Türkçe harf dönüşümü kullanır ve sekme değişiminde korunur. Kabul sonrası Gelen açık kalır.
- Textfield, ChatAvatar, Button, Spinner ve SectionMessage kullanılır. Kişi bilgisi ve eylemler sığmadığında alt satıra geçer. Tema, accent, yoğunluk ve yazı boyutu mevcut tokenlardan gelir. Liste yenilenirken mevcut kişiler korunur; ilk yükleme, boş liste, sonuç yok ve gruba özgü hata/retry ayrıdır.
- Tek lazy RemoveFriendModal kişi adı/avatarı, “Sohbet geçmişi korunacak.” açıklaması ve Vazgeç/Çıkar eylemlerini gösterir. İlk odak Vazgeç; pending sırasında kapanış ve tekrar gönderim engelli; hata içeride kalır. İptalde tetikleyiciye, kaldırılan satırdan sonra kalan satıra/aramaya odak döner.
- Üç mutation hook'u ortak `useFriendMutation` ile hedefe bağlı pending/hata, eşzamanlı kilit ve abort davranışını paylaşır. Liste ve sohbet başlığındaki kabul aynı yolu kullanır; başlık hatası başka kişiye taşınmaz. Başarı sonrası canonical listeler yeniden alınır; gecikmiş HTTP başarısı eski kişiyi doğrudan geri eklemez.
- `friendListVersion` HTTP/socket değişikliğinde artar. Eski snapshot uygulanmaz, mevcut liste hook'ları yeniden yükler. Hesap reset'i de sürümü ilerletir. `friendListsChanged` iki hesabın tüm bağlı oturumlarına gider; kabulde mevcut `conversationAccepted` olayı kabul eden hesabın diğer sekmelerindeki mesaj isteklerini de yeniler.
- Kabul/ret/iptal yarışlarında koşullu DB geçişi tek kararı korur. Kabul niyeti isteğe opsiyonel `acceptanceStarted` alanıyla yazılır; idempotent arkadaşlık/konuşma yazmaları tamamlanana kadar istek pending kalır. DB hatasında yeniden kabul eksik yazmaları tamamlar; bu sırada ret/iptal kabul niyetini değiştiremez. Eski kayıtlar için backfill yoktur.
- Tek uygulama sürecinde kişi çifti başına aktif kabul/çıkarma korunur; çakışan işlem 409 döner. Çıkarma, yarım kalmış kabul niyetini de sonlandırır; eski kabulün tekrar denenmesi yeni çıkarmayı geri alamaz. Çoklu uygulama kopyası desteklenmiş sayılmaz. REST yolları ve başarılı yanıt zarfları korundu.
- Son iki ikon `comment`/`person-remove` oldu; kaynakta kullanım kalmadığı doğrulanarak `react-icons` kaldırıldı. Diğer ekranların `.person-card` stilleri korundu; Lucide eklenmedi.

### Kanıt

`npm run test:friends`, mevcut Node assertion ve Playwright altyapısını kullanır; `test:all` ve CI'a eklendi. Geçici MongoDB 7 ve production Chromium kullanıldı.

- **58 UI kontrolü:** masaüstü/mobil; üç grup/Türkçe arama; kabul/ret/iptal; modal iptal/hata/pending/odak; sohbet geçmişinin iki tarafta korunması; iki sekme, reconnect, gecikmiş snapshot, hesap değişimi; mevcut sohbet/taslak; klavyeli sekmeler; açık/koyu, mor accent, büyük yazı/kompakt yoğunluk ve 320 px uzun isimler.
- **36 eşzamanlı backend turu:** kabul/kabul, kabul/ret ve kabul/iptal; sahiplik ve girdi doğrulaması. Arkadaşlık ve konuşma yazmalarına hata enjeksiyonu, kabulün yeniden denenmesi, kısmi kabulden sonra çıkarma ve aktif kabul/çıkarma çakışması ayrıca geçti.
- Store testi eski liste yanıtı, çift kayıt ve hesap reset'ini doğruladı. Üç liste için en fazla iki DB okuması ve public kişi alanları; gelen/giden sorgularında `IXSCAN` doğrulandı. Payload uzunlukları test çıktısında ölçülür; sentetik kayıt ölçümüdür, üretim performans iddiası değildir.
- Build/lint ve `npm run test:all` geçti. Tam zincir 57 arkadaşlık UI kontrolünü içerdi; son hedefe bağlı sohbet hatası kontrolü eklendikten sonra UI **58/58**, son backend kurtarma kontrolleri de tekrar geçti. Mevcut >500 kB ana bundle uyarısı sürer; uzak CI/deploy çalıştırılmadı.
- İncelenen görüntüler: masaüstü açık, mobil koyu. Mobil klavye/gerçek cihaz testi iddia edilmez.

05 tamamlandı. Sonraki modül **06 — Yeni sohbet / kişi bulma** için ayrı tasarım seçimidir.
