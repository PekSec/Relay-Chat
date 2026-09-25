# 01 — Ayarlar ve kişiselleştirme

**Durum: uygulandı ve doğrulandı; ayarlar UI 106 kontrol geçti.** Onay kaydı: kullanıcı önceki planı “Implement the plan.” ile uygulamaya açtı. Kapsam [shared](./shared.md) tercih tablosunun tamamıdır.

## Tasarım seçimi

| Seçenek | Yerleşim | Değerlendirme |
|---|---|---|
| A — Bölümlü modal | Masaüstü sol menü, mobil bölüm seçicisi; sağda aktif bölüm | **Onaylanan**; sohbet bağlamını korur |
| B — Sekmeli modal | Üstte Profil/Güvenlik/Görünüm/Mesajlaşma/Ses | Alternatif; küçük ekranda sekmeler sıkışır |
| C — Ayrı sayfa | Tam genişlikte ayarlar yolu | Alternatif; bu aşamada yeni route gerektirmez |

Modal başlığı “Hesap ayarları”; uygulanan gezinme bölümleri **Profil, Güvenlik, Görünüm, Mesaj ve ses**. Planın mesajlaşma/ses kapsamı son bölümde birlikte sunulur. Atlaskit modal/form etiketleri ve hata alanları/textfield/select/toggle/avatar/button kullanılır. Profil ve şifre kendi submit işlemlerini korur; tercihler tek taslak olarak bölümler arasında korunur.

