import type { Trail } from '@/types/trail';

/**
 * UK Trail Database
 * 
 * Comprehensive list of hiking, running, and cycling trails across the UK
 * Includes mountains, waterfalls, lakes, and coastal paths
 */

export const UK_TRAILS: Trail[] = [
  // ========================================
  // MOUNTAINS - WALES
  // ========================================
  {
    id: 'snowdon_llanberis_path',
    name: 'Snowdon via Llanberis Path',
    description: 'The most popular route to the summit of Snowdon (Yr Wyddfa), offering stunning views of the Welsh mountains. Gradual ascent with well-maintained paths.',
    startLocation: { latitude: 53.1181, longitude: -4.1135 },
    endLocation: { latitude: 53.0685, longitude: -4.0764 },
    waypoints: [
      { latitude: 53.1181, longitude: -4.1135, name: 'Llanberis Start' },
      { latitude: 53.0985, longitude: -4.1023, elevation: 400, name: 'Halfway House' },
      { latitude: 53.0812, longitude: -4.0892, elevation: 700 },
      { latitude: 53.0685, longitude: -4.0764, elevation: 1085, name: 'Snowdon Summit' },
    ],
    distance: 9000, // 9km one way
    elevationGain: 975,
    difficulty: 'Hard',
    type: 'Hiking',
    tags: ['mountain', 'summit', 'scenic', 'wales', 'highest_wales'],
    region: 'Snowdonia',
    country: 'Wales',
    rating: 4.8,
    reviewCount: 2456,
    imageUrl: 'https://example.com/snowdon.jpg',
    difficultyByType: {
      'Hiking': 'Hard',
      'Running': 'Expert',
    },
    metadata: {
      estimatedTime: '5-7 hours return',
      bestTime: 'May to September',
      parking: 'Llanberis car park (£5/day)',
      facilities: ['toilets', 'cafe', 'visitor_center', 'railway_station'],
      surface: 'rocky path, well maintained',
      elevation: { min: 110, max: 1085 },
    },
    safety: {
      hazards: ['steep sections', 'exposed summit', 'rapid weather changes'],
      permits: [],
      emergencyContacts: ['Mountain Rescue: 999', 'Snowdonia National Park: 01766 770274'],
    },
    questId: 'boss_snowdon_dragon', // Links to boss quest
  },

  {
    id: 'pen_y_fan_horseshoe',
    name: 'Pen y Fan Horseshoe',
    description: 'Classic circular route over the highest peak in South Wales. Stunning ridge walking with panoramic views.',
    startLocation: { latitude: 51.8838, longitude: -3.4367 },
    endLocation: { latitude: 51.8838, longitude: -3.4367 },
    waypoints: [
      { latitude: 51.8838, longitude: -3.4367, name: 'Storey Arms' },
      { latitude: 51.8846, longitude: -3.4290, elevation: 600, name: 'Corn Du' },
      { latitude: 51.8839, longitude: -3.4361, elevation: 886, name: 'Pen y Fan Summit' },
      { latitude: 51.8892, longitude: -3.4509, elevation: 800, name: 'Cribyn' },
    ],
    distance: 6400,
    elevationGain: 520,
    difficulty: 'Moderate',
    type: 'Hiking',
    tags: ['mountain', 'ridge', 'brecon_beacons', 'circular'],
    region: 'Brecon Beacons',
    country: 'Wales',
    rating: 4.7,
    reviewCount: 1823,
    metadata: {
      estimatedTime: '3-4 hours',
      bestTime: 'Year round',
      parking: 'Storey Arms car park',
      facilities: ['toilets'],
      surface: 'gravel and grass',
      elevation: { min: 440, max: 886 },
    },
  },

  // ========================================
  // MOUNTAINS - SCOTLAND
  // ========================================
  {
    id: 'ben_nevis_mountain_track',
    name: 'Ben Nevis via Mountain Track',
    description: 'The classic route to the highest peak in the British Isles. Long, sustained climb with incredible summit views.',
    startLocation: { latitude: 56.7969, longitude: -5.0037 },
    endLocation: { latitude: 56.7969, longitude: -5.0037 },
    waypoints: [
      { latitude: 56.7969, longitude: -5.0037, name: 'Glen Nevis Visitor Centre' },
      { latitude: 56.7989, longitude: -5.0125, elevation: 300, name: 'Halfway Lochan' },
      { latitude: 56.7996, longitude: -5.0034, elevation: 700, name: 'Red Burn' },
      { latitude: 56.7965, longitude: -5.0037, elevation: 1345, name: 'Ben Nevis Summit' },
    ],
    distance: 16000, // 16km return
    elevationGain: 1352,
    difficulty: 'Expert',
    type: 'Hiking',
    tags: ['mountain', 'highest_uk', 'scotland', 'munro', 'challenging'],
    region: 'Highlands',
    country: 'Scotland',
    rating: 4.9,
    reviewCount: 3245,
    difficultyByType: {
      'Hiking': 'Expert',
      'Running': 'Expert', // Ben Nevis Race is legendary
    },
    metadata: {
      estimatedTime: '7-9 hours return',
      bestTime: 'June to September',
      parking: 'Glen Nevis Visitor Centre car park',
      facilities: ['toilets', 'visitor_center', 'cafe'],
      surface: 'rocky mountain path',
      elevation: { min: 20, max: 1345 },
    },
    safety: {
      hazards: ['steep sections', 'summit plateau', 'rapid weather', 'snow year-round'],
      permits: [],
      emergencyContacts: ['Mountain Rescue: 999', 'Lochaber MRT: 01397 702000'],
    },
    questId: 'boss_ben_nevis_titan',
  },

  {
    id: 'ben_lomond_tourist_path',
    name: 'Ben Lomond via Tourist Path',
    description: 'Scotland\'s most southerly Munro, offering stunning views over Loch Lomond. Well-trodden tourist route.',
    startLocation: { latitude: 56.1592, longitude: -4.6318 },
    endLocation: { latitude: 56.1730, longitude: -4.6359 },
    waypoints: [
      { latitude: 56.1592, longitude: -4.6318, name: 'Rowardennan' },
      { latitude: 56.1661, longitude: -4.6338, elevation: 450 },
      { latitude: 56.1730, longitude: -4.6359, elevation: 974, name: 'Ben Lomond Summit' },
    ],
    distance: 11000,
    elevationGain: 974,
    difficulty: 'Hard',
    type: 'Hiking',
    tags: ['munro', 'loch_lomond', 'popular', 'scotland'],
    region: 'Loch Lomond & The Trossachs',
    country: 'Scotland',
    rating: 4.6,
    reviewCount: 1567,
    metadata: {
      estimatedTime: '6-7 hours return',
      bestTime: 'April to October',
      parking: 'Rowardennan car park',
      facilities: ['toilets', 'hotel'],
      surface: 'gravel and rock',
      elevation: { min: 10, max: 974 },
    },
  },

  // ========================================
  // MOUNTAINS - LAKE DISTRICT
  // ========================================
  {
    id: 'scafell_pike_corridor_route',
    name: 'Scafell Pike via Corridor Route',
    description: 'The highest peak in England, accessed via the scenic Corridor Route from Wasdale.',
    startLocation: { latitude: 54.4372, longitude: -3.2044 },
    endLocation: { latitude: 54.4543, longitude: -3.2116 },
    waypoints: [
      { latitude: 54.4372, longitude: -3.2044, name: 'Wasdale Head' },
      { latitude: 54.4456, longitude: -3.2089, elevation: 600, name: 'Lingmell Col' },
      { latitude: 54.4543, longitude: -3.2116, elevation: 978, name: 'Scafell Pike Summit' },
    ],
    distance: 10000,
    elevationGain: 989,
    difficulty: 'Hard',
    type: 'Hiking',
    tags: ['highest_england', 'lake_district', 'three_peaks', 'challenging'],
    region: 'Lake District',
    country: 'England',
    rating: 4.8,
    reviewCount: 2134,
    metadata: {
      estimatedTime: '5-6 hours return',
      bestTime: 'May to September',
      parking: 'Wasdale Head car park',
      facilities: ['toilets', 'inn'],
      surface: 'rocky mountain path',
      elevation: { min: 80, max: 978 },
    },
  },

  {
    id: 'helvellyn_striding_edge',
    name: 'Helvellyn via Striding Edge',
    description: 'One of the most famous ridge walks in England. Dramatic scrambling with breathtaking exposure.',
    startLocation: { latitude: 54.5263, longitude: -3.0194 },
    endLocation: { latitude: 54.5276, longitude: -3.0165 },
    waypoints: [
      { latitude: 54.5263, longitude: -3.0194, name: 'Glenridding' },
      { latitude: 54.5198, longitude: -3.0156, elevation: 400, name: 'Hole-in-the-Wall' },
      { latitude: 54.5219, longitude: -3.0119, elevation: 800, name: 'Striding Edge Start' },
      { latitude: 54.5276, longitude: -3.0165, elevation: 950, name: 'Helvellyn Summit' },
    ],
    distance: 14500,
    elevationGain: 950,
    difficulty: 'Expert',
    type: 'Hiking',
    tags: ['ridge', 'scrambling', 'exposed', 'iconic', 'lake_district'],
    region: 'Lake District',
    country: 'England',
    rating: 4.9,
    reviewCount: 1876,
    metadata: {
      estimatedTime: '6-8 hours',
      bestTime: 'May to October',
      parking: 'Glenridding car park',
      facilities: ['toilets', 'cafes', 'shops'],
      surface: 'rocky scramble',
      elevation: { min: 150, max: 950 },
    },
    safety: {
      hazards: ['exposed ridge', 'scrambling', 'weather dependent', 'not for vertigo'],
      permits: [],
      emergencyContacts: ['Mountain Rescue: 999', 'Patterdale MRT: 01768 482999'],
    },
  },

  // ========================================
  // WATERFALLS
  // ========================================
  {
    id: 'sgwd_yr_eira_waterfall',
    name: 'Sgwd yr Eira - Walk Behind Waterfall',
    description: 'Magical waterfall where you can walk behind the curtain of falling water. Part of the Waterfall Country trail.',
    startLocation: { latitude: 51.8172, longitude: -3.5739 },
    endLocation: { latitude: 51.8191, longitude: -3.5821 },
    waypoints: [
      { latitude: 51.8172, longitude: -3.5739, name: 'Porth yr Ogof Car Park' },
      { latitude: 51.8182, longitude: -3.5780, name: 'River Mellte' },
      { latitude: 51.8191, longitude: -3.5821, name: 'Sgwd yr Eira Waterfall' },
    ],
    distance: 2400,
    elevationGain: 85,
    difficulty: 'Easy',
    type: 'Walking',
    tags: ['waterfall', 'walk_behind', 'family', 'scenic', 'wales'],
    region: 'Brecon Beacons',
    country: 'Wales',
    rating: 4.7,
    reviewCount: 892,
    metadata: {
      estimatedTime: '1.5-2 hours',
      bestTime: 'Year round (more dramatic in winter)',
      parking: 'Porth yr Ogof car park (£4)',
      facilities: ['toilets'],
      surface: 'woodland path, can be muddy',
      elevation: { min: 210, max: 295 },
    },
  },

  {
    id: 'pistyll_rhaeadr_waterfall',
    name: 'Pistyll Rhaeadr - Tallest Waterfall in Wales',
    description: 'Britain\'s tallest single-drop waterfall at 80m. Short walk with spectacular views.',
    startLocation: { latitude: 52.9156, longitude: -3.3094 },
    endLocation: { latitude: 52.9168, longitude: -3.3106 },
    waypoints: [
      { latitude: 52.9156, longitude: -3.3094, name: 'Car Park' },
      { latitude: 52.9168, longitude: -3.3106, name: 'Waterfall Base' },
    ],
    distance: 600,
    elevationGain: 45,
    difficulty: 'Easy',
    type: 'Walking',
    tags: ['waterfall', 'tallest', 'short_walk', 'family'],
    region: 'Powys',
    country: 'Wales',
    rating: 4.8,
    reviewCount: 634,
    metadata: {
      estimatedTime: '30 minutes',
      bestTime: 'Year round',
      parking: 'On-site car park (£2)',
      facilities: ['toilets', 'cafe'],
      surface: 'paved path',
      elevation: { min: 300, max: 345 },
    },
  },

  {
    id: 'aira_force_waterfall',
    name: 'Aira Force Waterfall',
    description: 'One of the Lake District\'s most impressive waterfalls, plunging 20m through a wooded glen.',
    startLocation: { latitude: 54.5778, longitude: -2.9106 },
    endLocation: { latitude: 54.5756, longitude: -2.9089 },
    waypoints: [
      { latitude: 54.5778, longitude: -2.9106, name: 'Aira Force Car Park' },
      { latitude: 54.5767, longitude: -2.9098, name: 'Bridge Viewpoint' },
      { latitude: 54.5756, longitude: -2.9089, name: 'Top Viewpoint' },
    ],
    distance: 1200,
    elevationGain: 80,
    difficulty: 'Easy',
    type: 'Walking',
    tags: ['waterfall', 'woodland', 'lake_district', 'family', 'national_trust'],
    region: 'Lake District',
    country: 'England',
    rating: 4.6,
    reviewCount: 1245,
    metadata: {
      estimatedTime: '45 minutes',
      bestTime: 'Year round',
      parking: 'National Trust car park (free for members)',
      facilities: ['toilets', 'cafe'],
      surface: 'paved and gravel',
      elevation: { min: 140, max: 220 },
    },
  },

  // ========================================
  // LAKES
  // ========================================
  {
    id: 'llyn_idwal_circuit',
    name: 'Llyn Idwal Circuit',
    description: 'Circular walk around a stunning glacial lake beneath the dramatic cliffs of the Devil\'s Kitchen.',
    startLocation: { latitude: 53.1189, longitude: -4.0256 },
    endLocation: { latitude: 53.1189, longitude: -4.0256 },
    waypoints: [
      { latitude: 53.1189, longitude: -4.0256, name: 'Ogwen Car Park' },
      { latitude: 53.1165, longitude: -4.0189, name: 'Llyn Idwal' },
      { latitude: 53.1143, longitude: -4.0234, name: 'Devil\'s Kitchen' },
    ],
    distance: 4800,
    elevationGain: 180,
    difficulty: 'Easy',
    type: 'Walking',
    tags: ['lake', 'glacial', 'circular', 'snowdonia', 'family'],
    region: 'Snowdonia',
    country: 'Wales',
    rating: 4.7,
    reviewCount: 1034,
    metadata: {
      estimatedTime: '2-3 hours',
      bestTime: 'Year round',
      parking: 'Ogwen car park',
      facilities: ['toilets'],
      surface: 'rocky path, boardwalks',
      elevation: { min: 310, max: 490 },
    },
  },

  {
    id: 'loch_an_eilein_castle',
    name: 'Loch an Eilein Castle Circuit',
    description: 'Beautiful loch walk with a 13th-century castle on an island. Ancient Caledonian pine forest.',
    startLocation: { latitude: 57.1456, longitude: -3.8234 },
    endLocation: { latitude: 57.1456, longitude: -3.8234 },
    waypoints: [
      { latitude: 57.1456, longitude: -3.8234, name: 'Car Park' },
      { latitude: 57.1423, longitude: -3.8198, name: 'Castle Island' },
      { latitude: 57.1467, longitude: -3.8156, name: 'North Shore' },
    ],
    distance: 6400,
    elevationGain: 45,
    difficulty: 'Easy',
    type: 'Walking',
    tags: ['loch', 'castle', 'forest', 'flat', 'scotland', 'family'],
    region: 'Cairngorms',
    country: 'Scotland',
    rating: 4.8,
    reviewCount: 768,
    metadata: {
      estimatedTime: '1.5-2 hours',
      bestTime: 'Year round',
      parking: 'Loch an Eilein car park',
      facilities: ['toilets'],
      surface: 'well maintained path',
      elevation: { min: 320, max: 365 },
    },
  },

  {
    id: 'ullswater_steamer_walk',
    name: 'Ullswater Way - Howtown to Glenridding',
    description: 'Classic Lake District walk along England\'s second longest lake. Take the steamer one way.',
    startLocation: { latitude: 54.5614, longitude: -2.8756 },
    endLocation: { latitude: 54.5263, longitude: -3.0194 },
    waypoints: [
      { latitude: 54.5614, longitude: -2.8756, name: 'Howtown Pier' },
      { latitude: 54.5456, longitude: -2.9234, name: 'Sandwick' },
      { latitude: 54.5334, longitude: -2.9678, name: 'Silver Point' },
      { latitude: 54.5263, longitude: -3.0194, name: 'Glenridding' },
    ],
    distance: 11200,
    elevationGain: 380,
    difficulty: 'Moderate',
    type: 'Walking',
    tags: ['lake', 'ullswater', 'linear', 'steamer', 'scenic'],
    region: 'Lake District',
    country: 'England',
    rating: 4.9,
    reviewCount: 1567,
    metadata: {
      estimatedTime: '4-5 hours one way',
      bestTime: 'April to October',
      parking: 'Glenridding car park (steamer return)',
      facilities: ['toilets', 'cafes', 'steamer'],
      surface: 'lakeside path',
      elevation: { min: 140, max: 520 },
    },
  },

  // ========================================
  // COASTAL
  // ========================================
  {
    id: 'pembrokeshire_coast_marloes',
    name: 'Marloes Peninsula Coastal Walk',
    description: 'Stunning coastal walk with dramatic cliffs, secluded beaches, and abundant wildlife.',
    startLocation: { latitude: 51.7456, longitude: -5.1834 },
    endLocation: { latitude: 51.7612, longitude: -5.2123 },
    waypoints: [
      { latitude: 51.7456, longitude: -5.1834, name: 'Marloes' },
      { latitude: 51.7534, longitude: -5.1956, name: 'Deer Park' },
      { latitude: 51.7612, longitude: -5.2123, name: 'Wooltack Point' },
    ],
    distance: 8400,
    elevationGain: 245,
    difficulty: 'Moderate',
    type: 'Walking',
    tags: ['coastal', 'cliffs', 'wildlife', 'pembrokeshire', 'wales'],
    region: 'Pembrokeshire',
    country: 'Wales',
    rating: 4.7,
    reviewCount: 543,
    metadata: {
      estimatedTime: '3-4 hours',
      bestTime: 'March to October (wildflowers)',
      parking: 'Marloes village car park',
      facilities: ['toilets', 'pub'],
      surface: 'coastal path',
      elevation: { min: 0, max: 245 },
    },
  },

  // ========================================
  // FOREST / NATURE
  // ========================================
  {
    id: 'fairy_glen_betws_y_coed',
    name: 'Fairy Glen - Betws-y-Coed',
    description: 'Enchanting gorge walk through ancient woodland with waterfalls and rock pools.',
    startLocation: { latitude: 53.0934, longitude: -3.7956 },
    endLocation: { latitude: 53.0889, longitude: -3.8034 },
    waypoints: [
      { latitude: 53.0934, longitude: -3.7956, name: 'Entrance' },
      { latitude: 53.0912, longitude: -3.7995, name: 'Upper Falls' },
      { latitude: 53.0889, longitude: -3.8034, name: 'Fairy Glen' },
    ],
    distance: 1600,
    elevationGain: 75,
    difficulty: 'Easy',
    type: 'Walking',
    tags: ['forest', 'waterfall', 'gorge', 'family', 'wales'],
    region: 'Snowdonia',
    country: 'Wales',
    rating: 4.5,
    reviewCount: 672,
    metadata: {
      estimatedTime: '1 hour',
      bestTime: 'Spring and summer',
      parking: 'Small fee (£2)',
      facilities: [],
      surface: 'woodland path, steps',
      elevation: { min: 90, max: 165 },
    },
  },

  // ========================================
  // RUNNING TRAILS (Strava Segments)
  // ========================================
  {
    id: 'box_hill_zigzag_road',
    name: 'Box Hill - Zig Zag Road',
    description: 'Iconic cycling and running climb through Surrey Hills. Featured in 2012 Olympics.',
    startLocation: { latitude: 51.2531, longitude: -0.3245 },
    endLocation: { latitude: 51.2489, longitude: -0.3187 },
    waypoints: [
      { latitude: 51.2531, longitude: -0.3245, name: 'Start of climb' },
      { latitude: 51.2489, longitude: -0.3187, elevation: 224, name: 'Summit' },
    ],
    distance: 2400,
    elevationGain: 131,
    difficulty: 'Moderate',
    type: 'Running',
    tags: ['running', 'cycling', 'strava_segment', 'surrey_hills', 'olympics'],
    region: 'Surrey',
    country: 'England',
    rating: 4.8,
    reviewCount: 4523,
    stravaSegment: {
      id: '229781',
      name: 'Box Hill Zig Zag',
      distance: 2400,
      elevationGain: 131,
      grade: 5.5,
      kom: {
        name: 'Pro Cyclist',
        time: 378, // 6:18
        date: '2023-08-15',
      },
      leaderboard: [
        { rank: 1, name: 'Pro Cyclist', time: 378, date: '2023-08-15' },
        { rank: 2, name: 'Elite Runner', time: 396, date: '2023-07-22' },
        { rank: 3, name: 'Fast Climber', time: 412, date: '2023-09-03' },
      ],
    },
    metadata: {
      estimatedTime: '15-20 minutes (running)',
      bestTime: 'Year round',
      parking: 'Box Hill car park (National Trust)',
      facilities: ['toilets', 'cafe', 'shop'],
      surface: 'paved road',
      elevation: { min: 93, max: 224 },
    },
  },

  {
    id: 'ditchling_beacon_climb',
    name: 'Ditchling Beacon',
    description: 'Legendary cycling climb in the South Downs. Steep ramps and panoramic views.',
    startLocation: { latitude: 50.8923, longitude: -0.1045 },
    endLocation: { latitude: 50.8867, longitude: -0.1089 },
    waypoints: [
      { latitude: 50.8923, longitude: -0.1045, name: 'Base' },
      { latitude: 50.8867, longitude: -0.1089, elevation: 248, name: 'Beacon' },
    ],
    distance: 1450,
    elevationGain: 137,
    difficulty: 'Hard',
    type: 'Running',
    tags: ['running', 'cycling', 'strava_segment', 'south_downs', 'steep'],
    region: 'South Downs',
    country: 'England',
    rating: 4.7,
    reviewCount: 3245,
    metadata: {
      estimatedTime: '8-12 minutes (running)',
      bestTime: 'Year round',
      parking: 'Ditchling Beacon car park',
      facilities: ['toilets'],
      surface: 'paved road',
      elevation: { min: 111, max: 248 },
    },
  },
];

/**
 * Get trails near a location
 */
export function getTrailsNear(
  location: { latitude: number; longitude: number },
  radiusKm: number = 50
): Trail[] {
  return UK_TRAILS.filter(trail => {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      trail.startLocation.latitude,
      trail.startLocation.longitude
    );
    return distance <= radiusKm;
  });
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
