import pandas as pd
import json
import re
import ast
from collections import defaultdict

def clean_html(raw_html):
    if not raw_html or not isinstance(raw_html, str):
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', raw_html)
    return " ".join(cleantext.split())

def extract_ingredients(html):
    if not html or not isinstance(html, str):
        return []
    parts = re.split(r'Ingredients|KEY INGREDIENTS', html, flags=re.IGNORECASE)
    if len(parts) > 1:
        ing_section = parts[1]
        items = re.findall(r'<h3>(.*?)</h3>|<li>(.*?)</li>', ing_section)
        ingredients = []
        for item in items:
            val = item[0] or item[1]
            if val and len(val) < 50:
                ingredients.append(clean_html(val).strip())
        if ingredients:
            return ingredients
    return []

def map_concerns(title, tags, description):
    text = (str(title) + " " + str(tags) + " " + str(description)).lower()
    concerns = set()
    mapping = {
        "acne": ["acne", "pimple", "breakout", "salyzap"],
        "pigmentation": ["pigment", "dark spot", "melasma", "tan", "brighten", "glow", "skarfix"],
        "aging": ["age", "wrinkle", "fine line", "firming", "retinol"],
        "dryness": ["dry", "moistur", "hydrat", "hyaluronic"],
        "oiliness": ["oily", "sebum", "mattifying"],
        "dark_patches": ["dark patches", "nigrifix", "acanthosis"],
        "sun_protection": ["sunscreen", "spf", "uv", "shadow"]
    }
    for concern, keywords in mapping.items():
        if any(kw in text for kw in keywords):
            concerns.add(concern)
    return list(concerns)

def process():
    df = pd.read_csv('scratch/fixderma_products_raw.csv')
    products = []
    condition_map = defaultdict(list)
    
    for _, row in df.iterrows():
        try:
            variants = ast.literal_eval(row['variants']) if isinstance(row['variants'], str) else []
            images = ast.literal_eval(row['images']) if isinstance(row['images'], str) else []
            price = int(float(variants[0].get('price', 0))) if variants else 0
            image_url = images[0].get('src', '') if images else ""
            
            concerns = map_concerns(row['title'], row['tags'], row['body_html'])
            ingredients = extract_ingredients(row['body_html'])
            
            p_id = str(row['id'])
            product = {
                "id": p_id,
                "name": str(row['title']),
                "category": str(row['product_type']) if row['product_type'] else "Skincare",
                "concerns": concerns if concerns else ["general_maintenance"],
                "ingredients": ingredients if ingredients else ["Dermatologically Tested Actives"],
                "description": clean_html(row['body_html'])[:200] + "...",
                "price": price,
                "image_url": image_url,
                "buy_link": f"https://www.fixderma.com/products/{row['handle']}",
                "usage": "As directed by a dermatologist."
            }
            products.append(product)
            
            for c in concerns:
                # Add to condition map with severity moderate for now
                condition_map[c].append(p_id)
        except Exception:
            continue
            
    # Create the final JSON structure
    mappings = []
    for condition, ids in condition_map.items():
        # Only take top 3 products for each condition/severity to keep it clean
        for severity in ["mild", "moderate", "severe"]:
            mappings.append({
                "condition": condition,
                "severity": severity,
                "product_ids": ids[:3]
            })
            
    # Add a fallback for empty results
    if not mappings:
        mappings.append({"condition": "acne", "severity": "moderate", "product_ids": [products[0]["id"]]})

    data = {
        "products": products,
        "mappings": mappings
    }
    
    with open('src/data/products.json', 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Processed {len(products)} products and {len(mappings)} mappings into src/data/products.json")

if __name__ == "__main__":
    process()
