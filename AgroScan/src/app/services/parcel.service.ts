import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { Parcel } from '../models/parcel';
import { polygonError } from '../utils/polygon';

export const PARCEL_STORAGE_KEY = 'agroscan.parcels.v1';
export const PARCEL_STORAGE = new InjectionToken<Storage | null>('Parcel storage', {
  providedIn: 'root',
  factory: () => {
    try {
      return localStorage;
    } catch {
      return null;
    }
  },
});

function validParcel(value: unknown): value is Parcel {
  if (!value || typeof value !== 'object') return false;
  const parcel = value as Parcel;
  return (
    typeof parcel.id === 'string' &&
    !!parcel.id &&
    typeof parcel.name === 'string' &&
    !!parcel.name.trim() &&
    parcel.name.length <= 80 &&
    typeof parcel.cropId === 'string' &&
    !!parcel.cropId &&
    typeof parcel.color === 'string' &&
    /^#[\da-f]{6}$/i.test(parcel.color) &&
    Array.isArray(parcel.points) &&
    parcel.points.every((p) => !!p && typeof p === 'object') &&
    polygonError(parcel.points) === null &&
    Number.isFinite(parcel.areaM2) &&
    parcel.areaM2 > 0 &&
    typeof parcel.updatedAt === 'string' &&
    Number.isFinite(Date.parse(parcel.updatedAt))
  );
}

@Injectable({ providedIn: 'root' })
export class ParcelService {
  private readonly storage = inject(PARCEL_STORAGE);
  private readonly stored = signal<Parcel[]>([]);
  readonly parcels = this.stored.asReadonly();
  readonly error = signal('');
  readonly corrupt = signal(false);

  constructor() {
    this.reload();
  }

  reload(): void {
    if (!this.storage) {
      this.error.set(
        'Este navegador no permite guardar parcelas. Revisa la configuración de almacenamiento.',
      );
      return;
    }
    try {
      const raw = this.storage.getItem(PARCEL_STORAGE_KEY);
      if (raw === null) {
        this.stored.set([]);
        this.error.set('');
        this.corrupt.set(false);
        return;
      }
      const data: unknown = JSON.parse(raw);
      if (
        !Array.isArray(data) ||
        !data.every(validParcel) ||
        new Set(data.map((p) => p.id)).size !== data.length
      )
        throw new Error('invalid');
      this.stored.set(data);
      this.error.set('');
      this.corrupt.set(false);
    } catch {
      this.corrupt.set(true);
      this.error.set(
        'No pudimos leer las parcelas guardadas. Los datos originales se conservan; restablece el almacenamiento solo si ya no los necesitas.',
      );
    }
  }

  save(parcel: Parcel): boolean {
    if (!validParcel(parcel)) {
      this.error.set('La parcela contiene datos inválidos y no se ha guardado.');
      return false;
    }
    const list = this.stored();
    return this.persist(
      list.some((p) => p.id === parcel.id)
        ? list.map((p) => (p.id === parcel.id ? structuredClone(parcel) : p))
        : [...list, structuredClone(parcel)],
    );
  }

  remove(id: string): boolean {
    return this.persist(this.stored().filter((parcel) => parcel.id !== id));
  }

  reset(): boolean {
    if (!this.storage) return false;
    try {
      this.storage.removeItem(PARCEL_STORAGE_KEY);
      this.stored.set([]);
      this.corrupt.set(false);
      this.error.set('');
      return true;
    } catch {
      this.error.set('El navegador no permitió restablecer el almacenamiento.');
      return false;
    }
  }

  private persist(parcels: Parcel[]): boolean {
    if (this.corrupt()) return false;
    if (!this.storage) {
      this.error.set('El almacenamiento está deshabilitado. La parcela sigue abierta sin guardar.');
      return false;
    }
    try {
      this.storage.setItem(PARCEL_STORAGE_KEY, JSON.stringify(parcels));
      this.stored.set(parcels);
      this.error.set('');
      return true;
    } catch {
      this.error.set(
        'No se pudo guardar: el almacenamiento está lleno o bloqueado. Tus cambios siguen abiertos; libera espacio o permite el almacenamiento.',
      );
      return false;
    }
  }
}
