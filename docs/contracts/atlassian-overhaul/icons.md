# İkon geçişi ve Lucide planı

Başlangıç `react-icons` import envanteri aşağıdadır. Hedefler kurulu `@atlaskit/icon@38.0.1/core/*.d.ts` dosyalarından doğrulanmıştır. Tablodaki yolun önüne `@atlaskit/icon/core/` gelir; default export istenen yerel `…Icon` ismiyle import edilir. Doğrudan kullanım başlamadan paket doğrudan bağımlılık olarak bildirilmelidir.

| Kaynak | Mevcut yer | Atlaskit hedefi | Lucide ihtiyacı |
|---|---|---|---|
| `FaClock` | Conversation | `clock` | Yok |
| `FaBell` | UserInfo | `notification` | Yok |
| `FiMessageSquare` | Friends | `comment` | Yok |
| `FiUserMinus` | Friends | `person-remove` | Yok |
| `IoSettingsOutline` | UserInfo | `settings` | Yok |
| `IoSearch` | Sidebar, MessageContainer | `search` | Yok |
| `BiLogOut` | LogoutButton | `log-out` | Yok |
| `IoArrowDown` | Messages | `arrow-down` | Yok |
| `IoArrowBack` | MessageContainer | `arrow-left` | Yok |
| `IoSend` | MessageInput | `send` | Yok |
| `IoHappyOutline` | MessageInput, Message (04c'de kaldırıldı) | `emoji` (uygulandı) | Yok |
| `IoPencilOutline` | Message | `edit` | Yok |
| `IoTrashOutline` | Message, MessageContainer | `delete` | Yok |
| `IoClose` | SettingsModal, MessageContainer | `cross` | Yok |
| `IoCopyOutline` | SettingsModal | `copy` | Yok |
| `IoCheckmark` | SettingsModal | `check-mark` | Yok |
| `👁️` / `🙈` | Login parola göster/gizle | `eye-open` / `eye-open-strikethrough` | Yok; 02'de taşındı |
| Yeni görünürlük eylemleri | SignUp parola ve tekrar | `eye-open` / `eye-open-strikethrough` | Yok; 03'te aynı ikonlar kullanıldı |
| `TiMessages` | MessageContainer | `comment` | Yok |

`TiMessages` için birebir çift baloncuk şekli yerine aynı anlamı taşıyan resmî `comment` kullanılır; yalnız şekil farkı yeni ikon bağımlılığı gerekçesi değildir. İlk adımda ayarlar içindeki `IoClose`, `IoCopyOutline`, `IoCheckmark` kullanımları taşındı; yeni bölüm simgeleri de Atlaskit'ten gelir. Diğer satırlar ilgili ekranın onaylı adımında taşınır; `react-icons` bu nedenle henüz kaldırılmadı.

04a'da Message silme düğmesi `IconButton` + `@atlaskit/icon/core/delete` ile taşındı: standart 16 px ikon, butonda “Sil” erişilebilir adı. MessageContainer geçmiş temizleme simgesi 04b onayına kadar bekler. Mesaj düzenleme/tepki ve diğer ana sohbet ikonları bu adımda topluca taşınmadı; yeni Lucide ihtiyacı bulunmadı.

04b'de MessageContainer geçmiş temizleme düğmesi de aynı core `delete` + IconButton'a taşındı; erişilebilir adı “Sohbeti temizle”. Yeni modalın Avatar bileşeni kurulu `@atlaskit/avatar` kullanır. Böylece envanterdeki iki `IoTrashOutline` kullanımı kaldırıldı. Kalan ikonlar için sıra değişmedi; Lucide eklenmedi.

## Boyut, isim ve fallback

02 oturum yükleme/hata kartındaki `💬` dekorasyonu mevcut Relay logosuyla değiştirildi; yeni ikon veya emoji bağımlılığı eklenmedi.

- Yeni core API'de `size="medium"` **16 px**, `small` **12 px**. Legacy `medium=24px` bilgisi bu API'ye uygulanmaz. Standart eylemler 16 px; dokunma hedefi ikon boyutundan bağımsız en az 24 px, ürün butonlarında tercihen 40 px olur.
- Atlaskit glyph stroke'u dış CSS ile değiştirilmez. Metin yanında dekoratif ikon `label=""`; yalnız ikon butonunda butonun erişilebilir adı anlamı taşır. Semantik renk token'ı veya `currentColor` kullanılır.
- **Şu an Atlaskit'te karşılıksız ikon bulunmadı; Lucide paketi kurulmaz.** İleride gerçekten karşılıksız bir anlam çıkarsa aynı tabloya kaynak → `lucide-react` gerçek named export'u eklenip resmî katalogdan doğrulanır. Adlandırma `MeaningIcon`, boyut 16 px (20 px ancak ayrı büyük eylem bağlamında), `strokeWidth={2}`, `currentColor`; mümkünse statik import. [Lucide React belgesi](https://lucide.dev/guide/react).
- Son `react-icons` import'u taşındığında paket kaldırılır. Her modülde `rg 'react-icons' frontend/src` ile kalanlar yeniden envanterlenir; bu tablo paket kaldırıldı kanıtı değildir.

Kabul: simge anlamı/erişilebilir adı korunur, aynı satırdaki ikonlar tutarlı görünür, build gerçek export yolunu çözer. Tüm tablo satırları kurulu paket yoluyla doğrulanmış, geçiş uygulaması henüz topluca yapılmamıştır.

## 04 ana sohbet — 27 Eylül 2026

Conversation, UserInfo, Sidebar, LogoutButton, MessageContainer, Messages, MessageInput ve Message içindeki yukarıdaki hedefler uygulandı. `TiMessages` yerine `comment`; gönderimde `send`, düzenlemede `edit`, gezinmede `arrow-left`/`arrow-down`, aramalarda `search`, hesapta `settings`/`notification`/`log-out`, beklemede `clock` kullanılır. IconButton erişilebilir adları ve Tooltip'leri içerir. Okundu/iletildi çizimleri mevcut küçük SVG olarak kaldı; role=img ve Türkçe erişilebilir ad eklendi.

`rg 'react-icons' frontend/src` sonucunda yalnız 05 Friends içindeki `FiMessageSquare`/`FiUserMinus` kaldı. Bu ekranın ayrı kararı beklendiğinden `react-icons` bağımlılığı korundu. Lucide ihtiyacı yok.

## 05 arkadaşlar — 27 Eylül 2026

Friends içindeki son iki kullanım `comment` ve `person-remove` core ikonlarına taşındı. Butonlarda görünür Mesaj/Çıkar metinleri korunur. Kaynakta `react-icons` import'u kalmadığı doğrulandı; paket manifest ve lock dosyasından kaldırıldı. Build/lint ve arkadaşlık UI kontrolleri geçti. Lucide eklenmedi; 06–08 ekranlarının bileşen geçişi kendi tasarım seçimlerini bekler.
