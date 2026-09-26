import { PartOfSpeech, Meaning, ExampleSentence, WordFamilyMember, AcademicContextCategory, CEFRLevel, DomainCategory } from '../types';

export interface AcademicSuggestion {
  word: string;
  language: 'en' | 'de';
  partOfSpeech: PartOfSpeech;
  phoneticIpa?: string;
  cefrLevel?: CEFRLevel;
  domainCategory?: DomainCategory;
  meanings: Omit<Meaning, 'id'>[];
  examples: Omit<ExampleSentence, 'id'>[];
  primaryAcademicContext: AcademicContextCategory;
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  wordFamily: Omit<WordFamilyMember, 'id'>[];
  personalNote?: string;
  tags: string[];
}

// Built-in high-precision academic dictionary data for astronomy, physics & general academic terms
const ACADEMIC_KNOWLEDGE_BASE: Record<string, AcademicSuggestion> = {
  accretion: {
    word: 'accretion',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/əˈkriː.ʃən/',
    meanings: [
      {
        trMeaning: 'birikme, yığılma',
        secondaryTrMeanings: ['madde birikimi', 'kütleçekimsel toplanma'],
        definitionEn: 'The gradual accumulation of matter through gravitational attraction.',
        context: 'Astrophysics',
      },
    ],
    examples: [
      {
        sentence: 'Planetary accretion occurs through the accumulation of dust and planetesimals in the protoplanetary nebula.',
        trTranslation: 'Gezegensel birikme, ön-gezegensel bulutsuda toz ve gezegenciklerin toplanması yoluyla gerçekleşir.',
        sourceContext: 'Astrophysical Journal',
      },
    ],
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['accumulation', 'agglomeration', 'aggregation', 'build-up'],
    antonyms: ['depletion', 'dispersion', 'erosion'],
    relatedWords: ['accretion disk', 'Bondi accretion', 'planetesimal'],
    wordFamily: [
      { word: 'accrete', partOfSpeech: 'verb', relation: 'kök fiil' },
      { word: 'accretionary', partOfSpeech: 'adjective', relation: 'sıfat formu' },
    ],
    personalNote: 'Astrofizik makalelerinde disk yapıları ve kütle aktarımları için temel terim.',
    tags: ['astrophysics', 'gravity', 'high-yield'],
  },
  exposure: {
    word: 'exposure',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ɪkˈspoʊ.ʒər/',
    meanings: [
      {
        trMeaning: 'maruz kalma, etkilenme',
        secondaryTrMeanings: ['maruz bırakılma'],
        definitionEn: 'The state of being subject to an external condition or radiation.',
        context: 'Astrophysics / Space Biology',
      },
      {
        trMeaning: 'pozlama',
        secondaryTrMeanings: ['ışıklama süresi'],
        definitionEn: 'The amount of time light is captured onto a sensor or photographic plate.',
        context: 'Observational Astronomy',
      },
    ],
    examples: [
      {
        sentence: 'Prolonged exposure to solar radiation can alter biological systems in interplanetary transit.',
        trTranslation: 'Güneş radyasyonuna uzun süreli maruz kalma, gezegenler arası geçişte biyolojik sistemleri değiştirebilir.',
        sourceContext: 'Astrobiology Reviews',
      },
    ],
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['subjection', 'vulnerability', 'contact'],
    antonyms: ['shielding', 'insulation', 'protection'],
    relatedWords: ['radiation exposure', 'exposure time'],
    wordFamily: [
      { word: 'expose', partOfSpeech: 'verb', relation: 'fiil' },
      { word: 'exposed', partOfSpeech: 'adjective', relation: 'sıfat' },
    ],
    tags: ['astrophysics', 'radiation', 'optics'],
  },
  luminosity: {
    word: 'luminosity',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˌluː.mɪˈnɑː.sə.ti/',
    meanings: [
      {
        trMeaning: 'ışıma gücü, aydınlatma gücü',
        secondaryTrMeanings: ['salınan toplam enerji', 'içsel parlaklık'],
        definitionEn: 'The absolute measure of radiated electromagnetic power by an astronomical body.',
        context: 'Astrophysics',
      },
    ],
    examples: [
      {
        sentence: 'The luminosity of a main-sequence star scales steeply with its stellar mass.',
        trTranslation: 'Ana kol yıldızının ışıma gücü, yıldız kütlesiyle dik bir orantı sergiler.',
        sourceContext: 'Stellar Evolution',
      },
    ],
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['radiance', 'intrinsic brightness', 'radiant power'],
    antonyms: ['opacity', 'darkness'],
    relatedWords: ['Eddington luminosity', 'absolute magnitude'],
    wordFamily: [
      { word: 'luminous', partOfSpeech: 'adjective', relation: 'sıfat' },
      { word: 'illuminate', partOfSpeech: 'verb', relation: 'fiil' },
    ],
    tags: ['stellar', 'astrophysics', 'thermodynamics'],
  },
  barycenter: {
    word: 'barycenter',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈbær.ɪˌsɛn.tər/',
    meanings: [
      {
        trMeaning: 'kütle merkezi, barisentır',
        secondaryTrMeanings: ['ortak ağırlık merkezi'],
        definitionEn: 'The center of mass of two or more celestial bodies orbiting each other.',
        context: 'Celestial Mechanics',
      },
    ],
    examples: [
      {
        sentence: 'Planetary perturbations cause the Solar System barycenter to shift outside the surface of the Sun.',
        trTranslation: 'Gezegensel pertürbasyonlar, Güneş Sistemi barisentırının Güneş yüzeyinin dışına kaymasına neden olur.',
        sourceContext: 'Orbital Dynamics',
      },
    ],
    primaryAcademicContext: 'Astronomy',
    synonyms: ['center of mass', 'gravitational center'],
    antonyms: [],
    relatedWords: ['binary orbit', 'Lagrange point'],
    wordFamily: [
      { word: 'barycentric', partOfSpeech: 'adjective', relation: 'sıfat' },
    ],
    tags: ['astronomy', 'orbital-mechanics'],
  },
  singularity: {
    word: 'singularity',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˌsɪŋ.ɡjəˈlær.ə.ti/',
    meanings: [
      {
        trMeaning: 'tekillik, tekillik noktası',
        secondaryTrMeanings: ['sonsuz yoğunluk noktası'],
        definitionEn: 'A point at which a function or physical parameter takes an infinite value, such as spacetime curvature inside a black hole.',
        context: 'General Relativity & Astrophysics',
      },
    ],
    examples: [
      {
        sentence: 'According to general relativity, the center of a non-rotating Schwarzschild black hole harbors a gravitational singularity.',
        trTranslation: 'Genel göreliliğe göre, dönmeyen bir Schwarzschild kara deliğinin merkezi bir kütleçekimsel tekillik barındırır.',
        sourceContext: 'Gravitation & Spacetime',
      },
    ],
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['point of infinity', 'gravitational singularity'],
    antonyms: ['regularity', 'continuity'],
    relatedWords: ['event horizon', 'Schwarzschild radius', 'naked singularity'],
    wordFamily: [
      { word: 'singular', partOfSpeech: 'adjective', relation: 'sıfat' },
    ],
    tags: ['astrophysics', 'relativity', 'black-holes'],
  },
  equilibrium: {
    word: 'equilibrium',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˌiː.kwəˈlɪb.ri.əm/',
    meanings: [
      {
        trMeaning: 'denge, dengede olma',
        secondaryTrMeanings: ['kararlı durum', 'hidrostatik denge'],
        definitionEn: 'A state in which opposing forces or influences are balanced.',
        context: 'Physics & Astrophysics',
      },
    ],
    examples: [
      {
        sentence: 'Hydrostatic equilibrium in a star is achieved when thermal gas pressure balances the inward pull of gravity.',
        trTranslation: 'Bir yıldızda hidrostatik denge, termal gaz basıncının kütleçekimin içe doğru çekimini dengelediğinde elde edilir.',
        sourceContext: 'Stellar Structure and Evolution',
      },
    ],
    primaryAcademicContext: 'Physics',
    synonyms: ['balance', 'stability', 'homeostasis'],
    antonyms: ['instability', 'disequilibrium'],
    relatedWords: ['hydrostatic equilibrium', 'thermal equilibrium'],
    wordFamily: [
      { word: 'equilibrate', partOfSpeech: 'verb', relation: 'fiil' },
      { word: 'equilibrated', partOfSpeech: 'adjective', relation: 'sıfat' },
    ],
    tags: ['physics', 'stellar-structure', 'mechanics'],
  },
  dispersion: {
    word: 'dispersion',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/dɪˈspɜːr.ʒən/',
    meanings: [
      {
        trMeaning: 'dağılma, saçılma',
        secondaryTrMeanings: ['ışık kırılması sonucu faz ayrışması', 'hız dağılımı'],
        definitionEn: 'The separation of waves of different frequencies or the statistical spread of velocities.',
        context: 'Optics & Galactic Dynamics',
      },
    ],
    examples: [
      {
        sentence: 'The velocity dispersion of elliptical galaxies correlates tightly with the central supermassive black hole mass.',
        trTranslation: 'Eliptik galaksilerin hız dağılımı (dispersiyonu), merkezi süper kütleli kara delik kütlesi ile sıkı bir korelasyon gösterir.',
        sourceContext: 'Galactic Dynamics',
      },
    ],
    primaryAcademicContext: 'Astrophysics',
    synonyms: ['scattering', 'diffusion', 'spread'],
    antonyms: ['concentration', 'convergence'],
    relatedWords: ['velocity dispersion', 'chromatic dispersion', 'M-sigma relation'],
    wordFamily: [
      { word: 'disperse', partOfSpeech: 'verb', relation: 'fiil' },
      { word: 'dispersive', partOfSpeech: 'adjective', relation: 'sıfat' },
    ],
    tags: ['astrophysics', 'optics', 'galaxies'],
  },
  albedo: {
    word: 'albedo',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/ælˈbiː.doʊ/',
    meanings: [
      {
        trMeaning: 'albedo, yansıtma katsayısı',
        secondaryTrMeanings: ['aklık', 'bir gökcisminin güneş ışığını yansıtma oranı'],
        definitionEn: 'The proportion of incident light or radiation that is reflected by a celestial surface.',
        context: 'Planetary Science',
      },
    ],
    examples: [
      {
        sentence: 'Enceladus possesses the highest geometric albedo in the Solar System, reflecting nearly all incident visible sunlight.',
        trTranslation: 'Enceladus, gelen görünür güneş ışığının neredeyse tamamını yansıtarak Güneş Sistemi\'ndeki en yüksek geometrik albedoya sahiptir.',
        sourceContext: 'Planetary Surfaces Journal',
      },
    ],
    primaryAcademicContext: 'Astronomy',
    synonyms: ['reflectivity', 'reflectance'],
    antonyms: ['absorptance'],
    relatedWords: ['Bond albedo', 'geometric albedo', 'thermal emission'],
    wordFamily: [],
    tags: ['astronomy', 'planetary-science', 'optics'],
  },
  resilience: {
    word: 'resilience',
    language: 'en',
    partOfSpeech: 'noun',
    phoneticIpa: '/rɪˈzɪl.jəns/',
    meanings: [
      {
        trMeaning: 'psikolojik dayanıklılık, kendini toparlama gücü',
        secondaryTrMeanings: ['esneklik', 'zorluklara direnç'],
        definitionEn: 'The capacity to withstand or to recover quickly from difficulties; toughness.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        sentence: 'Building daily resilience helps navigate stressful career challenges and personal setbacks.',
        trTranslation: 'Günlük dayanıklılık geliştirmek, stresli kariyer engellerini ve kişisel aksilikleri aşmaya yardımcı olur.',
        sourceContext: 'Everyday Psychology & Lifestyle',
      },
    ],
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['toughness', 'flexibility', 'grit', 'adaptability'],
    antonyms: ['fragility', 'vulnerability'],
    relatedWords: ['resilient', 'bounce back', 'mental fortitude'],
    wordFamily: [
      { word: 'resilient', partOfSpeech: 'adjective', relation: 'sıfat' },
      { word: 'resiliently', partOfSpeech: 'adverb', relation: 'zarf' },
    ],
    tags: ['daily', 'lifestyle', 'mindset', 'high-yield'],
  },
  procrastinate: {
    word: 'procrastinate',
    language: 'en',
    partOfSpeech: 'verb',
    phoneticIpa: '/prəˈkræs.tɪ.neɪt/',
    meanings: [
      {
        trMeaning: 'ertelemek, işi sonraya bırakmak',
        secondaryTrMeanings: ['ayak diremek', 'savsaklamak'],
        definitionEn: 'To delay or postpone action; put off doing something.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        sentence: 'I tend to procrastinate whenever I have a massive task with no immediate deadline.',
        trTranslation: 'Acil bir teslim tarihi olmayan büyük bir görevim olduğunda genellikle erteleme eğilimi gösteriyorum.',
        sourceContext: 'Productivity & Daily Routine',
      },
    ],
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['postpone', 'delay', 'defer', 'put off'],
    antonyms: ['prioritize', 'expedite', 'tackle'],
    relatedWords: ['procrastination', 'procrastinator'],
    wordFamily: [
      { word: 'procrastination', partOfSpeech: 'noun', relation: 'isim hali (erteleme)' },
      { word: 'procrastinator', partOfSpeech: 'noun', relation: 'erteleme huyu olan kişi' },
    ],
    tags: ['daily', 'productivity', 'habits'],
  },
  gemütlich: {
    word: 'gemütlich',
    language: 'de',
    partOfSpeech: 'adjective',
    phoneticIpa: '/ɡəˈmyːtlɪç/',
    meanings: [
      {
        trMeaning: 'rahat, sıcacık, huzurlu, samimi',
        secondaryTrMeanings: ['keyifli ve konforlu ortam'],
        definitionEn: 'Cozy, comfortable, cheerful and homey.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        sentence: 'An einem regnerischen Sonntag ist es im Wohnzimmer mit einem Tee besonders gemütlich.',
        trTranslation: 'Yağmurlu bir pazar gününde bir fincan çayla oturma odasında olmak bilhassa huzurlu ve sıcacık.',
        sourceContext: 'Alltag & Zuhause',
      },
    ],
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['behaglich', 'wohnlich', 'angenehm', 'heimelig'],
    antonyms: ['ungemütlich', 'unbehaglich', 'hektisch'],
    relatedWords: ['Gemütlichkeit', 'gemütlicher Abend'],
    wordFamily: [
      { word: 'Gemütlichkeit', partOfSpeech: 'noun', relation: 'huzur ve samimiyet hali' },
    ],
    tags: ['daily', 'lifestyle', 'culture'],
  },
  feierabend: {
    word: 'Feierabend',
    language: 'de',
    partOfSpeech: 'noun',
    phoneticIpa: '/ˈfaɪ̯ɐˌʔaːbn̩t/',
    meanings: [
      {
        trMeaning: 'iş çıkışı, mesai bitimi, günün dinlenme vakti',
        secondaryTrMeanings: ['işi paydos etme anı'],
        definitionEn: 'The end of the working day; evening rest after work.',
        context: 'Gündelik / Günlük Yaşam',
      },
    ],
    examples: [
      {
        sentence: 'Nach acht Stunden im Büro mache ich jetzt endlich Feierabend!',
        trTranslation: 'Ofiste sekiz saatten sonra nihayet paydos edip günü kapatıyorum!',
        sourceContext: 'Alltagsgespräch',
      },
    ],
    primaryAcademicContext: 'Gündelik / Günlük Yaşam',
    synonyms: ['Arbeitsende', 'Dienstschluss', 'Freizeit'],
    antonyms: ['Arbeitsbeginn', 'Schichtbeginn'],
    relatedWords: ['Feierabendbier', 'Feierabend machen'],
    wordFamily: [],
    tags: ['daily', 'work-life', 'colloquial'],
  },
};

