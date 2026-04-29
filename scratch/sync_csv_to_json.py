import json
import csv

# Load products.json
with open('src/data/products.json', 'r') as f:
    data = json.load(f)

# Load the enriched CSV
enriched = {}
with open('scratch/supabase_exports/product_catalog_updated.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        enriched[row['id']] = row

# Update products.json with enriched data
updated_count = 0
for product in data['products']:
    pid = product['id']
    if pid in enriched:
        csv_row = enriched[pid]
        
        # Update usage
        if csv_row.get('usage') and csv_row['usage'] != 'As directed by a dermatologist.':
            product['usage'] = csv_row['usage']
        
        # Update expected_results_timeline
        if csv_row.get('expected_results_timeline') and csv_row['expected_results_timeline'] != 'Visible improvement in 4-6 weeks with consistent use.':
            product['expected_results_timeline'] = csv_row['expected_results_timeline']
        
        # Update ingredients from CSV if they have real data
        csv_ingredients = csv_row.get('ingredients', '{}')
        if csv_ingredients and csv_ingredients != '{}' and csv_ingredients != '{"Dermatologically tested actives"}' and csv_ingredients != '{"Certificates"}':
            # Parse PostgreSQL array format into Python list
            clean = csv_ingredients.strip('{}')
            if clean:
                ingredients_list = [i.strip('"').strip() for i in clean.split('","')]
                if ingredients_list and ingredients_list[0]:
                    product['ingredients'] = ingredients_list

        updated_count += 1

# Save back
with open('src/data/products.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"✅ Updated {updated_count} products in products.json")

# Verify a few samples
for p in data['products'][:5]:
    print(f"\n🔹 {p['name']}")
    print(f"   Usage: {p.get('usage', 'MISSING')}")
    print(f"   Timeline: {p.get('expected_results_timeline', 'MISSING')}")
    print(f"   Ingredients: {p.get('ingredients', 'MISSING')}")
