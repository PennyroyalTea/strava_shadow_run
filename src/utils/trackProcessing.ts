import { Point } from '../types';

export function smoothTrack(points: Point[], windowSize: number = 5): Point[] {
  if (points.length <= windowSize) return points;

  const smoothed: Point[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(points.length - 1, i + halfWindow);
    const window = points.slice(start, end + 1);

    // Calculate weighted average based on time difference
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    for (const point of window) {
      const timeDiff = Math.abs(
        new Date(point.time).getTime() - new Date(points[i].time).getTime()
      );
      const weight = 1 / (1 + timeDiff / 1000); // Weight decreases with time difference
      totalWeight += weight;
      weightedLat += point.lat * weight;
      weightedLng += point.lng * weight;
    }

    smoothed.push({
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
      time: points[i].time // Keep original time
    });
  }

  return smoothed;
} 