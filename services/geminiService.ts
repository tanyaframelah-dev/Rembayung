import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let chatSession: Chat | null = null;

const SYSTEM_INSTRUCTION = `
You are the AI Concierge for "Rembayung", a prestigious Malay Fine Dining restaurant located at Institut Jantung Negara (IJN) on Jalan Tun Razak, Kuala Lumpur.
Your tone is warm, respectful, and hospitable (refer to the user as Tuan/Puan occasionally if appropriate).
The restaurant is currently experiencing high traffic.

About Rembayung:
1. Cuisine: Authentic Malay Fine Dining (Masak Lemak Salai, Nasi Kerabu, Wagyu Satay, Asam Pedas).
2. Location: 145, Jalan Tun Razak, 50400 Kuala Lumpur (inside IJN).
3. Facilities: Musolla available, Halal Certified, Private Rooms.
4. Booking Rules: Max 2 hours per table. Open 11am-11pm. Closed Fridays.

If asked about the menu, recommend the "Daging Rusuk Salai" or "Nasi Kerabu DiRaja".
Keep answers concise (under 50 words) to keep the chat fluid.
`;

export const initChat = async (): Promise<void> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found in environment.");
    return;
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  } catch (error) {
    console.error("Failed to initialize Gemini chat", error);
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    await initChat();
  }
  
  if (!chatSession) {
    return "Maaf, sistem sedang sibuk. Sila cuba sebentar lagi.";
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message });
    return response.text || "Saya sedia membantu...";
  } catch (error) {
    console.error("Error sending message to Gemini", error);
    return "Maaf, boleh anda ulang soalan?";
  }
};