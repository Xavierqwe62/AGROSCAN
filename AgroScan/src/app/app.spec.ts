import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { GoogleMapsLoaderService } from './services/google-maps-loader.service';
import { CropsService } from './services/crops.service';
import { signal } from '@angular/core';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: GoogleMapsLoaderService,
          useValue: {
            status: signal('error'),
            error: signal('Mapa sin configurar'),
            load: () => Promise.reject(new Error('Mapa sin configurar')),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Gestión inteligente');
    expect(compiled.querySelectorAll('.crop-card')).toHaveLength(10);
    expect(compiled.querySelector('.map-empty')?.textContent).toContain('Mapa sin configurar');
  });

  it('shares the header search with the library and crop selection with the parcel panel', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const search = root.querySelector<HTMLInputElement>('#header-crop-search')!;
    search.value = 'maiz';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(root.querySelectorAll('.crop-card')).toHaveLength(1);
    expect(root.querySelector('.crop-card h3')?.textContent).toBe('Maíz');
    TestBed.inject(CropsService).selectCrop('maiz');
    await fixture.whenStable();
    expect(root.querySelector('.associated-crop strong')?.textContent).toBe('Maíz');
  });
});
