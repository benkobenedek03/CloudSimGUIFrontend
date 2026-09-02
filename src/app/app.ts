import { Component, signal } from '@angular/core';
import { Nav } from "../components/nav/nav";
import { SimpleRequest } from '../components/simple-request/simple-request';

@Component({
  selector: 'app-root',
  imports: [Nav,SimpleRequest],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  
}
