export interface Point {
  lat: number;
  lng: number;
  time: string;
}

export interface Track {
  points: Point[];
  rawPoints: Point[];
  color: string;
  startDate: string;
  startTime: string;
  filename: string;
  name?: string;
  currentPosition?: Point;
  duration?: number;
} 