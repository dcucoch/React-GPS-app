import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icon configuration
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Add global styles for Leaflet map
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .leaflet-container {
      width: 100%;
      height: 100%;
      z-index: 1;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      border-radius: 8px !important;
      overflow: hidden;
    }
    .leaflet-control-zoom a {
      background-color: rgba(255,255,255,0.95) !important;
      color: #2c3e50 !important;
      border: none !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 20px !important;
      transition: all 0.2s ease !important;
    }
    .leaflet-control-zoom a:hover {
      background-color: #f8f9fa !important;
      color: #1a202c !important;
      transform: translateY(-1px);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
      border: 1px solid rgba(0,0,0,0.05);
      backdrop-filter: blur(8px);
      background: rgba(255,255,255,0.98) !important;
    }
    .leaflet-popup-content {
      margin: 16px 20px !important;
      line-height: 1.6 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #2c3e50;
    }
    .leaflet-popup-tip {
      box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
      background: rgba(255,255,255,0.98) !important;
    }
    .leaflet-popup-close-button {
      padding: 8px !important;
      color: #64748b !important;
      transition: all 0.2s ease !important;
    }
    .leaflet-popup-close-button:hover {
      color: #1e293b !important;
      transform: scale(1.1);
    }
    .leaflet-bar {
      border: none !important;
    }
    .leaflet-control-attribution {
      background: rgba(255,255,255,0.9) !important;
      backdrop-filter: blur(4px);
      padding: 4px 8px !important;
      border-radius: 6px !important;
      margin: 8px !important;
      font-size: 11px !important;
      color: #64748b !important;
    }
    .leaflet-control-attribution a {
      color: #3b82f6 !important;
      text-decoration: none !important;
      transition: color 0.2s ease !important;
    }
    .leaflet-control-attribution a:hover {
      color: #2563eb !important;
    }
  `;
  document.head.appendChild(style);
}

export default function MapComponent() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef(null);
  const watchIdRef = useRef(null);
  const [error, setError] = useState(null);
  const locationPollingRef = useRef(null);

  const handleLogoClick = () => {
    setTapCount(prev => prev + 1);
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);

    if (tapCount === 4) {
      setShowLogin(true);
      setTapCount(0);
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      if (password.trim() === process.env.NEXT_PUBLIC_PASSWORD?.trim()) {
        setShowLogin(false);
        setIsTracking(true);
        startTracking();
      }
    } catch (error) {
      console.error('Error validating password:', error);
      setError('Error validating password');
    }
  };

  const updateServerLocation = async (lat, lng, isTracking = true) => {
    try {
      await fetch('/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lat, 
          lng,
          isTracking
        })
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          latitude,
          longitude, 
          accuracy,
          timestamp: new Date().toLocaleTimeString()
        };
        setDeviceLocation(locationData);
        await updateServerLocation(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.error('Initial position error:', error);
        setError('Error getting location: ' + error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          const locationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toLocaleTimeString()
          };
          setDeviceLocation(locationData);
          await updateServerLocation(latitude, longitude);
          setLoading(false);
          setError(null);
        } catch (error) {
          console.error('Error processing location data:', error);
          setError('Error processing location data');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Error tracking location: ' + error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const fetchLocation = async () => {
    try {
      const response = await fetch('/get-location');
      if (!response.ok) {
        console.warn('Location data not available');
        setDeviceLocation(null);
        return;
      }
      const data = await response.json();
      
      if (data.isTracking === false) {
        setIsTracking(false);
        setDeviceLocation(null);
        if (marker) marker.remove();
        if (circle) circle.remove();
        return;
      }

      if (!data || !data.lat || !data.lng) {
        setDeviceLocation(null);
        return;
      }

      setDeviceLocation({
        latitude: data.lat,
        longitude: data.lng,
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
        accuracy: 100
      });
    } catch (error) {
      console.error('Error fetching location:', error);
      setDeviceLocation(null);
    }
  };

  useEffect(() => {
    if (!isTracking) {
      fetchLocation();
      locationPollingRef.current = setInterval(fetchLocation, 5000);
    }

    return () => {
      if (locationPollingRef.current) {
        clearInterval(locationPollingRef.current);
      }
    };
  }, [isTracking]);

  useEffect(() => {
    let newMap;
    if (mapRef.current && !mapRef.current._leaflet_id) {
      try {
        newMap = L.map(mapRef.current, {
          zoomControl: true,
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true
        }).setView([0, 0], 13);
        setMap(newMap);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 3,
          tileSize: 256
        }).addTo(newMap);
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Error initializing map');
      }
    }

    if (newMap && deviceLocation) {
      if (marker) marker.remove();
      if (circle) circle.remove();

      const newMarker = L.marker([deviceLocation.latitude, deviceLocation.longitude], { 
        icon: customIcon,
        title: 'Vehicle Location',
        riseOnHover: true
      }).addTo(newMap);
      
      const newCircle = L.circle([deviceLocation.latitude, deviceLocation.longitude], {
        radius: deviceLocation.accuracy || 100,
        color: '#ff4444',
        fillColor: '#ff4444',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(newMap);

      newMarker.bindPopup(
        `<div style="font-size: 16px;"><b>Vehicle Location</b><br>Latitude: ${deviceLocation.latitude.toFixed(6)}<br>Longitude: ${deviceLocation.longitude.toFixed(6)}<br>Accuracy: ${deviceLocation.accuracy?.toFixed(0) || 100} meters<br>Last update: ${deviceLocation.timestamp}</div>`,
        {
          closeButton: true,
          autoClose: false,
          closeOnClick: false
        }
      ).openPopup();

      newMap.setView([deviceLocation.latitude, deviceLocation.longitude], 15, {
        animate: true,
        duration: 1
      });

      setMarker(newMarker);
      setCircle(newCircle);
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      if (locationPollingRef.current) {
        clearInterval(locationPollingRef.current);
      }
      if (newMap) {
        newMap.remove();
      }
    };
  }, [deviceLocation]);

  return (
    <div style={{
      maxWidth: '900px',
      width: '95%',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderRadius: '16px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
      borderTop: '6px solid #ff4444',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backdropFilter: 'blur(12px)',
      transition: 'all 0.3s ease'
    }}>
      {showLogin && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255,255,255,0.98)',
          padding: '2.5rem',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          zIndex: 2000,
          width: '90%',
          maxWidth: '420px',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: '20px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                outline: 'none',
                ':focus': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)'
                }
              }}
            />
            <button type="submit" style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: '#ff2222',
                transform: 'translateY(-1px)'
              },
              ':active': {
                transform: 'translateY(0)'
              }
            }}>
              Submit
            </button>
          </form>
        </div>
      )}
      <img 
        src="/images/logo.png"
        alt="Logo"
        onClick={handleLogoClick}
        style={{
          width: '100%',
          marginBottom: '1.5rem',
          backgroundColor: 'white',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'transform 0.2s ease',
          ':hover': {
            transform: 'scale(1.02)'
          }
        }}
      />
      <h1 style={{
        textAlign: 'center',
        color: '#1a202c',
        fontSize: '28px',
        marginBottom: '2rem',
        fontWeight: '600',
        letterSpacing: '-0.02em'
      }}>
        Vehicle Tracking
      </h1>
      {!isTracking && (
        <button
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: '500',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
            ':hover': {
              backgroundColor: '#2563eb',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(59, 130, 246, 0.3)'
            },
            ':active': {
              transform: 'translateY(0)'
            }
          }}
        >
          Refresh vehicle location
        </button>
      )}
      {isTracking && (
        <button
          onClick={async () => {
            if (watchIdRef.current) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            await updateServerLocation(0, 0, false);
            setIsTracking(false);
            setDeviceLocation(null);
            if (marker) marker.remove();
            if (circle) circle.remove();
          }}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: '500',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(255, 68, 68, 0.2)',
            ':hover': {
              backgroundColor: '#ff2222',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(255, 68, 68, 0.3)'
            },
            ':active': {
              transform: 'translateY(0)'
            }
          }}
        >
          Stop Tracking
        </button>
      )}
      <div style={{
        width: '100%',
        height: '65vh',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}>
        {!deviceLocation ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            padding: '2.5rem',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '90%',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(12px)'
          }}>
            <h3 style={{ 
              color: '#1a202c', 
              marginBottom: '1rem', 
              fontSize: '22px',
              fontWeight: '600'
            }}>
              Vehicle not active
            </h3>
            <p style={{ 
              fontSize: '16px', 
              color: '#4a5568',
              lineHeight: '1.6'
            }}>
              Please wait until the vehicle starts its route.
            </p>
          </div>
        ) : loading ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            padding: '2rem',
            borderRadius: '16px',
            zIndex: 1000,
            fontSize: '18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(12px)',
            color: '#4a5568'
          }}>
            Loading location...
          </div>
        ) : error ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            padding: '2rem',
            borderRadius: '16px',
            zIndex: 1000,
            fontSize: '18px',
            color: '#ff4444',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(12px)'
          }}>
            {error}
          </div>
        ) : null}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}
