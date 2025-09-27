# Wikipedia Kategori Kontrol Aracı

Türkçe Wikipedia kategorisinin İngilizce karşılığındaki maddeleri alıp, Türkçe kategoride eksik olanları listeleyen CLI aracı.

## Kurulum

```bash
npm install
```

## Kullanım

```bash
node index.js "kategori-adı"
```

veya global kurulum sonrası:

```bash
npm install -g .
wiki-check "kategori-adı"
```

## Örnek

```bash
node index.js "Makine öğrenmesi"
```

Bu komut:
1. Türkçe "Makine öğrenmesi" kategorisinin İngilizce karşılığını bulur
2. İngilizce kategorideki tüm maddeleri alır
3. Her maddenin Wikidata ID'sini bulur
4. Wikidata üzerinden Türkçe karşılığını bulur
5. Türkçe kategoride eksik olan maddeleri listeler

## Özellikler

- İngilizce Wikipedia API'si ile kategori maddelerini alma
- Wikidata API'si ile dil bağlantılarını bulma
- Türkçe Wikipedia'da eksik maddeleri tespit etme
- Detaylı progress gösterimi
- Hata yönetimi ve rate limiting

## Gereksinimler

- Node.js 14+
- İnternet bağlantısı