import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CropCategory } from '../models/crop';
import { CropsService, normalizeCropSearch } from '../services/crops.service';
import { IconComponent } from '../shared/icon.component';
import { useCropImageFallback } from '../shared/crop-image';

@Component({
  selector: 'app-crop-library',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './crop-library.component.html',
  styleUrl: './crop-library.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropLibraryComponent {
  readonly cropsService = inject(CropsService);
  readonly categories: readonly ('Todos' | CropCategory)[] = [
    'Todos',
    'Cereales',
    'Hortalizas',
    'Leguminosas',
    'Frutales',
  ];
  readonly category = signal<'Todos' | CropCategory>('Todos');
  readonly expandedCrop = signal<string | null>(null);
  readonly filteredCrops = computed(() => {
    const query = normalizeCropSearch(this.cropsService.search());
    return this.cropsService.crops.filter(
      (crop) =>
        (this.category() === 'Todos' || crop.category === this.category()) &&
        normalizeCropSearch(
          `${crop.name} ${crop.scientificName} ${crop.category} ${crop.description}`,
        ).includes(query),
    );
  });

  setSearch(event: Event): void {
    this.cropsService.search.set((event.target as HTMLInputElement).value);
  }

  resetFilters(): void {
    this.cropsService.search.set('');
    this.category.set('Todos');
  }

  toggleDetails(id: string): void {
    this.expandedCrop.update((current) => (current === id ? null : id));
  }

  readonly imageFallback = useCropImageFallback;
}
