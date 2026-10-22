import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapsComponent } from './maps.component';
import { GoogleMapsLoaderService, MapsLibraries } from '../services/google-maps-loader.service';
import { PARCEL_STORAGE, ParcelService } from '../services/parcel.service';
import { CropsService } from '../services/crops.service';
import { ParcelPoint } from '../models/parcel';

class Events {
  callbacks = new Map<string, Set<(...args: any[]) => void>>();
  addListener(event: string, callback: (...args: any[]) => void) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, new Set());
    this.callbacks.get(event)!.add(callback);
    return { remove: () => this.callbacks.get(event)?.delete(callback) };
  }
  trigger(event: string, ...args: any[]) {
    [...(this.callbacks.get(event) ?? [])].forEach((cb) => cb(...args));
  }
}
class Path extends Events {
  constructor(public points: ParcelPoint[]) {
    super();
  }
  getArray() {
    return this.points.map((p) => ({ toJSON: () => ({ ...p }) }));
  }
  setAt(index: number, point: ParcelPoint) {
    this.points[index] = point;
    this.trigger('set_at', index);
  }
  insertAt(index: number, point: ParcelPoint) {
    this.points.splice(index, 0, point);
    this.trigger('insert_at', index);
  }
}
class FakeMap extends Events {
  static current: FakeMap;
  setCenter = vi.fn();
  setZoom = vi.fn();
  panTo = vi.fn();
  fitBounds = vi.fn();
  setMapTypeId = vi.fn();
  constructor() {
    super();
    FakeMap.current = this;
  }
}
class FakePolygon extends Events {
  static instances: FakePolygon[] = [];
  path = new Path([]);
  options: any = {};
  setMap = vi.fn();
  constructor(options: any) {
    super();
    this.setOptions(options);
    FakePolygon.instances.push(this);
  }
  setOptions(options: any) {
    this.options = { ...this.options, ...options };
    if (options.paths) this.path = new Path(options.paths.map((p: ParcelPoint) => ({ ...p })));
  }
  getPath() {
    return this.path;
  }
}
const square = [
  { lat: 20, lng: -103 },
  { lat: 20, lng: -102.99 },
  { lat: 20.01, lng: -102.99 },
  { lat: 20.01, lng: -103 },
];

