'use client';

import { auth } from '../../../firebaseApp';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Reusing the LightningRiskZone interface from WindyWeatherMap
interface LightningRiskZone {
  lat: number;
  lon: number;
  riskLevel: number;
  windSpeed: number;
  windDirection: number;
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [lightningRiskZones, setLightningRiskZones] = useState<LightningRiskZone[]>([]);
  const [coordinates, setCoordinates] = useState({
    lat: 51.5074,
    lon: -0.1278,
  });
  const [selectedRegion, setSelectedRegion] = useState<{ lat: number; lon: number; radius: number } | null>(null);
  const router = useRouter();

  // Simulate fetching Zone 1 data
  const fetchZone1 = () => {
    if (!selectedRegion) return;
    
    const zone1: LightningRiskZone = {
      lat: coordinates.lat + (Math.random() * 2 - 1) * (selectedRegion.radius || 1),
      lon: coordinates.lon + (Math.random() * 2 - 1) * (selectedRegion.radius || 1),
      windSpeed: Math.floor(Math.random() * 41) + 10,
      windDirection: Math.floor(Math.random() * 361),
      riskLevel: Math.min(100, Math.floor((Math.random() * 41 + 10) * 1.5 + Math.random() * 20)),
    };
    
    setLightningRiskZones(prev => {
      const updatedZones = [zone1, ...prev.filter((_, index) => index < 4)]; // Keep only top 5 zones
      updatedZones.sort((a, b) => b.riskLevel - a.riskLevel);
      return updatedZones;
    });
  };

  // Initial region setup and periodic Zone 1 updates
  useEffect(() => {
    // Set a default region for notifications
    setSelectedRegion({
      lat: coordinates.lat,
      lon: coordinates.lon,
      radius: 1,
    });

    // Initial fetch
    fetchZone1();

    // Set up interval to fetch Zone 1 every hour (3600000 ms)
    const interval = setInterval(fetchZone1, 3600000);

    return () => clearInterval(interval);
  }, [coordinates]);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/');
      }
      setUser(user);
    });
    return unsubscribe;
  }, [router]);

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{
      backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(79, 70, 229, 0.7)), url(/bg-img.png)'
    }}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">DataSpark</h1>
          <button
            onClick={() => auth.signOut()}
            className="cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-700 hover:to-indigo-500 transition-all"
          >
            Sign Out
          </button>
        </div>
        <div>
          <Link href="/" className="text-gray-300 cursor-pointer hover:underline">
            ← Back
          </Link>
        </div>
        <div className="bg-white bg-opacity-90 rounded-xl p-6 mt-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Lightning Risk Notifications</h2>
          <div className="grid grid-cols-1 gap-4">
            {lightningRiskZones.length === 0 ? (
              <p className="text-gray-600">No notifications available. Analyzing wind patterns...</p>
            ) : (
              lightningRiskZones.map((zone, index) => (
                <div
                  key={index}
                  className="bg-indigo-50 p-4 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-800">
                      Zone {index + 1}
                    </h3>
                    <p className="text-gray-700">
                      Location: {zone.lat.toFixed(4)}, {zone.lon.toFixed(4)}
                    </p>
                    <p className="text-gray-700">
                      Wind: {zone.windSpeed} knots from {zone.windDirection}°
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      zone.riskLevel > 70
                        ? 'bg-red-100 text-red-800'
                        : zone.riskLevel > 40
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    Risk: {zone.riskLevel}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}