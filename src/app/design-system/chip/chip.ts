import { Component, input, ViewEncapsulation } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.html',
  styleUrl: './chip.scss',
  imports: [MatChipsModule],
  encapsulation: ViewEncapsulation.None, // To allow global styles to affect chip
})
export class Chip {
  label = input<string>('');
  cssClass = input<string>('');
}
