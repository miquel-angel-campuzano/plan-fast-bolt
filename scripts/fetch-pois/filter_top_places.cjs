const fs = require('fs').promises;
const path = require('path');

const INPUT_DIR = 'data/places';
const INPUT_FILE = 'places_all_cities.json';
const OUTPUT_FILE = 'top_200_places_by_reviews.json';
const TOP_N = 200;
const MIN_REVIEWS = 50;

async function filterTopPlaces() {
  console.log(`--- Starting place filtering ---`);
  const inputPath = path.join(INPUT_DIR, INPUT_FILE);
  const outputPath = path.join(INPUT_DIR, OUTPUT_FILE);

  // 1. Read the combined JSON file
  let allPlaces;
  try {
    console.log(`Reading data from ${inputPath}...`);
    const rawData = await fs.readFile(inputPath, 'utf8');
    allPlaces = JSON.parse(rawData);
    console.log(`Successfully read ${allPlaces.length} places.`);
  } catch (error) {
    console.error(`❌ Error reading input file ${inputPath}:`, error.message);
    process.exit(1);
  }

  // 2. Group places by city
  console.log('Grouping places by city...');
  const placesByCity = allPlaces.reduce((acc, place) => {
    const city = place.city;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(place);
    return acc;
  }, {});
  const cityNames = Object.keys(placesByCity);
  console.log(`Found data for ${cityNames.length} cities.`);

  // 3. Filter top N for each city
  console.log(`Filtering to keep only places with >= ${MIN_REVIEWS} reviews...`);
  console.log(`Then selecting top ${TOP_N} places per city based on user_ratings_total...`);
  const topPlacesByCity = {};
  let totalFilteredPlaces = 0;

  for (const city of cityNames) {
    const cityPlaces = placesByCity[city];

    // Filter out places with less than MIN_REVIEWS
    const sufficientlyReviewedPlaces = cityPlaces.filter(place =>
      (place.user_ratings_total || 0) >= MIN_REVIEWS
    );

    // Sort the filtered places by user_ratings_total (descending)
    sufficientlyReviewedPlaces.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));

    // Take top N from the *filtered and sorted* list
    topPlacesByCity[city] = sufficientlyReviewedPlaces.slice(0, TOP_N);
    totalFilteredPlaces += topPlacesByCity[city].length;
    console.log(` - ${city}: Found ${cityPlaces.length} places -> ${sufficientlyReviewedPlaces.length} with >= ${MIN_REVIEWS} reviews -> Kept top ${topPlacesByCity[city].length}`);
  }

  // 4. Save the filtered results (overwriting the existing file)
  try {
    console.log(`Saving filtered data (${totalFilteredPlaces} places) to ${outputPath}...`);
    await fs.writeFile(outputPath, JSON.stringify(topPlacesByCity, null, 2));
    console.log(`✅ Successfully saved filtered data to ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error writing output file ${outputPath}:`, error.message);
    process.exit(1);
  }

  console.log(`--- Filtering finished ---`);
}

filterTopPlaces(); 