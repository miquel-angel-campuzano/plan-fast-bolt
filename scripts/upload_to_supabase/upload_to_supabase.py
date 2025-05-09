import os
import json
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Set, Optional
from datetime import datetime
import psutil
from tqdm import tqdm
from supabase import create_client, Client

# ─── CONFIG ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://eojfvcrnuvzzwayvfzvq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvamZ2Y3JudXZ6endheXZmenZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQ0NTQxMywiZXhwIjoyMDU5MDIxNDEzfQ.Q67NKeZmeNb3nvMT4nwnxvbYO_gG8XGKqAUk9OWOQto")
INPUT_PATH = Path("data/places/enriched_places_perplexity.json")
BATCH_SIZE = 50
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

# Field validation rules
FIELD_RULES = {
    "name": {"required": True, "max_length": 255},
    "city": {"required": True, "max_length": 100},
    "description": {"required": True, "max_length": 2000},
    "category": {"required": True, "max_length": 50},
    "subcategory": {"max_length": 50},
    "mood_tags": {"required": True, "type": list},
    "suggested_visit_time": {"max_length": 50},
    "duration": {"max_length": 50},
    "local_tip": {"max_length": 500},
    "popularity_score": {"type": float, "min": 0, "max": 1},
    "price_level": {"max_length": 10},
    "rating": {"type": float, "min": 0, "max": 5},
    "user_ratings_total": {"type": int, "min": 0},
}

# ─── INITIALIZE SUPABASE CLIENT ───────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass

def validate_field(field_name: str, value: Any) -> Optional[str]:
    """Validate a field against its rules."""
    rules = FIELD_RULES.get(field_name, {})
    
    if rules.get("required") and value is None:
        return f"{field_name} is required"
    
    if value is None:
        return None
    
    if "max_length" in rules and isinstance(value, str):
        if len(value) > rules["max_length"]:
            return f"{field_name} exceeds maximum length of {rules['max_length']}"
    
    if "type" in rules:
        expected_type = rules["type"]
        if not isinstance(value, expected_type):
            return f"{field_name} must be of type {expected_type.__name__}"
    
    if "min" in rules and isinstance(value, (int, float)):
        if value < rules["min"]:
            return f"{field_name} must be at least {rules['min']}"
    
    if "max" in rules and isinstance(value, (int, float)):
        if value > rules["max"]:
            return f"{field_name} must be at most {rules['max']}"
    
    return None

def validate_place(place: Dict[str, Any]) -> List[str]:
    """Validate all fields of a place."""
    errors = []
    for field_name, rules in FIELD_RULES.items():
        value = place.get(field_name)
        error = validate_field(field_name, value)
        if error:
            errors.append(error)
    return errors

def load_input(path: Path) -> List[Dict[str, Any]]:
    """Load places from a JSON array or NDJSON file with memory monitoring."""
    start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    print(f"Initial memory usage: {start_memory:.2f} MB")
    
    text = path.read_text(encoding="utf-8")
    try:
        # Try to parse as full JSON array
        data = json.loads(text)
        if isinstance(data, list):
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024
            print(f"Memory usage after loading JSON: {end_memory:.2f} MB")
            print(f"Memory increase: {end_memory - start_memory:.2f} MB")
            return data
    except json.JSONDecodeError:
        pass
    
    # Fallback: parse as NDJSON (one JSON object per line)
    places = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            place = json.loads(line)
            places.append(place)
        except json.JSONDecodeError:
            print(f"⚠️ Skipping invalid JSON line: {line[:80]}…", file=sys.stderr)
    
    end_memory = psutil.Process().memory_info().rss / 1024 / 1024
    print(f"Memory usage after loading NDJSON: {end_memory:.2f} MB")
    print(f"Memory increase: {end_memory - start_memory:.2f} MB")
    return places

def fetch_existing_ids() -> Set[str]:
    """Retrieve existing place_ids from Supabase with retry logic."""
    for attempt in range(MAX_RETRIES):
        try:
            res = supabase.table("places").select("place_id").execute()
            if res.data is None:
                print(f"❌ Error fetching existing IDs (attempt {attempt + 1}/{MAX_RETRIES}): No data returned", file=sys.stderr)
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                return set()
            return {row["place_id"] for row in res.data if row.get("place_id")}
        except Exception as e:
            print(f"❌ Exception fetching existing IDs (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}", file=sys.stderr)
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            return set()
    return set()

