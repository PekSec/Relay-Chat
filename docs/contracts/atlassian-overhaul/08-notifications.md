# 08 — Bildirimler

**Durum: adıma özel tasarım seçilmedi.** Ortak popup/boşluk planı kapsamında mevcut görünüm düzeltildi; aşağıdaki işlev seçenekleri ayrıca bekliyor. İlk açıklama aşamasından sonra 27 Eylül 2026 ortak görsel düzeltmeleri onaylandı ve uygulandı. Aşağıdaki adıma özel A seçeneği ise öneridir, onaylanmış karar değildir.

## Bu adım hangi alanı değiştiriyor?

Sol panelin altındaki hesap bölümünde bulunan **zil düğmesini** ve ona basınca açılan bildirim alanını ele alıyoruz. Bugün bu alanda sana gelen arkadaşlık istekleri ile gelen mesaj istekleri kişi bazında listeleniyor. Birine tıklamak ilgili istek ekranına götürüyor.

Buradaki “bildirim”, geçmişte yaşanan bütün olayların kaydı değildir. Mevcut sistem, şu anda işlem bekleyen iki listenin özetini gösterir:

| Kaynak                     | Örnek                                   | Açılacak yer                                    |
| -------------------------- | --------------------------------------- | ----------------------------------------------- |
| Gelen arkadaşlık istekleri | Ece sana arkadaşlık isteği gönderdi.    | [05 — Arkadaşlar](./05-friends.md), Gelen grubu |
| Gelen mesaj istekleri      | Deniz'in bekleyen bir mesaj isteği var. | [07 — Mesaj istekleri](./07-requests.md)        |

Gönderdiğin arkadaşlık istekleri, normal sohbetlerdeki her yeni mesaj ve geçmişte kabul ettiğin istekler bu zil listesinin ayrı kayıtları değildir. Bildirim geçmişi, okundu arşivi, telefon/tarayıcı push aboneliği ve yeni bir bildirim veritabanı bu adımın kapsamına girmez.

## Zildeki sayı tam olarak neyi gösteriyor?

Sayı, **gelen arkadaşlık isteği sayısı + gelen mesaj isteği sayısıdır**. Örneğin iki arkadaşlık isteği ve bir mesaj isteği varsa zil üzerinde **3** görünür. O mesaj isteğinin içinde beş mesaj olması sayıyı **7** yapmaz; bekleyen konuşma bir istek olarak sayılır. Aynı kişi hem arkadaşlık hem mesaj isteği göndermişse iki farklı işlem beklediği için iki kayda katkı verebilir.

Paneli açmak veya bir satıra bakmak sayıyı sıfırlamaz. İstek kabul edildiğinde, arkadaşlık isteği reddedildiğinde ya da mesaj isteği gizlendiğinde ilgili listeden çıkan kayıt sayıyı azaltır. Dolayısıyla bu rozet **okunmamış mesaj sayacı değildir**. Sayı ancak kaynak listeler başarıyla yüklenmişse kesin bilgi olarak sunulabilir.

## A — Zile bağlı küçük açılır panel

Zile basınca düğmenin yakınında küçük bir panel açılır. Her satırda kişinin avatarı, adı ve isteğin türünü anlatan kısa metin bulunur. Uzun listede panelin içi kayar; bütün sayfa uzamaz. Bu seçenekte mevcut kişi bazlı özet korunur ve açılma/kapanma davranışı standart Popup bileşeniyle düzenlenir.

Aşağıdaki şemalar temsilidir; köşeli parantezler düğmeleri gösterir. Kesin ölçüler ve son metinler değildir.

```text
               ┌─────────────────────────────┐
               │ Bildirimler (3)             │
               │ Ece Demir                   │
               │ Arkadaşlık isteği gönderdi  │
               │ Ayşe Yılmaz                 │
               │ Arkadaşlık isteği gönderdi  │
               │ Deniz Kaya                  │
               │ Mesaj isteği gönderdi       │
               └─────────────────────────────┘
Hesap bilgisi                  [Zil · 3]
```

