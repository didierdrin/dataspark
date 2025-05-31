'use client'; 

import { useEffect, useRef, useState } from 'react';

export default function WindyWeatherMap() {
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState('iframe');
  const [coordinates, setCoordinates] = useState({
    lat: 51.5074,
    lon: -0.1278,
  });

  const renderIframeMap = () => {
    const { lat, lon } = coordinates;
    const src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=8&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;

    return (
      <iframe
        title="Windy Weather Map"
        width="100%"
        height="450px"
        src={src}
        frameBorder="0"
        style={{ border: 'none', borderRadius: '8px' }}
      />
    );
  };

  useEffect(() => {
    if (mapType === 'api' && mapRef.current) {
      mapRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      script.async = true;

      script.onload = () => {
        if (window.windyInit) {
          const options = {
            key: 'PsLAtXpsPTZexHuReqgMGHrPrDpNBHNc',
            lat: coordinates.lat,
            lon: coordinates.lon,
            zoom: 8,
          };

          window.windyInit(options, (windyAPI) => {
            const { map } = windyAPI;

            if (window.L) {
              window.L.marker([coordinates.lat, coordinates.lon])
                .addTo(map)
                .bindPopup(`Location: ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`);
            }
          });
        }
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [mapType, coordinates]);

  const handleCoordinateChange = (field, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setCoordinates(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const presetLocations = [
    { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
    { name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
    { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777 },
    { name: 'Lagos, Nigeria', lat: 6.5244, lon: 3.3792 }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">DataSpark</h1>

        {/* Map Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Map Implementation:
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="iframe"
                checked={mapType === 'iframe'}
                onChange={(e) => setMapType(e.target.value)}
                className="mr-2"
              />
              Iframe (Recommended)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="api"
                checked={mapType === 'api'}
                onChange={(e) => setMapType(e.target.value)}
                className="mr-2"
              />
              Windy API
            </label>
          </div>
        </div>

        {/* Coordinate Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude:
            </label>
            <input
              type="number"
              value={coordinates.lat}
              onChange={(e) => handleCoordinateChange('lat', e.target.value)}
              step="0.0001"
              min="-90"
              max="90"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude:
            </label>
            <input
              type="number"
              value={coordinates.lon}
              onChange={(e) => handleCoordinateChange('lon', e.target.value)}
              step="0.0001"
              min="-180"
              max="180"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preset Locations:
            </label>
            <select
              onChange={(e) => {
                const location = presetLocations.find(loc => loc.name === e.target.value);
                if (location) {
                  setCoordinates({ lat: location.lat, lon: location.lon });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a location...</option>
              {presetLocations.map((location) => (
                <option key={location.name} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Coordinates Display */}
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <p className="text-sm text-gray-600">
            Current Location: <strong>{coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}</strong>
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        {mapType === 'iframe' ? (
          renderIframeMap()
        ) : (
          <div
            ref={mapRef}
            style={{ width: '100%', height: '450px' }}
            className="bg-gray-100 flex items-center justify-center"
          >
            <p className="text-gray-500">Loading Windy API map...</p>
          </div>
        )}
      </div>

      {/* Additional Controls for iframe */}
      {mapType === 'iframe' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Map Features:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Wind overlay active
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Location marker
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              Current weather
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
              Interactive zoom
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">How to use:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Use the iframe method for most reliable results</li>
          <li>• Enter custom coordinates or select from preset locations</li>
          <li>• The map shows wind patterns, weather data, and forecasts</li>
          <li>• Click and drag to pan, scroll to zoom in/out</li>
          <li>• The marker shows your selected location</li>
        </ul>
      </div>
    </div>
  );
}


// 'use client';

// import { useEffect } from 'react';

// export default function WindyMap() {
//   useEffect(() => {
//     const script = document.createElement('script');
//     script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
//     script.async = true;
//     document.body.appendChild(script);

//     script.onload = () => {
//       if (typeof (window as any).windyInit !== 'function') return;

//       (window as any).windyInit(
//         {
//           key: 'TKWWcAROf8CeH6sKIysWMWQskgOv6TdZ', // ✅ Replace with your Windy API key
//           lat: 20,                  // ✅ Valid latitude
//           lon: 0,                   // ✅ Valid longitude
//           zoom: 4,
//           overlay: 'clouds',
//           level: 'surface',
//         },
//         (windyAPI: any) => {
//           const { map } = windyAPI;
//           console.log('Windy map is ready!', map);
//         }
//       );
//     };

//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   return (
//     <div id="windy" style={{ width: '100%', height: '100vh' }}></div>
//   );
// }



// 'use client';

// import { useEffect } from 'react';

// export default function HomePage() {
//   useEffect(() => {
//     // Only load Windy script on client
//     const windyScript = document.createElement('script');
//     windyScript.src = 'https://embed.windy.com/embed2.js';
//     windyScript.async = true;
//     document.body.appendChild(windyScript);

//     return () => {
//       document.body.removeChild(windyScript);
//     };
//   }, []);

//   return (
//     <div style={{ width: '100%', height: '100vh' }}>
//       <iframe
//         title="Windy Weather Map"
//         width="100%"
//         height="100%"
//         src={`https://embed.windy.com/embed2.html?lat=20&lon=0&detailLat=20&detailLon=0&width=100%25&height=100%25&zoom=2&level=surface&overlay=clouds&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`}
//         frameBorder="0"
//       ></iframe>
//     </div>
//   );
// }