def prepare_row(place: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Map a place dict to the column structure Supabase expects with validation."""
    # Validate the place data
    validation_errors = validate_place(place)
    if validation_errors:
        return None  # Silently skip invalid places
    
    coords = place.get("coordinates", {}) or {}
    lat, lng = coords.get("lat"), coords.get("lng")

    row = {
        "name": place.get("name"),
        "city": place.get("city"),
        "description": place.get("description"),
        "category": place.get("category"),
        "subcategory": place.get("subcategory"),
        "mood_tags": place.get("mood_tags"),
        "suggested_visit_time": place.get("suggested_visit_time"),
        "duration": place.get("duration"),
        "local_tip": place.get("local_tip"),
        "popularity_score": place.get("popularity_score"),
        "price_level": place.get("price_level"),
        "rating": place.get("rating"),
        "user_ratings_total": place.get("user_ratings_total"),
        "place_id": place.get("place_id"),
        "maps_url": place.get("maps_url"),
        "website": place.get("website"),
        "types": place.get("types"),
        "vicinity": place.get("vicinity"),
        "business_status": place.get("business_status"),
        "fetched_at": place.get("fetched_at"),
        "enrichment_status": place.get("enrichment_status", "completed"),
        "photos": place.get("photos"),
        "raw_ai_json": place,
        "last_updated": datetime.utcnow().isoformat(),
    }

    if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
        row["coordinates"] = f"SRID=4326;POINT({lng} {lat})"

    return row

def insert_batch(batch: List[Dict[str, Any]], batch_num: int, total_batches: int) -> bool:
    """Insert a batch of rows with retry logic."""
    for attempt in range(MAX_RETRIES):
        try:
            res = supabase.table("places").insert(batch).execute()
            if res.data is None:
                print(f"❌ Batch {batch_num}/{total_batches} error (attempt {attempt + 1}/{MAX_RETRIES}): No data returned", file=sys.stderr)
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                return False
            return True
        except Exception as e:
            print(f"❌ Exception inserting batch {batch_num}/{total_batches} (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}", file=sys.stderr)
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            return False
    return False

def main():
    """Main function to orchestrate the upload process."""
    start_time = time.time()
    places = load_input(INPUT_PATH)
    existing_ids = fetch_existing_ids()
    print(f"✅ Found {len(existing_ids)} already in the database")

    valid_places = []
    skipped = 0

    with tqdm(total=len(places), desc="Validating places") as pbar:
        for place in places:
            if place.get("place_id") in existing_ids:
                skipped += 1
                pbar.update(1)
                continue
            
            row = prepare_row(place)
            if row:
                valid_places.append(row)
            else:
                skipped += 1
            pbar.update(1)

    print(f"✅ {len(valid_places)} valid new places to insert")
    print(f"ℹ️ {skipped} places skipped due to validation")

    batches = [valid_places[i:i + BATCH_SIZE] for i in range(0, len(valid_places), BATCH_SIZE)]
    successful_batches = 0

    with tqdm(total=len(batches), desc="Uploading batches") as pbar:
        for i, batch in enumerate(batches):
            if insert_batch(batch, i + 1, len(batches)):
                successful_batches += 1
            pbar.update(1)

    end_time = time.time()
    total_time = end_time - start_time
    avg_time = total_time / len(places) if places else 0

    print("\n📊 Upload Summary:")
    print(f"Total places processed: {len(places)}")
    print(f"New places validated: {len(valid_places)}")
    print(f"Places skipped: {skipped}")
    print(f"Successful batches: {successful_batches}/{len(batches)}")
    print(f"Failed batches: {len(batches) - successful_batches}/{len(batches)}")
    print(f"Total time: {total_time:.2f} seconds")
    print(f"Average time per place: {avg_time:.2f} seconds")

    print("\n🎉 Upload complete!")

if __name__ == "__main__":
    main()
