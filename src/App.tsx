import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GPXParser from 'gpxparser';
import chroma from 'chroma-js';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Point {
  lat: number;
  lng: number;
  time: string;
}

interface Track {
  points: Point[];
  color: string;
  startDate: string;
  filename: string;
  currentPosition?: Point;
  duration?: number; // Duration in milliseconds
}

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [timeProgress, setTimeProgress] = useState(0); // 0 to 1 representing progress

  const maxDuration = tracks.length > 0 
    ? Math.max(...tracks.map(track => track.duration!))
    : 0;

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
            lng: point.lon,
            time: new Date(point.time).toISOString()
          }));
          
          const startDate = gpx.tracks[0].points[0]?.time 
            ? new Date(gpx.tracks[0].points[0].time).toLocaleDateString()
            : 'Unknown date';

          // Calculate duration if we have timestamps
          let duration: number | undefined;
          const firstPointTime = points[0].time;
          const lastPointTime = points[points.length - 1].time;
          if (firstPointTime && lastPointTime) {
            const startTime = new Date(firstPointTime).getTime();
            const endTime = new Date(lastPointTime).getTime();
            duration = endTime - startTime;
          }
          
          setTracks(prevTracks => {
            const hue = (prevTracks.length * 137.5) % 360;
            const newColor = chroma.hsl(hue, 0.7, 0.5).hex();
            
            return [...prevTracks, {
              points,
              color: newColor,
              startDate,
              filename: file.name,
              currentPosition: points[0],
              duration
            }];
          });
        }
      };
      reader.readAsText(file);
    });
  };

  // Update marker positions based on time progress
  useEffect(() => {
    if (tracks.length === 0) return;

    // Calculate the target elapsed time based on the maximum duration
    const targetElapsedTime = timeProgress * maxDuration;

    setTracks(prevTracks => 
      prevTracks.map(track => {
        const trackStartTime = new Date(track.points[0].time).getTime();
        const targetTime = trackStartTime + targetElapsedTime;

        // Find the point closest to the target time
        let closestPoint = track.points[0];
        let minTimeDiff = Infinity;

        for (const point of track.points) {
          const pointTime = new Date(point.time).getTime();
          const timeDiff = Math.abs(pointTime - targetTime);
          
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestPoint = point;
          }
        }

        return {
          ...track,
          currentPosition: closestPoint
        };
      })
    );
  }, [timeProgress, tracks, maxDuration]);

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
        {tracks.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={timeProgress}
              onChange={(e) => setTimeProgress(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span>0:00</span>
              <span>{formatTime(timeProgress * maxDuration)}</span>
              <span>{formatTime(maxDuration)}</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {tracks.map((track, index) => (
            <React.Fragment key={index}>
              <Polyline
                positions={track.points}
                pathOptions={{ 
                  color: track.color,
                  weight: 3,
                  opacity: 0.7,
                  fillOpacity: 0.7
                }}
              />
              {track.currentPosition && (
                <Marker
                  position={[track.currentPosition.lat, track.currentPosition.lng]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                      background-color: ${track.color};
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      border: 2px solid white;
                      box-shadow: 0 0 4px rgba(0,0,0,0.3);
                    "></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                  })}
                />
              )}
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App; 