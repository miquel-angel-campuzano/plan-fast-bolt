import json
from pathlib import Path
import re

def clean_sagrada_familia():
    input_path = Path("data/places/enriched_places_perplexity.json")
    output_path = Path("data/places/enriched_places_perplexity_cleaned.json")
    
    # Load the data
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    # Patterns to match different variations of Sagrada Familia
    sagrada_patterns = [
        r'sagrada\s*familia',
        r'sagrada\s*família',
        r'la\s*sagrada\s*familia',
        r'the\s*sagrada\s*familia'
    ]
    
    # Keep track of the correct Sagrada Familia entry
    correct_sagrada = None
    cleaned_data = []
    
    for place in data:
        name = place.get('name', '').lower()
        city = place.get('city', '').lower()
        
        # Check if this is a Sagrada Familia entry
        is_sagrada = any(re.search(pattern, name) for pattern in sagrada_patterns)
        
        if is_sagrada:
            # If it's in Barcelona, keep it
            if city == 'barcelona':
                if correct_sagrada is None:
                    correct_sagrada = place
                    cleaned_data.append(place)
            # Skip all other Sagrada Familia entries
            continue
        
        # Keep all other places
        cleaned_data.append(place)
    
    # Save the cleaned data
    with open(output_path, 'w') as f:
        json.dump(cleaned_data, f, indent=2)
    
    print(f"Original data: {len(data)} places")
    print(f"Cleaned data: {len(cleaned_data)} places")
    print(f"Removed {len(data) - len(cleaned_data)} duplicate Sagrada Familia entries")
    
    if correct_sagrada:
        print("\nKept the following Sagrada Familia entry:")
        print(f"Name: {correct_sagrada.get('name')}")
        print(f"City: {correct_sagrada.get('city')}")
        print(f"Place ID: {correct_sagrada.get('place_id')}")
        coords = correct_sagrada.get('coordinates', {})
        print(f"Coordinates: {coords.get('lat')}, {coords.get('lng')}")

if __name__ == "__main__":
    clean_sagrada_familia() 