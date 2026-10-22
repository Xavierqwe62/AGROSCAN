import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    [attr.width]="size()"
    [attr.height]="size()"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="paths[name()] || paths['leaf']" />
  </svg>`,
  styles: ':host { display: inline-flex; flex: 0 0 auto; vertical-align: middle; }',
})
export class IconComponent {
  readonly name = input('leaf');
  readonly size = input(20);
  readonly paths: Record<string, string> = {
    leaf: 'M20 3C9 2 3 6 4 13c1 5 7 7 11 3 3-3 4-8 5-13ZM3 21 14 10M8 16v-5m0 5h5',
    sprout: 'M12 21v-9M12 15C4 15 3 10 3 6c6 0 9 3 9 9Zm0-3c0-6 3-9 9-9 0 6-3 9-9 9Z',
    map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
    book: 'M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15',
    'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
    'arrow-up-right': 'M6 18 18 6M6 6h12v12',
    search: 'M21 21 16 16M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    'chevron-down': 'm6 9 6 6 6-6',
    'chevron-right': 'm9 6 6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    close: 'm6 6 12 12M6 18 18 6',
    menu: 'M4 6h16M4 12h16M4 18h16',
    location:
      'M12 2v3m0 14v3M2 12h3m14 0h3M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
    polygon: 'M6 4h12v4H6V4ZM4 6v12m16-12v12M6 20h12M2 18h4v4H2v-4Zm16 0h4v4h-4v-4Z',
    undo: 'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    edit: 'm16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5',
    save: 'M4 3h13l4 4v14H3V3h1Zm3 0v6h9V3M7 21v-8h10v8',
    check: 'm5 12 4 4L19 6',
    info: 'M12 8h.01M11 12h1v5M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    warning: 'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
    loader: 'M21 12a9 9 0 1 1-9-9',
    sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
    drop: 'M12 2S4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13Z',
    soil: 'M3 7h18M3 12h18M3 17h18M6 7v2m6 3v2m6 3v2',
    flask: 'M9 3h6M10 3v7L4 20c0 1 1 1 2 1h12c1 0 2 0 2-1l-6-10V3M7 15h10',
    home: 'm3 10 9-8 9 8v11H3V10Zm6 11v-8h6v8',
    globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
  };
}
