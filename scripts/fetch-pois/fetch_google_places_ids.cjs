const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
  api: {
    key: 'XXXXXX',
    baseUrl: 'https://maps.googleapis.com/maps/api/place',
    maxRetries: 3,
    initialDelay: 2000,
    maxConcurrentCities: 2,
  },
  search: {
    radius: 5000,
    maxPages: 3,
    types: [
      'tourist_attraction',
      'museum',
      'park',
      'art_gallery',
      'church',
      'amusement_park',
      'stadium'
    ]
  },
  output: {
    directory: 'data/places',
    progressFile: 'places_progress.json',
    finalFile: 'places_all_cities.json'
  }
};

// 50 popular tourist cities
const cities = [
  { name: 'Bangkok',      lat: 13.7563,  lng: 100.5018 },
  { name: 'Paris',        lat: 48.8566,  lng: 2.3522   },
  { name: 'London',       lat: 51.5072,  lng: -0.1276  },
  { name: 'Dubai',        lat: 25.2048,  lng: 55.2708  },
  { name: 'Singapore',    lat: 1.3521,   lng: 103.8198 },
  { name: 'Kuala Lumpur', lat: 3.1390,   lng: 101.6869 },
  { name: 'Istanbul',     lat: 41.0082,  lng: 28.9784  },
  { name: 'New York',     lat: 40.7128,  lng: -74.0060 },
  { name: 'Tokyo',        lat: 35.6895,  lng: 139.6917 },
  { name: 'Seoul',        lat: 37.5665,  lng: 126.9780 },
  { name: 'Hong Kong',    lat: 22.3193,  lng: 114.1694 },
  { name: 'Barcelona',    lat: 41.3851,  lng: 2.1734   },
  { name: 'Amsterdam',    lat: 52.3676,  lng: 4.9041   },
  { name: 'Rome',         lat: 41.9028,  lng: 12.4964  },
  { name: 'Milan',        lat: 45.4642,  lng: 9.1900   },
  { name: 'Vienna',       lat: 48.2082,  lng: 16.3738  },
  { name: 'Prague',       lat: 50.0755,  lng: 14.4378  },
  { name: 'Madrid',       lat: 40.4168,  lng: -3.7038  },
  { name: 'Ha Noi',       lat: 21.0278,  lng: 105.8342 },
  { name: 'Sydney',       lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne',    lat: -37.8136, lng: 144.9631 },
  { name: 'Los Angeles',  lat: 34.0522,  lng: -118.2437},
  { name: 'Las Vegas',    lat: 36.1699,  lng: -115.1398},
  { name: 'Miami',        lat: 25.7617,  lng: -80.1918 },
  { name: 'Orlando',      lat: 28.5383,  lng: -81.3792 },
  { name: 'San Francisco',lat: 37.7749,  lng: -122.4194},
  { name: 'Toronto',      lat: 43.6532,  lng: -79.3832 },
  { name: 'Vancouver',    lat: 49.2827,  lng: -123.1207},
  { name: 'Berlin',       lat: 52.5200,  lng: 13.4050  },
  { name: 'Munich',       lat: 48.1351,  lng: 11.5820  },
  { name: 'Budapest',     lat: 47.4979,  lng: 19.0402  },
  { name: 'Lisbon',       lat: 38.7223,  lng: -9.1393  },
  { name: 'Copenhagen',   lat: 55.6761,  lng: 12.5683  },
  { name: 'Stockholm',    lat: 59.3293,  lng: 18.0686  },
  { name: 'Oslo',         lat: 59.9139,  lng: 10.7522  },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729},
  { name: 'Sao Paulo',    lat: -23.5505, lng: -46.6333 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { name: 'Mexico City',  lat: 19.4326,  lng: -99.1332 },
  { name: 'Moscow',       lat: 55.7558,  lng: 37.6173  },
  { name: 'Athens',       lat: 37.9838,  lng: 23.7275  },
  { name: 'Shanghai',     lat: 31.2304,  lng: 121.4737 },
  { name: 'Beijing',      lat: 39.9042,  lng: 116.4074 },
  { name: 'Jerusalem',    lat: 31.7683,  lng: 35.2137  },
  { name: 'Tel Aviv',     lat: 32.0853,  lng: 34.7818  },
  { name: 'Doha',         lat: 25.2854,  lng: 51.5310  },
  { name: 'Cape Town',    lat: -33.9249, lng: 18.4241  },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473  },
];

