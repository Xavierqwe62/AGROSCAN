import { Injectable, signal } from '@angular/core';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

export interface MapsLibraries {
  maps: google.maps.MapsLibrary;
  geometry: google.maps.GeometryLibrary;
  geocoding: google.maps.GeocodingLibrary;
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly error = signal('');
  private loading?: Promise<MapsLibraries>;
  private configured = false;

  load(): Promise<MapsLibraries> {
    if (this.loading) return this.loading;
    this.status.set('loading');
    this.error.set('');
    this.loading = this.initialize()
      .then((libraries) => {
        if (this.status() === 'error') throw new Error(this.error());
        this.status.set('ready');
        return libraries;
      })
      .catch((error) => {
        this.status.set('error');
        this.error.set(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar Google Maps. Revisa tu conexión.',
        );
        this.loading = undefined;
        throw error;
      });
    return this.loading;
  }

  private async initialize(): Promise<MapsLibraries> {
    const controller = new AbortController();
    const configTimer = setTimeout(() => controller.abort(), 8000);
    let key: string;
    try {
      const response = await fetch(new URL('config.json', document.baseURI), {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('config');
      const config = await response.json();
      key = typeof config.googleMapsApiKey === 'string' ? config.googleMapsApiKey.trim() : '';
      if (!key || key.includes('YOUR_') || key.includes('TU_CLAVE')) throw new Error('config');
    } catch {
      throw new Error(
        'Google Maps aún no está configurado. Consulta al administrador para activar el mapa.',
      );
    } finally {
      clearTimeout(configTimer);
    }

    let rejectAuth!: (reason: Error) => void;
    const authFailure = new Promise<never>((_, reject) => {
      rejectAuth = reject;
    });
    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      const message =
        'Google Maps rechazó la conexión. Consulta al administrador y recarga la página cuando se haya corregido la configuración.';
      this.status.set('error');
      this.error.set(message);
      rejectAuth(new Error(message));
    };
    if (!this.configured) {
      setOptions({ key, v: 'weekly', language: 'es', region: 'MX' });
      this.configured = true;
    }
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              'Google Maps tardó demasiado en responder. Revisa tu conexión y vuelve a intentarlo.',
            ),
          ),
        20000,
      );
    });
    try {
      return await Promise.race([
        Promise.all([
          importLibrary('maps'),
          importLibrary('geometry'),
          importLibrary('geocoding'),
        ]).then(([maps, geometry, geocoding]) => ({ maps, geometry, geocoding }) as MapsLibraries),
        timeout,
        authFailure,
      ]);
    } catch (error) {
      if (error instanceof Error && /Google Maps/.test(error.message)) throw error;
      throw new Error(
        'No se pudo conectar con Google Maps. Revisa tu conexión y los permisos de la clave.',
      );
    } finally {
      clearTimeout(timer!);
    }
  }
}
