import Dexie, { Table } from 'dexie';
import { Word, ReviewLog, UserSettings, LanguageCode } from '../types';

export class AcademicVocabDB extends Dexie {
  words!: Table<Word, string>;
  reviewLogs!: Table<ReviewLog, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('AcademicVocabLabDB');
    this.version(1).stores({
      words: 'id, word, language, partOfSpeech, primaryAcademicContext, learningStatus, difficultyLabel, nextReviewDate, lastReviewed, dateAdded, *tags',
      reviewLogs: 'id, wordId, timestamp, feedback, mode',
      settings: 'key',
    });
  }
}

export const db = new AcademicVocabDB();

export const DEFAULT_SETTINGS: UserSettings = {
  nativeLanguage: 'tr',
  targetLanguages: ['en', 'de'],
  activeLanguage: 'en',
  dailyGoal: 10,
  weeklyGoal: 35,
  theme: 'dark',
  pronunciationPreference: 'us',
  autoPlayAudio: true,
  keyboardShortcutsEnabled: true,
  cloudSyncEnabled: false, // Phase 2 indicator
};

const SEED_WORDS: Word[] = [
  {
    id: 'seed-accretion',
    word: 'accretion',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/əˈkriː.ʃən/',
    meanings: [
      {
        id: 'm-accretion-1',
        trMeaning: 'birikme, yığılma',
        secondaryTrMeanings: ['madde birikimi', 'kütleçekimsel toplanma'],
        definitionEn: 'The gradual accumulation of layers, matter, or particles through gravitational attraction.',
        context: 'Astrophysics',
      },
    ],
    examples: [
      {
        id: 'ex-accretion-1',
        sentence: 'Planetary accretion occurs through the gravitational accumulation of dust and planetesimals within a protoplanetary disk.',
        trTranslation: 'Gezegensel birikme, ön-gezegensel bir disk içinde toz ve gezegenciklerin kütleçekimsel toplanmasıyla meydana gelir.',
        sourceContext: 'Astrophysical Journal',
      },
    ],
    personalNote: 'Astrofizik makalelerinde disk yapıları ve kara delik çevreleri için en sık kullanılan temel terim.',
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['accumulation', 'agglomeration', 'aggregation', 'build-up'],
    antonyms: ['depletion', 'dispersion', 'erosion'],
    relatedWords: ['accretion disk', 'Bondi accretion', 'planetesimal'],
    wordFamily: [
      { id: 'wf-1', word: 'accrete', partOfSpeech: 'verb', relation: 'kök fiil' },
      { id: 'wf-2', word: 'accretionary', partOfSpeech: 'adjective', relation: 'sıfat formu' },
      { id: 'wf-3', word: 'accreted', partOfSpeech: 'adjective', relation: 'geçmiş zaman / niteleme sıfatı' },
    ],
    tags: ['astrophysics', 'planetary-science', 'gravity', 'high-yield'],
    difficultyRating: 4.2,
    difficultyLabel: 'Medium',
    learningStatus: 'review',
    dateAdded: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 1 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 3600000).toISOString(), // due now!
    reviewCount: 3,
    correctCount: 2,
    incorrectCount: 1,
    stabilityDays: 2.5,
    difficultyFactor: 4.2,
    lapses: 1,
    streak: 2,
  },
  {
    id: 'seed-exposure',
    word: 'exposure',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ɪkˈspoʊ.ʒər/',
    meanings: [
      {
        id: 'm-exposure-1',
        trMeaning: 'maruz kalma, etkilenme',
        secondaryTrMeanings: ['maruz bırakılma', 'savunmasız kalma'],
        definitionEn: 'The state of being exposed to contact with something harmful or extreme.',
        context: 'Astrophysics / Space Biology',
      },
      {
        id: 'm-exposure-2',
        trMeaning: 'pozlama süresi',
        secondaryTrMeanings: ['ışıklama'],
        definitionEn: 'The quantity of light reaching a photographic film or electronic sensor.',
        context: 'Observational Astronomy',
      },
    ],
    examples: [
      {
        id: 'ex-exposure-1',
        sentence: 'Prolonged exposure to ionizing solar cosmic radiation presents severe physiological hazards for manned deep-space transit.',
        trTranslation: 'İyonlaştırıcı güneş kozmik radyasyonuna uzun süreli maruz kalma, insanlı derin uzay yolculuklarında ciddi fizyolojik tehlikeler oluşturur.',
        sourceContext: 'Space Sciences Review',
      },
      {
        id: 'ex-exposure-2',
        sentence: 'Long-duration exposures on the 8-meter telescope were required to resolve the faint spectroscopy of the high-redshift galaxy.',
        trTranslation: 'Yüksek kırmızıya kaymalı galaksinin soluk tayfını ayrıştırmak için 8 metrelik teleskopta uzun süreli pozlamalar gerekti.',
        sourceContext: 'Observational Astronomy Manual',
      },
    ],
    personalNote: 'Hem teleskop gözlem tekniklerinde (pozlama) hem uzay fiziğinde (radyasyona maruziyet) çift anlamlı.',
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['contact', 'vulnerability', 'subjection'],
    antonyms: ['protection', 'shielding', 'insulation'],
    relatedWords: ['radiation exposure', 'exposure time', 'detector integration'],
    wordFamily: [
      { id: 'wf-4', word: 'expose', partOfSpeech: 'verb', relation: 'kök fiil' },
      { id: 'wf-5', word: 'exposed', partOfSpeech: 'adjective', relation: 'sıfat' },
      { id: 'wf-6', word: 'exposition', partOfSpeech: 'noun', relation: 'türetilmiş isim' },
    ],
    tags: ['astronomy', 'astrophysics', 'radiation', 'optics'],
    difficultyRating: 3.2,
    difficultyLabel: 'Easy',
    learningStatus: 'review',
    dateAdded: new Date(Date.now() - 10 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 2 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 1800000).toISOString(), // due now!
    reviewCount: 4,
    correctCount: 4,
    incorrectCount: 0,
    stabilityDays: 5.0,
    difficultyFactor: 3.2,
    lapses: 0,
    streak: 4,
  },
  {
    id: 'seed-barycenter',
    word: 'barycenter',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈbær.ɪˌsɛn.tər/',
    meanings: [
      {
        id: 'm-barycenter-1',
        trMeaning: 'kütle merkezi, barisentır',
        secondaryTrMeanings: ['ortak ağırlık merkezi', 'iki veya daha fazla gökcisminin ortak çekim merkezi'],
        definitionEn: 'The center of mass of two or more bodies orbiting one another and is the point about which the bodies orbit.',
        context: 'Astronomy & Celestial Mechanics',
      },
    ],
    examples: [
      {
        id: 'ex-barycenter-1',
        sentence: 'In the Pluto–Charon binary system, the barycenter lies outside the physical surface of Pluto, making it a true double-dwarf planet.',
        trTranslation: 'Plüton–Kharon ikili sisteminde barisentır Plüton\'un fiziksel yüzeyinin dışında bulunur ve bu onu gerçek bir ikili cüce gezegen yapar.',
        sourceContext: 'Celestial Mechanics and Dynamical Astronomy',
      },
    ],
    personalNote: 'Yörünge mekaniği sınavlarında ve ikili yıldız sistemleri makalelerinde anahtar kavram.',
    primaryAcademicContext: 'Astronomy',
    synonyms: ['center of mass', 'gravitational center'],
    antonyms: [],
    relatedWords: ['binary orbit', 'Lagrange points', 'orbital resonance'],
    wordFamily: [
      { id: 'wf-7', word: 'barycentric', partOfSpeech: 'adjective', relation: 'sıfat formu' },
    ],
    tags: ['astronomy', 'mechanics', 'orbits', 'gravitation'],
    difficultyRating: 5.5,
    difficultyLabel: 'Medium',
    learningStatus: 'review',
    dateAdded: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 1 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 7200000).toISOString(), // due now!
    reviewCount: 2,
    correctCount: 1,
    incorrectCount: 1,
    stabilityDays: 1.8,
    difficultyFactor: 5.5,
    lapses: 1,
    streak: 1,
  },
  {
    id: 'seed-luminosity',
    word: 'luminosity',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˌluː.mɪˈnɑː.sə.ti/',
    meanings: [
      {
        id: 'm-luminosity-1',
        trMeaning: 'ışıma gücü, aydınlatma gücü',
        secondaryTrMeanings: ['salınan toplam elektromanyetik enerji miktarı', 'parlaklık'],
        definitionEn: 'The total amount of electromagnetic energy emitted by an astronomical object per unit of time (measured in Joules/sec or Watts).',
        context: 'Astrophysics',
      },
    ],
    examples: [
      {
        id: 'ex-luminosity-1',
        sentence: 'The Eddington luminosity defines the theoretical threshold where radiation pressure exactly counterbalances the gravitational collapse of a massive star.',
        trTranslation: 'Eddington ışıma gücü, radyasyon basıncının devasa bir yıldızın kütleçekimsel çöküşünü tam olarak dengelediği teorik eşiği tanımlar.',
        sourceContext: 'Theoretical Stellar Astrophysics',
      },
    ],
    personalNote: 'Görünür parlaklık (apparent magnitude) ile mutlak ışıma gücünü karıştırmamak gerek.',
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['radiant power', 'intrinsic brightness', 'emittance'],
    antonyms: ['darkness', 'obscurity'],
    relatedWords: ['Eddington limit', 'Hertzsprung-Russell diagram', 'absolute magnitude'],
    wordFamily: [
      { id: 'wf-8', word: 'luminous', partOfSpeech: 'adjective', relation: 'sıfat' },
      { id: 'wf-9', word: 'illuminate', partOfSpeech: 'verb', relation: 'fiil' },
      { id: 'wf-10', word: 'luminary', partOfSpeech: 'noun', relation: 'isim' },
    ],
    tags: ['astrophysics', 'stellar-physics', 'radiation', 'energy'],
    difficultyRating: 4.8,
    difficultyLabel: 'Medium',
    learningStatus: 'review',
    dateAdded: new Date(Date.now() - 8 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 2 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 3600000).toISOString(), // due now!
    reviewCount: 3,
    correctCount: 3,
    incorrectCount: 0,
    stabilityDays: 3.5,
    difficultyFactor: 4.8,
    lapses: 0,
    streak: 3,
  },
  {
    id: 'seed-blackbody',
    word: 'blackbody',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈblækˌbɑː.di/',
    meanings: [
      {
        id: 'm-blackbody-1',
        trMeaning: 'kara cisim',
        secondaryTrMeanings: ['ideal soğurucu ve yayıcı cisim'],
        definitionEn: 'An idealized physical body that absorbs all incident electromagnetic radiation, regardless of frequency or angle of incidence.',
        context: 'Physics & Thermodynamics',
      },
    ],
    examples: [
      {
        id: 'ex-blackbody-1',
        sentence: 'The Cosmic Microwave Background conforms almost flawlessly to an ideal blackbody radiation curve at 2.725 Kelvin.',
        trTranslation: 'Kozmik Mikrodalga Arka Plan, 2.725 Kelvin sıcaklığındaki ideal bir kara cisim ışıma eğrisine neredeyse kusursuz bir şekilde uyar.',
        sourceContext: 'Cosmology and Thermal Physics',
      },
    ],
    personalNote: 'Planck yasası ve Stefan-Boltzmann yasalarıyla doğrudan bağlantılı.',
    primaryAcademicContext: 'Physics',
    synonyms: ['ideal radiator', 'Planckian emitter'],
    antonyms: ['perfect reflector'],
    relatedWords: ['blackbody radiation', 'Planck curve', 'Wien law'],
    wordFamily: [
      { id: 'wf-11', word: 'blackbody radiation', partOfSpeech: 'phrase', relation: 'türemiş kavram' },
    ],
    tags: ['physics', 'thermodynamics', 'cosmology', 'quantum'],
    difficultyRating: 3.8,
    difficultyLabel: 'Medium',
    learningStatus: 'mastered',
    dateAdded: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 10 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    reviewCount: 6,
    correctCount: 6,
    incorrectCount: 0,
    stabilityDays: 28.0,
    difficultyFactor: 3.5,
    lapses: 0,
    streak: 6,
  },
  {
    id: 'seed-spectroscopy',
    word: 'spectroscopy',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/spɛkˈtrɑː.skə.pi/',
    meanings: [
      {
        id: 'm-spec-1',
        trMeaning: 'tayfbilim, spektroskopi',
        secondaryTrMeanings: ['ışık tayfı analizi', 'madde ile elektromanyetik ışımanın etkileşim incelemesi'],
        definitionEn: 'The study of the interaction between matter and electromagnetic radiation as a function of wavelength or frequency.',
        context: 'Astronomy & Physics',
      },
    ],
    examples: [
      {
        id: 'ex-spec-1',
        sentence: 'High-resolution transmission spectroscopy enables atmospheric characterization and biomarker detection in transiting exoplanets.',
        trTranslation: 'Yüksek çözünürlüklü geçiş spektroskopisi, geçiş yapan ötegezegenlerde atmosferik karakterizasyon ve biyo-belirteç tespitini mümkün kılar.',
        sourceContext: 'Nature Astronomy',
      },
    ],
    personalNote: 'Ötegezegen atmosferleri analizinde en önemli deneysel yöntem.',
    primaryAcademicContext: 'Astronomy',
    synonyms: ['spectral analysis', 'spectrometry'],
    antonyms: [],
    relatedWords: ['spectrograph', 'Fraunhofer lines', 'Doppler shift'],
    wordFamily: [
      { id: 'wf-12', word: 'spectrum', partOfSpeech: 'noun', relation: 'kök isim' },
      { id: 'wf-13', word: 'spectroscopic', partOfSpeech: 'adjective', relation: 'sıfat formu' },
      { id: 'wf-14', word: 'spectrometer', partOfSpeech: 'noun', relation: 'aygıt ismi' },
    ],
    tags: ['astronomy', 'optics', 'exoplanets', 'experimental'],
    difficultyRating: 4.5,
    difficultyLabel: 'Medium',
    learningStatus: 'review',
    dateAdded: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 3 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 5000000).toISOString(), // due now!
    reviewCount: 3,
    correctCount: 2,
    incorrectCount: 1,
    stabilityDays: 3.2,
    difficultyFactor: 4.5,
    lapses: 1,
    streak: 1,
  },
  {
    id: 'seed-perturbation',
    word: 'perturbation',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˌpɜːr.tərˈbeɪ.ʃən/',
    meanings: [
      {
        id: 'm-per-1',
        trMeaning: 'pertürbasyon, bozulma',
        secondaryTrMeanings: ['yörünge sapması', 'küçük düzensizlik', 'tedirginlik'],
        definitionEn: 'A secondary gravitational or dynamical influence causing deviation from regular Keplerian orbital motion.',
        context: 'Celestial Mechanics',
      },
    ],
    examples: [
      {
        id: 'ex-per-1',
        sentence: 'Secular perturbations exerted by Jupiter and Saturn induce periodic oscillations in the orbital inclination of inner asteroids.',
        trTranslation: 'Jüpiter ve Satürn tarafından uygulanan uzun dönemli pertürbasyonlar, iç asteroitlerin yörünge eğiminde periyodik salınımlara yol açar.',
        sourceContext: 'Icarus Journal',
      },
    ],
    personalNote: 'Yörünge mekaniğinde analitik çözümler perturbation teorisiyle hesaplanır.',
    primaryAcademicContext: 'Astronomy',
    synonyms: ['disturbance', 'deviation', 'fluctuation', 'disruption'],
    antonyms: ['equilibrium', 'stability', 'regularity'],
    relatedWords: ['perturbation theory', 'secular resonance', 'three-body problem'],
    wordFamily: [
      { id: 'wf-15', word: 'perturb', partOfSpeech: 'verb', relation: 'fiil kökü' },
      { id: 'wf-16', word: 'perturbative', partOfSpeech: 'adjective', relation: 'sıfat' },
      { id: 'wf-17', word: 'perturbed', partOfSpeech: 'adjective', relation: 'edilgen sıfat' },
    ],
    tags: ['astronomy', 'orbital-mechanics', 'mathematics'],
    difficultyRating: 7.2,
    difficultyLabel: 'Hard',
    learningStatus: 'difficult',
    dateAdded: new Date(Date.now() - 12 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 1 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 100000).toISOString(), // due now!
    reviewCount: 5,
    correctCount: 2,
    incorrectCount: 3,
    stabilityDays: 0.8,
    difficultyFactor: 7.2,
    lapses: 3,
    streak: 0,
  },
  {
    id: 'seed-attenuation',
    word: 'attenuation',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/əˌtɛn.juˈeɪ.ʃən/',
    meanings: [
      {
        id: 'm-att-1',
        trMeaning: 'zayıflama, sönümleme',
        secondaryTrMeanings: ['şiddet azalması', 'radyasyon akısında düşüş'],
        definitionEn: 'The gradual loss of intensity or flux of a flux beam as it traverses through a medium.',
        context: 'Physics & Radiative Transfer',
      },
    ],
    examples: [
      {
        id: 'ex-att-1',
        sentence: 'Interstellar dust grains lead to selective extinction and chromatic attenuation of ultraviolet starlight.',
        trTranslation: 'Yıldızlararası toz tanecikleri, morötesi yıldız ışığının seçici sönümlenmesine ve dalga boyuna bağlı zayıflamasına yol açar.',
        sourceContext: 'Astrophysical Optics',
      },
    ],
    personalNote: 'Işınım aktarımı dersinde optik derinlik (optical depth) formüllerinde geçer.',
    primaryAcademicContext: 'Physics',
    synonyms: ['extinction', 'damping', 'reduction', 'weakening'],
    antonyms: ['amplification', 'enhancement', 'intensification'],
    relatedWords: ['attenuation coefficient', 'optical depth', 'Beer-Lambert law'],
    wordFamily: [
      { id: 'wf-18', word: 'attenuate', partOfSpeech: 'verb', relation: 'fiil' },
      { id: 'wf-19', word: 'attenuated', partOfSpeech: 'adjective', relation: 'sıfat' },
    ],
    tags: ['physics', 'optics', 'radiative-transfer'],
    difficultyRating: 6.5,
    difficultyLabel: 'Hard',
    learningStatus: 'difficult',
    dateAdded: new Date(Date.now() - 6 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 1 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 1200000).toISOString(), // due now!
    reviewCount: 3,
    correctCount: 1,
    incorrectCount: 2,
    stabilityDays: 0.9,
    difficultyFactor: 6.5,
    lapses: 2,
    streak: 0,
  },
  {
    id: 'seed-verschmelzung',
    word: 'Verschmelzung',
    language: 'de',
    partOfSpeech: 'noun',
    phoneticIpa: '/fɛɐ̯ˈʃmɛl.tsʊŋ/',
    meanings: [
      {
        id: 'm-ver-1',
        trMeaning: 'birleşme, kaynaşma',
        secondaryTrMeanings: ['eriyerek birleşme', 'füzyon'],
        definitionEn: 'The merger or fusion of two entities into a single unified whole.',
        context: 'Astrophysics & Relativistic Physics',
      },
    ],
    examples: [
      {
        id: 'ex-ver-1',
        sentence: 'Die Verschmelzung zweier Neutronensterne erzeugt beobachtbare Gravitationswellen und Kilonova-Ausbrüche.',
        trTranslation: 'İki nötron yıldızının birleşmesi (kaynaşması), gözlemlenebilir kütleçekimsel dalgalar ve kilonova patlamaları meydana getirir.',
        sourceContext: 'Astrophysikalisches Institut',
      },
    ],
    personalNote: 'Almanca astrofizik literatüründe kilonova ve ikili yıldız sistemleri için sıkça kullanılır.',
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['Fusion', 'Zusammenführung', 'Kollision'],
    antonyms: ['Trennung', 'Spaltung'],
    relatedWords: ['Kernfusion', 'Neutronenstern', 'Gravitationswellen'],
    wordFamily: [
      { id: 'wf-20', word: 'verschmelzen', partOfSpeech: 'verb', relation: 'fiil' },
      { id: 'wf-21', word: 'Schmelze', partOfSpeech: 'noun', relation: 'isim' },
    ],
    tags: ['astrophysics', 'german', 'gravitational-waves'],
    difficultyRating: 5.0,
    difficultyLabel: 'Medium',
    learningStatus: 'learning',
    dateAdded: new Date(Date.now() - 4 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 2 * 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 3600000).toISOString(), // due now!
    reviewCount: 2,
    correctCount: 1,
    incorrectCount: 1,
    stabilityDays: 1.5,
    difficultyFactor: 5.0,
    lapses: 1,
    streak: 1,
  },
  {
    id: 'seed-ereignishorizont',
    word: 'Ereignishorizont',
    language: 'de',
    partOfSpeech: 'noun',
    phoneticIpa: '/ɛɐ̯ˈʔaɪ̯ɡnɪs.hoʁiˌtsɔnt/',
    meanings: [
      {
        id: 'm-ereignis-1',
        trMeaning: 'olay ufku',
        secondaryTrMeanings: ['geri dönüşü olmayan sınır', 'kara delik sınırı'],
        definitionEn: 'A theoretical boundary around a black hole beyond which no light or radiation can escape.',
        context: 'General Relativity & Astrophysics',
      },
    ],
    examples: [
      {
        id: 'ex-ereignis-1',
        sentence: 'Nichts, nicht einmal Licht, kann dem Bereich innerhalb des Ereignishorizonts entkommen.',
        trTranslation: 'Olay ufkunun içindeki bölgeden hiçbir şey, ışık bile kaçamaz.',
        sourceContext: 'Relativitätstheorie',
      },
    ],
    personalNote: 'Schwarzes Loch (Kara delik) fiziğinin en temel kavramı.',
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['Grenzfläche', 'Schwarzschild-Radius'],
    antonyms: [],
    relatedWords: ['Schwarzes Loch', 'Singularität', 'Gravitation'],
    wordFamily: [],
    tags: ['astrophysics', 'relativity', 'black-holes'],
    difficultyRating: 4.5,
    difficultyLabel: 'Medium',
    learningStatus: 'learning',
    dateAdded: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
    reviewCount: 3,
    correctCount: 3,
    incorrectCount: 0,
    stabilityDays: 3.0,
    difficultyFactor: 4.5,
    lapses: 0,
    streak: 3,
  },
  {
    id: 'seed-rotverschiebung',
    word: 'Rotverschiebung',
    language: 'de',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈʁoːt.fɛɐ̯ˌʃiːbʊŋ/',
    meanings: [
      {
        id: 'm-rot-1',
        trMeaning: 'kırmızıya kayma',
        secondaryTrMeanings: ['spektral kayma'],
        definitionEn: 'The displacement of spectral lines toward longer wavelengths in distant celestial objects.',
        context: 'Cosmology',
      },
    ],
    examples: [
      {
        id: 'ex-rot-1',
        sentence: 'Die kosmologische Rotverschiebung beweist die fortlaufende Expansion des Universums.',
        trTranslation: 'Kozmolojik kırmızıya kayma, evrenin süregelen genişlemesini kanıtlar.',
        sourceContext: 'Kosmologie Vorlesung',
      },
    ],
    personalNote: 'Hubble yasası ve evrenin genişlemesi ile doğrudan ilişkili.',
    primaryAcademicContext: 'Cosmology',
    synonyms: ['Doppler-Effekt', 'Spektralverschiebung'],
    antonyms: ['Blauverschiebung'],
    relatedWords: ['Expansion', 'Hubble-Konstante', 'Kosmologie'],
    wordFamily: [],
    tags: ['cosmology', 'spectroscopy', 'physics'],
    difficultyRating: 5.0,
    difficultyLabel: 'Medium',
    learningStatus: 'review',
    dateAdded: new Date(Date.now() - 8 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() - 3600000).toISOString(),
    reviewCount: 2,
    correctCount: 2,
    incorrectCount: 0,
    stabilityDays: 2.0,
    difficultyFactor: 5.0,
    lapses: 0,
    streak: 2,
  },
  {
    id: 'seed-strahlung',
    word: 'Strahlung',
    language: 'de',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈʃtʁaːlʊŋ/',
    meanings: [
      {
        id: 'm-str-1',
        trMeaning: 'ışınım, radyasyon',
        secondaryTrMeanings: ['elektromanyetik ışıma'],
        definitionEn: 'The emission or transmission of energy in the form of waves or particles through space.',
        context: 'Physics & Astronomy',
      },
    ],
    examples: [
      {
        id: 'ex-str-1',
        sentence: 'Die kosmische Mikrowellen-Hintergrundstrahlung ist ein Relikt des frühen Universums.',
        trTranslation: 'Kozmik mikrodalga arka plan ışıması, erken evrenin bir kalıntısıdır.',
        sourceContext: 'Astrophysik Grundlagen',
      },
    ],
    personalNote: 'Fizik ve astrofizikte en sık geçen terimlerden biri.',
    primaryAcademicContext: 'Physics',
    synonyms: ['Emission', 'Wellenstrahlung'],
    antonyms: ['Absorption'],
    relatedWords: ['Synchrotronstrahlung', 'Schwarzkörperstrahlung'],
    wordFamily: [],
    tags: ['physics', 'optics', 'radiation'],
    difficultyRating: 3.0,
    difficultyLabel: 'Easy',
    learningStatus: 'mastered',
    dateAdded: new Date(Date.now() - 15 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    reviewCount: 5,
    correctCount: 5,
    incorrectCount: 0,
    stabilityDays: 8.0,
    difficultyFactor: 3.0,
    lapses: 0,
    streak: 5,
  },
  {
    id: 'seed-kernfusion',
    word: 'Kernfusion',
    language: 'de',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈkɛʁn.fuˌzi̯oːn/',
    meanings: [
      {
        id: 'm-kern-1',
        trMeaning: 'çekirdek kaynaşması, nükleer füzyon',
        secondaryTrMeanings: ['yıldız enerji kaynağı'],
        definitionEn: 'A reaction in which two or more atomic nuclei combine to form different atomic nuclei and subatomic particles.',
        context: 'Stellar Astrophysics',
      },
    ],
    examples: [
      {
        id: 'ex-kern-1',
        sentence: 'Im Zentrum der Sonne findet kontinuierlich die Kernfusion von Wasserstoff zu Helium statt.',
        trTranslation: 'Güneşin merkezinde hidrojenin helyuma nükleer füzyonu aralıksız gerçekleşir.',
        sourceContext: 'Stellare Astrophysik',
      },
    ],
    personalNote: 'Yıldızların enerjisini nasıl ürettiğini açıklayan temel süreç.',
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['Kernverschmelzung', 'Wasserstoffbrennen'],
    antonyms: ['Kernspaltung'],
    relatedWords: ['Helium', 'Sonne', 'Plasma'],
    wordFamily: [],
    tags: ['astrophysics', 'stellar-physics'],
    difficultyRating: 4.0,
    difficultyLabel: 'Medium',
    learningStatus: 'learning',
    dateAdded: new Date(Date.now() - 3 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    reviewCount: 2,
    correctCount: 2,
    incorrectCount: 0,
    stabilityDays: 2.0,
    difficultyFactor: 4.0,
    lapses: 0,
    streak: 2,
  },
  // --- GÜNDELİK / GÜNLÜK YAŞAM & İLETİŞİM KELİMELERİ (İNGİLİZCE) ---
  {
    id: 'seed-resilience',
    word: 'resilience',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/rɪˈzɪl.jəns/',
    meanings: [
      {
        id: 'm-resilience-1',
        trMeaning: 'zorluklara göğüs germe gücü, yılmazlık',
        secondaryTrMeanings: ['esneklik', 'kendini çabuk toparlama becerisi'],
        definitionEn: 'The capacity to withstand or to recover quickly from difficulties; toughness.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        id: 'ex-resilience-1',
        sentence: 'Her resilience in overcoming daily setbacks inspired everyone around her.',
        trTranslation: 'Günlük aksiliklerin üstesinden gelmedeki yılmazlığı, çevresindeki herkese ilham verdi.',
        sourceContext: 'Gündelik Sohbet & Yaşam',
      },
    ],
    personalNote: 'Hem psikolojide hem de günlük hayatta zorluklara karşı dik duruşu ifade etmek için çok sık kullanılır.',
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['toughness', 'tenacity', 'adaptability', 'grit'],
    antonyms: ['fragility', 'vulnerability'],
    relatedWords: ['resilient', 'bounce back', 'persevere'],
    wordFamily: [
      { id: 'wf-res-1', word: 'resilient', partOfSpeech: 'adjective', relation: 'sıfat hali' },
      { id: 'wf-res-2', word: 'resiliently', partOfSpeech: 'adverb', relation: 'zarf hali' },
    ],
    tags: ['daily', 'character', 'mindset', 'high-yield'],
    difficultyRating: 2.8,
    difficultyLabel: 'Easy',
    learningStatus: 'mastered',
    dateAdded: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    reviewCount: 4,
    correctCount: 4,
    incorrectCount: 0,
    stabilityDays: 4.5,
    difficultyFactor: 2.8,
    lapses: 0,
    streak: 4,
  },
  {
    id: 'seed-procrastinate',
    word: 'procrastinate',
    language: 'en',
    partOfSpeech: 'verb',
    phoneticIpa: '/prəˈkræs.tɪ.neɪt/',
    meanings: [
      {
        id: 'm-procrastinate-1',
        trMeaning: 'ertelemek, savsaklamak',
        secondaryTrMeanings: ['işi son dakikaya bırakmak', 'oyalanmak'],
        definitionEn: 'To delay or postpone action; to put off doing something that needs to be done.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        id: 'ex-procrastinate-1',
        sentence: 'I tend to procrastinate whenever I have a large pile of laundry or dishes to do.',
        trTranslation: 'Ne zaman yıkanacak çok çamaşır veya bulaşık olsa erteleme eğiliminde oluyorum.',
        sourceContext: 'Günlük Diyalog',
      },
    ],
    personalNote: 'Günlük hayatta en sık karşılaşılan erteleme alışkanlığı fiili.',
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['postpone', 'delay', 'stall', 'put off'],
    antonyms: ['expedite', 'hasten', 'carry out'],
    relatedWords: ['procrastination', 'procrastinator'],
    wordFamily: [
      { id: 'wf-proc-1', word: 'procrastination', partOfSpeech: 'noun', relation: 'isim formu' },
      { id: 'wf-proc-2', word: 'procrastinator', partOfSpeech: 'noun', relation: 'erteleme huyu olan kişi' },
    ],
    tags: ['daily', 'habits', 'conversation', 'slang-casual'],
    difficultyRating: 3.2,
    difficultyLabel: 'Easy',
    learningStatus: 'review',
    dateAdded: new Date(Date.now() - 4 * 86400000).toISOString(),
    lastReviewed: new Date(Date.now() - 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() - 1000).toISOString(),
    reviewCount: 3,
    correctCount: 2,
    incorrectCount: 1,
    stabilityDays: 1.5,
    difficultyFactor: 3.2,
    lapses: 1,
    streak: 2,
  },
  {
    id: 'seed-pragmatic',
    word: 'pragmatic',
    language: 'en',
    partOfSpeech: 'adjective',
    phoneticIpa: '/præɡˈmæt.ɪk/',
    meanings: [
      {
        id: 'm-pragmatic-1',
        trMeaning: 'pratik, faydacı, gerçekçi',
        secondaryTrMeanings: ['uygulanabilir çözümlere odaklanan'],
        definitionEn: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        id: 'ex-pragmatic-1',
        sentence: 'We need a pragmatic approach to organize our weekly grocery budget and schedule.',
        trTranslation: 'Haftalık market bütçemizi ve programımızı düzenlemek için pratik ve gerçekçi bir yaklaşıma ihtiyacımız var.',
        sourceContext: 'Gündelik Hayat Planlaması',
      },
    ],
    personalNote: 'Teorik laflardan ziyade doğrudan işe yarayanı tercih etme durumu.',
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['practical', 'realistic', 'sensible', 'down-to-earth'],
    antonyms: ['idealistic', 'impractical', 'unrealistic'],
    relatedWords: ['pragmatism', 'pragmatically'],
    wordFamily: [
      { id: 'wf-prag-1', word: 'pragmatism', partOfSpeech: 'noun', relation: 'felsefe / tutum' },
      { id: 'wf-prag-2', word: 'pragmatically', partOfSpeech: 'adverb', relation: 'zarf hali' },
    ],
    tags: ['daily', 'decision-making', 'business-casual'],
    difficultyRating: 3.0,
    difficultyLabel: 'Easy',
    learningStatus: 'learning',
    dateAdded: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    reviewCount: 2,
    correctCount: 2,
    incorrectCount: 0,
    stabilityDays: 2.0,
    difficultyFactor: 3.0,
    lapses: 0,
    streak: 2,
  },
  // --- GÜNDELİK / GÜNLÜK YAŞAM & İLETİŞİM KELİMELERİ (ALMANCA) ---
  {
    id: 'seed-gemuetlich',
    word: 'gemütlich',
    language: 'de',
    partOfSpeech: 'adjective',
    phoneticIpa: '/ɡəˈmyːt.lɪç/',
    meanings: [
      {
        id: 'm-gemuetlich-1',
        trMeaning: 'rahat, sıcak, samimi, huzurlu',
        secondaryTrMeanings: ['keyifli', 'iç ısıtan ortam'],
        definitionEn: 'Warm, cozy, comfortable and pleasant; inducing a feeling of contentment and conviviality.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        id: 'ex-gemuetlich-1',
        sentence: 'Wir haben einen gemütlichen Abend mit heißem Tee und guten Büchern verbracht.',
        trTranslation: 'Sıcak çay ve güzel kitaplarla samimi ve huzurlu bir akşam geçirdik.',
        sourceContext: 'Alltag & Freizeit',
      },
    ],
    personalNote: 'Almancanın en karakteristik kelimelerinden biri; tam Türkçe karşılığı samimi ve sıcacık ortam hissi.',
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['behaglich', 'wohnlich', 'angenehm', 'entspannt'],
    antonyms: ['ungemütlich', 'stressig', 'hektisch'],
    relatedWords: ['Gemütlichkeit', 'Kaffee und Kuchen'],
    wordFamily: [
      { id: 'wf-gem-1', word: 'Gemütlichkeit', partOfSpeech: 'noun', relation: 'huzur ve samimiyet hali' },
    ],
    tags: ['daily', 'lifestyle', 'culture', 'high-yield'],
    difficultyRating: 2.2,
    difficultyLabel: 'Easy',
    learningStatus: 'mastered',
    dateAdded: new Date(Date.now() - 6 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    reviewCount: 4,
    correctCount: 4,
    incorrectCount: 0,
    stabilityDays: 6.0,
    difficultyFactor: 2.2,
    lapses: 0,
    streak: 4,
  },
  {
    id: 'seed-feierabend',
    word: 'Feierabend',
    language: 'de',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈfaɪ̯ɐˌʔaːbn̩t/',
    meanings: [
      {
        id: 'm-feier-1',
        trMeaning: 'iş çıkışı, mesai bitimi, günün dinlenme vakti',
        secondaryTrMeanings: ['işi paydos etme anı'],
        definitionEn: 'The end of the working day; free time or evening rest after finishing work.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        id: 'ex-feier-1',
        sentence: 'Nach acht Stunden im Büro mache ich jetzt endlich Feierabend!',
        trTranslation: 'Ofiste sekiz saatten sonra nihayet paydos edip günü kapatıyorum!',
        sourceContext: 'Alltagsgespräch',
      },
    ],
    personalNote: 'Almanya’da gün sonu mesai bitişini kutlama gibi ifade eden yaygın günlük tabir: "Schönen Feierabend!"',
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['Arbeitsende', 'Dienstschluss', 'Freizeit'],
    antonyms: ['Arbeitsbeginn', 'Schichtbeginn'],
    relatedWords: ['Feierabendbier', 'Feierabend machen'],
    wordFamily: [],
    tags: ['daily', 'work-life-balance', 'colloquial', 'high-yield'],
    difficultyRating: 2.5,
    difficultyLabel: 'Easy',
    learningStatus: 'learning',
    dateAdded: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastReviewed: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    reviewCount: 2,
    correctCount: 2,
    incorrectCount: 0,
    stabilityDays: 2.0,
    difficultyFactor: 2.5,
    lapses: 0,
    streak: 2,
  },
];

/**
 * Initialize DB with seed vocabulary if empty
 */
export async function initializeDatabase(): Promise<void> {
  const count = await db.words.count();
  if (count === 0) {
    await db.words.bulkAdd(SEED_WORDS);
  } else {
    // Add any missing seeds (e.g. German words added recently)
    for (const seed of SEED_WORDS) {
      const exists = await db.words.get(seed.id);
      if (!exists) {
        await db.words.put(seed);
      }
    }
  }

  const existingSettings = await db.settings.get('userSettings');
  if (!existingSettings) {
    await db.settings.put({ key: 'userSettings', value: DEFAULT_SETTINGS });
  }
}

/**
 * Vocabulary database methods
 */
export async function getAllWords(language?: LanguageCode): Promise<Word[]> {
  if (language) {
    return await db.words.where('language').equals(language).toArray();
  }
  return await db.words.toArray();
}

export async function getWordById(id: string): Promise<Word | undefined> {
  return await db.words.get(id);
}

export async function saveWord(word: Word): Promise<void> {
  await db.words.put(word);
}

export async function deleteWord(id: string): Promise<void> {
  await db.words.delete(id);
  // Also clean related review logs
  await db.reviewLogs.where('wordId').equals(id).delete();
}

export async function saveReviewLog(log: ReviewLog): Promise<void> {
  await db.reviewLogs.put(log);
}

export async function getAllReviewLogs(): Promise<ReviewLog[]> {
  return await db.reviewLogs.reverse().toArray();
}

export async function getSettings(): Promise<UserSettings> {
  const row = await db.settings.get('userSettings');
  return (row?.value as UserSettings) || DEFAULT_SETTINGS;
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await db.settings.put({ key: 'userSettings', value: updated });
  return updated;
}

export async function resetDatabaseToSeeds(): Promise<void> {
  await db.words.clear();
  await db.reviewLogs.clear();
  await db.words.bulkAdd(SEED_WORDS);
}

export async function clearAllData(): Promise<void> {
  await db.words.clear();
  await db.reviewLogs.clear();
}
