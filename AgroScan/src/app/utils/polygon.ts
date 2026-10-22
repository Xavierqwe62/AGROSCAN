import { ParcelPoint } from '../models/parcel';

const EPSILON = 1e-16;

export function validCoordinate(point: ParcelPoint): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -85 &&
    point.lat <= 85 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

/** Unwrap longitudes around the first point so parcels can cross the date line. */
function projected(points: readonly ParcelPoint[]): ParcelPoint[] {
  if (!points.length) return [];
  const origin = points[0].lng;
  return points.map((point) => ({
    lat: Math.log(Math.tan(Math.PI / 4 + (point.lat * Math.PI) / 360)),
    lng: ((origin + ((point.lng - origin + 540) % 360) - 180) * Math.PI) / 180,
  }));
}

function cross(a: ParcelPoint, b: ParcelPoint, c: ParcelPoint): number {
  return (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
}

function onSegment(a: ParcelPoint, b: ParcelPoint, p: ParcelPoint): boolean {
  return (
    Math.abs(cross(a, b, p)) < EPSILON &&
    p.lng >= Math.min(a.lng, b.lng) - EPSILON &&
    p.lng <= Math.max(a.lng, b.lng) + EPSILON &&
    p.lat >= Math.min(a.lat, b.lat) - EPSILON &&
    p.lat <= Math.max(a.lat, b.lat) + EPSILON
  );
}

function intersects(a: ParcelPoint, b: ParcelPoint, c: ParcelPoint, d: ParcelPoint): boolean {
  const abC = cross(a, b, c),
    abD = cross(a, b, d),
    cdA = cross(c, d, a),
    cdB = cross(c, d, b);
  return (
    (((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) &&
      ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON))) ||
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
}

/** Validate the straight map edges used by Polygon's default geodesic:false. */
export function polygonError(points: readonly ParcelPoint[], complete = true): string | null {
  if (points.some((point) => !validCoordinate(point)))
    return 'Usa latitudes entre −85 y 85 y longitudes entre −180 y 180.';
  if (points.length > 1000) return 'La parcela admite hasta 1,000 puntos.';
  const flat = projected(points);
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (
        Math.abs(flat[i].lat - flat[j].lat) < EPSILON &&
        Math.abs(flat[i].lng - flat[j].lng) < EPSILON
      )
        return 'Dos puntos no pueden ocupar la misma posición.';
    }
  }
  if (complete && points.length < 3)
    return 'Coloca al menos tres puntos para delimitar la parcela.';
  if (flat.length < 3) return null;
  for (let i = 0; i < flat.length; i++) {
    const next = (i + 1) % flat.length;
    for (let j = i + 1; j < flat.length; j++) {
      const end = (j + 1) % flat.length;
      if (next === j || end === i) continue;
      if (intersects(flat[i], flat[next], flat[j], flat[end]))
        return 'Los límites se cruzan. Ajusta el punto para formar un polígono simple.';
    }
    const previous = (i + flat.length - 1) % flat.length;
    if (
      onSegment(flat[previous], flat[i], flat[next]) ||
      onSegment(flat[i], flat[next], flat[previous])
    )
      return 'Hay un límite superpuesto. Ajusta o elimina el punto intermedio.';
  }
  let twiceArea = 0;
  const origin = flat[0];
  for (let i = 1; i < flat.length - 1; i++) twiceArea += cross(origin, flat[i], flat[i + 1]);
  if (Math.abs(twiceArea) < EPSILON)
    return 'Los puntos deben encerrar una superficie; no pueden estar alineados.';
  return null;
}

export function parseCoordinates(value: string): ParcelPoint | null {
  const match = value
    .trim()
    .match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*[,;]\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))$/);
  if (!match) return null;
  const point = { lat: Number(match[1]), lng: Number(match[2]) };
  return validCoordinate(point) ? point : null;
}
