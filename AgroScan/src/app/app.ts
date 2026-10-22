import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { HeroComponent } from './hero/hero.component';
import { MapsComponent } from './maps/maps.component';
import { CropLibraryComponent } from './crop-library/crop-library.component';
import { IconComponent } from './shared/icon.component';

@Component({
  imports: [HeaderComponent, HeroComponent, MapsComponent, CropLibraryComponent, IconComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