Ece satırına tıklayınca panel kapanır ve arkadaşların Gelen grubu açılır. Deniz satırına tıklayınca mesaj istekleri görünümü açılır. Mevcut yönlendirme ilgili **listeye** gider; tıklanan kişinin isteğini otomatik açan yeni bir davranış bu açıklamayla onaylanmış sayılmaz.

**Kazancı:** Kimin ne gönderdiğine bulunduğun yerden kısa bir bakış atabilirsin. Mevcut zil davranışına en yakın seçenektir. **Karşılığı:** Dar ekranda ve büyük yazıda kişi bilgileri sıkışabilir; panelin kenarlardan taşmaması ve iç kaydırmanın kullanılabilir olması gerekir. A'nın önerilme nedeni bu alanın kısa bir özet ve yönlendirme işi yapmasıdır.

## B — Bildirimleri açılır pencerede gösterme

Zile basınca ekranın üzerinde başlığı, kapatma düğmesi ve kaydırılabilir kişi listesi olan bir pencere açılır. İçerik A ile aynıdır; değişen şey ona ayrılan alan ve etkileşim biçimidir. Pencere açıkken arka ekrandaki işlemlere erişilmez.

```text
┌──────────────────────────────────┐
│ Bildirimler (3)          [Kapat]  │
│                                  │
│ (Avatar) Ece Demir                │
│          Arkadaşlık isteği        │
│                                  │
│ (Avatar) Ayşe Yılmaz              │
│          Arkadaşlık isteği        │
│                                  │
│ (Avatar) Deniz Kaya               │
│          Mesaj isteği             │
└──────────────────────────────────┘
```

Bir bildirim seçilince pencere kapanır ve ilgili istek listesine gidilir. Kapat veya Escape ile çıkıldığında önceki ekran korunur ve odak zile döner. Mobilde pencere kullanılabilir ekran alanına uyarlanır; içerik kendi içinde kaydırılır.

**Kazancı:** Uzun isimler, büyük yazı ve çok sayıda istek için A'ya göre daha rahat alan sağlar. **Karşılığı:** Basit bir bildirim kontrolü için kullanıcıyı sohbetten daha belirgin biçimde ayırır; arka ekranla etkileşim için pencereyi kapatmak gerekir. Daha büyük pencere, yeni bildirim türleri veya geçmiş kaydı eklemek anlamına gelmez.

## C — Kişileri göstermeyen, iki bağlantılı sayılı menü

Zile basınca tek tek kişilerin yerine yalnız iki kategori gösterilir: **Arkadaşlık istekleri** ve **Mesaj istekleri**. Her kategorinin yanında kendi sayısı bulunur. Kişilerin adını ve isteğin ayrıntısını görmek için ilgili bağlantıya basılır.

```text
┌───────────────────────────────┐
│ Arkadaşlık istekleri       2   │
│ Mesaj istekleri            1   │
└───────────────────────────────┘
                      [Zil · 3]
```

Örneğin zil toplam 3 gösterirken menüyü açıp bunların ikisinin arkadaşlık isteği olduğunu görürsün. Kimlerin gönderdiğini öğrenmek için Arkadaşlık istekleri'ne basarsın. Menü kapanır ve Gelen listesi açılır.

**Kazancı:** En az alanı kullanır; 05 ve 07'de zaten bulunan kişi listelerini bildirim alanında tekrar etmez. Dar mobil ekran ve büyük yazıda daha kolay sığar. **Karşılığı:** Zili açar açmaz kimin istek gönderdiğini göremezsin; bunu öğrenmek için ilgili listeye geçmen gerekir. Liste uzunluğu menüyü büyütmez, yalnızca sayılar değişir.

## Seçeneklerin doğrudan karşılaştırması

