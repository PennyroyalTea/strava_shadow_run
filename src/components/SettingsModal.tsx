import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSmoothingEnabled: boolean;
  onSmoothingChange: (enabled: boolean) => void;
  trackOpacity: number;
  onTrackOpacityChange: (opacity: number) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  isSmoothingEnabled, 
  onSmoothingChange,
  trackOpacity,
  onTrackOpacityChange 
}: SettingsModalProps) {
  if (!isOpen) return null;

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
        padding: '20px',
        borderRadius: '8px',
        minWidth: '300px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isSmoothingEnabled}
                onChange={(e) => onSmoothingChange(e.target.checked)}
              />
              Smooth tracks
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label>Track Transparency</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={trackOpacity}
              onChange={(e) => onTrackOpacityChange(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
              <span>More Transparent</span>
              <span>More Opaque</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 