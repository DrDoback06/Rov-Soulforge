import { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MapPicker } from '@/components/MapPicker';
import type { Quest, Rarity } from '@rov/types';

/**
 * Quest Spawn Tool
 *
 * Manual quest spawning with location selection
 */
export default function SpawnQuestPage() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [questId, setQuestId] = useState('');
  const [region, setRegion] = useState('us-west');
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [timerHours, setTimerHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const handleSpawn = async () => {
    if (!selectedLocation || !questId) {
      alert('Please select a location and quest');
      return;
    }

    setSubmitting(true);

    try {
      // Call Firebase admin function to spawn quest
      const response = await fetch('/api/admin/spawn-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questId,
          location: selectedLocation,
          region,
          geofenceM: geofenceRadius,
          timerSec: timerHours * 3600
        })
      });

      if (response.ok) {
        alert('Quest spawned successfully!');
        setQuestId('');
        setSelectedLocation(null);
      } else {
        throw new Error('Failed to spawn quest');
      }
    } catch (error) {
      alert('Error spawning quest');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Spawn Quest - Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Spawn Quest</h1>
          <p className="text-gray-400 mt-2">Manually spawn a quest at a specific location</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-accent rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quest ID
              </label>
              <input
                type="text"
                value={questId}
                onChange={(e) => setQuestId(e.target.value)}
                placeholder="quest_shadow_beast"
                className="w-full bg-darker text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-darker text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
              >
                <option value="us-west">US West</option>
                <option value="us-east">US East</option>
                <option value="eu-west">EU West</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Geofence Radius (meters)
              </label>
              <input
                type="number"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(parseInt(e.target.value))}
                min={50}
                max={500}
                className="w-full bg-darker text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timer (hours)
              </label>
              <input
                type="number"
                value={timerHours}
                onChange={(e) => setTimerHours(parseInt(e.target.value))}
                min={1}
                max={24}
                className="w-full bg-darker text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
              />
            </div>

            {selectedLocation && (
              <div className="bg-darker rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Selected Location:</p>
                <p className="text-white font-mono">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            )}

            <button
              onClick={handleSpawn}
              disabled={submitting || !selectedLocation || !questId}
              className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Spawning...' : 'Spawn Quest'}
            </button>
          </div>

          {/* Map */}
          <div className="bg-accent rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Location</h3>
            <MapPicker
              onLocationSelect={setSelectedLocation}
              selectedLocation={selectedLocation}
              geofenceRadius={geofenceRadius}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}