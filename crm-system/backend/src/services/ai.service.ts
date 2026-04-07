import OpenAI from 'openai';
import { prisma } from '../index';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AiService = {
  async summarizeLead(leadId: string, messagesText: string) {
    console.log(`[AI] Summarizing lead ${leadId}`);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analyze this conversation and extract a JSON strictly matching this structure:
{
  "interest": "main product/service of interest",
  "objections": "any mentioned objections or concerns",
  "funnelStage": "discovery | consideration | decision",
  "temperature": "cold | warm | hot",
  "conversionProbability": <number 0-100>,
  "shortSummary": "Max 3 lines summary"
}
Output strictly JSON without markdown blocks.`
          },
          {
            role: "user",
            content: messagesText
          }
        ],
        temperature: 0.2
      });

      const resultText = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(resultText.trim().replace(/^```json/, '').replace(/```$/, ''));

      await prisma.leadAiSummary.upsert({
        where: { leadId },
        update: {
          interest: parsed.interest,
          objections: parsed.objections,
          funnelStage: parsed.funnelStage,
          temperature: parsed.temperature,
          conversionProbability: parsed.conversionProbability,
          shortSummary: parsed.shortSummary,
          lastUpdatedAt: new Date()
        },
        create: {
          leadId,
          interest: parsed.interest,
          objections: parsed.objections,
          funnelStage: parsed.funnelStage,
          temperature: parsed.temperature,
          conversionProbability: parsed.conversionProbability,
          shortSummary: parsed.shortSummary
        }
      });

      console.log(`[AI] Summary updated successfully for lead ${leadId}`);
    } catch (err) {
      console.error('[AI] Fail to summarize lead:', err);
    }
  }
};