Kullanıcının metin düzeltmesi uygulandı: sloganlar ve gereksiz bölüm açıklamaları kaldırıldı; başlıklar “Profil”, “Şifre değiştir”, “Görünüm”, “Mesaj ve ses”. Paletlerin görünür ve erişilebilir adları “Temel renkler” / “Ek renkler”, önizleme metni “Örnek mesaj”. Kullanıcı arayüzünde tema sağlayıcısı belirtilmez. [Ortak metin kuralları](./shared.md#kullanıcıya-gösterilen-metinler) sonraki modüller için de zorunludur.

## Başlangıç ve uygulanan akış

Başlangıç: SettingsModal özel Dialog içinde iki sekmeliydi; profil `PUT /api/auth/profile`, şifre `PUT /api/auth/password`; tema localStorage destekli ayrı Zustand store'daydı. `useAuth` login/logout'ta sohbet ve arkadaş verilerini sıfırlar. Bu davranışlar tercih kaydıyla uyumlu hale getirilir.

1. Modelde doğrulanmış tercihler ve `PATCH /api/auth/preferences` var. Kısmi alanlar atomik dotted `$set` ile kaydedilir; disjoint eşzamanlı güncellemeler birbirini silmez. Auth cevapları tam tercihleri döndürür; eski hesaplar okuma sırasında varsayılan alır, toplu backfill yapılmaz. Profil kaydı tercihleri korur.
2. Sunucu tercihi hesap yüklemede uygulanır; misafir tema ayrı tutulur. Tema yüklemeleri sıraya alınarak geç gelen preview'un iptal/logout'u geri çevirmesi önlenir. Profil güncellemesi kayıt edilmemiş görünüm taslağını silmez.
3. Görünümde sistem/açık/koyu, 10 resmî renk ailesi/nötr + dört Relay seçeneği, rahat/kompakt ve standart/büyük vardır. Renkler erişilebilir adı ve `aria-pressed` durumu olan gruplanmış Atlaskit butonlarıdır. Mesaj ve ses bölümünde gönderme modu, iki ayrı ses toggle'ı ve önizleme toggle'ı bulunur.
4. Önizleme anında uygulanır. Kaydet yalnız değişmiş alanları gönderir; başarılı cevap kalıcı durumu yeniler. Vazgeç, Escape, kapatma düğmesi ve overlay kayıtlı tercihe döner. Hata modalı kapatmaz ve taslağı korur. Kaydetme sürerken çakışan işlemler engellenir; modal unmount'ta da taslak geri alınır.
5. Accent kök token/CSS değişkenleriyle portal içeriğini de kapsar. Yazı/yoğunluk mevcut mesaj/listelere bağlandı. Composer IME/Shift+Enter'ı korur; `mod-enter` Ctrl ve Cmd'yi destekler. Merkezi ses fonksiyonu iki tercihi ayrı uygular; önizleme kapatılınca sidebar mesaj metni gizlenir.
6. Profil/şifre doğrulaması korundu, clipboard başarısızlığı kullanıcıya gösteriliyor. Settings ikonları Atlaskit'e taşındı. Özel Dialog son kullanımıyla kaldırıldı. Sonraki ekranların düzeni bu teslimatta yeniden tasarlanmadı.

Modal ilk açılışta lazy yüklenir: metin düzeltmesi sonrası production build Settings chunk'ı **422,48 kB / 126,37 kB gzip**, Home chunk'ı **59,22 kB / 17,52 kB gzip**. Bu rakamlar build çıktısıdır; yükleme süresi ölçümü değildir. Yeni cache veya bileşen altyapısı eklenmedi.

## Aynı adımda giderilen backend hatası

Ayarlar davranış testleri paralel mesaj gönderirken mevcut `conversation.messages = …; save()` akışında Mongoose `VersionError` ortaya çıkardı: mesaj kaydedildiği halde bazı istekler 500 dönüyordu. Bu, kullanıcı yeniden denediğinde yinelenen mesaj riski taşıdığı için aynı teslimatta kök akışta düzeltildi. Önizleme referansı atomik `$push` + `$sort: -1` + `$slice: 1` ile korunuyor; durum güncellemesi yalnız active'e yükseltiyor, eski pending yazımı active'i geri alamıyor.

[Eşzamanlı gönderim regresyonu](../../../scripts/message-concurrency-test.js) düzeltme öncesinde **20 isteğin 18'inde başarısızlık** üretti; düzeltmeden sonra **40/40 istek başarılı**, geçmişte her istek tam bir kez, önizlemede en yeni mesaj ve active durumun korunması doğrulandı. Bu değişiklik gelecek sohbet tasarımının uygulanması değildir.

## Kabul ve kanıt kaydı

- API: eski hesap varsayılanı; kısmi kaydın diğer alanları koruması; geçersiz enum/boolean/bilinmeyen alan; oturumsuz erişim; ikinci kullanıcı izolasyonu; tekrar login ve profil güncellemesi sonrası kalıcılık.
- Modal: masaüstü/mobil, tüm bölümlere klavye erişimi, focus trap/geri dönüş, Kaydet/Vazgeç/Escape/overlay, ağ hatasında korunmuş taslak, yeniden açma, hızlı seçim ve hesap değişimi.
- Görünüm: bütün accent'ler açık/koyu; buton/link/focus/selected ve portal içerikleri; 4.5:1 normal metin. Büyük yazı/kompakt görünümde yatay taşma olmaması.
- Davranış: Enter/Shift+Enter/Ctrl+Enter/Cmd+Enter/IME; açık-kapalı iki ses; önizleme kapatma; guest tema ve yeni hesap arasında sızıntı olmaması.
- Mevcut test altyapısı kullanılır. `npm run build`, `npm run lint`, `npm test`, `npm run test:realtime`, `npm run test:security`, `npm run test:conversations`, `npm run test:ui` sonuçları tamamlanınca kaydedilir.

## Gerçek doğrulama kaydı

Testler mevcut `.env` veritabanı yerine disposable Docker Mongo üzerinde yürütüldü; test Mongo'su iş bitince durduruldu. [Tercih API testi](../../../scripts/preferences-test.js) eski kayıt/backfill yapmama, okuma/login/profil kalıcılığı, hatalı payload, kullanıcı izolasyonu, eşzamanlı ayrık alanlar ve tüm accent değerlerinde geçti. Backend düzeltmesi sonrası son tekrar dahil smoke **41**, realtime **8**, security **37**, conversation listesi **iki okuma sınırı**, mevcut UI **56**, preferences API ve concurrency **40/40** kontrolleri exit 0 ile geçti. Son build, lint, syntax ve diff kontrolleri de başarılı.

Hesaplanan tarayıcı renklerinde 14 accent × 2 tema = **28 eşleşmede** normal/hover/pressed buton yazısı, link ve seçili alan yazısı en az **4,5:1**; focus en az **3:1** sağlıyor. En düşük metin oranı açık tema/turuncu normal butonda **4,506:1**. Ayrıntı üretimi [ayarlar UI testinde](../../../scripts/settings-ui-test.js); ölçümler `test-results/settings-contrast.json`, rol bazında minimumlar [shared kanıt tablosunda](./shared.md).

Son ayarlar UI koşusu **106 kontrol, exit 0** ile geçti: masaüstü/mobil; klavye focus, Kaydet/Vazgeç/Escape/overlay; başarısız kayıtta taslak; yeniden yükleme; hızlı tema seçimi ardından kapatma; farklı hesaba geçtikten sonra gecikmiş kaydın yeni hesabı değiştirmemesi; iki ses türünün açık/kapalı davranışı; önizleme; gerçek satır padding/yazı büyüklüğü; Enter/Ctrl/Cmd/Shift/IME. Ekran kanıtları: [masaüstü](../../screenshots/settings-desktop.png), [mobil](../../screenshots/settings-mobile.png).

01 tamamlandı; sonraki iş **02 tasarım seçiminin soru aracıyla alınmasıdır**. Emoji ve diğer ekranların geçişi tamamlanmış değildir. Son toplu regresyonun ayrıntıları için `docs/VERIFICATION.md` esas alınır. Kullanıcının sonraki commit talebi için çalışma ve metin düzeltmeleri `codex/settings-copy-contracts` dalında toplandı; push istenmedi.
