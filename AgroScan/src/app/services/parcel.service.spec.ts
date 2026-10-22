import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PARCEL_STORAGE, PARCEL_STORAGE_KEY, ParcelService } from './parcel.service';
import { Parcel } from '../models/parcel';

const parcel: Parcel = {
  id: 'parcel-1',
  name: 'El Molino',
  cropId: 'maiz',
  color: '#3e6b43',
  areaM2: 10000,
  updatedAt: '2026-10-19T12:00:00Z',
  points: [
    { lat: 20, lng: -103 },
    { lat: 20, lng: -102.99 },
    { lat: 20.01, lng: -102.99 },
  ],
};
describe('ParcelService persistence', () => {
  let values: Map<string, string>;
  let storage: Storage;
  beforeEach(() => {
    values = new Map();
    storage = {
      getItem: vi.fn((key) => values.get(key) ?? null),
      setItem: vi.fn((key, value) => values.set(key, value)),
      removeItem: vi.fn((key) => values.delete(key)),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    TestBed.configureTestingModule({ providers: [{ provide: PARCEL_STORAGE, useValue: storage }] });
  });
  it('creates, updates, reloads and removes parcels without duplicate records', () => {
    const service = TestBed.inject(ParcelService);
    expect(service.save(parcel)).toBe(true);
    expect(service.save({ ...parcel, name: 'El Molino Norte' })).toBe(true);
    service.reload();
    expect(service.parcels()).toHaveLength(1);
    expect(service.parcels()[0].name).toBe('El Molino Norte');
    expect(service.remove(parcel.id)).toBe(true);
    service.reload();
    expect(service.parcels()).toEqual([]);
  });
  it('does not claim successful persistence when the storage quota is exceeded', () => {
    const service = TestBed.inject(ParcelService);
    service.save(parcel);
    vi.mocked(storage.setItem).mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    expect(service.save({ ...parcel, name: 'Unsaved edit' })).toBe(false);
    expect(service.parcels()[0].name).toBe('El Molino');
    expect(service.error()).toContain('lleno o bloqueado');
  });
  it('preserves corrupt data and blocks overwrites until explicit reset', () => {
    values.set(PARCEL_STORAGE_KEY, 'unreadable data');
    const service = TestBed.inject(ParcelService);
    expect(service.corrupt()).toBe(true);
    expect(service.save(parcel)).toBe(false);
    expect(values.get(PARCEL_STORAGE_KEY)).toBe('unreadable data');
    expect(service.reset()).toBe(true);
    expect(service.save(parcel)).toBe(true);
  });
  it('rejects malformed stored boundaries and invalid surface values', () => {
    values.set(PARCEL_STORAGE_KEY, JSON.stringify([{ ...parcel, points: [null] }]));
    const service = TestBed.inject(ParcelService);
    expect(service.corrupt()).toBe(true);
    service.reset();
    expect(service.save({ ...parcel, areaM2: NaN })).toBe(false);
    expect(service.save({ ...parcel, points: parcel.points.slice(0, 2) })).toBe(false);
  });
  it('clones saved input so later draft edits cannot mutate stored parcels', () => {
    const draft = structuredClone(parcel);
    const service = TestBed.inject(ParcelService);
    service.save(draft);
    draft.points[0].lat = 0;
    expect(service.parcels()[0].points[0].lat).toBe(20);
  });
  it('reports disabled browser storage', () => {
    TestBed.overrideProvider(PARCEL_STORAGE, { useValue: null });
    const service = TestBed.inject(ParcelService);
    expect(service.save(parcel)).toBe(false);
    expect(service.parcels()).toEqual([]);
    expect(service.error()).toContain('deshabilitado');
  });
});
