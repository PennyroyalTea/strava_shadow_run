import React from 'react';

interface TrackUploadModalProps {
  onFileUpload: (file: File) => void;
}

export function TrackUploadModal({ onFileUpload }: TrackUploadModalProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        onFileUpload(file);
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        minWidth: '400px',
        textAlign: 'center',
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>Upload Your Tracks</h2>
        <p style={{ margin: '0 0 20px 0', color: '#666' }}>
          Upload .GPX files of your runs to compare them. They can be exported from{' '}
          <a 
            href="https://support.strava.com/hc/en-us/articles/216918437-Exporting-your-Data-and-Bulk-Export#h_01GDP2JB35R4ECM0E6YAH316B9"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2196F3', textDecoration: 'none' }}
          >
            Strava web app
          </a>
          {' '}and other sources.
        </p>
        <div style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          cursor: 'pointer',
        }}>
          <input
            type="file"
            accept=".gpx"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              display: 'block',
              cursor: 'pointer',
              color: '#2196F3',
              fontWeight: 'bold',
            }}
          >
            Manual upload .gpx
          </label>
        </div>
      </div>
    </div>
  );
} 