describe('MapsComponent parcel workflow (Google API double)', () => {
  let fixture: ComponentFixture<MapsComponent>, component: MapsComponent;
  let computeArea: ReturnType<typeof vi.fn>, geocode: ReturnType<typeof vi.fn>;
  beforeEach(async () => {
    FakePolygon.instances = [];
    computeArea = vi.fn((points: ParcelPoint[]) => (points.length >= 3 ? 10000 : 0));
    geocode = vi.fn();
    vi.stubGlobal('google', {
      maps: {
        event: { clearInstanceListeners: vi.fn() },
        LatLngBounds: class {
          extend() {
            return this;
          }
        },
      },
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const libraries = {
      maps: { Map: FakeMap, Polygon: FakePolygon },
      geometry: { spherical: { computeArea } },
      geocoding: {
        Geocoder: class {
          geocode = geocode;
        },
      },
    } as unknown as MapsLibraries;
    const values = new Map<string, string>();
    await TestBed.configureTestingModule({
      imports: [MapsComponent],
      providers: [
        {
          provide: GoogleMapsLoaderService,
          useValue: {
            status: signal('ready'),
            error: signal(''),
            load: () => Promise.resolve(libraries),
          },
        },
        {
          provide: PARCEL_STORAGE,
          useValue: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MapsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });
  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function draw() {
    component.startGooglePolygon();
    square.forEach((point) => component.addPoint({ ...point }));
  }
  function save() {
    draw();
    component.updateName('Parcela Norte');
    component.updateCrop('maiz');
    component.finishPolygon();
    component.saveParcel();
  }

  it('collects real map click coordinates and calls the geometry library for area', () => {
    component.startGooglePolygon();
    square.forEach((point) =>
      FakeMap.current.trigger('click', { latLng: { toJSON: () => point } }),
    );
    expect(component.points()).toEqual(square);
    expect(computeArea).toHaveBeenLastCalledWith(square);
    expect(component.area()).toBe(10000);
    expect(component.computeHectares()).toBe(1);
  });
  it('supports deleting one selected vertex and undoing the latest addition', () => {
    draw();
    component.selectVertex(1);
    component.removeVertex();
    expect(component.points()).toEqual([square[0], square[2], square[3]]);
    component.undoPoint();
    expect(component.points()).toEqual([square[0], square[2]]);
    expect(component.canFinish()).toBe(false);
  });
  it('updates area on vertex drag and rejects a crossing edit without changing the boundary', () => {
    draw();
    const polygon = FakePolygon.instances[0];
    polygon.getPath().setAt(0, { lat: 19.99, lng: -103 });
    expect(component.points()[0].lat).toBe(19.99);
    const before = structuredClone(component.points());
    polygon.getPath().setAt(1, { lat: 20.02, lng: -102.995 });
    expect(component.points()).toEqual(before);
    expect(component.error()).toBeTruthy();
    expect(polygon.getPath().points).toEqual(before);
  });
  it('tracks midpoint insertions in undo history', () => {
    draw();
    const midpoint = { lat: 20, lng: -102.995 };
    FakePolygon.instances[0].getPath().insertAt(1, midpoint);
    expect(component.points()).toHaveLength(5);
    component.undoPoint();
    expect(component.points()).toEqual(square);
  });
  it('requires a name, crop and finished boundary before saving', () => {
    component.startGooglePolygon();
    component.addPoint(square[0]);
    component.finishPolygon();
    expect(component.mode()).toBe('draw');
    component.saveParcel();
    expect(component.parcels.parcels()).toHaveLength(0);
    square.slice(1).forEach((p) => component.addPoint(p));
    component.finishPolygon();
    component.saveParcel();
    expect(component.error()).toContain('nombre');
    component.updateName('Norte');
    component.saveParcel();
    expect(component.error()).toContain('cultivo');
  });
  it('saves, reopens and edits a parcel without creating a duplicate', async () => {
    save();
    expect(component.parcels.parcels()).toHaveLength(1);
    expect(component.dirty()).toBe(false);
    const original = component.parcels.parcels()[0];
    component.startGooglePolygon();
    component.selectParcel(original);
    await fixture.whenStable();
    expect(component.mode()).toBe('review');
    expect(component.dirty()).toBe(false);
    component.editPolygon();
    component.updateVertex(0, '19.99', '-103');
    component.finishPolygon();
    component.saveParcel();
    expect(component.parcels.parcels()).toHaveLength(1);
    expect(component.parcels.parcels()[0].points[0].lat).toBe(19.99);
    expect(original.points[0].lat).toBe(20);
  });
  it('retains unsaved work when clearing, deleting, or switching is cancelled', () => {
    save();
    component.editPolygon();
    component.updateName('Draft');
    vi.mocked(window.confirm).mockReturnValue(false);
    component.clearPolygon();
    expect(component.points()).toHaveLength(4);
    component.startGooglePolygon();
    expect(component.name()).toBe('Draft');
    component.deleteParcel(component.parcels.parcels()[0]);
    expect(component.parcels.parcels()).toHaveLength(1);
  });
  it('deletes a saved parcel only after confirmation', () => {
    save();
    component.deleteParcel(component.parcels.parcels()[0]);
    expect(window.confirm).toHaveBeenCalled();
    expect(component.parcels.parcels()).toHaveLength(0);
    expect(component.mode()).toBe('idle');
  });
  it('shares crop selection from the library and preserves it when opening a saved parcel', async () => {
    TestBed.inject(CropsService).selectCrop('tomate');
    await fixture.whenStable();
    expect(component.cropId()).toBe('tomate');
    save();
    TestBed.inject(CropsService).selectCrop('frijol');
    await fixture.whenStable();
    expect(component.dirty()).toBe(true);
    component.selectParcel(TestBed.inject(ParcelService).parcels()[0]);
    await fixture.whenStable();
    expect(component.cropId()).toBe('maiz');
    expect(component.dirty()).toBe(false);
  });
  it('centers coordinates without geocoding and supports map type changes', async () => {
    component.search = '20.6, -103.3';
    await component.searchLocation();
    expect(FakeMap.current.setCenter).toHaveBeenCalledWith({ lat: 20.6, lng: -103.3 });
    expect(geocode).not.toHaveBeenCalled();
    component.setMapType(false);
    expect(FakeMap.current.setMapTypeId).toHaveBeenCalledWith('roadmap');
  });
  it('surfaces failed geocoding and denied geolocation', async () => {
    geocode.mockRejectedValue(new Error('ZERO_RESULTS'));
    component.search = 'Unknown place';
    await component.searchLocation();
    expect(component.error()).toContain('No encontramos');
    expect(component.searching()).toBe(false);
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: (_success: any, error: any) => error({ code: 1 }) },
    });
    component.locateUser();
    expect(component.error()).toContain('denegado');
    expect(component.locating()).toBe(false);
  });
});
