import json
import requests
import time
from pathlib import Path
import re
import os
from typing import Dict, Any

# Configuration
PERPLEXITY_API_KEY = "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"
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

# Pricing information (per 1M tokens)
PRICING = {
    "sonar-pro": {"input": 0.5, "output": 1.5},  # $0.5/M input tokens, $1.5/M output tokens
    "pplx-7b-online": {"input": 0.2, "output": 0.8},
    "pplx-70b-online": {"input": 1.0, "output": 2.0},
    "mixtral-8x7b-instruct": {"input": 0.6, "output": 1.8},
    "codellama-34b-instruct": {"input": 0.8, "output": 2.4},
    "llama-2-70b-chat": {"input": 0.7, "output": 2.8}
}

# Get the absolute path to the workspace root
WORKSPACE_ROOT = Path(__file__).parent.parent
INPUT_FILE = WORKSPACE_ROOT / "data" / "places" / "enriched_top_200_places.json"
OUTPUT_FILE = WORKSPACE_ROOT / "data" / "places" / "enriched_places_perplexity.json"

class TokenTracker:
    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost = 0.0
        self.requests = []

    def add_request(self, model: str, input_tokens: int, output_tokens: int):
        input_cost = (input_tokens / 1_000_000) * PRICING[model]["input"]
        output_cost = (output_tokens / 1_000_000) * PRICING[model]["output"]
        total_cost = input_cost + output_cost
        
        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens
        self.total_cost += total_cost
        
        self.requests.append({
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": total_cost
        })

    def print_summary(self):
        print("\nToken Usage Summary:")
        print(f"Total Input Tokens: {self.total_input_tokens:,}")
        print(f"Total Output Tokens: {self.total_output_tokens:,}")
        print(f"Total Cost: ${self.total_cost:.4f}")
        
        print("\nPer Request Breakdown:")
        for i, req in enumerate(self.requests, 1):
            print(f"\nRequest {i}:")
            print(f"  Model: {req['model']}")
            print(f"  Input Tokens: {req['input_tokens']:,}")
            print(f"  Output Tokens: {req['output_tokens']:,}")
            print(f"  Input Cost: ${req['input_cost']:.4f}")
            print(f"  Output Cost: ${req['output_cost']:.4f}")
            print(f"  Total Cost: ${req['total_cost']:.4f}")

# Initialize token tracker
token_tracker = TokenTracker()

def extract_json_from_content(content):
    """Extract JSON from content that might be wrapped in code blocks."""
    # Try to find JSON content between ```json and ``` markers
    json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
    if json_match:
        return json_match.group(1)
    
    # If no JSON markers, try to find content between any ``` markers
    code_match = re.search(r'```\s*(.*?)\s*```', content, re.DOTALL)
    if code_match:
        return code_match.group(1)
    
    # If no markers found, return the content as is
    return content

