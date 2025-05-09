import json
from pathlib import Path
from collections import defaultdict

def find_duplicates():
    input_path = Path("data/places/enriched_places_perplexity.json")
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    # Map place names to their occurrences
    place_occurrences = defaultdict(list)
    for place in data:
        name = place.get('name')
        city = place.get('city')
        if name and city:
            place_occurrences[name].append({
                'city': city,
                'place_id': place.get('place_id'),
                'coordinates': place.get('coordinates')
            })
    
    print("\nPlaces appearing in multiple cities:")
    for name, occurrences in place_occurrences.items():
        if len(occurrences) > 1:
            print(f"\n{name} appears in {len(occurrences)} cities:")
            for occ in occurrences:
                coords = occ.get('coordinates', {})
                lat = coords.get('lat', 'N/A')
                lng = coords.get('lng', 'N/A')
                print(f"- {occ['city']} (ID: {occ['place_id']}, coords: {lat}, {lng})")

if __name__ == "__main__":
    find_duplicates() 