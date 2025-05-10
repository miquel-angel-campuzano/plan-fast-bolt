import json
import requests
import time
import os

# --- Configuration ---
API_KEY = "XXXXX"  # Ensure this is your valid API key
INPUT_DIR = "data/places"
INPUT_FILE = "top_200_places_by_reviews.json"
OUTPUT_FILE = "enriched_top_200_places.json"
RATE_LIMIT_DELAY = 0.1 # Reduced delay as Places Details allows higher QPS usually, adjust if needed
MAX_RETRIES = 3
RETRY_DELAY = 1 # Seconds

# --- API Interaction ---
def get_place_details(place_id):
    """Fetches place details with retries."""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "editorial_summary,website",  # Fields to request
        "key": API_KEY
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(url, params=params, timeout=10) # Added timeout
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            data = response.json()
            
            # Check Google API status
            if data.get("status") == "OK":
                return data.get("result", {}), data.get("status")
            elif data.get("status") in ["ZERO_RESULTS", "NOT_FOUND"]:
                print(f"    - Warning: API status {data['status']} for place_id {place_id}")
                return {}, data.get("status")
            elif data.get("status") == "OVER_QUERY_LIMIT":
                print(f"    - Warning: OVER_QUERY_LIMIT hit. Retrying in {RETRY_DELAY * (2**attempt)}s...")
                time.sleep(RETRY_DELAY * (2**attempt))
                continue # Retry
            else:
                print(f"    - Error: Google API status {data.get('status')} for place_id {place_id}. Message: {data.get('error_message')}")
                return None, data.get("status") # Indicate error

        except requests.exceptions.RequestException as e:
            print(f"    - Error: HTTP request failed for place_id {place_id}: {e}")
            if attempt == MAX_RETRIES - 1:
                 return None, "HTTP_ERROR" # Indicate final failure
            print(f"    - Retrying in {RETRY_DELAY * (2**attempt)}s...")
            time.sleep(RETRY_DELAY * (2**attempt))
            
    return None, "MAX_RETRIES_EXCEEDED" # Indicate final failure after retries

# --- Main Logic ---
def enrich_places(input_path, output_path):
    """Reads input file, enriches places, and writes to output file."""
    api_call_count = 0
    places_processed = 0
    places_failed = 0
    
    # Read input data
    try:
        with open(input_path, "r", encoding="utf-8") as f:
            places_by_city = json.load(f)
        print(f"Successfully read data for {len(places_by_city)} cities from {input_path}")
    except FileNotFoundError:
        print(f"❌ Error: Input file not found at {input_path}")
        return
    except json.JSONDecodeError:
        print(f"❌ Error: Could not decode JSON from {input_path}")
        return

    enriched_data_by_city = {}

    # Process each city
    for city, places in places_by_city.items():
        print(f"\n--- Processing city: {city} ({len(places)} places) ---")
        enriched_city_places = []
        
        for place in places:
            place_id = place.get("place_id")
            place_name = place.get('name', 'Unknown Place')
            
            if not place_id:
                print(f"    - Skipping place with no place_id: {place_name}")
                continue

            print(f"  🔍 Enriching '{place_name}' (ID: {place_id})...")
            places_processed += 1
            api_call_count += 1 # Count API call attempt
            details, status = get_place_details(place_id)

            if details is not None: # If details is None, a non-recoverable error occurred
                enriched_place = {
                    **place,
                    "description": details.get("editorial_summary", {}).get("overview"), # Use None if not present
                    "website": details.get("website"), # Use None if not present
                    "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}",
                    "enrichment_status": status # Record the API status
                }
                enriched_city_places.append(enriched_place)
                print(f"    - Success (Status: {status})")
            else:
                 # Optionally add a placeholder or skip failed places
                 print(f"    - Failed enrichment (Status: {status})")
                 places_failed += 1
                 # Add placeholder if needed
                 enriched_place = {
                     **place,
                     "description": None,
                     "website": None,
                     "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}",
                     "enrichment_status": status # Record the failure status
                 }
                 enriched_city_places.append(enriched_place)


            time.sleep(RATE_LIMIT_DELAY) # Basic rate limiting

        enriched_data_by_city[city] = enriched_city_places

    # Write output data
    try:
        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(enriched_data_by_city, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Done! Saved enriched data to {output_path}")
        print(f"   Summary: Processed={places_processed}, Failed={places_failed}, API Calls={api_call_count}")
    except IOError as e:
        print(f"❌ Error writing output file {output_path}: {e}")


if __name__ == "__main__":
    input_file_path = os.path.join(INPUT_DIR, INPUT_FILE)
    output_file_path = os.path.join(INPUT_DIR, OUTPUT_FILE)
    enrich_places(input_file_path, output_file_path)
