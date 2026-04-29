import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Path to our local data files
const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');
const RESULTS_FILE = path.join(process.cwd(), 'src/data/results.json');

async function getLocalData() {
  const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
  return JSON.parse(data);
}

async function saveResult(result: any) {
  try {
    let results = [];
    try {
      const existingData = await fs.readFile(RESULTS_FILE, 'utf8');
      results = JSON.parse(existingData);
    } catch (e) {
      // File doesn't exist yet
    }
    
    results.push({
      timestamp: new Date().toISOString(),
      ...result
    });
    
    await fs.writeFile(RESULTS_FILE, JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Failed to save result locally:', error);
  }
}

export async function POST(req: Request) {
  try {
    const { analysisResult, userId } = await req.json();

    if (!analysisResult || !analysisResult.conditions) {
      return NextResponse.json({ error: 'Invalid analysis result' }, { status: 400 });
    }

    // Filter by confidence and sort
    let filteredConditions = analysisResult.conditions
      .filter((c: any) => c.confidence > 0.6)
      .sort((a: any, b: any) => b.confidence - a.confidence);

    if (filteredConditions.length === 0) {
      const response = {
        message: "No clear skin condition detected. Try better lighting.",
        conditions: [],
        recommended_products: []
      };
      // Log empty results too
      await saveResult({ analysisResult, finalResponse: response });
      return NextResponse.json(response);
    }

    // Get local data
    const localData = await getLocalData();
    const { products, mappings } = localData;

    // Map conditions to products (severity-aware matching)
    const productIds: string[] = [];
    for (const condition of filteredConditions) {
      // First try exact match (condition + severity)
      let match = mappings.find(
        (m: any) => m.condition === condition.name && m.severity === condition.severity
      );
      // Fallback to just condition name
      if (!match) {
        match = mappings.find((m: any) => m.condition === condition.name);
      }
      if (match) {
        productIds.push(...match.product_ids);
      }
    }
    
    const uniqueProductIds = Array.from(new Set(productIds));
    const recommendedProducts = products.filter((p: any) => uniqueProductIds.includes(p.id));

    // Educational content
    const educationalContent: Record<string, any> = {
      acne: {
        what: "Clogged pores causing pimples",
        why: "Excess oil, dead skin cells, and bacteria",
        severity_note: "Moderate to severe acne may require consistent treatment."
      },
      pigmentation: {
        what: "Darker patches of skin",
        why: "Excess melanin production, often triggered by sun exposure or hormones.",
        severity_note: "Sun protection is crucial for managing pigmentation."
      },
      melasma: {
        what: "Brown or gray-brown patches on the face",
        why: "Hormonal changes and sun exposure.",
        severity_note: "Requires a targeted approach to inhibit melanin."
      },
      dark_patches: {
        what: "Thickened, darker skin patches (Acanthosis Nigricans)",
        why: "Insulin resistance or friction.",
        severity_note: "Gentle exfoliation helps improve appearance."
      },
      open_pores: {
        what: "Visible openings of hair follicles",
        why: "Loss of skin elasticity or excess sebum.",
        severity_note: "Keeping pores clean reduces their appearance."
      }
    };

    const enhancedConditions = filteredConditions.map((c: any) => ({
      ...c,
      education: educationalContent[c.name] || {
        what: "A common skin concern.",
        why: "Various factors including environment and genetics.",
        severity_note: "Please consult a dermatologist for personalized advice."
      }
    }));

    const cartValue = recommendedProducts.reduce((sum: number, p: any) => sum + p.price, 0);
    let coupon = "FIX5";
    if (cartValue > 1000) coupon = "FIX15";
    else if (cartValue > 500) coupon = "FIX10";

    const finalResponse = {
      conditions: enhancedConditions,
      skin_type: analysisResult.skin_type,
      notes: analysisResult.notes,
      recommended_products: recommendedProducts,
      coupon: coupon
    };

    // Phase 2: Log to Supabase (Background)
    if (userId) {
      import('@/lib/supabaseServer').then(({ supabaseServer }) => {
        supabaseServer.from('scans').insert({
          user_id: userId,
          conditions: finalResponse.conditions,
          products: finalResponse.recommended_products,
          skin_type: finalResponse.skin_type
        }).then(({ error }) => {
          if (error) console.error('Supabase scan log failed', error);
        });
      });
    }

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('Recommendation Engine Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
