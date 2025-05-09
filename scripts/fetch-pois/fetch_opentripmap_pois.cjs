const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = '5ae2e3f221c38a28845f05b6affba0cf0f0002a0880111dd528a45ab';
const BASE_URL = 'https://api.opentripmap.com/0.1/en';
const LAT = 41.3851;    // Barcelona latitude
const LON = 2.1734;     // Barcelona longitude
const RADIUS = 5000;    // 5 km radius
const LIMIT = 1000;     // Fetch up to 1000 POIs
const RATE_LIMIT = 5;   // 5 requests per second
const MAX_RETRIES = 3;  // Number of retries for failed requests
const RETRY_DELAY = 2000; // 2 seconds between retries
const BATCH_SIZE = 5;   // Process 5 POIs at a time

class RequestQueue {
  constructor(maxRequestsPerSecond) {
    this.queue = [];
    this.running = false;
    this.lastRequestTime = 0;
    this.maxRequestsPerSecond = maxRequestsPerSecond;
    this.requestTimes = [];
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      // Remove request timestamps older than 1 second
      this.requestTimes = this.requestTimes.filter(time => now - time < 1000);
      
      if (this.requestTimes.length >= this.maxRequestsPerSecond) {
        // Wait until the oldest request is more than 1 second old
        const waitTime = 1000 - (now - this.requestTimes[0]);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const { fn, resolve, reject } = this.queue.shift();
      this.requestTimes.push(now);

      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.running = false;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const waitTime = RETRY_DELAY * Math.pow(2, i);
        console.log(`Rate limit hit, waiting ${waitTime/1000} seconds before retry ${i + 1}/${retries}`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

const queue = new RequestQueue(RATE_LIMIT);

async function fetchWithQueue(url) {
  return queue.add(async () => {
    return retryWithBackoff(async () => {
      const response = await axios.get(url);
      return response.data;
    });
  });
}

// Fetch the POI list using the radius endpoint
async function fetchTopPOIs() {
  const url = `${BASE_URL}/places/radius?lon=${LON}&lat=${LAT}&radius=${RADIUS}&limit=${LIMIT}&kinds=interesting_places,cultural,architecture,historic,museums&apikey=${API_KEY}`;
  try {
    const data = await fetchWithQueue(url);
    const features = data.features.filter(feature => {
      const kinds = feature.properties.kinds.toLowerCase();
      return !kinds.includes('industrial_facilities');
    });

    // Log the distribution of ratings
    const ratingDistribution = features.reduce((acc, feature) => {
      const rating = feature.properties.rate || 'unrated';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nRating distribution:', ratingDistribution);
    console.log(`Total POIs found: ${features.length}\n`);
    
    return features;
  } catch (error) {
    console.error("Error fetching POIs:", error.message);
    return [];
  }
}

// Fetch detailed info for a given POI by its xid
async function fetchDetailedPOI(xid) {
  const url = `${BASE_URL}/places/xid/${xid}?apikey=${API_KEY}`;
  try {
    return await fetchWithQueue(url);
  } catch (error) {
    console.error(`Error fetching detail for ${xid}:`, error.message);
    return null;
  }
}

// Dummy translation function – replace with your actual translation API integration
async function translateToEnglish(text) {
  // Simulate translation (in production use Google Translate, DeepL, or GPT)
  return text + " (translated to English)";
}

// Helper function to generate timestamped filename
function getTimestampedFilename(baseFilename) {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0]; // Remove milliseconds
  const extension = path.extname(baseFilename);
  const basename = path.basename(baseFilename, extension);
  return `${basename}_${timestamp}${extension}`;
}

async function processPOIsInBatches(poiList, outputDir) {
  const detailedPOIs = [];
  const batches = [];
  
  // Split POIs into batches
  for (let i = 0; i < poiList.length; i += BATCH_SIZE) {
    batches.push(poiList.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${poiList.length} POIs in ${batches.length} batches...`);

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} (${Math.round((i + 1) / batches.length * 100)}%)`);
    
    const batchResults = await Promise.all(
      batch.map(poi => fetchDetailedPOI(poi.properties.xid))
    );

    const successfulResults = batchResults.filter(Boolean);
    detailedPOIs.push(...successfulResults.map(detail => ({
      xid: detail.xid,
      name: detail.name,
      description: detail.wikipedia_extracts?.text || "No description available",
      kinds: detail.kinds,
      coordinates: detail.point,
      address: detail.address,
      image: detail.preview?.source,
      wikipedia: detail.wikipedia,
      rating: detail.rate
    })));

    // Add a small delay between batches
    if (i < batches.length - 1) {
      await sleep(1000);
    }

    // Update progress file (overwrite the same file)
    const progressPath = path.join(outputDir, 'barcelona_pois_progress.json');
    fs.writeFileSync(progressPath, JSON.stringify(detailedPOIs, null, 2), 'utf-8');
    console.log(`💾 Progress updated: ${detailedPOIs.length} POIs processed`);
  }

  // Remove progress file after successful completion
  const progressPath = path.join(outputDir, 'barcelona_pois_progress.json');
  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
  }

  return detailedPOIs;
}

async function main() {
  const startTime = Date.now();
  console.log("Fetching POIs in Barcelona...");
  console.log(`Configuration:
  - Limit: ${LIMIT} POIs
  - Radius: ${RADIUS}m
  - Rate limit: ${RATE_LIMIT} requests/second
  - Batch size: ${BATCH_SIZE} POIs/batch
  `);
  
  const poiList = await fetchTopPOIs();
  if (poiList.length === 0) {
    console.error("No POIs found. Exiting...");
    return;
  }

  const outputDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const detailedPOIs = await processPOIsInBatches(poiList, outputDir);

  // Generate final filename with timestamp
  const finalFilename = getTimestampedFilename('barcelona_pois.json');
  const outputPath = path.join(outputDir, finalFilename);
  fs.writeFileSync(outputPath, JSON.stringify(detailedPOIs, null, 2), 'utf-8');
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Final results:
  - Total POIs processed: ${detailedPOIs.length}
  - Success rate: ${Math.round(detailedPOIs.length / poiList.length * 100)}%
  - Total time: ${duration.toFixed(1)} seconds
  - Output file: ${finalFilename}
  `);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});