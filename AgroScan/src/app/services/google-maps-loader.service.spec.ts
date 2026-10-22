import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

const api = vi.hoisted(() => ({ setOptions: vi.fn(), importLibrary: vi.fn() }));
vi.mock('@googlemaps/js-api-loader', () => api);
describe('Google Maps loader', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    api.setOptions.mockReset();
    api.importLibrary.mockReset().mockImplementation((name: string) => Promise.resolve({ name }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ googleMapsApiKey: 'test-browser-key' }),
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete (window as any).gm_authFailure;
  });
  it('loads only the supported libraries once for concurrent callers', async () => {
    const loader = TestBed.inject(GoogleMapsLoaderService);
    const one = loader.load(),
      two = loader.load();
    expect(one).toBe(two);
    await one;
    expect(api.setOptions).toHaveBeenCalledWith({
      key: 'test-browser-key',
      v: 'weekly',
      language: 'es',
      region: 'MX',
    });
    expect(api.importLibrary.mock.calls.map((call) => call[0])).toEqual([
      'maps',
      'geometry',
      'geocoding',
    ]);
    expect(loader.status()).toBe('ready');
  });
  it('shows missing configuration without making Google API calls and allows retry', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const loader = TestBed.inject(GoogleMapsLoaderService);
    await expect(loader.load()).rejects.toThrow('aún no está configurado');
    expect(api.importLibrary).not.toHaveBeenCalled();
    expect(loader.status()).toBe('error');
    await loader.load();
    expect(loader.status()).toBe('ready');
  });
  it('rejects empty and malformed configuration', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ googleMapsApiKey: '' }),
    } as Response);
    await expect(TestBed.inject(GoogleMapsLoaderService).load()).rejects.toThrow('configurado');
    expect(api.setOptions).not.toHaveBeenCalled();
  });
  it('surfaces library network failure', async () => {
    api.importLibrary.mockRejectedValue(new Error('Network failed'));
    const loader = TestBed.inject(GoogleMapsLoaderService);
    await expect(loader.load()).rejects.toThrow('conectar');
    expect(loader.status()).toBe('error');
  });
  it('handles late authorization failure after libraries have loaded', async () => {
    const loader = TestBed.inject(GoogleMapsLoaderService);
    await loader.load();
    (window as any).gm_authFailure();
    await Promise.resolve();
    expect(loader.status()).toBe('error');
    expect(loader.error()).toContain('rechazó');
  });
  it('stops waiting when the Maps library never resolves', async () => {
    vi.useFakeTimers();
    api.importLibrary.mockReturnValue(new Promise(() => {}));
    const loader = TestBed.inject(GoogleMapsLoaderService);
    const rejection = expect(loader.load()).rejects.toThrow('demasiado');
    await vi.advanceTimersByTimeAsync(20001);
    await rejection;
    expect(loader.status()).toBe('error');
  });
});
