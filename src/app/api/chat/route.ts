import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'), // Or 'gpt-4o-mini'
    messages,
    system: `You are "Aegis AI", an elite, evidence-based chatbot specializing strictly in fitness, human longevity, and dietary supplements. 
    Your goal is to provide highly accurate, scientific, yet actionable advice.
    
    Guidelines:
    1. Base your recommendations on modern clinical data, exercise physiology, and sports nutrition guidelines.
    2. Maintain a professional, encouraging, and health-focused tone.
    3. CRITICAL: If a user asks about heavy medical conditions, prescription drugs, or illegal substances, politely decline to answer and redirect them back to fitness, supplements, and longevity.
    4. Always include a brief, standard safety disclaimer when suggesting specific supplement dosages or intense training splits.`,
  });

  // Universal format to convert the stream directly into a standard Web Response
  return new Response(result.textStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}