// API Usage Monitoring
const apiUsage = {
  calls: 0,
  byCity: {},
  byType: {},
  errors: [],
  startTime: Date.now(),
  
  log(city, type) {
    this.calls++;
    this.byCity[city] = (this.byCity[city] || 0) + 1;
    this.byType[type] = (this.byType[type] || 0) + 1;
  },
  
  logError(city, type, error) {
    this.errors.push({
      city,
      type,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  },
  
  generateReport() {
    return {
      totalCalls: this.calls,
      duration: (Date.now() - this.startTime) / 1000,
      callsByCity: this.byCity,
      callsByType: this.byType,
      errorCount: this.errors.length,
      errors: this.errors
    };
  }
};

async function sleep(ms) {
  console.log(`   ... sleeping for ${ms / 1000}s`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, city, type, maxRetries = config.api.maxRetries) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      apiUsage.log(city, type);
      const res = await axios.get(url.href);
      
      if (res.data.status === 'OVER_QUERY_LIMIT') {
        const delay = config.api.initialDelay * Math.pow(2, i);
        console.log(`Rate limited. Waiting ${delay/1000}s before retry ${i + 1}/${maxRetries}`);
        await sleep(delay);
        continue;
      }
      
      return res;
    } catch (error) {
      apiUsage.logError(city, type, error);
      if (i === maxRetries - 1) throw error;
      const delay = config.api.initialDelay * Math.pow(2, i);
      console.log(`Error occurred. Retrying in ${delay/1000}s... (${i + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}

async function fetchNearbyPlacesByType(cityObj, type, maxPages = config.search.maxPages) {
  let allResults = [];
  let nextPageToken = null;

  console.log(` -> Fetching type: ${type} for city: ${cityObj.name}`);
  for (let page = 0; page < maxPages; page++) {
    console.log(`    - Fetching page ${page + 1}/${maxPages}...`);
    const url = new URL(`${config.api.baseUrl}/nearbysearch/json`);
    url.searchParams.set('location', `${cityObj.lat},${cityObj.lng}`);
    url.searchParams.set('radius', config.search.radius.toString());
    url.searchParams.set('type', type);
    url.searchParams.set('key', config.api.key);

    if (nextPageToken) {
      url.searchParams.set('pagetoken', nextPageToken);
    }

    try {
      const res = await fetchWithRetry(url, cityObj.name, type);
      const { results, next_page_token, status, error_message } = res.data;

      console.log(`    - API Status: ${status}`);
      if (status !== 'OK' && status !== 'ZERO_RESULTS') {
        console.error(`    - API Error: ${error_message || 'Unknown error'}`);
        if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
          break;
        }
      }

      if (results?.length) {
        console.log(`    - Found ${results.length} results on page ${page + 1}`);
        allResults.push(...results.map(place => enrichPlaceData(place, cityObj)));
      } else {
        console.log(`    - No results on page ${page + 1}`);
      }

      if (!next_page_token) break;

      nextPageToken = next_page_token;
      await sleep(2000);

    } catch (error) {
      console.error(`    - Error fetching page ${page + 1}:`, error.message);
      break;
    }
  }

  return allResults;
}

function enrichPlaceData(place, city) {
  return {
    city: city.name,
    coordinates: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    },
    name: place.name,
    types: place.types,
    rating: place.rating || null,
    user_ratings_total: place.user_ratings_total || 0,
    place_id: place.place_id,
    photos: place.photos?.map(photo => ({
      reference: photo.photo_reference,
      attribution: photo.html_attributions
    })) || [],
    business_status: place.business_status,
    vicinity: place.vicinity,
    fetched_at: new Date().toISOString()
  };
}

async function saveProgress(globalPlaces, currentCity, currentType) {
  const progress = {
    timestamp: new Date().toISOString(),
    totalPlaces: globalPlaces.length,
    currentCity,
    currentType,
    apiUsage: apiUsage.generateReport()
  };
  
  await fs.writeFile(
    path.join(config.output.directory, config.output.progressFile),
    JSON.stringify({ progress, places: globalPlaces }, null, 2)
  );
}

async function processCityChunk(chunk, globalPlaces = [], placeIdSet = new Set()) {
  const results = await Promise.all(chunk.map(async cityObj => {
    console.log(`\n🔸 Processing city: ${cityObj.name}`);
    const cityPlaces = [];

    for (const type of config.search.types) {
      const places = await fetchNearbyPlacesByType(cityObj, type);
      console.log(`   Found ${places.length} places for type "${type}"`);

      for (const place of places) {
        if (!placeIdSet.has(place.place_id)) {
          placeIdSet.add(place.place_id);
          cityPlaces.push(place);
        }
      }

      await saveProgress(globalPlaces.concat(cityPlaces), cityObj.name, type);
    }

    return cityPlaces;
  }));

  return results.flat();
}

async function main() {
  console.log('--- Script starting ---');
  console.log('Configuration:', JSON.stringify(config, null, 2));

  // Create output directory
  await fs.mkdir(config.output.directory, { recursive: true });

  // Try to load progress
  let globalPlaces = [];
  let startFromCityIndex = 0;
  try {
    const progressData = JSON.parse(
      await fs.readFile(path.join(config.output.directory, config.output.progressFile), 'utf8')
    );
    globalPlaces = progressData.places;
    startFromCityIndex = cities.findIndex(c => c.name === progressData.progress.currentCity);
    console.log(`Resuming from ${progressData.progress.currentCity}`);
  } catch (e) {
    console.log('Starting fresh fetch');
  }

  const placeIdSet = new Set(globalPlaces.map(p => p.place_id));
  const remainingCities = cities.slice(startFromCityIndex);
  const chunks = [];
  
  // Split remaining cities into chunks for concurrent processing
  for (let i = 0; i < remainingCities.length; i += config.api.maxConcurrentCities) {
    chunks.push(remainingCities.slice(i, i + config.api.maxConcurrentCities));
  }

  // Process chunks sequentially, but cities within chunks concurrently
  for (const [index, chunk] of chunks.entries()) {
    console.log(`\nProcessing chunk ${index + 1}/${chunks.length} (${chunk.map(c => c.name).join(', ')})`);
    const newPlaces = await processCityChunk(chunk, globalPlaces, placeIdSet);
    globalPlaces.push(...newPlaces);
  }

  // Save final results
  const finalPath = path.join(config.output.directory, config.output.finalFile);
  await fs.writeFile(finalPath, JSON.stringify(globalPlaces, null, 2));
  
  // Save individual city files
  const byCity = globalPlaces.reduce((acc, place) => {
    acc[place.city] = acc[place.city] || [];
    acc[place.city].push(place);
    return acc;
  }, {});

  for (const [city, places] of Object.entries(byCity)) {
    await fs.writeFile(
      path.join(config.output.directory, `places_${city.toLowerCase()}.json`),
      JSON.stringify(places, null, 2)
    );
  }

  // Generate final report
  const report = apiUsage.generateReport();
  await fs.writeFile(
    path.join(config.output.directory, 'fetch_report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n--- Final Results ---');
  console.log(`Total places fetched: ${globalPlaces.length}`);
  console.log(`Total API calls: ${report.totalCalls}`);
  console.log(`Total errors: ${report.errorCount}`);
  console.log(`Total duration: ${report.duration.toFixed(1)}s`);
  console.log(`Output directory: ${config.output.directory}`);
  console.log('--- Script finished ---');
}

// Execute the script
console.log('Executing fetch_google_places_ids.cjs...');
main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
