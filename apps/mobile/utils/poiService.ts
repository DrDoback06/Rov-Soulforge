/**
 * POI (Point of Interest) Service
 *
 * Fetches real-world locations using OpenStreetMap Overpass API
 * - Parks, landmarks, historical sites, pubs, cafes
 * - Hiking trails, cycling routes
 * - Tourist attractions
 */

export interface POI {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: POIType;
  subtype?: string;
  tags?: Record<string, string>;
}

export type POIType =
  | 'park'
  | 'landmark'
  | 'historical'
  | 'pub'
  | 'cafe'
  | 'restaurant'
  | 'trail'
  | 'viewpoint'
  | 'monument'
  | 'castle'
  | 'museum'
  | 'church'
  | 'stadium';

/**
 * Fetch POIs from OpenStreetMap Overpass API
 */
export async function fetchPOIs(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000
): Promise<POI[]> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';

  // Overpass QL query for various POI types
  const query = `
    [out:json][timeout:25];
    (
      // Parks
      node["leisure"="park"](around:${radiusMeters},${latitude},${longitude});
      way["leisure"="park"](around:${radiusMeters},${latitude},${longitude});

      // Historical sites
      node["historic"](around:${radiusMeters},${latitude},${longitude});
      way["historic"](around:${radiusMeters},${latitude},${longitude});

      // Landmarks & monuments
      node["tourism"="attraction"](around:${radiusMeters},${latitude},${longitude});
      node["tourism"="viewpoint"](around:${radiusMeters},${latitude},${longitude});
      node["man_made"="tower"](around:${radiusMeters},${latitude},${longitude});

      // Pubs & restaurants
      node["amenity"="pub"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="restaurant"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="cafe"](around:${radiusMeters},${latitude},${longitude});

      // Museums, castles, churches
      node["tourism"="museum"](around:${radiusMeters},${latitude},${longitude});
      node["historic"="castle"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="place_of_worship"](around:${radiusMeters},${latitude},${longitude});

      // Trails
      way["highway"="footway"]["name"](around:${radiusMeters},${latitude},${longitude});
      way["highway"="path"]["name"](around:${radiusMeters},${latitude},${longitude});
      way["route"="hiking"](around:${radiusMeters},${latitude},${longitude});
    );
    out center 100;
  `;

  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const pois: POI[] = [];

    for (const element of data.elements) {
      // Get coordinates
      let lat: number;
      let lon: number;

      if (element.type === 'node') {
        lat = element.lat;
        lon = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lon = element.center.lon;
      } else {
        continue; // Skip if no coordinates
      }

      // Get name
      const name = element.tags?.name || element.tags?.['name:en'] || 'Unknown Location';

      // Determine POI type
      const type = determinePOIType(element.tags);

      pois.push({
        id: `osm_${element.type}_${element.id}`,
        name,
        latitude: lat,
        longitude: lon,
        type,
        subtype: element.tags?.historic || element.tags?.tourism || element.tags?.leisure,
        tags: element.tags
      });
    }

    console.log(`📍 Found ${pois.length} POIs near ${latitude}, ${longitude}`);
    return pois;

  } catch (error) {
    console.error('❌ Failed to fetch POIs:', error);
    return [];
  }
}

/**
 * Determine POI type from OSM tags
 */
function determinePOIType(tags: Record<string, string>): POIType {
  if (tags.leisure === 'park') return 'park';
  if (tags.historic === 'castle') return 'castle';
  if (tags.historic === 'monument') return 'monument';
  if (tags.historic) return 'historical';
  if (tags.tourism === 'museum') return 'museum';
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  if (tags.tourism === 'attraction') return 'landmark';
  if (tags.amenity === 'pub') return 'pub';
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.amenity === 'place_of_worship') return 'church';
  if (tags.highway === 'footway' || tags.highway === 'path' || tags.route === 'hiking') return 'trail';
  if (tags.leisure === 'stadium') return 'stadium';

  return 'landmark';
}

/**
 * Get quest type based on POI type
 */
export function getQuestTypeForPOI(poiType: POIType): 'combat' | 'exploration' | 'challenge' | 'defend' | 'collection' {
  const questTypeMap: Record<POIType, 'combat' | 'exploration' | 'challenge' | 'defend' | 'collection'> = {
    park: 'challenge', // Physical challenge, scavenger hunt
    landmark: 'exploration', // Exploration quest
    historical: 'combat', // Defend from enemies
    pub: 'collection', // Collect items quest
    cafe: 'collection',
    restaurant: 'collection',
    trail: 'challenge', // Walking/hiking challenge
    viewpoint: 'exploration',
    monument: 'defend', // Defend/capture quest (like gym)
    castle: 'defend', // Defend the castle
    museum: 'exploration',
    church: 'exploration',
    stadium: 'defend' // PvP arena
  };

  return questTypeMap[poiType] || 'exploration';
}
