import { Component, signal } from '@angular/core';
import { ViewTypes } from '../Models/view-types';
import { RouterOutlet } from "@angular/router";
import { Nav } from "../components/nav/nav";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  viewtype:ViewTypes=ViewTypes.simple
  ViewTypes=ViewTypes

  ChangeView(view:ViewTypes){
    this.viewtype=view
  }

  SwitchToResults(){
    this.ChangeView(ViewTypes.result)
  }

  theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark' | null) ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  constructor() {
    document.documentElement.setAttribute('data-theme', this.theme());
  }

  toggleTheme() {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
    document.documentElement.setAttribute('data-theme', this.theme());
    localStorage.setItem('theme', this.theme());
  }

}
