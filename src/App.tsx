import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GPXParser from 'gpxparser';

interface Point {
  lat: number;
  lng: number;
}

function App() {
  const [trackPoints, setTrackPoints] = useState<Point[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const gpxContent = e.target?.result as string;
      const gpx = new GPXParser();
      gpx.parse(gpxContent);

      if (gpx.tracks.length > 0) {
        const points = gpx.tracks[0].points.map(point => ({
          lat: point.lat,
          lng: point.lon
        }));
        setTrackPoints(points);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
        <input
          type="file"
          accept=".gpx"
          onChange={handleFileUpload}
          style={{ padding: '10px' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {trackPoints.length > 0 && (
            <Polyline
              positions={trackPoints}
              pathOptions={{ color: 'red', weight: 3 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default App; 