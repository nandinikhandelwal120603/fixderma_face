from shopify_scraper import scraper
import json
import pandas as pd
import os

def scrape():
    url = "https://www.fixderma.com"
    print(f"Scraping {url}...")
    
    # Get products
    parents = scraper.get_products(url)
    print(f"Found {len(parents)} products.")
    
    # Save raw data for reference
    os.makedirs('scratch', exist_ok=True)
    parents.to_csv('scratch/fixderma_products_raw.csv', index=False)
    
    # Process products into our required format
    # Columns typically: title, handle, body_html, vendor, product_type, tags, variants, images
    
    processed_products = []
    
    for _, row in parents.iterrows():
        # Basic fields
        product = {
            "id": str(row.get('id', '')),
            "name": str(row.get('title', '')),
            "category": str(row.get('product_type', 'General Skincare')),
            "description": str(row.get('body_html', '')),
            "handle": str(row.get('handle', '')),
            "buy_link": f"https://www.fixderma.com/products/{row.get('handle', '')}",
            "tags": str(row.get('tags', '')).split(', ') if row.get('tags') else []
        }
        
        # Get price from variants if available in the dataframe
        # Note: scraper.get_products might not have full variant info depending on version
        # but let's see what columns we have
        
        # Images
        # Shopify products.json has an 'images' field which is a list of dicts
        # The scraper might have flattened this or kept it.
        # Let's check the columns first in the next step or just try to parse.
        
        processed_products.append(product)

    # Save processed products to a JSON file
    with open('scratch/fixderma_processed.json', 'w') as f:
        json.dump(processed_products, f, indent=2)
    
    print("Scrape complete. Data saved to scratch/fixderma_processed.json")

if __name__ == "__main__":
    scrape()
