# 06 — Yeni sohbet / kişi bulma

**Durum: tasarım seçilmedi, uygulama başlamadı.** 27 Eylül 2026'da yalnızca açıklamalar detaylandırıldı. Kullanıcının isteği gereği bu açıklama aşamasında soru sorulmaz; tasarım seçimi plan modundaki görüşmeye bırakılır. A seçeneği öneridir, onaylanmış karar değildir.

## Bu adım hangi ekranı değiştiriyor?

**Yeni sohbet** düğmesine basınca açılan kişi bulma ekranını ele alıyoruz. Burada kullanıcı adı veya arkadaş kodu girerek uygulamadaki birini bulur, ona arkadaşlık isteği gönderir ya da sohbetini açarsın. [05 — Arkadaşlar](./05-friends.md) içindeki arama yalnızca mevcut listeleri filtreler; buradaki arama sunucudan kullanıcı sonuçları getirir.

Bugün arama sol panelin içinde açılıyor. Sonuç kartında kişinin avatarı, tam adı, kullanıcı adı, arkadaş kodu ve **Arkadaş ekle / Mesaj gönder** düğmeleri bulunuyor. Bu adım, ekranın nerede açılacağını ve sonuçların nasıl sunulacağını belirler.

**“Mesaj gönder” düğmesi mevcut davranışta yalnızca sohbet alanını açar.** Hazır bir mesaj göndermez. Kişiyle sohbetin varsa mevcut geçmiş açılır; yoksa ilk mesajı yazabileceğin taslak sohbet seçilir. Taslağı açıp çıkmak, tek başına karşı tarafa mesaj veya arkadaşlık isteği göndermez. Görünen düğme metni de bu ayrımı açık anlatmalıdır.

## A — Sol panel içinde arama ve sonuç listesi

Yeni sohbet'e basınca sol panelin içeriği arama alanı ve kişi sonuçlarına dönüşür. Masaüstünde sağdaki mevcut sohbet alanı görünür kalır. Sonuçtan bir kişinin sohbetini açınca sağ alan o kişiye geçer; sol panel sohbet listesine döner. Mobilde arama ekranı genişliği kullanır, kişi seçildiğinde sohbet ekranına geçilir.

Aşağıdaki şemalar temsilidir; köşeli parantezler düğmeleri gösterir. Ölçüler ve düğme metinleri son tasarım kararı değildir.

```text
Sol panel                 Sağ sohbet alanı
Yeni sohbet               Açık olan sohbet
Kullanıcı adı / kod        görünür kalır.
[ ecedemir           ]

(Avatar) Ece Demir
@ecedemir · #ABC123
[Arkadaş ekle] [Sohbet aç]
```

Örneğin Deniz'le yazışırken Ece'yi ararsın. Ece'ye yalnızca arkadaşlık isteği gönderirsen Deniz'in sohbetini değiştirmene gerek kalmaz. Ece'nin sohbetini açmayı seçersen sağdaki konuşma Ece'ye geçer.

**Kazancı:** Mevcut iki sütunlu yapıya ve bugünkü kullanım akışına yakındır; yeni bir pencere açmadan arama yapılır. **Karşılığı:** Masaüstündeki 320 px sol panel uzun isimlere ve birden fazla düğmeye az alan bırakır. Düğmeler gerektiğinde alt satıra geçer. A'nın önerilme nedeni mevcut yapıyı koruyarak kişi bulmayı sohbet akışının içinde tutmasıdır.

## B — Açılır arama penceresi

Yeni sohbet'e basınca mevcut ekranın üzerinde bir arama penceresi açılır. Arama alanı ve sonuçlar bu pencerenin içindedir; arkadaki sohbet kapanmaz, ancak pencere açıkken etkileşim arama alanında kalır. Sonuçtan sohbet açınca pencere kapanır ve seçilen kişinin sohbetine geçilir. Pencereyi sonuç seçmeden kapatırsan önceki ekrana dönersin.

```text
Arka planda mevcut ekran
    ┌──────────────────────────────┐
    │ Kişi bul             [Kapat] │
    │ Kullanıcı adı / arkadaş kodu │
    │ [ ecedemir                 ] │
    │                              │
    │ Ece Demir · @ecedemir         │
    │ [Arkadaş ekle] [Sohbet aç]    │
    └──────────────────────────────┘
```

Masaüstünde sol panelden daha geniş bir alan kullanılabilir. Mobilde pencere ekran sınırlarına uyarlanır; klavye açıldığında arama alanı, kapatma düğmesi ve kaydırılabilir sonuçlar erişilebilir kalır.

