# Graph Logics

Bu dosya, DolphDictionary içindeki grafik, gösterge kartı, ilerleme çubuğu ve
istatistik tablolarının hangi verileri kullandığını ve nasıl hesaplandığını
belgeler.

## 1. Veri kaynakları

Grafik bileşenleri iki ana veri kümesini kullanır:

- `words: Word[]`: Kullanıcının kelimeleri.
- `reviewLogs: ReviewLog[]`: Tekrar oturumlarında verilen geri bildirim kayıtları.

Temel alanlar:

| Alan | Kullanım |
|---|---|
| `language` | İngilizce/Almanca kapsam filtresi |
| `learningStatus` | `new`, `learning`, `review`, `mastered`, `difficult` durumları |
| `difficultyRating` | 1-10 arası zorluk puanı |
| `lapses` | Kelimenin unutulma sayısı |
| `correctCount`, `incorrectCount` | Kelime bazında doğru/yanlış cevap sayıları |
| `dateAdded` | Kelimenin eklenme tarihi |
| `lastReviewed` | Son tekrar tarihi |
| `cefrLevel` | A1-C2 seviye dağılımı |
| `primaryAcademicContext` | Akademik alan/bağlam dağılımı |
| `ReviewLog.feedback` | `remembered`, `difficult`, `forgot` geri bildirimleri |
| `ReviewLog.timestamp` | Tekrarın gerçekleştiği zaman |
| `ReviewLog.newIntervalDays` | Tekrar sonrası yeni aralık |
| `ReviewLog.newDifficulty` | Tekrar sonrası yeni zorluk |

## 2. Veri kapsamı ve dil filtresi

`AnalyticsView` ve `DashboardAnalyticsCarousel`, yalnızca seçili dile ait
kelimeleri kullanır:

```text
targetWords = words.filter(word.language === activeLanguage)
languageWords = words.filter(word.language === activeLanguage)
```

Bu nedenle toplam kelime, durum dağılımı, CEFR, akademik bağlam ve haftalık
eklenen kelime sayıları seçili dile göre değişir.

Review log'ları bileşenlere doğrudan `reviewLogs` olarak verilir. `AnalyticsView`
haftalık aktivite hesabında log'un `wordId` değerini seçili dildeki kelime
kimlikleriyle eşleştirir. Buna karşılık kalıcılık ve bazı genel istatistik
hesapları review log'larını ayrıca dil filtresinden geçirmez. Bir log'un doğru
dile bağlanması `wordId` eşleşmesine ve üst seviye veri izolasyonuna bağlıdır.

## 3. Dashboard ana sayfa analitiği

Dosya: `src/components/dashboard/DashboardAnalyticsCarousel.tsx`

Ana sayfadaki carousel üç slayttan oluşur:

1. En çok zorlanılan kelimeler
2. Öğrenme ilerlemesi ve hafıza dağılımı
3. Haftalık çalışma süresi

### 3.1 En çok zorlanılan kelimeler

Bir kelime aşağıdaki koşullardan en az birini karşılıyorsa listeye girer:

```text
lapses > 0
veya learningStatus === "difficult"
veya difficultyRating >= 5.5
veya incorrectCount > 0
```

Her kelime için zorluk etki puanı:

```text
lapseScore     = lapses * 15
ratingScore    = difficultyRating * 8
incorrectScore = incorrectCount * 10
impactScore    = min(100, round(lapseScore + ratingScore + incorrectScore))
```

Doğruluk:

```text
totalReviews = correctCount + incorrectCount
accuracyRate = totalReviews > 0
  ? round(correctCount / totalReviews * 100)
  : 60
```

Sonuçlar `impactScore` azalan sırada sıralanır ve en fazla 5 kelime gösterilir.
Dashboard'daki zorluk çubuğunun genişliği `impactScore` yüzdesidir.

### 3.2 Öğrenme durumu ve kalıcılık

Seçili dildeki kelimeler şu şekilde sayılır:

