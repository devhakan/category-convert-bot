# Wikipedia Kategori Yöneticisi

Türkçe Wikipedia kategorilerinin İngilizce karşılığındaki eksik maddeleri bulup otomatik olarak kategoriye ekleyen CLI aracı.

## Kurulum

```bash
npm install
```

## Konfigürasyon

`config.json` dosyası oluşturun:

```json
{
  "username": "KullaniciAdi@BotAdi",
  "password": "bot_parolasi",
  "api_url": "https://tr.wikipedia.org/w/api.php",
  "user_agent": "WikiBot/1.0 (https://tr.wikipedia.org/wiki/User:KullaniciAdi)"
}
```

**Not:** Bot parolası almak için [Özel:BotPasswords](https://tr.wikipedia.org/wiki/Özel:BotPasswords) sayfasını kullanın.

## Kullanım

### Tek Kategori

```bash
node wiki-category-manager.js "Matematik"
```

### Birden Fazla Kategori

```bash
node wiki-category-manager.js "Matematik" "Fizik" "Kimya"
```

## Nasıl Çalışır

1. **Kategori Analizi:** Türkçe kategorinin İngilizce karşılığını bulur
2. **Madde Karşılaştırması:** Her iki kategorideki maddeleri alır (pagination ile tümü)
3. **Wikidata Kontrolü:** İngilizce maddelerin Türkçe karşılıklarını bulur
4. **Eksik Tespit:** Türkçe kategoride olmayan maddeleri listeler
5. **Otomatik Ekleme:** Bot ile eksik maddelere kategori ekler

## Özellikler

- ✅ **Pagination Desteği:** 500+ madde olan kategorilerde tüm maddeleri alır
- ✅ **Progress Gösterimi:** Büyük kategorilerde ilerleme durumunu gösterir
- ✅ **Çoklu Kategori:** Birden fazla kategoriyi sırayla işler
- ✅ **Rate Limiting:** API limitlerini aşmamak için otomatik bekleme
- ✅ **Hata Yönetimi:** Hatalı durumları yakalar ve devam eder
- ✅ **Bot Entegrasyonu:** Wikipedia bot hesabı ile otomatik düzenleme
- ✅ **Detaylı Raporlama:** Her kategori ve genel özet raporu

## Örnek Çıktı

```
🎯 2 kategori işlenecek

============================================================
📂 KATEGORİ 1/2: Matematik
============================================================
🔍 Kategori analiz ediliyor: Matematik
📋 İngilizce karşılık: Mathematics
📊 İngilizce: 1250 madde | Türkçe: 890 madde
🔄 Eksik maddeler kontrol ediliyor...
   📊 İlerleme: 1250/1250 (100%)
✅ Analiz tamamlandı: 45 eksik madde bulundu

🎯 45 maddeye kategori eklenecek
🔐 Wikipedia'ya giriş yapılıyor...
✅ Bot hazır!

📝 1/45: Abstract algebra
   ✅ Kategori eklendi
📝 2/45: Linear algebra
   ✅ Kategori eklendi
...

==================================================
📋 İŞLEM ÖZETİ:
   ✅ Başarılı: 43
   ❌ Hatalı: 2
   📊 Toplam: 45
==================================================

============================================================
📋 GENEL ÖZET:
   📂 İşlenen kategori: 2
   📊 Toplam işlenen madde: 67
   ✅ Toplam başarılı: 65
   ❌ Toplam hatalı: 2
============================================================
```

## Güvenlik

- `config.json` dosyası `.gitignore`'da yer alır
- Bot parolaları düzenli olarak yenilenmelidir
- Rate limiting ile Wikipedia sunucularına zarar verilmez

## Gereksinimler

- Node.js 14+
- Wikipedia bot hesabı
- İnternet bağlantısı

## Lisans

MIT