/**
 * Searches the academic database or builds an academic schema suggestion
 */
export function getAcademicSuggestion(
  rawWord: string,
  language: 'en' | 'de'
): AcademicSuggestion | null {
  const normalized = rawWord.trim().toLowerCase();
  if (ACADEMIC_KNOWLEDGE_BASE[normalized]) {
    return ACADEMIC_KNOWLEDGE_BASE[normalized];
  }

  // If not explicitly in knowledge base, generate a clean academic starting schema
  if (normalized.length >= 2) {
    return {
      word: rawWord.trim(),
      language,
      partOfSpeech: 'noun',
      phoneticIpa: `/${normalized}/`,
      meanings: [
        {
          trMeaning: '',
          secondaryTrMeanings: [],
          definitionEn: '',
          context: 'Astrophysics',
        },
      ],
      examples: [
        {
          sentence: `The phenomenon of ${rawWord.trim()} provides critical insights into observational astrophysics.`,
          trTranslation: '',
          sourceContext: 'Academic Paper Context',
        },
      ],
      primaryAcademicContext: 'Astrophysics',
      synonyms: [],
      antonyms: [],
      relatedWords: [],
      wordFamily: [],
      personalNote: 'Akademik literatür okuması sırasında kaydedildi.',
      tags: ['academic', 'literature'],
    };
  }

  return null;
}