```text
mastered = learningStatus === "mastered"
learning = learningStatus === "learning"
review   = learningStatus === "review"
difficult = learningStatus === "difficult"
newWords = learningStatus === "new"
           veya (!learningStatus ve !lastReviewed)
```

#### Hafıza kalıcılığı

```text
successfulReviews = reviewLogs.filter(feedback === "remembered").length
totalReviewActions = reviewLogs.length

reviewRetention =
  totalReviewActions > 0
    ? round(successfulReviews / totalReviewActions * 100)
    : 85

wordStatusRetention = round(
  (mastered * 1.0 + learning * 0.7 + review * 0.5) / total * 100
)

retentionRate = clamp(
  round(reviewRetention * 0.4 + wordStatusRetention * 0.6),
  10,
  100
)
```

Buradaki `85`, hiç tekrar kaydı yokken kullanılan başlangıç varsayımıdır.
Bu nedenle yeni bir kullanıcıda görülen kalıcılık değeri yalnızca gerçek
hatırlama sonuçlarından oluşmaz. `difficult` ve `newWords` durumları
`wordStatusRetention` puanına pozitif katkı sağlamaz; ancak paydada yer alır.

Dashboard görselleri:

- Kalıcılık yüzdesi: `retentionRate`.
- Ustalaşma halkası: `mastered / total`.
- Öğrenme halkası: `learning / total`.
- Durum çubuğu: `mastered`, `learning`, `review`, `difficult` oranları.
- Legend sayıları: ilgili durumların ham kelime sayıları.

### 3.3 CEFR seviye dağılımı

Dashboard carousel'inde `B1`, `B2`, `C1`, `C2` seviyeleri gösterilir.
`A1` ve `A2` bu carousel görünümünde hesaplanmaz.

```text
count(level) = seçili dilde cefrLevel === level olan kelime sayısı
percentage   = round(count / totalWords * 100)
```

Analytics sayfası ise `A1`-`C2` arasındaki altı seviyenin tamamını gösterir.

### 3.4 Haftalık çalışma süresi

Son 7 takvim günü, 6 gün önce başlayıp bugün bitecek şekilde oluşturulur.
Her günün tekrar sayısı, o günün `ReviewLog.timestamp` kayıtları sayılarak
bulunur.

Çalışma süresi gerçek bir kronometreden gelmez; tahmini olarak hesaplanır:

```text
reviewCount = o günkü tekrar log'u sayısı
minutes = reviewCount > 0
  ? round(reviewCount * 0.85 + 3)
  : 0
```

Bugün için tekrar log'u yok ancak bir kelimenin `lastReviewed` tarihi bugünse
minimum anlamlı etkinlik olarak `12` dakika atanır.

Ek göstergeler:

```text
totalMinutesWeek   = 7 günün tahmini dakika toplamı
totalReviewsWeek   = 7 günün tekrar log'u toplamı
averageDailyMinutes = round(totalMinutesWeek / 7)
dailyTargetMinutes  = 20
targetAchievedDays  = minutes >= 20 olan gün sayısı
peakDayName         = en yüksek dakikaya sahip gün
```

Grafik yüksekliği için görsel ölçek:

```text
chartCeiling = max(30, maxMinutesDay * 1.25)
height = clamp(round(minutes / chartCeiling * 100), 4, 100)
```

Bu slayttaki dakika değeri “tahmini odaklanma süresi”dir; kullanıcı tarafından
geçirilen gerçek süre değildir.

## 4. Performans & İlerleme Grafikleri sayfası

Dosya: `src/components/statistics/AnalyticsView.tsx`

Bu sayfa üç sekme ve üstte üç özet kartı içerir.

### 4.1 Üst özet kartları

#### Toplam kelime

```text
totalWords = seçili dildeki kelime sayısı
```

Alt metinde `masteredWords` ve `learningWords + reviewWords` gösterilir.

#### Hafıza kalıcılığı

`DashboardAnalyticsCarousel` ile aynı `retentionRate` formülü kullanılır:

