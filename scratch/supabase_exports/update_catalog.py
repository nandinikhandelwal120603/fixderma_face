import pandas as pd

# 1. Load your original CSV
df = pd.read_csv('product_catalog.csv')

# 2. Fix "sun_protection" → "sun_damage" in concerns column
df['concerns'] = df['concerns'].str.replace('sun_protection', 'sun_damage', regex=False)

# 3. Define common ingredients to extract
common_ingredients = [
    'Salicylic Acid', 'Hyaluronic Acid', 'Vitamin C', 'Retinol', 'Niacinamide', 
    'Zinc Oxide', 'Titanium Dioxide', 'Azelaic Acid', 'Glycolic Acid', 'Aloe Vera',
    'Tea Tree Oil', 'Lactic Acid', 'Ceramides', 'Peptides', 'Shea Butter',
    'Tranexamic Acid', 'Mandelic Acid', 'Kojic Acid'
]

def extract_ingredients(row):
    current = str(row['ingredients'])
    if current != "{}" and current != '{"Certificates"}':
        return current
        
    desc = str(row['description']).lower()
    name = str(row['name']).lower()
    
    found = []
    for ing in common_ingredients:
        if ing.lower() in desc or ing.lower() in name:
            found.append(ing)
            
    if found:
        return '{"' + '","'.join(found) + '"}'
    return '{"Dermatologically tested actives"}'

df['ingredients'] = df.apply(extract_ingredients, axis=1)

# 4. Usage — HOW to apply the product properly
def set_usage(category, name):
    cat = str(category).lower()
    name_low = str(name).lower()
    if 'sunscreen' in cat or 'sunscreen' in name_low or 'spf' in name_low:
        return "Apply a coin-sized amount evenly on face and exposed areas 15 min before sun exposure. Reapply every 2-3 hours, especially after sweating or swimming."
    elif 'body wash' in cat or 'body wash' in name_low:
        return "Take a small amount on a wet loofah or palm, lather on damp skin, massage gently for 1-2 minutes, and rinse off thoroughly with water."
    elif 'face wash' in cat or 'face wash' in name_low or 'cleanser' in cat or 'cleanser' in name_low:
        return "Wet your face, take a pea-sized amount, massage in circular motions for 30-60 seconds, and rinse with lukewarm water. Use twice daily (morning & night)."
    elif 'serum' in cat or 'serum' in name_low:
        return "After cleansing, apply 2-3 drops on fingertips. Gently pat and press onto face and neck. Let it absorb for 1-2 minutes before applying moisturizer."
    elif 'shampoo' in name_low:
        return "Apply to wet scalp, massage gently with fingertips for 2-3 minutes, and rinse thoroughly. Use 2-3 times per week or as directed."
    elif 'conditioner' in name_low:
        return "After shampooing, apply to mid-lengths and ends. Leave for 2-3 minutes, then rinse thoroughly with cool water."
    elif 'lotion' in cat or 'body lotion' in name_low or 'body care' in cat:
        return "After bathing, apply generously on slightly damp skin. Massage in upward circular motions until fully absorbed. Use daily."
    elif 'cream' in cat or 'cream' in name_low or 'moisturizer' in name_low:
        return "Take a small amount and apply to clean, dry skin. Gently massage in upward strokes until fully absorbed. Use morning and/or night."
    elif 'lip' in cat or 'lip' in name_low:
        return "Apply a thin layer on clean, dry lips. Reapply as needed throughout the day, especially before sun exposure."
    elif 'soap' in name_low:
        return "Lather between wet hands, apply on affected area, leave for 1-2 minutes, then rinse with water. Use twice daily."
    elif 'foot' in cat or 'foot' in name_low:
        return "Wash and dry feet thoroughly. Apply a generous layer on cracked heels and rough areas. Massage well. Use twice daily for best results."
    else:
        return "Apply a small amount on clean skin over the affected area. Gently massage until absorbed. Use as directed by your dermatologist."

df['usage'] = df.apply(lambda row: set_usage(row['category'], row['name']), axis=1)

# 5. Timeline — WHEN the user will see improvement
def set_timeline(category, name):
    cat = str(category).lower()
    name_low = str(name).lower()
    if 'sunscreen' in cat or 'sunscreen' in name_low or 'spf' in name_low:
        return "Provides immediate UV protection on application. For sun damage repair, visible improvement in skin tone within 3-4 weeks of daily use."
    elif 'wash' in cat or 'cleanser' in cat or 'wash' in name_low or 'cleanser' in name_low:
        return "Skin feels cleaner and fresher from the first use. Reduced breakouts and improved clarity in 1-2 weeks with regular use."
    elif 'serum' in cat or 'serum' in name_low:
        return "Initial glow and hydration within 1 week. Visible improvement in texture, tone, and marks within 4-6 weeks of consistent use."
    elif 'shampoo' in name_low or 'conditioner' in name_low:
        return "Reduced flakiness and itchiness within 1 week. Healthier, stronger hair visible in 3-4 weeks of regular use."
    elif 'nigrifix' in name_low or 'dark_patches' in str(cat):
        return "Mild lightening visible in 2-3 weeks. Significant improvement in dark patch appearance within 6-8 weeks of twice-daily use."
    elif 'acne' in name_low or 'salyzap' in name_low or 'spot' in name_low:
        return "Reduced inflammation within 2-3 days. Noticeable reduction in acne marks and breakouts in 2-4 weeks."
    elif 'stretch' in name_low or 'pregger' in name_low:
        return "Improved skin elasticity and hydration within 1-2 weeks. Stretch mark appearance reduces over 6-8 weeks of consistent use."
    elif 'lip' in cat or 'lip' in name_low:
        return "Instant relief from dryness. Softer, smoother lips within 3-5 days of regular application."
    elif 'foot' in cat or 'foot' in name_low:
        return "Smoother heels within 1 week. Cracked heels significantly improved in 2-3 weeks of twice-daily use."
    else:
        return "Noticeable hydration and skin comfort from first use. Visible improvement in overall skin health within 2-4 weeks of consistent use."

df['expected_results_timeline'] = df.apply(lambda row: set_timeline(row['category'], row['name']), axis=1)

# 6. Save
df.to_csv('product_catalog_updated.csv', index=False)

# 7. Verify
print("✅ Updated catalog saved as 'product_catalog_updated.csv'")
print(f"   Total products: {len(df)}")
print(f"\n📋 Sample output:\n")
sample = df[['name', 'concerns', 'usage', 'expected_results_timeline']].head(6)
for _, row in sample.iterrows():
    print(f"  🔹 {row['name']}")
    print(f"     Concerns: {row['concerns']}")
    print(f"     Usage: {row['usage']}")
    print(f"     Timeline: {row['expected_results_timeline']}")
    print()
