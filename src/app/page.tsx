'use client';

import { useEffect, useRef, useState } from 'react';
import { auth } from '../../firebaseApp';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import html2canvas from 'html2canvas';

declare global {
  interface Window {
    windyInit?: (options: {
      key: string;
      lat: number;
      lon: number;
      zoom: number;
    }, callback: (api: any) => void) => void;
    L?: any;
  }
}

type AuthModalType = 'signin' | 'signup' | null;

interface LightningRiskZone {
  lat: number;
  lon: number;
  riskLevel: number;
  windSpeed: number;
  windDirection: number;
}

export default function WindyWeatherMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const [mapType, setMapType] = useState('iframe');
  const [coordinates, setCoordinates] = useState({
    lat: 51.5074,
    lon: -0.1278,
  });
  const [user, setUser] = useState<User | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lightningRiskZones, setLightningRiskZones] = useState<LightningRiskZone[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<{lat: number, lon: number, radius: number} | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthModal(null);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Sign in failed. Please try again.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      }
      setAuthError(errorMessage);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthModal(null);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Sign up failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      setAuthError(errorMessage);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationsNavigation = async () => {
    try {
      router.push('/notifications');
    } catch (error) {
      console.error(error);
    }
  };

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

  const analyzeWindForLightning = () => {
    if (!selectedRegion || !selectedRegion.radius) {
      setAnalysisError('Please select a region with a valid radius first.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setLightningRiskZones([]);
    setAnalysisError(null);
    setTimeout(() => {
      const mockRiskZones: LightningRiskZone[] = [];
      const numZones = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < numZones; i++) {
        const latOffset = (Math.random() * 2 - 1) * (selectedRegion?.radius || 1);
        const lonOffset = (Math.random() * 2 - 1) * (selectedRegion?.radius || 1);
        const lat = coordinates.lat + latOffset;
        const lon = coordinates.lon + lonOffset;
        const windSpeed = Math.floor(Math.random() * 41) + 10;
        const windDirection = Math.floor(Math.random() * 361);
        const riskLevel = Math.min(100, Math.floor(windSpeed * 1.5 + Math.random() * 20));
        mockRiskZones.push({ lat, lon, riskLevel, windSpeed, windDirection });
      }
      mockRiskZones.sort((a, b) => b.riskLevel - a.riskLevel);
      setLightningRiskZones(mockRiskZones);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      if (mapType === 'api' && window.L && mapRef.current) {
        const mapElement = mapRef.current;
        if (mapElement) {
          mapElement.innerHTML = '';
          const options = {
            key: 'PsLAtXpsPTZexHuReqgMGHrPrDpNBHNc',
            lat: coordinates.lat,
            lon: coordinates.lon,
            zoom: 8,
          };
          if (typeof window.windyInit === 'function') {
            window.windyInit(options, (windyAPI: any) => {
              const { map } = windyAPI;
              if (selectedRegion) {
                window.L.circle([selectedRegion.lat, selectedRegion.lon], {
                  radius: selectedRegion.radius * 111320,
                  color: 'blue',
                  fillColor: '#30f',
                  fillOpacity: 0.2
                }).addTo(map);
              }
              mockRiskZones.forEach(zone => {
                const color = zone.riskLevel > 70 ? 'red' :
                            zone.riskLevel > 40 ? 'orange' : 'yellow';
                const arrow = window.L.polyline(
                  [
                    [zone.lat, zone.lon],
                    [
                      zone.lat + 0.2 * Math.cos((zone.windDirection - 90) * Math.PI / 180),
                      zone.lon + 0.2 * Math.sin((zone.windDirection - 90) * Math.PI / 180)
                    ]
                  ],
                  {color, weight: 2}
                ).addTo(map);
                window.L.polylineDecorator(arrow, {
                  patterns: [
                    {
                      offset: '100%',
                      repeat: 0,
                      symbol: window.L.Symbol.arrowHead({
                        pixelSize: 10,
                        polygon: false,
                        pathOptions: {color, weight: 2}
                      })
                    }
                  ]
                }).addTo(map);
                window.L.circle([zone.lat, zone.lon], {
                  radius: 5000,
                  color,
                  fillColor: color,
                  fillOpacity: 0.2
                }).addTo(map)
                .bindPopup(`
                  <strong>Lightning Risk Zone</strong><br>
                  Risk Level: ${zone.riskLevel}%<br>
                  Wind Speed: ${zone.windSpeed} knots<br>
                  Wind Direction: ${zone.windDirection}°
                `);
              });
              window.L.marker([coordinates.lat, coordinates.lon])
                .addTo(map)
                .bindPopup(`Location: ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`);
            });
          } else {
            console.error('Windy API not properly loaded');
          }
        }
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (mapType === 'api' && mapRef.current) {
        const canvases = mapRef.current.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const loseContext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
            loseContext?.loseContext();
          }
        });
      }
    };
  }, [mapType]);

  const exportMapImage = async () => {
    if (!mapContainerRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = mapContainerRef.current.offsetWidth;
      canvas.height = mapContainerRef.current.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        html2canvas(mapContainerRef.current).then(renderedCanvas => {
          ctx.drawImage(renderedCanvas, 0, 0);
          downloadCanvas(canvas, 'basic-screenshot');
        });
      }
    } catch (basicError) {
      console.error('All export methods failed:', basicError);
      alert('Export failed. Please try in Chrome or Edge browser.');
    }
  };

  const downloadCanvas = (canvas: HTMLCanvasElement, prefix: string) => {
    const link = document.createElement('a');
    link.download = `${prefix}-${coordinates.lat.toFixed(2)}-${coordinates.lon.toFixed(2)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadImage = (dataUrl: string, prefix: string) => {
    const link = document.createElement('a');
    link.download = `${prefix}-${coordinates.lat.toFixed(2)}-${coordinates.lon.toFixed(2)}.png`;
    link.href = dataUrl;
    link.click();
  };

  const selectRegion = () => {
    const radiusInput = prompt('Enter region radius in degrees (0.1-5):', '1');
    if (radiusInput === null) {
      return;
    }
    const radius = parseFloat(radiusInput || '1');
    if (isNaN(radius)) {
      setAnalysisError('Please enter a valid number for radius.');
      return;
    }
    if (radius < 0.1 || radius > 5) {
      setAnalysisError('Radius must be between 0.1 and 5 degrees.');
      return;
    }
    setSelectedRegion({
      lat: coordinates.lat,
      lon: coordinates.lon,
      radius
    });
    setAnalysisError(null);
  };

  useEffect(() => {
    if (mapType === 'api' && mapRef.current) {
      const mapElement = mapRef.current;
      if (mapElement) {
        mapElement.innerHTML = '';
      }
      const script = document.createElement('script');
      script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      script.async = true;
      const decoratorScript = document.createElement('script');
      decoratorScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-polylinedecorator/1.6.0/leaflet.polylineDecorator.min.js';
      decoratorScript.async = true;
      script.onload = () => {
        if (window.windyInit) {
          const options = {
            key: 'PsLAtXpsPTZexHuReqgMGHrPrDpNBHNc',
            lat: coordinates.lat,
            lon: coordinates.lon,
            zoom: 8,
          };
          window.windyInit(options, (windyAPI:any) => {
            const { map } = windyAPI;
            if (window.L) {
              window.L.marker([coordinates.lat, coordinates.lon])
                .addTo(map)
                .bindPopup(`Location: ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`);
              if (analysisComplete && lightningRiskZones.length > 0) {
                lightningRiskZones.forEach(zone => {
                  const color = zone.riskLevel > 70 ? 'red' :
                                zone.riskLevel > 40 ? 'orange' : 'yellow';
                  const arrow = window.L.polyline(
                    [
                      [zone.lat, zone.lon],
                      [
                        zone.lat + 0.2 * Math.cos((zone.windDirection - 90) * Math.PI / 180),
                        zone.lon + 0.2 * Math.sin((zone.windDirection - 90) * Math.PI / 180)
                      ]
                    ],
                    {color, weight: 2}
                  ).addTo(map);
                  window.L.polylineDecorator(arrow, {
                    patterns: [
                      {
                        offset: '100%',
                        repeat: 0,
                        symbol: window.L.Symbol.arrowHead({
                          pixelSize: 10,
                          polygon: false,
                          pathOptions: {color, weight: 2}
                        })
                      }
                    ]
                  }).addTo(map);
                  window.L.circle([zone.lat, zone.lon], {
                    radius: 5000,
                    color,
                    fillColor: color,
                    fillOpacity: 0.2
                  }).addTo(map)
                  .bindPopup(`
                    <strong>Lightning Risk Zone</strong><br>
                    Risk Level: ${zone.riskLevel}%<br>
                    Wind Speed: ${zone.windSpeed} knots<br>
                    Wind Direction: ${zone.windDirection}°
                  `);
                });
              }
            }
          });
        }
      };
      document.head.appendChild(script);
      document.head.appendChild(decoratorScript);
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        if (document.head.contains(decoratorScript)) {
          document.head.removeChild(decoratorScript);
        }
      };
    }
  }, [mapType, coordinates, analysisComplete, lightningRiskZones]);

  const handleCoordinateChange = (field: any) => (e: any) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      setCoordinates(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const presetLocations = [
    { name: 'Kigali, Rwanda', lat: -1.9441, lon: 30.0619 },
    { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
    { name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
    { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777 },
    { name: 'Lagos, Nigeria', lat: 6.5244, lon: 3.3792 }
  ];

  return (
    <div className="min-h-screen bg-cover bg-center" style={{
      backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(79, 70, 229, 0.7)), url(/bg-img.png)'
    }}>
      {authModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              {authModal === 'signin' ? 'Sign In' : 'Sign Up'}
            </h2>
            {authError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {authError}
              </div>
            )}
            <form onSubmit={authModal === 'signin' ? handleSignIn : handleSignUp}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setAuthModal(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-500 transition-all"
                >
                  {authModal === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gradient">DataSpark</h1>
          <div className="flex gap-4 items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile" className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">
                  {user.email?.charAt(0).toUpperCase()}
                </Link>
                <button
                  onClick={handleNotificationsNavigation}
                  className="cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-700 hover:to-indigo-500 transition-all"
                >
                  Notifications
                </button>
                <button
                  onClick={handleSignOut}
                  className="cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-700 hover:to-indigo-500 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthModal('signin')}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-700 hover:to-indigo-500 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal('signup')}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-300 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-600 hover:to-indigo-400 transition-all"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
        <div className="bg-transprent backdrop-blur-sm bg-opacity-90 rounded-xl p-6 shadow-xl">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Map Implementation:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="iframe"
                  checked={mapType === 'iframe'}
                  onChange={(e) => setMapType(e.target.value)}
                  className="mr-2 text-gray-400"
                />
                Iframe (Recommended)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="api"
                  checked={mapType === 'api'}
                  onChange={(e) => setMapType(e.target.value)}
                  className="mr-2 text-gray-400"
                />
                Windy API
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude:
              </label>
              <input
                type="number"
                value={coordinates.lat}
                onChange={handleCoordinateChange('lat')}
                step="0.0001"
                min="-90"
                max="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude:
              </label>
              <input
                type="number"
                value={coordinates.lon}
                onChange={handleCoordinateChange('lon')}
                step="0.0001"
                min="-180"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="bg-gray-100 p-3 rounded-md mb-4">
            <p className="text-sm text-gray-600">
              Current Location: <strong>{coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}</strong>
            </p>
          </div>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Lightning Risk Analysis</h3>
            {analysisError && (
              <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {analysisError}
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={selectRegion}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isAnalyzing}
              >
                {selectedRegion ? `Radius Selected (${selectedRegion.radius}°)` : 'Select Radius'}
              </button>
              <button
                onClick={analyzeWindForLightning}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                disabled={isAnalyzing || !selectedRegion}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Lightning Risk'}
              </button>
            </div>
            {analysisComplete && lightningRiskZones.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-blue-700 mb-2">Analysis Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {lightningRiskZones.slice(0, 3).map((zone, index) => (
                    <div key={index} className="bg-white p-3 rounded shadow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Zone {index + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          zone.riskLevel > 70 ? 'bg-red-100 text-red-800' :
                          zone.riskLevel > 40 ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          Risk: {zone.riskLevel}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Location: {zone.lat.toFixed(4)}, {zone.lon.toFixed(4)}</p>
                        <p>Wind: {zone.windSpeed} knots from {zone.windDirection}°</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            ref={mapContainerRef}
            className="border border-gray-300 rounded-lg overflow-hidden shadow-lg"
          >
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
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">How to use:</h3>
            <ul className="text-indigo-700 text-sm space-y-1">
              <li>• Use the iframe method for most reliable results</li>
              <li>• Enter custom coordinates or select from preset locations</li>
              <li>• Select a region and analyze for lightning risk based on wind patterns</li>
              <li>• Export the map with lightning risk zones when analysis is complete</li>
              <li>• The map shows wind patterns, weather data, and forecasts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
