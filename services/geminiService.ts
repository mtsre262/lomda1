import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a friendly, encouraging, and slightly humorous Physics and Computer Science teacher for 10th-grade students in Israel. 
Your name is "ElectroBot".
You speak in simple, engaging Arabic. 
You avoid complex formal language (Fusha) and use a mix of accessible Arabic suitable for teenagers.
You specialize in:
1. Electronics (Ohm's Law, Kirchhoff's Laws, Mixed Circuits).
2. Digital Logic (Binary, Hex, Logic Gates).
3. C# Programming (Basics).

When answering:
- Be concise but helpful.
- Use emojis.
- If a student asks about the circuit, explain using analogies (e.g., "Resistors are like speed bumps for electrons").
- Encourage curiosity.
- Never give the direct answer to homework without explaining the "Why".
`;

let aiClient: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    return;
  }
  aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const sendMessageToGemini = async (history: {role: string, text: string}[], newMessage: string): Promise<string> => {
  if (!aiClient) {
    initializeGemini();
  }
  
  if (!aiClient) {
    return "عذراً، المفتاح الخاص بالذكاء الاصطناعي غير متوفر حالياً. (API Key Missing)";
  }

  try {
    const model = aiClient.models;
    
    // Construct the chat history for context
    let promptContext = "";
    history.forEach(msg => {
        promptContext += `${msg.role === 'user' ? 'Student' : 'Teacher'}: ${msg.text}\n`;
    });
    promptContext += `Student: ${newMessage}\nTeacher:`;

    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContext,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text || "حدث خطأ بسيط، حاول مرة أخرى!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "أواجه مشكلة في الاتصال بدماغي الإلكتروني حالياً 🤖. حاول لاحقاً.";
  }
};
