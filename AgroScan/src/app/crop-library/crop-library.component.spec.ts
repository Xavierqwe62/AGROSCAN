import { TestBed } from '@angular/core/testing';
import { CropLibraryComponent } from './crop-library.component';
import { CropsService } from '../services/crops.service';

describe('Crop library interaction', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [CropLibraryComponent] }));

  it('reacts to search changes from another component and matches accents and casing', async () => {
    const fixture = TestBed.createComponent(CropLibraryComponent);
    const service = TestBed.inject(CropsService);
    service.search.set('  MAIZ  ');
    await fixture.whenStable();

    expect(fixture.componentInstance.filteredCrops().map((crop) => crop.id)).toEqual(['maiz']);
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    expect(input.value).toBe('  MAIZ  ');
    expect(fixture.nativeElement.querySelectorAll('.crop-card')).toHaveLength(1);

    input.value = 'fresa';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(service.search()).toBe('fresa');
    expect(fixture.componentInstance.filteredCrops().map((crop) => crop.id)).toEqual(['fresa']);
  });

  it('combines category and search filters, then recovers from an empty result', async () => {
    const fixture = TestBed.createComponent(CropLibraryComponent);
    const component = fixture.componentInstance;
    component.category.set('Cereales');
    component.cropsService.search.set('tomate');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.crop-card')).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.empty-state')).not.toBeNull();
    const reset = fixture.nativeElement.querySelector('.empty-state button') as HTMLButtonElement;
    reset.click();
    await fixture.whenStable();
    expect(component.cropsService.search()).toBe('');
    expect(component.category()).toBe('Todos');
    expect(fixture.nativeElement.querySelectorAll('.crop-card')).toHaveLength(10);
  });

  it('publishes selection for the map and exposes an actual map anchor', async () => {
    const fixture = TestBed.createComponent(CropLibraryComponent);
    await fixture.whenStable();
    const selection = fixture.nativeElement.querySelector('.select-crop') as HTMLAnchorElement;
    selection.click();
    await fixture.whenStable();

    expect(selection.getAttribute('href')).toBe('#mapa');
    expect(TestBed.inject(CropsService).selectedCrop()?.id).toBe('maiz');
    expect(fixture.nativeElement.querySelector('.crop-card.is-selected h3')?.textContent).toBe(
      'Maíz',
    );
  });

  it('keeps expanded details and accessible toggle state synchronized', async () => {
    const fixture = TestBed.createComponent(CropLibraryComponent);
    await fixture.whenStable();
    const toggle = fixture.nativeElement.querySelector('.details-toggle') as HTMLButtonElement;
    const details = fixture.nativeElement.querySelector('#crop-details-maiz') as HTMLElement;

    expect(details.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    await fixture.whenStable();
    expect(details.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(details.id);
    toggle.click();
    await fixture.whenStable();
    expect(details.hidden).toBe(true);
  });

  it('uses the bundled fallback only once when a crop image cannot load', async () => {
    const fixture = TestBed.createComponent(CropLibraryComponent);
    await fixture.whenStable();
    const image = fixture.nativeElement.querySelector('.crop-image img') as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    expect(image.getAttribute('src')).toBe('assets/crops/fallback.webp');
    expect(image.alt).toContain('respaldo');
    image.dispatchEvent(new Event('error'));
    expect(image.style.visibility).toBe('hidden');
  });
});