**Kazancı:** Kişi bulma işi ayrı ve odaklanmış bir alanda yapılır; arkadaki ekranın düzenini değiştirmez. **Karşılığı:** Kullanıcı arama bitene kadar arka ekrana erişemez. Açılışta odak aramaya geçmeli, Tab pencere içinde dolaşmalı ve Escape/kapatma sonrası odak açan düğmeye dönmelidir. “Konumdan bağımsız” aynı pencerenin mevcut giriş noktasından açılabilmesidir; yeni kısayollar veya ek giriş düğmeleri bu seçenekle otomatik olarak kapsam kazanmaz.

## C — Çalışma alanını kullanan ayrı arama görünümü

Yeni sohbet, sohbet/listenin bulunduğu ana çalışma alanında daha geniş bir arama görünümü açar. Bu, tarayıcıda yeni sekme açmak veya profil sayfasına gitmek değildir. Arama boyunca mevcut sohbet aynı anda görünmez; görünür bir geri eylemiyle önceki görünüme dönülür.

```text
[Geri]  Yeni sohbet
Kullanıcı adı veya arkadaş kodu
[ ecedemir                                      ]

(Avatar) Ece Demir · @ecedemir · #ABC123
                         [Arkadaş ekle] [Sohbet aç]
```

Sonuçlar daha geniş satırlarda gösterilebilir; ad, kullanıcı adı, kod ve düğmeler daha az sıkışır. Mobilde tek sütun arama ekranı olarak çalışır; masaüstündeki genişlik avantajı azalır. Bir sonuçtan sohbet açınca arama görünümünden seçilen sohbete geçilir.

**Kazancı:** Uzun kişi bilgileri ve büyük yazı tercihi için en fazla alanı sağlar. **Karşılığı:** Kısa bir kişi arama işi için kullanıcı sohbet görünümünden tamamen ayrılır; geri dönüş ve gezinme davranışı daha belirgin bir tasarım gerektirir. Daha geniş alan, daha fazla kullanıcı verisi veya yeni profil özellikleri eklemek anlamına gelmez.

## Seçeneklerin doğrudan karşılaştırması

| Karşılaştırma          | A — Sol panel             | B — Açılır pencere                | C — Ayrı geniş görünüm  |
| ---------------------- | ------------------------- | --------------------------------- | ----------------------- |
| Arama nerede?          | Mevcut sol panelde        | Ekranın üzerinde                  | Ana çalışma alanında    |
| Mevcut sohbet          | Masaüstünde görünür kalır | Arkada kalır, etkileşim kapalıdır | Arama boyunca görünmez  |
| Sonuçlara ayrılan alan | Dar                       | Pencerenin genişliği kadar        | Çalışma alanı kadar     |
| Seçim yapmadan dönüş   | Mevcut gezinmeden         | Pencereyi kapatarak               | Geri eylemiyle          |
| Mobilde                | Liste görünümü → sohbet   | Ekrana uyarlanan pencere → sohbet | Arama görünümü → sohbet |
| Öncelik                | Mevcut akışta hızlı arama | Aramaya odaklanma                 | Sonuçlara daha çok alan |

## Arama ve düğmelerin anlamı

| İşlem veya durum               | Açıklama                                                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kullanıcı adıyla arama         | Tam ad araması değildir. Örneğin görünen adı “Ece Demir” olan birini `ecedemir` kullanıcı adıyla ararsın.                                                                                 |
| Arkadaş koduyla arama          | Kişinin paylaştığı kod kullanılır. Arayüzde kodun önünde gösterilen `#`, mevcut sunucunun kabul ettiği arama karakterlerinden biri değildir; yardımcı metin bunu belirsiz bırakmamalıdır. |
| En az 2 karakter               | Baş/son boşluklar çıkarıldıktan sonra en az iki karakter olduğunda arama başlar. Her tuşta hemen istek gönderilmez; yazmaya kısa ara verilmesi beklenir.                                  |
| Sonuçların kapsamı             | Mevcut sunucu en fazla 20 eşleşme döndürür ve kendi hesabını sonuçlardan çıkarır. Ekran bütün kullanıcıların eksiksiz dizini gibi sunulmaz.                                               |
| Arkadaş ekle                   | Karşı tarafa arkadaşlık isteği gönderir; kişi hemen arkadaşın olmaz. Başarılı istek 05'teki Giden listesinde takip edilir.                                                                |
| Zaten arkadaş / bekleyen istek | Aynı kişiye tekrar istek gönderilmiş gibi başarı gösterilmez. Mevcut ilişki veya bekleyen istek anlaşılır biçimde belirtilir.                                                             |
| Sohbet açma                    | Mevcut konuşmayı veya ilk mesaj taslağını seçer. Arkadaşlık isteğinden ayrı bir eylemdir.                                                                                                 |

