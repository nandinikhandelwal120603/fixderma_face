import json
import re

def infer_category(name, current_category):
    name_lower = str(name).lower()
    
    if current_category and str(current_category).lower() != 'nan':
        return current_category
        
    if any(k in name_lower for k in ['shampoo', 'conditioner', 'hair', 'kairfoll', 'bioteez', 'scalp']):
        return 'Hair Care'
    if any(k in name_lower for k in ['sunscreen', 'spf', 'shadow', 'sun']):
        return 'Sunscreen'
    if any(k in name_lower for k in ['body', 'lotion', 'stretch', 'nipple', 'foot', 'foobetik', 'nigrifix', 'underarm', 'strallium']):
        return 'Body Care'
    if any(k in name_lower for k in ['lip']):
        return 'Lip Care'
    if any(k in name_lower for k in ['face', 'serum', 'cleanser', 'cream', 'gel', 'spot', 'acne', 'salyzap', 'skarfix', 'reticuram']):
        return 'Face Care'
    if any(k in name_lower for k in ['wash', 'soap', 'cleanser']):
        return 'Cleansers'
        
    return 'General Skincare'

def clean_ingredient(ing):
    # Remove obvious garbage
    ing = ing.strip(' "\'')
    if len(ing) < 3:
        return None
    # If it has more than 5 words, it's likely a sentence not an ingredient
    if len(ing.split()) > 4:
        return None
    
    # If it's entirely lowercase, it's almost certainly descriptive text, not an ingredient name
    if ing.islower():
        return None
    
    # Common bad phrases and condition names
    bad_phrases = ['what is it', 'into the skin', 'making it', 'suitable', 'directions', 'apply', 'dermatologically', 'key highlights', 'backed by science', 'use', 'free from', 'acid &amp;', 'absorbing', 'application', 'psoriasis', 'sunburn', 'acne', 'sensitive', 'tested', 'extracts:', 'ingredients:']
    if any(b in ing.lower() for b in bad_phrases):
        return None
        
    # Remove any trailing periods or weird chars
    ing = re.sub(r'[\.\;\:\*]+$', '', ing).strip()
    return ing

def clean_products():
    with open('src/data/products.json', 'r') as f:
        data = json.load(f)
        
    for p in data['products']:
        # 1. Clean Category
        p['category'] = infer_category(p.get('name', ''), p.get('category', ''))
        
        # 2. Clean Ingredients
        if 'ingredients' in p:
            cleaned_ings = []
            for ing in p['ingredients']:
                c_ing = clean_ingredient(ing)
                if c_ing and c_ing not in cleaned_ings:
                    cleaned_ings.append(c_ing)
            p['ingredients'] = cleaned_ings
            
        # 3. Description Cleanup
        if 'description' in p:
            # remove some repetitive scraped junk
            desc = p['description']
            desc = re.sub(r'KEY HIGHLIGHTS.*?(What is it\?|Directions for Use|Ingredients)', '', desc, flags=re.IGNORECASE)
            desc = re.sub(r'What is it\?.*?Backed by Science.*?', '', desc, flags=re.IGNORECASE)
            desc = desc.replace('&amp;', '&').strip()
            
            # if description is too empty after stripping, just use the name
            if len(desc) < 10:
                p['description'] = f"{p['name']} is a premium Fixderma product tailored to your skin concerns."
            else:
                p['description'] = desc

    with open('src/data/products.json', 'w') as f:
        json.dump(data, f, indent=2)
        
    print("Cleaned products.json successfully!")

if __name__ == '__main__':
    clean_products()