- Review sonucu katkısı: %40.
- Kelime durumu katkısı: %60.
- Review yoksa `reviewRetention = 85`.
- Sonuç `10` ile `100` arasına sıkıştırılır.

#### Kritik zor kelimeler

```text
difficultWords =
  learningStatus === "difficult"
  veya difficultyRating >= 6.0
  veya lapses > 0
```

Bu eşik dashboard carousel'indeki listeleme eşiği olan `5.5` değerinden
farklıdır.

### 4.2 Zor kelimeler grafiği

Filtreleme koşulları dashboard ile aynıdır:

```text
lapses > 0
veya learningStatus === "difficult"
veya difficultyRating >= 5.5
veya incorrectCount > 0
```

`impactScore` ve `accuracyRate` hesapları da aynıdır. Farklar:

- Analytics sayfası en fazla 8 kelime gösterir.
- Dashboard carousel'i en fazla 5 kelime gösterir.
- Analytics sayfası kelimenin `difficultyRating`, `lapses` ve
  `incorrectCount` değerlerini ayrıca metin olarak gösterir.

### 4.3 Öğrenme ilerlemesi grafiği

Durum sayıları ve yüzdeleri:

```text
statusPercentage = round(statusCount / totalWords * 100)
```

Gösterilen durumlar:

- Ustalaşıldı (`mastered`)
- Aktif öğreniliyor (`learning`)
- Periyodik tekrarda (`review`)
- Zor/takılınan (`difficult`)
- Yeni (`new` veya henüz `lastReviewed` olmayan durum)

CEFR dağılımı:

```text
levels = A1, A2, B1, B2, C1, C2
percentage = round(levelCount / totalWords * 100)
```

Akademik bağlam dağılımı:

```text
context = primaryAcademicContext || "General Academic"
count(context) = o bağlama ait kelime sayısı
pct(context) = round(count(context) / totalWords * 100)
```

Bağlamlar azalan sayıda sıralanır ve ilk 5 kategori gösterilir.

### 4.4 Haftalık kelime aktivitesi

Bu grafik son 7 takvim gününü kullanır ve iki metriği değiştirebilir:

#### Yeni kelimeler

```text
addedCount(day) =
  dateAdded tarihinin day ile aynı olduğu seçili dil kelimelerinin sayısı
```

#### Tekrarlar

```text
reviewCount(day) =
  seçili dildeki kelimelerin wordId'siyle eşleşen,
  timestamp tarihi day ile aynı review log sayısı
```

Çubuk yüksekliği, seçili metrikteki haftalık en yüksek güne göre normalize edilir:

```text
height = max(4, round(dayCount / maxDayCount * 100))
```

Alt bilgiler:

```text
dailyAverage = round(weekTotal / 7)
mostActiveDay = addedCount + reviewCount toplamı en yüksek gün
```

Not: Arayüzde “Hedefe Ulaşılan Gün” alanı mevcut kodda hedef gün sayısı
yerine toplam yeni kelimeyi (`totalAddedWeek`) gösterir. Bu, etiket ile değer
arasında bir anlam uyumsuzluğudur.

## 5. Eski/ayrı istatistik bileşeni

Dosya: `src/components/statistics/StatisticsView.tsx`

Bu bileşen mevcut `App.tsx` akışında kullanılmıyor; ancak kod tabanında
bulunduğu için hesap mantığı aşağıda belgelenmiştir.

### Özet metrikleri

```text
totalReviews = reviewLogs.length
masteredWords = learningStatus === "mastered" sayısı
learningWords = learningStatus === "learning" sayısı
reviewWords = learningStatus === "review" sayısı
difficultWords =
  learningStatus === "difficult" veya difficultyRating >= 6.5
```

Geri çağırma doğruluğu:

```text
accuracy = totalReviews > 0
  ? round((rememberedLogs + difficultLogs * 0.5) / totalReviews * 100)
  : 0
```

Bellek geri bildirim dağılımı:

```text
rememberedPercentage = rememberedLogs / totalReviews * 100
difficultPercentage   = difficultLogs / totalReviews * 100
forgotPercentage      = forgotLogs / totalReviews * 100
```

