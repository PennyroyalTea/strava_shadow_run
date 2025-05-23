import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GPXParser from 'gpxparser';

interface Point {
  lat: number;
  lng: number;
}

interface Track {
  points: Point[];
  color: string;
  startDate: string;
  filename: string;
}

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);

  // Generate a random color in hex format
  const generateColor = () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
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
          
          // Get the start date from the first point
          const startDate = gpx.tracks[0].points[0]?.time 
            ? new Date(gpx.tracks[0].points[0].time).toLocaleDateString()
            : 'Unknown date';
          
          setTracks(prevTracks => [...prevTracks, {
            points,
            color: generateColor(),
            startDate,
            filename: file.name
          }]);
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
        <input
          type="file"
          accept=".gpx"
          multiple
          onChange={handleFileUpload}
          style={{ padding: '10px' }}
        />
        <div style={{ marginTop: '10px' }}>
          {tracks.map((track, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '5px',
              padding: '5px',
              backgroundColor: '#fff',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: track.color,
                marginRight: '10px',
                border: '1px solid #ccc'
              }} />
              <span style={{ flex: 1 }}>{track.filename} - {track.startDate}</span>
              <button
                onClick={() => setTracks(prevTracks => prevTracks.filter((_, i) => i !== index))}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Delete track"
              >
                ×
              </button>
            </div>
          ))}
        </div>
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
          {tracks.map((track, index) => (
            <Polyline
              key={index}
              positions={track.points}
              pathOptions={{ color: track.color, weight: 3 }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App; 