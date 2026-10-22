import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CropsService } from '../services/crops.service';
import { GoogleMapsLoaderService, MapsLibraries } from '../services/google-maps-loader.service';
import { ParcelService } from '../services/parcel.service';
import { PARCEL_COLORS, Parcel, ParcelPoint } from '../models/parcel';
import { parseCoordinates, polygonError } from '../utils/polygon';
import { IconComponent } from '../shared/icon.component';
import { useCropImageFallback } from '../shared/crop-image';

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [DecimalPipe, FormsModule, IconComponent],
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsComponent implements AfterViewInit, OnDestroy {
  readonly imageFallback = useCropImageFallback;
  readonly crops = inject(CropsService);
  readonly parcels = inject(ParcelService);
  readonly loader = inject(GoogleMapsLoaderService);
  @ViewChild('mapCanvas', { static: true }) mapCanvas!: ElementRef<HTMLDivElement>;
  readonly points = signal<ParcelPoint[]>([]);
  readonly mode = signal<'idle' | 'draw' | 'review'>('idle');
  readonly selectedId = signal<string | null>(null);
  readonly selectedVertex = signal<number | null>(null);
  readonly name = signal('');
  readonly cropId = signal('');
  readonly color = signal(PARCEL_COLORS[0]);
  readonly colors = PARCEL_COLORS;
  readonly area = signal(0);
  readonly dirty = signal(false);
  readonly notice = signal('');
  readonly error = signal('');
  readonly searching = signal(false);
  readonly locating = signal(false);
  readonly satellite = signal(true);
  readonly additionCount = signal(0);
  private readonly mapAvailable = signal(false);
  readonly ready = computed(() => this.mapAvailable() && this.loader.status() === 'ready');
  readonly canFinish = computed(
    () => this.points().length >= 3 && polygonError(this.points()) === null && this.area() > 0,
  );
  readonly selectedCrop = computed(() => this.crops.crops.find((c) => c.id === this.cropId()));
  readonly totalArea = computed(() =>
    this.parcels.parcels().reduce((area, parcel) => area + parcel.areaM2, 0),
  );
  search = '';
  newLatitude = '';
  newLongitude = '';
  private map?: google.maps.Map;
  private libraries?: MapsLibraries;
  private draftPolygon?: google.maps.Polygon;
  private savedPolygons: google.maps.Polygon[] = [];
  private listeners: google.maps.MapsEventListener[] = [];
  private pathListeners: google.maps.MapsEventListener[] = [];
  private additions: number[] = [];
  private destroyed = false;
  private searchGeneration = 0;

  constructor() {
    effect(() => {
      const selected = this.crops.selectedCrop();
      if (selected && selected.id !== this.cropId()) {
        this.cropId.set(selected.id);
        if (this.points().length) this.dirty.set(true);
      }
    });
    effect(() => {
      const list = this.parcels.parcels();
      const selected = this.selectedId();
      if (this.mapAvailable()) this.renderSaved(list, selected);
    });
  }

  ngAfterViewInit(): void {
    void this.initGoogleMap();
  }

  async initGoogleMap(): Promise<void> {
    if (this.loader.status() === 'loading') return;
    try {
      const libraries = await this.loader.load();
      if (this.destroyed) return;
      this.libraries = libraries;
      if (!this.map) {
        this.map = new libraries.maps.Map(this.mapCanvas.nativeElement, {
          center: { lat: 20.6597, lng: -103.3496 },
          zoom: 7,
          mapTypeId: 'satellite',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
          clickableIcons: false,
          keyboardShortcuts: true,
        });
        this.draftPolygon = new libraries.maps.Polygon({
          map: this.map,
          paths: [],
          strokeWeight: 3,
          fillOpacity: 0.24,
          strokeColor: this.color(),
          fillColor: this.color(),
          editable: false,
          zIndex: 10,
        });
        this.listeners.push(
          this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && this.mode() === 'draw') this.addPoint(event.latLng.toJSON());
          }),
        );
        for (const event of ['click', 'contextmenu']) {
          this.listeners.push(
            this.draftPolygon.addListener(event, (event: google.maps.PolyMouseEvent) => {
              if (this.mode() !== 'draw') return;
              if (event.vertex !== undefined) {
                this.selectedVertex.set(event.vertex);
                event.stop();
              } else if (event.latLng && event.edge === undefined)
                this.addPoint(event.latLng.toJSON());
            }),
          );
        }
      }
      this.mapAvailable.set(true);
      this.syncPolygon();
      this.renderSaved(this.parcels.parcels(), this.selectedId());
      if (this.points().length) this.fitPoints(this.points());
    } catch {
      if (this.loader.status() !== 'error') {
        this.loader.error.set(
          'No pudimos iniciar el mapa. Recarga la página e inténtalo nuevamente.',
        );
        this.loader.status.set('error');
      }
    }
  }

  startGooglePolygon(): void {
    if (!this.ready() || !this.confirmDiscard()) return;
    this.clearDraft();
    this.mode.set('draw');
    this.cropId.set(this.crops.selectedCrop()?.id ?? '');
    this.color.set(this.colors[this.parcels.parcels().length % this.colors.length]);
    this.notice.set(
      'Haz clic alrededor de tu terreno. Puedes arrastrar los vértices para ajustar los límites.',
    );
    this.syncPolygon();
  }

  addPoint(point: ParcelPoint): void {
    if (this.mode() !== 'draw' || !this.ready()) return;
    const next = [...this.points(), point];
    if (!this.acceptPoints(next)) return;
    this.additions.push(next.length - 1);
    this.additionCount.set(this.additions.length);
    this.syncPolygon();
  }

  addCoordinate(): void {
    const point = parseCoordinates(`${this.newLatitude},${this.newLongitude}`);
    if (!point) {
      this.error.set('Escribe una latitud y una longitud válidas, usando punto decimal.');
      return;
    }
    const count = this.points().length;
    this.addPoint(point);
    if (this.points().length > count) {
      this.newLatitude = '';
      this.newLongitude = '';
      this.map?.panTo(point);
    }
  }

  updateVertex(index: number, lat: string, lng: string): void {
    if (this.mode() !== 'draw') return;
    const point = parseCoordinates(`${lat},${lng}`);
    if (!point) {
      this.error.set('Las coordenadas del punto no son válidas.');
      return;
    }
    const next = this.points().map((old, i) => (i === index ? point : old));
    if (this.acceptPoints(next)) this.syncPolygon();
  }

  selectVertex(index: number): void {
    this.selectedVertex.set(index);
    this.map?.panTo(this.points()[index]);
  }

  removeVertex(index: number | null = this.selectedVertex()): void {
    if (index === null || this.mode() !== 'draw') return;
    const next = this.points().filter((_, i) => i !== index);
    if (!this.acceptPoints(next)) return;
    this.forgetAddition(index);
    this.selectedVertex.set(null);
    this.syncPolygon();
  }

  undoPoint(): void {
    const index = this.additions.at(-1);
    if (index !== undefined) this.removeVertex(index);
  }

  finishPolygon(): void {
    const error = polygonError(this.points());
    if (error || !this.area()) {
      this.error.set(error ?? 'La parcela debe tener una superficie mayor que cero.');
      return;
    }
    this.mode.set('review');
    this.selectedVertex.set(null);
    this.syncPolygon();
    this.notice.set('Límites listos. Asigna un nombre y un cultivo para guardar tu parcela.');
  }

  editPolygon(): void {
    if (!this.ready()) return;
    this.mode.set('draw');
    this.syncPolygon();
    this.notice.set(
      'Edición activa. Arrastra un vértice, agrega puntos o selecciónalos para eliminarlos.',
    );
  }

  clearPolygon(): void {
    if (
      !window.confirm(
        '¿Borrar esta delimitación del editor? Los cambios sin guardar se perderán. Las parcelas guardadas se conservan.',
      )
    )
      return;
    this.clearDraft();
    this.notice.set('Delimitación borrada del editor.');
  }

  saveParcel(): void {
    const error = polygonError(this.points());
    if (!this.ready() || this.mode() !== 'review' || error) {
      this.error.set(error ?? 'Finaliza la delimitación antes de guardar.');
      return;
    }
    if (!this.name().trim()) {
      this.error.set('Dale un nombre a tu parcela.');
      return;
    }
    if (!this.selectedCrop()) {
      this.error.set('Selecciona el cultivo de esta parcela.');
      return;
    }
    const parcel: Parcel = {
      id: this.selectedId() ?? crypto.randomUUID(),
      name: this.name().trim(),
      cropId: this.cropId(),
      color: this.color(),
      points: this.points().map((point) => ({ ...point })),
      areaM2: this.computeHectares(this.points()) * 10000,
      updatedAt: new Date().toISOString(),
    };
    if (this.parcels.save(parcel)) {
      this.selectedId.set(parcel.id);
      this.name.set(parcel.name);
      this.dirty.set(false);
      this.error.set('');
      this.notice.set(`“${parcel.name}” se guardó en este navegador.`);
    }
  }

  selectParcel(parcel: Parcel): void {
    if (!this.confirmDiscard()) return;
    this.selectedId.set(parcel.id);
    this.points.set(parcel.points.map((point) => ({ ...point })));
    this.name.set(parcel.name);
    this.cropId.set(parcel.cropId);
    this.color.set(parcel.color);
    this.crops.selectCrop(parcel.cropId);
    this.area.set(parcel.areaM2);
    this.mode.set('review');
    this.dirty.set(false);
    this.error.set('');
    this.notice.set('Parcela guardada seleccionada. Puedes consultar sus límites o editarlos.');
    this.additions = [];
    this.additionCount.set(0);
    this.selectedVertex.set(null);
    this.syncPolygon();
    this.fitPoints(parcel.points);
  }

  deleteParcel(parcel: Parcel): void {
    if (
      !window.confirm(
        `¿Eliminar “${parcel.name}” de las parcelas guardadas? Esta acción no se puede deshacer.`,
      )
    )
      return;
    if (this.selectedId() === parcel.id && !this.confirmDiscard()) return;
    if (this.parcels.remove(parcel.id)) {
      if (this.selectedId() === parcel.id) this.clearDraft();
      this.notice.set(`“${parcel.name}” se eliminó.`);
    }
  }

  resetStorage(): void {
    if (
      window.confirm(
        '¿Eliminar los datos de parcelas ilegibles de este navegador? Esta acción no se puede deshacer.',
      )
    )
      this.parcels.reset();
  }

  updateName(value: string): void {
    this.name.set(value);
    this.dirty.set(true);
  }
  updateCrop(value: string): void {
    this.cropId.set(value);
    this.crops.selectCrop(value);
    this.dirty.set(true);
  }
  updateColor(value: string): void {
    this.color.set(value);
    this.dirty.set(true);
    this.syncPolygon();
  }
  cropName(id: string): string {
    return this.crops.crops.find((crop) => crop.id === id)?.name ?? 'Cultivo no disponible';
  }

  computeHectares(points: ParcelPoint[] = this.points()): number {
    if (points.length < 3 || !this.libraries) return 0;
    return this.libraries.geometry.spherical.computeArea(points) / 10000;
  }

  setMapType(satellite: boolean): void {
    this.satellite.set(satellite);
    this.map?.setMapTypeId(satellite ? 'satellite' : 'roadmap');
  }

  async searchLocation(): Promise<void> {
    if (!this.ready() || !this.search.trim() || this.searching()) return;
    this.error.set('');
    const query = this.search.trim();
    const point = parseCoordinates(query);
    if (point) {
      this.map?.setCenter(point);
      this.map?.setZoom(17);
      this.notice.set('Mapa centrado en las coordenadas indicadas.');
      return;
    }
    if (/^[\d\s.,;+\-]+$/.test(query)) {
      this.error.set('Usa el formato latitud, longitud; por ejemplo: 20.6597, -103.3496.');
      return;
    }
    this.searching.set(true);
    const generation = ++this.searchGeneration;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        new this.libraries!.geocoding.Geocoder().geocode({ address: query, region: 'mx' }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('TIMEOUT')), 12000);
        }),
      ]);
      if (this.destroyed || generation !== this.searchGeneration) return;
      const first = result.results[0];
      if (!first) {
        this.error.set('No encontramos esa ubicación. Prueba con municipio, estado o coordenadas.');
        return;
      }
      if (first.geometry.viewport) this.map?.fitBounds(first.geometry.viewport);
      else {
        this.map?.setCenter(first.geometry.location);
        this.map?.setZoom(16);
      }
      this.notice.set(`Ubicación: ${first.formatted_address}`);
    } catch (error) {
      const text = String(error);
      this.error.set(
        text.includes('ZERO_RESULTS')
          ? 'No encontramos esa ubicación. Prueba una dirección más completa o coordenadas.'
          : text.includes('REQUEST_DENIED')
            ? 'La búsqueda fue rechazada. Revisa que Geocoding API esté habilitada para esta clave.'
            : text.includes('OVER_QUERY_LIMIT')
              ? 'Se alcanzó el límite de búsquedas de Google Maps. Vuelve a intentarlo más tarde.'
              : 'No se pudo buscar la ubicación. Revisa tu conexión e inténtalo nuevamente.',
      );
    } finally {
      clearTimeout(timer);
      this.searching.set(false);
    }
  }

  locateUser(): void {
    if (!this.ready() || this.locating()) return;
    if (!navigator.geolocation) {
      this.error.set(
        'Este navegador no ofrece geolocalización. Puedes buscar una dirección o coordenadas.',
      );
      return;
    }
    this.locating.set(true);
    this.error.set('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (this.destroyed) return;
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        this.map?.setCenter(point);
        this.map?.setZoom(17);
        this.locating.set(false);
        this.notice.set(
          `Ubicación aproximada del dispositivo (precisión: ${Math.round(position.coords.accuracy)} m).`,
        );
      },
      (error) => {
        this.locating.set(false);
        this.error.set(
          error.code === 1
            ? 'Permiso de ubicación denegado. Puedes habilitarlo en tu navegador o buscar coordenadas.'
            : error.code === 3
              ? 'La ubicación tardó demasiado. Intenta de nuevo o busca una dirección.'
              : 'No se pudo obtener tu ubicación. Revisa el GPS o busca una dirección.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  preventUnsavedClose(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private confirmDiscard(): boolean {
    return (
      !this.dirty() || window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos y continuar?')
    );
  }

  private clearDraft(): void {
    this.points.set([]);
    this.selectedId.set(null);
    this.selectedVertex.set(null);
    this.name.set('');
    this.area.set(0);
    this.mode.set('idle');
    this.dirty.set(false);
    this.error.set('');
    this.additions = [];
    this.additionCount.set(0);
    this.syncPolygon();
  }

  private acceptPoints(points: ParcelPoint[]): boolean {
    const error = polygonError(points, false);
    if (error) {
      this.error.set(error);
      return false;
    }
    this.points.set(points);
    this.area.set(this.computeHectares(points) * 10000);
    this.dirty.set(true);
    this.error.set('');
    return true;
  }

  private forgetAddition(index: number): void {
    this.additions = this.additions.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
    this.additionCount.set(this.additions.length);
  }

  private syncPolygon(): void {
    if (!this.draftPolygon) return;
    this.pathListeners.forEach((listener) => listener.remove());
    this.pathListeners = [];
    this.draftPolygon.setOptions({
      paths: this.points(),
      editable: this.mode() === 'draw',
      strokeColor: this.color(),
      fillColor: this.color(),
      visible: this.mode() !== 'idle',
    });
    const path = this.draftPolygon.getPath();
    for (const event of ['set_at', 'insert_at', 'remove_at']) {
      this.pathListeners.push(
        path.addListener(event, (index: number) => {
          const next = path.getArray().map((point) => point.toJSON());
          if (!this.acceptPoints(next)) {
            this.syncPolygon();
            return;
          }
          if (event === 'insert_at') {
            this.additions = this.additions.map((i) => (i >= index ? i + 1 : i));
            this.additions.push(index);
            this.additionCount.set(this.additions.length);
          } else if (event === 'remove_at') this.forgetAddition(index);
        }),
      );
    }
  }

  private renderSaved(parcels: Parcel[], selectedId: string | null): void {
    if (!this.map || !this.libraries) return;
    this.savedPolygons.forEach((polygon) => {
      google.maps.event.clearInstanceListeners(polygon);
      polygon.setMap(null);
    });
    this.savedPolygons = parcels
      .filter((parcel) => parcel.id !== selectedId)
      .map((parcel) => {
        const polygon = new this.libraries!.maps.Polygon({
          map: this.map,
          paths: parcel.points,
          strokeColor: parcel.color,
          fillColor: parcel.color,
          strokeWeight: 2,
          fillOpacity: 0.22,
          zIndex: 1,
        });
        polygon.addListener('click', (event: google.maps.PolyMouseEvent) => {
          if (this.mode() === 'draw' && event.latLng) this.addPoint(event.latLng.toJSON());
          else this.selectParcel(parcel);
        });
        return polygon;
      });
  }

  private fitPoints(points: ParcelPoint[]): void {
    if (!this.map || !points.length || typeof google === 'undefined') return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    this.map.fitBounds(bounds, 65);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.searchGeneration++;
    [...this.listeners, ...this.pathListeners].forEach((listener) => listener.remove());
    this.draftPolygon?.setMap(null);
    this.savedPolygons.forEach((polygon) => {
      if (typeof google !== 'undefined') google.maps.event.clearInstanceListeners(polygon);
      polygon.setMap(null);
    });
  }
}