`totalReviews` sıfırsa tüm yüzdeler `0` gösterilir.

Akademik disiplin dağılımı, `primaryAcademicContext` alanına göre gruplanır;
alan boşsa `General Academic` kullanılır.

Son tekrar geçmişi tablosu `reviewLogs` listesinin ilk 10 kaydını gösterir.
Her satırda:

- `wordText`
- `feedback`
- `newIntervalDays`
- `newDifficulty`
- `timestamp` (yerel tarih/saat biçiminde)

gösterilir. Bu bileşen aktif sayfaya bağlanırsa listedeki kayıtların önceden
tarihe göre sıralanması ayrıca düşünülmelidir; mevcut kod yalnızca gelen
listenin ilk 10 kaydını alır.

## 6. Diğer tablo/istatistik görünümleri

### Kelime detayındaki öğrenme bilgileri

`WordDetailModal` ve kelime listesi aşağıdaki değerleri doğrudan ilgili
kelimeden okur:

- `reviewCount`: toplam tekrar sayısı
- `correctCount` / `incorrectCount`: doğru ve yanlış sayıları
- `stabilityDays`: mevcut tekrar aralığı
- `nextReviewDate`: sonraki tekrar tarihi
- `difficultyRating`: zorluk puanı
- `learningStatus`: öğrenme durumu
- `lapses`: unutulma sayısı
- `streak`: ardışık doğru tekrar serisi

Bu alanlar burada yeniden hesaplanmaz; tekrar algoritmasının kelime üzerinde
sakladığı güncel değerler gösterilir.

### Grafiklerde kullanılmayan alanlar

`difficultyFactor`, `stabilityDays`, `nextReviewDate` ve `streak` kelime
detaylarında anlamlıdır; mevcut grafik formüllerinin ana girdisi değildir.
Dolayısıyla “kalıcılık” yüzdesi doğrudan FSRS/istikrar günlerinden türetilmez;
review geri bildirimleri ve `learningStatus` ağırlıklarından oluşur.

## 7. Sınırlar ve yorumlama notları

1. Grafikler kullanıcı ve seçili dil state'inden beslenir; hesap izolasyonu
   bozulursa istatistikler de karışır.
2. Gün hesabı ISO tarih metni ve JavaScript `Date` dönüşümleriyle yapılır.
   Farklı saat dilimlerinde gece yarısına yakın kayıtlar bir önceki/sonraki
   güne taşınabilir.
3. Haftalık çalışma süresi tahminidir; uygulama gerçek süre ölçümü yapmaz.
4. Kalıcılık puanı bilimsel bir unutma olasılığı veya FSRS çıktısı değildir.
   UI'da “öğrenme skoru” olarak yorumlanmalıdır.
5. `AnalyticsView` ile `DashboardAnalyticsCarousel` çoğu formülü paylaşsa da
   bazı eşikler ve gösterim limitleri farklıdır:
   - Zor kelime zorluk eşiği: kritik kartta `6.0`, listede `5.5`.
   - Dashboard sonuç limiti: 5; Analytics sonucu: 8.
   - Dashboard CEFR görünümü: B1-C2; Analytics görünümü: A1-C2.
6. Review log'ları kalıcılık hesabında tümüyle kullanılır; haftalık aktivitede
   ise seçili dile ait `wordId` ile eşleşenler kullanılır.

## 8. Kod referansı

| Konu | Dosya |
|---|---|
| Ana sayfa carousel grafikleri | `src/components/dashboard/DashboardAnalyticsCarousel.tsx` |
| Ayrıntılı grafikler ve raporlar | `src/components/statistics/AnalyticsView.tsx` |
| Eski/ayrı istatistik görünümü | `src/components/statistics/StatisticsView.tsx` |
| Kelime ve review veri tipleri | `src/types/index.ts` |
| AI koç için türetilmiş kullanıcı özeti | `src/utils/vocabAnalytics.ts` |