| Karşılaştırma                | A — Küçük panel             | B — Açılır pencere                 | C — Sayılı menü                     |
| ---------------------------- | --------------------------- | ---------------------------------- | ----------------------------------- |
| İlk açılışta ne görünür?     | Kişiler ve istek türleri    | Kişiler ve istek türleri           | İki kategori ve sayıları            |
| Kimin gönderdiği görünür mü? | Evet                        | Evet                               | İlgili listeye gidince              |
| Kapladığı alan               | Zile bağlı sınırlı alan     | Daha geniş pencere                 | İki bağlantılık alan                |
| Çok istekte                  | Panel içi kaydırma          | Pencere içi kaydırma               | Yalnız sayılar büyür                |
| Arka ekran                   | Panel dışında görünür       | Görünür, etkileşim kapalı          | Menü dışında görünür                |
| Mobilde temel konu           | Kenarlardan taşmayı önlemek | Pencere ve iç kaydırmayı uyarlamak | Bağlantı ve sayıların rahat sığması |
| Öncelik                      | Hızlı kişi önizlemesi       | Bildirimleri daha rahat okumak     | İlgili listeye kısa yoldan gitmek   |

Üç seçenek de aynı bekleyen istek verilerini kullanır. Hiçbiri tek başına geçmiş kaydı, okundu sistemi veya yeni bildirim türü eklemez.

## Üç seçenekte de korunacak davranışlar

| Durum veya işlem                      | Beklenen sonuç                                                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Toplam sıfır                          | Zilde sayı rozeti görünmez. A/B'de bekleyen istek olmadığını anlatan boş durum; C'de boşluğu açık anlatan kategori durumu bulunur.        |
| Henüz yüklenmedi                      | “Bildirim yok” sonucu çıkarılmaz; gerekli listelerin yüklenmekte olduğu belirtilir.                                                       |
| Kaynaklardan biri yüklenemedi         | Kesin toplam veya tamamen boş liste izlenimi verilmez. Sorun ve tekrar deneme yolu anlaşılır; diğer kaynakta yüklenmiş bilgi kaybedilmez. |
| Arkadaşlık kaydına/kategorisine basma | Açılır alan kapanır ve 05'in Gelen grubu açılır.                                                                                          |
| Mesaj kaydına/kategorisine basma      | Açılır alan kapanır ve 07'nin mesaj istekleri listesi açılır.                                                                             |
| İstek sonuçlandı                      | Kaynak listeden çıkan kayıt ve toplam sayı birlikte güncellenir. Yalnız paneli açmak isteği sonuçlandırmaz.                               |
| Yeni socket olayı                     | Kaynak liste ve sayaç yenilenir; aynı olay ikinci bir kayıt üretmez.                                                                      |
| Bağlantı geri geldi                   | Mevcut ortak liste yenilemesiyle bekleyen istekler güncellenir.                                                                           |

Bugünkü panel arkadaşlık kayıtlarını ve ardından mesaj kayıtlarını birleştirir. Bunu “en yeni olay en üstte” çalışan kronolojik bir bildirim geçmişi gibi anlatmamak gerekir. Seçenekler yeni bir tarih sıralama veya geçmiş saklama sistemi vaat etmez.

## Tema, tercihler ve erişilebilirlik

Panel/pencere yüzeyi, satırlar, rozet, avatar ve düğmeler açık/koyu temaya, vurgu rengine, yoğunluğa ve yazı boyutuna uyar. Özellikle alt köşedeki zilin açtığı alanın ekran dışına taşmaması; uzun isimlerin ve büyük yazının menüyü kullanılamaz hale getirmemesi gerekir.

Zil düğmesinin erişilebilir adı sayı varsa onu da taşır; örneğin “Bildirimler (3)”. Açık/kapalı durumu doğru bildirilir. Escape ile kapanma, dış alana tıklamayla kapanma ve uygun odak yönetimi kontrol edilir. Pencere/menü iptal edilerek kapatılırsa odak zile döner; bir yönlendirme seçildiyse kullanıcı yeni görünümde anlamlı bir başlangıç noktasına ulaşmalıdır. B'de klavye odağı pencere açıkken onun içinde kalır.

Mevcut satırlar mesaj gövdesi yerine kişi ve istek türünü gösterir. İleride seçilen tasarımda kısa mesaj metni kullanılacaksa **mesaj önizlemeleri kapalıyken bu içerik gizlenir**. Kişinin bilerek açtığı sohbetin içeriğiyle bildirim önizlemesi birbirine karıştırılmaz.

