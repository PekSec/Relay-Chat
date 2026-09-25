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
| `IoHappyOutline` | MessageInput, Message | `emoji` | Yok |
| `IoPencilOutline` | Message | `edit` | Yok |
| `IoTrashOutline` | Message, MessageContainer | `delete` | Yok |
| `IoClose` | SettingsModal, MessageContainer | `cross` | Yok |
| `IoCopyOutline` | SettingsModal | `copy` | Yok |
| `IoCheckmark` | SettingsModal | `check-mark` | Yok |
| `TiMessages` | MessageContainer | `comment` | Yok |

`TiMessages` için birebir çift baloncuk şekli yerine aynı anlamı taşıyan resmî `comment` kullanılır; yalnız şekil farkı yeni ikon bağımlılığı gerekçesi değildir. İlk adımda ayarlar içindeki `IoClose`, `IoCopyOutline`, `IoCheckmark` kullanımları taşındı; yeni bölüm simgeleri de Atlaskit'ten gelir. Diğer satırlar ilgili ekranın onaylı adımında taşınır; `react-icons` bu nedenle henüz kaldırılmadı.

## Boyut, isim ve fallback

- Yeni core API'de `size="medium"` **16 px**, `small` **12 px**. Legacy `medium=24px` bilgisi bu API'ye uygulanmaz. Standart eylemler 16 px; dokunma hedefi ikon boyutundan bağımsız en az 24 px, ürün butonlarında tercihen 40 px olur.
- Atlaskit glyph stroke'u dış CSS ile değiştirilmez. Metin yanında dekoratif ikon `label=""`; yalnız ikon butonunda butonun erişilebilir adı anlamı taşır. Semantik renk token'ı veya `currentColor` kullanılır.
- **Şu an Atlaskit'te karşılıksız ikon bulunmadı; Lucide paketi kurulmaz.** İleride gerçekten karşılıksız bir anlam çıkarsa aynı tabloya kaynak → `lucide-react` gerçek named export'u eklenip resmî katalogdan doğrulanır. Adlandırma `MeaningIcon`, boyut 16 px (20 px ancak ayrı büyük eylem bağlamında), `strokeWidth={2}`, `currentColor`; mümkünse statik import. [Lucide React belgesi](https://lucide.dev/guide/react).
- Son `react-icons` import'u taşındığında paket kaldırılır. Her modülde `rg 'react-icons' frontend/src` ile kalanlar yeniden envanterlenir; bu tablo paket kaldırıldı kanıtı değildir.

Kabul: simge anlamı/erişilebilir adı korunur, aynı satırdaki ikonlar tutarlı görünür, build gerçek export yolunu çözer. Tüm tablo satırları kurulu paket yoluyla doğrulanmış, geçiş uygulaması henüz topluca yapılmamıştır.
