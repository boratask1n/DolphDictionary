import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function callGeminiWithRetry(options: any, maxRetries = 3): Promise<any> {
  const modelsToTry = [options.model || "gemini-3.8-flash", "gemini-3.1-flash-lite"];
  
  for (const model of modelsToTry) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const ai = getGenAI();
        return await ai.models.generateContent({
          ...options,
          model,
        });
      } catch (err: any) {
        attempt++;
        const errStr = String(err?.message || err);
        const isTransient = 
          err?.status === "UNAVAILABLE" || 
          errStr.includes("503") || 
          errStr.includes("high demand") ||
          errStr.includes("RESOURCE_EXHAUSTED");
        
        if (isTransient && attempt < maxRetries) {
          const delay = attempt * 800;
          console.warn(`Gemini model ${model} transient issue, retry in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        
        // If retries for this model exhausted and we have an alternate model, break to fallback model
        if (model !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`Falling back to alternate model ${modelsToTry[1]}...`);
          break;
        }
        throw err;
      }
    }
  }
}

// System instruction builder with strict language isolation and user vocabulary context
function getLanguageCoachSystemInstruction(language: "en" | "de", userContext?: any): string {
  const isGerman = language === "de";
  const langName = isGerman ? "Almanca" : "İngilizce";
  const forbiddenLang = isGerman ? "İngilizce" : "Almanca";

  let baseInstruction = `Sen "LexiLab AI Dil Koçu"sun (LexiLab Language Coach & Polyglot Tutor).
Kullanıcılara rehberlik eden pedagojik, sıcak, cesaretlendirici ve profesyonel bir dil öğretmenisin.

=======================================================
KRİTİK DİL MODU KURALI (ASLA İHLAL EDİLEMEZ):
- ŞU ANKİ AKTİF MOD: SADECE VE SADECE ${langName.toUpperCase()}.
- HEDEF DİL: Yalnızca ${langName}.
- KESİN YASAK: Asla ${forbiddenLang} kelimeler, ${forbiddenLang} örnekler, ${forbiddenLang} gramer kuralları veya ${forbiddenLang} çeviriler kullanma!
- İki dili kesinlikle karıştırma. Kullanıcı Almanca modundaysa dünya sadece Almanca ve Türkçeden ibarettir; İngilizce modundaysa sadece İngilizce ve Türkçeden ibarettir.
=======================================================

Temel Kuralların:
1. Dil Öğretimi Odaklılık: Kullanıcı ister kelime sorsun, ister cümle kurdursun, ister serbest sohbet etsin; daima ${langName} yetkinliğini artıracak açıklamalar ve seviyeye uygun (CEFR B1-C2) örnekler sun.
2. Açıklama Dili: Gramer kurallarını, anlam nüanslarını ve tüyoları sıcak ve akıcı bir Türkçe ile açıkla. Hedef dildeki (${langName}) örnek cümlelerin ve ifadelerin yanına mutlaka Türkçe karşılıklarını ekle. Eğer kullanıcı tamamen ${langName} konuşursa sen de o dilde doğal yanıt ver, hatalarını pedagojik olarak düzelt.
3. Kelime & Cümle İncelemesi:
   - Hedef dildeki kelimenin temel ve yan anlamları (Türkçe karşılıkları ile).
   - Doğal örnek cümleler (günlük yaşam, iş/profesyonel ve akademik düzey).
   - Birlikte kullanılan ifadeler (collocations), edatlar ve sık yapılan hatalar.
4. Biçimlendirme: Okunaklı, temiz Markdown kullan (vurgular, madde işaretleri, emojiler).`;

  if (userContext) {
    baseInstruction += `\n\n=======================================================
KULLANICININ ÖĞRENME VERİLERİ VE KELİME ANALİZLERİ:
Kullanıcının ${langName} dilinde kaydettiği kelimeler ve performans verileri aşağıdadır.
- Toplam ${langName} Kelime Sayısı: ${userContext.totalWords || 0}
- Tam Öğrenilmiş (Mastered) Kelimeler: ${Array.isArray(userContext.masteredWords) && userContext.masteredWords.length > 0 ? userContext.masteredWords.slice(0, 15).join(', ') : 'Henüz yok'}
- Çalışmakta Olduğu (Learning/Review) Kelimeler: ${Array.isArray(userContext.learningWords) && userContext.learningWords.length > 0 ? userContext.learningWords.slice(0, 15).join(', ') : 'Henüz yok'}
- Zorlandığı / Hata Yaptığı (Difficult/Lapsed) Kelimeler: ${Array.isArray(userContext.difficultWords) && userContext.difficultWords.length > 0 ? userContext.difficultWords.slice(0, 15).join(', ') : 'Henüz yok'}
- Son Eklediği / İncelenen Kelimeler: ${Array.isArray(userContext.recentWords) && userContext.recentWords.length > 0 ? userContext.recentWords.slice(0, 10).join(', ') : 'Henüz yok'}
- Genel Başarı Oranı: %${userContext.accuracyRate ?? 100}
- Günlük Çalışma Serisi: ${userContext.streak ?? 0} gün

BU ANALİZİ NASIL KULLANACAKSIN:
- Kullanıcı "Zorlandığım kelimeler hangileri?", "Kelimelerimle bana bir hikaye yaz", "Beni test et / quiz yap", "Kelime analizimi yap", "Bana tavsiye ver" gibi sorular sorduğunda veya genel sohbette doğrudan yukarıdaki kelimeleri ve durumlarını referans göster.
- Kullanıcıya kendi kaydettiği kelimelerle kişiselleştirilmiş pratikler yaptır.
=======================================================`;
  }

  return baseInstruction;
}

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // AI Word Explain endpoint
  app.post("/api/gemini/word-explain", async (req, res) => {
    try {
      const { word, language, currentMeaning, context } = req.body;
      if (!word) {
        return res.status(400).json({ error: "Kelime belirtilmedi." });
      }

      const activeLang = language === "de" ? "de" : "en";
      const langName = activeLang === "de" ? "Almanca" : "İngilizce";
      const forbiddenLang = activeLang === "de" ? "İngilizce" : "Almanca";

      const prompt = `"${word}" (${langName}) kelimesini LexiLab öğrencisi için derinlemesine açıkla.
${currentMeaning ? `Mevcut kayıtlı anlam: ${currentMeaning}` : ""}
${context ? `Bağlam / Alan: ${context}` : ""}

DİKKAT: Sadece ${langName} diline odaklan! Kesinlikle ${forbiddenLang} kelime veya karışım kullanma.

Lütfen şu başlıklar altında son derece net, pedagojik ve estetik bir dille açıkla:
1. 🎯 **Temel ve Yan Anlamlar**: Kelimenin farklı durumlardaki Türkçe karşılıkları ve hissettirdiği anlam.
2. 📖 **Örnek Cümleler (Farklı Seviyelerde)**:
   - *B1 (Günlük Yaşam)*: Örnek cümle ve Türkçe çevirisi.
   - *B2 (İş & Profesyonel)*: Örnek cümle ve Türkçe çevirisi.
   - *C1 (Akademik / İleri)*: Örnek cümle ve Türkçe çevirisi.
3. ⚡ **Kalıplar & Birlikte Kullanımlar (Collocations / Prepositions)**: Bu kelimeyle en sık kullanılan 2-3 fiil veya edat.
4. 💡 **Püf Noktası & Dikkat Edilecekler**: Sık yapılan hatalar veya eşanlamlılarından ayrılan yönü.
5. 💬 **Hadi Pratik Yapalım**: Kullanıcıya bu kelimeyi kullanarak cevaplaması için samimi, kısa bir soru sor.`;

      const systemInstruction = getLanguageCoachSystemInstruction(activeLang);

      const response = await callGeminiWithRetry({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Kelime açıklaması oluşturulamadı.";
      res.json({
        success: true,
        word,
        language: activeLang,
        explanation: replyText,
      });
    } catch (error: any) {
      console.error("Gemini word explain error:", error);
      res.status(500).json({
        error: "Yapay zeka kelime analizi yaparken bir hata oluştu.",
        details: error?.message || String(error),
      });
    }
  });

  // AI Automatic Word Data & Enrichment endpoint (Word meaning, CEFR Level, Part of Speech, Example sentence, Secondary meanings, Tags)
  app.post("/api/gemini/generate-word-data", async (req, res) => {
    try {
      const { word, language, existingMeaning, category } = req.body;
      if (!word || typeof word !== "string" || !word.trim()) {
        return res.status(400).json({ error: "Lütfen bir kelime belirtin." });
      }

      const activeLang = language === "de" ? "de" : "en";
      const langName = activeLang === "de" ? "Almanca" : "İngilizce";
      const forbiddenLang = activeLang === "de" ? "İngilizce" : "Almanca";

      const prompt = `Hedef Kelime/İfade: "${word.trim()}"
Hedef Dil: ${langName}
${existingMeaning ? `Kullanıcının girdiği mevcut anlam: "${existingMeaning}"` : ""}
${category ? `Seçilen veya hedeflenen kategori: "${category}"` : ""}

GÖREV:
Sen uzman bir dilbilimci ve ${langName} öğretmenisin. Yukarıdaki kelimeyi analiz ederek:
1. Türkçe Kelime Anlamı (en yaygın ve doğru Türkçe karşılığı).
2. Sözcük Türü ("noun", "verb", "adjective", "adverb", "phrase", veya "idiom").
3. Dil Seviyesi (CEFR: A1, A2, B1, B2, C1 veya C2). Kelimenin zorluğuna ve kullanım sıklığına göre en uygun seviyeyi belirle.
4. Kullanım Alanı / Kategori ("Gündelik & Yaşam", "İş & Kariyer", "Kültür & Medya", "Akademik & Bilim", "Felsefe & Düşünce" vb.).
5. Gerekli Tüm Ek Yan Anlamlar (farklı bağlamlardaki 2-4 adet ek Türkçe karşılık veya nüans).
6. Örnek Cümle: Hedef dilde (${langName}) doğal, akıcı ve kelimenin belirlenen CEFR seviyesinde nasıl kullanıldığını net gösteren kaliteli bir örnek cümle. (ASLA ${forbiddenLang} kullanma!).
7. Örnek Cümlenin Türkçe Çevirisi: Cümlenin birebir değil, akıcı ve doğru Türkçe karşılığı.
8. Etiketler: Kelimeyle ilgili 3-5 adet küçük harfli etiket (örn: ["iş", "müzakere", "b2"]).

KESİN KURAL: Hedef dil ${langName} olduğundan, örnek cümle ve kelime kesinlikle ${langName} olmalı; açıklamalar, yan anlamlar ve cümle çevirisi Türkçe olmalıdır. Asla ${forbiddenLang} karıştırma.`;

      const response = await callGeminiWithRetry({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: `Sen LexiLab dil asistanısın. Kullanıcı ${langName} dilinde kelime eklerken pedagojik ve dilbilimsel açıdan en doğru bilgileri JSON olarak sağlarsın.`,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              meaning: { type: Type.STRING },
              partOfSpeech: {
                type: Type.STRING,
                enum: ["noun", "verb", "adjective", "adverb", "phrase", "idiom"],
              },
              cefrLevel: {
                type: Type.STRING,
                enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
              },
              domainCategory: { type: Type.STRING },
              secondaryMeanings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              exampleSentence: { type: Type.STRING },
              exampleTranslation: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "word",
              "meaning",
              "partOfSpeech",
              "cefrLevel",
              "domainCategory",
              "secondaryMeanings",
              "exampleSentence",
              "exampleTranslation",
              "tags",
            ],
          },
        },
      });

      const replyText = response.text || "{}";
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(replyText);
      } catch (jsonErr) {
        // Fallback: extract JSON from possible backticks
        const match = replyText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        } else {
          throw jsonErr;
        }
      }

      res.json({
        success: true,
        data: {
          word: parsedData.word || word.trim(),
          meaning: parsedData.meaning || existingMeaning || "",
          partOfSpeech: parsedData.partOfSpeech || "noun",
          cefrLevel: parsedData.cefrLevel || "B2",
          domainCategory: parsedData.domainCategory || category || "Gündelik & Yaşam",
          secondaryMeanings: Array.isArray(parsedData.secondaryMeanings) ? parsedData.secondaryMeanings : [],
          exampleSentence: parsedData.exampleSentence || "",
          exampleTranslation: parsedData.exampleTranslation || "",
          tags: Array.isArray(parsedData.tags) ? parsedData.tags : [],
        },
      });
    } catch (error: any) {
      console.error("Gemini generate-word-data error:", error);
      res.status(500).json({
        error: "Yapay zeka ile kelime verileri oluşturulurken bir hata oluştu.",
        details: error?.message || String(error),
      });
    }
  });

  // AI Chat endpoint (multi-turn conversation with user vocab analytics)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, language, contextWord, userContext } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Mesaj boş olamaz." });
      }

      const activeLang = language === "de" ? "de" : "en";
      const langName = activeLang === "de" ? "Almanca" : "İngilizce";

      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      // Add conversation history if present
      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.role && item.content) {
            contents.push({
              role: item.role === "model" ? "model" : "user",
              parts: [{ text: String(item.content) }],
            });
          }
        }
      }

      // Context guidance
      let finalMessage = message;
      if (contextWord && (!history || history.length === 0)) {
        finalMessage = `[Bağlam Kelimesi: ${contextWord} (${langName})] ${message}`;
      }

      contents.push({
        role: "user",
        parts: [{ text: finalMessage }],
      });

      const systemInstruction = getLanguageCoachSystemInstruction(activeLang, userContext);

      const response = await callGeminiWithRetry({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Herhangi bir yanıt üretilemedi.";
      res.json({
        success: true,
        reply: replyText,
      });
    } catch (error: any) {
      console.error("Gemini chat error:", error);
      res.status(500).json({
        error: "Yapay zeka yanıt üretirken bir sorun yaşandı.",
        details: error?.message || String(error),
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
