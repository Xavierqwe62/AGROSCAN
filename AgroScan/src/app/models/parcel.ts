export interface ParcelPoint {
  lat: number;
  lng: number;
}

export interface Parcel {
  id: string;
  name: string;
  cropId: string;
  color: string;
  points: ParcelPoint[];
  areaM2: number;
  updatedAt: string;
}

export const PARCEL_COLORS = ['#56834b', '#be8745', '#548ca6', '#a86f83', '#8b7bb3', '#4f9990'];
