import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nav',
  imports: [FormsModule,RouterLink],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  
}
