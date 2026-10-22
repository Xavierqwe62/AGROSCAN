import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CropsService } from '../services/crops.service';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-header',
  imports: [FormsModule, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  readonly crops = inject(CropsService);
  readonly menuOpen = signal(false);
  readonly activeSection = signal('inicio');
  readonly preview = signal<string | null>(null);
  readonly links = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: 'home',
      text: 'Conoce AgroScan y empieza a planear tu próximo cultivo.',
    },
    {
      id: 'mapa',
      label: 'Mapa de parcelas',
      icon: 'map',
      text: 'Delimita tus parcelas, calcula superficies y administra tus cultivos mediante Google Maps.',
    },
    {
      id: 'cultivos',
      label: 'Biblioteca de cultivos',
      icon: 'sprout',
      text: 'Explora los cultivos disponibles, sus características y recomendaciones agrícolas.',
    },
  ];
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) this.activeSection.set(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: 0 },
    );
    queueMicrotask(() =>
      this.links.forEach((link) => {
        const section = document.getElementById(link.id);
        if (section) this.observer?.observe(section);
      }),
    );
  }
  navigate(id: string): void {
    this.activeSection.set(id);
    this.menuOpen.set(false);
    this.preview.set(null);
  }
  showPreview(id: string): void {
    if (
      window.innerWidth > 860 &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      this.preview.set(id);
    }
  }
  search(): void {
    this.navigate('cultivos');
    document.getElementById('cultivos')?.scrollIntoView({ behavior: 'smooth' });
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