def get_perplexity_response(place_name, city):
    """Get enrichment data from Perplexity API for a given place."""
    prompt = f"""You are a travel expert helping generate structured data for a travel planning app.
I will give you the name of a point of interest (POI) and the city it's in.
Return a structured JSON object with the following fields.

name: The POI name

description: A detailed and engaging description (4–6 sentences) describing what this place is, what makes it special, and why a traveler should care

category: The general type (e.g. "monument", "museum", "neighborhood", "experience", "religious site", "restaurant", "park")

subcategory: A more specific label if relevant (e.g. "cathedral", "modern art museum", "tapas bar", "food market")

mood_tags: An array of mood-based tags — choose from: "relaxed", "cultural", "romantic", "foodie", "adventurous", "historic", "artsy", "local-gem", "must-see", "spiritual"

suggested_visit_time: The best time of day to visit (e.g. "morning", "afternoon", "evening")

duration: How long a typical visit takes (e.g. "30 minutes", "1–2 hours", "half-day")

local_tip: A practical, local-style travel tip to improve the experience

popularity_score: A float between 0 and 1, representing how popular the place is with international visitors

price_level: One of "free", "$", "$$", "$$$", "$$$$" — based on entry or experience cost

Don't include citation markers like [1], just write clean prose.

POI: {place_name}
City: {city}"""

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "sonar-pro",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant that returns only valid JSON objects."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    for attempt in range(3):  # Try up to 3 times
        try:
            response = requests.post(PERPLEXITY_API_URL, headers=headers, json=data)
            print(f"API Response Status: {response.status_code}")
            print(f"API Response: {response.text[:500]}...")  # Print first 500 chars of response for debugging
            
            if response.status_code == 429:  # Rate limit
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
                
            if response.status_code == 200:
                try:
                    # Extract the JSON content from the response
                    response_data = response.json()
                    content = response_data["choices"][0]["message"]["content"]
                    
                    # Get token usage from response
                    usage = response_data.get("usage", {})
                    input_tokens = usage.get("prompt_tokens", 0)
                    output_tokens = usage.get("completion_tokens", 0)
                    
                    # Track token usage
                    token_tracker.add_request(data["model"], input_tokens, output_tokens)
                    
                    print(f"Content from API: {content[:500]}...")  # Print first 500 chars of content
                    
                    # Extract JSON from content that might be wrapped in code blocks
                    json_content = extract_json_from_content(content)
                    print(f"Extracted JSON content: {json_content[:500]}...")  # Print first 500 chars of extracted JSON
                    
                    parsed_content = json.loads(json_content)
                    print("Successfully parsed JSON response")
                    return parsed_content
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Error parsing Perplexity response: {e}")
                    time.sleep(1)
                    continue
            else:
                print(f"Error from Perplexity API: {response.status_code}")
                time.sleep(1)
                continue
        except Exception as e:
            print(f"Exception during API call: {e}")
            time.sleep(1)
            continue
    
    return None

def enrich_place(place):
    """Enrich a single place with Perplexity data."""
    print(f"Enriching {place['name']} in {place['city']}...")
    
    # Get enrichment data from Perplexity
    enrichment_data = get_perplexity_response(place['name'], place['city'])
    
    if enrichment_data:
        # Merge the original place data with the new enrichment data
        enriched_place = {**place, **enrichment_data}
        return enriched_place
    return None

def main():
    # Print current working directory and file paths for debugging
    print(f"Current working directory: {os.getcwd()}")
    print(f"Input file path: {INPUT_FILE}")
    print(f"Input file exists: {INPUT_FILE.exists()}")
    print(f"Input file absolute path: {INPUT_FILE.absolute()}")
    
    # Read the input file
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            print(f"Reading file: {INPUT_FILE}")
            places_by_city = json.load(f)
            print(f"Successfully loaded JSON with {len(places_by_city)} cities")
            
            # Initialize list to store enriched places
            enriched_places = []
            total_places = sum(len(places) for places in places_by_city.values())
            processed_places = 0
            
            # Process each city and its places
            for city, places in places_by_city.items():
                print(f"\nProcessing city: {city}")
                print(f"Number of places in {city}: {len(places)}")
                
                for place in places:
                    processed_places += 1
                    print(f"\nProcessing place {processed_places}/{total_places}: {place['name']} in {city}")
                    enriched_place = enrich_place(place)
                    
                    if enriched_place:
                        enriched_places.append(enriched_place)
                        print(f"Successfully enriched {place['name']}")
                    else:
                        print(f"Failed to enrich {place['name']}")
                    
                    # Add a small delay between API calls to avoid rate limits
                    time.sleep(1)
            
            # Write the enriched places to the output file
            if enriched_places:
                with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(enriched_places, f, ensure_ascii=False, indent=2)
                print(f"\nSuccessfully saved {len(enriched_places)} enriched places to {OUTPUT_FILE}")
            else:
                print("\nNo places were successfully enriched")
                
    except Exception as e:
        print(f"Error processing file: {e}")
        print(f"Error details: {str(e)}")
    
    # Print token usage summary at the end
    token_tracker.print_summary()

if __name__ == "__main__":
    main()