Mevcut sunucu arama metninde Latin harfleri, rakam ve alt çizgi kabul ediyor; üst sınır 20 karakter. Önceki kısa metindeki “Türkçe karakterler” kontrolü, Türkçe harflerle aramanın zaten desteklendiği anlamına gelmez. Geçersiz girişin anlaşılır Türkçe açıklama vermesi ve arayüz/sunucu kurallarının tutarlı olması doğrulanacak. Bu tasarım seçenekleri arama kapsamını kendiliğinden genişletmez.

## Tema, hata ve erişilebilirlik

Arama, avatarlar, düğmeler, sonuç yüzeyleri ve varsa pencere açık/koyu temaya ve seçilen vurgu rengine uyar. Rahat/kompakt yoğunluk ve büyük yazı tercihi korunur. Uzun isimlerde düğmeler ekran dışına itilmez; mobilde yatay taşma oluşmaz.

| Ekran durumu                       | Kullanıcıya anlatılacak bilgi                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Boş veya kısa sorgu                | Aramaya başlamak için en az iki karakter gerektiği.                             |
| Arama sürüyor                      | Sonuçların henüz gelmediği; bu sırada “Kullanıcı bulunamadı” gösterilmez.       |
| Sonuç yok                          | Geçerli sorguyla eşleşen kullanıcı bulunamadığı.                                |
| Geçersiz sorgu                     | Hangi giriş kuralının karşılanmadığı; ağ hatası veya boş sonuç gibi anlatılmaz. |
| Ağ/sunucu hatası                   | Aramanın tamamlanamadığı ve yeniden denenebileceği; yazılan sorgu korunur.      |
| İstek gönderiliyor / gönderilemedi | Hangi kişiye işlem yapıldığı ve başarısızsa yeniden denenebileceği.             |

Kullanıcı hızlıca farklı bir isim yazarsa eski aramanın geç gelen sonucu yeni sonuçları değiştirmemelidir. Klavyeyle arama alanından sonuç eylemlerine geçilebilmeli, odak görünür kalmalı ve hesap değişiminde önceki hesabın sonuçları taşınmamalıdır.

## Uygulama sırasında bakılacak mevcut parçalar

Bu bölüm geliştirme notudur; uygulama veya test sonucu değildir.

- Ekran `frontend/src/components/sidebar/views/AddFriend.jsx`, giriş noktası `Sidebar.jsx` içindedir. A'da mevcut alan dönüştürülür; B veya C'de seçilen yerleşime taşınır.
- `hooks/friends/useSearchUsers.js`: 350 ms bekleme, trim edilmiş en az 2 karakter, eski isteğin iptali ve `GET /api/friends/search?query=…`. Arayüz durumlarının da aynı normalize edilmiş sorguyu esas alması kontrol edilir.
- Sunucu `backend/controller/friend.controller.js` içinde arama sınırlarını ve dönen kullanıcı alanlarını belirler. Özel hesap verilerinin sonuçlara sızmaması korunur.
- `useSendFriendRequest` → `POST /api/friends/send/:id`; sonuçtan sohbet seçimi → `useConversation`. Yeni arama endpoint'i gerekmez.
- Taslak sohbet ile gerçek konuşma ayrımı korunur. `chatOpened` olayı gerçek konuşmalar için kullanılır; kişi sonucuna tıklamak tek başına yeni konuşma veya mesaj üretmez.
- Atlaskit Textfield/Avatar/Button ve B seçilirse Modal kullanılır. Mevcut güvenli avatar davranışı korunur. Eski silinmiş SearchModal/SearchInput dosyaları sırf adları uygun diye geri getirilmez.

## Tamamlandı sayılmadan önce doğrulanacaklar

1. Boş, bir ve iki karakterli giriş; baş/son boşluk, kullanıcı adı, arkadaş kodu, geçersiz karakter ve uzunluk sınırı.
2. Hızlı sorgu değişimi, geç gelen yanıt, sonuç yok ve hatadan yeniden deneme.
3. Arkadaşlık isteği gönderme, zaten arkadaş olma, iki yönde bekleyen istek ve tekrar tıklama.
4. Mevcut sohbeti açma, ilk mesaj taslağını açıp çıkma ve gerçekten ilk mesajı gönderme arasındaki fark.
5. Hesap değişimi, klavye/odak, mobil klavye, açık/koyu tema, yoğunluk ve büyük yazı.
6. Build/lint ve ilgili smoke/UI kontrolleri; seçilen ekranın masaüstü/mobil görüntüleri ve gerçek sonuçların kaydı.

Tasarım seçimi ve uygulama ayrı aşamalardır. 06 tamamlanıp doğrulandıktan sonra 07'ye geçilir.
