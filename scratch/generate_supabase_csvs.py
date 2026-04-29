import json
import csv
import os

def format_pg_array(arr):
    # Formats a python list into a PostgreSQL array literal string for CSV import
    if not arr:
        return '{}'
    # Escape quotes if necessary
    safe_arr = [str(item).replace('"', '""') for item in arr]
    return '{' + ','.join([f'"{item}"' for item in safe_arr]) + '}'

def infer_category(name, current_category):
    name_lower = str(name).lower()
    
    if current_category and str(current_category).lower() != 'nan':
        return current_category
        
    # Infer based on keywords
    if any(k in name_lower for k in ['shampoo', 'conditioner', 'hair', 'kairfoll', 'bioteez']):
        return 'Hair Care'
    if any(k in name_lower for k in ['sunscreen', 'spf', 'shadow']):
        return 'Sunscreen'
    if any(k in name_lower for k in ['body', 'lotion', 'stretch', 'nipple', 'foot', 'foobetik', 'nigrifix', 'underarm']):
        return 'Body Care'
    if any(k in name_lower for k in ['lip']):
        return 'Lip Care'
    if any(k in name_lower for k in ['face', 'serum', 'cleanser', 'cream', 'gel', 'spot', 'acne', 'salyzap']):
        return 'Face Care'
        
    return 'General Skincare'

def generate_csvs():
    with open('src/data/products.json', 'r') as f:
        data = json.load(f)
        
    products = data.get('products', [])
    mappings = data.get('mappings', [])
    
    os.makedirs('scratch/supabase_exports', exist_ok=True)
    
    # 1. Product Catalog CSV
    with open('scratch/supabase_exports/product_catalog.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'name', 'category', 'concerns', 'ingredients', 'description', 'price', 'image_url', 'buy_link', 'usage', 'expected_results_timeline'])
        
        for p in products:
            writer.writerow([
                p.get('id', ''),
                p.get('name', ''),
                infer_category(p.get('name', ''), p.get('category', '')),
                format_pg_array(p.get('concerns', [])),
                format_pg_array(p.get('ingredients', [])),
                p.get('description', ''),
                p.get('price', 0),
                p.get('image_url', ''),
                p.get('buy_link', ''),
                p.get('usage', ''),
                p.get('expected_results_timeline', 'Visible improvement in 4-6 weeks with consistent use.') # Adding default if missing
            ])
            
    # 2. Condition Product Map CSV
    import uuid
    with open('scratch/supabase_exports/condition_product_map.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'condition', 'severity', 'product_ids'])
        
        for m in mappings:
            writer.writerow([
                str(uuid.uuid4()), # Generate a random UUID for the map ID
                m.get('condition', ''),
                m.get('severity', ''),
                format_pg_array(m.get('product_ids', []))
            ])
            
    print("CSVs generated successfully in scratch/supabase_exports/")

if __name__ == '__main__':
    generate_csvs()
