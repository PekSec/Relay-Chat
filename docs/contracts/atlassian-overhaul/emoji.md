# Emoji picker kontratı — Frimousse

**Durum: 26 Eylül 2026 — Frimousse entegrasyonu.** Kullanıcının kararıyla geçici 13 emoji / 6 tepki seçicisi kaldırıldı. Mesaj alanı ve mesaj tepkileri aynı tam İngilizce kataloğu kullanır. Önceki Atlassian emoji görsel seti araştırması tarihsel kayıttır; bu entegrasyon Frimousse ve yerel Unicode gösterimini kullanır.

## Kaynak ve dağıtım

- Picker: [`frimousse@0.4.0`](https://frimousse.liveblocks.io/), MIT; React 18/19 desteği. Frontend manifest ve lock dosyasında tam sürüm sabittir.
- Veri: [`emojibase-data@17.0.0`](https://www.npmjs.com/package/emojibase-data/v/17.0.0), İngilizce `en/data.json` ve `en/messages.json`.
- Dosyalar `frontend/public/emoji/17.0.0/` altında upstream MIT lisansıyla saklanır. Kaynak URL ve güncelleme notları aynı dizindeki README'dedir.
- Frimousse paneli lazy yüklenir; veri yalnızca ihtiyaçta `/emoji/17.0.0/en/` üzerinden alınır ve Frimousse tarafından önbelleklenir. Harici CDN erişimi veya CSP genişletmesi yoktur.
- Backend aynı kaynak dosyalardan izin verilen tepkileri oluşturur. Docker runtime hem frontend derlemesini hem doğrulamada kullanılan katalog dizinini içerir.

## Arayüz

Masaüstünde mevcut Atlaskit Popup, 767 px ve altında Modal kullanılır. Frimousse arama, kategoriler, sanallaştırılmış liste, klavye gezinmesi ve ten rengi seçimini sağlar. Emoji adları/araması İngilizce; eylemler, hatalar ve durum metinleri Türkçedir. Katalog tarayıcı desteğine göre filtrelenir; işletim sistemi fontu Unicode emojileri çizer.

Panel mevcut Relay/ADS yüzey, yazı, hover, odak ve seçili durum tokenlarını kullanır; açık/koyu/sistem teması ve hesap vurgu rengi portal içinde de geçerlidir. Masaüstünde 6, mobilde 5 sütun, en az 44 px hedefler ve yüksekliği `min(320px,45dvh)` olan kaydırılabilir liste vardır.

Açılışta arama odaklanır. Seçim başarılıysa panel kapanır; metin seçiminde textarea ve doğru imleç konumu, tepki seçiminde tetikleyici odaklanır. Escape/dışarı tıklama ve mobil Vazgeç korunur. Veri hatası Türkçe mesaj ve tekrar deneme sunar; mesaj taslağı kaybolmaz. Tepki kaydedilirken yinelenen istek ve kapanış engellenir; API hatasında panel açık kalır.

## Metin ve tepki sözleşmesi

Mesajlar Unicode metni aynen taşır. Mevcut `insertEmoji`, imleçte ekleme/seçili metni değiştirme, grapheme bütünlüğü ve 2000 UTF-16 birimi sınırını korur.

`POST /api/messages/react/:id` gövdesi `{ emoji: string }` olarak kalır. Sunucu katalogdaki temel emojileri ve ten rengi dizilerini kabul eder; bağımsız bileşen/ten rengi, boş değer, yanlış tür, düz metin ve çoklu emoji reddedilir. Emoji sunum seçicisi bulunmayan katalog eşdeğerleri kabul edilir. Eski altı tepkinin kayıt biçimi korunur: örneğin `👍` ve katalogdaki `👍️` aynı tepkiyi açıp kapatır. Eski liste yalnızca bu uyumluluk dönüşümü için kullanılır, seçenek sınırı değildir.

Kişi başına tek tepki, aynı seçimi kaldırma, başka seçimle değiştirme, atomik güncelleme, `reactionVersion`, Socket.IO ve erişim kontrolleri korunur. Veri migrasyonu yoktur. Rozetlerin erişilebilir etiketi emoji + “tepkisi” + kişi sayısıdır.

Favoriler, son kullanılanlar, özel emoji yükleme ve kalıcı ten rengi tercihi kapsam dışıdır.

## Doğrulama

`npm run build`, `npm run lint`, `npm run test:emoji`, `npm run test:emoji-ui` çalıştırılır. Veritabanlı testler yalnızca açıkça verilen geçici `MONGO_URI` ile çalışır.

Testler katalog/arama, klavye seçimi, ten rengi, odak, taslak ve karakter sınırı, ZWJ, geçersiz girdiler, eski tepki uyumluluğu, eşzamanlı güncellemeler, iki hesap/çoklu sekme senkronizasyonu, tema/vurgu rengi, dar mobil ekran, veri/API hataları ve üretim CSP'si altında aynı origin isteklerini kapsar.
