import { Component } from '@angular/core';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-hero',
  imports: [IconComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {}