Bildirim sesi tercihi kapalıyken ses çalınmamalıdır. Panel açmak, listeleri yeniden yüklemek veya aynı olayı ikinci kez almak yeni bir bildirim sesi üretme gerekçesi değildir. Var olan ses davranışı merkezi tercih kontrolünden geçer; bu adım her bildirim türüne yeni bir ses ekleme kararı değildir.

## Uygulama sırasında bakılacak mevcut parçalar

Bu bölüm geliştirme notudur; uygulama veya test sonucu değildir.

- Zil ve mevcut özel panel `frontend/src/components/sidebar/UserInfo.jsx` içindedir. Zil ikonu, IconButton ve Tooltip 04'te taşınmıştır; burada panelin içeriği ve etkileşimi ele alınır.
- `useFriendStore` içindeki `incomingFriendRequests` ve `messageRequests` verileri kullanılır. Toplam bu iki listenin uzunluğundan türetilir; ayrı bildirim endpoint'i veya aynı veriyi tekrar getiren hook yazılmaz.
- Yükleme/hata/tekrar deneme bilgisi mevcut `Sidebar.jsx` liste hook'larından gelir. `UserInfo` yalnız boş dizilere bakarak kaynakların başarıyla yüklendiğini varsaymamalıdır; gerekli durum bilgisi mevcut akıştan taşınır.
- `onNotificationClick` arkadaşlık bildirimini arkadaşlar/Gelen hedefine, mesaj bildirimini mesaj isteklerine yönlendirir. 05 veya 07'nin seçilen düzeni değişirse aynı anlamdaki hedef korunur.
- A için Atlaskit Popup, B için Modal, C için uygun menü bileşeni; içerikte gerektiği kadar Avatar/Button/Badge kullanılır. Her seçenekte bütün bu bileşenleri eklemek gerekmez.
- Özel document olay dinleyicileri ve panel CSS'si, seçilen bileşenin karşıladığı davranışlar ölçüsünde kaldırılır. Eski silinmiş NotificationModal dosyası geri getirilmez; seçilen bileşenle gerekli en küçük yapı kurulur.
- Ses mevcut merkezi tercih kontrolünü kullanır. İstekler ve bildirimler aynı veri kaynağına bağlı kalır; kabul/ret/gizleme sonrası birbirinden farklı sayaçlar tutulmaz.

## Tamamlandı sayılmadan önce doğrulanacaklar

1. Sıfır, tek ve çok istek; iki türün toplamı; bir konuşmadaki çok mesajın ayrı bildirimler gibi sayılmaması.
2. Paneli açmanın sayıyı azaltmaması; kabul, ret ve gizleme sonrası kaynak listeyle sayacın birlikte güncellenmesi.
3. Her iki yönlendirme ve 05/07'nin seçilen düzenleriyle uyumu.
4. Socket olayları, tekrar gelen olay, yeniden bağlantı ve hesap değişiminde eski verinin temizlenmesi.
5. Yükleme, tek kaynağın hatası, tamamen boş durum ve tekrar denemenin birbirinden ayrılması.
6. Escape, dış tıklama, zil odağı, yönlendirme sonrası odak ve B'de pencere içi klavye dolaşımı.
7. Dar ekran, uzun isim, büyük yazı, açık/koyu tema, yoğunluk ve mesaj önizleme tercihi; bildirim sesi kapalı durumu.
8. Build/lint ve ilgili realtime/UI kontrolleri; masaüstü/mobil görüntüleri ve gerçek sonuçların kaydı.

Tasarım seçimi ve uygulama ayrı aşamalardır. 08 tamamlanıp doğrulandıktan sonra genel geçiş envanteri gözden geçirilir: kalan `react-icons` kullanımları, arayüz simgesi olarak kullanılan Unicode karakterler ve Atlaskit karşılığı olan özel bileşenler kontrol edilir. Kullanıcı mesajları ve Frimousse emojileri bu ikon temizliğiyle karıştırılmaz. Bu kontrol tamamlanmadan bütün geçiş bitmiş sayılmaz; kalan işler açıkça kaydedilir.
