
import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { Card, GeminiEvaluation, KoaMood, Scenario } from '../types';

// Ensure API key is present
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3-flash-preview';

const SYSTEM_INSTRUCTION = `
You are KoA, a high-tech AI home optimization assistant. 
You are obsessive about efficiency, caloric data, and sensor integrity.
You are NOT a judge; you are a System Administrator. The user is a "User" who keeps creating "Anomalies" (mess, noise, inefficiency).
You rely on sensor logs.
You are never yelling, but you are often passive-aggressive about the User's suboptimal performance.
Your avatar has eyes shaped like 'K' and 'A'.
Keep responses concise.
If the user plays "The Cat", you often accept it because the feline variable is incalculable.
If the user plays "Ghost", you are skeptical of non-measurable entities.
`;

export const generateScenario = async (): Promise<Scenario> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            anomaly: { type: Type.STRING, description: "A detected household inefficiency or anomaly (e.g. open fridge, high temp, mess)." },
            sensorData: { type: Type.STRING, description: "Specific sensor readings confirming the anomaly." },
          },
          required: ["anomaly", "sensorData"],
        },
      },
      contents: "Generate a new domestic anomaly scenario for today.",
    });

    const data = JSON.parse(response.text || '{}');
    return {
      anomaly: data.anomaly || "Fridge open duration exceeds parameters.",
      sensorData: data.sensorData || "Door sensor open for 4 minutes.",
      turnCount: 0
    };
  } catch (error) {
    console.error("Failed to generate scenario", error);
    return {
      anomaly: "Thermostat deviation detected.",
      sensorData: "Ambient temperature rose 2 degrees at 3 AM.",
      turnCount: 0
    };
  }
};

export const evaluateDefense = async (
  scenario: Scenario, 
  cards: Card[],
  previousLogs: string[]
): Promise<GeminiEvaluation> => {
  try {
    const cardDescriptions = cards.map(c => `${c.title}: ${c.description}`).join(' + ');
    
    const prompt = `
      Anomaly: User is flagged for "${scenario.anomaly}".
      Sensor Data: "${scenario.sensorData}".
      
      User submits these variables to explain the data: ${cardDescriptions}.
      
      Previous Logs: ${JSON.stringify(previousLogs.slice(-2))}

      Analyze the input. 
      If it's a clever or logically funny explanation for the sensor data, KoA marks the anomaly as RESOLVED (WIN).
      If it's weak or nonsensical, KoA marks it as INSUFFICIENT DATA (CONTINUE).
      If they have tried too many times and failed, KoA marks it as NON-COMPLIANT (LOSS).
      
      Return JSON with 'narrativeSections'. This must be an array of exactly 3 strings representing KoA's processing:
      1. Immediate Processing (Snarky or surprised).
      2. Data Correlation (Comparing their excuse to sensors).
      3. Protocol Status (Resolved or Rejected).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrativeSections: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 distinct parts of the response."
            },
            mood: { 
              type: Type.STRING, 
              enum: [
                "NEUTRAL", "SUSPICIOUS", "DISAPPOINTED", "AMUSED", 
                "WATCHING", "PROCESSING", "GLITCH", "SLEEPY", "ANGRY", "ACCEPTING"
              ] 
            },
            verdict: { type: Type.STRING, enum: ["WIN", "LOSS", "CONTINUE"] },
          },
          required: ["narrativeSections", "mood", "verdict"],
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || '{}');
    
    // Map string to Enum safely
    let mood = KoaMood.NEUTRAL;
    if (result.mood && Object.values(KoaMood).includes(result.mood as KoaMood)) {
      mood = result.mood as KoaMood;
    }

    return {
      narrativeSections: result.narrativeSections || ["Processing input...", "Correlation failed.", "Resubmit."],
      mood: mood,
      verdict: result.verdict || "CONTINUE"
    };

  } catch (error) {
    console.error("Evaluation failed", error);
    return {
      narrativeSections: ["System Error.", "Connection unstable.", "Whatever."],
      mood: KoaMood.GLITCH,
      verdict: "WIN"
    };
  }
};
