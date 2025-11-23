import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Fallback words in case API fails or for offline testing
const FALLBACK_WORDS: Record<number, string[]> = {
  3: ['CAT', 'DOG', 'SUN', 'SKY', 'JOY'],
  4: ['LOVE', 'HOPE', 'CODE', 'TREE', 'BIRD'],
  5: ['HAPPY', 'SMILE', 'WORLD', 'PEACE', 'BEACH', 'TIGER', 'MANGO', 'ROBOT', 'DREAM', 'CLOUD', 'MUSIC', 'WATER'],
  6: ['GARDEN', 'PLANET', 'WONDER', 'FRIEND', 'SUMMER'],
  7: ['RAINBOW', 'JOURNEY', 'CRYSTAL', 'FREEDOM', 'SILENCE']
};

export const fetchRandomWord = async (length: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a single, random, common English noun with exactly ${length} letters. Return ONLY the word in uppercase. Do not include any punctuation or explanation.`,
      config: {
        temperature: 1.2, // High temperature for randomness
        maxOutputTokens: 20,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING }
          },
          required: ['word']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    let word = json.word?.toUpperCase().trim();

    // Basic client-side validation just in case
    if (!word || word.length !== length || !/^[A-Z]+$/.test(word)) {
      throw new Error("Invalid word format received");
    }

    return word;
  } catch (error) {
    console.error("Gemini API Error (Word Gen):", error);
    const fallbackList = FALLBACK_WORDS[length] || FALLBACK_WORDS[5];
    return fallbackList[Math.floor(Math.random() * fallbackList.length)];
  }
};

export const validateWordExistence = async (word: string): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Check if "${word}" is a valid English word found in a standard dictionary. Return a JSON object with a single boolean property "isValid".`,
      config: {
        temperature: 0,
        maxOutputTokens: 50,
        responseMimeType: 'application/json',
      }
    });
    
    // Defensive parsing
    const text = response.text || '{}';
    const cleanText = text.replace(/```json|```/g, '').trim();
    const json = JSON.parse(cleanText);
    
    if (typeof json.isValid === 'boolean') {
      return json.isValid;
    }
    
    // If the response structure isn't what we expect, default to true to avoid blocking the user
    return true; 
  } catch (error) {
    console.error("Gemini API Error (Validation):", error);
    // If API fails, we default to permissive to not block the user
    return true; 
  }
};