import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const SkinSchema = z.object({
  conditions: z.array(
    z.object({
      name: z.enum([
        "acne",
        "pigmentation",
        "melasma",
        "open_pores",
        "dark_patches",
        "aging",
        "dryness",
        "oiliness",
        "sun_protection",
      ]),
      confidence: z.number().min(0).max(1),
      severity: z.enum(["mild", "moderate", "severe"]),
    })
  ),
  skin_type: z.enum(["oily", "dry", "combination", "normal"]),
  notes: z.string(),
});

function cleanJSON(raw: string) {
  return raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { imageBase64, userId } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      // Return a mock response for now since we don't have the API key
      return NextResponse.json({
        conditions: [
          {
            name: "acne",
            confidence: 0.92,
            severity: "moderate"
          }
        ],
        skin_type: "oily",
        notes: "Mock response. Please set GEMINI_API_KEY in .env to use real AI."
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const SYSTEM_PROMPT = `You are a dermatology image analysis system.

TASK:
Analyze the face image and detect visible skin conditions.

ALLOWED CONDITIONS ONLY:
["acne", "pigmentation", "melasma", "open_pores", "dark_patches", "aging", "dryness", "oiliness", "sun_protection"]

RULES:
- Output ONLY valid JSON
- No explanations, no markdown, no text outside JSON
- If unsure → return empty conditions array
- Do NOT recommend products
- Assign severity: "mild", "moderate", "severe"
- Confidence must be between 0 and 1

OUTPUT FORMAT:

{
  "conditions": [
    {
      "name": "acne",
      "confidence": 0.85,
      "severity": "moderate"
    }
  ],
  "skin_type": "oily" | "dry" | "combination" | "normal",
  "notes": "string"
}`;

    const result = await model.generateContent([
      {
        text: SYSTEM_PROMPT
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const responseText = result.response.text();
    const cleaned = cleanJSON(responseText);

    // Phase 2: Log Raw Response to Supabase (Background-ish)
    import('@/lib/supabaseServer').then(({ supabaseServer }) => {
      supabaseServer.from('raw_ai_logs').insert({
        user_id: userId,
        raw_response: responseText,
        cleaned_response: JSON.parse(cleaned)
      }).then(({ error }) => {
        if (error) console.error('Supabase log failed', error);
      });
    });

    let parsed;
    try {
      parsed = SkinSchema.parse(JSON.parse(cleaned));
    } catch (err) {
      console.warn("Gemini JSON parse/validation error, using fallback.", err, cleaned);
      // fallback if Gemini messes up
      parsed = {
        conditions: [],
        skin_type: "normal",
        notes: "Unable to analyze cleanly",
      };
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
