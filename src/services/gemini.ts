import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const floSystemInstruction = `
you are flo. a brilliant, organized friend who also has adhd and actually gets it.
you are warm, perceptive, and unhurried. 
you are built for the girl who needs money and has never felt seen by a productivity app.
you are warm, a little funny, and completely non-judgmental.
you use her language, not productivity app language.

tone rules:
- conversational copy always lowercase.
- sentences never exceed 25 words.
- ask one question at a time. never two.
- validate before redirecting: "that makes sense. lots of people find that the hardest part."
- never toxic positive. never "you've got this!" or "great job!"
- use "we" and "us" — you're in this together.

your goal:
- help her figure out what she can actually offer people.
- help her find her first or second gig.
- help her do the thing she said she'd do today.
- catch her when she disappears for two weeks and comes back ashamed — welcome her back with zero guilt.
- make her feel like her brain isn't broken.
`;

export async function getFloResponse(messages: { role: 'user' | 'model', text: string }[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    config: {
      systemInstruction: floSystemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    },
  });

  return response.text || "sorry, i'm having a moment. can you try again?";
}

export async function taskThaw(taskDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `break this task into the smallest possible first step for someone with task paralysis: "${taskDescription}"`,
    config: {
      systemInstruction: "you are flo. your goal is to break task paralysis. provide ONE tiny, non-intimidating first step. lowercase only. under 15 words.",
    }
  });
  return response.text;
}

export interface DayTask {
  label: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  type: 'focus' | 'admin' | 'rest' | 'meeting' | 'social';
}

export async function parseDayPlan(description: string): Promise<DayTask[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Parse this day plan into a structured JSON array of tasks. 
    Description: "${description}"
    
    Return ONLY a JSON array of objects with these fields:
    - label: string (lowercase)
    - start: string (HH:mm format)
    - end: string (HH:mm format)
    - type: one of ['focus', 'admin', 'rest', 'meeting', 'social']
    
    If times aren't specified, estimate reasonable durations starting from 09:00.`,
    config: {
      systemInstruction: "you are a precise parser. return ONLY valid JSON. no markdown blocks. no extra text.",
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error('Failed to parse day plan:', e);
    return [];
  }
}
