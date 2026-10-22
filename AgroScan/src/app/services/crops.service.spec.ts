import { TestBed } from '@angular/core/testing';
import { CropsService } from './crops.service';

describe('CropsService', () => {
  it('selects a known crop and clears an unknown selection without inventing a crop', () => {
    const service = TestBed.inject(CropsService);
    service.selectCrop('tomate');
    expect(service.selectedCrop()?.name).toBe('Tomate');
    service.selectCrop('missing-crop');
    expect(service.selectedCrop()).toBeNull();
  });

  it('retains selection independently of the shared search', () => {
    const service = TestBed.inject(CropsService);
    service.selectCrop('maiz');
    service.search.set('aguacate');
    expect(service.selectedCrop()?.id).toBe('maiz');
    expect(service.search()).toBe('aguacate');
  });
});
