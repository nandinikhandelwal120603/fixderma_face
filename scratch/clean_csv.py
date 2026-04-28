import pandas as pd
import ast
import re
import json

def clean_html(raw_html):
    if not raw_html or not isinstance(raw_html, str):
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', raw_html)
    return " ".join(cleantext.split())

def extract_ingredients(html):
    if not html or not isinstance(html, str):
        return ""
    parts = re.split(r'Ingredients|KEY INGREDIENTS', html, flags=re.IGNORECASE)
    if len(parts) > 1:
        ing_section = parts[1]
        items = re.findall(r'<h3>(.*?)</h3>|<li>(.*?)</li>', ing_section)
        ingredients = []
        for item in items:
            val = item[0] or item[1]
            if val and len(val) < 100:
                ingredients.append(clean_html(val).strip())
        return ", ".join(ingredients)
    return ""

def extract_directions(html):
    if not html or not isinstance(html, str):
        return ""
    parts = re.split(r'Directions for Use|How to Use', html, flags=re.IGNORECASE)
    if len(parts) > 1:
        dir_section = parts[1]
        # Look for li items or paragraph text
        items = re.findall(r'<li>(.*?)</li>|<p>(.*?)</p>', dir_section)
        directions = []
        for item in items:
            val = item[0] or item[1]
            if val and len(val) < 500:
                directions.append(clean_html(val).strip())
        return " ".join(directions)
    return ""

def process_to_proper_csv():
    df = pd.read_csv('scratch/fixderma_products_raw.csv')
    
    clean_data = []
    
    for _, row in df.iterrows():
        try:
            # Parse complex columns
            variants = ast.literal_eval(row['variants']) if isinstance(row['variants'], str) else []
            images = ast.literal_eval(row['images']) if isinstance(row['images'], str) else []
            
            # Extract basic fields
            price = variants[0].get('price', '') if variants else ''
            image_url = images[0].get('src', '') if images else ''
            
            # Extract text fields
            description = clean_html(row['body_html'])
            ingredients = extract_ingredients(row['body_html'])
            directions = extract_directions(row['body_html'])
            
            clean_data.append({
                'Product Name': row['title'],
                'Category': row['product_type'],
                'Price (INR)': price,
                'Image URL': image_url,
                'Description': description,
                'Ingredients': ingredients,
                'Directions for Use': directions,
                'Buy Link': f"https://www.fixderma.com/products/{row['handle']}",
                'Tags': row['tags']
            })
        except Exception as e:
            continue
            
    clean_df = pd.DataFrame(clean_data)
    clean_df.to_csv('scratch/fixderma_products_clean.csv', index=False)
    print(f"Cleaned CSV saved to scratch/fixderma_products_clean.csv. Total rows: {len(clean_df)}")

if __name__ == "__main__":
    process_to_proper_csv()
