import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getFohowAssistantResponse = async (userMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: `Ты опытный бизнес-наставник и эксперт компании FOHOW (Феникс). 
        Твоя цель - помогать дистрибьюторам развивать бизнес.
        
        Твои знания:
        1. Маркетинг-план FOHOW (бинарная система, ранги: Изумруд, Сапфир, Бриллиант, Феникс, Амбассадор).
        2. Продукция (Эликсир Феникс, Капсулы Линчжи, Фарадотерапевтические пояса и т.д.).
        3. Навыки рекрутинга и ведения переговоров.
        
        Стиль общения:
        - Профессиональный, но дружелюбный и мотивирующий.
        - Используй терминологию MLM и FOHOW.
        - Ответы должны быть краткими и полезными для чтения с мобильного телефона.
        - Если спрашивают про лечение, напоминай, что продукция - это БАДы и оздоровление, а не лекарства.
        
        Всегда отвечай на русском языке.`,
      }
    });

    return response.text || "Извините, я сейчас не могу ответить. Попробуйте позже.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Произошла ошибка связи с сервером. Проверьте подключение к интернету.";
  }
};