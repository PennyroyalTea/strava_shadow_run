import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GPXParser from 'gpxparser';
import chroma from 'chroma-js';
import L from 'leaflet';
import { Track } from './types';
import { smoothTrack } from './utils/trackProcessing';
import { SettingsModal } from './components/SettingsModal';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [timeProgress, setTimeProgress] = useState(0);
  const [isSmoothingEnabled, setIsSmoothingEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [trackOpacity, setTrackOpacity] = useState(0.2);
  const animationRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reapply smoothing when the setting changes
  useEffect(() => {
    setTracks(prevTracks => 
      prevTracks.map(track => ({
        ...track,
        points: isSmoothingEnabled ? smoothTrack(track.rawPoints) : track.rawPoints,
        currentPosition: isSmoothingEnabled ? smoothTrack(track.rawPoints)[0] : track.rawPoints[0]
      }))
    );
  }, [isSmoothingEnabled]);

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
          const rawPoints = gpx.tracks[0].points.map(point => ({
            lat: point.lat,
            lng: point.lon,
            time: new Date(point.time).toISOString()
          }));

          // Apply smoothing only if enabled
          const points = isSmoothingEnabled ? smoothTrack(rawPoints) : rawPoints;
          
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
            
            const newTracks = [...prevTracks, {
              points,
              rawPoints,
              color: newColor,
              startDate,
              filename: file.name,
              currentPosition: points[0],
              duration
            }];

            // Sort tracks by date
            return newTracks.sort((a, b) => {
              const dateA = new Date(a.startDate).getTime();
              const dateB = new Date(b.startDate).getTime();
              return dateA - dateB;
            });
          });
        }
      };
      reader.readAsText(file);
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Animation effect
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const startTime = Date.now();
    const duration = 10000; // 10 seconds for full animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      setTimeProgress(progress);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

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
      <div style={{ flex: 1, position: 'relative' }}>
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
                  opacity: trackOpacity,
                  fillOpacity: trackOpacity
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
                  })}
                />
              )}
            </React.Fragment>
          ))}
        </MapContainer>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => setIsSettingsOpen(true)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '8px 16px',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Settings
        </button>
        {tracks.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            width: '80%',
            maxWidth: '600px',
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isPlaying ? '#ff4444' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={timeProgress}
                onChange={(e) => setTimeProgress(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span>0:00</span>
              <span>{formatTime(timeProgress * maxDuration)}</span>
              <span>{formatTime(maxDuration)}</span>
            </div>
          </div>
        )}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Tracks</h3>
          {tracks.length === 0 ? (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#666',
              backgroundColor: '#f8f8f8',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              No tracks added yet
            </div>
          ) : (
            tracks.map((track, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '5px',
                padding: '5px',
                backgroundColor: '#f8f8f8',
                borderRadius: '4px',
              }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: track.color,
                  marginRight: '10px',
                  borderRadius: '2px'
                }} />
                <span style={{ flex: 1, fontSize: '14px' }}>{track.startDate}</span>
                <button
                  onClick={() => setTracks(prevTracks => prevTracks.filter((_, i) => i !== index))}
                  style={{
                    padding: '2px 6px',
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
            ))
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#f0f0f0',
              border: '2px dashed #ccc',
              borderRadius: '4px',
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              fontSize: '14px',
              marginTop: '5px'
            }}
            title="Add more tracks"
          >
            <span style={{ fontSize: '18px' }}>+</span> Add tracks
          </button>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isSmoothingEnabled={isSmoothingEnabled}
        onSmoothingChange={setIsSmoothingEnabled}
        trackOpacity={trackOpacity}
        onTrackOpacityChange={setTrackOpacity}
      />
    </div>
  );
}

export default App; 