import { describe, expect, it } from 'vitest';
import { parseCoordinates, polygonError } from './polygon';

const square = [
  { lat: 20, lng: -103 },
  { lat: 20, lng: -102.99 },
  { lat: 20.01, lng: -102.99 },
  { lat: 20.01, lng: -103 },
];
describe('Parcel boundary validation', () => {
  it('accepts a simple boundary and either winding order', () => {
    expect(polygonError(square)).toBeNull();
    expect(polygonError([...square].reverse())).toBeNull();
  });
  it('allows incomplete drafts but requires three points to finish', () => {
    expect(polygonError(square.slice(0, 2), false)).toBeNull();
    expect(polygonError(square.slice(0, 2))).toContain('tres');
  });
  it('rejects crossing edges, duplicate vertices, and collinear points', () => {
    expect(polygonError([square[0], square[2], square[1], square[3]])).toContain('cruzan');
    expect(polygonError([...square, square[0]])).toContain('misma posición');
    expect(
      polygonError([
        { lat: 20, lng: 1 },
        { lat: 20, lng: 2 },
        { lat: 20, lng: 3 },
      ]),
    ).not.toBeNull();
  });
  it('rejects a vertex touching an unrelated edge', () => {
    expect(
      polygonError([
        { lat: 0, lng: 0 },
        { lat: 0, lng: 2 },
        { lat: 2, lng: 2 },
        { lat: 0, lng: 1 },
        { lat: 2, lng: 0 },
      ]),
    ).not.toBeNull();
  });
  it('accepts a concave boundary', () => {
    expect(
      polygonError([
        { lat: 0, lng: 0 },
        { lat: 0, lng: 2 },
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
        { lat: 2, lng: 0 },
      ]),
    ).toBeNull();
  });
  it('unwraps a small parcel crossing the date line', () => {
    expect(
      polygonError([
        { lat: 20, lng: 179.99 },
        { lat: 20, lng: -179.99 },
        { lat: 20.01, lng: -179.99 },
        { lat: 20.01, lng: 179.99 },
      ]),
    ).toBeNull();
  });
  it('rejects nonfinite and out-of-bounds coordinates', () => {
    expect(polygonError([{ lat: NaN, lng: 2 }], false)).not.toBeNull();
    expect(polygonError([{ lat: 86, lng: 2 }], false)).not.toBeNull();
  });
  it('parses decimal coordinates without interpreting an address as coordinates', () => {
    expect(parseCoordinates('20.6597, -103.3496')).toEqual({ lat: 20.6597, lng: -103.3496 });
    expect(parseCoordinates('-20.5; 103.2')).toEqual({ lat: -20.5, lng: 103.2 });
    expect(parseCoordinates('91, 23')).toBeNull();
    expect(parseCoordinates('Guadalajara, Jalisco')).toBeNull();
    expect(parseCoordinates('20,5,-103,4')).toBeNull();
  });
});
