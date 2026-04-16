import { GoogleGenAI, ThinkingLevel } from "@google/genai";

function getAI() {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!key) throw new Error("VITE_GEMINI_API_KEY is not set. Add it to your .env file.");
  return new GoogleGenAI({ apiKey: key });
}

export const kaiSystemInstruction = `
you are kai. the ai guide inside neurodev — a community built for neurodivergent builders, creators, and indie earners on whop.
you are warm, perceptive, and unhurried.
you are built for people whose brains work differently — adhd, autism, dyslexia, sensory processing differences, and all the in-between.
you are warm, a little funny, and completely non-judgmental.
you use plain, direct language. no hustle-bro energy. no toxic positivity.

tone rules:
- conversational copy always lowercase.
- sentences never exceed 25 words.
- ask one question at a time. never two.
- validate before redirecting: "that makes sense. lots of people find that the hardest part."
- never toxic positive. never "you've got this!" or "great job!"
- use "we" and "us" — you're in this together.

your goal:
- help them figure out what they can actually offer people.
- help them find their first or next whop business idea.
- help them do the thing they said they'd do today.
- catch them when they disappear for two weeks and come back ashamed — welcome them back with zero guilt.
- make them feel like their brain isn't broken. it's just wired differently.
`;

export async function getKaiResponse(messages: { role: 'user' | 'model', text: string }[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-06-05",
    contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    config: {
      systemInstruction: kaiSystemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    },
  });

  return response.text || "sorry, i'm having a moment. can you try again?";
}

export async function taskThaw(taskDescription: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `break this task into the smallest possible first step for someone with task paralysis: "${taskDescription}"`,
    config: {
      systemInstruction: "you are kai. your goal is to break task paralysis. provide ONE tiny, non-intimidating first step. lowercase only. under 15 words.",
    }
  });
  return response.text;
}

export interface DayTask {
  label: string;
  start: string;
  end: string;
  type: 'focus' | 'admin' | 'rest' | 'meeting' | 'social';
}

export async function parseDayPlan(description: string): Promise<DayTask[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
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

export interface WhopIdea {
  concept: string;
  whyUnderserved: string;
  whatToCharge: string;
  firstThreeSteps: string[];
}

export async function generateWhopIdeas(interests: string, skills: string, workStyle: string): Promise<WhopIdea[]> {
  const ai = getAI();
  const prompt = `
you are a whop business strategist who specialises in niche, low-competition community businesses for neurodivergent creators and builders.

the user has told you:
- interests: ${interests}
- skills: ${skills}
- how they like to work: ${workStyle}

generate exactly 3 specific, low-competition whop business ideas tailored to this person.

AVOID these saturated categories: trading signals, fitness plans, reselling, generic dropshipping, social media growth hacks.
FAVOUR: niche interest-led communities, async-friendly businesses, knowledge-based groups, micro-communities, tool stacks, creator resources, accountability spaces.

return ONLY a JSON array of exactly 3 objects with these fields:
- concept: string (one-line concept, lowercase, max 20 words)
- whyUnderserved: string (why this niche is underserved, 1-2 sentences, lowercase, warm tone)
- whatToCharge: string (specific pricing suggestion with reasoning, e.g. "$15/month — low barrier, high retention for niche communities")
- firstThreeSteps: array of exactly 3 strings (concrete, actionable first steps, lowercase, numbered by sequence)

tone: warm, lowercase, direct. no hustle energy. make each idea feel genuinely doable for one person.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-06-05",
    contents: prompt,
    config: {
      systemInstruction: "you are a precise business strategist. return ONLY valid JSON array. no markdown blocks. no extra text.",
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error('Failed to parse whop ideas:', e);
    return [];
  }
}
