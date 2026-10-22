export type CropCategory = 'Cereales' | 'Hortalizas' | 'Leguminosas' | 'Frutales';

export interface CropSource {
  label: string;
  url: string;
}

/** Agronomic reference information, never live measurements from a parcel. */
export interface Crop {
  id: string;
  name: string;
  scientificName: string;
  category: CropCategory;
  description: string;
  soil: string;
  temperature: string;
  /** Qualitative soil moisture guidance; not relative air humidity. */
  humidity: string;
  ph: string;
  /** Soil saturated-paste extract salinity threshold (ECe), where available. */
  ec: string;
  irrigation: string;
  stages: string[];
  image: string;
  sources: CropSource[];
}
