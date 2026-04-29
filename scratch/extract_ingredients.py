import pandas as pd
import json
import re
from bs4 import BeautifulSoup

def extract_ingredients(html_text):
    if not isinstance(html_text, str):
        return []
        
    soup = BeautifulSoup(html_text, 'html.parser')
    text = soup.get_text(" ", strip=True)
    
    # Try to find "KEY INGREDIENTS:" or "Ingredients:"
    match = re.search(r'(?i)key ingredients?:\s*([^\n<]+)', text)
    if match:
        ingredients_str = match.group(1).strip()
        # Split by + or ,
        items = [i.strip() for i in re.split(r'\+|,', ingredients_str) if i.strip()]
        if items:
            return items
            
    # Try just "Ingredients:"
    match2 = re.search(r'(?i)(?:active\s+)?ingredients?[:\-]?\s*([\w\s,\.\+\-\&]{5,150})(?:\n|<|What is it|Directions|Backed by|Size:|$)', text)
    if match2:
        ingredients_str = match2.group(1).strip()
        items = [i.strip() for i in re.split(r'\+|,', ingredients_str) if i.strip()]
        # filter out long random text
        items = [i for i in items if len(i) < 40 and not "What is it" in i and not "into the skin" in i]
        if items:
            return items
            
    return []

def update_products():
    print("Reading raw products...")
    try:
        raw_df = pd.read_csv('scratch/fixderma_products_raw.csv')
    except Exception as e:
        print(f"Error reading csv: {e}")
        return

    # Create mapping from handle or id to ingredients
    ing_map = {}
    for _, row in raw_df.iterrows():
        id_str = str(row.get('id', ''))
        handle = str(row.get('handle', ''))
        body_html = str(row.get('body_html', ''))
        
        ingredients = extract_ingredients(body_html)
        ing_map[id_str] = ingredients
        ing_map[handle] = ingredients
        
    print("Updating products.json...")
    with open('src/data/products.json', 'r') as f:
        data = json.load(f)
        
    updated_count = 0
    for p in data['products']:
        # Clear out previous garbage
        if "ingredients" in p and (p["ingredients"] == ["Dermatologically Tested Actives"] or p["ingredients"] == ["What is it"] or p["ingredients"] == ["into the skin"]):
            p["ingredients"] = []
            
        p_id = str(p.get('id', ''))
        
        if p_id in ing_map and ing_map[p_id]:
            p['ingredients'] = ing_map[p_id]
            updated_count += 1
        elif p.get('buy_link'):
            handle = p['buy_link'].split('/')[-1].split('?')[0]
            if handle in ing_map and ing_map[handle]:
                p['ingredients'] = ing_map[handle]
                updated_count += 1
                
    with open('src/data/products.json', 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Updated {updated_count} products with extracted ingredients.")

if __name__ == '__main__':
    update_products()
