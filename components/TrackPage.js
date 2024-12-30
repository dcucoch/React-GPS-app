// pages/track.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

export default function TrackPage() {
  const [device, setDevice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch device data from the backend
    const fetchDeviceData = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
          throw new Error('API URL not configured');
        }
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}`);
        if (!response.data || !response.data.length) {
          throw new Error('No device data received');
        }
        setDevice(response.data[0]); // Assuming we're using the first device
      } catch (error) {
        console.error('Error fetching device data:', error);
        setError(error.message);
      }
    };

    fetchDeviceData();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h2>Error loading device data</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!device) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Loading device data...</h2>
        <p>Please wait while we fetch the latest information.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Tracking Device</h1>
      <MapComponent device={device} />
    </div>
  );
}
