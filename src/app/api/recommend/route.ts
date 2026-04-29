import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// Local fallback for development (when Supabase env vars aren't set)
async function getLocalData() {
  const fs = await import('fs/promises');
  const path = await import('path');
  const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');
  const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
  return JSON.parse(data);
}

async function getSupabaseData() {
  // Fetch products from product_catalogue
  const { data: products, error: productsError } = await supabaseServer
    .from('product_catalogue')
    .select('*');

  if (productsError) {
    console.error('Supabase product_catalogue fetch error:', productsError);
    throw productsError;
  }

  // Fetch condition-product mappings
  const { data: mappings, error: mappingsError } = await supabaseServer
    .from('condition_product_map')
    .select('*');

  if (mappingsError) {
    console.error('Supabase condition_product_map fetch error:', mappingsError);
    throw mappingsError;
  }

  return { products: products || [], mappings: mappings || [] };
}

async function getData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Use Supabase if configured, otherwise fall back to local JSON
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
      return await getSupabaseData();
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local JSON:', err);
      return await getLocalData();
    }
  }

  return await getLocalData();
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
      return NextResponse.json({
        message: "No clear skin condition detected. Try better lighting.",
        conditions: [],
        recommended_products: []
      });
    }

    // Get data from Supabase (production) or local JSON (dev fallback)
    const { products, mappings } = await getData();

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
        // Handle both formats:
        // - Local JSON: product_ids is already a string[]
        // - Supabase text column: product_ids is a string like '{"id1","id2"}'
        let ids = match.product_ids || [];
        if (typeof ids === 'string') {
          ids = ids.replace(/^\{|\}$/g, '').split(',').map((s: string) => s.trim().replace(/"/g, '')).filter(Boolean);
        }
        productIds.push(...ids);
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

    const cartValue = recommendedProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
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

    // Log to Supabase (Background)
    if (userId) {
      supabaseServer.from('scans').insert({
        user_id: userId,
        conditions: finalResponse.conditions,
        products: finalResponse.recommended_products,
        skin_type: finalResponse.skin_type
      }).then(({ error }) => {
        if (error) console.error('Supabase scan log failed', error);
      });
    }

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('Recommendation Engine Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
